import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react'
import Button from '../Button'

interface DialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info' | 'success'
  isLoading?: boolean
}

function Dialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  isLoading = false
}: DialogProps) {
  const variantConfig = {
    danger: {
      icon: XCircle,
      iconColor: 'text-[#D8625B]',
      bgColor: 'bg-[#D8625B]/10',
      buttonVariant: 'error' as const
    },
    warning: {
      icon: AlertTriangle,
      iconColor: 'text-[#f59e0b]',
      bgColor: 'bg-[#f59e0b]/10',
      buttonVariant: 'accent' as const
    },
    info: {
      icon: Info,
      iconColor: 'text-[#40B1DF]',
      bgColor: 'bg-[#40B1DF]/10',
      buttonVariant: 'accent' as const
    },
    success: {
      icon: CheckCircle,
      iconColor: 'text-[#10b981]',
      bgColor: 'bg-[#10b981]/10',
      buttonVariant: 'primary' as const
    }
  }

  const config = variantConfig[variant]
  const IconComponent = config.icon

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${isOpen ? 'block' : 'hidden'}`}>
        
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
        
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-200 border border-light">
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className={`flex-shrink-0 w-10 h-10 ${config.bgColor} rounded-full flex items-center justify-center`}>
              <IconComponent className={`w-5 h-5 ${config.iconColor}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-[#313F4E] font-family: Inter, sans-serif mb-2">
                {title}
              </h3>
              <p className="text-[#64748b] font-family: Inter, sans-serif text-sm leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <Button
              variant="accent"
              size="md"
              onClick={onClose}
              className="min-w-[80px]"
            >
              {cancelText}
            </Button>
            <Button
              variant={isLoading ? 'disabled' : config.buttonVariant}
              size="md"
              onClick={onConfirm}
              className="min-w-[80px]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Loading...
                </div>
              ) : (
                confirmText
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dialog
