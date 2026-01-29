import React from 'react';
import DarkModeToggle from '../components/DarkModeToggle';

const MemberLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
            <nav className="bg-purple-700 dark:bg-purple-900 text-white p-4 flex justify-between items-center shadow-md">
                <span className="font-bold text-lg">Espace Membre</span>
                <DarkModeToggle className="bg-purple-600 hover:bg-purple-500 text-white" />
            </nav>
            <main className="p-6 text-gray-900 dark:text-gray-100">{children}</main>
        </div>
    );
};

export default MemberLayout;