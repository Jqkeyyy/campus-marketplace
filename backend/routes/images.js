const express = require('express');
const { body, validationResult } = require('express-validator');
const db = require('../config/database');
const { authenticateToken, optionalAuthenticateToken } = require('../middleware/auth');
const { uploadLimiter } = require('../middleware/rateLimits');
const { cloudinary, upload, uploadToCloudinary } = require('../config/cloudinary');

const router = express.Router();

router.post('/upload', uploadLimiter, authenticateToken, (req, res, next) => {
  upload.single('image')(req, res, (error) => {
    if (error) {
      return res.status(400).json({ error: 'Invalid image upload' });
    }
    return next();
  });
}, [
  body('listing_id').isInt().toInt(),
  body('is_primary').optional().isBoolean().toBoolean(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' });
  }

  let uploadedPublicId;
  try {
    const listing = await db.query(
      'SELECT "UserID" FROM "Listing" WHERE "ListingID" = $1',
      [req.body.listing_id]
    );
    if (listing.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }
    if (listing.rows[0].UserID !== req.user.UserID) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const imageCountResult = await db.query(
      'SELECT COUNT(*)::int AS count FROM "Image" WHERE "ListingID" = $1',
      [req.body.listing_id]
    );
    const imageCount = imageCountResult.rows[0].count;
    if (imageCount >= 10) {
      return res.status(409).json({ error: 'A listing can have at most 10 images' });
    }

    const uploaded = await uploadToCloudinary(req.file.buffer);
    uploadedPublicId = uploaded.public_id;
    const isPrimary = req.body.is_primary === true || imageCount === 0;

    if (isPrimary) {
      await db.query(
        'UPDATE "Image" SET is_primary = false WHERE "ListingID" = $1',
        [req.body.listing_id]
      );
    }

    const result = await db.query(
      `INSERT INTO "Image" ("ListingID", "URL", public_id, is_primary)
       VALUES ($1, $2, $3, $4)
       RETURNING "ImageID" as image_id, "ListingID" as listing_id, "URL" as url, is_primary`,
      [req.body.listing_id, uploaded.secure_url, uploaded.public_id, isPrimary]
    );
    return res.status(201).json(result.rows[0]);
  } catch (error) {
    if (uploadedPublicId) {
      await cloudinary.uploader.destroy(uploadedPublicId, { resource_type: 'image' }).catch(() => {});
    }
    console.error('Image upload error:', error);
    return res.status(500).json({ error: 'Failed to upload image' });
  }
});

router.get('/listing/:listingId', optionalAuthenticateToken, async (req, res) => {
  try {
    const listing = await db.query(
      `SELECT "UserID", status FROM "Listing" WHERE "ListingID" = $1`,
      [req.params.listingId]
    );
    if (listing.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const canView = listing.rows[0].status === 'active'
      || listing.rows[0].UserID === req.user?.UserID
      || req.user?.is_admin;
    if (!canView) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const result = await db.query(
      `SELECT "ImageID" as image_id, "ListingID" as listing_id, "URL" as url, is_primary
       FROM "Image" WHERE "ListingID" = $1 ORDER BY is_primary DESC, "ImageID"`,
      [req.params.listingId]
    );
    return res.json(result.rows);
  } catch (error) {
    console.error('Get images error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:imageId/primary', authenticateToken, async (req, res) => {
  try {
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

    await db.query(
      'UPDATE "Image" SET is_primary = false WHERE "ListingID" = $1',
      [imageCheck.rows[0].ListingID]
    );
    const result = await db.query(
      `UPDATE "Image" SET is_primary = true WHERE "ImageID" = $1
       RETURNING "ImageID" as image_id, "ListingID" as listing_id, "URL" as url, is_primary`,
      [req.params.imageId]
    );
    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Set primary image error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:imageId', authenticateToken, async (req, res) => {
  try {
    const imageCheck = await db.query(
      `SELECT i.public_id, l."UserID"
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

    if (imageCheck.rows[0].public_id) {
      await cloudinary.uploader.destroy(imageCheck.rows[0].public_id, { resource_type: 'image' });
    }
    await db.query('DELETE FROM "Image" WHERE "ImageID" = $1', [req.params.imageId]);
    return res.status(204).send();
  } catch (error) {
    console.error('Delete image error:', error);
    return res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
