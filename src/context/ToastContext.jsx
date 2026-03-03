import { createContext, useContext, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ToastContext = createContext({})

export const useToast = () => useContext(ToastContext)

let toastId = 0

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([])
    const [confirmDialog, setConfirmDialog] = useState(null)

    const addToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = ++toastId
        setToasts(prev => [...prev, { id, message, type }])
        if (duration > 0) {
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id))
            }, duration)
        }
    }, [])

    const success = useCallback((msg) => addToast(msg, 'success'), [addToast])
    const error = useCallback((msg) => addToast(msg, 'error'), [addToast])
    const warning = useCallback((msg) => addToast(msg, 'warning'), [addToast])
    const info = useCallback((msg) => addToast(msg, 'info'), [addToast])

    const removeToast = useCallback((id) => {
        setToasts(prev => prev.filter(t => t.id !== id))
    }, [])

    const confirm = useCallback((options) => {
        return new Promise((resolve) => {
            setConfirmDialog({
                title: options.title || 'Confirm Action',
                message: options.message || 'Are you sure?',
                confirmText: options.confirmText || 'Confirm',
                cancelText: options.cancelText || 'Cancel',
                type: options.type || 'danger',
                icon: options.icon || null,
                onConfirm: () => { setConfirmDialog(null); resolve(true) },
                onCancel: () => { setConfirmDialog(null); resolve(false) },
            })
        })
    }, [])

    const toastIcons = {
        success: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
            </svg>
        ),
        error: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
        ),
        warning: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
        ),
        info: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
        ),
    }

    const confirmIcons = {
        danger: (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" strokeWidth="1.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
        ),
        warning: (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f39c12" strokeWidth="1.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
        ),
        info: (
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1181c8" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
        ),
    }

    return (
        <ToastContext.Provider value={{ success, error, warning, info, confirm }}>
            {children}

            {/* Toast Notifications */}
            <div className="toast-container">
                <AnimatePresence>
                    {toasts.map(toast => (
                        <motion.div
                            key={toast.id}
                            className={`toast toast-${toast.type}`}
                            initial={{ opacity: 0, y: -20, x: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
                            exit={{ opacity: 0, x: 40, scale: 0.9 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                        >
                            <div className="toast-icon">{toastIcons[toast.type]}</div>
                            <p className="toast-message">{toast.message}</p>
                            <button className="toast-close" onClick={() => removeToast(toast.id)}>×</button>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Confirmation Dialog */}
            <AnimatePresence>
                {confirmDialog && (
                    <motion.div
                        className="confirm-overlay"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={confirmDialog.onCancel}
                    >
                        <motion.div
                            className="confirm-card"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="confirm-icon">
                                {confirmDialog.icon || confirmIcons[confirmDialog.type] || confirmIcons.danger}
                            </div>
                            <h3 className="confirm-title">{confirmDialog.title}</h3>
                            <p className="confirm-message">{confirmDialog.message}</p>
                            <div className="confirm-actions">
                                <button className="btn btn-ghost" onClick={confirmDialog.onCancel}>
                                    {confirmDialog.cancelText}
                                </button>
                                <button className={`btn ${confirmDialog.type === 'danger' ? 'btn-danger-solid' : 'btn-primary'}`} onClick={confirmDialog.onConfirm}>
                                    {confirmDialog.confirmText}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </ToastContext.Provider>
    )
}
