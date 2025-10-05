import React from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, CheckCircle, Info, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AlertProps {
  type: 'error' | 'success' | 'warning' | 'info'
  title?: string
  message: string
  onClose?: () => void
  className?: string
}

export function CustomAlert({ type, title, message, onClose, className = '' }: AlertProps) {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4" />
      case 'success':
        return <CheckCircle className="h-4 w-4" />
      case 'warning':
        return <AlertCircle className="h-4 w-4" />
      case 'info':
        return <Info className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getAlertVariant = () => {
    switch (type) {
      case 'error':
        return 'destructive'
      case 'success':
        return 'default'
      case 'warning':
        return 'default'
      case 'info':
        return 'default'
      default:
        return 'default'
    }
  }

  const getAlertClass = () => {
    switch (type) {
      case 'error':
        return 'border-red-200 bg-red-50 text-red-800'
      case 'success':
        return 'border-green-200 bg-green-50 text-green-800'
      case 'warning':
        return 'border-yellow-200 bg-yellow-50 text-yellow-800'
      case 'info':
        return 'border-blue-200 bg-blue-50 text-blue-800'
      default:
        return 'border-gray-200 bg-gray-50 text-gray-800'
    }
  }

  return (
    <div className={`relative ${className}`}>
      <Alert className={`${getAlertClass()} border-l-4 border-l-current`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <div className="flex-1">
            {title && (
              <h4 className="font-semibold text-sm mb-1">{title}</h4>
            )}
            <AlertDescription className="text-sm">
              {message}
            </AlertDescription>
          </div>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex-shrink-0 h-6 w-6 p-0 hover:bg-transparent"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Alert>
    </div>
  )
}

