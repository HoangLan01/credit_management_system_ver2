
import React, { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import { StudentGpaRecord, AcademicWarning, LecturerSalary, ClassroomUsage, Semester } from '../../types';

type ReportType = 'gpa' | 'warnings' | 'salaries' | 'classrooms';

const GPA_WARNING_THRESHOLD = 2.0;
const FAILED_CREDIT_WARNING_THRESHOLD = 9;
const LECTURER_HOURS_THRESHOLD = 8; // Min hours per week

const Reports: React.FC = () => {
    const [activeReport, setActiveReport] = useState<ReportType>('gpa');
    
    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Reports & Statistics</h1>
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex border-b border-slate-200 mb-6">
                    <TabButton label="Student GPA" active={activeReport === 'gpa'} onClick={() => setActiveReport('gpa')} />
                    <TabButton label="Academic Warnings" active={activeReport === 'warnings'} onClick={() => setActiveReport('warnings')} />
                    <TabButton label="Lecturer Salaries" active={activeReport === 'salaries'} onClick={() => setActiveReport('salaries')} />
                    <TabButton label="Classroom Usage" active={activeReport === 'classrooms'} onClick={() => setActiveReport('classrooms')} />
                </div>
                <div>
                    {activeReport === 'gpa' && <StudentGpaReport />}
                    {activeReport === 'warnings' && <AcademicWarningsReport />}
                    {activeReport === 'salaries' && <LecturerSalariesReport />}
                    {activeReport === 'classrooms' && <ClassroomUsageReport />}
                </div>
            </div>
        </div>
    );
};

const TabButton: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`px-4 py-2 font-semibold text-sm -mb-px border-b-2 transition-colors duration-200 ${
            active ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-indigo-600'
        }`}
    >
        {label}
    </button>
);

const StudentGpaReport: React.FC = () => {
    const [data, setData] = useState<StudentGpaRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [sortConfig, setSortConfig] = useState<{ key: keyof StudentGpaRecord; direction: 'asc' | 'desc' } | null>({key: 'courses_taken', direction: 'desc'});
    
    useEffect(() => {
        api.getStudentGpaReport().then(res => {
            setData(res);
            setLoading(false);
        });
    }, []);

    const sortedData = useMemo(() => {
        let sortableData = [...data];
        if (sortConfig !== null) {
            sortableData.sort((a, b) => {
                if (a[sortConfig.key] < b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? -1 : 1;
                }
                if (a[sortConfig.key] > b[sortConfig.key]) {
                    return sortConfig.direction === 'asc' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableData;
    }, [data, sortConfig]);

    const requestSort = (key: keyof StudentGpaRecord) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    if (loading) return <p className="text-slate-500">Loading report...</p>;

    return (
        <div>
            <h3 className="text-xl font-semibold text-slate-700 mb-4">Student GPA & Enrollment Statistics</h3>
            <p className="text-sm text-slate-500 mb-4">Default sort: Descending total courses taken, then descending failed credits.</p>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                            <th className="p-3">Student Name</th>
                            <th className="p-3">Major</th>
                            <th className="p-3 cursor-pointer" onClick={() => requestSort('cumulative_gpa')}>Cumulative GPA</th>
                            <th className="p-3 cursor-pointer" onClick={() => requestSort('courses_taken')}>Courses Taken</th>
                            <th className="p-3 cursor-pointer" onClick={() => requestSort('failed_credits')}>Failed Credits</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sortedData.map(record => (
                            <tr key={record.student_id} className="border-b border-slate-200 hover:bg-slate-50">
                                <td className="p-3 font-medium text-slate-800">{record.student_name} <span className="text-xs text-slate-400 block">{record.student_id}</span></td>
                                <td className="p-3 text-slate-600">{record.major_name}</td>
                                <td className="p-3 text-slate-600">{record.cumulative_gpa.toFixed(2)}</td>
                                <td className="p-3 text-slate-600">{record.courses_taken}</td>
                                <td className="p-3 text-red-500 font-semibold">{record.failed_credits}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const AcademicWarningsReport: React.FC = () => {
    const [data, setData] = useState<AcademicWarning[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getAcademicWarnings(GPA_WARNING_THRESHOLD, FAILED_CREDIT_WARNING_THRESHOLD).then(res => {
            setData(res);
            setLoading(false);
        });
    }, []);

    if (loading) return <p className="text-slate-500">Loading report...</p>;

    return (
        <div>
            <h3 className="text-xl font-semibold text-slate-700 mb-4">Academic Warnings</h3>
             <p className="text-sm text-slate-500 mb-4">Showing students with GPA below {GPA_WARNING_THRESHOLD.toFixed(1)} or more than {FAILED_CREDIT_WARNING_THRESHOLD} failed credits.</p>
             {data.length === 0 ? <p className="text-green-600 bg-green-50 p-4 rounded-lg">No students are currently on academic warning.</p> : (
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                                <th className="p-3">Student Name</th>
                                <th className="p-3">GPA</th>
                                <th className="p-3">Failed Credits</th>
                                <th className="p-3">Reason</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(warning => (
                                <tr key={warning.student.student_id} className="border-b border-slate-200 hover:bg-red-50">
                                    <td className="p-3 font-medium text-slate-800">{warning.student.first_name} {warning.student.last_name}</td>
                                    <td className="p-3 font-semibold text-red-600">{warning.gpa.toFixed(2)}</td>
                                    <td className="p-3 font-semibold text-red-600">{warning.failed_credits}</td>
                                    <td className="p-3 text-slate-600">{warning.warning_reason}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
             )}
        </div>
    );
};

const LecturerSalariesReport: React.FC = () => {
    const [data, setData] = useState<LecturerSalary[]>([]);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getSemesters().then(res => {
            setSemesters(res);
            if(res.length > 0) setSelectedSemester(res[0].semester_id);
            else setLoading(false);
        });
    }, []);

    useEffect(() => {
        if(selectedSemester) {
            setLoading(true);
            api.getLecturerSalaries(selectedSemester, LECTURER_HOURS_THRESHOLD).then(res => {
                setData(res);
                setLoading(false);
            });
        }
    }, [selectedSemester]);
    
    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-xl font-semibold text-slate-700">Lecturer Salaries</h3>
                    <p className="text-sm text-slate-500">Warning threshold for teaching hours: &lt; {LECTURER_HOURS_THRESHOLD} hrs/week.</p>
                </div>
                <select 
                    value={selectedSemester || ''} 
                    onChange={e => setSelectedSemester(Number(e.target.value))}
                    className="p-2 border rounded-md bg-white shadow-sm"
                >
                    {semesters.map(s => <option key={s.semester_id} value={s.semester_id}>{s.semester_name}</option>)}
                </select>
            </div>
            {loading ? <p className="text-slate-500">Loading report...</p> : (
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                                <th className="p-3">Lecturer Name</th>
                                <th className="p-3">Monthly Salary</th>
                                <th className="p-3">Hours/Week</th>
                                <th className="p-3">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(record => (
                                <tr key={record.lecturer.lecturer_id} className="border-b border-slate-200 hover:bg-slate-50">
                                    <td className="p-3 font-medium text-slate-800">{record.lecturer.first_name} {record.lecturer.last_name}</td>
                                    <td className="p-3 text-slate-600">${record.monthly_salary.toLocaleString()}</td>
                                    <td className="p-3 text-slate-600">{record.total_hours_per_week}</td>
                                    <td className="p-3">
                                        {record.is_below_threshold ? 
                                            <span className="text-xs font-semibold px-2 py-1 bg-amber-100 text-amber-800 rounded-full">Warning: Low Hours</span> :
                                            <span className="text-xs font-semibold px-2 py-1 bg-green-100 text-green-800 rounded-full">OK</span>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};


const ClassroomUsageReport: React.FC = () => {
    const [data, setData] = useState<ClassroomUsage[]>([]);
    const [semesters, setSemesters] = useState<Semester[]>([]);
    const [selectedSemester, setSelectedSemester] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.getSemesters().then(res => {
            setSemesters(res);
            if(res.length > 0) setSelectedSemester(res[0].semester_id);
            else setLoading(false);
        });
    }, []);

    useEffect(() => {
        if(selectedSemester) {
            setLoading(true);
            api.getClassroomUsage(selectedSemester).then(res => {
                setData(res);
                setLoading(false);
            });
        }
    }, [selectedSemester]);

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-slate-700">Classroom Usage Frequency</h3>
                <select 
                    value={selectedSemester || ''} 
                    onChange={e => setSelectedSemester(Number(e.target.value))}
                    className="p-2 border rounded-md bg-white shadow-sm"
                >
                    {semesters.map(s => <option key={s.semester_id} value={s.semester_id}>{s.semester_name}</option>)}
                </select>
            </div>
            {loading ? <p className="text-slate-500">Loading report...</p> : (
                 <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 text-sm">
                                <th className="p-3">Classroom ID</th>
                                <th className="p-3">Capacity</th>
                                <th className="p-3">Classes Held (Frequency)</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map(record => (
                                <tr key={record.classroom.classroom_id} className="border-b border-slate-200 hover:bg-slate-50">
                                    <td className="p-3 font-medium text-slate-800">{record.classroom.classroom_id}</td>
                                    <td className="p-3 text-slate-600">{record.classroom.capacity}</td>
                                    <td className="p-3 text-slate-600 font-semibold">{record.usage_count}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default Reports;
