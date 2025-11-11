import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import { Faculty, Lecturer } from '../../types';

const LecturersPage: React.FC = () => {
    const [lecturers, setLecturers] = useState<Lecturer[]>([]);
    const [faculties, setFaculties] = useState<Faculty[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    const [form, setForm] = useState<Omit<Lecturer, 'lecturer_id'>>({
        first_name: '',
        last_name: '',
        email: '',
        faculty_id: 0,
        hourly_rate: 0
    });
    const [editingId, setEditingId] = useState<number | null>(null);

    const load = async () => {
        setLoading(true);
        setError(null);
        try {
            const [lecs, facs] = await Promise.all([
                api.getLecturers(search || undefined),
                api.getFaculties()
            ]);
            setLecturers(lecs);
            setFaculties(facs);
        } catch (e: any) {
            setError(e?.message || 'Failed to load lecturers');
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
        setForm({ first_name: '', last_name: '', email: '', faculty_id: 0, hourly_rate: 0 });
        setEditingId(null);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setError(null);
            if (editingId) {
                await api.updateLecturer(editingId, form as Lecturer);
            } else {
                await api.createLecturer(form);
            }
        } catch (e: any) {
            setError(e?.message || 'Save failed');
        }
        resetForm();
        await load();
    };

    const onEdit = (l: Lecturer) => {
        setEditingId(l.lecturer_id);
        setForm({
            first_name: l.first_name,
            last_name: l.last_name,
            email: l.email,
            faculty_id: l.faculty_id,
            hourly_rate: l.hourly_rate
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const onDelete = async (id: number) => {
        if (!confirm('Delete this lecturer?')) return;
        try {
            setError(null);
            await api.deleteLecturer(id);
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

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Lecturers Management</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
                <form onSubmit={onSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">First Name</label>
                        <input className="w-full border rounded-md p-2" value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Last Name</label>
                        <input className="w-full border rounded-md p-2" value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Email</label>
                        <input type="email" className="w-full border rounded-md p-2" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Faculty</label>
                        <select className="w-full border rounded-md p-2" value={form.faculty_id} onChange={e => setForm({ ...form, faculty_id: Number(e.target.value) })} required>
                            <option value={0}>Select...</option>
                            {faculties.map(f => <option key={f.faculty_id} value={f.faculty_id}>{f.faculty_name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm text-slate-600 mb-1">Hourly Rate</label>
                        <input type="number" min={0} className="w-full border rounded-md p-2" value={form.hourly_rate} onChange={e => setForm({ ...form, hourly_rate: Number(e.target.value) })} required />
                    </div>
                    <div className="flex items-end gap-2">
                        <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 text-white">{editingId ? 'Update' : 'Create'}</button>
                        {editingId && <button type="button" className="px-4 py-2 rounded-md bg-slate-200" onClick={resetForm}>Cancel</button>}
                    </div>
                </form>
            </div>
            <div className="bg-white p-4 rounded-xl shadow-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-slate-700">Lecturers</h2>
                    <input placeholder="Search..." className="border rounded-md p-2" value={search} onChange={e => setSearch(e.target.value)} />
                </div>
                {error && <div className="mb-3 p-3 rounded-md bg-red-50 text-red-700">{error}</div>}
                {loading ? <p className="text-slate-500">Loading...</p> : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                                    <th className="p-3">Name</th>
                                    <th className="p-3">Email</th>
                                    <th className="p-3">Faculty</th>
                                    <th className="p-3">Rate</th>
                                    <th className="p-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {lecturers.map(l => (
                                    <tr key={l.lecturer_id} className="border-b border-slate-200">
                                        <td className="p-3">{l.first_name} {l.last_name}</td>
                                        <td className="p-3">{l.email}</td>
                                        <td className="p-3">{facultyNameById.get(l.faculty_id) || l.faculty_id}</td>
                                        <td className="p-3">${l.hourly_rate}</td>
                                        <td className="p-3 flex gap-2">
                                            <button className="px-3 py-1 text-sm rounded-md bg-slate-100" onClick={() => onEdit(l)}>Edit</button>
                                            <button className="px-3 py-1 text-sm rounded-md bg-red-100 text-red-700" onClick={() => onDelete(l.lecturer_id)}>Delete</button>
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

export default LecturersPage;



