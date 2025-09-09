import { Link } from 'react-router-dom'

interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'accent' | 'disabled' | 'error'
  size?: 'sm' | 'md' | 'lg'
  to?: string
  onClick?: (event?: React.MouseEvent) => void
  className?: string
  type?: 'button' | 'submit'
}

function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  to, 
  onClick, 
  className = '',
  type = 'button'
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variantStyles = {
    primary: 'bg-gradient-to-r from-[#313F4E] to-[#2a3542] text-white hover:from-[#2a3542] hover:to-[#1e293b] shadow-md hover:shadow-lg transform hover:scale-105 focus:ring-[#313F4E]',
    accent: 'bg-gradient-to-r from-[#40B1DF] to-[#40B1DF] text-white hover:from-[#40B1DF]/90 hover:to-[#40B1DF]/80 shadow-md hover:shadow-lg transform hover:scale-105 focus:ring-[#40B1DF]',
    disabled: 'bg-[#E0E0E0] text-white cursor-not-allowed opacity-60',
    error: 'bg-gradient-to-r from-[#D8625B] to-[#c55a54] text-white hover:from-[#c55a54] hover:to-[#b24d47] shadow-md hover:shadow-lg transform hover:scale-105 focus:ring-[#D8625B]'
  }
  
  const sizeStyles = {
    sm: 'h-9 px-4 text-sm',
    md: 'h-11 px-6 text-sm',
    lg: 'h-11 px-6 text-base'
  }

  const combinedClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`

  if (to) {
    return (
      <Link to={to} className={combinedClassName} style={{color:"white"}}>
        {children}
      </Link>
    )
  }

  return (
    <button 
      type={type}
      onClick={onClick} 
      className={combinedClassName}
      disabled={variant === 'disabled'}
    >
      {children}
    </button>
  )
}

export default Button