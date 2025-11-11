
import { 
    Student, Course, Lecturer, Faculty, Semester, Class, Enrollment, Major, Classroom,
    StudentGpaRecord, AcademicWarning, LecturerSalary, ClassroomUsage
} from '../types';

// =============================================================================
// API Service Layer
// =============================================================================
// This file now contains functions that fetch data from a backend API.
// The mock data has been removed. You will need to create a backend server
// (e.g., using Node.js/Express, Python/Django, etc.) that connects to your
// PostgreSQL database and exposes these API endpoints.
// =============================================================================

const API_BASE_URL = '/api'; // A base URL for all API calls

/**
 * A helper function to handle API requests, JSON parsing, and errors.
 * @param endpoint The API endpoint to call (e.g., '/students')
 * @param options The options for the fetch call
 * @returns The JSON response from the API
 */
async function apiFetch<T>(endpoint: string, options?: RequestInit): Promise<T> {
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
        if (!response.ok) {
            const errorInfo = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(`API Error: ${response.status} - ${errorInfo.message || 'Unknown error'}`);
        }
        return await response.json() as T;
    } catch (error) {
        console.error(`Failed to fetch from ${endpoint}:`, error);
        // In a real app, you might want to show a user-facing error message here.
        throw error; // Re-throw the error to be handled by the calling component
    }
}


const api = {
    // Each function now makes a `fetch` call to a backend API endpoint.
    // These functions return a Promise that resolves with the data from the API.

    getStudents: (q?: string): Promise<Student[]> => apiFetch<Student[]>(q ? `/students?q=${encodeURIComponent(q)}` : '/students'),
    getLecturers: (q?: string): Promise<Lecturer[]> => apiFetch<Lecturer[]>(q ? `/lecturers?q=${encodeURIComponent(q)}` : '/lecturers'),
    getCourses: (q?: string): Promise<Course[]> => apiFetch<Course[]>(q ? `/courses?q=${encodeURIComponent(q)}` : '/courses'),
    getFaculties: (): Promise<Faculty[]> => apiFetch<Faculty[]>('/faculties'),
    getSemesters: (): Promise<Semester[]> => apiFetch<Semester[]>('/semesters'),
    getClasses: (): Promise<Class[]> => apiFetch<Class[]>('/classes'),
    getMajors: (): Promise<Major[]> => apiFetch<Major[]>('/majors'),
    getClassrooms: (): Promise<Classroom[]> => apiFetch<Classroom[]>('/classrooms'),
    getEnrollments: (): Promise<Enrollment[]> => apiFetch<Enrollment[]>('/enrollments'),

    // Report Functions - These now call specific report endpoints on the backend.
    // The complex logic of calculating reports is now handled by the server.

    getStudentGpaReport: (semesterId?: number): Promise<StudentGpaRecord[]> => {
        const endpoint = semesterId ? `/reports/student-gpa?semesterId=${semesterId}` : '/reports/student-gpa';
        return apiFetch<StudentGpaRecord[]>(endpoint);
    },

    getAcademicWarnings: (gpaThreshold: number, creditThreshold: number): Promise<AcademicWarning[]> => {
        const endpoint = `/reports/academic-warnings?gpaThreshold=${gpaThreshold}&creditThreshold=${creditThreshold}`;
        return apiFetch<AcademicWarning[]>(endpoint);
    },

    getLecturerSalaries: (semesterId: number, hoursThreshold: number): Promise<LecturerSalary[]> => {
        const endpoint = `/reports/lecturer-salaries?semesterId=${semesterId}&hoursThreshold=${hoursThreshold}`;
        return apiFetch<LecturerSalary[]>(endpoint);
    },
    
    getClassroomUsage: (semesterId: number): Promise<ClassroomUsage[]> => {
        const endpoint = `/reports/classroom-usage?semesterId=${semesterId}`;
        return apiFetch<ClassroomUsage[]>(endpoint);
    },

    // TODO: Implement functions for CREATE, UPDATE, DELETE operations.
    // Students
    createStudent: (student: Student): Promise<Student> =>
        apiFetch<Student>('/students', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(student),
        }),

    updateStudent: (studentId: string, updates: Partial<Student>): Promise<Student> =>
        apiFetch<Student>(`/students/${encodeURIComponent(studentId)}`, {
            method: 'PUT', // or 'PATCH'
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        }),

    deleteStudent: (studentId: string): Promise<void> =>
        apiFetch<void>(`/students/${encodeURIComponent(studentId)}`, { method: 'DELETE' }),

    // Lecturers
    createLecturer: (lecturer: Omit<Lecturer, 'lecturer_id'>): Promise<Lecturer> =>
        apiFetch<Lecturer>('/lecturers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lecturer),
        }),
    updateLecturer: (lecturerId: number, updates: Partial<Lecturer>): Promise<Lecturer> =>
        apiFetch<Lecturer>(`/lecturers/${lecturerId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        }),
    deleteLecturer: (lecturerId: number): Promise<void> =>
        apiFetch<void>(`/lecturers/${lecturerId}`, { method: 'DELETE' }),

    // Courses
    createCourse: (course: Course): Promise<Course> =>
        apiFetch<Course>('/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(course),
        }),
    updateCourse: (courseId: string, updates: Partial<Course>): Promise<Course> =>
        apiFetch<Course>(`/courses/${encodeURIComponent(courseId)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        }),
    deleteCourse: (courseId: string): Promise<void> =>
        apiFetch<void>(`/courses/${encodeURIComponent(courseId)}`, { method: 'DELETE' }),

    // Classes
    createClass: (cls: Omit<Class, 'class_id'>): Promise<Class> =>
        apiFetch<Class>('/classes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cls),
        }),
    updateClass: (classId: number, updates: Partial<Class>): Promise<Class> =>
        apiFetch<Class>(`/classes/${classId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        }),
    deleteClass: (classId: number): Promise<void> =>
        apiFetch<void>(`/classes/${classId}`, { method: 'DELETE' }),

    // Faculties
    createFaculty: (faculty_name: string): Promise<Faculty> =>
        apiFetch<Faculty>('/faculties', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ faculty_name }),
        }),
    updateFaculty: (faculty_id: number, faculty_name: string): Promise<Faculty> =>
        apiFetch<Faculty>(`/faculties/${faculty_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ faculty_name }),
        }),
    deleteFaculty: (faculty_id: number): Promise<void> =>
        apiFetch<void>(`/faculties/${faculty_id}`, { method: 'DELETE' }),

    // Semesters
    createSemester: (semester: Semester): Promise<Semester> =>
        apiFetch<Semester>('/semesters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(semester),
        }),
    updateSemester: (semester_id: number, updates: Partial<Semester>): Promise<Semester> =>
        apiFetch<Semester>(`/semesters/${semester_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        }),
    deleteSemester: (semester_id: number): Promise<void> =>
        apiFetch<void>(`/semesters/${semester_id}`, { method: 'DELETE' }),

    // Majors
    createMajor: (major_name: string, faculty_id: number): Promise<Major> =>
        apiFetch<Major>('/majors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ major_name, faculty_id }),
        }),
    updateMajor: (major_id: number, updates: Partial<Major>): Promise<Major> =>
        apiFetch<Major>(`/majors/${major_id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
        }),
    deleteMajor: (major_id: number): Promise<void> =>
        apiFetch<void>(`/majors/${major_id}`, { method: 'DELETE' }),

    // Classrooms
    createClassroom: (classroom_id: string, capacity: number): Promise<Classroom> =>
        apiFetch<Classroom>('/classrooms', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ classroom_id, capacity }),
        }),
    updateClassroom: (classroom_id: string, capacity: number): Promise<Classroom> =>
        apiFetch<Classroom>(`/classrooms/${encodeURIComponent(classroom_id)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ capacity }),
        }),
    deleteClassroom: (classroom_id: string): Promise<void> =>
        apiFetch<void>(`/classrooms/${encodeURIComponent(classroom_id)}`, { method: 'DELETE' }),
};

export default api;
