# Campus Marketplace Backend

REST API backend for the Campus Marketplace application built with Node.js, Express, and PostgreSQL.

## Team Members
- **Jake Sass**: Frontend & App Integration
- **Daylen Schilling**: Dataset & DB Schema

## Tech Stack
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcrypt
- **Validation**: express-validator

## Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Database Setup

#### Create Database
```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE campus_marketplace;

# Exit psql
\q
```

#### Run Schema
```bash
# Run the schema file to create tables and sample data
psql -U postgres -d campus_marketplace -f schema.sql
```

### 3. Environment Configuration

Create a `.env` file in the backend directory:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_password_here
DB_NAME=campus_marketplace

PORT=5000
NODE_ENV=development

JWT_SECRET=your_secure_jwt_secret_key_change_in_production

CORS_ORIGIN=http://localhost:3000
```

## Running the Server

### Development Mode (with auto-reload)
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Health Check
- `GET /api/health` - Server health status

### Users (`/api/users`)
- `POST /register` - Register new user
- `POST /login` - Login user
- `GET /me` - Get current user profile (authenticated)
- `PUT /me` - Update current user profile (authenticated)
- `GET /:userId` - Get user by ID (public profile)
- `GET /` - Get all users (admin only)
- `PATCH /:userId/status` - Update user status (admin only)

### Listings (`/api/listings`)
- `GET /` - Get all active listings (with filters)
- `GET /:listingId` - Get single listing by ID
- `POST /` - Create new listing (authenticated)
- `PUT /:listingId` - Update listing (authenticated, owner only)
- `DELETE /:listingId` - Delete listing (authenticated, owner only)
- `GET /user/my-listings` - Get current user's listings (authenticated)
- `GET /user/:userId` - Get listings by user ID

#### Query Parameters for GET /
- `search` - Search in title and description
- `category_id` - Filter by category
- `location_city` - Filter by city
- `location_state` - Filter by state
- `min_price` - Minimum price (in dollars)
- `max_price` - Maximum price (in dollars)
- `condition` - Filter by condition (new, like_new, good, fair, poor)
- `limit` - Results per page (default: 50)
- `offset` - Pagination offset (default: 0)

### Categories (`/api/categories`)
- `GET /` - Get all categories
- `GET /:categoryId` - Get category by ID
- `POST /` - Create category (admin only)
- `PUT /:categoryId` - Update category (admin only)
- `DELETE /:categoryId` - Delete category (admin only)
- `GET /stats/top` - Get top categories by listing count

### Favorites (`/api/favorites`)
- `GET /` - Get user's favorites (authenticated)
- `GET /check/:listingId` - Check if listing is favorited (authenticated)
- `POST /:listingId` - Add favorite (authenticated)
- `DELETE /:listingId` - Remove favorite (authenticated)
- `GET /count/:listingId` - Get favorite count for listing
- `GET /stats/popular` - Get most favorited listings

### Messages (`/api/messages`)
- `GET /conversations` - Get user's conversations (authenticated)
- `GET /listing/:listingId/user/:otherUserId` - Get messages for listing between two users (authenticated)
- `POST /` - Send message (authenticated)
- `GET /listing/:listingId` - Get all messages for listing (authenticated, owner only)
- `DELETE /:messageId` - Delete message (authenticated, sender only)
- `GET /unread/count` - Get unread message count (authenticated)

### Images (`/api/images`)
- `GET /listing/:listingId` - Get images for listing
- `POST /` - Add image to listing (authenticated, owner only)
- `PATCH /:imageId/primary` - Set image as primary (authenticated, owner only)
- `DELETE /:imageId` - Delete image (authenticated, owner only)

## Authentication

The API uses JWT for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

### Sample Login Request
```bash
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@university.edu",
    "password": "password123"
  }'
```

## Database Schema

### Tables
- **app_user**: User accounts and profiles
- **category**: Product categories
- **listing**: Items for sale
- **image**: Images for listings
- **favorite**: User-favorited listings (many-to-many)
- **message**: Messages between users

### Key Relationships
- Each listing has one seller (User)
- Each listing belongs to one category
- Each listing can have multiple images
- Users can favorite multiple listings
- Users can send/receive multiple messages

## Sample Data

The schema includes sample data:
- **Admin User**: admin@university.edu / admin123
- **Test Users**: john.doe@university.edu, jane.smith@university.edu, mike.johnson@university.edu (all use password123)
- **Sample Listings**: 5 listings across different categories
- **Sample Messages**: Test conversations between users

## Error Handling

The API returns standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication required)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found
- `409` - Conflict (duplicate resource)
- `500` - Internal Server Error

Error responses include a JSON object with an `error` field:
```json
{
  "error": "Error message description"
}
```

## Development Tools

### Testing with cURL

Create a user:
```bash
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@university.edu",
    "display_name": "Test User",
    "phone": "608-555-0100",
    "password": "password123"
  }'
```

Get all listings:
```bash
curl http://localhost:5000/api/listings
```

Search listings:
```bash
curl "http://localhost:5000/api/listings?search=textbook&category_id=1&max_price=50"
```

### Database Management

Connect to database:
```bash
psql -U postgres -d campus_marketplace
```

View tables:
```sql
\dt
```

Query data:
```sql
SELECT * FROM app_user;
SELECT * FROM listing WHERE status = 'active';
```

## Security Considerations

1. **JWT Secret**: Change `JWT_SECRET` in production to a strong, random string
2. **Password Hashing**: Uses bcrypt with 10 rounds (secure default)
3. **SQL Injection**: Protected via parameterized queries
4. **CORS**: Configure `CORS_ORIGIN` appropriately for production
5. **Environment Variables**: Never commit `.env` file to version control

## Project Structure

```
backend/
├── config/
│   └── database.js          # PostgreSQL connection
├── middleware/
│   └── auth.js              # Authentication middleware
├── routes/
│   ├── users.js             # User routes
│   ├── listings.js          # Listing routes
│   ├── categories.js        # Category routes
│   ├── favorites.js         # Favorite routes
│   ├── messages.js          # Message routes
│   └── images.js            # Image routes
├── .env.example             # Environment template
├── package.json             # Dependencies
├── schema.sql               # Database schema
└── server.js                # Main application file
```

## Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running: `sudo systemctl status postgresql`
- Check connection credentials in `.env`
- Ensure database exists: `psql -U postgres -l`

### Port Already in Use
- Change `PORT` in `.env`
- Or kill process using port 5000: `sudo lsof -i :5000`

### JWT Token Errors
- Ensure JWT_SECRET is set in `.env`
- Check token expiration (default: 7 days)

## Next Steps

1. Connect frontend application
2. Implement image upload functionality (currently accepts URLs)
3. Add email notifications
4. Implement real-time messaging with WebSockets
5. Add more advanced search features
6. Implement rate limiting
7. Add comprehensive logging

## Support

For questions or issues:
- Check existing documentation
- Review API endpoints above
- Contact team members
