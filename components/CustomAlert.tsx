import React, { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AlertProps {
  type: 'error' | 'success' | 'warning' | 'info'
  title?: string
  message: string
  onClose?: () => void
  className?: string
}

export function CustomAlert({ type, title, message, onClose, className = '' }: AlertProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // Animación de entrada
    setIsVisible(true)
  }, [])

  const getIcon = () => {
    const iconClass = "h-6 w-6"
    switch (type) {
      case 'error':
        return <AlertCircle className={iconClass} />
      case 'success':
        return <CheckCircle2 className={iconClass} />
      case 'warning':
        return <AlertCircle className={iconClass} />
      case 'info':
        return <Info className={iconClass} />
      default:
        return <Info className={iconClass} />
    }
  }

  const getAlertStyles = () => {
    switch (type) {
      case 'error':
        return {
          container: 'bg-gradient-to-r from-red-50 to-red-50/80 border-red-400 shadow-xl shadow-red-200/50',
          icon: 'text-red-600',
          title: 'text-red-900',
          message: 'text-red-700',
          border: 'border-l-4 border-l-red-600'
        }
      case 'success':
        return {
          container: 'bg-gradient-to-r from-green-50 to-emerald-50/80 border-green-400 shadow-xl shadow-green-200/50',
          icon: 'text-green-600',
          title: 'text-green-900',
          message: 'text-green-700',
          border: 'border-l-4 border-l-green-600'
        }
      case 'warning':
        return {
          container: 'bg-gradient-to-r from-yellow-50 to-amber-50/80 border-yellow-400 shadow-xl shadow-yellow-200/50',
          icon: 'text-yellow-600',
          title: 'text-yellow-900',
          message: 'text-yellow-700',
          border: 'border-l-4 border-l-yellow-600'
        }
      case 'info':
        return {
          container: 'bg-gradient-to-r from-blue-50 to-cyan-50/80 border-blue-400 shadow-xl shadow-blue-200/50',
          icon: 'text-blue-600',
          title: 'text-blue-900',
          message: 'text-blue-700',
          border: 'border-l-4 border-l-blue-600'
        }
      default:
        return {
          container: 'bg-gradient-to-r from-gray-50 to-gray-50/80 border-gray-400 shadow-xl shadow-gray-200/50',
          icon: 'text-gray-600',
          title: 'text-gray-900',
          message: 'text-gray-700',
          border: 'border-l-4 border-l-gray-600'
        }
    }
  }

  const styles = getAlertStyles()

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(() => {
      onClose?.()
    }, 300)
  }

  return (
    <div 
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md transition-all duration-300 ease-in-out ${
        isVisible 
          ? 'opacity-100 translate-y-0' 
          : 'opacity-0 -translate-y-4 pointer-events-none'
      } ${className}`}
    >
      <div className={`${styles.container} ${styles.border} border rounded-xl shadow-lg p-5 backdrop-blur-sm`}>
        <div className="flex items-start gap-4">
          {/* Icono */}
          <div className={`flex-shrink-0 ${styles.icon} mt-0.5`}>
            {getIcon()}
          </div>
          
          {/* Contenido */}
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className={`${styles.title} font-bold text-base mb-2`}>
                {title}
              </h4>
            )}
            <p className={`${styles.message} text-sm leading-relaxed font-medium`}>
              {message}
            </p>
          </div>
          
          {/* Botón cerrar */}
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className={`flex-shrink-0 h-8 w-8 p-0 rounded-full hover:bg-black/10 transition-colors ${styles.message}`}
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

