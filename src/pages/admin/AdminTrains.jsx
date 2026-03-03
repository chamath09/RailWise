import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../lib/supabase'

export default function AdminTrains() {
    const [trains, setTrains] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editing, setEditing] = useState(null)
    const [form, setForm] = useState({ name: '', train_number: '', type: 'express' })
    const [error, setError] = useState('')
    const [saving, setSaving] = useState(false)

    useEffect(() => { loadTrains() }, [])

    async function loadTrains() {
        setLoading(true)
        const { data } = await supabase.from('trains').select('*').order('name')
        setTrains(data || [])
        setLoading(false)
    }

    function openAdd() {
        setEditing(null)
        setForm({ name: '', train_number: '', type: 'express' })
        setError('')
        setShowModal(true)
    }

    function openEdit(train) {
        setEditing(train)
        setForm({ name: train.name, train_number: train.train_number, type: train.type })
        setError('')
        setShowModal(true)
    }

    async function handleSave(e) {
        e.preventDefault()
        setError('')
        setSaving(true)

        if (!form.name.trim() || !form.train_number.trim()) {
            setError('All fields are required.')
            setSaving(false)
            return
        }

        if (editing) {
            const { error } = await supabase
                .from('trains')
                .update({ name: form.name, train_number: form.train_number, type: form.type })
                .eq('id', editing.id)
            if (error) { setError(error.message); setSaving(false); return }
        } else {
            const { error } = await supabase
                .from('trains')
                .insert({ name: form.name, train_number: form.train_number, type: form.type })
            if (error) { setError(error.message); setSaving(false); return }
        }

        setSaving(false)
        setShowModal(false)
        loadTrains()
    }

    async function handleDelete(id) {
        if (!confirm('Are you sure you want to delete this train? This will also affect related schedules.')) return
        const { error } = await supabase.from('trains').delete().eq('id', id)
        if (error) { alert(error.message); return }
        loadTrains()
    }

    if (loading) {
        return (
            <div className="loading-screen">
                <div className="loading-spinner"></div>
                <p>Loading trains...</p>
            </div>
        )
    }

    return (
        <div className="admin-page">
            <div className="container">
                <div className="admin-header">
                    <div>
                        <Link to="/admin" className="admin-back">← Dashboard</Link>
                        <h1>Manage <span className="text-accent">Trains</span></h1>
                    </div>
                    <button className="btn btn-primary" onClick={openAdd}>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
                        Add Train
                    </button>
                </div>

                <div className="admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Number</th>
                                <th>Type</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {trains.length === 0 ? (
                                <tr><td colSpan="4" className="admin-empty">No trains found. Add your first train.</td></tr>
                            ) : trains.map(train => (
                                <tr key={train.id}>
                                    <td><strong>{train.name}</strong></td>
                                    <td>#{train.train_number}</td>
                                    <td><span className={`admin-badge admin-badge-${train.type}`}>{train.type}</span></td>
                                    <td className="admin-actions">
                                        <button className="btn-icon btn-icon-edit" onClick={() => openEdit(train)} title="Edit">
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                                        </button>
                                        <button className="btn-icon btn-icon-delete" onClick={() => handleDelete(train.id)} title="Delete">
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
                            <h2>{editing ? 'Edit Train' : 'Add Train'}</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSave}>
                            {error && <div className="form-error">{error}</div>}
                            <div className="form-group">
                                <label>Train Name</label>
                                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Udarata Menike" required />
                            </div>
                            <div className="form-group">
                                <label>Train Number</label>
                                <input type="text" value={form.train_number} onChange={e => setForm({ ...form, train_number: e.target.value })} placeholder="e.g. 1005" required />
                            </div>
                            <div className="form-group">
                                <label>Type</label>
                                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                                    <option value="express">Express</option>
                                    <option value="intercity">Intercity</option>
                                    <option value="local">Local</option>
                                </select>
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : (editing ? 'Update' : 'Add Train')}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
