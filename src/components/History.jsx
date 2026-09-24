import { useEffect, useRef, useState } from 'react'
import { getSupabase } from '../lib/supabaseClient'

const fmtDate = (iso) => (iso ? String(iso).split('-').reverse().join('/') : '—')

export default function History({ onOpen }) {
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [confirmId, setConfirmId] = useState(null) // row armed for delete
  const armTimer = useRef(null)

  useEffect(() => () => { if (armTimer.current) clearTimeout(armTimer.current) }, [])

  function armDelete(id) {
    if (armTimer.current) clearTimeout(armTimer.current)
    setConfirmId(id)
    armTimer.current = setTimeout(() => setConfirmId(null), 3000) // auto-disarm
  }

  async function load(search) {
    setLoading(true)
    setError('')
    try {
      const client = await getSupabase()
      if (!client) {
        setError('History is not configured on this device.')
        return
      }
      // Fetch only the columns the list renders — never the full clinical
      // text for 200 rows on a phone connection.
      let query = client
        .from('prescriptions')
        .select('id,patient_name,visit_date,age,gender,created_at')
        .order('created_at', { ascending: false })
        .limit(200)
      const term = search.trim().replace(/[%_]/g, '')
      if (term) query = query.ilike('patient_name', `%${term}%`)
      const { data, error } = await query
      if (error) throw error
      setRows(data || [])
    } catch (err) {
      setError(err.message || 'Could not load history.')
    } finally {
      setLoading(false)
    }
  }

  const firstRun = useRef(true)

  useEffect(() => {
    load('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    // The mount effect above already loaded with q === '', so skip the
    // first debounce firing to avoid a duplicate query on open.
    if (firstRun.current) {
      firstRun.current = false
      return
    }
    const t = setTimeout(() => load(q), 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q])

  async function handleDelete(row) {
    // Two-tap confirm: first tap arms ("Sure?"), second tap deletes.
    // (No window.confirm — native dialogs are unreliable on mobile.)
    if (confirmId !== row.id) {
      armDelete(row.id)
      return
    }
    if (armTimer.current) clearTimeout(armTimer.current)
    setConfirmId(null)
    const client = await getSupabase()
    if (!client) return
    const { error } = await client.from('prescriptions').delete().eq('id', row.id)
    if (error) {
      alert('Delete failed: ' + error.message)
      return
    }
    setRows((rs) => rs.filter((r) => r.id !== row.id))
  }

  return (
    <div className="history">
      <div className="field">
        <label htmlFor="hist-search">Search by patient name</label>
        <input
          id="hist-search"
          type="search"
          placeholder="e.g. Majumdar"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>
      {loading && <p className="status-line">Loading history…</p>}
      {error && <p className="form-error" role="alert">{error}</p>}
      {!loading && !error && rows.length === 0 && (
        <p className="status-line">
          {q.trim() ? 'No matches. Try a different spelling.' : 'No saved prescriptions yet — download or save one to start history.'}
        </p>
      )}
      <ul className="history-list">
        {rows.map((r) => (
          <li key={r.id} className="history-row">
            <div className="history-main">
              <strong>{r.patient_name}</strong>
              <span className="history-meta">
                {fmtDate(r.visit_date)} · {r.age || '—'} · {r.gender || '—'}
              </span>
            </div>
            <div className="history-actions">
              <button className="btn btn-small" type="button" onClick={() => onOpen(r)}>
                Open
              </button>
              <button
                className={`btn btn-small ${confirmId === r.id ? 'btn-danger' : 'btn-ghost'}`}
                type="button"
                onClick={() => handleDelete(r)}
                aria-label={confirmId === r.id
                  ? `Tap again to confirm deleting prescription for ${r.patient_name}`
                  : `Delete prescription for ${r.patient_name}`}
              >
                {confirmId === r.id ? 'Sure?' : '✕'}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
