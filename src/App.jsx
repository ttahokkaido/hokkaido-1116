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

  if (!itinerary || !supabase) {
    return (
      <div className="page" style={{ justifyContent: 'center', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 32 }}>❌</div>
        <div style={{ color: 'var(--danger)', fontSize: 14, textAlign: 'center', padding: '0 24px', lineHeight: 1.6 }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>無法連線到資料庫</p>
          <p>請確認兩件事：</p>
          <ol style={{ textAlign: 'left', marginTop: 8, paddingLeft: 20 }}>
            <li>專案根目錄是否有 <code>.env</code> 檔案，並且填妥了 <code>VITE_SUPABASE_URL</code> 與 <code>VITE_SUPABASE_ANON_KEY</code>。</li>
            <li>Supabase 專案中是否已執行 SQL 建立資料表。</li>
          </ol>
        </div>
      </div>
    )
  }

  return <Editor itinerary={itinerary} />
}
