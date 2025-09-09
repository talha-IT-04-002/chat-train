import { useState, useEffect } from 'react'
import { Link, useSearchParams, useNavigate, useLocation } from 'react-router-dom'
import { apiService } from '../services/api'
import logo from '../assets/logo.png'

function EmailVerification() {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'success' | 'error'>('pending');
  const [isLoading, setIsLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');

  const token = searchParams.get('token');
  const emailFromQuery = searchParams.get('email');

  useEffect(() => {
    // If there's a token in the URL, verify it automatically
    if (token) {
      verifyEmail(token);
    }
  }, [token]);

  useEffect(() => {
    // Prefill email from navigation state or query param if available
    const emailFromState = (location.state as { email?: string } | null)?.email;
    if (emailFromState) {
      setEmail(emailFromState);
    } else if (emailFromQuery) {
      setEmail(emailFromQuery);
    } else {
      try {
        const last = localStorage.getItem('lastLoginEmail');
        if (last) setEmail(last);
      } catch {}
    }
  }, [location.state, emailFromQuery]);

  const verifyEmail = async (verificationToken: string) => {
    setIsLoading(true);
    setMessage('');
    
    try {
      const response = await apiService.verifyEmail(verificationToken);
      
      if (response.success) {
        setVerificationStatus('success');
        setMessage('Email verified successfully! You can now log in to your account.');
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setVerificationStatus('error');
        setMessage(response.message || 'Verification failed. Please try again.');
      }
    } catch (error) {
      setVerificationStatus('error');
      setMessage('Verification failed. The link may be expired or invalid.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setMessage('Please enter your email address.');
      return;
    }

    setResendLoading(true);
    setMessage('');
    
    try {
      const response = await apiService.resendVerification(email);
      
      if (response.success) {
        setMessage('Verification email sent successfully! Please check your inbox.');
      } else {
        setMessage(response.message || 'Failed to send verification email.');
      }
    } catch (error) {
      setMessage('Failed to send verification email. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  const getStatusContent = () => {
    switch (verificationStatus) {
      case 'success':
        return {
          icon: (
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          ),
          title: 'Email Verified Successfully!',
          subtitle: 'Your email has been verified. You will be redirected to login shortly.',
          color: 'text-green-600'
        };
      
      case 'error':
        return {
          icon: (
            <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          ),
          title: 'Verification Failed',
          subtitle: 'The verification link is invalid or has expired.',
          color: 'text-red-600'
        };
      
      default:
        return {
          icon: (
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#40B1DF]/10 rounded-full mb-4">
              <svg className="w-8 h-8 text-[#40B1DF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          ),
          title: 'Verify your email address',
          subtitle: 'We\'ve sent a verification link to your email address.',
          color: 'text-[#40B1DF]'
        };
    }
  };

  const statusContent = getStatusContent();

  return (
    <div className="h-screen bg-gradient-to-br from-[#f8fafc] via-white to-[#f1f5f9] flex overflow-hidden">

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
              <img src={logo} alt="Chat Train Logo" className="drop-shadow-lg" />
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
              <img src={logo} alt="Chat Train Logo" className="h-10 w-auto" />
            </div>
            <h1 className="text-2xl font-bold text-[#313F4E] tracking-tight mb-2">
              Email Verification
            </h1>
            <p className="text-[#64748b] text-sm">
              Verify your email to continue
            </p>
          </div>

          

          
          <div className="p-6 transition-all duration-300">
            
            <div className="text-center mb-6">
              {statusContent.icon}
              <h3 className="text-xl font-semibold text-[#313F4E] mb-2">
                {statusContent.title}
              </h3>
              <p className="text-[#64748b] text-sm leading-relaxed">
                {statusContent.subtitle}
              </p>
            </div>

            {/* Loading State */}
            {isLoading && (
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-[#40B1DF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="text-[#40B1DF]">Verifying your email...</span>
                </div>
              </div>
            )}

            {/* Message Display */}
            {message && (
              <div className={`mb-6 p-4 rounded-lg border ${
                verificationStatus === 'success' 
                  ? 'bg-green-50 border-green-200' 
                  : verificationStatus === 'error'
                  ? 'bg-red-50 border-red-200'
                  : 'bg-blue-50 border-blue-200'
              }`}>
                <p className={`text-sm ${
                  verificationStatus === 'success' 
                    ? 'text-green-600' 
                    : verificationStatus === 'error'
                    ? 'text-red-600'
                    : 'text-blue-600'
                }`}>
                  {message}
                </p>
              </div>
            )}

            {/* Instructions for pending verification */}
            {verificationStatus === 'pending' && !token && (
              <div className="space-y-4 mb-6">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#40B1DF] rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-[#64748b]">
                    Check your email inbox for a message from Chat Train
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#40B1DF] rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-[#64748b]">
                    Click the verification link in the email
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-[#40B1DF] rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm text-[#64748b]">
                    You'll be redirected to complete your account setup
                  </p>
                </div>
              </div>
            )}

            
            <div className="space-y-3">
              {/* Resend Email Form */}
              {verificationStatus === 'pending' && !token && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-semibold text-[#313F4E] mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      className="w-full px-4 py-3 border border-[#e2e8f0] rounded-2xl text-[#313F4E] placeholder-[#64748b] focus:outline-none focus:ring-2 focus:ring-[#40B1DF] focus:border-transparent transition-all duration-300 bg-white/50 backdrop-blur-sm"
                    />
                  </div>
                  
                  <button 
                    onClick={handleResendEmail}
                    disabled={resendLoading || !email}
                    className="w-full flex items-center justify-center px-4 py-3 border border-[#e2e8f0] rounded-2xl text-[#313F4E] font-medium hover:bg-[#f8fafc] transition-all duration-300 transform hover:scale-[1.02] shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {resendLoading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-[#40B1DF]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Sending...
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Resend Email
                      </div>
                    )}
                  </button>
                </div>
              )}

              {/* Manual Verification Button */}
              {verificationStatus === 'error' && (
                <button 
                  onClick={() => navigate('/signup')}
                  className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] text-white rounded-2xl font-medium hover:shadow-lg transition-all duration-300 transform hover:scale-[1.02]"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                  Create New Account
                </button>
              )}
            </div>


            <div className="mt-6 pt-6 border-t border-[#e2e8f0]">
              <div className="text-center">
                <p className="text-xs text-[#64748b] mb-3">
                  Didn't receive the email? Check your spam folder or
                </p>
                <button 
                  onClick={() => navigate('/signup')}
                  className="text-sm text-[#40B1DF] hover:text-[#40B1DF]/80 font-medium transition-colors duration-300 hover:underline"
                >
                  try a different email address
                </button>
              </div>
            </div>

            
            <div className="text-center mt-6">
              <p className="text-[#64748b] text-sm">
                Already verified?{' '}
                <Link
                  to="/login"
                  className="text-[#40B1DF] hover:text-[#40B1DF]/80 font-semibold transition-colors duration-300 hover:underline"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>

          
          <div className="text-center mt-4">
            <p className="text-xs text-[#64748b]">
              Need help?{' '}
              <Link to="#" className="text-[#40B1DF] hover:text-[#40B1DF]/80 transition-colors duration-300 hover:underline">
                Contact Support
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailVerification
