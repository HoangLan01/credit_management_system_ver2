const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const port = 3001; // Port for the backend server

// === MIDDLEWARE ===
// Enable Cross-Origin Resource Sharing (CORS) so the frontend can call the backend
app.use(cors());
// Enable parsing of JSON bodies in requests
app.use(express.json());



const pool = new Pool({
    user: 'postgres', // <<< ĐIỀN USERNAME POSTGRESQL CỦA BẠN
    host: 'localhost',
    database: 'credit_based_teaching', // <<< ĐIỀN TÊN DATABASE CỦA BẠN
    password: 'abc', // <<< ĐIỀN MẬT KHẨU POSTGRESQL CỦA BẠN
    port: 5432,
});

// On startup, verify DB connection and log a clear message
(async () => {
    try {
        await pool.query('SELECT 1');
        console.log('✅ Connected to PostgreSQL successfully.');
    } catch (err) {
        console.error('❌ Failed to connect to PostgreSQL. Please check credentials and DB availability.', err.message);
    }
})();

// Helper function for querying
async function queryDatabase(query, params) {
    try {
        const result = await pool.query(query, params);
        return result.rows;
    } catch (error) {
        console.error('Database query error:', {
            message: error.message,
            query: query,
            params: params
        });
        throw error;
    }
}

// =============================================================================
// === API ENDPOINTS ===
// =============================================================================
// Đây là các API mà frontend sẽ gọi đến.

// --- Health check ---
app.get('/api/health', async (req, res) => {
    try {
        const r = await pool.query('SELECT NOW() as now');
        res.json({ status: 'ok', now: r.rows[0].now });
    } catch (err) {
        res.status(500).json({ status: 'error', message: err.message });
    }
});

// --- Basic Data Retrieval (Lists) ---
app.get('/api/students', async (req, res) => {
    try {
        const { q } = req.query;
        const students = await queryDatabase(
            q
                ? `SELECT * FROM students 
                   WHERE student_id ILIKE $1 OR first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1
                   ORDER BY student_id`
                : 'SELECT * FROM students ORDER BY student_id',
            q ? [`%${q}%`] : undefined
        );
        res.json(students);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve students' });
    }
});

app.get('/api/lecturers', async (req, res) => {
    try {
        const { q } = req.query;
        const lecturers = await queryDatabase(
            q
                ? `SELECT * FROM lecturers 
                   WHERE first_name ILIKE $1 OR last_name ILIKE $1 OR email ILIKE $1
                   ORDER BY last_name, first_name`
                : 'SELECT * FROM lecturers ORDER BY last_name, first_name',
            q ? [`%${q}%`] : undefined
        );
        res.json(lecturers);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve lecturers' });
    }
});

app.get('/api/semesters', async (req, res) => {
    try {
        const semesters = await queryDatabase('SELECT * FROM semesters ORDER BY semester_id DESC');
        res.json(semesters);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve semesters' });
    }
});

app.get('/api/faculties', async (req, res) => {
    try {
        const faculties = await queryDatabase('SELECT * FROM faculties ORDER BY faculty_name');
        res.json(faculties);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve faculties' });
    }
});

app.get('/api/majors', async (req, res) => {
    try {
        const majors = await queryDatabase('SELECT * FROM majors ORDER BY major_name');
        res.json(majors);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve majors' });
    }
});

app.get('/api/courses', async (req, res) => {
    try {
        const { q } = req.query;
        const courses = await queryDatabase(
            q
                ? `SELECT * FROM courses 
                   WHERE course_id ILIKE $1 OR course_name ILIKE $1
                   ORDER BY course_id`
                : 'SELECT * FROM courses ORDER BY course_id',
            q ? [`%${q}%`] : undefined
        );
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve courses' });
    }
});

app.get('/api/classrooms', async (req, res) => {
    try {
        const classrooms = await queryDatabase('SELECT * FROM classrooms ORDER BY classroom_id');
        res.json(classrooms);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve classrooms' });
    }
});

app.get('/api/classes', async (req, res) => {
    try {
        const classes = await queryDatabase('SELECT * FROM classes ORDER BY class_id DESC');
        res.json(classes);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve classes' });
    }
});

app.get('/api/enrollments', async (req, res) => {
    try {
        const enrollments = await queryDatabase('SELECT * FROM enrollments ORDER BY enrollment_id DESC');
        res.json(enrollments);
    } catch (err) {
        res.status(500).json({ message: 'Failed to retrieve enrollments' });
    }
});

// --- CRUD: Students ---
app.post('/api/students', async (req, res) => {
    const { student_id, first_name, last_name, dob, email, major_id, cohort_id, program_id } = req.body;
    try {
        const rows = await queryDatabase(
            `INSERT INTO students (student_id, first_name, last_name, dob, email, major_id, cohort_id, program_id)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [student_id, first_name, last_name, dob, email, major_id, cohort_id, program_id]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to create student' });
    }
});

app.put('/api/students/:id', async (req, res) => {
    const id = req.params.id;
    const { first_name, last_name, dob, email, major_id, cohort_id, program_id } = req.body;
    try {
        const rows = await queryDatabase(
            `UPDATE students SET first_name=$1,last_name=$2,dob=$3,email=$4,major_id=$5,cohort_id=$6,program_id=$7
             WHERE student_id=$8 RETURNING *`,
            [first_name, last_name, dob, email, major_id, cohort_id, program_id, id]
        );
        if (!rows.length) return res.status(404).json({ message: 'Student not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to update student' });
    }
});

app.delete('/api/students/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await queryDatabase(`DELETE FROM students WHERE student_id=$1`, [id]);
        res.status(204).end();
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to delete student' });
    }
});

// --- CRUD: Lecturers ---
app.post('/api/lecturers', async (req, res) => {
    const { first_name, last_name, email, faculty_id, hourly_rate } = req.body;
    try {
        const rows = await queryDatabase(
            `INSERT INTO lecturers (first_name,last_name,email,faculty_id,hourly_rate)
             VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [first_name, last_name, email, faculty_id, hourly_rate]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to create lecturer' });
    }
});

app.put('/api/lecturers/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { first_name, last_name, email, faculty_id, hourly_rate } = req.body;
    try {
        const rows = await queryDatabase(
            `UPDATE lecturers SET first_name=$1,last_name=$2,email=$3,faculty_id=$4,hourly_rate=$5
             WHERE lecturer_id=$6 RETURNING *`,
            [first_name, last_name, email, faculty_id, hourly_rate, id]
        );
        if (!rows.length) return res.status(404).json({ message: 'Lecturer not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to update lecturer' });
    }
});

app.delete('/api/lecturers/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
        await queryDatabase(`DELETE FROM lecturers WHERE lecturer_id=$1`, [id]);
        res.status(204).end();
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to delete lecturer' });
    }
});

// --- CRUD: Courses ---
app.post('/api/courses', async (req, res) => {
    const { course_id, course_name, credits, teaching_hours_per_week, managing_faculty_id, major_id, course_type } = req.body;
    try {
        const rows = await queryDatabase(
            `INSERT INTO courses (course_id,course_name,credits,teaching_hours_per_week,managing_faculty_id,major_id,course_type)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [course_id, course_name, credits, teaching_hours_per_week, managing_faculty_id, major_id, course_type]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to create course' });
    }
});

app.put('/api/courses/:id', async (req, res) => {
    const id = req.params.id;
    const { course_name, credits, teaching_hours_per_week, managing_faculty_id, major_id, course_type } = req.body;
    try {
        const rows = await queryDatabase(
            `UPDATE courses SET course_name=$1,credits=$2,teaching_hours_per_week=$3,managing_faculty_id=$4,major_id=$5,course_type=$6
             WHERE course_id=$7 RETURNING *`,
            [course_name, credits, teaching_hours_per_week, managing_faculty_id, major_id, course_type, id]
        );
        if (!rows.length) return res.status(404).json({ message: 'Course not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to update course' });
    }
});

app.delete('/api/courses/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await queryDatabase(`DELETE FROM courses WHERE course_id=$1`, [id]);
        res.status(204).end();
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to delete course' });
    }
});

// --- CRUD: Classes ---
app.post('/api/classes', async (req, res) => {
    const { course_id, semester_id, lecturer_id, classroom_id, weekday, start_time, end_time } = req.body;
    try {
        const rows = await queryDatabase(
            `INSERT INTO classes (course_id,semester_id,lecturer_id,classroom_id,weekday,start_time,end_time)
             VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
            [course_id, semester_id, lecturer_id, classroom_id, weekday, start_time, end_time]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to create class' });
    }
});

app.put('/api/classes/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { course_id, semester_id, lecturer_id, classroom_id, weekday, start_time, end_time } = req.body;
    try {
        const rows = await queryDatabase(
            `UPDATE classes SET course_id=$1,semester_id=$2,lecturer_id=$3,classroom_id=$4,weekday=$5,start_time=$6,end_time=$7
             WHERE class_id=$8 RETURNING *`,
            [course_id, semester_id, lecturer_id, classroom_id, weekday, start_time, end_time, id]
        );
        if (!rows.length) return res.status(404).json({ message: 'Class not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to update class' });
    }
});

app.delete('/api/classes/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
        await queryDatabase(`DELETE FROM classes WHERE class_id=$1`, [id]);
        res.status(204).end();
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to delete class' });
    }
});

// --- CRUD: Faculties ---
app.post('/api/faculties', async (req, res) => {
    const { faculty_name } = req.body;
    try {
        const rows = await queryDatabase(
            `INSERT INTO faculties (faculty_name) VALUES ($1) RETURNING *`,
            [faculty_name]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to create faculty' });
    }
});

app.put('/api/faculties/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { faculty_name } = req.body;
    try {
        const rows = await queryDatabase(
            `UPDATE faculties SET faculty_name=$1 WHERE faculty_id=$2 RETURNING *`,
            [faculty_name, id]
        );
        if (!rows.length) return res.status(404).json({ message: 'Faculty not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to update faculty' });
    }
});

app.delete('/api/faculties/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
        await queryDatabase(`DELETE FROM faculties WHERE faculty_id=$1`, [id]);
        res.status(204).end();
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to delete faculty' });
    }
});

// --- CRUD: Semesters ---
app.post('/api/semesters', async (req, res) => {
    const { semester_id, semester_name, start_date, end_date } = req.body;
    try {
        const rows = await queryDatabase(
            `INSERT INTO semesters (semester_id,semester_name,start_date,end_date)
             VALUES ($1,$2,$3,$4) RETURNING *`,
            [semester_id, semester_name, start_date, end_date]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to create semester' });
    }
});

app.put('/api/semesters/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { semester_name, start_date, end_date } = req.body;
    try {
        const rows = await queryDatabase(
            `UPDATE semesters SET semester_name=$1,start_date=$2,end_date=$3 WHERE semester_id=$4 RETURNING *`,
            [semester_name, start_date, end_date, id]
        );
        if (!rows.length) return res.status(404).json({ message: 'Semester not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to update semester' });
    }
});

app.delete('/api/semesters/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
        await queryDatabase(`DELETE FROM semesters WHERE semester_id=$1`, [id]);
        res.status(204).end();
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to delete semester' });
    }
});

// --- CRUD: Majors ---
app.post('/api/majors', async (req, res) => {
    const { major_name, faculty_id } = req.body;
    try {
        const rows = await queryDatabase(
            `INSERT INTO majors (major_name, faculty_id) VALUES ($1,$2) RETURNING *`,
            [major_name, faculty_id]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to create major' });
    }
});

app.put('/api/majors/:id', async (req, res) => {
    const id = Number(req.params.id);
    const { major_name, faculty_id } = req.body;
    try {
        const rows = await queryDatabase(
            `UPDATE majors SET major_name=$1, faculty_id=$2 WHERE major_id=$3 RETURNING *`,
            [major_name, faculty_id, id]
        );
        if (!rows.length) return res.status(404).json({ message: 'Major not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to update major' });
    }
});

app.delete('/api/majors/:id', async (req, res) => {
    const id = Number(req.params.id);
    try {
        await queryDatabase(`DELETE FROM majors WHERE major_id=$1`, [id]);
        res.status(204).end();
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to delete major' });
    }
});

// --- CRUD: Classrooms ---
app.post('/api/classrooms', async (req, res) => {
    const { classroom_id, capacity } = req.body;
    try {
        const rows = await queryDatabase(
            `INSERT INTO classrooms (classroom_id, capacity) VALUES ($1,$2) RETURNING *`,
            [classroom_id, capacity]
        );
        res.status(201).json(rows[0]);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to create classroom' });
    }
});

app.put('/api/classrooms/:id', async (req, res) => {
    const id = req.params.id;
    const { capacity } = req.body;
    try {
        const rows = await queryDatabase(
            `UPDATE classrooms SET capacity=$1 WHERE classroom_id=$2 RETURNING *`,
            [capacity, id]
        );
        if (!rows.length) return res.status(404).json({ message: 'Classroom not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to update classroom' });
    }
});

app.delete('/api/classrooms/:id', async (req, res) => {
    const id = req.params.id;
    try {
        await queryDatabase(`DELETE FROM classrooms WHERE classroom_id=$1`, [id]);
        res.status(204).end();
    } catch (err) {
        res.status(400).json({ message: err.message || 'Failed to delete classroom' });
    }
});

// --- Reports ---

app.get('/api/reports/student-gpa', async (req, res) => {
    // This query demonstrates joining tables and calling a database function.
    const sql = `
        SELECT
            s.student_id,
            s.first_name || ' ' || s.last_name AS student_name,
            m.major_name,
            ac.cohort_name,
            get_student_gpa(s.student_id)::float AS cumulative_gpa,
            (SELECT COUNT(DISTINCT cl.course_id)::int FROM enrollments e JOIN classes cl ON e.class_id = cl.class_id WHERE e.student_id = s.student_id) AS courses_taken,
            (SELECT COALESCE(SUM(c.credits), 0)::int FROM enrollments e JOIN classes cl ON e.class_id = cl.class_id JOIN courses c ON cl.course_id = c.course_id WHERE e.student_id = s.student_id AND e.enrollment_status = 'failed') AS failed_credits
        FROM students s
        LEFT JOIN majors m ON s.major_id = m.major_id
        LEFT JOIN academic_cohorts ac ON s.cohort_id = ac.cohort_id
        ORDER BY courses_taken DESC, failed_credits DESC;
    `;
    try {
        const report = await queryDatabase(sql);
        const normalized = report.map(r => ({
            ...r,
            cumulative_gpa: Number(r.cumulative_gpa),
            courses_taken: Number(r.courses_taken),
            failed_credits: Number(r.failed_credits)
        }));
        res.json(normalized);
    } catch (err) {
        res.status(500).json({ message: 'Failed to generate GPA report' });
    }
});

app.get('/api/reports/academic-warnings', async (req, res) => {
    const { gpaThreshold, creditThreshold } = req.query;
    const sql = `
        WITH student_stats AS (
            SELECT
                s.student_id,
                get_student_gpa(s.student_id)::float AS gpa,
                (SELECT COALESCE(SUM(c.credits), 0)::int FROM enrollments e JOIN classes cl ON e.class_id = cl.class_id JOIN courses c ON cl.course_id = c.course_id WHERE e.student_id = s.student_id AND e.enrollment_status = 'failed') AS failed_credits
            FROM students s
        )
        SELECT s.*, ss.gpa, ss.failed_credits,
               CASE
                   WHEN ss.gpa < $1 AND ss.failed_credits > $2 THEN 'Low GPA and High Failed Credits'
                   WHEN ss.gpa < $1 THEN 'Low GPA'
                   ELSE 'High Failed Credits'
               END AS warning_reason
        FROM students s
        JOIN student_stats ss ON s.student_id = ss.student_id
        WHERE ss.gpa < $1 OR ss.failed_credits > $2;
    `;
    try {
        const warnings = await queryDatabase(sql, [gpaThreshold, creditThreshold]);
        // The frontend expects a nested 'student' object
        const formattedWarnings = warnings.map(w => ({
            gpa: Number(w.gpa),
            failed_credits: Number(w.failed_credits),
            warning_reason: w.warning_reason,
            student: {
                student_id: w.student_id,
                first_name: w.first_name,
                last_name: w.last_name,
                dob: w.dob,
                email: w.email,
                major_id: w.major_id,
                cohort_id: w.cohort_id,
                program_id: w.program_id
            }
        }));
        res.json(formattedWarnings);
    } catch (err) {
        res.status(500).json({ message: 'Failed to generate academic warnings report' });
    }
});

app.get('/api/reports/lecturer-salaries', async (req, res) => {
    const { semesterId, hoursThreshold } = req.query;
    const sql = `
        SELECT
            l.*,
            get_lecturer_monthly_salary(l.lecturer_id, $1)::float AS monthly_salary,
            (SELECT COALESCE(SUM(c.teaching_hours_per_week), 0)::int
             FROM classes cl
             JOIN courses c ON cl.course_id = c.course_id
             WHERE cl.lecturer_id = l.lecturer_id AND cl.semester_id = $1) AS total_hours_per_week
        FROM lecturers l;
    `;
    try {
        const salaries = await queryDatabase(sql, [semesterId]);
        const formattedSalaries = salaries.map(s => ({
            monthly_salary: Number(s.monthly_salary),
            total_hours_per_week: Number(s.total_hours_per_week),
            is_below_threshold: Number(s.total_hours_per_week) < Number(hoursThreshold),
            lecturer: {
                lecturer_id: s.lecturer_id,
                first_name: s.first_name,
                last_name: s.last_name,
                email: s.email,
                faculty_id: s.faculty_id,
                hourly_rate: s.hourly_rate
            }
        }));
        res.json(formattedSalaries);
    } catch (err) {
        res.status(500).json({ message: 'Failed to generate lecturer salaries report' });
    }
});

app.get('/api/reports/classroom-usage', async (req, res) => {
    const { semesterId } = req.query;
    const sql = `
        SELECT
            cr.*,
            COUNT(cl.class_id) AS usage_count
        FROM classrooms cr
        LEFT JOIN classes cl ON cr.classroom_id = cl.classroom_id AND cl.semester_id = $1
        GROUP BY cr.classroom_id
        ORDER BY usage_count DESC;
    `;
    try {
        const usage = await queryDatabase(sql, [semesterId]);
        const formattedUsage = usage.map(u => ({
            usage_count: parseInt(u.usage_count, 10),
            classroom: {
                classroom_id: u.classroom_id,
                capacity: u.capacity
            }
        }));
        res.json(formattedUsage);
    } catch (err) {
        res.status(500).json({ message: 'Failed to generate classroom usage report' });
    }
});


// === START SERVER ===
app.listen(port, () => {
    console.log(`Backend server is running on http://localhost:${port}`);
});
