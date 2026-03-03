import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function SignIn() {
    const { signIn } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)

    const redirectTo = location.state?.from || '/'

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await signIn(email, password)
            // If the user was trying to go to a specific page before login, send them there.
            // Otherwise, if they are an admin, send them to the admin dashboard.
            // If they are a normal user without a specific destination, send them home.
            if (location.state?.from) {
                navigate(location.state.from, { replace: true })
            } else if (result.isAdmin) {
                navigate('/admin', { replace: true })
            } else {
                navigate('/', { replace: true })
            }

        } catch (err) {
            setError(err.message || 'Sign in failed. Please check your credentials.')
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
                            <rect x="40" y="100" width="120" height="20" rx="10" fill="#1181c8" />
                            <rect x="55" y="70" width="90" height="35" rx="8" fill="#e7d5c2" />
                            <circle cx="70" cy="130" r="10" fill="#e7d5c2" />
                            <circle cx="130" cy="130" r="10" fill="#e7d5c2" />
                            <rect x="62" y="78" width="18" height="15" rx="3" fill="#213349" />
                            <rect x="85" y="78" width="18" height="15" rx="3" fill="#213349" />
                            <rect x="108" y="78" width="18" height="15" rx="3" fill="#213349" />
                        </svg>
                        <h2>Welcome Back!</h2>
                        <p>Sign in to access your bookings, manage reservations, and book new train tickets.</p>
                    </div>
                </div>

                <div className="auth-form-wrap">
                    <div className="auth-form-inner">
                        <div className="auth-header">
                            <Link to="/" className="auth-logo">RailWise</Link>
                            <h1>Sign In</h1>
                            <p>Enter your credentials to continue</p>
                        </div>

                        {error && (
                            <div className="form-error">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10" /><path d="M15 9l-6 6M9 9l6 6" />
                                </svg>
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="signin-email">Email Address</label>
                                <input
                                    type="email"
                                    id="signin-email"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    required
                                    placeholder="you@example.com"
                                    autoComplete="email"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="signin-password">Password</label>
                                <div className="password-field">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        id="signin-password"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                        required
                                        placeholder="Enter your password"
                                        autoComplete="current-password"
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

                            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
                                {loading ? 'Signing in...' : 'Sign In'}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <p>Don't have an account? <Link to="/signup">Create Account</Link></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
