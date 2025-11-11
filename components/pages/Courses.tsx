import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { Course, CourseType, Faculty, Major } from '../../types';

const CoursesPage: React.FC = () => {
    const [courses, setCourses] = useState<Course[]>([]);
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [majors, setMajors] = useState<Major[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const [form, setForm] = useState<Course>({
        course_id: '',
        course_name: '',
        credits: 0,
        teaching_hours_per_week: 0,
        managing_faculty_id: 0,
        major_id: null,
        course_type: CourseType.FUNDAMENTAL
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const [crs, facs, mjs] = await Promise.all([
                api.getCourses(search || undefined),
                api.getFaculties(),
                api.getMajors()
            ]);
            setCourses(crs);
            setFaculties(facs);
            setMajors(mjs);
        } catch (e: any) {
            setError(e?.message || 'Failed to load courses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const t = setTimeout(() => load(), 300);
        return () => clearTimeout(t);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    const resetForm = () => {
        setForm({
            course_id: '',
            course_name: '',
            credits: 0,
            teaching_hours_per_week: 0,
            managing_faculty_id: 0,
            major_id: null,
            course_type: CourseType.FUNDAMENTAL
        });
        setEditingId(null);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError(null);
            if (editingId) {
                await api.updateCourse(editingId, form);
            } else {
                await api.createCourse(form);
            }
        } catch (e: any) {
            setError(e?.message || 'Save failed');
        }
        resetForm();
        await load();
    };

    const onEdit = (c: Course) => {
        setEditingId(c.course_id);
        setForm({ ...c });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const onDelete = async (id: string) => {
        if (!confirm('Delete this course?')) return;
        try {
            setError(null);
            await api.deleteCourse(id);
            await load();
        } catch (e: any) {
            setError(e?.message || 'Delete failed');
        }
    };

    const facultyNameById = useMemo(() => {
        const map = new Map<number, string>();
        faculties.forEach(f => map.set(f.faculty_id, f.faculty_name));
        return map;
    }, [faculties]);

    const majorNameById = useMemo(() => {
        const map = new Map<number, string>();
        majors.forEach(m => map.set(m.major_id, m.major_name));
        return map;
    }, [majors]);

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Courses Management</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
                <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Course ID</label>
                        <input className="w-full border rounded-md p-2" value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })} disabled={!!editingId} required />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Name</label>
                        <input className="w-full border rounded-md p-2" value={form.course_name} onChange={e => setForm({ ...form, course_name: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Credits</label>
                        <input type="number" min={1} className="w-full border rounded-md p-2" value={form.credits} onChange={e => setForm({ ...form, credits: Number(e.target.value) })} required />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Hours/Week</label>
                        <input type="number" min={1} className="w-full border rounded-md p-2" value={form.teaching_hours_per_week} onChange={e => setForm({ ...form, teaching_hours_per_week: Number(e.target.value) })} required />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Managing Faculty</label>
                        <select className="w-full border rounded-md p-2" value={form.managing_faculty_id} onChange={e => setForm({ ...form, managing_faculty_id: Number(e.target.value) })} required>
                            <option value={0}>Select...</option>
                            {faculties.map(f => <option key={f.faculty_id} value={f.faculty_id}>{f.faculty_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Major (optional)</label>
                        <select className="w-full border rounded-md p-2" value={form.major_id ?? ''} onChange={e => setForm({ ...form, major_id: e.target.value ? Number(e.target.value) : null })}>
                            <option value="">None</option>
                            {majors.map(m => <option key={m.major_id} value={m.major_id}>{m.major_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Type</label>
                        <select className="w-full border rounded-md p-2" value={form.course_type} onChange={e => setForm({ ...form, course_type: e.target.value as CourseType })}>
                            {Object.values(CourseType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end gap-2">
                        <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 text-white">{editingId ? 'Update' : 'Create'}</button>
                        {editingId && <button type="button" className="px-4 py-2 rounded-md bg-slate-200" onClick={resetForm}>Cancel</button>}
                    </div>
                </form>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-slate-700">Courses</h2>
                    <input placeholder="Search..." className="border rounded-md p-2" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                {error && <div className="mb-3 p-3 rounded-md bg-red-50 text-red-700">{error}</div>}
                {loading ? <p className="text-slate-500">Loading...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                                    <th className="p-3">ID</th>
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Credits</th>
                                    <th className="p-3">Hours</th>
                                    <th className="p-3">Faculty</th>
                                    <th className="p-3">Major</th>
                                    <th className="p-3">Type</th>
                                    <th className="p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {courses.map(c => (
                                    <tr key={c.course_id} className="border-b border-slate-200">
                                        <td className="p-3">{c.course_id}</td>
                                        <td className="p-3">{c.course_name}</td>
                                        <td className="p-3">{c.credits}</td>
                                        <td className="p-3">{c.teaching_hours_per_week}</td>
                                        <td className="p-3">{facultyNameById.get(c.managing_faculty_id) || c.managing_faculty_id}</td>
                                        <td className="p-3">{c.major_id ? (majorNameById.get(c.major_id) || c.major_id) : '-'}</td>
                                        <td className="p-3">{c.course_type}</td>
                                        <td className="p-3 flex gap-2">
                                            <button className="px-3 py-1 text-sm rounded-md bg-slate-100" onClick={() => onEdit(c)}>Edit</button>
                                            <button className="px-3 py-1 text-sm rounded-md bg-red-100 text-red-700" onClick={() => onDelete(c.course_id)}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CoursesPage;



