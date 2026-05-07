import React, { useState, useEffect, useRef } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'

const ToastContext = React.createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = (message, type = 'success') => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type, leaving: false }])
    setTimeout(() => {
      setToasts(prev => prev.map(t => t.id === id ? { ...t, leaving: true } : t))
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, 350)
    }, 3500)
  }

  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container">
        {toasts.map(t => (
          <div
            key={t.id}
            className={`toast ${t.type === 'success' ? 'toast-success' : 'toast-error'} ${t.leaving ? 'animate-toast-out' : 'animate-toast-in'}`}
          >
            {t.type === 'success'
              ? <CheckCircle size={18} style={{ color: '#34d399', flexShrink: 0 }} />
              : <XCircle    size={18} style={{ color: '#f87171', flexShrink: 0 }} />
            }
            <span>{t.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return React.useContext(ToastContext)
}
