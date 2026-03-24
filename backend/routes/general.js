const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// CATEGORIES
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/categories', async (req, res) => {
  try {
    const { name, description } = req.body;
    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO categories (id, name, description) VALUES (?, ?, ?)',
      [id, name, description]
    );
    const [rows] = await pool.query('SELECT * FROM categories WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// SUPPLIERS
router.get('/suppliers', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM suppliers ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/suppliers', async (req, res) => {
  try {
    const { name, contact_person, phone, email, address } = req.body;
    const id = crypto.randomUUID();
    await pool.query(
      'INSERT INTO suppliers (id, name, contact_person, phone, email, address) VALUES (?,?,?,?,?,?)',
      [id, name, contact_person, phone, email, address]
    );
    const [rows] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [id]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.put('/suppliers/:id', async (req, res) => {
  try {
    const { name, contact_person, phone, email, address } = req.body;
    await pool.query(
      'UPDATE suppliers SET name=?, contact_person=?, phone=?, email=?, address=? WHERE id=?',
      [name, contact_person, phone, email, address, req.params.id]
    );
    const [rows] = await pool.query('SELECT * FROM suppliers WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DASHBOARD STATS
router.get('/dashboard', async (req, res) => {
  try {
    const [
      [totalMeds], [lowStock], [expiringSoon], [todaySales],
      [monthlySales], [topMeds], [recentSales]
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) AS count FROM medicines'),
      pool.query('SELECT COUNT(*) AS count FROM medicines WHERE quantity_in_stock <= reorder_level'),
      pool.query(`SELECT COUNT(*) AS count FROM medicines WHERE expiry_date <= NOW() + INTERVAL 30 DAY AND expiry_date > NOW()`),
      pool.query(`SELECT COALESCE(SUM(total_amount), 0) AS total, COUNT(*) AS count FROM sales WHERE DATE(created_at) = CURDATE() AND status = 'completed'`),
      pool.query(`SELECT COALESCE(SUM(total_amount), 0) AS total, COUNT(*) AS count FROM sales WHERE DATE_FORMAT(created_at, '%Y-%m') = DATE_FORMAT(NOW(), '%Y-%m') AND status = 'completed'`),
      pool.query(`
        SELECT m.name, SUM(si.quantity) AS total_sold
        FROM sale_items si
        JOIN medicines m ON si.medicine_id = m.id
        JOIN sales s ON si.sale_id = s.id
        WHERE s.created_at >= NOW() - INTERVAL 30 DAY
        GROUP BY m.name ORDER BY total_sold DESC LIMIT 5
      `),
      pool.query(`
        SELECT s.invoice_number, s.total_amount, s.created_at, s.payment_method
        FROM sales s
        ORDER BY s.created_at DESC LIMIT 5
      `)
    ]);

    res.json({
      stats: {
        total_medicines: parseInt(totalMeds[0].count),
        low_stock: parseInt(lowStock[0].count),
        expiring_soon: parseInt(expiringSoon[0].count),
        today_revenue: parseFloat(todaySales[0].total),
        today_sales: parseInt(todaySales[0].count),
        monthly_revenue: parseFloat(monthlySales[0].total),
        monthly_sales: parseInt(monthlySales[0].count),
      },
      top_medicines: topMeds,
      recent_sales: recentSales
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
