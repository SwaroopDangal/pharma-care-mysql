const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET all sales
router.get('/', async (req, res) => {
  try {
    const { start_date, end_date, status } = req.query;
    let query = `
      SELECT s.id, s.invoice_number, s.user_id, s.total_amount, s.discount,
             s.tax, s.payment_method, s.status, s.prescription_number,
             s.notes, s.created_at,
             u.name as staff_name,
             COUNT(si.id) as item_count
      FROM sales s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN sale_items si ON s.id = si.sale_id
      WHERE 1=1
    `;
    const params = [];

    if (start_date) { query += ` AND s.created_at >= ?`; params.push(start_date); }
    if (end_date) { query += ` AND s.created_at <= ?`; params.push(end_date); }
    if (status) { query += ` AND s.status = ?`; params.push(status); }

    query += ` GROUP BY s.id, s.invoice_number, s.user_id, s.total_amount, s.discount,
               s.tax, s.payment_method, s.status, s.prescription_number,
               s.notes, s.created_at, u.name
               ORDER BY s.created_at DESC`;
    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('GET /sales error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// GET single sale with items
router.get('/:id', async (req, res) => {
  try {
    const [saleRows] = await pool.query(
      `SELECT s.*, u.name as staff_name
       FROM sales s
       LEFT JOIN users u ON s.user_id = u.id
       WHERE s.id = ?`,
      [req.params.id]
    );
    if (!saleRows[0]) return res.status(404).json({ error: 'Sale not found' });

    const [items] = await pool.query(
      `SELECT si.*, m.name as medicine_name, m.dosage, m.unit
       FROM sale_items si
       LEFT JOIN medicines m ON si.medicine_id = m.id
       WHERE si.sale_id = ?`,
      [req.params.id]
    );

    res.json({ ...saleRows[0], items });
  } catch (err) {
    console.error('GET /sales/:id error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

// POST create sale
router.post('/', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    const {
      items, discount = 0, tax = 0,
      payment_method, prescription_number, notes
    } = req.body;

    if (!items || items.length === 0) {
      conn.release();
      return res.status(400).json({ error: 'No items in sale' });
    }

    // Generate invoice number
    const [countRows] = await conn.query('SELECT COUNT(*) AS count FROM sales');
    const invoiceNum = `INV-${String(Number(countRows[0].count) + 1).padStart(6, '0')}`;

    let subtotal = 0;
    for (const item of items) {
      subtotal += item.quantity * item.unit_price;
    }
    const totalAmount = subtotal - discount + tax;

    const saleId = crypto.randomUUID();
    await conn.query(
      `INSERT INTO sales (id, invoice_number, user_id, total_amount, discount, tax, payment_method, prescription_number, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [saleId, invoiceNum, req.user.id, totalAmount, discount, tax, payment_method || 'cash', prescription_number || null, notes || null]
    );

    for (const item of items) {
      const itemId = crypto.randomUUID();
      await conn.query(
        `INSERT INTO sale_items (id, sale_id, medicine_id, quantity, unit_price, total_price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [itemId, saleId, item.medicine_id, item.quantity, item.unit_price, item.quantity * item.unit_price]
      );
      // Deduct stock
      await conn.query(
        'UPDATE medicines SET quantity_in_stock = quantity_in_stock - ?, updated_at = NOW() WHERE id = ?',
        [item.quantity, item.medicine_id]
      );
    }

    await conn.commit();

    const [saleRows] = await conn.query('SELECT * FROM sales WHERE id = ?', [saleId]);
    res.status(201).json(saleRows[0]);
  } catch (err) {
    if (conn) await conn.rollback();
    console.error('POST /sales error:', err);
    res.status(500).json({ error: err.message || 'Server error' });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;
