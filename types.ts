
export enum CourseType {
    FUNDAMENTAL = 'fundamental',
    MAJOR_SPECIFIC = 'major-specific',
    ELECTIVE = 'elective'
}

export enum EnrollmentStatus {
    ENROLLED = 'enrolled',
    PASSED = 'passed',
    FAILED = 'failed',
    WITHDRAWN = 'withdrawn'
}

export enum Weekday {
    MONDAY = 'Monday',
    TUESDAY = 'Tuesday',
    WEDNESDAY = 'Wednesday',
    THURSDAY = 'Thursday',
    FRIDAY = 'Friday',
    SATURDAY = 'Saturday',
    SUNDAY = 'Sunday'
}

export interface Faculty {
    faculty_id: number;
    faculty_name: string;
}

export interface Major {
    major_id: number;
    major_name: string;
    faculty_id: number;
}

export interface Lecturer {
    lecturer_id: number;
    first_name: string;
    last_name: string;
    email: string;
    faculty_id: number;
    hourly_rate: number;
}

export interface AcademicCohort {
    cohort_id: number;
    cohort_name: string;
    start_year: number;
}

export interface TrainingProgram {
    program_id: number;
    program_name: string;
}

export interface Student {
    student_id: string;
    first_name: string;
    last_name: string;
    dob: string; // Date as string
    email: string;
    major_id: number;
    cohort_id: number;
    program_id: number;
}

export interface Classroom {
    classroom_id: string;
    capacity: number;
}

export interface Semester {
    semester_id: number;
    semester_name: string;
    start_date: string; // Date as string
    end_date: string; // Date as string
}

export interface Course {
    course_id: string;
    course_name: string;
    credits: number;
    teaching_hours_per_week: number;
    managing_faculty_id: number;
    major_id: number | null;
    course_type: CourseType;
}

export interface Class {
    class_id: number;
    course_id: string;
    semester_id: number;
    lecturer_id: number;
    classroom_id: string;
    weekday: Weekday;
    start_time: string; // Time as string
    end_time: string; // Time as string
}

export interface Enrollment {
    enrollment_id: number;
    student_id: string;
    class_id: number;
    grade_10_scale: number | null;
    grade_4_scale: number | null;
    grade_letter: string | null;
    enrollment_status: EnrollmentStatus;
}

// Custom types for reports
export interface StudentGpaRecord {
    student_id: string;
    student_name: string;
    major_name: string;
    cohort_name: string;
    semester_gpa: number;
    cumulative_gpa: number;
    courses_taken: number;
    failed_credits: number;
}

export interface AcademicWarning {
    student: Student;
    gpa: number;
    failed_credits: number;
    warning_reason: string;
}

export interface LecturerSalary {
    lecturer: Lecturer;
    monthly_salary: number;
    total_hours_per_week: number;
    is_below_threshold: boolean;
}

export interface ClassroomUsage {
    classroom: Classroom;
    usage_count: number;
}
