
import React from 'react';

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

const NavItem: React.FC<{
  label: string;
  // FIX: Changed JSX.Element to React.ReactElement to resolve namespace error.
  icon: React.ReactElement;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, icon, isActive, onClick }) => {
  return (
    <li
      className={`flex items-center p-3 my-1 rounded-lg cursor-pointer transition-all duration-200 ${
        isActive
          ? 'bg-indigo-600 text-white shadow-md'
          : 'text-slate-700 hover:bg-indigo-100 hover:text-indigo-800'
      }`}
      onClick={onClick}
    >
      {React.cloneElement(icon, { className: 'w-6 h-6 mr-3' })}
      <span className="font-medium">{label}</span>
    </li>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ activePage, setActivePage }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <HomeIcon /> },
    { id: 'students', label: 'Students', icon: <UsersIcon /> },
    { id: 'lecturers', label: 'Lecturers', icon: <AcademicCapIcon /> },
    { id: 'courses', label: 'Courses', icon: <BookOpenIcon /> },
    { id: 'classes', label: 'Classes', icon: <ClipboardDocumentListIcon /> },
    { id: 'reports', label: 'Reports', icon: <ChartBarIcon /> },
  ];

  return (
    <aside className="w-64 bg-white text-slate-800 p-4 shadow-lg flex-shrink-0">
      <div className="flex items-center mb-8">
        <BuildingLibraryIcon className="w-10 h-10 text-indigo-600" />
        <h1 className="text-xl font-bold ml-2 text-slate-900">CMS Portal</h1>
      </div>
      <nav>
        <ul>
          {navItems.map((item) => (
            <NavItem
              key={item.id}
              label={item.label}
              icon={item.icon}
              isActive={activePage === item.id}
              onClick={() => setActivePage(item.id)}
            />
          ))}
        </ul>
      </nav>
    </aside>
  );
};

// SVG Icon Components
// FIX: Changed props type from 'any' to 'React.SVGProps<SVGSVGElement>' for all icon components.
// This ensures that standard SVG props like 'className' are recognized by TypeScript,
// resolving the 'No overload matches this call' error when using React.cloneElement.
const HomeIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
  </svg>
);

const UsersIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-2.253-9.527 9.527 0 0 0-4.121-2.253M15 19.128v-3.86a2.25 2.25 0 0 1 3-1.732a2.25 2.25 0 0 1-2.25-2.253v-3.86M15 19.128c-2.062 0-4.122-1.688-4.122-3.86v-3.86c0-2.172 2.06-3.86 4.122-3.86M15 19.128c.07-.058.14-.117.207-.177a9.421 9.421 0 0 0 4.122-2.253 9.527 9.527 0 0 0-4.122-2.253m-2.062 1.632a2.25 2.25 0 0 1 2.062 3.86m-2.062-3.86a2.25 2.25 0 0 0-2.062 3.86M12.938 6.372a2.25 2.25 0 0 1 2.062-3.86m-2.062 3.86a2.25 2.25 0 0 0-2.062-3.86m-2.062 3.86a2.25 2.25 0 0 1-2.062-3.86m2.062 3.86a2.25 2.25 0 0 0 2.062-3.86M6.838 10.232a2.25 2.25 0 0 1 2.062-3.86m-2.062 3.86a2.25 2.25 0 0 0-2.062-3.86m-2.062 3.86a2.25 2.25 0 0 1-2.062-3.86m2.062 3.86a2.25 2.25 0 0 0 2.062-3.86M4.778 12c-.596 0-1.17.06-1.722.175a9.337 9.337 0 0 0 4.121 2.253 9.527 9.527 0 0 0-4.121 2.253M4.778 12v3.86a2.25 2.25 0 0 0 3 1.732 2.25 2.25 0 0 0-2.25 2.253v3.86M4.778 12c-2.062 0-4.122 1.688-4.122 3.86v3.86c0 2.172 2.06 3.86 4.122 3.86" />
  </svg>
);

const AcademicCapIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path d="M12 14.25a.75.75 0 0 1 .75.75v5.25a.75.75 0 0 1-1.5 0v-5.25a.75.75 0 0 1 .75-.75Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v5.25a2.25 2.25 0 0 1-2.25 2.25h-10.5a2.25 2.25 0 0 1-2.25-2.25v-5.25M19.5 14.25V9.75a2.25 2.25 0 0 0-2.25-2.25h-10.5a2.25 2.25 0 0 0-2.25 2.25v4.5M19.5 14.25 12 19.5m0 0L4.5 14.25M12 19.5v-15a2.25 2.25 0 0 1 2.25-2.25h.008c.537 0 .97.433.97.97v1.5a.97.97 0 0 1-.97.97H12.75A2.25 2.25 0 0 1 15 7.5v1.5a2.25 2.25 0 0 1 2.25 2.25" />
  </svg>
);

const BookOpenIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
  </svg>
);

const ClipboardDocumentListIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.125 2.25h-4.5c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125v-9M10.125 2.25h.375a9 9 0 0 1 9 9v.375M10.125 2.25A3.375 3.375 0 0 1 13.5 5.625v1.5c0 .621.504 1.125 1.125 1.125h1.5a3.375 3.375 0 0 1 3.375 3.375M9 15l2.25 2.25L15 12" />
  </svg>
);

const ChartBarIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);

const BuildingLibraryIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" {...props}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
  </svg>
);

export default Sidebar;