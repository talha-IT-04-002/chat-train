import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

interface UserProfileProps {
  sidebarCollapsed?: boolean;
}

function UserProfile({ sidebarCollapsed = false }: UserProfileProps) {
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
    <div className="relative">
      {/* User Profile Section */}
      <div className="px-6 py-4 border-t border-light dark:border-gray-700">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#40B1DF] to-[#3aa0c9] flex items-center justify-center text-white font-semibold text-sm shadow-md">
              {getInitials(user.firstName, user.lastName)}
            </div>
            {/* Online indicator */}
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800"></div>
          </div>

          {/* User Info */}
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-accent dark:text-white truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-secondary dark:text-gray-400 truncate">
                    {user.email}
                  </p>
                  <p className="text-xs text-secondary dark:text-gray-400 capitalize">
                    {user.role}
                  </p>
                </div>
                
                {/* Dropdown Toggle */}
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-1 rounded-lg hover:bg-surface-gray dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <svg className="w-4 h-4 text-secondary dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Logout Button for Collapsed Sidebar */}
          {sidebarCollapsed && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-surface-gray dark:hover:bg-gray-700 transition-colors duration-200"
              title="Logout"
            >
              <svg className="w-5 h-5 text-secondary dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>

        {/* Dropdown Menu */}
        {showDropdown && !sidebarCollapsed && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-light dark:border-gray-700 py-2 z-50">
            <div className="px-4 py-2 border-b border-light dark:border-gray-700">
              <p className="text-xs font-medium text-secondary dark:text-gray-400 uppercase tracking-wider">
                Account
              </p>
            </div>
            
            <div className="py-1">
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

      {/* Click outside to close dropdown */}
      {showDropdown && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowDropdown(false)}
        />
      )}
    </div>
  );
}

export default UserProfile;
