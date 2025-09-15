import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
  className?: string
  hover?: boolean
}

function Card({ children, className = '', hover = true }: CardProps) {
  const baseClasses = "rounded-xl border border-[#e2e8f0] bg-white p-6 shadow-sm transition-all duration-200"
  const hoverClasses = hover ? "hover:shadow-lg hover:border-[#cbd5e1] hover:transform hover:scale-[1.02]" : ""
  
  return (
    <div className={`${baseClasses} ${hoverClasses} ${className}`}>
      {children}
    </div>
  )
}

export default Card
