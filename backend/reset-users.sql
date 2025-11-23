-- Script to reset users for testing
-- This deletes all non-admin users and their related data

-- Delete all messages from non-admin users
DELETE FROM message WHERE sender_id IN (SELECT user_id FROM app_user WHERE is_admin = FALSE);
DELETE FROM message WHERE receiver_id IN (SELECT user_id FROM app_user WHERE is_admin = FALSE);

-- Delete all favorites from non-admin users
DELETE FROM favorite WHERE user_id IN (SELECT user_id FROM app_user WHERE is_admin = FALSE);

-- Delete all images from listings by non-admin users
DELETE FROM image WHERE listing_id IN (
    SELECT listing_id FROM listing WHERE seller_id IN (
        SELECT user_id FROM app_user WHERE is_admin = FALSE
    )
);

-- Delete all listings from non-admin users
DELETE FROM listing WHERE seller_id IN (SELECT user_id FROM app_user WHERE is_admin = FALSE);

-- Delete all non-admin users
DELETE FROM app_user WHERE is_admin = FALSE;

-- Show remaining users
SELECT user_id, email, display_name, is_admin, status, email_verified
FROM app_user;
