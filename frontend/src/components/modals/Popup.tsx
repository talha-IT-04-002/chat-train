import { useRef, useEffect } from 'react'
import { X } from 'lucide-react'
import Button from '../Button'

interface PopupProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  size?: 'sm' | 'md' | 'lg'
  showArrow?: boolean
  className?: string
}

function Popup({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  position = 'center',
  size = 'md',
  showArrow = false,
  className = ''
}: PopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)

  const sizeClasses = {
    sm: 'max-w-xs',
    md: 'max-w-sm',
    lg: 'max-w-md'
  }

  const positionClasses = {
    top: 'bottom-full mb-2',
    bottom: 'top-full mt-2',
    left: 'right-full mr-2',
    right: 'left-full ml-2',
    center: ''
  }

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const showCloseButton = onClose !== undefined

  return (
    <div className="fixed inset-0 z-40">
      
      {position === 'center' && (
        <div 
          className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      
      
      <div className={`absolute ${positionClasses[position]} ${sizeClasses[size]} ${className}`}>
        <div
          ref={popupRef}
          className="bg-white rounded-lg shadow-lg border border-[#e2e8f0] transform transition-all duration-200"
          role="dialog"
          aria-modal="true"
          aria-labelledby={title ? 'popup-title' : undefined}
        >
          
          {showArrow && position !== 'center' && (
            <div className={`absolute w-2 h-2 bg-white border border-[#e2e8f0] transform rotate-45 ${
              position === 'top' ? 'top-full -mt-1 left-1/2 -translate-x-1/2 border-t-0 border-l-0' :
              position === 'bottom' ? 'bottom-full -mb-1 left-1/2 -translate-x-1/2 border-b-0 border-r-0' :
              position === 'left' ? 'left-full -ml-1 top-1/2 -translate-y-1/2 border-l-0 border-b-0' :
              'right-full -mr-1 top-1/2 -translate-y-1/2 border-r-0 border-t-0'
            }`} />
          )}

          
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-4 border-b border-[#e2e8f0]">
              {title && (
                <h3 
                  id="popup-title"
                  className="text-sm font-semibold text-[#313F4E] font-family: Inter, sans-serif"
                >
                  {title}
                </h3>
              )}
              {showCloseButton && (
                <Button
                  variant="accent"
                  size="sm"
                  onClick={onClose}
                  className="p-1 h-6 w-6 ml-2"
                  aria-label="Close popup"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          )}

          
          <div className="p-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Popup
