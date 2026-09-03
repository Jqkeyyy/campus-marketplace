const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, optionalAuthenticateToken, isAdmin } = require('../middleware/auth');
const { cloudinary } = require('../config/cloudinary');
const { body, validationResult } = require('express-validator');

// Get all active listings with filters
router.get('/', async (req, res) => {
  const {
    search,
    category_id,
    min_price,
    max_price,
    condition,
    limit = 50,
    offset = 0
  } = req.query;

  try {
    if (search && String(search).length > 100) {
      return res.status(400).json({ error: 'Search must be 100 characters or fewer' });
    }
    if (condition && !['new', 'like_new', 'good', 'fair', 'poor'].includes(condition)) {
      return res.status(400).json({ error: 'Invalid condition' });
    }
    let baseQuery = `
      FROM "Listing" l
      JOIN "Category" c ON l."CategoryID" = c."CategoryID"
      JOIN "User" u ON l."UserID" = u."UserID"
      WHERE l.status = 'active'
    `;
    const params = [];
    let paramCount = 1;

    if (search) {
      baseQuery += ` AND (l.title ILIKE $${paramCount} OR l.description ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    if (category_id) {
      baseQuery += ` AND l."CategoryID" = $${paramCount}`;
      params.push(category_id);
      paramCount++;
    }

    if (min_price) {
      baseQuery += ` AND l.price_cents >= $${paramCount}`;
      const parsedMinPrice = Number(min_price);
      if (!Number.isFinite(parsedMinPrice) || parsedMinPrice < 0) {
        return res.status(400).json({ error: 'Invalid minimum price' });
      }
      params.push(Math.round(parsedMinPrice * 100));
      paramCount++;
    }

    if (max_price) {
      baseQuery += ` AND l.price_cents <= $${paramCount}`;
      const parsedMaxPrice = Number(max_price);
      if (!Number.isFinite(parsedMaxPrice) || parsedMaxPrice < 0) {
        return res.status(400).json({ error: 'Invalid maximum price' });
      }
      params.push(Math.round(parsedMaxPrice * 100));
      paramCount++;
    }

    if (condition) {
      baseQuery += ` AND l.condition = $${paramCount}`;
      params.push(condition);
      paramCount++;
    }

    const pageLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 50, 1), 100);
    const pageOffset = Math.max(Number.parseInt(offset, 10) || 0, 0);

    // Get total count for pagination
    const countResult = await db.query(`SELECT COUNT(*) ${baseQuery}`, params);
    const total = parseInt(countResult.rows[0].count);

    // Get paginated results
    let query = `
      SELECT l."ListingID" as listing_id, l.title, l.description, l.condition, l.status,
             l.price_cents, l.created_at, l.updated_at,
             l."UserID" as user_id, l."CategoryID" as category_id,
             c.name as category_name, u.display_name as seller_name,
             (SELECT "URL" FROM "Image" WHERE "ListingID" = l."ListingID" AND is_primary = true LIMIT 1) as primary_image_url
      ${baseQuery} ORDER BY l.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
    params.push(pageLimit, pageOffset);

    const result = await db.query(query, params);

    // Convert price_cents to dollars for frontend
    const listings = result.rows.map(listing => ({
      ...listing,
      price: listing.price_cents / 100
    }));

    res.json({ listings, total, limit: pageLimit, offset: pageOffset });
  } catch (error) {
    console.error('Get listings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Admin: Get all listings (all statuses, no limit)
router.get('/admin/all', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT l."ListingID" as listing_id, l.title, l.description, l.condition, l.status,
              l.price_cents, l.created_at, l.updated_at,
              l."UserID" as user_id, l."CategoryID" as category_id,
              c.name as category_name, u.display_name as seller_name, u.email as seller_email,
              (SELECT "URL" FROM "Image" WHERE "ListingID" = l."ListingID" AND is_primary = true LIMIT 1) as primary_image_url
       FROM "Listing" l
       JOIN "Category" c ON l."CategoryID" = c."CategoryID"
       JOIN "User" u ON l."UserID" = u."UserID"
       ORDER BY l.created_at DESC`
    );

    const listings = result.rows.map(listing => ({
      ...listing,
      price: listing.price_cents / 100
    }));

    res.json(listings);
  } catch (error) {
    console.error('Admin get all listings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get user's own listings (must be before /:listingId route)
router.get('/user/my-listings', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT l."ListingID" as listing_id, l.title, l.description, l.condition, l.status,
              l.price_cents, l.created_at, l.updated_at,
              l."UserID" as user_id, l."CategoryID" as category_id,
              c.name as category_name,
              (SELECT "URL" FROM "Image" WHERE "ListingID" = l."ListingID" AND is_primary = true LIMIT 1) as primary_image_url
       FROM "Listing" l
       JOIN "Category" c ON l."CategoryID" = c."CategoryID"
       WHERE l."UserID" = $1
       ORDER BY l.created_at DESC`,
      [req.user.UserID]
    );

    const listings = result.rows.map(listing => ({
      ...listing,
      price: listing.price_cents / 100
    }));

    res.json(listings);
  } catch (error) {
    console.error('Get my listings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get listings by user ID (must be before /:listingId route)
router.get('/user/:userId', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT l."ListingID" as listing_id, l.title, l.description, l.condition, l.status,
              l.price_cents, l.created_at, l.updated_at,
              l."UserID" as user_id, l."CategoryID" as category_id,
              c.name as category_name,
              (SELECT "URL" FROM "Image" WHERE "ListingID" = l."ListingID" AND is_primary = true LIMIT 1) as primary_image_url
       FROM "Listing" l
       JOIN "Category" c ON l."CategoryID" = c."CategoryID"
       WHERE l."UserID" = $1 AND l.status = 'active'
       ORDER BY l.created_at DESC`,
      [req.params.userId]
    );

    const listings = result.rows.map(listing => ({
      ...listing,
      price: listing.price_cents / 100
    }));

    res.json(listings);
  } catch (error) {
    console.error('Get user listings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single listing by ID
router.get('/:listingId', optionalAuthenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT l."ListingID" as listing_id, l.title, l.description, l.condition, l.status,
              l.price_cents, l.created_at, l.updated_at,
              l."UserID" as user_id, l."CategoryID" as category_id,
              c.name as category_name, u.display_name as seller_name
       FROM "Listing" l
       JOIN "Category" c ON l."CategoryID" = c."CategoryID"
       JOIN "User" u ON l."UserID" = u."UserID"
       WHERE l."ListingID" = $1
         AND (l.status = 'active' OR l."UserID" = $2 OR $3 = true)`,
      [req.params.listingId, req.user?.UserID || null, req.user?.is_admin || false]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Get all images for this listing
    const imagesResult = await db.query(
      `SELECT "ImageID" as image_id, "ListingID" as listing_id, "URL" as url, is_primary
       FROM "Image" WHERE "ListingID" = $1 ORDER BY is_primary DESC, "ImageID"`,
      [req.params.listingId]
    );

    const listing = {
      ...result.rows[0],
      price: result.rows[0].price_cents / 100,
      images: imagesResult.rows
    };

    res.json(listing);
  } catch (error) {
    console.error('Get listing error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new listing
router.post('/', authenticateToken, [
  body('title').trim().isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('description').trim().isLength({ min: 10, max: 5000 }).withMessage('Description must be between 10 and 5000 characters'),
  body('price').isFloat({ min: 0.01, max: 21474836.47 }).withMessage('Price is outside the allowed range'),
  body('category_id').isInt().withMessage('Valid category is required'),
  body('condition').isIn(['new', 'like_new', 'good', 'fair', 'poor']).withMessage('Invalid condition')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    title,
    description,
    price,
    category_id,
    condition,
  } = req.body;

  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    // Insert listing
    const listingResult = await client.query(
      `INSERT INTO "Listing" (
        "UserID", "CategoryID", title, description, price_cents,
        condition, status, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING "ListingID" as listing_id, "UserID" as user_id, "CategoryID" as category_id,
                title, description, price_cents, condition, status, created_at, updated_at`,
      [
        req.user.UserID,
        category_id,
        title,
        description,
        Math.round(price * 100), // Convert to cents
        condition
      ]
    );

    const listing = listingResult.rows[0];

    await client.query('COMMIT');

    res.status(201).json({
      ...listing,
      price: listing.price_cents / 100
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create listing error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
});

// Update listing
router.put('/:listingId', authenticateToken, [
  body('title').optional().trim().isLength({ min: 3, max: 200 }),
  body('description').optional().trim().isLength({ min: 10, max: 5000 }),
  body('price').optional().isFloat({ min: 0.01, max: 21474836.47 }),
  body('category_id').optional().isInt(),
  body('condition').optional().isIn(['new', 'like_new', 'good', 'fair', 'poor']),
  body('status').optional().isIn(['active', 'sold', 'removed'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    // Check if user owns this listing
    const ownerCheck = await db.query(
      'SELECT "UserID" FROM "Listing" WHERE "ListingID" = $1',
      [req.params.listingId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (ownerCheck.rows[0].UserID !== req.user.UserID && !req.user.is_admin) {
      return res.status(403).json({ error: 'Not authorized to update this listing' });
    }

    const { title, description, price, category_id, condition, status } = req.body;
    const updates = [];
    const params = [];
    let paramCount = 1;

    if (title) {
      updates.push(`title = $${paramCount}`);
      params.push(title);
      paramCount++;
    }

    if (description) {
      updates.push(`description = $${paramCount}`);
      params.push(description);
      paramCount++;
    }

    if (price !== undefined) {
      updates.push(`price_cents = $${paramCount}`);
      params.push(Math.round(price * 100));
      paramCount++;
    }

    if (category_id) {
      updates.push(`"CategoryID" = $${paramCount}`);
      params.push(category_id);
      paramCount++;
    }

    if (condition) {
      updates.push(`condition = $${paramCount}`);
      params.push(condition);
      paramCount++;
    }

    if (status) {
      updates.push(`status = $${paramCount}`);
      params.push(status);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(req.params.listingId);

    const result = await db.query(
      `UPDATE "Listing" SET ${updates.join(', ')} WHERE "ListingID" = $${paramCount}
       RETURNING "ListingID" as listing_id, "UserID" as user_id, "CategoryID" as category_id,
                 title, description, price_cents, condition, status, created_at, updated_at`,
      params
    );

    res.json({
      ...result.rows[0],
      price: result.rows[0].price_cents / 100
    });
  } catch (error) {
    console.error('Update listing error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete listing
router.delete('/:listingId', authenticateToken, async (req, res) => {
  try {
    // Check if user owns this listing
    const ownerCheck = await db.query(
      'SELECT "UserID" FROM "Listing" WHERE "ListingID" = $1',
      [req.params.listingId]
    );

    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (ownerCheck.rows[0].UserID !== req.user.UserID && !req.user.is_admin) {
      return res.status(403).json({ error: 'Not authorized to delete this listing' });
    }

    const images = await db.query(
      'SELECT public_id FROM "Image" WHERE "ListingID" = $1 AND public_id IS NOT NULL',
      [req.params.listingId]
    );

    // Delete listing (cascade handles related database records).
    await db.query('DELETE FROM "Listing" WHERE "ListingID" = $1', [req.params.listingId]);

    await Promise.allSettled(
      images.rows.map((image) => cloudinary.uploader.destroy(image.public_id, { resource_type: 'image' }))
    );

    res.json({ message: 'Listing deleted successfully' });
  } catch (error) {
    console.error('Delete listing error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
