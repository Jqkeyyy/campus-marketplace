const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Get user's favorites
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT l."ListingID" as listing_id, l.title, l.description, l.condition, l.status,
              l.price_cents, l.created_at, l.updated_at,
              l."UserID" as user_id, l."CategoryID" as category_id,
              c.name as category_name, u.display_name as seller_name,
              (SELECT "URL" FROM "Image" WHERE "ListingID" = l."ListingID" AND is_primary = true LIMIT 1) as primary_image_url,
              f.created_at as favorited_at
       FROM "Favorites" f
       JOIN "Listing" l ON f."ListingID" = l."ListingID"
       JOIN "Category" c ON l."CategoryID" = c."CategoryID"
       JOIN "User" u ON l."UserID" = u."UserID"
       WHERE f."UserID" = $1
       ORDER BY f.created_at DESC`,
      [req.user.UserID]
    );

    const favorites = result.rows.map(listing => ({
      ...listing,
      price: listing.price_cents / 100
    }));

    res.json(favorites);
  } catch (error) {
    console.error('Get favorites error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Check if listing is favorited
router.get('/check/:listingId', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM "Favorites" WHERE "UserID" = $1 AND "ListingID" = $2',
      [req.user.UserID, req.params.listingId]
    );

    res.json({ is_favorited: result.rows.length > 0 });
  } catch (error) {
    console.error('Check favorite error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add favorite
router.post('/:listingId', authenticateToken, async (req, res) => {
  try {
    // Check if listing exists
    const listingCheck = await db.query(
      'SELECT "ListingID" FROM "Listing" WHERE "ListingID" = $1',
      [req.params.listingId]
    );

    if (listingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    // Check if already favorited
    const existingFavorite = await db.query(
      'SELECT * FROM "Favorites" WHERE "UserID" = $1 AND "ListingID" = $2',
      [req.user.UserID, req.params.listingId]
    );

    if (existingFavorite.rows.length > 0) {
      return res.status(409).json({ error: 'Listing already favorited' });
    }

    // Add favorite
    await db.query(
      'INSERT INTO "Favorites" ("UserID", "ListingID", created_at) VALUES ($1, $2, CURRENT_TIMESTAMP)',
      [req.user.UserID, req.params.listingId]
    );

    res.status(201).json({ message: 'Listing added to favorites' });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove favorite
router.delete('/:listingId', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'DELETE FROM "Favorites" WHERE "UserID" = $1 AND "ListingID" = $2 RETURNING *',
      [req.user.UserID, req.params.listingId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Favorite not found' });
    }

    res.json({ message: 'Listing removed from favorites' });
  } catch (error) {
    console.error('Remove favorite error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get favorite count for a listing
router.get('/count/:listingId', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT COUNT(*) as favorite_count FROM "Favorites" WHERE "ListingID" = $1',
      [req.params.listingId]
    );

    res.json({ favorite_count: parseInt(result.rows[0].favorite_count) });
  } catch (error) {
    console.error('Get favorite count error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get most favorited listings
router.get('/stats/popular', async (req, res) => {
  const { limit = 10 } = req.query;
  const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 10, 1), 100);

  try {
    const result = await db.query(
      `SELECT l."ListingID" as listing_id, l.title, l.description, l.condition, l.status,
              l.price_cents, l.created_at, l.updated_at,
              l."UserID" as user_id, l."CategoryID" as category_id,
              c.name as category_name, u.display_name as seller_name,
              COUNT(f."UserID") as favorite_count,
              (SELECT "URL" FROM "Image" WHERE "ListingID" = l."ListingID" AND is_primary = true LIMIT 1) as primary_image_url
       FROM "Listing" l
       JOIN "Category" c ON l."CategoryID" = c."CategoryID"
       JOIN "User" u ON l."UserID" = u."UserID"
       LEFT JOIN "Favorites" f ON l."ListingID" = f."ListingID"
       WHERE l.status = 'active'
       GROUP BY l."ListingID", l.title, l.description, l.condition, l.status,
                l.price_cents, l.created_at, l.updated_at, l."UserID", l."CategoryID",
                c.name, u.display_name
       ORDER BY favorite_count DESC
       LIMIT $1`,
      [safeLimit]
    );

    const listings = result.rows.map(listing => ({
      ...listing,
      price: listing.price_cents / 100
    }));

    res.json(listings);
  } catch (error) {
    console.error('Get popular listings error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
