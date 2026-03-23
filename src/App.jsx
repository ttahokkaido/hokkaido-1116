import { useState, useEffect } from 'react'
import { supabase } from './lib/supabase'
import Editor from './pages/Editor'

export default function App() {
  const [itinerary, setItinerary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function init() {
      // 抓第一筆行程，沒有就自動建立
      const { data } = await supabase
        .from('itineraries')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .single()

      if (data) {
        setItinerary(data)
      } else {
        // 自動建立預設行程
        const { data: created } = await supabase
          .from('itineraries')
          .insert({ title: '北海道之旅' })
          .select()
          .single()
        if (created) setItinerary(created)
      }
      setLoading(false)
    }
    init()
  }, [])

  if (loading) {
    return (
      <div className="page" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!itinerary) {
    return (
      <div className="page" style={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 32 }}>❌</div>
        <p style={{ color: 'var(--danger)', fontSize: 14, textAlign: 'center', padding: '0 24px' }}>
          無法連線到資料庫，請確認 Supabase 資料表已建立。
        </p>
      </div>
    )
  }

  return <Editor itinerary={itinerary} />
}
