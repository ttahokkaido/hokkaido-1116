import { useState } from 'react'
import { useItineraries } from '../hooks/useItineraries'

const CATEGORIES = [
  { id: 'sight', label: '🏔️ 景點', color: '#6366f1' },
  { id: 'food', label: '🍜 餐廳', color: '#f59e0b' },
  { id: 'hotel', label: '🏨 住宿', color: '#10b981' },
  { id: 'transport', label: '🚃 交通', color: '#3b82f6' },
  { id: 'shop', label: '🛍️ 購物', color: '#ec4899' },
  { id: 'other', label: '📌 其他', color: '#6b7280' },
]

function formatDate(d) {
  if (!d) return ''
  const dt = new Date(d + 'T00:00:00')
  return `${dt.getMonth() + 1}/${dt.getDate()}`
}

function CreateModal({ onClose, onCreate }) {
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError('')
    const result = await onCreate(title.trim(), startDate || null, endDate || null)
    setLoading(false)
    if (result?.error) {
      setError(result.error)
    } else {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 className="modal-title">新增行程</h2>
        <form onSubmit={handleSubmit} className="modal-form">
          <label className="form-label">行程名稱<span className="required">*</span></label>
          <input
            className="form-input"
            placeholder="例：北海道5泊6日"
            value={title}
            onChange={e => setTitle(e.target.value)}
            autoFocus
          />
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">出發日期</label>
              <input className="form-input" type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">回程日期</label>
              <input className="form-input" type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          {error && <div className="form-error">❌ {error}</div>}
          <button className="btn btn-primary" type="submit" disabled={loading || !title.trim()}>
            {loading ? '建立中…' : '✨ 建立行程'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function Home({ onSelectItinerary }) {
  const { itineraries, loading, createItinerary, deleteItinerary } = useItineraries()
  const [showCreate, setShowCreate] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)

  return (
    <div className="page">
      <div className="home-header">
        <div>
          <div className="home-subtitle">✈️ 旅遊計畫</div>
          <h1 className="home-title">北海道之旅</h1>
        </div>
        <button className="btn-fab" onClick={() => setShowCreate(true)}>+</button>
      </div>

      <div className="home-body">
        {loading && (
          <div className="loading-center">
            <div className="spinner" />
          </div>
        )}

        {!loading && itineraries.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🗺️</div>
            <p>還沒有行程</p>
            <p className="empty-sub">點右上角 + 新增你的北海道計畫</p>
          </div>
        )}

        <div className="itinerary-list">
          {itineraries.map(itin => (
            <div key={itin.id} className="itin-card" onClick={() => onSelectItinerary(itin)}>
              <div className="itin-card-header">
                <div className="itin-card-badge">
                  {itin.start_date && itin.end_date
                    ? `${formatDate(itin.start_date)} – ${formatDate(itin.end_date)}`
                    : '日期未設定'}
                </div>
                <button
                  className="btn-icon-danger"
                  onClick={e => { e.stopPropagation(); setConfirmDelete(itin) }}
                >
                  🗑
                </button>
              </div>
              <h3 className="itin-card-title">{itin.title}</h3>
              <div className="itin-card-footer">
                <span className="itin-card-updated">
                  更新於 {new Date(itin.updated_at).toLocaleDateString('zh-TW')}
                </span>
                <span className="itin-card-arrow">→</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreate={createItinerary}
        />
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal-sheet confirm-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 className="modal-title">刪除行程？</h2>
            <p className="confirm-text">「{confirmDelete.title}」將被永久刪除，無法復原。</p>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDelete(null)}>取消</button>
              <button className="btn btn-danger" onClick={async () => {
                await deleteItinerary(confirmDelete.id)
                setConfirmDelete(null)
              }}>刪除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { CATEGORIES }
