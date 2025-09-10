import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import logo from '../assets/logo.png'
import UserProfile from './UserProfile'
import TopHeader from './TopHeader'
interface LayoutProps {
  children: React.ReactNode
}
function Layout({ children }: LayoutProps) {
  const location = useLocation()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  useEffect(() => {
    const stored = localStorage.getItem('sidebarCollapsed')
    if (stored !== null) setSidebarCollapsed(stored === 'true')
  }, [])
  useEffect(() => {
    const forceCollapse = location.pathname === '/trainer-builder' || /\/trainers\/.+\/workflow$/.test(location.pathname)
    if (forceCollapse) {
      setSidebarCollapsed(true)
    }
    setMobileMenuOpen(false)
  }, [location.pathname])  
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed))
    ;(window as any).toggleSidebar = () => setSidebarCollapsed((v) => !v)
  }, [sidebarCollapsed])
  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }
  return (
    <div className="min-h-screen bg-surface-gray text-accent transition-colors 
      duration-200">
      <div className="flex">  
        {/* Global floating sidebar toggle (desktop) */}
        <button
          onClick={() => setSidebarCollapsed((v) => !v)}
          className="hidden lg:flex fixed left-6 top-6 z-50 p-3 rounded-full shadow-lg bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] text-white hover:shadow-xl"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{ padding: '10px' }}
        >
          {sidebarCollapsed ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          )}
        </button>

        <div className="lg:hidden fixed top-4 left-4 z-50 mt-2">
          <button
            onClick={toggleMobileMenu}
            className="p-3 rounded-xl bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] 
            shadow-lg flex items-center justify-center hover:shadow-xl transition-all duration-200"
            title="Toggle Menu"
          >
            <svg 
              className="w-6 h-6 text-white" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
        <div className={`absolute top-0 ${sidebarCollapsed ? '' : 'left-50'} p-4 hidden lg:block`}>
            <button
              onClick={toggleSidebar}
              className={`w-full p-2 rounded-lg flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-2'}`}
              title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
              style={{backgroundColor: '#FFFFFF',outline:'none',border:'none',boxShadow:'none'}}
            >
              <svg 
                className={`w-5 h-5 text-secondary transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
        </div>
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-40">
            <div className="fixed inset-0 bg-black bg-opacity-50" onClick={toggleMobileMenu}></div>
            <aside className="fixed left-0 top-0 h-full w-72 bg-white shadow-xl transform transition-transform duration-300 ease-in-out z-50">
              <div className="px-6 py-8 border-b border-light from-white to-surface-gray">
                <div className="flex items-center justify-center">
                  <img src={logo} alt="Chat Train Logo" onClick={() => window.location.href = '/dashboard'} className="cursor-pointer h-20 w-auto drop-shadow-sm" />
                </div>
              </div>
              <nav className="flex-1 p-6">
                <div className="space-y-2">
                  <ul className="space-y-1">
                    <li>
                      <Link 
                        to="/dashboard" 
                        className="flex items-center gap-4 rounded-xl px-4 py-3 font-medium transition-all duration-200 hover:bg-surface-gray hover:text-accent"
                        onClick={toggleMobileMenu}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                        </svg>
                        Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/build-new-trainer" 
                        className="flex items-center gap-4 rounded-xl px-4 py-3 font-medium transition-all duration-200 hover:bg-surface-gray hover:text-accent"
                        onClick={toggleMobileMenu}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Build New Trainer
                      </Link>
                    </li>
                    {/* <li>
                      <Link 
                        to="/trainer-test" 
                        className="flex items-center gap-4 rounded-xl px-4 py-3 font-medium transition-all duration-200 hover:bg-surface-gray hover:text-accent"
                        onClick={toggleMobileMenu}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Test Trainers
                      </Link>
                    </li> */}
                    <li>
                      <Link 
                        to="/manage-key" 
                        className="flex items-center gap-4 rounded-xl px-4 py-3 font-medium transition-all duration-200 hover:bg-surface-gray hover:text-accent"
                        onClick={toggleMobileMenu}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                        </svg>
                        Manage Keys
                      </Link>
                    </li>
                    <li>
                      <Link 
                        to="/manage-team" 
                        className="flex items-center gap-4 rounded-xl px-4 py-3 font-medium transition-all duration-200 hover:bg-surface-gray hover:text-accent"
                        onClick={toggleMobileMenu}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Manage Team
                      </Link>
                    </li>
                  </ul>
                  <div className="pt-6 mt-6 border-t border-light">
                    <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-4 px-3">Settings</h3>
                    <Link 
                      to="/settings" 
                      className="flex items-center gap-4 rounded-xl px-4 py-3 font-medium transition-all duration-200 hover:bg-surface-gray hover:text-accent"
                      onClick={toggleMobileMenu}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Settings
                    </Link>
                  </div>
                </div>
              </nav>
              <div className="mt-auto">
                <UserProfile sidebarCollapsed={false} />
              </div>
            </aside>
          </div>
        )}
        <aside className={`${sidebarCollapsed ? 'w-16' : 'w-72'} min-h-screen lg:h-screen lg:sticky lg:top-0 bg-white border-r border-light hidden lg:flex flex-col shadow-lg transition-all duration-300 ease-in-out`}>
          <div className={`${sidebarCollapsed ? 'px-2' : 'px-8'} py-10 border-b border-light from-white to-surface-gray transition-all duration-300`}>
            <div className="flex items-center justify-center">
              {!sidebarCollapsed && (
                <img src={logo} alt="Chat Train Logo" onClick={() => window.location.href = '/dashboard'} className="cursor-pointer h-24 w-auto drop-shadow-sm" />
              )}
            </div>
          </div>
          <nav className="flex-1 p-6">
            <div className="space-y-2">
              <ul className="space-y-1">
                <li>
                  <Link 
                    to="/dashboard" 
                    className={`flex items-center ${sidebarCollapsed ? 'hidden' : 'gap-4'} rounded-xl px-4 py-3 font-medium transition-all duration-200 ${
                      location.pathname === '/dashboard' 
                        ? 'bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] text-[#313F4E] shadow-md transform scale-105' 
                        : 'text-secondary hover:bg-surface-gray hover:text-accent hover:transform hover:scale-105'
                    }`}
                    style={{color: location.pathname === '/dashboard' ? 'white' : ''}}
                    title={sidebarCollapsed ? 'Dashboard' : ''}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                    </svg>
                    {!sidebarCollapsed && 'Dashboard'}
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/build-new-trainer" 
                    className={`flex items-center ${sidebarCollapsed ? 'hidden' : 'gap-4'} rounded-xl px-4 py-3 font-medium transition-all duration-200 ${
                      location.pathname === '/build-new-trainer' 
                        ? 'bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] text-[#313F4E] shadow-md transform scale-105' 
                        : 'text-secondary hover:bg-surface-gray hover:text-accent hover:transform hover:scale-105'
                    }`}
                    style={{color: location.pathname === '/build-new-trainer' ? 'white' : ''}}
                    title={sidebarCollapsed ? 'Build New Trainer' : ''}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    {!sidebarCollapsed && 'Build New Trainer'}
                  </Link>
                </li>
                {/* <li>
                  <Link 
                    to="/trainer-test" 
                    className={`flex items-center ${sidebarCollapsed ? 'hidden' : 'gap-4'} rounded-xl px-4 py-3 font-medium transition-all duration-200 ${
                      location.pathname === '/trainer-test' 
                        ? 'bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] text-[#313F4E] shadow-md transform scale-105' 
                        : 'text-secondary hover:bg-surface-gray hover:text-accent hover:transform hover:scale-105'
                    }`}
                    style={{color: location.pathname === '/trainer-test' ? 'white' : ''}}
                    title={sidebarCollapsed ? 'Test Trainers' : ''}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {!sidebarCollapsed && 'Test Trainers'}
                  </Link>
                </li> */}
                
                <li>
                  <Link 
                    to="/manage-key" 
                    className={`flex items-center ${sidebarCollapsed ? 'hidden' : 'gap-4'} rounded-xl px-4 py-3 font-medium transition-all duration-200 ${
                      location.pathname === '/manage-key' 
                        ? 'bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] text-[#313F4E] shadow-md transform scale-105' 
                        : 'text-secondary hover:bg-surface-gray hover:text-accent hover:transform hover:scale-105'
                    }`}
                    style={{color: location.pathname === '/manage-key' ? 'white' : ''}}
                    title={sidebarCollapsed ? 'Manage Keys' : ''}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    {!sidebarCollapsed && 'Manage Keys'}
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/manage-team" 
                    className={`flex items-center ${sidebarCollapsed ? 'hidden' : 'gap-4'} rounded-xl px-4 py-3 font-medium transition-all duration-200 ${
                      location.pathname === '/manage-team' 
                        ? 'bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] text-[#313F4E] shadow-md transform scale-105' 
                        : 'text-secondary hover:bg-surface-gray hover:text-accent hover:transform hover:scale-105'
                    }`}
                    style={{color: location.pathname === '/manage-team' ? 'white' : ''}}
                    title={sidebarCollapsed ? 'Manage Team' : ''}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    {!sidebarCollapsed && 'Manage Team'}
                  </Link>
                </li>
              </ul>
              <div className="pt-6 mt-6 border-t border-light">
                {!sidebarCollapsed && (
                  <h3 className="text-xs font-semibold text-secondary uppercase tracking-wider mb-4 px-3">Settings</h3>
                )}
                <Link 
                  to="/settings"
                  className={`flex items-center ${sidebarCollapsed ? 'hidden' : 'gap-4'} rounded-xl px-4 py-3 font-medium transition-all duration-200 ${
                    location.pathname === '/settings' 
                      ? 'bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] text-[#313F4E] shadow-md transform scale-105' 
                      : 'text-secondary hover:bg-surface-gray hover:text-accent hover:transform hover:scale-105'
                  }`}
                style={{color: location.pathname === '/settings' ? 'white' : ''}}
                title={sidebarCollapsed ? 'Settings' : ''}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {!sidebarCollapsed && 'Settings'}
                </Link>
              </div>
            </div>
          </nav>
          <UserProfile sidebarCollapsed={sidebarCollapsed} />
        </aside>
        <main className="flex-1 overflow-hidden lg:ml-0">
          <TopHeader />
          <div className="h-full overflow-y-auto pt-0 lg:pt-0">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
export default Layout