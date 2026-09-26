# SKIT Event Management Frontend — Phase 2

React + Vite frontend for the SKIT Event Management System.

## Phase 2

- Login page matching the approved SKIT UI direction
- Student registration page
- JWT token persistence in localStorage
- Authenticated user persistence
- GET /api/auth/me session validation
- Protected dashboard route
- Actual backend endpoints:
  - POST /api/auth/login
  - POST /api/auth/register
  - GET /api/auth/me
- Responsive Windows-friendly setup with no Mac node_modules included

## Setup

```powershell
npm install
Copy-Item .env.example .env
npm run dev
```

`.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

Run the backend separately on port 5000.
