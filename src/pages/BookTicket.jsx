import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function BookTicket() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [schedule, setSchedule] = useState(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [seats, setSeats] = useState(1)
    const [passengerName, setPassengerName] = useState(user?.user_metadata?.full_name || '')
    const [passengerEmail, setPassengerEmail] = useState(user?.email || '')
    const [success, setSuccess] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        loadSchedule()
    }, [id])

    useEffect(() => {
        if (user) {
            setPassengerName(user.user_metadata?.full_name || '')
            setPassengerEmail(user.email || '')
        }
    }, [user])

    async function loadSchedule() {
        const { data, error } = await supabase
            .from('schedules')
            .select(`
        *,
        train:trains(*),
        from_station:stations!schedules_from_station_id_fkey(*),
        to_station:stations!schedules_to_station_id_fkey(*)
      `)
            .eq('id', id)
            .single()

        if (error) {
            navigate('/trains')
            return
        }
        setSchedule(data)
        setLoading(false)
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        if (seats > schedule.available_seats) {
            setError(`Only ${schedule.available_seats} seats available.`)
            setSubmitting(false)
            return
        }

        const totalPrice = Number(schedule.price) * seats

        const { error: bookingError } = await supabase.from('bookings').insert({
            user_id: user.id,
            schedule_id: schedule.id,
            seats,
            total_price: totalPrice,
            passenger_name: passengerName,
            passenger_email: passengerEmail,
            status: 'confirmed'
        })

        if (bookingError) {
            setError(bookingError.message)
            setSubmitting(false)
            return
        }

        // Update available seats
        await supabase
            .from('schedules')
            .update({ available_seats: schedule.available_seats - seats })
            .eq('id', schedule.id)

        setSuccess(true)
        setSubmitting(false)
    }

    function formatTime(time) {
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
                <p>Loading booking details...</p>
            </div>
        )
    }

    if (success) {
        return (
            <div className="booking-page">
                <div className="container">
                    <div className="success-card">
                        <div className="success-icon">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--blue-grotto)" strokeWidth="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <path d="M22 4L12 14.01l-3-3" />
                            </svg>
                        </div>
                        <h2>Booking Confirmed! 🎉</h2>
                        <p>Your ticket has been booked successfully.</p>
                        <div className="success-details">
                            <div className="success-row">
                                <span>Train</span>
                                <strong>{schedule.train?.name}</strong>
                            </div>
                            <div className="success-row">
                                <span>Route</span>
                                <strong>{schedule.from_station?.name} → {schedule.to_station?.name}</strong>
                            </div>
                            <div className="success-row">
                                <span>Seats</span>
                                <strong>{seats}</strong>
                            </div>
                            <div className="success-row">
                                <span>Total Price</span>
                                <strong>LKR {(Number(schedule.price) * seats).toLocaleString()}</strong>
                            </div>
                        </div>
                        <div className="success-actions">
                            <button className="btn btn-primary" onClick={() => navigate('/my-bookings')}>View My Bookings</button>
                            <button className="btn btn-ghost" onClick={() => navigate('/trains')}>Browse More Trains</button>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="booking-page">
            <div className="container">
                <button className="back-btn" onClick={() => navigate(`/trains/${id}`)}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back to Details
                </button>

                <div className="page-header">
                    <h1>Book Your <span className="text-accent">Ticket</span></h1>
                    <p>Complete the form below to confirm your booking</p>
                </div>

                <div className="booking-grid">
                    <div className="booking-form-wrap">
                        <form className="booking-form" onSubmit={handleSubmit}>
                            <h3>Passenger Details</h3>

                            {error && <div className="form-error">{error}</div>}

                            <div className="form-group">
                                <label htmlFor="passenger-name">Full Name</label>
                                <input
                                    type="text"
                                    id="passenger-name"
                                    value={passengerName}
                                    onChange={e => setPassengerName(e.target.value)}
                                    required
                                    placeholder="Enter passenger full name"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="passenger-email">Email</label>
                                <input
                                    type="email"
                                    id="passenger-email"
                                    value={passengerEmail}
                                    onChange={e => setPassengerEmail(e.target.value)}
                                    required
                                    placeholder="Enter email address"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="num-seats">Number of Seats</label>
                                <input
                                    type="number"
                                    id="num-seats"
                                    min="1"
                                    max={schedule.available_seats}
                                    value={seats}
                                    onChange={e => setSeats(parseInt(e.target.value) || 1)}
                                    required
                                />
                                <span className="form-hint">{schedule.available_seats} seats available</span>
                            </div>

                            <div className="price-summary">
                                <div className="price-row">
                                    <span>Price per seat</span>
                                    <span>LKR {Number(schedule.price).toLocaleString()}</span>
                                </div>
                                <div className="price-row">
                                    <span>Seats</span>
                                    <span>× {seats}</span>
                                </div>
                                <div className="price-row total">
                                    <span>Total</span>
                                    <span>LKR {(Number(schedule.price) * seats).toLocaleString()}</span>
                                </div>
                            </div>

                            <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={submitting}>
                                {submitting ? 'Processing...' : 'Confirm Booking'}
                            </button>
                        </form>
                    </div>

                    <div className="booking-summary">
                        <div className="summary-card">
                            <h3>Trip Summary</h3>
                            <div className="summary-train">
                                <strong>{schedule.train?.name}</strong>
                                <span>#{schedule.train?.train_number}</span>
                            </div>
                            <div className="summary-route">
                                <div className="summary-point">
                                    <span className="summary-time">{formatTime(schedule.departure_time)}</span>
                                    <span>{schedule.from_station?.name}</span>
                                </div>
                                <div className="summary-arrow">↓</div>
                                <div className="summary-point">
                                    <span className="summary-time">{formatTime(schedule.arrival_time)}</span>
                                    <span>{schedule.to_station?.name}</span>
                                </div>
                            </div>
                            <div className="summary-date">
                                📅 {new Date(schedule.travel_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
