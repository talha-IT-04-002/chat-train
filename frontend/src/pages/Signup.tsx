import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '../components'
import { useAuth } from '../contexts/AuthContext'
import { Mail, Lock, Eye, EyeOff, User, Building } from 'lucide-react'
import logo from '../assets/logo.png'
function Signup() {
  const navigate = useNavigate();
  const { register, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    organizationName: ''
  });
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
    clearError();
  };
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    }
    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to the terms and conditions';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    try {
      await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        organizationName: formData.organizationName || undefined
      });
      navigate('/email-verification');
    } catch (error) {
      console.error('Registration failed:', error);
    } finally {
      setIsLoading(false);
    }
  };
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
        <div className="w-full max-w-md relative z-10 mt-14">
          <div className="text-center mb-6 lg:hidden">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-2xl shadow-lg mb-4">
              <img src={logo} alt="ChatTrain Logo" className="h-10 w-auto" />
            </div>
            <h1 className="text-2xl font-bold text-[#313F4E] tracking-tight mb-2">
              Join ChatTrain
            </h1>
            <p className="text-[#64748b] text-sm">
              All aboard! Get on track with your training journey
            </p>
          </div>
          <div className="hidden lg:block mb-6 text-center">
            <h2 className="text-3xl font-bold text-[#313F4E] mb-2 pt-1">
              Create your ChatTrain account
            </h2>
            <p className="text-[#64748b]">
              The L&D Engine - Propelling Training Forward
            </p>
          </div>
          <div className="p-6 transition-all duration-300">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#313F4E] mb-2">
                  First Name
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="Enter your first name"
                    className={`w-full pl-10 pr-4 py-3 border rounded-2xl text-[#0B3A6F] placeholder-[#64748b] bg-white focus:outline-none transition-all duration-300 ${
                      errors.firstName ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500' : 'border-[#0B3A6F] focus:ring-2 focus:ring-[#0B3A6F] focus:border-[#0B3A6F]'
                    }`}
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-red-500 text-xs">{errors.firstName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#313F4E] mb-2">
                  Last Name
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Enter your last name"
                    className={`w-full pl-10 pr-4 py-3 border rounded-2xl text-[#0B3A6F] placeholder-[#64748b] bg-white focus:outline-none transition-all duration-300 ${
                      errors.lastName ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500' : 'border-[#0B3A6F] focus:ring-2 focus:ring-[#0B3A6F] focus:border-[#0B3A6F]'
                    }`}
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-red-500 text-xs">{errors.lastName}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#313F4E] mb-2">
                  Email Address
                </label>
                <div className="relative group">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    className={`w-full pl-10 pr-4 py-3 border rounded-2xl text-[#0B3A6F] placeholder-[#64748b] bg-white focus:outline-none transition-all duration-300 ${
                      errors.email ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500' : 'border-[#0B3A6F] focus:ring-2 focus:ring-[#0B3A6F] focus:border-[#0B3A6F]'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-red-500 text-xs">{errors.email}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#313F4E] mb-2">
                  Password
                </label>
                <div className="relative group">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Create a strong password"
                    className={`w-full pl-10 pr-10 py-3 border rounded-2xl text-[#0B3A6F] placeholder-[#64748b] bg-white focus:outline-none transition-all duration-300 ${
                      errors.password ? 'border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500' : 'border-[#0B3A6F] focus:ring-2 focus:ring-[#0B3A6F] focus:border-[#0B3A6F]'
                    }`}
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
                {errors.password && (
                  <p className="mt-1 text-red-500 text-xs">{errors.password}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-[#313F4E] mb-2">
                  Organization Name (Optional)
                </label>
                <div className="relative group">
                  <input
                    type="text"
                    name="organizationName"
                    value={formData.organizationName}
                    onChange={handleInputChange}
                    placeholder="Enter your organization name"
                    className="w-full pl-10 pr-4 py-3 border rounded-2xl text-[#0B3A6F] placeholder-[#64748b] bg-white focus:outline-none transition-all duration-300 border-[#0B3A6F] focus:ring-2 focus:ring-[#0B3A6F] focus:border-[#0B3A6F]"
                  />
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="h-4 w-4 text-[#0B3A6F] focus:ring-[#0B3A6F] border-[#0B3A6F] rounded transition-all duration-300 mt-1"
                />
                <label htmlFor="terms" className="text-sm text-[#64748b] leading-relaxed">
                  I agree to the{' '}
                  <Link to="#" className="text-[#40B1DF] hover:text-[#40B1DF]/80 font-medium transition-colors duration-300 hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link to="#" className="text-[#40B1DF] hover:text-[#40B1DF]/80 font-medium transition-colors duration-300 hover:underline">
                    Privacy Policy
                  </Link>
                </label>
              </div>
              {errors.terms && (
                <p className="text-red-500 text-xs">{errors.terms}</p>
              )}
              <Button 
                variant={isLoading ? 'disabled' : 'primary'} 
                size="lg" 
                type="submit"
                className="w-full py-3 rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating Account...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    Create Account
                  </>
                )}
              </Button>
            </form>
            <div className="text-center mt-6">
              <p className="text-[#64748b] text-sm">
                Already have an account?{' '}
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
              By creating an account, you agree to our{' '}
              <Link to="#" className="text-[#40B1DF] hover:text-[#40B1DF]/80 transition-colors duration-300 hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="#" className="text-[#40B1DF] hover:text-[#40B1DF]/80 transition-colors duration-300 hover:underline">
                Privacy Policy
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Signup