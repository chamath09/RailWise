import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

export default function TrainDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { user } = useAuth()
    const [schedule, setSchedule] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadSchedule()
    }, [id])

    async function loadSchedule() {
        setLoading(true)
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
            console.error(error)
            navigate('/trains')
            return
        }
        setSchedule(data)
        setLoading(false)
    }

    function formatTime(time) {
        const [h, m] = time.split(':')
        const hour = parseInt(h)
        const ampm = hour >= 12 ? 'PM' : 'AM'
        const displayHour = hour % 12 || 12
        return `${displayHour}:${m} ${ampm}`
    }

    function calculateDuration(dep, arr) {
        const [dh, dm] = dep.split(':').map(Number)
        const [ah, am] = arr.split(':').map(Number)
        let diffMins = (ah * 60 + am) - (dh * 60 + dm)
        if (diffMins < 0) diffMins += 24 * 60
        const hours = Math.floor(diffMins / 60)
        const mins = diffMins % 60
        return `${hours}h ${mins}m`
    }

    function handleBookNow() {
        if (user) {
            navigate(`/book/${id}`)
        } else {
            navigate('/signin', { state: { from: `/book/${id}` } })
        }
    }

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Loading train details...</p>
            </div>
        )
    }

    if (!schedule) return null

    const trainType = {
        express: { label: 'Express', className: 'badge-express' },
        intercity: { label: 'Intercity', className: 'badge-intercity' },
        local: { label: 'Local', className: 'badge-local' }
    }[schedule.train?.type] || { label: schedule.train?.type, className: '' }

    return (
        <div className="details-page">
            <div className="container">
                <button className="back-btn" onClick={() => navigate('/trains')}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back to Trains
                </button>

                <div className="details-grid">
                    <div className="details-main">
                        <div className="details-card">
                            <div className="details-header">
                                <div>
                                    <h1>{schedule.train?.name}</h1>
                                    <div className="details-sub">
                                        <span className="train-number">#{schedule.train?.train_number}</span>
                                        <span className={`badge ${trainType.className}`}>{trainType.label}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="details-route">
                                <div className="details-station">
                                    <div className="station-time">{formatTime(schedule.departure_time)}</div>
                                    <div className="station-dot departure"></div>
                                    <div className="station-info">
                                        <h3>{schedule.from_station?.name}</h3>
                                        <span>{schedule.from_station?.city} • {schedule.from_station?.code}</span>
                                    </div>
                                </div>

                                <div className="details-journey">
                                    <div className="journey-line"></div>
                                    <div className="journey-duration">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                            <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                                        </svg>
                                        {calculateDuration(schedule.departure_time, schedule.arrival_time)}
                                    </div>
                                </div>

                                <div className="details-station">
                                    <div className="station-time">{formatTime(schedule.arrival_time)}</div>
                                    <div className="station-dot arrival"></div>
                                    <div className="station-info">
                                        <h3>{schedule.to_station?.name}</h3>
                                        <span>{schedule.to_station?.city} • {schedule.to_station?.code}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="details-info-grid">
                                <div className="info-item">
                                    <span className="info-label">Travel Date</span>
                                    <span className="info-value">
                                        {new Date(schedule.travel_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Available Seats</span>
                                    <span className="info-value">{schedule.available_seats}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Train Type</span>
                                    <span className="info-value" style={{ textTransform: 'capitalize' }}>{schedule.train?.type}</span>
                                </div>
                                <div className="info-item">
                                    <span className="info-label">Duration</span>
                                    <span className="info-value">{calculateDuration(schedule.departure_time, schedule.arrival_time)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="details-sidebar">
                        <div className="booking-card">
                            <h3>Book This Train</h3>
                            <div className="booking-price">
                                <span className="price-label">Price per seat</span>
                                <span className="price-amount">LKR {Number(schedule.price).toLocaleString()}</span>
                            </div>
                            <div className="booking-availability">
                                <div className="avail-bar">
                                    <div className="avail-fill" style={{ width: `${Math.min(100, (schedule.available_seats / 120) * 100)}%` }}></div>
                                </div>
                                <span>{schedule.available_seats} seats available</span>
                            </div>
                            <button className="btn btn-primary btn-lg btn-block" onClick={handleBookNow}>
                                {user ? 'Book Now' : 'Sign In to Book'}
                            </button>
                            {!user && (
                                <p className="booking-note">You need to sign in or create an account to book tickets.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
