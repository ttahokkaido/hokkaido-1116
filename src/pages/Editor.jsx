import { useState, useCallback } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useEditor } from '../hooks/useEditor'

const CATEGORIES = [
  { id: 'sight', label: '🏔️ 景點', color: '#6366f1' },
  { id: 'food', label: '🍜 餐廳', color: '#f59e0b' },
  { id: 'hotel', label: '🏨 住宿', color: '#10b981' },
  { id: 'transport', label: '🚃 交通', color: '#3b82f6' },
  { id: 'shop', label: '🛍️ 購物', color: '#ec4899' },
  { id: 'other', label: '📌 其他', color: '#6b7280' },
]

function getCatInfo(id) {
  return CATEGORIES.find(c => c.id === id) || CATEGORIES[CATEGORIES.length - 1]
}

function ActivityModal({ activity, dayId, onClose, onSave, onDelete }) {
  const isEdit = !!activity
  const [form, setForm] = useState({
    title: activity?.title || '',
    location: activity?.location || '',
    category: activity?.category || 'sight',
    time_start: activity?.time_start || '',
    time_end: activity?.time_end || '',
    note: activity?.note || '',
    cost: activity?.cost ?? '',
  })
  const [loading, setLoading] = useState(false)

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    await onSave({ ...form, cost: form.cost === '' ? null : Number(form.cost) })
    setLoading(false)
    onClose()
  }

  async function handleDelete() {
    setLoading(true)
    await onDelete(activity.id)
    setLoading(false)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet activity-sheet" onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <h2 className="modal-title">{isEdit ? '編輯活動' : '新增活動'}</h2>
        <form onSubmit={handleSave} className="modal-form">
          <label className="form-label">活動名稱<span className="required">*</span></label>
          <input
            className="form-input"
            placeholder="例：登上函館山展望台"
            value={form.title}
            onChange={e => set('title', e.target.value)}
            autoFocus
          />

          <label className="form-label">地點</label>
          <input
            className="form-input"
            placeholder="地址或地名"
            value={form.location}
            onChange={e => set('location', e.target.value)}
          />

          {form.location.trim() && (
            <div className="map-embed-container">
              <iframe
                title="Google Maps Preview"
                width="100%"
                height="100%"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                src={`https://www.google.com/maps?q=${encodeURIComponent(form.location.trim())}&output=embed`}
              ></iframe>
            </div>
          )}

          <label className="form-label">類別</label>
          <div className="cat-grid">
            {CATEGORIES.map(c => (
              <button
                key={c.id}
                type="button"
                className={`cat-btn ${form.category === c.id ? 'cat-btn-active' : ''}`}
                style={{ '--cat-color': c.color }}
                onClick={() => set('category', c.id)}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">開始時間</label>
              <input className="form-input" type="time" value={form.time_start} onChange={e => set('time_start', e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">結束時間</label>
              <input className="form-input" type="time" value={form.time_end} onChange={e => set('time_end', e.target.value)} />
            </div>
          </div>

          <label className="form-label">預算（日圓）</label>
          <input
            className="form-input"
            type="number"
            placeholder="¥0"
            value={form.cost}
            onChange={e => set('cost', e.target.value)}
          />

          <label className="form-label">備注</label>
          <textarea
            className="form-input form-textarea"
            placeholder="訂位資訊、注意事項…"
            value={form.note}
            onChange={e => set('note', e.target.value)}
          />

          <button className="btn btn-primary" type="submit" disabled={loading || !form.title.trim()}>
            {loading ? '儲存中…' : '💾 儲存'}
          </button>
          {isEdit && (
            <button type="button" className="btn btn-danger-ghost" onClick={handleDelete} disabled={loading}>
              🗑 刪除此活動
            </button>
          )}
        </form>
      </div>
    </div>
  )
}

function SortableActivityItem({ activity, onEdit }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: activity.id })
  const cat = getCatInfo(activity.category)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div ref={setNodeRef} style={style} className="activity-item" onClick={() => onEdit(activity)}>
      <div className="activity-drag" {...attributes} {...listeners} onClick={e => e.stopPropagation()}>
        ⠿
      </div>
      <div className="activity-cat-dot" style={{ background: cat.color }} />
      <div className="activity-content">
        <div className="activity-row">
          {(activity.time_start || activity.time_end) && (
            <span className="activity-time">
              {activity.time_start && activity.time_start.slice(0, 5)}
              {activity.time_end && `–${activity.time_end.slice(0, 5)}`}
            </span>
          )}
          <span className="activity-title">{activity.title}</span>
        </div>
        {activity.location && (
          <div className="activity-location">
            📍 {activity.location}
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity.location)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="activity-map-link"
              onClick={e => e.stopPropagation()}
              title="在地圖上查看"
            >
              ↗️
            </a>
          </div>
        )}
        {activity.cost != null && <div className="activity-cost">¥{activity.cost.toLocaleString()}</div>}
      </div>
      <div className="activity-chevron">›</div>
    </div>
  )
}

function DayAccordion({ day, open, onToggle, hooks }) {
  const [editActivity, setEditActivity] = useState(null)
  const [showAdd, setShowAdd] = useState(false)
  const [activities, setActivities] = useState(day.activities)
  const sensors = useSensors(useSensor(PointerSensor), useSensor(TouchSensor))

  // Keep local activities in sync
  useState(() => { setActivities(day.activities) })

  const syncedActivities = day.activities

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = syncedActivities.findIndex(a => a.id === active.id)
    const newIndex = syncedActivities.findIndex(a => a.id === over.id)
    const newOrder = arrayMove(syncedActivities, oldIndex, newIndex)
    hooks.reorderActivities(day.id, newOrder.map(a => a.id))
  }

  const totalCost = syncedActivities.reduce((s, a) => s + (a.cost || 0), 0)

  return (
    <div className={`day-card ${open ? 'day-card-open' : ''}`}>
      <div className="day-header" onClick={onToggle}>
        <div className="day-header-left">
          <div className="day-number">Day {day.day_number}</div>
          {day.date && (
            <div className="day-date">
              {new Date(day.date + 'T00:00:00').toLocaleDateString('zh-TW', { month: 'short', day: 'numeric', weekday: 'short' })}
            </div>
          )}
        </div>
        <div className="day-header-right">
          {totalCost > 0 && <span className="day-cost">¥{totalCost.toLocaleString()}</span>}
          <span className="day-count">{syncedActivities.length} 項</span>
          <span className={`day-chevron ${open ? 'day-chevron-open' : ''}`}>›</span>
        </div>
      </div>

      {open && (
        <div className="day-body">
          {day.note !== undefined && (
            <textarea
              className="day-note"
              placeholder="📝 當日備注…"
              defaultValue={day.note}
              onBlur={e => hooks.updateDayNote(day.id, e.target.value)}
            />
          )}

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={syncedActivities.map(a => a.id)} strategy={verticalListSortingStrategy}>
              {syncedActivities.map(act => (
                <SortableActivityItem key={act.id} activity={act} onEdit={setEditActivity} />
              ))}
            </SortableContext>
          </DndContext>

          {syncedActivities.length === 0 && (
            <div className="day-empty">還沒有活動，點下方按鈕新增</div>
          )}

          <button className="btn-add-activity" onClick={() => setShowAdd(true)}>
            + 新增活動
          </button>
        </div>
      )}

      {showAdd && (
        <ActivityModal
          dayId={day.id}
          onClose={() => setShowAdd(false)}
          onSave={data => hooks.addActivity(day.id, data)}
          onDelete={() => {}}
        />
      )}

      {editActivity && (
        <ActivityModal
          activity={editActivity}
          dayId={day.id}
          onClose={() => setEditActivity(null)}
          onSave={data => hooks.updateActivity(editActivity.id, data)}
          onDelete={hooks.deleteActivity}
        />
      )}
    </div>
  )
}

export default function Editor({ itinerary: itinProp }) {
  const { itinerary, days, loading, addDay, deleteDay, addActivity, updateActivity, deleteActivity, reorderActivities, updateDayNote } = useEditor(itinProp.id)
  const [openDay, setOpenDay] = useState(null)
  const [confirmDeleteDay, setConfirmDeleteDay] = useState(null)

  const hooks = { addActivity, updateActivity, deleteActivity, reorderActivities, updateDayNote }

  const totalBudget = days.reduce((s, d) => s + d.activities.reduce((ss, a) => ss + (a.cost || 0), 0), 0)

  return (
    <div className="page">
      <div className="editor-header">
        <div className="editor-header-center">
          <h1 className="editor-title">{itinerary?.title || itinProp.title}</h1>
          {itinerary?.start_date && (
            <div className="editor-dates">
              {itinerary.start_date} → {itinerary.end_date}
            </div>
          )}
        </div>
        {totalBudget > 0 && (
          <div className="editor-budget">¥{totalBudget.toLocaleString()}</div>
        )}
      </div>

      <div className="editor-body">
        {loading && <div className="loading-center"><div className="spinner" /></div>}

        {!loading && days.map(day => (
          <div key={day.id} style={{ position: 'relative' }}>
            <DayAccordion
              day={day}
              open={openDay === day.id}
              onToggle={() => setOpenDay(openDay === day.id ? null : day.id)}
              hooks={hooks}
            />
            {days.length > 1 && (
              <button
                className="day-delete-btn"
                onClick={() => setConfirmDeleteDay(day)}
                title="刪除此天"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {!loading && (
          <button className="btn-add-day" onClick={addDay}>
            + 新增一天
          </button>
        )}
      </div>

      {confirmDeleteDay && (
        <div className="modal-overlay" onClick={() => setConfirmDeleteDay(null)}>
          <div className="modal-sheet confirm-sheet" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <h2 className="modal-title">刪除 Day {confirmDeleteDay.day_number}？</h2>
            <p className="confirm-text">此天所有活動將一併刪除，無法復原。</p>
            <div className="confirm-actions">
              <button className="btn btn-ghost" onClick={() => setConfirmDeleteDay(null)}>取消</button>
              <button className="btn btn-danger" onClick={async () => {
                await deleteDay(confirmDeleteDay.id)
                setConfirmDeleteDay(null)
              }}>刪除</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
