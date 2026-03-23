import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useEditor(itineraryId) {
  const [itinerary, setItinerary] = useState(null)
  const [days, setDays] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!itineraryId) return
    setLoading(true)

    const [{ data: itin }, { data: daysData }] = await Promise.all([
      supabase.from('itineraries').select('*').eq('id', itineraryId).single(),
      supabase
        .from('days')
        .select('*, activities(*)')
        .eq('itinerary_id', itineraryId)
        .order('day_number', { ascending: true }),
    ])

    if (itin) setItinerary(itin)
    if (daysData) {
      setDays(
        daysData.map(d => ({
          ...d,
          activities: [...(d.activities || [])].sort((a, b) => a.sort_order - b.sort_order),
        }))
      )
    }
    setLoading(false)
  }, [itineraryId])

  useEffect(() => {
    fetchAll()

    const channel = supabase
      .channel(`editor-${itineraryId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'activities' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'days' }, fetchAll)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [itineraryId, fetchAll])

  async function addDay() {
    const nextNum = (days[days.length - 1]?.day_number || 0) + 1
    let date = null
    if (itinerary?.start_date) {
      const d = new Date(itinerary.start_date)
      d.setDate(d.getDate() + nextNum - 1)
      date = d.toISOString().split('T')[0]
    }
    await supabase.from('days').insert({ itinerary_id: itineraryId, day_number: nextNum, date, note: '' })
    await fetchAll()
  }

  async function deleteDay(dayId) {
    await supabase.from('days').delete().eq('id', dayId)
    await fetchAll()
  }

  async function addActivity(dayId, data) {
    const day = days.find(d => d.id === dayId)
    const maxOrder = Math.max(0, ...(day?.activities || []).map(a => a.sort_order))
    await supabase.from('activities').insert({ day_id: dayId, sort_order: maxOrder + 1, ...data })
    await fetchAll()
  }

  async function updateActivity(id, data) {
    await supabase.from('activities').update(data).eq('id', id)
    await fetchAll()
  }

  async function deleteActivity(id) {
    await supabase.from('activities').delete().eq('id', id)
    await fetchAll()
  }

  async function reorderActivities(dayId, orderedIds) {
    const updates = orderedIds.map((id, idx) =>
      supabase.from('activities').update({ sort_order: idx }).eq('id', id)
    )
    await Promise.all(updates)
    await fetchAll()
  }

  async function updateDayNote(dayId, note) {
    await supabase.from('days').update({ note }).eq('id', dayId)
    await fetchAll()
  }

  return {
    itinerary,
    days,
    loading,
    addDay,
    deleteDay,
    addActivity,
    updateActivity,
    deleteActivity,
    reorderActivities,
    updateDayNote,
    refetch: fetchAll,
  }
}
