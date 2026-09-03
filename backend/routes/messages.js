const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { messageLimiter } = require('../middleware/rateLimits');

// Get user's conversations (unique listing/user pairs)
router.get('/conversations', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT DISTINCT ON (l."ListingID", other_user."UserID")
              l."ListingID" as listing_id, l.title, l.status,
              other_user."UserID" as other_user_id,
              other_user.display_name as other_user_name,
              m.sent_at as last_message_time,
              m.body as last_message,
              (SELECT "URL" FROM "Image" WHERE "ListingID" = l."ListingID" AND is_primary = true LIMIT 1) as listing_image
       FROM "Message" m
       JOIN "Listing" l ON m."ListingID" = l."ListingID"
       JOIN "User" other_user ON
         CASE
           WHEN m."SellerID" = $1 THEN m."BuyerID"
           ELSE m."SellerID"
         END = other_user."UserID"
       WHERE m."SellerID" = $1 OR m."BuyerID" = $1
       ORDER BY l."ListingID", other_user."UserID", m.sent_at DESC`,
      [req.user.UserID]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages for a specific listing between two users
router.get('/listing/:listingId/user/:otherUserId', authenticateToken, async (req, res) => {
  try {
    const { listingId, otherUserId } = req.params;

    const result = await db.query(
      `SELECT m."MessageID" as message_id,
              m."ListingID" as listing_id,
              m."SellerID" as sender_id,
              m."BuyerID" as receiver_id,
              m.body,
              m.sent_at,
              seller.display_name as sender_name,
              buyer.display_name as receiver_name,
              l.title as listing_title
       FROM "Message" m
       JOIN "User" seller ON m."SellerID" = seller."UserID"
       JOIN "User" buyer ON m."BuyerID" = buyer."UserID"
       JOIN "Listing" l ON m."ListingID" = l."ListingID"
       WHERE m."ListingID" = $1
         AND ((m."SellerID" = $2 AND m."BuyerID" = $3)
           OR (m."SellerID" = $3 AND m."BuyerID" = $2))
       ORDER BY m.sent_at DESC`,
      [listingId, req.user.UserID, otherUserId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send a message
router.post('/', messageLimiter, authenticateToken, [
  body('listing_id').isInt().toInt(),
  body('receiver_id').isInt().toInt(),
  body('body').trim().isLength({ min: 1, max: 2000 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { listing_id, receiver_id, body: messageBody } = req.body;

  try {
    // Verify listing exists
    const listingCheck = await db.query(
      'SELECT "ListingID", "UserID" FROM "Listing" WHERE "ListingID" = $1',
      [listing_id]
    );

    if (listingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    const listingOwnerId = listingCheck.rows[0].UserID;
    if (req.user.UserID !== listingOwnerId && receiver_id !== listingOwnerId) {
      return res.status(403).json({ error: 'Messages must be sent to the listing owner' });
    }

    if (req.user.UserID === listingOwnerId) {
      const conversationCheck = await db.query(
        `SELECT 1 FROM "Message"
         WHERE "ListingID" = $1
           AND (("SellerID" = $2 AND "BuyerID" = $3)
             OR ("SellerID" = $3 AND "BuyerID" = $2))
         LIMIT 1`,
        [listing_id, req.user.UserID, receiver_id]
      );
      if (conversationCheck.rows.length === 0) {
        return res.status(403).json({ error: 'The buyer must start the conversation' });
      }
    }

    // Verify receiver exists
    const receiverCheck = await db.query(
      'SELECT "UserID" FROM "User" WHERE "UserID" = $1 AND status = \'active\' AND email_verified = true',
      [receiver_id]
    );

    if (receiverCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Receiver not found' });
    }

    // Can't send message to yourself
    if (req.user.UserID === receiver_id) {
      return res.status(400).json({ error: 'Cannot send message to yourself' });
    }

    // Insert message (SellerID = sender, BuyerID = receiver in new schema)
    const result = await db.query(
      `INSERT INTO "Message" ("ListingID", "SellerID", "BuyerID", body, sent_at)
       VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
       RETURNING "MessageID" as message_id, "ListingID" as listing_id,
                 "SellerID" as sender_id, "BuyerID" as receiver_id, body, sent_at`,
      [listing_id, req.user.UserID, receiver_id, messageBody]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages by listing ID (for listing owner to see all inquiries)
router.get('/listing/:listingId', authenticateToken, async (req, res) => {
  try {
    // Verify user is the listing owner
    const listingCheck = await db.query(
      'SELECT "UserID" FROM "Listing" WHERE "ListingID" = $1',
      [req.params.listingId]
    );

    if (listingCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found' });
    }

    if (listingCheck.rows[0].UserID !== req.user.UserID && !req.user.is_admin) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const result = await db.query(
      `SELECT m."MessageID" as message_id, m."ListingID" as listing_id,
              m."SellerID" as sender_id, m."BuyerID" as receiver_id,
              m.body, m.sent_at,
              seller.display_name as sender_name, seller.email as sender_email,
              buyer.display_name as receiver_name
       FROM "Message" m
       JOIN "User" seller ON m."SellerID" = seller."UserID"
       JOIN "User" buyer ON m."BuyerID" = buyer."UserID"
       WHERE m."ListingID" = $1
       ORDER BY m.sent_at DESC`,
      [req.params.listingId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get listing messages error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete message (only sender can delete)
router.delete('/:messageId', authenticateToken, async (req, res) => {
  try {
    // Check if user is the sender
    const messageCheck = await db.query(
      'SELECT "SellerID" FROM "Message" WHERE "MessageID" = $1',
      [req.params.messageId]
    );

    if (messageCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Message not found' });
    }

    if (messageCheck.rows[0].SellerID !== req.user.UserID && !req.user.is_admin) {
      return res.status(403).json({ error: 'Not authorized to delete this message' });
    }

    await db.query('DELETE FROM "Message" WHERE "MessageID" = $1', [req.params.messageId]);

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get unread message count (simplified - would need a read_status field in production)
router.get('/unread/count', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT COUNT(*) as unread_count FROM "Message" WHERE "BuyerID" = $1',
      [req.user.UserID]
    );

    res.json({ unread_count: parseInt(result.rows[0].unread_count) });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
