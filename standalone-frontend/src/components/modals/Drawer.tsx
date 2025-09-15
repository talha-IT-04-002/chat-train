import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import Button from '../Button'

interface DrawerProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  position?: 'left' | 'right' | 'top' | 'bottom'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
  className?: string
}

function Drawer({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  position = 'right',
  size = 'md',
  showCloseButton = true,
  className = ''
}: DrawerProps) {
  const drawerRef = useRef<HTMLDivElement>(null)

  const sizeClasses = {
    sm: position === 'left' || position === 'right' ? 'w-80' : 'h-80',
    md: position === 'left' || position === 'right' ? 'w-96' : 'h-96',
    lg: position === 'left' || position === 'right' ? 'w-[28rem]' : 'h-[28rem]',
    xl: position === 'left' || position === 'right' ? 'w-[32rem]' : 'h-[32rem]'
  }

  const positionClasses = {
    left: 'left-0 top-0 h-full transform -translate-x-full',
    right: 'right-0 top-0 h-full transform translate-x-full',
    top: 'top-0 left-0 w-full transform -translate-y-full',
    bottom: 'bottom-0 left-0 w-full transform translate-y-full'
  }

  const transformClasses = {
    left: isOpen ? 'translate-x-0' : '-translate-x-full',
    right: isOpen ? 'translate-x-0' : 'translate-x-full',
    top: isOpen ? 'translate-y-0' : '-translate-y-full',
    bottom: isOpen ? 'translate-y-0' : 'translate-y-full'
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  useEffect(() => {
    if (isOpen && drawerRef.current) {
      drawerRef.current.focus()
    }
  }, [isOpen])

  return (
    <div className={`fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
      
      <div 
        className={`absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={drawerRef}
        className={`absolute ${positionClasses[position]} ${sizeClasses[size]} bg-white border border-light shadow-2xl transition-transform duration-300 ease-in-out ${transformClasses[position]} ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'drawer-title' : undefined}
        tabIndex={-1}
      >
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-6 border-b border-[#e2e8f0]">
            {title && (
              <h2 
                id="drawer-title"
                className="text-xl font-bold text-[#313F4E] font-family: Inter, sans-serif"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <Button
                variant="accent"
                size="sm"
                onClick={onClose}
                className="p-2 h-9 w-9"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Drawer