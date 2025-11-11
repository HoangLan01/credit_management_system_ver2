import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { Class, Classroom, Course, Lecturer, Semester, Weekday } from '../../types';

const ClassesPage: React.FC = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [lecturers, setLecturers] = useState<Lecturer[]>([]);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [form, setForm] = useState<Omit<Class, 'class_id'>>({
        course_id: '',
        semester_id: 0,
        lecturer_id: 0,
        classroom_id: '',
        weekday: Weekday.MONDAY,
        start_time: '09:00:00',
        end_time: '12:00:00'
    });
    const [editingId, setEditingId] = useState<number | null>(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const [clss, crs, lecs, sems, rooms] = await Promise.all([
                api.getClasses(),
                api.getCourses(),
                api.getLecturers(),
                api.getSemesters(),
                api.getClassrooms()
            ]);
            setClasses(clss);
            setCourses(crs);
            setLecturers(lecs);
            setSemesters(sems);
            setClassrooms(rooms);
        } catch (e: any) {
            setError(e?.message || 'Failed to load classes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const resetForm = () => {
        setForm({
            course_id: '',
            semester_id: 0,
            lecturer_id: 0,
            classroom_id: '',
            weekday: Weekday.MONDAY,
            start_time: '09:00:00',
            end_time: '12:00:00'
        });
        setEditingId(null);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError(null);
            if (editingId) {
                await api.updateClass(editingId, form as Class);
            } else {
                await api.createClass(form);
            }
        } catch (e: any) {
            setError(e?.message || 'Save failed');
        }
        resetForm();
        await load();
    };

    const onEdit = (c: Class) => {
        setEditingId(c.class_id);
        const { class_id, ...rest } = c;
        setForm({ ...rest });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const onDelete = async (id: number) => {
        if (!confirm('Delete this class?')) return;
        try {
            setError(null);
            await api.deleteClass(id);
            await load();
        } catch (e: any) {
            setError(e?.message || 'Delete failed');
        }
    };

    const courseNameById = useMemo(() => {
        const map = new Map<string, string>();
        courses.forEach(c => map.set(c.course_id, c.course_name));
        return map;
    }, [courses]);

    const lecturerNameById = useMemo(() => {
        const map = new Map<number, string>();
        lecturers.forEach(l => map.set(l.lecturer_id, `${l.first_name} ${l.last_name}`));
        return map;
    }, [lecturers]);

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Classes Management</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
                <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Course</label>
                        <select className="w-full border rounded-md p-2" value={form.course_id} onChange={e => setForm({ ...form, course_id: e.target.value })} required>
                            <option value="">Select...</option>
                            {courses.map(c => <option key={c.course_id} value={c.course_id}>{c.course_id} - {c.course_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Semester</label>
                        <select className="w-full border rounded-md p-2" value={form.semester_id} onChange={e => setForm({ ...form, semester_id: Number(e.target.value) })} required>
                            <option value={0}>Select...</option>
                            {semesters.map(s => <option key={s.semester_id} value={s.semester_id}>{s.semester_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Lecturer</label>
                        <select className="w-full border rounded-md p-2" value={form.lecturer_id} onChange={e => setForm({ ...form, lecturer_id: Number(e.target.value) })} required>
                            <option value={0}>Select...</option>
                            {lecturers.map(l => <option key={l.lecturer_id} value={l.lecturer_id}>{l.first_name} {l.last_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Classroom</label>
                        <select className="w-full border rounded-md p-2" value={form.classroom_id} onChange={e => setForm({ ...form, classroom_id: e.target.value })} required>
                            <option value="">Select...</option>
                            {classrooms.map(r => <option key={r.classroom_id} value={r.classroom_id}>{r.classroom_id} (cap {r.capacity})</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Weekday</label>
                        <select className="w-full border rounded-md p-2" value={form.weekday} onChange={e => setForm({ ...form, weekday: e.target.value as Weekday })} required>
                            {Object.values(Weekday).map(w => <option key={w} value={w}>{w}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Start Time</label>
                        <input type="time" className="w-full border rounded-md p-2" value={form.start_time} onChange={e => setForm({ ...form, start_time: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">End Time</label>
                        <input type="time" className="w-full border rounded-md p-2" value={form.end_time} onChange={e => setForm({ ...form, end_time: e.target.value })} required />
                    </div>
                    <div className="flex items-end gap-2">
                        <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 text-white">{editingId ? 'Update' : 'Create'}</button>
                        {editingId && <button type="button" className="px-4 py-2 rounded-md bg-slate-200" onClick={resetForm}>Cancel</button>}
                    </div>
                </form>
                <p className="text-xs text-slate-500 mt-2">Note: Business rules like room overlap, capacity, lecturer limits are enforced by database triggers.</p>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold text-slate-700 mb-4">Classes</h2>
                {error && <div className="mb-3 p-3 rounded-md bg-red-50 text-red-700">{error}</div>}
                {loading ? <p className="text-slate-500">Loading...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                                    <th className="p-3">ID</th>
                                    <th className="p-3">Course</th>
                                    <th className="p-3">Semester</th>
                                    <th className="p-3">Lecturer</th>
                                    <th className="p-3">Room</th>
                                    <th className="p-3">Schedule</th>
                                    <th className="p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {classes.map(c => (
                                    <tr key={c.class_id} className="border-b border-slate-200">
                                        <td className="p-3">{c.class_id}</td>
                                        <td className="p-3">{c.course_id} — {courseNameById.get(c.course_id) || ''}</td>
                                        <td className="p-3">{c.semester_id}</td>
                                        <td className="p-3">{lecturerNameById.get(c.lecturer_id) || c.lecturer_id}</td>
                                        <td className="p-3">{c.classroom_id}</td>
                                        <td className="p-3">{c.weekday}, {c.start_time} - {c.end_time}</td>
                                        <td className="p-3 flex gap-2">
                                            <button className="px-3 py-1 text-sm rounded-md bg-slate-100" onClick={() => onEdit(c)}>Edit</button>
                                            <button className="px-3 py-1 text-sm rounded-md bg-red-100 text-red-700" onClick={() => onDelete(c.class_id)}>Delete</button>
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

export default ClassesPage;



