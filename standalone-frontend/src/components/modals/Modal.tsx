import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import Button from '../Button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showCloseButton?: boolean
  className?: string
}

function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md',
  showCloseButton = true,
  className = ''
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
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
    if (isOpen && modalRef.current) {
      modalRef.current.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      
      
      <div
        ref={modalRef}
        className={`relative bg-white border border-light rounded-xl shadow-2xl w-full ${sizeClasses[size]} ${className} max-h-[90vh] overflow-hidden flex flex-col transform transition-all duration-200 animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-4`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        tabIndex={-1}
      >
        
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[#e2e8f0]">
            {title && (
              <h2 
                id="modal-title"
                className="text-xl font-bold text-[#313F4E] font-family: Inter, sans-serif"
              >
                {title}
              </h2>
            )}
            {showCloseButton && (
              <Button
                onClick={onClose}
              >
                <X className="w-4 h-4" style={{fill: 'white'}} />
              </Button>
            )}
          </div>
        )}

        
        <div className="p-4 sm:p-6 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal
