import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminDashboard() {
    const [stats, setStats] = useState({ trains: 0, stations: 0, schedules: 0, bookings: 0 })
    const [recentBookings, setRecentBookings] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadDashboard()

        // Subscribe to real-time changes on the bookings table
        const bookingSubscription = supabase
            .channel('admin-dashboard-bookings')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => {
                loadDashboard()
            })
            .subscribe()

        return () => {
            bookingSubscription.unsubscribe()
        }
    }, [])

    async function loadDashboard() {
        const [trains, stations, schedules, bookings] = await Promise.all([
            supabase.from('trains').select('id', { count: 'exact', head: true }),
            supabase.from('stations').select('id', { count: 'exact', head: true }),
            supabase.from('schedules').select('id', { count: 'exact', head: true }),
            supabase.from('bookings').select('id', { count: 'exact', head: true })
        ])

        setStats({
            trains: trains.count || 0,
            stations: stations.count || 0,
            schedules: schedules.count || 0,
            bookings: bookings.count || 0
        })

        const { data } = await supabase
            .from('bookings')
            .select(`*, schedule:schedules(*, train:trains(*), from_station:stations!schedules_from_station_id_fkey(*), to_station:stations!schedules_to_station_id_fkey(*))`)
            .order('booked_at', { ascending: false })
            .limit(5)

        setRecentBookings(data || [])
        setLoading(false)
    }

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

                <div className="admin-stats-grid">
                    <Link to="/admin/trains" className="admin-stat-card">
                        <div className="admin-stat-icon">🚂</div>
                        <div className="admin-stat-info">
                            <span className="admin-stat-number">{stats.trains}</span>
                            <span className="admin-stat-label">Trains</span>
                        </div>
                        <span className="admin-stat-action">Manage →</span>
                    </Link>
                    <Link to="/admin/stations" className="admin-stat-card">
                        <div className="admin-stat-icon">🏛️</div>
                        <div className="admin-stat-info">
                            <span className="admin-stat-number">{stats.stations}</span>
                            <span className="admin-stat-label">Stations</span>
                        </div>
                        <span className="admin-stat-action">Manage →</span>
                    </Link>
                    <Link to="/admin/schedules" className="admin-stat-card">
                        <div className="admin-stat-icon">📅</div>
                        <div className="admin-stat-info">
                            <span className="admin-stat-number">{stats.schedules}</span>
                            <span className="admin-stat-label">Schedules</span>
                        </div>
                        <span className="admin-stat-action">Manage →</span>
                    </Link>
                    <div className="admin-stat-card">
                        <div className="admin-stat-icon">🎫</div>
                        <div className="admin-stat-info">
                            <span className="admin-stat-number">{stats.bookings}</span>
                            <span className="admin-stat-label">Bookings</span>
                        </div>
                    </div>
                </div>

                {recentBookings.length > 0 && (
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
                )}
            </div>
        </div>
    )
}
