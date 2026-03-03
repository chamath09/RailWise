import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminSchedules() {
    const [schedules, setSchedules] = useState([])
    const [trains, setTrains] = useState([])
    const [stations, setStations] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState({
        train_id: '', from_station_id: '', to_station_id: '',
        departure_time: '', arrival_time: '', travel_date: '',
        price: '', available_seats: 100
    })
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        loadData()
    }, [])

    async function loadData() {
        setLoading(true)
        const [schedulesRes, trainsRes, stationsRes] = await Promise.all([
            supabase.from('schedules').select(`
                *,
                train:trains(*),
                from_station:stations!schedules_from_station_id_fkey(*),
                to_station:stations!schedules_to_station_id_fkey(*)
            `).order('travel_date', { ascending: false }),
            supabase.from('trains').select('*').order('name'),
            supabase.from('stations').select('*').order('name')
        ])
        setSchedules(schedulesRes.data || [])
        setTrains(trainsRes.data || [])
        setStations(stationsRes.data || [])
        setLoading(false)
    }

    function openAdd() {
        setEditing(null)
        setForm({
            train_id: trains[0]?.id || '', from_station_id: '', to_station_id: '',
            departure_time: '', arrival_time: '', travel_date: '',
            price: '', available_seats: 100
        })
        setError('')
        setShowModal(true)
    }

    function openEdit(schedule) {
        setEditing(schedule)
        setForm({
            train_id: schedule.train_id,
            from_station_id: schedule.from_station_id,
            to_station_id: schedule.to_station_id,
            departure_time: schedule.departure_time?.substring(0, 5) || '',
            arrival_time: schedule.arrival_time?.substring(0, 5) || '',
            travel_date: schedule.travel_date,
            price: schedule.price,
            available_seats: schedule.available_seats
        })
        setError('')
        setShowModal(true)
    }

    async function handleSave(e) {
        e.preventDefault()
        setError('')
        setSaving(true)

        if (!form.train_id || !form.from_station_id || !form.to_station_id ||
            !form.departure_time || !form.arrival_time || !form.travel_date || !form.price) {
            setError('All fields are required.')
            setSaving(false)
            return
        }

        if (form.from_station_id === form.to_station_id) {
            setError('From and To stations must be different.')
            setSaving(false)
            return
        }

        const payload = {
            train_id: form.train_id,
            from_station_id: form.from_station_id,
            to_station_id: form.to_station_id,
            departure_time: form.departure_time,
            arrival_time: form.arrival_time,
            travel_date: form.travel_date,
            price: parseFloat(form.price),
            available_seats: parseInt(form.available_seats)
        }

        if (editing) {
            const { error } = await supabase.from('schedules').update(payload).eq('id', editing.id)
            if (error) { setError(error.message); setSaving(false); return }
        } else {
            const { error } = await supabase.from('schedules').insert(payload)
            if (error) { setError(error.message); setSaving(false); return }
        }

        setSaving(false)
        setShowModal(false)
        loadData()
    }

    async function handleDelete(id) {
        if (!confirm('Are you sure? Related bookings may be affected.')) return
        const { error } = await supabase.from('schedules').delete().eq('id', id)
        if (error) { alert(error.message); return }
        loadData()
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
                <p>Loading schedules...</p>
            </div>
        )
    }

    return (
        <div className="admin-page">
            <div className="container">
                <div className="admin-header">
                    <div>
                        <Link to="/admin" className="admin-back">← Dashboard</Link>
                        <h1>Manage <span className="text-accent">Schedules</span></h1>
                    </div>
                    <button className="btn btn-primary" onClick={openAdd}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                        Add Schedule
                    </button>
                </div>

                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Train</th>
                                <th>From</th>
                                <th>To</th>
                                <th>Departure</th>
                                <th>Arrival</th>
                                <th>Date</th>
                                <th>Price</th>
                                <th>Seats</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {schedules.length === 0 ? (
                                <tr><td colSpan="9" className="admin-empty">No schedules found.</td></tr>
                            ) : schedules.map(s => (
                                <tr key={s.id}>
                                    <td><strong>{s.train?.name}</strong><br /><small>#{s.train?.train_number}</small></td>
                                    <td>{s.from_station?.name}</td>
                                    <td>{s.to_station?.name}</td>
                                    <td>{formatTime(s.departure_time)}</td>
                                    <td>{formatTime(s.arrival_time)}</td>
                                    <td>{new Date(s.travel_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                    <td>LKR {Number(s.price).toLocaleString()}</td>
                                    <td>{s.available_seats}</td>
                                    <td className="admin-actions">
                                        <button className="btn-icon btn-icon-edit" onClick={() => openEdit(s)} title="Edit">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                        </button>
                                        <button className="btn-icon btn-icon-delete" onClick={() => handleDelete(s.id)} title="Delete">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editing ? 'Edit Schedule' : 'Add Schedule'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSave}>
                            {error && <div className="form-error">{error}</div>}

                            <div className="form-group">
                                <label>Train</label>
                                <select value={form.train_id} onChange={e => setForm({ ...form, train_id: e.target.value })} required>
                                    <option value="">Select a train</option>
                                    {trains.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} (#{t.train_number})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>From Station</label>
                                    <select value={form.from_station_id} onChange={e => setForm({ ...form, from_station_id: e.target.value })} required>
                                        <option value="">Select station</option>
                                        {stations.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.code?.trim()})</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>To Station</label>
                                    <select value={form.to_station_id} onChange={e => setForm({ ...form, to_station_id: e.target.value })} required>
                                        <option value="">Select station</option>
                                        {stations.map(s => (
                                            <option key={s.id} value={s.id}>{s.name} ({s.code?.trim()})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Departure Time</label>
                                    <input type="time" value={form.departure_time} onChange={e => setForm({ ...form, departure_time: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Arrival Time</label>
                                    <input type="time" value={form.arrival_time} onChange={e => setForm({ ...form, arrival_time: e.target.value })} required />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Travel Date</label>
                                    <input type="date" value={form.travel_date} onChange={e => setForm({ ...form, travel_date: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label>Price (LKR)</label>
                                    <input type="number" step="0.01" min="0" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="e.g. 750" required />
                                </div>
                                <div className="form-group">
                                    <label>Available Seats</label>
                                    <input type="number" min="0" value={form.available_seats} onChange={e => setForm({ ...form, available_seats: e.target.value })} required />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update' : 'Add Schedule')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
