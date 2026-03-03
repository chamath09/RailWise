import { useState, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'

export default function Trains() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const [schedules, setSchedules] = useState([])
    const [stations, setStations] = useState([])
    const [loading, setLoading] = useState(true)
    const [from, setFrom] = useState(searchParams.get('from') || '')
    const [to, setTo] = useState(searchParams.get('to') || '')
    const [date, setDate] = useState(searchParams.get('date') || '')

    useEffect(() => {
        loadStations()
    }, [])

    useEffect(() => {
        loadSchedules()
    }, [from, to, date])

    async function loadStations() {
        const { data } = await supabase.from('stations').select('*').order('name')
        if (data) setStations(data)
    }

    async function loadSchedules() {
        setLoading(true)
        let query = supabase
            .from('schedules')
            .select(`
        *,
        train:trains(*),
        from_station:stations!schedules_from_station_id_fkey(*),
        to_station:stations!schedules_to_station_id_fkey(*)
      `)
            .order('departure_time')

        if (from) query = query.eq('from_station_id', from)
        if (to) query = query.eq('to_station_id', to)
        if (date) query = query.eq('travel_date', date)

        const { data, error } = await query
        if (error) console.error(error)
        setSchedules(data || [])
        setLoading(false)
    }

    function getTrainTypeBadge(type) {
        const badges = {
            express: { label: 'Express', className: 'badge-express' },
            intercity: { label: 'Intercity', className: 'badge-intercity' },
            local: { label: 'Local', className: 'badge-local' }
        }
        return badges[type] || { label: type, className: '' }
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

    function handleBookNow(e, scheduleId) {
        e.preventDefault()
        e.stopPropagation()
        if (user) {
            navigate(`/book/${scheduleId}`)
        } else {
            navigate('/signin')
        }
    }

    return (
        <div className="trains-page">
            <div className="container">
                <div className="page-header">
                    <h1>Find Your <span className="text-accent">Train</span></h1>
                    <p>Browse available routes and schedules</p>
                </div>

                <div className="filter-bar">
                    <div className="filter-field">
                        <label>From</label>
                        <select value={from} onChange={e => setFrom(e.target.value)}>
                            <option value="">All Stations</option>
                            {stations.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-field">
                        <label>To</label>
                        <select value={to} onChange={e => setTo(e.target.value)}>
                            <option value="">All Stations</option>
                            {stations.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="filter-field">
                        <label>Date</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => { setFrom(''); setTo(''); setDate('') }}>
                        Clear Filters
                    </button>
                </div>

                {loading ? (
                    <div className="loading-screen">
                        <div className="loading-spinner"></div>
                        <p>Loading schedules...</p>
                    </div>
                ) : schedules.length === 0 ? (
                    <div className="empty-state">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--champagne)" strokeWidth="1">
                            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                        </svg>
                        <h3>No trains found</h3>
                        <p>Try adjusting your search filters or check a different date.</p>
                    </div>
                ) : (
                    <div className="schedules-list">
                        {schedules.map((schedule, index) => {
                            const badge = getTrainTypeBadge(schedule.train?.type)
                            return (
                                <motion.div
                                    key={schedule.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.05, duration: 0.4 }}
                                >
                                    <Link to={`/trains/${schedule.id}`} className="schedule-card">
                                        <div className="schedule-card-header">
                                            <div className="train-info">
                                                <h3>{schedule.train?.name}</h3>
                                                <span className="train-number">#{schedule.train?.train_number}</span>
                                            </div>
                                            <span className={`badge ${badge.className}`}>{badge.label}</span>
                                        </div>

                                        <div className="schedule-route">
                                            <div className="route-point">
                                                <span className="route-time">{formatTime(schedule.departure_time)}</span>
                                                <span className="route-station">{schedule.from_station?.name}</span>
                                                <span className="route-code">{schedule.from_station?.code}</span>
                                            </div>

                                            <div className="route-line">
                                                <span className="route-duration">{calculateDuration(schedule.departure_time, schedule.arrival_time)}</span>
                                                <div className="route-track">
                                                    <div className="route-dot"></div>
                                                    <div className="route-dash"></div>
                                                    <svg className="route-train-icon" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d="M12 2c-4 0-8 1-8 5v9.5C4 18.43 5.57 20 7.5 20L6 21.5v.5h2.23l2-2H14l2 2h2v-.5L16.5 20c1.93 0 3.5-1.57 3.5-3.5V7c0-4-4.68-5-8-5zM7.5 17c-.83 0-1.5-.67-1.5-1.5S6.67 14 7.5 14s1.5.67 1.5 1.5S8.33 17 7.5 17zm3.5-7H6V7h5v3zm2 0V7h5v3h-5zm3.5 7c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z" />
                                                    </svg>
                                                    <div className="route-dash"></div>
                                                    <div className="route-dot"></div>
                                                </div>
                                            </div>

                                            <div className="route-point">
                                                <span className="route-time">{formatTime(schedule.arrival_time)}</span>
                                                <span className="route-station">{schedule.to_station?.name}</span>
                                                <span className="route-code">{schedule.to_station?.code}</span>
                                            </div>
                                        </div>

                                        <div className="schedule-card-footer">
                                            <div className="schedule-meta">
                                                <span className="schedule-date">📅 {new Date(schedule.travel_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                                                <span className="schedule-seats">💺 {schedule.available_seats} seats</span>
                                            </div>
                                            <div className="schedule-card-actions">
                                                <div className="schedule-price">
                                                    LKR {Number(schedule.price).toLocaleString()}
                                                </div>
                                                <button
                                                    className="btn btn-primary btn-book-now"
                                                    onClick={(e) => handleBookNow(e, schedule.id)}
                                                >
                                                    Book Now →
                                                </button>
                                            </div>
                                        </div>
                                    </Link>
                                </motion.div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
