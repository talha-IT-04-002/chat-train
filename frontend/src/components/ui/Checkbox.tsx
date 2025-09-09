import React from 'react'

type CheckboxProps = React.InputHTMLAttributes<HTMLInputElement> & {
  error?: string | boolean
}

const DARK_BLUE = '#0B3A6F'

export function Checkbox({ error, className = '', ...props }: CheckboxProps) {
  const hasError = Boolean(error)
  const base = `h-4 w-4 rounded transition-all duration-200 focus:outline-none`
  const normal = `text-[${DARK_BLUE}] border-[${DARK_BLUE}] focus:ring-[${DARK_BLUE}]`
  const errorCls = `text-red-600 border-red-500 focus:ring-red-500`
  return (
    <input
      type="checkbox"
      aria-invalid={hasError || undefined}
      className={`${base} ${hasError ? errorCls : normal} ${className}`}
      {...props}
    />
  )
}

export default Checkbox


