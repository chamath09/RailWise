import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SignUp() {
    const { signUp, signIn } = useAuth()
    const navigate = useNavigate()
    const [fullName, setFullName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setSuccess('')

        if (password !== confirmPassword) {
            setError('Passwords do not match.')
            return
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters.')
            return
        }

        setLoading(true)

        try {
            const data = await signUp(email, password, fullName)

            // If session exists, user was auto-confirmed
            if (data.session) {
                navigate('/', { replace: true })
            } else if (data.user && !data.session) {
                // Email confirmation is required
                setSuccess('Account created successfully! Please check your email to confirm your account, then sign in.')
            }
        } catch (err) {
            setError(err.message || 'Sign up failed. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-visual">
                    <div className="auth-visual-content">
                        <svg className="auth-illustration" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="100" cy="100" r="90" fill="#1a3239" opacity="0.5" />
                            <rect x="50" y="60" width="100" height="80" rx="12" fill="#213349" stroke="#1181c8" strokeWidth="2" />
                            <circle cx="100" cy="90" r="18" fill="#e7d5c2" />
                            <path d="M75 120c0-14 11-25 25-25s25 11 25 25" fill="#1181c8" opacity="0.5" />
                            <rect x="85" y="82" width="6" height="6" rx="1" fill="#213349" />
                            <rect x="97" y="82" width="6" height="6" rx="1" fill="#213349" />
                            <path d="M92 95c0 0 3 4 8 4s8-4 8-4" stroke="#213349" strokeWidth="1.5" fill="none" />
                        </svg>
                        <h2>Join RailWise</h2>
                        <p>Create your account and start booking train tickets in seconds. Fast, secure, and reliable.</p>
                    </div>
                </div>

                <div className="auth-form-wrap">
                    <div className="auth-form-inner">
                        <div className="auth-header">
                            <Link to="/" className="auth-logo">RailWise</Link>
                            <h1>Create Account</h1>
                            <p>Fill in your details to get started</p>
                        </div>

                        {error && (
                            <div className="form-error">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
                                </svg>
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="form-success">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" />
                                </svg>
                                {success}
                            </div>
                        )}

                        {!success && (
                            <form onSubmit={handleSubmit}>
                                <div className="form-group">
                                    <label htmlFor="signup-name">Full Name</label>
                                    <input
                                        type="text"
                                        id="signup-name"
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                        required
                                        placeholder="John Doe"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="signup-email">Email Address</label>
                                    <input
                                        type="email"
                                        id="signup-email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        required
                                        placeholder="you@example.com"
                                        autoComplete="email"
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="signup-password">Password</label>
                                    <div className="password-field">
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            id="signup-password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            required
                                            placeholder="At least 6 characters"
                                            autoComplete="new-password"
                                        />
                                        <button type="button" className="password-toggle" onClick={() => setShowPassword(!showPassword)}>
                                            {showPassword ? (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24M1 1l22 22" /></svg>
                                            ) : (
                                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="signup-confirm">Confirm Password</label>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="signup-confirm"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                        placeholder="Re-enter your password"
                                        autoComplete="new-password"
                                    />
                                </div>

                                <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
                                    {loading ? 'Creating Account...' : 'Create Account'}
                                </button>
                            </form>
                        )}

                        <div className="auth-footer">
                            <p>Already have an account? <Link to="/signin">Sign In</Link></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
