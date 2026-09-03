# Campus Marketplace

A full-stack peer-to-peer marketplace application designed specifically for college students to buy and sell items within their campus community.

---

## Part 1: Design Ideas and Implementation

### System Architecture and Design Philosophy

Campus Marketplace was architected using a modern three-tier design pattern to ensure separation of concerns, scalability, and maintainability. The presentation layer (React frontend) communicates with the application layer (Express REST API) which interfaces with the data layer (PostgreSQL database). This separation allows each tier to be developed, tested, and scaled independently while maintaining clean boundaries between business logic, data management, and user interface.

### Web Content Structure and Page Organization

The application follows a single-page application (SPA) architecture using React Router for seamless navigation without full page reloads. The content is organized into logical page components, each serving a specific purpose in the user journey. The Home page serves as the marketplace hub where users can browse, search, and filter listings using an intuitive grid layout. Individual listing details are presented on dedicated pages with image galleries, seller information, and messaging capabilities. User-specific pages include MyListings for managing personal inventory, Messages for buyer-seller communication, and Favorites for bookmarking items of interest. Administrative users have access to special moderation pages for managing users and listings across the entire platform.

The navigation structure was designed with user experience in mind. A persistent navigation bar provides quick access to core functionality regardless of which page the user is on. Protected routes ensure that authentication-required pages redirect unauthorized users to login, while public routes allow browsing without an account. The routing hierarchy groups related pages logically - all listing operations under /listings, user profile management under /profile, and admin functions under /admin.

### Interactive Components and JavaScript Functionality

The application leverages React's component-based architecture to create rich interactive experiences. The search and filter system on the Home page demonstrates complex state management, where multiple filter criteria (search text, category, price range, condition) work together in real-time to refine results. As users type in the search box or adjust filters, the component triggers API calls to fetch matching listings without requiring page refreshes.

The favorites system showcases dynamic user interaction through toggle buttons on listing cards. When users click the heart icon, JavaScript handles the optimistic UI update (immediately changing the icon from empty to filled heart) while simultaneously making an asynchronous API call to persist the change. If the API call fails, the UI reverts, providing seamless user experience even with network issues.

The messaging system implements a conversation-based interface where JavaScript manages the threading of messages between buyers and sellers. Real-time updates show new messages, and the interface groups conversations by listing, making it easy to track multiple negotiations. Form validation throughout the application uses JavaScript to provide immediate feedback - checking password strength during registration, validating price ranges when creating listings, and ensuring required fields are filled before submission.

The image upload component demonstrates advanced file handling in JavaScript. Users can select multiple images (up to 5), and the component immediately generates preview thumbnails using the FileReader API. The first image is automatically designated as "primary" with visual indicators (highlighted border and badge), and users can remove individual images before uploading. The upload process shows progress indicators, and error handling provides clear feedback for issues like oversized files or network failures.

### Animations and Visual Enhancements

Subtle CSS transitions enhance the user experience throughout the application. Hover effects on listing cards include scaling transformations and shadow depth changes, providing tactile feedback that elements are interactive. The favorite heart icon includes a scale animation when toggled, reinforcing the action taken. Loading states use animated spinners to indicate background operations, keeping users informed during API calls.

Button interactions feature smooth color transitions and scale effects on hover, making the interface feel responsive and polished. Form inputs include focus animations that highlight the active field with color transitions and subtle box-shadow changes. Error messages slide in with fade animations rather than appearing abruptly, creating a more pleasant experience when validation fails.

The listing grid on the Home page implements a responsive flexbox layout that smoothly adapts to different screen sizes. The "Load More" pagination feature includes smooth scrolling behavior when new listings are appended, maintaining user context. Modal dialogs for confirmations (like deleting listings) use backdrop blur effects and fade-in animations for a modern, professional appearance.

### State Management and Data Flow

The application uses React Context API for global state management, particularly for authentication. The AuthContext provides user information and authentication status throughout the component tree without prop drilling. Login state persists through a secure, HTTP-only cookie that frontend JavaScript cannot read.

Component-level state manages local concerns like form inputs, loading states, and error messages. The separation between global and local state keeps components focused and maintainable. API calls are centralized in a services layer, providing a consistent interface for backend communication and simplifying error handling.

---

## Part 2: Key Features

### User Authentication and Account Management
- UWW email ownership verification with short-lived, hashed verification tokens
- JWT-based authentication in secure, HTTP-only cookies
- Persistent login sessions across browser refreshes
- User profile management with display name and contact information
- Role-based access control (standard users vs administrators)
- Password security with salted bcrypt hashing (12 rounds)

### Listing Management
- Create new listings with comprehensive details (title, description, price, category, condition)
- Upload multiple images per listing (up to 5 images, max 5MB each)
- Automatic primary image designation with visual indicators
- Image preview before upload with individual removal capability
- Edit existing listings including title, description, price, category, and condition
- Update listing status (active, sold, removed)
- Delete listings with confirmation dialogs
- View personal listing inventory with status indicators
- Validation for price ranges, description length, and required fields

### Browse and Search Functionality
- Grid-based listing display with thumbnail images
- Full-text search across titles and descriptions (case-insensitive)
- Multi-criteria filtering: category, condition, price range
- Combined filter operation (all filters work together)
- Pagination with "Load More" functionality (50 listings per page)
- Total count display showing results (e.g., "Showing 75 of 150 listings")
- Sort by newest listings first (descending created_at)
- Empty state messaging when no results found

### Favorites System
- Add listings to favorites with heart icon toggle
- Remove from favorites with single click
- View all favorited listings on dedicated page
- Persistent favorites across sessions
- Visual indicators showing favorited status on listing cards
- Popular listings statistics (most favorited items)
- Optimistic UI updates for instant feedback

### Messaging System
- Send messages to sellers about specific listings
- Conversation threading grouped by listing
- Message history between buyer and seller
- Timestamp display for all messages
- Unread message count badge
- Conversation preview showing latest message
- Context-aware messaging (always linked to a listing)

### Category Organization
- 10 predefined categories relevant to students (Textbooks, Electronics, Furniture, Clothing, School Supplies, Appliances, Sports Equipment, Musical Instruments, Vehicles, Other)
- Category-based browsing and filtering
- Category statistics and popular categories view
- Admin ability to create new categories

### Admin Features
- User management dashboard with all registered users
- Activate/deactivate user accounts
- View user statistics and registration dates
- Listing moderation with unlimited pagination (view all listings)
- Delete inappropriate listings across the platform
- Filter listings by status (active, sold, removed)
- Category management (create, view stats, delete unused)
- Admin-only routes protected by authentication middleware

### Security Features
- SQL injection prevention via parameterized queries
- Security headers and browser-side React escaping
- CORS protection with configured allowed origins
- JWT verification plus live account-status and role checks on protected routes
- Ownership verification before updates/deletes
- Admin privilege checks for sensitive operations
- Password length requirements that respect bcrypt's safe input limit
- Rate limits for authentication, messaging, API requests, and uploads
- Session timeout after 1 day

### User Experience Enhancements
- Loading spinners during async operations
- Error messages with specific validation feedback
- Success confirmations for important actions
- Form validation with real-time feedback
- Disabled buttons during processing (prevents double-submission)
- Cancel buttons on all forms
- Breadcrumb navigation on detail pages
- Responsive design for mobile and desktop

---

## Part 3: Project Reflection

### Technical Learning and Skill Development

This project provided so much hands-on experience with full-stack web development. Working with React taught me the power of component-based architecture and how breaking down complex UIs into reusable pieces creates maintainable code. I learned to think in terms of state and props, understanding when to lift state up versus keeping it local to components. The Context API revealed elegant solutions to prop drilling, and I gained confidence in managing application-wide state without external libraries.

On the backend, Express.js taught me RESTful API design principles and the importance of consistent endpoint naming, HTTP method usage, and status codes. I learned to structure route handlers for clarity, implement middleware for cross-cutting concerns like authentication, and handle errors gracefully at different layers. Working with PostgreSQL deepened my understanding of relational database concepts beyond classroom theory. Designing the schema forced me to think critically about normalization, referential integrity, and the trade-offs between normalization and query performance.

Authentication was one of the most challenging(I had an extremely tough time figuring this all out) and rewarding aspects. Implementing JWT-based auth taught me about token lifecycle management, secure password hashing with bcrypt, and the difference between authentication and authorization. Database design taught me that proper planning prevents painful refactoring. Creating the ER diagram and normalizing to BCNF before writing code saved hours of restructuring later.

### Problem-Solving and Debugging Skills

Debugging full-stack applications taught me systematic troubleshooting approaches. When issues arose, I learned to isolate problems by checking browser console for frontend errors, server logs for backend issues, and database logs for query problems. Network tab inspection became second nature for understanding API request/response cycles.

The N+1 query problem was a memorable learning experience. Initially, I fetched listings in one query, then looped through results fetching images for each listing individually. This created hundreds of database calls for large datasets. Learning to use JOINs and subqueries to fetch all data in one query taught me about performance optimization and thinking in sets rather than loops.

Error handling became more sophisticated throughout the project. I learned to differentiate error types - validation errors, authentication failures, database errors, network issues - and provide appropriate user feedback for each.

### Project Management and Planning

Breaking down the project into manageable milestones was crucial for progress and morale. I learned to identify dependencies between tasks - you can't build the listing detail page before creating the backend API endpoint, and you can't test user-specific features before authentication works. Creating a task list and checking off completed items provided motivation and visibility into progress.

Version control with Git taught me discipline around commits. Writing clear commit messages, committing logical chunks of work rather than massive changes created a safety net. When bugs appeared, Git history helped identify when they were introduced.

### Time Management and Productivity

Estimating task duration improved with experience but remained challenging. Tasks that seemed simple often revealed complexity - "adding image upload" seemed straightforward until I considered file size limits, preview generation, multiple images(this part was very dificult with the database intgration part), primary designation, error handling, and responsive display. I learned to pad estimates and expect unexpected complications.

Time blocking helped productivity. Dedicating focused blocks to specific tasks without checking email or social media improved efficiency. Taking breaks when stuck prevented frustration spirals - often solutions appeared after stepping away.

Dealing with blockers taught resilience and resourcefulness. When stuck on authentication token management, I researched similar implementations, read documentation thoroughly, and reached out for help when needed. Learning when to persist versus when to seek assistance is a valuable skill.

### Design and User Experience Awareness

Thinking about user experience beyond functionality was enlightening. Loading spinners seem trivial but dramatically improve perceived performance. Disabled buttons during async operations prevent confusion and duplicate submissions. Clear error messages turn frustrating experiences into helpful guidance. These small touches accumulate into polished, professional applications.

Responsive design taught me empathy for users on different devices. Testing on mobile revealed issues invisible on desktop - tiny buttons, overflowing text, awkward layouts. Building mobile-first or at least mobile-conscious interfaces became a priority.

Accessibility considerations opened my eyes to inclusive design. Semantic HTML, proper form labels, keyboard navigation support, and color contrast aren't nice-to-haves but requirements for usable applications.

### Professional Growth and Career Preparation

This project simulated real-world development more than any classroom exercise. Dealing with ambiguous requirements, making architectural decisions, debugging production-like issues, and delivering working software built confidence for professional environments. I learned that development is iterative - shipping version 1.0, gathering feedback, and improving beats endlessly perfecting features that users might not want.

Documentation became valued rather than tedious. Writing the README, API documentation, and code comments helped me understand my own work better and prepared the codebase for others. Good documentation is a gift to your future self and teammates.

Security awareness grew from abstract concept to concrete implementation. Learning how easily SQL injection can compromise databases, why password hashing matters, and how authentication token management works prepared me for security-conscious development.

### What I Would Do Differently

If starting over, I would invest more time in initial planning and wireframing. Changing UI layouts mid-development wasted time on rework. I would write tests earlier rather than relying on manual testing. Automated tests catch regressions when adding features and serve as documentation for expected behavior.

I would seek code review and feedback earlier. Working in isolation sometimes led down suboptimal paths that experienced developers would have spotted immediately. I learned that asking for help isn't weakness but wisdom.

### Broader Life Lessons

Persistence and grit mattered more than intelligence. Many moments felt overwhelming - authentication wasn't working, the database query was slow, the layout broke on mobile. Pushing through frustration, breaking problems into smaller pieces, and celebrating small victories built the application incrementally.

Perfectionism can be an enemy. Waiting for perfect code or perfect designs delays shipping. I learned to embrace "good enough for now" with plans to iterate later. Shipping working software with known limitations beats indefinitely perfecting undelivered software.

Learning to learn proved most valuable. Technologies change constantly, but learning approaches transfer. Getting comfortable with documentation, debugging strategically, and asking good questions are meta-skills applicable beyond this specific tech stack.

### Moving Forward

This project confirmed my interest in full-stack development and revealed strengths and areas for growth. I enjoy backend systems and database design but want to improve frontend skills, particularly CSS and responsive design. Future learning goals include testing frameworks, TypeScript for type safety, and cloud deployment.

The project taught me I can build substantial applications from scratch. This confidence is invaluable. Most importantly, I learned that building applications is deeply satisfying. Seeing users interact with something I created, watching the listing count grow, receiving feedback - these moments justified the long hours and frustrating debugging sessions. This project transformed web development from academic exercise to creative craft, and I'm excited to continue building.

---

## Technologies Used

### Frontend
- React 18.3.1 - UI library for building component-based interfaces
- React Router 6.27.0 - Client-side routing and navigation
- Axios 1.7.7 - HTTP client for API communication
- CSS3 - Styling and responsive design
- React Context API - Global state management

### Backend
- Node.js - JavaScript runtime environment
- Express 4.21.1 - Web application framework
- PostgreSQL - Relational database management system
- pg (node-postgres) 8.13.1 - PostgreSQL client for Node.js
- JWT (jsonwebtoken 9.0.2) - Authentication token generation
- bcrypt 5.1.1 - Password hashing library
- express-validator - Input validation and sanitization
- CORS middleware - Cross-origin resource sharing

---

## Installation and setup

### Prerequisites
- Node.js 20 or newer and npm
- PostgreSQL 16
- A SendGrid account with a verified sender
- A Cloudinary account for image uploads

### Backend Setup

1. Install backend dependencies and create the local environment file:
```bash
cd backend
npm install
cp .env.example .env
```

2. Create database:
```bash
psql -U postgres
CREATE DATABASE campus_marketplace;
\q
```

3. Run database schema:
```bash
psql -U postgres -d campus_marketplace -f schema.sql
```

4. Edit `backend/.env`. Use a randomly generated `JWT_SECRET` of at least 32 characters and configure SendGrid, Cloudinary, the frontend URL, and the exact allowed CORS origin. Never commit `.env`.

5. Start backend server:
```bash
npm run dev  # Development mode with auto-reload
npm start    # Production mode
```

The backend runs on `http://localhost:5000` by default.

### Frontend Setup

1. Install frontend dependencies and create its environment file:
```bash
cd frontend
npm install
cp .env.example .env
```

2. Start frontend development server:
```bash
npm start
```

The frontend runs on `http://localhost:3000` by default.

### Updating an existing database

Run the security migration before deploying this version:

```bash
psql "$DATABASE_URL" -f backend/migrations/001_security_hardening.sql
```

Existing users are marked verified by the migration. New users must verify their UWW email before they can sign in.

### Production security

- Set `NODE_ENV=production`, `DB_SSL=true`, `COOKIE_SAME_SITE=none`, and HTTPS URLs for `CORS_ORIGIN`, `FRONTEND_URL`, and `VITE_API_URL`.
- Prefer serving the API from a same-site domain such as `api.example.com`; browsers may block cross-site cookies when the frontend and API use unrelated domains.
- Create administrators out-of-band with a unique password. The project intentionally ships with no default administrator.
- Configure Content-Security-Policy and `Referrer-Policy: no-referrer` in the frontend hosting platform.
