import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

function TopHeader() {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  return (
    <div className="lg:hidden bg-white dark:bg-gray-900 border-b border-light dark:border-gray-700 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center">
        <h1 className="text-lg font-bold text-accent dark:text-white">Chat Train</h1>
      </div>

      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-gray dark:hover:bg-gray-700 transition-colors duration-200"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-[#40B1DF] to-[#3aa0c9] flex items-center justify-center text-white font-semibold text-sm shadow-md">
              {getInitials(user.firstName, user.lastName)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-green-500 rounded-full border border-white dark:border-gray-800"></div>
          </div>

          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-accent dark:text-white">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-xs text-secondary dark:text-gray-400 capitalize">
              {user.role}
            </p>
          </div>

          <svg className="w-4 h-4 text-secondary dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDropdown && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-light dark:border-gray-700 py-2 z-50">
            <div className="px-4 py-2 border-b border-light dark:border-gray-700">
              <p className="text-xs font-medium text-secondary dark:text-gray-400 uppercase tracking-wider">
                Account
              </p>
            </div>
            
            <div className="py-1">
              <button
                onClick={() => {
                  setShowDropdown(false);
                  window.location.href = '/settings';
                }}
                className="w-full px-4 py-2 text-left text-sm text-accent dark:text-white hover:bg-surface-gray dark:hover:bg-gray-700 transition-colors duration-200 flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Settings
              </button>
              
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200 flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>

      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}

export default TopHeader;