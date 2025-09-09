import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button, Dialog, Modal, Popup } from '../components'
import { Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api'
import logo from '../assets/logo.png'
function LoginSignup() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login, isAuthenticated, error, clearError } = useAuth()
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotMessage, setForgotMessage] = useState('')
  const [showHelpPopup, setShowHelpPopup] = useState(false)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  useEffect(() => {
    if (error) {
      setShowErrorDialog(true)
    }
  }, [error])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setShowErrorDialog(true)
      return
    }
    setIsLoading(true)
    clearError()
    try {
      const result = await login(email, password)
      if (result && !result.success && result.reason === 'EMAIL_NOT_VERIFIED') {
        navigate('/email-verification', { replace: true, state: { email } })
        return
      }
    } catch (error) {
      console.error('Login failed:', error)
    } finally {
      setIsLoading(false)
    }
    navigate('/dashboard', { replace: true })
  }
  const handleForgotPassword = () => {
    setForgotMessage('')
    setForgotEmail(email)
    setShowForgotPassword(true)
  }
  const confirmResetPassword = () => {
    if (!forgotEmail) {
      setForgotMessage('Please enter your email address.')
      return
    }
    setForgotLoading(true)
    setForgotMessage('')
    apiService.forgotPassword(forgotEmail)
      .then((res) => {
        if (res.success) {
          setForgotMessage('Password reset email sent. Please check your inbox.')
        } else {
          setForgotMessage(res.message || 'Failed to send reset email.')
        }
      })
      .catch(() => {
        setForgotMessage('Failed to send reset email. Please try again.')
      })
      .finally(() => {
        setForgotLoading(false)
      })
  }
  return (
    <div className="h-screen bg-gradient-to-br from-[#f8fafc] via-white to-[#f1f5f9] flex overflow-hidden" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden">        
        <div className="absolute inset-0">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-32 right-16 w-24 h-24 bg-white/5 rounded-full blur-lg animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-white/8 rounded-full blur-md animate-pulse delay-500"></div>
        </div>
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        <div className="relative z-10 flex items-center justify-center w-full p-12">
          <div className="text-center text-white max-w-md">
            
            <div className="inline-flex items-center justify-center mb-8">
              <img src={logo} alt="ChatTrain Logo" className="drop-shadow-lg" />
            </div>
            <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-white/40 rounded-full animate-bounce"></div>
            <div className="absolute bottom-1/3 left-1/4 w-1 h-1 bg-white/30 rounded-full animate-ping"></div>
          </div>
        </div>
      </div>
      <div className="w-full lg:w-1/2 flex items-center p-4 lg:p-8 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-20 right-20 w-16 h-16 bg-gradient-to-r from-[#40B1DF]/20 to-[#40B1DF]/0 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-32 left-16 w-12 h-12 bg-gradient-to-r from-[#40B1DF]/15 to-[#40B1DF]/0 rounded-full blur-lg animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 right-1/3 w-8 h-8 bg-gradient-to-r from-[#40B1DF]/10 to-[#40B1DF]/0 rounded-full blur-md animate-pulse delay-500"></div>
          <div className="absolute inset-0 opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, #40B1DF 1px, transparent 0)`,
              backgroundSize: '30px 30px'
            }}></div>
          </div>          
          <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-[#40B1DF]/40 rounded-full animate-bounce"></div>
          <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-[#40B1DF]/30 rounded-full animate-ping"></div>
          <div className="absolute top-2/3 left-1/3 w-1 h-1 bg-[#40B1DF]/50 rounded-full animate-bounce delay-1000"></div>
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#40B1DF]/5 to-transparent"></div>
        </div>       
        <div className="w-full max-w-md relative z-10">
          <div className="text-center mb-6 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
              <img src={logo} alt="ChatTrain Logo" className="h-10 w-auto" />
            </div>
            <h1 className="text-2xl font-bold text-[#313F4E] tracking-tight mb-2">
              Welcome to ChatTrain
            </h1>
            <p className="text-[#64748b] text-sm">
              All aboard! Sign in to propel your training forward
            </p>
          </div>
          <div className="hidden lg:block mb-6 text-center">
            <h2 className="text-3xl font-bold text-[#313F4E] mb-2">
              Sign in to ChatTrain
            </h2>
            <p className="text-[#64748b]">
              The L&D Engine - Propelling Training Forward
            </p>
          </div>
          <div className="p-6 transition-all duration-300">
            <form className="space-y-4" onSubmit={handleSignIn}>
              <div>
                <label className="block text-sm font-semibold text-[#313F4E] mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-[#64748b] group-focus-within:text-[#40B1DF] transition-colors duration-300" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    className="w-full pl-10 pr-4 py-3 border border-[#e2e8f0] rounded-2xl text-[#313F4E] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:bg-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#313F4E] mb-2">
                  Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-[#64748b] group-focus-within:text-[#40B1DF] transition-colors duration-300" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full pl-10 pr-10 py-3 border border-[#e2e8f0] rounded-2xl text-[#313F4E] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm group-hover:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-[#64748b] cursor-pointer hover:text-[#313F4E] transition-colors duration-300" />
                    ) : (
                      <Eye className="h-4 w-4 text-[#64748b] cursor-pointer hover:text-[#313F4E] transition-colors duration-300" />
                    )}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center group cursor-pointer">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-[#40B1DF] focus:ring-[#40B1DF] border-[#e2e8f0] rounded transition-all duration-300"
                  />
                  <span className="ml-2 text-sm text-[#64748b] group-hover:text-[#313F4E] transition-colors duration-300">
                    Remember me
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-[#40B1DF] hover:text-[#40B1DF]/80 font-medium transition-colors duration-300 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <Button 
                variant="primary" 
                size="lg" 
                type="submit"
                className="w-full py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02]"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing In...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In
                  </>
                )}
              </Button>
            </form>
            <div className="text-center mt-6">
              <p className="text-[#64748b] text-sm">
                Don't have an account?{' '}
                <Link
                  to="/signup"
                  className="text-[#40B1DF] hover:text-[#40B1DF]/80 font-semibold transition-colors duration-300 hover:underline"
                >
                  Sign up for free
                </Link>
              </p>
            </div>
          </div>
          <div className="text-center mt-4">
            <p className="text-xs text-[#64748b]">
              By signing in, you agree to our{' '}
              <Link to="#" className="text-[#40B1DF] hover:text-[#40B1DF]/80 transition-colors duration-300 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="#" className="text-[#40B1DF] hover:text-[#40B1DF]/80 transition-colors duration-300 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
          {/* Help Button */}
          {/* <div className="absolute top-4 right-4">
            <Button
              variant="accent"
              size="sm"
              onClick={() => setShowHelpPopup(true)}
              className="rounded-full p-2"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
          </div> */}
        </div>
      </div>
      <Modal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
        title="Reset Password"
        size="md"
      >
        <div className="space-y-6">
          <p className="text-sm text-[#64748b]">
            Enter your email address and we'll send you a link to reset your password.
          </p>
          
          {forgotMessage && (
            <div className="p-3 rounded-lg border border-[#e2e8f0] bg-white/60 text-sm text-[#313F4E]">
              {forgotMessage}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-[#313F4E] font-family: Inter, sans-serif mb-3">
              Email Address
            </label>
            <input
              type="email"
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-[#e2e8f0] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent"
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-[#e2e8f0]">
            <Button 
              variant="accent" 
              size="md" 
              onClick={() => setShowForgotPassword(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              variant="primary" 
              size="md" 
              onClick={confirmResetPassword}
              className="flex-1"
            >
              {forgotLoading ? 'Sending...' : 'Send Reset Link'}
            </Button>
          </div>
        </div>
      </Modal>
      <Dialog
        isOpen={showErrorDialog}
        onClose={() => {
          setShowErrorDialog(false)
          clearError()
        }}
        onConfirm={() => {
          setShowErrorDialog(false)
          clearError()
        }}
        title="Login Error"
        message={error || "Please enter both your email and password to continue."}
        confirmText="OK"
        variant="danger"
      />
      <Popup
        isOpen={showHelpPopup}
        onClose={() => setShowHelpPopup(false)}
        title="Sign In Help"
        position="top"
      >
        <div className="space-y-3">
          <p className="text-sm text-[#64748b]">
            Having trouble signing in? Here are some common solutions:
          </p>
          <ul className="text-sm text-[#64748b] space-y-1">
            <li>• Check that your email address is correct</li>
            <li>• Make sure your password is entered properly</li>
            <li>• Try using the "Forgot password" link</li>
            <li>• Clear your browser cache and cookies</li>
            <li>• Contact support if issues persist</li>
          </ul>
        </div>
      </Popup>
    </div>
  )
}

export default LoginSignup