import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminStations() {
    const [stations, setStations] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState({ name: '', code: '', city: '' })
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => { loadStations() }, [])

    async function loadStations() {
        setLoading(true)
        const { data } = await supabase.from('stations').select('*').order('name')
        setStations(data || [])
        setLoading(false)
    }

    function openAdd() {
        setEditing(null)
        setForm({ name: '', code: '', city: '' })
        setError('')
        setShowModal(true)
    }

    function openEdit(station) {
        setEditing(station)
        setForm({ name: station.name, code: station.code?.trim(), city: station.city })
        setError('')
        setShowModal(true)
    }

    async function handleSave(e) {
        e.preventDefault()
        setError('')
        setSaving(true)

        if (!form.name.trim() || !form.code.trim() || !form.city.trim()) {
            setError('All fields are required.')
            setSaving(false)
            return
        }

        if (editing) {
            const { error } = await supabase
                .from('stations')
                .update({ name: form.name, code: form.code.toUpperCase(), city: form.city })
                .eq('id', editing.id)
            if (error) { setError(error.message); setSaving(false); return }
        } else {
            const { error } = await supabase
                .from('stations')
                .insert({ name: form.name, code: form.code.toUpperCase(), city: form.city })
            if (error) { setError(error.message); setSaving(false); return }
        }

        setSaving(false)
        setShowModal(false)
        loadStations()
    }

    async function handleDelete(id) {
        if (!confirm('Are you sure? This will affect related schedules.')) return
        const { error } = await supabase.from('stations').delete().eq('id', id)
        if (error) { alert(error.message); return }
        loadStations()
    }

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Loading stations...</p>
            </div>
        )
    }

    return (
        <div className="admin-page">
            <div className="container">
                <div className="admin-header">
                    <div>
                        <Link to="/admin" className="admin-back">← Dashboard</Link>
                        <h1>Manage <span className="text-accent">Stations</span></h1>
                    </div>
                    <button className="btn btn-primary" onClick={openAdd}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                        Add Station
                    </button>
                </div>

                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Code</th>
                                <th>City</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stations.length === 0 ? (
                                <tr><td colSpan="4" className="admin-empty">No stations found.</td></tr>
                            ) : stations.map(station => (
                                <tr key={station.id}>
                                    <td><strong>{station.name}</strong></td>
                                    <td>{station.code?.trim()}</td>
                                    <td>{station.city}</td>
                                    <td className="admin-actions">
                                        <button className="btn-icon btn-icon-edit" onClick={() => openEdit(station)} title="Edit">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                        </button>
                                        <button className="btn-icon btn-icon-delete" onClick={() => handleDelete(station.id)} title="Delete">
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
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editing ? 'Edit Station' : 'Add Station'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSave}>
                            {error && <div className="form-error">{error}</div>}
                            <div className="form-group">
                                <label>Station Name</label>
                                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Colombo Fort" required />
                            </div>
                            <div className="form-group">
                                <label>Station Code</label>
                                <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} placeholder="e.g. CMB" maxLength="5" required />
                            </div>
                            <div className="form-group">
                                <label>City</label>
                                <input type="text" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="e.g. Colombo" required />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update' : 'Add Station')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
