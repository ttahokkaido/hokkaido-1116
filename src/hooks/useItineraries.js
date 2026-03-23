import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useItineraries() {
  const [itineraries, setItineraries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchItineraries()

    const channel = supabase
      .channel('itineraries')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'itineraries' }, () => {
        fetchItineraries()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [])

  async function fetchItineraries() {
    setLoading(true)
    const { data } = await supabase
      .from('itineraries')
      .select('*')
      .order('created_at', { ascending: false })
    setItineraries(data || [])
    setLoading(false)
  }

  async function createItinerary(title, startDate, endDate) {
    const days = []
    if (startDate && endDate) {
      const start = new Date(startDate)
      const end = new Date(endDate)
      let d = 1
      for (let dt = new Date(start); dt <= end; dt.setDate(dt.getDate() + 1)) {
        days.push({ day_number: d++, date: dt.toISOString().split('T')[0], note: '' })
      }
    }

    const { data: itin, error } = await supabase
      .from('itineraries')
      .insert({ title, start_date: startDate || null, end_date: endDate || null })
      .select()
      .single()

    if (error || !itin) return { error: error?.message || '未知錯誤，請先確認 Supabase 資料表已建立' }

    if (days.length > 0) {
      await supabase.from('days').insert(days.map(d => ({ ...d, itinerary_id: itin.id })))
    }

    await fetchItineraries()
    return itin
  }

  async function deleteItinerary(id) {
    await supabase.from('itineraries').delete().eq('id', id)
    await fetchItineraries()
  }

  async function updateItinerary(id, fields) {
    await supabase.from('itineraries').update({ ...fields, updated_at: new Date().toISOString() }).eq('id', id)
    await fetchItineraries()
  }

  return { itineraries, loading, createItinerary, deleteItinerary, updateItinerary, refetch: fetchItineraries }
}
