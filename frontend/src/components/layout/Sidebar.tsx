import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  FiBarChart,
  FiTag,
  FiPlus,
  FiBook,
  FiSettings
} from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: <FiBarChart /> },
  { to: '/tickets', label: 'My Tickets', icon: <FiTag /> },
  { to: '/tickets/new', label: 'New Ticket', icon: <FiPlus /> },
  { to: '/knowledge', label: 'Knowledge Base', icon: <FiBook /> },
  { to: '/admin', label: 'Admin Panel', icon: <FiSettings />, adminOnly: true },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();

  const filteredNavItems = navItems.filter(item =>
    !item.adminOnly || user?.role === 'admin'
  );

  return (
    <aside className="w-64 bg-white shadow-sm border-r border-gray-200 min-h-screen">
      <nav className="p-4">
        <ul className="space-y-2">
          {filteredNavItems.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center space-x-3 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-700 hover:bg-gray-100'
                  }`
                }
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};