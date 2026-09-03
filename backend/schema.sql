-- Campus Marketplace Database Schema
-- Created by: Daylen Schilling
-- Converted to PostgreSQL with authentication support

-- Drop existing tables if they exist (for development)
DROP TABLE IF EXISTS "Favorites" CASCADE;
DROP TABLE IF EXISTS "Message" CASCADE;
DROP TABLE IF EXISTS "Image" CASCADE;
DROP TABLE IF EXISTS "Listing" CASCADE;
DROP TABLE IF EXISTS "Category" CASCADE;
DROP TABLE IF EXISTS "User" CASCADE;

-- User Table
CREATE TABLE "User" (
    "UserID" SERIAL PRIMARY KEY,
    display_name VARCHAR(255) NOT NULL,
    phone VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'suspended', 'banned')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    email_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_token_hash VARCHAR(64),
    verification_expires_at TIMESTAMPTZ
);

-- Category Table
CREATE TABLE "Category" (
    "CategoryID" SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL
);

-- Listing Table
CREATE TABLE "Listing" (
    "ListingID" SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    condition VARCHAR(255) NOT NULL,
    status VARCHAR(255) DEFAULT 'active',
    price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "UserID" INTEGER NOT NULL REFERENCES "User"("UserID") ON DELETE CASCADE,
    "CategoryID" INTEGER NOT NULL REFERENCES "Category"("CategoryID") ON DELETE RESTRICT
);

-- Message Table
CREATE TABLE "Message" (
    "MessageID" SERIAL PRIMARY KEY,
    body TEXT NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "SellerID" INTEGER NOT NULL REFERENCES "User"("UserID") ON DELETE CASCADE,
    "BuyerID" INTEGER NOT NULL REFERENCES "User"("UserID") ON DELETE CASCADE,
    "ListingID" INTEGER NOT NULL REFERENCES "Listing"("ListingID") ON DELETE CASCADE
);

-- Image Table
CREATE TABLE "Image" (
    "ImageID" SERIAL PRIMARY KEY,
    "URL" VARCHAR(255) NOT NULL,
    public_id VARCHAR(255),
    is_primary BOOLEAN DEFAULT FALSE,
    "ListingID" INTEGER NOT NULL REFERENCES "Listing"("ListingID") ON DELETE CASCADE
);

-- Favorites Table
CREATE TABLE "Favorites" (
    "UserID" INTEGER NOT NULL REFERENCES "User"("UserID") ON DELETE CASCADE,
    "ListingID" INTEGER NOT NULL REFERENCES "Listing"("ListingID") ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY("UserID", "ListingID")
);

-- Create indexes for better query performance
CREATE INDEX idx_listing_user ON "Listing"("UserID");
CREATE INDEX idx_listing_category ON "Listing"("CategoryID");
CREATE INDEX idx_listing_status ON "Listing"(status);
CREATE INDEX idx_listing_created ON "Listing"(created_at DESC);
CREATE INDEX idx_image_listing ON "Image"("ListingID");
CREATE INDEX idx_favorites_user ON "Favorites"("UserID");
CREATE INDEX idx_favorites_listing ON "Favorites"("ListingID");
CREATE INDEX idx_message_listing ON "Message"("ListingID");
CREATE INDEX idx_message_seller ON "Message"("SellerID");
CREATE INDEX idx_message_buyer ON "Message"("BuyerID");
CREATE INDEX idx_message_sent ON "Message"(sent_at DESC);

-- Insert default categories
INSERT INTO "Category" (name) VALUES
    ('Textbooks'),
    ('Electronics'),
    ('Furniture'),
    ('Clothing'),
    ('School Supplies'),
    ('Appliances'),
    ('Sports Equipment'),
    ('Musical Instruments'),
    ('Vehicles'),
    ('Other');

-- ============================================
-- SAMPLE QUERIES (for reference, not executed)
-- ============================================

-- Find the status of all Users
-- SELECT "UserID", status FROM "User";

-- Sort Listings from least to most expensive
-- SELECT "ListingID", title, price_cents FROM "Listing" ORDER BY price_cents ASC;

-- Sort Listings from most to least expensive
-- SELECT "ListingID", title, price_cents FROM "Listing" ORDER BY price_cents DESC;

-- Find all Listings by category name
-- SELECT L."ListingID" FROM "Listing" L
-- JOIN "Category" C ON L."CategoryID" = C."CategoryID"
-- WHERE C.name = 'Electronics';

-- Find all listings posted within one week
-- SELECT "ListingID", title FROM "Listing"
-- WHERE created_at >= CURRENT_DATE - INTERVAL '7 days';

-- Find all listings updated today
-- SELECT "ListingID", title FROM "Listing"
-- WHERE DATE(updated_at) = CURRENT_DATE;

-- Count listings per category
-- SELECT C.name, COUNT(L."ListingID") FROM "Category" C
-- LEFT JOIN "Listing" L ON C."CategoryID" = L."CategoryID"
-- GROUP BY C.name;

-- Sort listings by date
-- SELECT "ListingID", title FROM "Listing" ORDER BY updated_at DESC;
