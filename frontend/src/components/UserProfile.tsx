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
      <div className="px-6 py-4 border-t border-light">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] flex items-center justify-center text-white font-semibold text-sm shadow-md">
              {getInitials(user.firstName, user.lastName)}
            </div>
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
          </div>

          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-accent truncate">
                    {user.firstName} {user.lastName}
                  </p>
                  <p className="text-xs text-secondary truncate">
                    {user.email}
                  </p>
                  <p className="text-xs text-secondary capitalize">
                    {user.role}
                  </p>
                </div>
                
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="p-1 rounded-lg hover:bg-surface-gray transition-colors duration-200"
                >
                  <svg className="w-4 h-4 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {sidebarCollapsed && (
            <button
              onClick={handleLogout}
              className="p-2 rounded-lg hover:bg-surface-gray transition-colors duration-200"
              title="Logout"
            >
              <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          )}
        </div>

        {showDropdown && !sidebarCollapsed && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-xl shadow-lg border border-light py-2 z-50">
            <div className="py-1">
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors duration-200 flex items-center gap-3"
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

export default UserProfile;