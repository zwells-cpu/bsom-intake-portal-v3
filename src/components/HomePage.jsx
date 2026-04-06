import { useEffect, useState } from 'react'
import { MODULES } from '../lib/constants'
import { ThemeToggle } from './ThemeToggle'
import { supabase } from '../lib/supabase'

export function HomePage({ onEnterModule, theme, setTheme }) {
  const [connStatus, setConnStatus] = useState('Checking connection...')

  useEffect(() => {
    const check = async () => {
      try {
        const { error } = await supabase.from('referrals').select('id').limit(1)
        if (error) throw error
        setConnStatus('connected')
      } catch (e) {
        setConnStatus('error:' + e.message.slice(0, 80))
      }
    }
    const t = setTimeout(check, 1200)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="home-screen">
      <div style={{ position: 'absolute', top: 20, right: 24 }}>
        <ThemeToggle theme={theme} setTheme={setTheme} />
      </div>

      <div className="home-logo">
        <img
          src="/bsom-logo.jpg"
          alt="BSOM"
          style={{ width: 96, height: 96 }}
        />
      </div>

      <div className="home-title">BSOM Intake Portal</div>
      <div className="home-sub">Behavioral Solutions of Mississippi - Intake Operations Portal</div>

      <div style={{ marginTop: -32, marginBottom: 36, fontSize: 11, color: 'var(--dim)' }}>
        {connStatus === 'connected' ? (
          <span style={{ color: '#22c55e' }}>{'\u25CF'} System Connected</span>
        ) : connStatus.startsWith('error:') ? (
          <span style={{ color: '#ef4444' }}>{'\u25CF'} {connStatus.replace('error:', 'Error - ')}</span>
        ) : (
          <span>{connStatus}</span>
        )}
      </div>

      <div className="module-grid">
        {MODULES.map(m => (
          <div
            key={m.id}
            className="module-card"
            style={{ '--card-color': m.color }}
            onClick={() => onEnterModule(m.id)}
          >
            <div className="module-arrow">{'\u2192'}</div>
            <div className="module-icon">{m.icon}</div>
            <div className="module-name">{m.name}</div>
            <div className="module-desc">{m.desc}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
