# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Campus Marketplace is a full-stack peer-to-peer marketplace application for students. The application uses:
- **Backend**: Node.js/Express REST API with PostgreSQL database
- **Frontend**: React 18 with React Router and Context API
- **Authentication**: JWT-based with bcrypt password hashing
- **Database**: PostgreSQL with normalized schema (BCNF)

## Development Commands

### Backend (Port 5000)
```bash
cd backend
npm install                  # Install dependencies
npm run dev                  # Development with hot reload (nodemon)
npm start                    # Production mode
```

### Frontend (Port 3000)
```bash
cd frontend
npm install                  # Install dependencies
npm start                    # Development server
npm run build                # Production build
npm test                     # Run tests
```

### Database Setup
```bash
# Create database (PostgreSQL CLI)
psql -U postgres
CREATE DATABASE campus_marketplace;
\q

# Run schema and seed data
psql -U postgres -d campus_marketplace -f backend/schema.sql

# Connect to database
psql -U postgres -d campus_marketplace

# Common queries
\dt                          # List tables
\d+ table_name              # Describe table
SELECT * FROM app_user;     # View users
```

## Architecture

### Backend Structure
- **server.js** - Express app initialization, middleware setup, route mounting
- **config/database.js** - PostgreSQL connection pool (uses pg library)
- **middleware/auth.js** - JWT authentication middleware (`authenticateToken`, `isAdmin`)
- **routes/** - RESTful API endpoints (users, listings, categories, favorites, messages, images)

All routes follow pattern: `/api/{resource}` (e.g., `/api/listings`, `/api/users`)

### Frontend Structure
- **App.js** - React Router setup with `ProtectedRoute` and `PublicRoute` wrappers
- **contexts/AuthContext.js** - Global authentication state (user, token, login/logout/register)
- **services/api.js** - Axios instance with request/response interceptors for JWT handling
- **pages/** - Route components (Home, Login, Register, ListingDetail, etc.)
- **components/** - Reusable components (Navbar, etc.)

### Database Schema
6 tables in BCNF:
- **app_user** - User accounts with email verification and admin flags
- **category** - Product categories (10 default categories)
- **listing** - Items for sale with status (active/sold/removed)
- **image** - Listing images with primary image flag
- **favorite** - User favorites (M:N relationship)
- **message** - Messages between buyers and sellers

All tables have proper indexes for common queries. See `backend/schema.sql` for complete schema.

## Authentication Flow

1. **Registration**: POST `/api/users/register` → bcrypt hash password → insert user → return JWT
2. **Login**: POST `/api/users/login` → verify password → return JWT and user data
3. **Token Storage**: Frontend stores JWT in localStorage and includes in Authorization header
4. **Protected Routes**: Backend middleware (`authenticateToken`) verifies JWT on protected endpoints
5. **Frontend Auth**: `AuthContext` manages auth state and provides `isAuthenticated`, `user`, `login`, `logout`

JWT payload includes: `{ userId, email, is_admin }` and expires in 7 days (default).

## Environment Variables

### Backend (.env)
Required variables:
- `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` - PostgreSQL credentials
- `JWT_SECRET` - Secret key for JWT signing (change in production!)
- `PORT` - Server port (default: 5000)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Allowed origin for CORS (default: http://localhost:3000)

Use `backend/.env.example` as template.

### Frontend (.env)
- `REACT_APP_API_URL` - Backend API URL (default: http://localhost:5000/api)

## API Request/Response Patterns

### Authentication Required
Protected routes use `authenticateToken` middleware. Include JWT in header:
```
Authorization: Bearer <token>
```

Frontend axios instance automatically adds this header from localStorage.

### Error Responses
All errors return JSON with `error` field:
```json
{ "error": "Error message here" }
```

Common status codes:
- 400: Validation error
- 401: Authentication required
- 403: Forbidden (invalid token or insufficient permissions)
- 404: Resource not found
- 500: Server error

### Success Responses
Most endpoints return JSON with relevant data. Check individual route files in `backend/routes/` for specifics.

## Working with Listings

Listings have complex relationships:
- **seller_id** references app_user
- **category_id** references category
- Multiple **images** per listing (one marked as primary)
- Can be **favorited** by multiple users
- Associated **messages** between buyer and seller

When querying listings, use the `active_listings_view` database view for efficient joins with seller info and favorite counts.

## Common Development Workflows

### Adding a New API Endpoint
1. Add route handler in appropriate file in `backend/routes/`
2. Use parameterized queries to prevent SQL injection: `db.query(sql, [param1, param2])`
3. Add `authenticateToken` middleware for protected routes
4. Add corresponding API function in `frontend/src/services/api.js`
5. Test endpoint with curl or frontend

### Adding a New Page
1. Create component in `frontend/src/pages/`
2. Add route in `frontend/src/App.js`
3. Use `<ProtectedRoute>` wrapper if authentication required
4. Import and use API functions from `services/api.js`
5. Access auth state with `useAuth()` hook

### Database Migrations
Schema changes require updating `backend/schema.sql` and re-running:
```bash
psql -U postgres -d campus_marketplace -f backend/schema.sql
```

Note: This drops and recreates tables. For production, use proper migration tools.

## Test Credentials

Default accounts (see `backend/schema.sql` for more):
- **Admin**: admin@uww.edu / admin123
- Check schema.sql for additional test users

## Security Considerations

- Passwords hashed with bcrypt (10 rounds)
- SQL injection prevented via parameterized queries
- JWT tokens for stateless authentication
- CORS configured to restrict origins
- Input validation using express-validator where applicable
- Admin-only routes protected with `isAdmin` middleware

## Code Style

- Backend: CommonJS modules (`require`/`module.exports`)
- Frontend: ES6 modules (`import`/`export`)
- Use async/await for asynchronous operations
- Functional components with hooks in React (no class components)
- Route handlers follow pattern: `router.METHOD('/path', middleware, handler)`
