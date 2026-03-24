const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../db/pool');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

// GET all medicines
router.get('/', async (req, res) => {
  try {
    const { search, category, low_stock } = req.query;
    let query = `
      SELECT m.*, c.name as category_name, s.name as supplier_name
      FROM medicines m
      LEFT JOIN categories c ON m.category_id = c.id
      LEFT JOIN suppliers s ON m.supplier_id = s.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (m.name LIKE ? OR m.generic_name LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    if (category) {
      query += ` AND m.category_id = ?`;
      params.push(category);
    }
    if (low_stock === 'true') {
      query += ` AND m.quantity_in_stock <= m.reorder_level`;
    }
    query += ' ORDER BY m.name ASC';

    const [rows] = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single medicine
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.*, c.name as category_name, s.name as supplier_name
       FROM medicines m
       LEFT JOIN categories c ON m.category_id = c.id
       LEFT JOIN suppliers s ON m.supplier_id = s.id
       WHERE m.id = ?`,
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Medicine not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create medicine
router.post('/', async (req, res) => {
  try {
    const {
      name, generic_name, category_id, supplier_id, dosage, unit,
      purchase_price, selling_price, quantity_in_stock, reorder_level,
      expiry_date, batch_number, description, requires_prescription
    } = req.body;

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO medicines 
       (id, name, generic_name, category_id, supplier_id, dosage, unit, purchase_price, selling_price,
        quantity_in_stock, reorder_level, expiry_date, batch_number, description, requires_prescription)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, name, generic_name, category_id || null, supplier_id || null, dosage, unit,
        purchase_price, selling_price, quantity_in_stock || 0, reorder_level || 10,
        expiry_date, batch_number, description, requires_prescription ? 1 : 0]
    );

    const [rows] = await pool.query(
      `SELECT m.*, c.name as category_name, s.name as supplier_name
       FROM medicines m
       LEFT JOIN categories c ON m.category_id = c.id
       LEFT JOIN suppliers s ON m.supplier_id = s.id
       WHERE m.id = ?`, [id]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update medicine
router.put('/:id', async (req, res) => {
  try {
    const {
      name, generic_name, category_id, supplier_id, dosage, unit,
      purchase_price, selling_price, quantity_in_stock, reorder_level,
      expiry_date, batch_number, description, requires_prescription
    } = req.body;

    await pool.query(
      `UPDATE medicines SET
       name=?, generic_name=?, category_id=?, supplier_id=?, dosage=?, unit=?,
       purchase_price=?, selling_price=?, quantity_in_stock=?, reorder_level=?,
       expiry_date=?, batch_number=?, description=?, requires_prescription=?,
       updated_at=NOW()
       WHERE id=?`,
      [name, generic_name, category_id || null, supplier_id || null, dosage, unit,
        purchase_price, selling_price, quantity_in_stock, reorder_level,
        expiry_date, batch_number, description, requires_prescription ? 1 : 0, req.params.id]
    );

    const [rows] = await pool.query(
      `SELECT m.*, c.name as category_name, s.name as supplier_name
       FROM medicines m
       LEFT JOIN categories c ON m.category_id = c.id
       LEFT JOIN suppliers s ON m.supplier_id = s.id
       WHERE m.id = ?`, [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Medicine not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE medicine
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM medicines WHERE id = ?', [req.params.id]);
    res.json({ message: 'Medicine deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
