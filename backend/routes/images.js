const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { upload, uploadToCloudinary } = require('../config/cloudinary');

// Upload image to Cloudinary
router.post('/upload', authenticateToken, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Multer error:', err);
      return res.status(400).json({ error: err.message || 'File upload error' });
    }
    next();
  });
}, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    console.log('Uploading file:', req.file.originalname, req.file.size, 'bytes');

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer);

    console.log('Cloudinary upload success:', result.secure_url);

    res.json({
      url: result.secure_url,
      public_id: result.public_id
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error.message || error);
    res.status(500).json({ error: error.message || 'Failed to upload image' });
  }
});

// Get images for a listing
router.get('/listing/:listingId', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM "Image" WHERE "ListingID" = $1 ORDER BY is_primary DESC, "ImageID"',
      [req.params.listingId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get images error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Add image to listing
router.post('/', authenticateToken, [
  body('listing_id').isInt(),
  body('url').isURL(),
  body('is_primary').optional().isBoolean()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { listing_id, url, is_primary = false } = req.body;

  try {
    // Verify user owns the listing
    const listingCheck = await db.query(
      'SELECT "UserID" FROM "Listing" WHERE "ListingID" = $1',
      [listing_id]
    );

    if (listingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listingCheck.rows[0].UserID !== req.user.UserID) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // If setting as primary, unset other primary images
    if (is_primary) {
      await db.query(
        'UPDATE "Image" SET is_primary = false WHERE "ListingID" = $1',
        [listing_id]
      );
    }

    const result = await db.query(
      'INSERT INTO "Image" ("ListingID", "URL", is_primary) VALUES ($1, $2, $3) RETURNING *',
      [listing_id, url, is_primary]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Add image error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Set image as primary
router.patch('/:imageId/primary', authenticateToken, async (req, res) => {
  try {
    // Get image and verify ownership
    const imageCheck = await db.query(
      `SELECT i."ListingID", l."UserID"
       FROM "Image" i
       JOIN "Listing" l ON i."ListingID" = l."ListingID"
       WHERE i."ImageID" = $1`,
      [req.params.imageId]
    );

    if (imageCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    if (imageCheck.rows[0].UserID !== req.user.UserID) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const listing_id = imageCheck.rows[0].ListingID;

    // Unset other primary images
    await db.query(
      'UPDATE "Image" SET is_primary = false WHERE "ListingID" = $1',
      [listing_id]
    );

    // Set this image as primary
    const result = await db.query(
      'UPDATE "Image" SET is_primary = true WHERE "ImageID" = $1 RETURNING *',
      [req.params.imageId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Set primary image error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete image
router.delete('/:imageId', authenticateToken, async (req, res) => {
  try {
    // Verify ownership
    const imageCheck = await db.query(
      `SELECT i."ListingID", l."UserID"
       FROM "Image" i
       JOIN "Listing" l ON i."ListingID" = l."ListingID"
       WHERE i."ImageID" = $1`,
      [req.params.imageId]
    );

    if (imageCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Image not found' });
    }

    if (imageCheck.rows[0].UserID !== req.user.UserID && !req.user.is_admin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await db.query('DELETE FROM "Image" WHERE "ImageID" = $1', [req.params.imageId]);

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
