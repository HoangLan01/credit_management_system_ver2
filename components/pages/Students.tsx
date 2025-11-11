import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { Major, Student } from '../../types';

const StudentsPage: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [majors, setMajors] = useState<Major[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const [form, setForm] = useState<Student>({
        student_id: '',
        first_name: '',
        last_name: '',
        dob: '',
        email: '',
        major_id: 0,
        cohort_id: 0,
        program_id: 0
    });
    const [isEditing, setIsEditing] = useState<boolean>(false);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const [stus, mjs] = await Promise.all([api.getStudents(search || undefined), api.getMajors()]);
            setStudents(stus);
            setMajors(mjs);
        } catch (e: any) {
            setError(e?.message || 'Failed to load students');
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
            student_id: '',
            first_name: '',
            last_name: '',
            dob: '',
            email: '',
            major_id: 0,
            cohort_id: 0,
            program_id: 0
        });
        setIsEditing(false);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.student_id || !form.first_name || !form.last_name || !form.email) return;
        try {
            setError(null);
            if (isEditing) {
                await api.updateStudent(form.student_id, form);
            } else {
                await api.createStudent(form);
            }
        } catch (e: any) {
            setError(e?.message || 'Save failed');
        }
        resetForm();
        await load();
    };

    const onEdit = (s: Student) => {
        setForm({ ...s });
        setIsEditing(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const onDelete = async (id: string) => {
        if (!confirm('Delete this student?')) return;
        try {
            setError(null);
            await api.deleteStudent(id);
            await load();
        } catch (e: any) {
            setError(e?.message || 'Delete failed');
        }
    };

    const majorNameById = useMemo(() => {
        const map = new Map<number, string>();
        majors.forEach(m => map.set(m.major_id, m.major_name));
        return map;
    }, [majors]);

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Students Management</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
                <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Student ID</label>
                        <input className="w-full border rounded-md p-2" value={form.student_id} onChange={e => setForm({ ...form, student_id: e.target.value })} disabled={isEditing} required />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">First Name</label>
                        <input className="w-full border rounded-md p-2" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Last Name</label>
                        <input className="w-full border rounded-md p-2" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">DOB</label>
                        <input type="date" className="w-full border rounded-md p-2" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Email</label>
                        <input type="email" className="w-full border rounded-md p-2" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Major</label>
                        <select className="w-full border rounded-md p-2" value={form.major_id} onChange={e => setForm({ ...form, major_id: Number(e.target.value) })} required>
                            <option value={0}>Select...</option>
                            {majors.map(m => <option key={m.major_id} value={m.major_id}>{m.major_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Cohort ID</label>
                        <input className="w-full border rounded-md p-2" value={form.cohort_id} onChange={e => setForm({ ...form, cohort_id: Number(e.target.value) })} />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Program ID</label>
                        <input className="w-full border rounded-md p-2" value={form.program_id} onChange={e => setForm({ ...form, program_id: Number(e.target.value) })} />
                    </div>
                    <div className="flex items-end gap-2">
                        <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 text-white">{isEditing ? 'Update' : 'Create'}</button>
                        {isEditing && <button type="button" className="px-4 py-2 rounded-md bg-slate-200" onClick={resetForm}>Cancel</button>}
                    </div>
                </form>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-slate-700">Students</h2>
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
                                    <th className="p-3">Email</th>
                                    <th className="p-3">Major</th>
                                    <th className="p-3">Cohort</th>
                                    <th className="p-3">Program</th>
                                    <th className="p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map(s => (
                                    <tr key={s.student_id} className="border-b border-slate-200">
                                        <td className="p-3">{s.student_id}</td>
                                        <td className="p-3">{s.first_name} {s.last_name}</td>
                                        <td className="p-3">{s.email}</td>
                                        <td className="p-3">{majorNameById.get(s.major_id) || s.major_id}</td>
                                        <td className="p-3">{s.cohort_id}</td>
                                        <td className="p-3">{s.program_id}</td>
                                        <td className="p-3 flex gap-2">
                                            <button className="px-3 py-1 text-sm rounded-md bg-slate-100" onClick={() => onEdit(s)}>Edit</button>
                                            <button className="px-3 py-1 text-sm rounded-md bg-red-100 text-red-700" onClick={() => onDelete(s.student_id)}>Delete</button>
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

export default StudentsPage;



