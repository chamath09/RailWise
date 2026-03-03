import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect, useRef } from 'react'

export default function Navbar() {
    const { user, isAdmin, signOut } = useAuth()
    const navigate = useNavigate()
    const [menuOpen, setMenuOpen] = useState(false)
    const [dropdownOpen, setDropdownOpen] = useState(false)
    const dropdownRef = useRef(null)

    const handleSignOut = async () => {
        await signOut()
        setDropdownOpen(false)
        setMenuOpen(false)
        navigate('/')
    }

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setDropdownOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const avatarInitial = user?.user_metadata?.full_name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || '?'
    const displayName = user?.user_metadata?.full_name || user?.email

    return (
        <nav className="navbar">
            <div className="navbar-inner">
                <Link to="/" className="navbar-brand">
                    <svg className="navbar-logo" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect x="2" y="18" width="28" height="4" rx="2" fill="#1181c8" />
                        <rect x="6" y="10" width="20" height="10" rx="3" fill="#e7d5c2" />
                        <circle cx="10" cy="24" r="3" fill="#e7d5c2" />
                        <circle cx="22" cy="24" r="3" fill="#e7d5c2" />
                        <rect x="8" y="12" width="5" height="5" rx="1" fill="#213349" />
                        <rect x="15" y="12" width="5" height="5" rx="1" fill="#213349" />
                        <rect x="22" y="12" width="4" height="5" rx="1" fill="#213349" />
                    </svg>
                    <span>RailWise</span>
                </Link>

                <button className="navbar-toggle" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu">
                    <span className={`hamburger ${menuOpen ? 'open' : ''}`}></span>
                </button>

                <div className={`navbar-menu ${menuOpen ? 'active' : ''}`}>
                    <Link to="/" className="navbar-link" onClick={() => setMenuOpen(false)}>Home</Link>
                    <Link to="/trains" className="navbar-link" onClick={() => setMenuOpen(false)}>Trains</Link>
                    {user && (
                        <Link to="/my-bookings" className="navbar-link" onClick={() => setMenuOpen(false)}>My Bookings</Link>
                    )}
                    {isAdmin && (
                        <Link to="/admin" className="navbar-link navbar-link-admin" onClick={() => setMenuOpen(false)}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                            </svg>
                            Admin
                        </Link>
                    )}

                    {user ? (
                        <div className="navbar-user" ref={dropdownRef}>
                            <button className="navbar-user-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                                <div className="navbar-avatar">
                                    {avatarInitial}
                                </div>
                                <span className="navbar-user-name">{displayName}</span>
                                <svg className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`} width="12" height="12" viewBox="0 0 12 12">
                                    <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" fill="none" />
                                </svg>
                            </button>
                            {dropdownOpen && (
                                <div className="dropdown-menu">
                                    {/* Profile section */}
                                    <div className="dropdown-profile">
                                        <div className="dropdown-profile-avatar">
                                            {avatarInitial}
                                        </div>
                                        <div className="dropdown-profile-info">
                                            <p className="dropdown-profile-name">{user.user_metadata?.full_name || 'User'}</p>
                                            <p className="dropdown-email">{user.email}</p>
                                            {isAdmin && <span className="dropdown-admin-badge">Admin</span>}
                                        </div>
                                    </div>
                                    {isAdmin && (
                                        <Link to="/admin" className="dropdown-item dropdown-item-admin" onClick={() => { setDropdownOpen(false); setMenuOpen(false) }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
                                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9" />
                                            </svg>
                                            Admin Panel
                                        </Link>
                                    )}
                                    <Link to="/my-bookings" className="dropdown-item dropdown-item-bookings" onClick={() => { setDropdownOpen(false); setMenuOpen(false) }}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <rect x="3" y="4" width="18" height="16" rx="2" />
                                            <path d="M8 9h8M8 13h5" />
                                        </svg>
                                        My Bookings
                                    </Link>
                                    <button className="dropdown-item dropdown-item-signout" onClick={handleSignOut}>
                                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                                            <path d="M6 14H3.33C2.6 14 2 13.4 2 12.67V3.33C2 2.6 2.6 2 3.33 2H6M10.67 11.33L14 8L10.67 4.67M14 8H6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                        </svg>
                                        Sign Out
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="navbar-auth">
                            <Link to="/signin" className="btn btn-ghost" onClick={() => setMenuOpen(false)}>Sign In</Link>
                            <Link to="/signup" className="btn btn-primary btn-sm" onClick={() => setMenuOpen(false)}>Sign Up</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    )
}
