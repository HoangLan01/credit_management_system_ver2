
-- Drop all tables and types in case they already exist, for easy re-running
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
COMMENT ON SCHEMA public IS 'standard public schema';


-- =============================================================================
-- 1. CUSTOM TYPES (ENUMs)
-- =============================================================================
-- Using ENUM types makes data cleaner and more constrained than simple VARCHARs.

CREATE TYPE course_type_enum AS ENUM (
    'fundamental',     -- General courses, excluded from non-major limit
    'major-specific',  -- Core courses for a major
    'elective'         -- Optional courses
);

CREATE TYPE enrollment_status_enum AS ENUM (
    'enrolled',    -- Currently taking the class
    'passed',      -- Completed and passed
    'failed',      -- Completed and failed
    'withdrawn'    -- Withdrew from the class
);

CREATE TYPE weekday_enum AS ENUM (
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday'
);

-- =============================================================================
-- 2. CORE ENTITY TABLES (Faculties, Majors, Lecturers, etc.)
-- =============================================================================
-- These tables represent the main "nouns" of the system.

-- R1, R2: Faculties
CREATE TABLE faculties (
    faculty_id SERIAL PRIMARY KEY,
    faculty_name VARCHAR(255) NOT NULL UNIQUE
);

-- R2: Majors (managed by a faculty)
CREATE TABLE majors (
    major_id SERIAL PRIMARY KEY,
    major_name VARCHAR(255) NOT NULL UNIQUE,
    faculty_id INT NOT NULL REFERENCES faculties(faculty_id) ON DELETE RESTRICT
);

-- R1, R8: Lecturers (managed by a faculty)
CREATE TABLE lecturers (
    lecturer_id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    faculty_id INT NOT NULL REFERENCES faculties(faculty_id) ON DELETE RESTRICT,
    hourly_rate DECIMAL(10, 2) NOT NULL CHECK (hourly_rate >= 0)
);

-- R1: Academic Cohorts (e.g., "K65", "K66")
CREATE TABLE academic_cohorts (
    cohort_id SERIAL PRIMARY KEY,
    cohort_name VARCHAR(50) NOT NULL UNIQUE, -- e.g., "K65"
    start_year INT NOT NULL
);

-- R2: Training Programs (e.g., "Standard", "Honors")
CREATE TABLE training_programs (
    program_id SERIAL PRIMARY KEY,
    program_name VARCHAR(100) NOT NULL UNIQUE
);

-- R1, R2, R5: Students
CREATE TABLE students (
    student_id VARCHAR(20) PRIMARY KEY, -- R2: Structured ID, e.g., "K65-IT-STD-0001"
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    dob DATE NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    major_id INT NOT NULL REFERENCES majors(major_id) ON DELETE RESTRICT,
    cohort_id INT NOT NULL REFERENCES academic_cohorts(cohort_id) ON DELETE RESTRICT,
    program_id INT NOT NULL REFERENCES training_programs(program_id) ON DELETE RESTRICT
);

-- R1, R7: Classrooms
CREATE TABLE classrooms (
    classroom_id VARCHAR(20) PRIMARY KEY, -- e.g., "D9-101"
    capacity INT NOT NULL CHECK (capacity > 0)
);

-- R1: Semesters
CREATE TABLE semesters (
    semester_id INT PRIMARY KEY, -- e.g., 20241 (Year 2024, Sem 1), 20242 (Year 2024, Sem 2)
    semester_name VARCHAR(100) NOT NULL UNIQUE, -- e.g., "Fall 2024"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    CHECK (end_date > start_date)
);

-- R1, R2, R4, R5: Courses
CREATE TABLE courses (
    course_id VARCHAR(10) PRIMARY KEY, -- R2: Structured ID, e.g., "IT3030"
    course_name VARCHAR(255) NOT NULL,
    credits INT NOT NULL CHECK (credits > 0),
    teaching_hours_per_week INT NOT NULL CHECK (teaching_hours_per_week > 0), -- R8: For salary
    managing_faculty_id INT NOT NULL REFERENCES faculties(faculty_id) ON DELETE RESTRICT,
    major_id INT REFERENCES majors(major_id) ON DELETE RESTRICT, -- The major this course is for
    course_type course_type_enum NOT NULL
);

-- =============================================================================
-- 3. RELATIONSHIP TABLES (Linking entities)
-- =============================================================================

-- R4: Prerequisite Courses (Many-to-Many on Courses)
CREATE TABLE prerequisites (
    course_id VARCHAR(10) NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    prereq_course_id VARCHAR(10) NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, prereq_course_id),
    CHECK (course_id <> prereq_course_id) -- A course cannot be its own prerequisite
);

-- R8: "Lecturers prepare courses" (can be M:M, separate from teaching)
CREATE TABLE course_preparers (
    course_id VARCHAR(10) NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    lecturer_id INT NOT NULL REFERENCES lecturers(lecturer_id) ON DELETE CASCADE,
    PRIMARY KEY (course_id, lecturer_id)
);

-- R1, R7, R8: Classes (a specific offering of a course in a semester)
CREATE TABLE classes (
    class_id SERIAL PRIMARY KEY,
    course_id VARCHAR(10) NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,
    semester_id INT NOT NULL REFERENCES semesters(semester_id) ON DELETE CASCADE,
    lecturer_id INT NOT NULL REFERENCES lecturers(lecturer_id) ON DELETE RESTRICT,
    classroom_id VARCHAR(20) NOT NULL REFERENCES classrooms(classroom_id) ON DELETE RESTRICT,
    weekday weekday_enum NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    CHECK (end_time > start_time)
);

-- R3, R4: Enrollments (linking students to classes)
CREATE TABLE enrollments (
    enrollment_id SERIAL PRIMARY KEY,
    student_id VARCHAR(20) NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    class_id INT NOT NULL REFERENCES classes(class_id) ON DELETE CASCADE,
    grade_10_scale DECIMAL(4, 2), -- Grade on a 10-point scale (e.g., 8.5)
    grade_4_scale DECIMAL(3, 2),  -- Grade on a 4-point scale (e.g., 3.7)
    grade_letter VARCHAR(2),      -- Grade (e.g., "B+", "A")
    enrollment_status enrollment_status_enum NOT NULL DEFAULT 'enrolled',
    UNIQUE (student_id, class_id) -- A student can only enroll in the same class once
);

-- =============================================================================
-- 4. INDEXES FOR PERFORMANCE
-- =============================================================================
-- Create indexes on foreign keys and frequently queried columns.

CREATE INDEX ON students (major_id);
CREATE INDEX ON courses (managing_faculty_id);
CREATE INDEX ON courses (major_id);
CREATE INDEX ON classes (course_id);
CREATE INDEX ON classes (semester_id);
CREATE INDEX ON classes (lecturer_id);
CREATE INDEX ON classes (classroom_id);
CREATE INDEX ON enrollments (student_id);
CREATE INDEX ON enrollments (class_id);
CREATE INDEX ON enrollments (student_id, enrollment_status);

-- =============================================================================
-- 5. TRIGGER FUNCTIONS (To enforce business logic)
-- =============================================================================

-- R7: Trigger to prevent classroom schedule overlaps
CREATE OR REPLACE FUNCTION check_classroom_schedule_overlap()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM classes
        WHERE classroom_id = NEW.classroom_id
          AND semester_id = NEW.semester_id
          AND weekday = NEW.weekday
          AND class_id <> NEW.class_id -- Don't compare with itself on UPDATE
          AND (NEW.start_time, NEW.end_time) OVERLAPS (start_time, end_time)
    ) THEN
        RAISE EXCEPTION 'Classroom schedule overlap detected for % in semester % on %.',
            NEW.classroom_id, NEW.semester_id, NEW.weekday;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_classroom_overlap
BEFORE INSERT OR UPDATE ON classes
FOR EACH ROW EXECUTE FUNCTION check_classroom_schedule_overlap();


-- R8: Trigger to check lecturer's 8-class-per-semester limit
CREATE OR REPLACE FUNCTION check_lecturer_class_limit()
RETURNS TRIGGER AS $$
DECLARE
    class_count INT;
BEGIN
    SELECT COUNT(*) INTO class_count
    FROM classes
    WHERE lecturer_id = NEW.lecturer_id
      AND semester_id = NEW.semester_id;

    IF class_count >= 8 THEN
        RAISE EXCEPTION 'Lecturer ID % already teaches 8 classes in semester %.',
            NEW.lecturer_id, NEW.semester_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_lecturer_limit
BEFORE INSERT ON classes
FOR EACH ROW EXECUTE FUNCTION check_lecturer_class_limit();


-- R3: Trigger to prevent student from taking > 20 credits per semester
CREATE OR REPLACE FUNCTION check_student_credit_limit()
RETURNS TRIGGER AS $$
DECLARE
    total_credits INT;
    new_credits INT;
BEGIN
    -- Get credits for the new class
    SELECT c.credits INTO new_credits
    FROM courses c
    JOIN classes cl ON c.course_id = cl.course_id
    WHERE cl.class_id = NEW.class_id;

    -- Get sum of credits for all *other* classes this student is enrolled in this semester
    SELECT COALESCE(SUM(c.credits), 0) INTO total_credits
    FROM enrollments e
    JOIN classes cl ON e.class_id = cl.class_id
    JOIN courses c ON cl.course_id = c.course_id
    WHERE e.student_id = NEW.student_id
      AND cl.semester_id = (SELECT semester_id FROM classes WHERE class_id = NEW.class_id)
      AND e.enrollment_id <> NEW.enrollment_id; -- For UPDATE scenarios

    IF (total_credits + new_credits) > 20 THEN
        RAISE EXCEPTION 'Student ID % exceeds 20 credit limit for this semester. (Current: %, New: %, Total: %)',
            NEW.student_id, total_credits, new_credits, (total_credits + new_credits);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_student_credits
BEFORE INSERT ON enrollments
FOR EACH ROW EXECUTE FUNCTION check_student_credit_limit();


-- R3: Trigger to prevent student from taking same course twice in one semester
CREATE OR REPLACE FUNCTION check_student_course_semester_violation()
RETURNS TRIGGER AS $$
DECLARE
    new_course_id VARCHAR(10);
    new_semester_id INT;
BEGIN
    SELECT course_id, semester_id INTO new_course_id, new_semester_id
    FROM classes
    WHERE class_id = NEW.class_id;

    IF EXISTS (
        SELECT 1
        FROM enrollments e
        JOIN classes cl ON e.class_id = cl.class_id
        WHERE e.student_id = NEW.student_id
          AND cl.semester_id = new_semester_id
          AND cl.course_id = new_course_id
    ) THEN
        RAISE EXCEPTION 'Student ID % is already enrolled in course % for semester %.',
            NEW.student_id, new_course_id, new_semester_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_student_course_semester
BEFORE INSERT ON enrollments
FOR EACH ROW EXECUTE FUNCTION check_student_course_semester_violation();


-- R7: Trigger to check classroom capacity
CREATE OR REPLACE FUNCTION check_classroom_capacity()
RETURNS TRIGGER AS $$
DECLARE
    current_enrollment INT;
    room_capacity INT;
BEGIN
    SELECT COUNT(*) INTO current_enrollment
    FROM enrollments
    WHERE class_id = NEW.class_id;

    SELECT c.capacity INTO room_capacity
    FROM classrooms c
    JOIN classes cl ON c.classroom_id = cl.classroom_id
    WHERE cl.class_id = NEW.class_id;

    IF (current_enrollment + 1) > room_capacity THEN
        RAISE EXCEPTION 'Class % is full. Capacity: %, Current: %',
            NEW.class_id, room_capacity, current_enrollment;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_classroom_capacity
BEFORE INSERT ON enrollments
FOR EACH ROW EXECUTE FUNCTION check_classroom_capacity();


-- R4: Trigger to check if student has completed all prerequisites
CREATE OR REPLACE FUNCTION check_prerequisites()
RETURNS TRIGGER AS $$
DECLARE
    prereq RECORD;
    completed_prereqs INT;
    total_prereqs INT;
    new_course_id VARCHAR(10);
BEGIN
    -- Find the course this class belongs to
    SELECT course_id INTO new_course_id
    FROM classes
    WHERE class_id = NEW.class_id;

    -- Count total prerequisites for this course
    SELECT COUNT(*) INTO total_prereqs
    FROM prerequisites
    WHERE course_id = new_course_id;

    -- If there are no prerequisites, allow enrollment
    IF total_prereqs = 0 THEN
        RETURN NEW;
    END IF;

    -- Count how many of those prerequisites the student has passed
    SELECT COUNT(DISTINCT p.prereq_course_id)
    INTO completed_prereqs
    FROM prerequisites p
    INNER JOIN classes cl ON p.prereq_course_id = cl.course_id
    INNER JOIN enrollments e ON cl.class_id = e.class_id
    WHERE p.course_id = new_course_id
      AND e.student_id = NEW.student_id
      AND e.enrollment_status = 'passed';

    IF completed_prereqs < total_prereqs THEN
        RAISE EXCEPTION 'Student ID % has not completed all prerequisites for course %. Required: %, Completed: %',
            NEW.student_id, new_course_id, total_prereqs, completed_prereqs;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_prerequisites
BEFORE INSERT ON enrollments
FOR EACH ROW EXECUTE FUNCTION check_prerequisites();


-- R5: Trigger to check 3-course non-major limit
CREATE OR REPLACE FUNCTION check_non_major_course_limit()
RETURNS TRIGGER AS $$
DECLARE
    student_major INT;
    course_major INT;
    course_type course_type_enum;
    non_major_count INT;
BEGIN
    -- Get student's major
    SELECT major_id INTO student_major
    FROM students
    WHERE student_id = NEW.student_id;

    -- Get new course's details
    SELECT c.major_id, c.course_type INTO course_major, course_type
    FROM courses c
    JOIN classes cl ON c.course_id = cl.course_id
    WHERE cl.class_id = NEW.class_id;

    -- Only check if it's NOT a fundamental course and IS outside the student's major
    IF course_type <> 'fundamental' AND course_major <> student_major THEN
        -- Count existing non-major courses
        SELECT COUNT(DISTINCT c.course_id)
        INTO non_major_count
        FROM enrollments e
        JOIN classes cl ON e.class_id = cl.class_id
        JOIN courses c ON cl.course_id = c.course_id
        WHERE e.student_id = NEW.student_id
          AND c.course_type <> 'fundamental'
          AND c.major_id <> student_major;

        IF non_major_count >= 3 THEN
            RAISE EXCEPTION 'Student ID % has reached the 3-course limit for non-major courses.',
                NEW.student_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_non_major_limit
BEFORE INSERT ON enrollments
FOR EACH ROW EXECUTE FUNCTION check_non_major_course_limit();


-- =============================================================================
-- 6. CALCULATION FUNCTIONS (GPA and Salary)
-- =============================================================================

-- R6: Function to calculate a student's GPA
CREATE OR REPLACE FUNCTION get_student_gpa(in_student_id VARCHAR(20))
RETURNS DECIMAL(3, 2) AS $$
DECLARE
    total_weighted_points DECIMAL(10, 2) := 0;
    total_credits INT := 0;
    course_record RECORD;
    highest_grade DECIMAL(3, 2);
    course_credits INT;
BEGIN
    -- Loop through all *distinct* courses the student has taken
    FOR course_record IN
        SELECT DISTINCT c.course_id, c.credits
        FROM courses c
        JOIN classes cl ON c.course_id = cl.course_id
        JOIN enrollments e ON cl.class_id = e.class_id
        WHERE e.student_id = in_student_id
          AND e.enrollment_status IN ('passed', 'failed')
    LOOP
        course_credits := course_record.credits;

        -- Find the highest 4-point-scale grade achieved for this course
        SELECT MAX(e.grade_4_scale)
        INTO highest_grade
        FROM enrollments e
        JOIN classes cl ON e.class_id = cl.class_id
        WHERE e.student_id = in_student_id
          AND cl.course_id = course_record.course_id
          AND e.grade_4_scale IS NOT NULL;
        
        -- Only count towards GPA if a valid grade was found (R6)
        IF highest_grade IS NOT NULL THEN
            total_weighted_points := total_weighted_points + (highest_grade * course_credits);
            total_credits := total_credits + course_credits;
        END IF;
    END LOOP;

    IF total_credits = 0 THEN
        RETURN 0.00;
    END IF;

    RETURN total_weighted_points / total_credits;
END;
$$ LANGUAGE plpgsql;


-- R8: Function to calculate a lecturer's monthly salary for a semester
-- (Semester is 16 weeks, salary is total / 4 months)
CREATE OR REPLACE FUNCTION get_lecturer_monthly_salary(in_lecturer_id INT, in_semester_id INT)
RETURNS DECIMAL(10, 2) AS $$
DECLARE
    total_hours_per_week INT;
    total_semester_hours INT;
    lecturer_rate DECIMAL(10, 2);
    monthly_salary DECIMAL(10, 2);
BEGIN
    -- Get lecturer's hourly rate
    SELECT hourly_rate INTO lecturer_rate
    FROM lecturers
    WHERE lecturer_id = in_lecturer_id;

    -- Get total teaching hours *per week* for the semester
    SELECT COALESCE(SUM(c.teaching_hours_per_week), 0)
    INTO total_hours_per_week
    FROM classes cl
    JOIN courses c ON cl.course_id = c.course_id
    WHERE cl.lecturer_id = in_lecturer_id
      AND cl.semester_id = in_semester_id;

    -- Total hours in semester (16 weeks)
    total_semester_hours := total_hours_per_week * 16;

    -- Monthly salary (total / 4)
    monthly_salary := (total_semester_hours * lecturer_rate) / 4.0;

    RETURN monthly_salary;
END;
$$ LANGUAGE plpgsql;


-- =============================================================================
-- 7. SAMPLE DATA (R9)
-- =============================================================================

-- Faculties
INSERT INTO faculties (faculty_name) VALUES
('School of Information and Communication Technology'),
('School of Electrical Engineering'),
('School of Mechanical Engineering');

-- Majors
INSERT INTO majors (major_name, faculty_id) VALUES
('Computer Science', 1),
('Data Science', 1),
('Electronics and Telecommunications', 2);

-- Lecturers
INSERT INTO lecturers (first_name, last_name, email, faculty_id, hourly_rate) VALUES
('Alice', 'Smith', 'alice.s@example.com', 1, 50.00),
('Bob', 'Johnson', 'bob.j@example.com', 1, 55.00),
('Charlie', 'Lee', 'charlie.l@example.com', 2, 52.00);

-- Cohorts and Programs
INSERT INTO academic_cohorts (cohort_name, start_year) VALUES ('K65', 2020), ('K66', 2021);
INSERT INTO training_programs (program_name) VALUES ('Standard'), ('Honors');

-- Students
INSERT INTO students (student_id, first_name, last_name, dob, email, major_id, cohort_id, program_id) VALUES
('K65-IT-STD-0001', 'David', 'Brown', '2002-05-10', 'david.b@example.com', 1, 1, 1),
('K65-IT-STD-0002', 'Emily', 'Davis', '2002-08-15', 'emily.d@example.com', 1, 1, 1),
('K66-DS-HON-0001', 'Frank', 'Miller', '2003-01-20', 'frank.m@example.com', 2, 2, 2);

-- Classrooms
INSERT INTO classrooms (classroom_id, capacity) VALUES ('D9-101', 60), ('D9-102', 60), ('C1-201', 80);

-- Semesters
INSERT INTO semesters (semester_id, semester_name, start_date, end_date) VALUES
(20231, 'Spring 2023', '2023-01-09', '2023-05-12'),
(20232, 'Fall 2023', '2023-08-21', '2023-12-15');

-- Courses
INSERT INTO courses (course_id, course_name, credits, teaching_hours_per_week, managing_faculty_id, major_id, course_type) VALUES
('IT1010', 'Introduction to Computing', 3, 3, 1, 1, 'fundamental'),
('IT3030', 'Database Systems', 3, 3, 1, 1, 'major-specific'),
('IT3040', 'Advanced Databases', 3, 3, 1, 1, 'major-specific'),
('EE2000', 'Circuit Theory', 3, 3, 2, 3, 'major-specific');

-- Prerequisites (IT3040 requires IT3030)
INSERT INTO prerequisites (course_id, prereq_course_id) VALUES ('IT3040', 'IT3030');

-- ### SEMESTER 1: Spring 2023 (20231) ###
-- Classes
INSERT INTO classes (course_id, semester_id, lecturer_id, classroom_id, weekday, start_time, end_time) VALUES
('IT1010', 20231, 1, 'D9-101', 'Monday', '09:00:00', '12:00:00'),  -- Class 1
('IT3030', 20231, 2, 'D9-102', 'Tuesday', '13:00:00', '16:00:00'); -- Class 2

-- Enrollments
-- David takes Intro (Class 1) and DB (Class 2)
INSERT INTO enrollments (student_id, class_id, grade_10_scale, grade_4_scale, grade_letter, enrollment_status) VALUES
('K65-IT-STD-0001', 1, 8.5, 3.7, 'A', 'passed'),
('K65-IT-STD-0001', 2, 7.9, 3.0, 'B', 'passed');
-- Emily takes Intro (Class 1) and fails
INSERT INTO enrollments (student_id, class_id, grade_10_scale, grade_4_scale, grade_letter, enrollment_status) VALUES
('K65-IT-STD-0002', 1, 3.5, 0.0, 'F', 'failed');

-- ### SEMESTER 2: Fall 2023 (20232) ###
-- Classes
INSERT INTO classes (course_id, semester_id, lecturer_id, classroom_id, weekday, start_time, end_time) VALUES
('IT1010', 20232, 1, 'D9-101', 'Monday', '09:00:00', '12:00:00'),  -- Class 3 (Retake class)
('IT3040', 20232, 2, 'D9-102', 'Tuesday', '13:00:00', '16:00:00'), -- Class 4 (Advanced DB)
('EE2000', 20232, 3, 'C1-201', 'Wednesday', '09:00:00', '12:00:00'); -- Class 5 (Non-major)

-- Enrollments
-- Emily retakes Intro (Class 3) and passes
INSERT INTO enrollments (student_id, class_id, grade_10_scale, grade_4_scale, grade_letter, enrollment_status) VALUES
('K65-IT-STD-0002', 3, 8.0, 3.0, 'B', 'passed');
-- David takes Advanced DB (Class 4). This should work (prereq met)
INSERT INTO enrollments (student_id, class_id) VALUES ('K65-IT-STD-0001', 4);
-- David takes Circuit Theory (Class 5). This is his 1st non-major course.
INSERT INTO enrollments (student_id, class_id) VALUES ('K65-IT-STD-0001', 5);

-- Example of a FAILED insert due to prerequisites:
-- Frank (who has no history) tries to take Advanced DB (Class 4)
-- This will raise an exception from 'trg_check_prerequisites'
/*
INSERT INTO enrollments (student_id, class_id) VALUES ('K66-DS-HON-0001', 4);
-- ERROR:  Student ID K66-DS-HON-0001 has not completed all prerequisites for course IT3040. Required: 1, Completed: 0
*/

-- Example of a FAILED insert due to credit limit:
-- This will raise an exception from 'trg_check_student_credits' if total credits > 20
/*
-- Assume David is already enrolled in 18 credits in 20232...
INSERT INTO enrollments (student_id, class_id) VALUES ('K65-IT-STD-0001', ...); -- ...for a 3-credit class
*/

-- =============================================================================
-- 8. QUERY EXAMPLES
-- =============================================================================

-- Get David's GPA (R6)
SELECT get_student_gpa('K65-IT-STD-0001');

-- Get Emily's GPA (R6) (Should use highest grade: 8.0, not 3.5)
SELECT get_student_gpa('K65-IT-STD-0002');

-- Get Lecturer Bob's (ID 2) monthly salary for Spring 2023 (ID 20231) (R8)
-- He taught one 3-hour/week class (IT3030) at $55/hr
-- (3 hours/week * 16 weeks) * $55 = $2640 total
-- $2640 / 4 months = $660/month
SELECT get_lecturer_monthly_salary(2, 20231);

-- Get Lecturer Bob's (ID 2) monthly salary for Fall 2023 (ID 20232)
-- He taught one 3-hour/week class (IT3040)
SELECT get_lecturer_monthly_salary(2, 20232);