## Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+ (installed locally)
- pgAdmin4 (optional but recommended)

## Project structure
```
.
├─ backend/                 # Express server (connects to PostgreSQL)
│  ├─ server.js
│  └─ package.json
├─ components/              # React components
├─ services/                # API service layer (frontend)
├─ query.sql                # Database schema, triggers, functions, seed data
├─ package.json             # Frontend package.json (Vite)
└─ vite.config.ts           # Dev server + proxy to backend
```

## 1) Database setup
1. Start PostgreSQL service locally.
2. Create a database (example name): `credit_based_teaching`.
3. Open `query.sql` in pgAdmin4 or `psql` and run the whole script to create:
   - Tables: faculties, majors, lecturers, students, classrooms, semesters, courses, classes, enrollments
   - Indexes and triggers (e.g., classroom overlap, capacity checks, credit limits)
   - Functions: `get_student_gpa`, `get_lecturer_monthly_salary`
   - Sample data

If you re-run `query.sql`, it resets the schema (it drops and recreates `public`).

## 2) Backend configuration
Edit `backend/server.js` database credentials:
```js
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'credit_based_teaching',
  password: 'YOUR_PASSWORD',
  port: 5432,
});
```

The backend includes:
- Health endpoint: `GET /api/health`
- CRUD endpoints for students, lecturers, courses, classes, faculties, majors, semesters, classrooms
- Report endpoints:
  - `GET /api/reports/student-gpa`
  - `GET /api/reports/academic-warnings?gpaThreshold=2.0&creditThreshold=9`
  - `GET /api/reports/lecturer-salaries?semesterId=20231&hoursThreshold=8`
  - `GET /api/reports/classroom-usage?semesterId=20231`

Start the backend:
```
cd backend
npm install
npm start
```
You should see:
```
✅ Connected to PostgreSQL successfully.
Backend server is running on http://localhost:3001
```
Check health:
```
http://localhost:3001/api/health
```

## 3) Frontend setup (Vite + React)
From the project root:
```
npm install
npm run dev
```
Vite dev server runs on `http://localhost:3000`.

### Dev proxy
`vite.config.ts` proxies `/api` to `http://localhost:3001`, so the frontend can call backend endpoints without CORS issues.

## 4) Usage
- Open `http://localhost:3000`.
- Use the sidebar to navigate:
  - Students, Lecturers, Courses, Classes: full CRUD + search (where applicable).
  - Reports: GPA list, Academic warnings, Lecturer salaries by semester (with hour threshold), Classroom usage by semester.
- Backend triggers enforce business rules (credit limit, room capacity, overlaps, prerequisites, lecturer limits). Violations are returned as errors and displayed in the UI.

## 5) Troubleshooting
- White page or errors
  - Open DevTools Console and Network tabs to see API errors.
  - Ensure backend is running on port 3001 and the credentials in `backend/server.js` are correct.
  - Verify the database `credit_based_teaching` exists and `query.sql` has been executed.
- `ECONNREFUSED` or 404 on `/api/...`
  - Backend not running, wrong port, or proxy misconfiguration.
- DB connection error in backend logs
  - Check `user/password/host/port/database`, and that PostgreSQL accepts local connections.

## 6) Build and preview (frontend)
```
npm run build
npm run preview
```

## 7) Notes
- The schema, triggers, and functions are defined in `query.sql`. Review to understand enforced constraints.
- Default ports:
  - Frontend: 3000
  - Backend: 3001
  - PostgreSQL: 5432