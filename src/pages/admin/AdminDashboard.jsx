import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'
import { motion } from 'framer-motion'
import {
    BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'

const COLORS = {
    confirmed: '#2ecc71',
    cancelled: '#e74c3c',
    admin: '#1181c8',
    user: '#e7d5c2',
    grid: 'rgba(231, 213, 194, 0.08)',
    text: '#9bb0c4',
    bg: '#1a3042',
}

const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
        opacity: 1, y: 0,
        transition: { delay: i * 0.08, duration: 0.45, ease: [0.4, 0, 0.2, 1] }
    }),
}

const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
        <div className="chart-tooltip">
            <p className="chart-tooltip-label">{label}</p>
            {payload.map((p, i) => (
                <p key={i} style={{ color: p.color }}>
                    {p.name}: <strong>{p.value}</strong>
                </p>
            ))}
        </div>
    )
}

export default function AdminDashboard() {
    const [stats, setStats] = useState({ trains: 0, stations: 0, schedules: 0, bookings: 0 })
    const [bookingStats, setBookingStats] = useState({
        total: 0, adminBookings: 0, userBookings: 0, confirmed: 0, cancelled: 0
    })
    const [trendData, setTrendData] = useState([])
    const [recentBookings, setRecentBookings] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadDashboard()
        const bookingSubscription = supabase
            .channel('admin-dashboard-bookings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
                loadDashboard()
            })
            .subscribe()
        return () => { bookingSubscription.unsubscribe() }
    }, [])

    async function loadDashboard() {
        const [trains, stations, schedules, bookingsCount] = await Promise.all([
            supabase.from('trains').select('id', { count: 'exact', head: true }),
            supabase.from('stations').select('id', { count: 'exact', head: true }),
            supabase.from('schedules').select('id', { count: 'exact', head: true }),
            supabase.from('bookings').select('id', { count: 'exact', head: true })
        ])

        setStats({
            trains: trains.count || 0,
            stations: stations.count || 0,
            schedules: schedules.count || 0,
            bookings: bookingsCount.count || 0
        })

        // Fetch all bookings (no FK join needed)
        const { data: allBookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('*')

        if (bookingsError) console.error('Bookings fetch error:', bookingsError)

        const bookings = allBookings || []

        // Fetch admin user IDs separately from profiles
        const { data: adminProfiles } = await supabase
            .from('profiles')
            .select('id')
            .eq('is_admin', true)

        const adminUserIds = new Set((adminProfiles || []).map(p => p.id))

        const adminB = bookings.filter(b => adminUserIds.has(b.user_id)).length
        const userB = bookings.length - adminB
        const confirmedB = bookings.filter(b => b.status === 'confirmed').length
        const cancelledB = bookings.filter(b => b.status === 'cancelled').length

        setBookingStats({
            total: bookings.length,
            adminBookings: adminB,
            userBookings: userB,
            confirmed: confirmedB,
            cancelled: cancelledB,
        })

        // Build trend data (last 7 days)
        const trendMap = {}
        const now = new Date()
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now)
            d.setDate(d.getDate() - i)
            const key = d.toISOString().split('T')[0]
            trendMap[key] = { date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), confirmed: 0, cancelled: 0, total: 0 }
        }

        bookings.forEach(b => {
            const bookedDate = b.booked_at ? b.booked_at.split('T')[0] : null
            if (bookedDate && trendMap[bookedDate]) {
                trendMap[bookedDate].total++
                if (b.status === 'confirmed') trendMap[bookedDate].confirmed++
                if (b.status === 'cancelled') trendMap[bookedDate].cancelled++
            }
        })
        setTrendData(Object.values(trendMap))

        // Recent bookings
        const { data: recent } = await supabase
            .from('bookings')
            .select(`*, schedule:schedules(*, train:trains(*), from_station:stations!schedules_from_station_id_fkey(*), to_station:stations!schedules_to_station_id_fkey(*))`)
            .order('booked_at', { ascending: false })
            .limit(5)
        setRecentBookings(recent || [])
        setLoading(false)
    }

    const statusData = [
        { name: 'Confirmed', value: bookingStats.confirmed, color: COLORS.confirmed },
        { name: 'Cancelled', value: bookingStats.cancelled, color: COLORS.cancelled },
    ]

    const roleData = [
        { name: 'Admin', value: bookingStats.adminBookings, color: COLORS.admin },
        { name: 'Users', value: bookingStats.userBookings, color: COLORS.user },
    ]

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Loading dashboard...</p>
            </div>
        )
    }

    return (
        <div className="admin-page">
            <div className="container">
                <div className="admin-header">
                    <div>
                        <h1>Admin <span className="text-accent">Dashboard</span></h1>
                        <p>Manage your railway system</p>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="admin-stats-grid">
                    {[
                        { to: '/admin/trains', icon: '🚂', num: stats.trains, label: 'Trains', action: 'Manage →' },
                        { to: '/admin/stations', icon: '🏛️', num: stats.stations, label: 'Stations', action: 'Manage →' },
                        { to: '/admin/schedules', icon: '📅', num: stats.schedules, label: 'Schedules', action: 'Manage →' },
                        { icon: '🎫', num: stats.bookings, label: 'Bookings' },
                    ].map((s, i) => {
                        const Card = s.to ? Link : 'div'
                        return (
                            <motion.div key={i} custom={i} variants={cardVariants} initial="hidden" animate="visible">
                                <Card to={s.to} className="admin-stat-card">
                                    <div className="admin-stat-icon">{s.icon}</div>
                                    <div className="admin-stat-info">
                                        <span className="admin-stat-number">{s.num}</span>
                                        <span className="admin-stat-label">{s.label}</span>
                                    </div>
                                    {s.action && <span className="admin-stat-action">{s.action}</span>}
                                </Card>
                            </motion.div>
                        )
                    })}
                </div>

                {/* Booking Summary Cards */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
                    <div className="admin-section">
                        <h2>📊 Booking Summary</h2>
                        <div className="booking-summary-grid">
                            {[
                                { label: 'Total Bookings', value: bookingStats.total, icon: '📋', accent: '#1181c8' },
                                { label: 'Admin Bookings', value: bookingStats.adminBookings, icon: '🛡️', accent: '#1181c8' },
                                { label: 'User Bookings', value: bookingStats.userBookings, icon: '👤', accent: '#e7d5c2' },
                                { label: 'Confirmed', value: bookingStats.confirmed, icon: '✅', accent: '#2ecc71' },
                                { label: 'Cancelled', value: bookingStats.cancelled, icon: '❌', accent: '#e74c3c' },
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    custom={i}
                                    variants={cardVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="summary-stat-card"
                                    style={{ '--stat-accent': item.accent }}
                                >
                                    <span className="summary-stat-icon">{item.icon}</span>
                                    <span className="summary-stat-value">{item.value}</span>
                                    <span className="summary-stat-label">{item.label}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Charts Section */}
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
                    <div className="admin-section">
                        <h2>📈 Analytics & Trends</h2>
                        <div className="charts-grid">
                            {/* Booking Trends Line Chart */}
                            <div className="chart-card chart-card-wide">
                                <h3>Booking Trends (Last 7 Days)</h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <LineChart data={trendData}>
                                        <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tick={{ fill: COLORS.text, fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: COLORS.text, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend />
                                        <Line type="monotone" dataKey="confirmed" stroke={COLORS.confirmed} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Confirmed" />
                                        <Line type="monotone" dataKey="cancelled" stroke={COLORS.cancelled} strokeWidth={2.5} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Cancelled" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Status Pie Chart */}
                            <div className="chart-card">
                                <h3>Status Distribution</h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <PieChart>
                                        <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                            {statusData.map((entry, idx) => (
                                                <Cell key={idx} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip content={<CustomTooltip />} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Admin vs User Bar Chart */}
                            <div className="chart-card">
                                <h3>Admin vs User Bookings</h3>
                                <ResponsiveContainer width="100%" height={280}>
                                    <BarChart data={roleData} barSize={50}>
                                        <CartesianGrid stroke={COLORS.grid} strokeDasharray="3 3" />
                                        <XAxis dataKey="name" tick={{ fill: COLORS.text, fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fill: COLORS.text, fontSize: 12 }} axisLine={false} tickLine={false} allowDecimals={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Bar dataKey="value" name="Bookings" radius={[8, 8, 0, 0]}>
                                            {roleData.map((entry, idx) => (
                                                <Cell key={idx} fill={entry.color} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Recent Bookings Table */}
                {recentBookings.length > 0 && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
                        <div className="admin-section">
                            <h2>Recent Bookings</h2>
                            <div className="admin-table-wrap">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Passenger</th>
                                            <th>Train</th>
                                            <th>Route</th>
                                            <th>Seats</th>
                                            <th>Total</th>
                                            <th>Status</th>
                                            <th>Booked</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentBookings.map(b => (
                                            <tr key={b.id}>
                                                <td>{b.passenger_name}</td>
                                                <td>{b.schedule?.train?.name}</td>
                                                <td>{b.schedule?.from_station?.name} → {b.schedule?.to_station?.name}</td>
                                                <td>{b.seats}</td>
                                                <td>LKR {Number(b.total_price).toLocaleString()}</td>
                                                <td><span className={`admin-badge admin-badge-${b.status}`}>{b.status}</span></td>
                                                <td>{new Date(b.booked_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    )
}
