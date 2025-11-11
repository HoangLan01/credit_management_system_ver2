
import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Reports from './components/pages/Reports';
import StudentsPage from './components/pages/Students';
import LecturersPage from './components/pages/Lecturers';
import CoursesPage from './components/pages/Courses';
import ClassesPage from './components/pages/Classes';

type ErrorBoundaryProps = { children: React.ReactNode };
type ErrorBoundaryState = { hasError: boolean; message?: string };

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    // Explicitly declare props for TS
    props!: Readonly<ErrorBoundaryProps>;
    state: ErrorBoundaryState = { hasError: false, message: undefined };
    static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
        return { hasError: true, message: error instanceof Error ? error.message : 'Unknown error' };
    }
    componentDidCatch(error: unknown): void {
        console.error('UI error:', error);
    }
    render() {
        if (this.state.hasError) {
            return (
                <div className="p-8">
                    <h1 className="text-2xl font-bold text-red-700">Something went wrong</h1>
                    <p className="text-slate-600 mt-2">{this.state.message}</p>
                </div>
            );
        }
        return this.props.children as React.ReactElement;
    }
}

const PlaceholderPage: React.FC<{ title: string }> = ({ title }) => (
    <div className="p-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">{title}</h1>
        <div className="bg-white p-6 rounded-xl shadow-lg">
            <p className="text-slate-600">Management interface for {title} will be displayed here.</p>
            <p className="text-slate-400 mt-4">This is a placeholder. The 'Reports' page demonstrates full functionality.</p>
        </div>
    </div>
);

const App: React.FC = () => {
    const [activePage, setActivePage] = useState('dashboard'); // Start on a static page to avoid fetch issues

    const renderPage = () => {
        switch (activePage) {
            case 'dashboard':
                return <PlaceholderPage title="Dashboard" />;
            case 'students':
                return <StudentsPage />;
            case 'lecturers':
                return <LecturersPage />;
            case 'courses':
                return <CoursesPage />;
            case 'classes':
                return <ClassesPage />;
            case 'reports':
                return <Reports />;
            default:
                return <PlaceholderPage title="Dashboard" />;
        }
    };

    return (
        <div className="flex h-screen bg-slate-100 font-sans">
            <Sidebar activePage={activePage} setActivePage={setActivePage} />
            <ErrorBoundary>
                <main className="flex-1 overflow-y-auto">
                    {renderPage()}
                </main>
            </ErrorBoundary>
        </div>
    );
};

export default App;
