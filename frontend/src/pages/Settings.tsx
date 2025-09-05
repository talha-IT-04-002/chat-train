import { useState } from 'react'
import { useTheme } from '../contexts/ThemeContext';
import { Layout, Dialog } from '../components';

const Settings = () => {
  const { theme, toggleTheme } = useTheme();
  const [showThemeDialog, setShowThemeDialog] = useState(false)
  const [isChangingTheme, setIsChangingTheme] = useState(false)

  const handleThemeToggle = () => {
    setShowThemeDialog(true)
  }

  const confirmThemeChange = () => {
    setIsChangingTheme(true)
    setTimeout(() => {
      toggleTheme()
      setIsChangingTheme(false)
      setShowThemeDialog(false)
    }, 1000)
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-6 sm:py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-accent dark:text-white mb-2">
            Settings
          </h1>
          <p className="text-secondary dark:text-gray-400">
            Manage your application preferences and appearance
          </p>
        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-light dark:border-gray-700 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
              <div>
                <h2 className="text-xl font-semibold text-accent dark:text-white mb-1">
                  Appearance
                </h2>
                <p className="text-secondary dark:text-gray-400">
                  Customize how the application looks
                </p>
              </div>
              <div className="p-2 bg-surface-gray dark:bg-gray-700 rounded-lg">
                <svg className="w-6 h-6 text-secondary dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-surface-gray dark:bg-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-white dark:bg-gray-600 rounded-lg">
                    {theme === 'light' ? (
                      <svg className="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-accent dark:text-white">
                      {theme === 'light' ? 'Light Mode' : 'Dark Mode'}
                    </h3>
                    <p className="text-sm text-secondary dark:text-gray-400">
                      {theme === 'light' 
                        ? 'Use light theme for better visibility in bright environments' 
                        : 'Use dark theme to reduce eye strain in low light'
                      }
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={handleThemeToggle}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
                    theme === 'dark' 
                      ? 'bg-primary' 
                      : 'bg-gray-200 dark:bg-gray-600'
                  }`}
                >
                  {theme === 'dark' ?'off':'on'}
                </button>
              </div>

              <div className="mt-6 p-4 bg-surface-gray dark:bg-gray-700 rounded-lg">
                <h4 className="text-sm font-medium text-accent dark:text-white mb-3">
                  Preview
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    theme === 'light' 
                      ? 'border-primary bg-white' 
                      : 'border-gray-200 bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-700">Light Mode</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-200 rounded"></div>
                      <div className="h-2 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-200 rounded w-1/2"></div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                    theme === 'dark' 
                      ? 'border-primary bg-gray-800' 
                      : 'border-gray-300 bg-gray-100'
                  }`}>
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                      <span className="text-sm font-medium text-gray-600">Dark Mode</span>
                    </div>
                    <div className="space-y-2">
                      <div className="h-2 bg-gray-600 rounded"></div>
                      <div className="h-2 bg-gray-600 rounded w-3/4"></div>
                      <div className="h-2 bg-gray-600 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      
      <Dialog
        isOpen={showThemeDialog}
        onClose={() => setShowThemeDialog(false)}
        onConfirm={confirmThemeChange}
        title="Change Theme"
        message={`Are you sure you want to switch to ${theme === 'light' ? 'dark' : 'light'} mode? This will change the appearance of the entire application.`}
        confirmText="Change Theme"
        cancelText="Cancel"
        variant="info"
        isLoading={isChangingTheme}
      />
    </Layout>
  );
};

export default Settings;
