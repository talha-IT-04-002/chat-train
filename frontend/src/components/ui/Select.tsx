import React from 'react'

type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  error?: string | boolean
}

const DARK_BLUE = '#0B3A6F'

export function Select({ error, className = '', children, ...props }: SelectProps) {
  const hasError = Boolean(error)
  const base = `w-full px-4 py-2 rounded-lg border bg-white text-[${DARK_BLUE}] transition-all duration-200 focus:outline-none`
  const normal = `border-[${DARK_BLUE}] focus:ring-2 focus:ring-[${DARK_BLUE}] focus:border-[${DARK_BLUE}]`
  const errorCls = `border-red-500 focus:ring-2 focus:ring-red-500 focus:border-red-500`
  return (
    <select
      aria-invalid={hasError || undefined}
      className={`${base} ${hasError ? errorCls : normal} ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

export default Select


