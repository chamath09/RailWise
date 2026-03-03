import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function MyBookings() {
    const { user } = useAuth()
    const [bookings, setBookings] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) loadBookings()
    }, [user])

    async function loadBookings() {
        setLoading(true)
        const { data, error } = await supabase
            .from('bookings')
            .select(`
        *,
        schedule:schedules(
          *,
          train:trains(*),
          from_station:stations!schedules_from_station_id_fkey(*),
          to_station:stations!schedules_to_station_id_fkey(*)
        )
      `)
            .eq('user_id', user.id)
            .order('booked_at', { ascending: false })

        if (error) console.error(error)
        setBookings(data || [])
        setLoading(false)
    }

    async function handleCancel(bookingId) {
        if (!confirm('Are you sure you want to cancel this booking?')) return

        const { error } = await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', bookingId)

        if (!error) {
            setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: 'cancelled' } : b))
        }
    }

    function formatTime(time) {
        if (!time) return ''
        const [h, m] = time.split(':')
        const hour = parseInt(h)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour % 12 || 12
        return `${displayHour}:${m} ${ampm}`
    }

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Loading bookings...</p>
            </div>
        )
    }

    return (
        <div className="bookings-page">
            <div className="container">
                <div className="page-header">
                    <h1>My <span className="text-accent">Bookings</span></h1>
                    <p>View and manage your train ticket reservations</p>
                </div>

                {bookings.length === 0 ? (
                    <div className="empty-state">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--champagne)" strokeWidth="1">
                            <rect x="2" y="3" width="20" height="18" rx="2" /><path d="M8 7h8M8 11h8M8 15h4" />
                        </svg>
                        <h3>No bookings yet</h3>
                        <p>You haven't made any ticket reservations. Start by searching for trains!</p>
                        <Link to="/trains" className="btn btn-primary">Find Trains</Link>
                    </div>
                ) : (
                    <div className="bookings-list">
                        {bookings.map(booking => (
                            <div key={booking.id} className={`booking-item ${booking.status}`}>
                                <div className="booking-item-header">
                                    <div className="booking-train">
                                        <h3>{booking.schedule?.train?.name}</h3>
                                        <span className="train-number">#{booking.schedule?.train?.train_number}</span>
                                    </div>
                                    <span className={`status-badge status-${booking.status}`}>
                                        {booking.status === 'confirmed' ? '✓ Confirmed' : '✗ Cancelled'}
                                    </span>
                                </div>

                                <div className="booking-route-info">
                                    <div className="booking-point">
                                        <span className="booking-time">{formatTime(booking.schedule?.departure_time)}</span>
                                        <span className="booking-station">{booking.schedule?.from_station?.name}</span>
                                    </div>
                                    <div className="booking-arrow">→</div>
                                    <div className="booking-point">
                                        <span className="booking-time">{formatTime(booking.schedule?.arrival_time)}</span>
                                        <span className="booking-station">{booking.schedule?.to_station?.name}</span>
                                    </div>
                                </div>

                                <div className="booking-details-row">
                                    <span>📅 {new Date(booking.schedule?.travel_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                    <span>👤 {booking.passenger_name}</span>
                                    <span>💺 {booking.seats} seat{booking.seats > 1 ? 's' : ''}</span>
                                    <span className="booking-total">LKR {Number(booking.total_price).toLocaleString()}</span>
                                </div>

                                <div className="booking-item-footer">
                                    <span className="booking-date">Booked on {new Date(booking.booked_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                    {booking.status === 'confirmed' && (
                                        <button className="btn btn-danger btn-sm" onClick={() => handleCancel(booking.id)}>
                                            Cancel Booking
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
