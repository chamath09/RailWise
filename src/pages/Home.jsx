import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { motion } from 'framer-motion'

export default function Home() {
    const navigate = useNavigate()
    const [stations, setStations] = useState([])
    const [from, setFrom] = useState('')
    const [to, setTo] = useState('')
    const [date, setDate] = useState('')
    const [stats, setStats] = useState({ trains: 0, stations: 0, routes: 0 })

    useEffect(() => {
        loadStations()
        loadStats()
    }, [])

    async function loadStations() {
        const { data } = await supabase.from('stations').select('*').order('name')
        if (data) setStations(data)
    }

    async function loadStats() {
        const [trains, stationsData, schedules] = await Promise.all([
            supabase.from('trains').select('id', { count: 'exact', head: true }),
            supabase.from('stations').select('id', { count: 'exact', head: true }),
            supabase.from('schedules').select('id', { count: 'exact', head: true })
        ])
        setStats({
            trains: trains.count || 0,
            stations: stationsData.count || 0,
            routes: schedules.count || 0
        })
    }

    function handleSearch(e) {
        e.preventDefault()
        const params = new URLSearchParams()
        if (from) params.set('from', from)
        if (to) params.set('to', to)
        if (date) params.set('date', date)
        navigate(`/trains?${params.toString()}`)
    }

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.15
            }
        }
    }

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    }

    return (
        <motion.div
            className="home-page"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
        >
            <section className="hero">
                <div className="hero-bg" style={{
                    backgroundImage: `linear-gradient(rgba(13, 27, 42, 0.6), rgba(13, 27, 42, 0.9)), url('/train-hero.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundRepeat: 'no-repeat',
                }}>
                </div>
                <div className="hero-content">
                    <motion.div
                        className="hero-badge"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        🚆 Fast & Reliable Booking
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.3 }}
                    >
                        Travel Smarter with <span className="text-accent">RailWise</span>
                    </motion.h1>

                    <motion.p
                        className="hero-subtitle"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.7, delay: 0.5 }}
                    >
                        Search schedules, compare routes, and book your train tickets in seconds.
                        Your journey starts here.
                    </motion.p>

                    <motion.form
                        className="search-form"
                        onSubmit={handleSearch}
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.7, ease: "easeOut" }}
                    >
                        <div className="search-fields">
                            <div className="search-field">
                                <label htmlFor="from-station">From</label>
                                <select id="from-station" value={from} onChange={e => setFrom(e.target.value)}>
                                    <option value="">Any Station</option>
                                    {stations.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                    ))}
                                </select>
                            </div>

                            <button type="button" className="swap-btn" onClick={() => { setFrom(to); setTo(from) }} aria-label="Swap stations">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
                                </svg>
                            </button>

                            <div className="search-field">
                                <label htmlFor="to-station">To</label>
                                <select id="to-station" value={to} onChange={e => setTo(e.target.value)}>
                                    <option value="">Any Station</option>
                                    {stations.map(s => (
                                        <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="search-field">
                                <label htmlFor="travel-date">Date</label>
                                <input type="date" id="travel-date" value={date} onChange={e => setDate(e.target.value)} />
                            </div>
                        </div>
                        <button type="submit" className="btn btn-primary btn-lg search-submit">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                            </svg>
                            Search Trains
                        </button>
                    </motion.form>
                </div>
            </section>

            <motion.section
                className="stats-section"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={containerVariants}
            >
                <div className="container">
                    <div className="stats-grid">
                        <motion.div className="stat-card" variants={itemVariants}>
                            <div className="stat-icon">🚂</div>
                            <div className="stat-number">{stats.trains}</div>
                            <div className="stat-label">Active Trains</div>
                        </motion.div>
                        <motion.div className="stat-card" variants={itemVariants}>
                            <div className="stat-icon">🏛️</div>
                            <div className="stat-number">{stats.stations}</div>
                            <div className="stat-label">Stations</div>
                        </motion.div>
                        <motion.div className="stat-card" variants={itemVariants}>
                            <div className="stat-icon">🗺️</div>
                            <div className="stat-number">{stats.routes}</div>
                            <div className="stat-label">Daily Routes</div>
                        </motion.div>
                        <motion.div className="stat-card" variants={itemVariants}>
                            <div className="stat-icon">⚡</div>
                            <div className="stat-number">24/7</div>
                            <div className="stat-label">Online Booking</div>
                        </motion.div>
                    </div>
                </div>
            </motion.section>

            <motion.section
                className="features-section"
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={containerVariants}
            >
                <div className="container">
                    <motion.h2 className="section-title" variants={itemVariants}>
                        Why Choose <span className="text-accent">RailWise</span>?
                    </motion.h2>
                    <div className="features-grid">
                        <motion.div className="feature-card" variants={itemVariants}>
                            <div className="feature-icon-wrap">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                                </svg>
                            </div>
                            <h3>Instant Booking</h3>
                            <p>Book your tickets in under 60 seconds with our streamlined checkout process.</p>
                        </motion.div>
                        <motion.div className="feature-card" variants={itemVariants}>
                            <div className="feature-icon-wrap">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                                </svg>
                            </div>
                            <h3>Secure Payments</h3>
                            <p>Your data is protected with industry-standard encryption and security protocols.</p>
                        </motion.div>
                        <motion.div className="feature-card" variants={itemVariants}>
                            <div className="feature-icon-wrap">
                                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                    <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
                                </svg>
                            </div>
                            <h3>Real-Time Updates</h3>
                            <p>Get live schedule updates and instant notifications for your booked journeys.</p>
                        </motion.div>
                    </div>
                </div>
            </motion.section>
        </motion.div>
    )
}
