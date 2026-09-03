const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Get all categories
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c."CategoryID" as category_id, c.name, COUNT(l."ListingID") as listing_count
       FROM "Category" c
       LEFT JOIN "Listing" l ON c."CategoryID" = l."CategoryID" AND l.status = 'active'
       GROUP BY c."CategoryID", c.name
       ORDER BY c.name`
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get category by ID
router.get('/:categoryId', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT c.*, COUNT(l."ListingID") as listing_count
       FROM "Category" c
       LEFT JOIN "Listing" l ON c."CategoryID" = l."CategoryID" AND l.status = 'active'
       WHERE c."CategoryID" = $1
       GROUP BY c."CategoryID"`,
      [req.params.categoryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create category (admin only)
router.post('/', authenticateToken, isAdmin, [
  body('name').trim().isLength({ min: 2, max: 100 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name } = req.body;

  try {
    const result = await db.query(
      'INSERT INTO "Category" (name) VALUES ($1) RETURNING *',
      [name]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Category already exists' });
    }
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update category (admin only)
router.put('/:categoryId', authenticateToken, isAdmin, [
  body('name').trim().isLength({ min: 2, max: 100 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name } = req.body;

  try {
    const result = await db.query(
      'UPDATE "Category" SET name = $1 WHERE "CategoryID" = $2 RETURNING *',
      [name, req.params.categoryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete category (admin only)
router.delete('/:categoryId', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Check if category has listings
    const listingCheck = await db.query(
      'SELECT COUNT(*) FROM "Listing" WHERE "CategoryID" = $1',
      [req.params.categoryId]
    );

    if (parseInt(listingCheck.rows[0].count) > 0) {
      return res.status(409).json({
        error: 'Cannot delete category with existing listings'
      });
    }

    const result = await db.query(
      'DELETE FROM "Category" WHERE "CategoryID" = $1 RETURNING *',
      [req.params.categoryId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get top categories by listing count
router.get('/stats/top', async (req, res) => {
  const { limit = 10 } = req.query;
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 10, 1), 100);

  try {
    const result = await db.query(
      `SELECT c.*, COUNT(l."ListingID") as listing_count
       FROM "Category" c
       LEFT JOIN "Listing" l ON c."CategoryID" = l."CategoryID" AND l.status = 'active'
       GROUP BY c."CategoryID"
       ORDER BY listing_count DESC
       LIMIT $1`,
      [safeLimit]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get top categories error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
