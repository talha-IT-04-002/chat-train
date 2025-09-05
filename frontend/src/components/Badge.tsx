interface BadgeProps {
  children: React.ReactNode
  variant?: 'primary' | 'accent' | 'error' | 'gray'
  className?: string
}

function Badge({ children, variant = 'gray', className = '' }: BadgeProps) {
  const variantStyles = {
    primary: 'bg-gradient-to-r from-[#40B1DF] to-[#3aa0c9] text-[#313F4E] shadow-sm',
    accent: 'bg-gradient-to-r from-[#313F4E] to-[#2a3542] text-white shadow-sm',
    error: 'bg-gradient-to-r from-[#D8625B] to-[#c55a54] text-white shadow-sm',
    gray: 'bg-[#f8fafc] text-[#64748b] border border-[#e2e8f0]'
  }

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold font-family: Inter, sans-serif transition-all duration-200 ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  )
}

export default Badge
