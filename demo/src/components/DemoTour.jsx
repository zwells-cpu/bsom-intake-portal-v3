import { useState } from 'react'

const STEPS = [
  {
    icon: '📊',
    title: 'Dashboard',
    desc: 'See real-time intake stats, active alerts, and recent staff activity at a glance. Every number is clickable and drills into filtered views.',
  },
  {
    icon: '📋',
    title: 'Intake Module',
    desc: 'Manage every referral through the complete intake workflow — paperwork, insurance verification, contact attempts, and status tracking.',
  },
  {
    icon: '🧪',
    title: 'Initial Assessments',
    desc: 'Track BCBA assignments, parent interviews, Vineland and SRS-2 progress, treatment plan status, and PA authorization per client.',
  },
  {
    icon: '📈',
    title: 'Operational Insights',
    desc: 'Pipeline overview, referral aging reports, clinic volume, conversion rates, and team performance — all in one place.',
  },
]

export function DemoTour({ onClose }) {
  const [step, setStep] = useState(0)

  const handleClose = () => {
    localStorage.setItem('bsom_tour_seen', '1')
    onClose()
  }

  return (
    <div className="tour-overlay" onClick={handleClose}>
      <div className="tour-card" onClick={e => e.stopPropagation()}>
        <div className="tour-step-indicator">
          {STEPS.map((_, i) => (
            <div key={i} className={`tour-dot ${i === step ? 'active' : ''}`} onClick={() => setStep(i)} />
          ))}
        </div>

        <div className="tour-icon">{STEPS[step].icon}</div>
        <div className="tour-title">{STEPS[step].title}</div>
        <div className="tour-desc">{STEPS[step].desc}</div>

        <div className="tour-actions">
          {step > 0 && (
            <button className="tour-btn-ghost" onClick={() => setStep(s => s - 1)}>← Back</button>
          )}
          <div style={{ flex: 1 }} />
          {step < STEPS.length - 1 ? (
            <button className="tour-btn-primary" onClick={() => setStep(s => s + 1)}>Next →</button>
          ) : (
            <button className="tour-btn-primary" onClick={handleClose}>Got it ✓</button>
          )}
        </div>

        <button className="tour-close" onClick={handleClose}>✕</button>
      </div>
    </div>
  )
}
