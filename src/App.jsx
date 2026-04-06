import { useEffect, useMemo, useState } from 'react'
import { useTheme }       from './hooks/useTheme'
import { useReferrals }   from './hooks/useReferrals'
import { useAssessments } from './hooks/useAssessments'
import { MODULES, MODULE_NAV, ALL_ROLES } from './lib/constants'

import { HomePage }        from './components/HomePage'
import { Sidebar }         from './components/Sidebar'
import { ThemeToggle }     from './components/ThemeToggle'
import { ReferralModal }   from './components/ReferralModal'
import { AssessmentDetailModal } from './components/AssessmentDetailModal'

import { DashboardPage }   from './pages/DashboardPage'
import { AllReferralsPage } from './pages/AllReferralsPage'
import { NewReferralPage }  from './pages/NewReferralPage'
import { IntakeDashboard, PendingDocsPage, InsuranceVerifPage, NonResponsivePage } from './pages/IntakePages'
import { AboutPortalPage, LocationsPage } from './pages/AboutPage'
import { AssessmentTracker, ParentInterviewsPage, BCBAAssignmentsPage, AssessmentProgressPage, TreatmentPlansPage, ReadyForServicesPage } from './pages/AssessmentPages'
import { PipelineOverviewPage, ReferralAgingPage, ClinicVolumePage, ConversionRatePage, IntakePerformancePage } from './pages/OperationsPages'
import { normalizeStaffName } from './lib/utils'

function normalizeClientName(first = '', last = '') {
  return `${first} ${last}`.trim().toLowerCase().replace(/\s+/g, ' ')
}

function getReferralMatch(assessment, refs) {
  const assessmentReferralId = assessment?.referral_id

  if (assessmentReferralId !== undefined && assessmentReferralId !== null && assessmentReferralId !== '') {
    const referralIdText = String(assessmentReferralId)
    const directMatch = refs.find(ref => String(ref.id) === referralIdText || String(ref.referral_id || '') === referralIdText)
    if (directMatch) return directMatch
  }

  const assessmentName = (assessment?.client_name || assessment?.name || '').toLowerCase().replace(/\s+/g, ' ').trim()
  if (!assessmentName) return null

  return refs.find(ref => normalizeClientName(ref.first_name, ref.last_name) === assessmentName) || null
}

function mergeAssessmentRecord(assessment, refs) {
  const referral = getReferralMatch(assessment, refs)
  if (!referral) return assessment

  return {
    ...referral,
    ...assessment,
    client_name: assessment.client_name || assessment.name || `${referral.first_name || ''} ${referral.last_name || ''}`.trim(),
    caregiver: assessment.caregiver || referral.caregiver || '',
    caregiver_phone: assessment.caregiver_phone || referral.caregiver_phone || '',
    caregiver_email: assessment.caregiver_email || referral.caregiver_email || '',
    clinic: assessment.clinic || assessment.office || referral.office || '',
    office: assessment.office || referral.office || '',
    insurance: assessment.insurance || referral.insurance || '',
    secondary_insurance: assessment.secondary_insurance || referral.secondary_insurance || '',
    referral_id: assessment.referral_id || referral.referral_id || referral.id || '',
  }
}

export default function App() {
  const { theme, setTheme } = useTheme()
  const { refs, loading, error, saving, saved, setError, load, saveReferral, updateReferral, deleteReferral, setStatus, toggleParentInterview } = useReferrals()
  const { assessData, assessLoading, loadAssessments, saveAssessEdit, deleteAssessment } = useAssessments()

  const [screen,  setScreen]  = useState('home')   // 'home' | 'module'
  const [module,  setModule]  = useState(null)
  const [subpage, setSubpage] = useState(null)
  const [selId,   setSelId]   = useState(null)
  const [selAssessId, setSelAssessId] = useState(null)
  const [role,    setRole]    = useState('All Staff')
  const [routeFilter, setRouteFilter] = useState(null)

  useEffect(() => { load() }, [load])

  // Listen for sidebar cross-module navigation
  useEffect(() => {
    const h = (e) => enterModule(e.detail)
    window.addEventListener('enter-module', h)
    return () => window.removeEventListener('enter-module', h)
  }, [])

  const openModulePage = (nextModule, nextSubpage, filter = null) => {
    setModule(nextModule)
    setSubpage(nextSubpage)
    setScreen('module')
    setRouteFilter(filter)
    if ((nextModule === 'assessment' || nextModule === 'operations') && assessData.length === 0) loadAssessments()
  }

  const enterModule = (id) => {
    const defaults = { dashboard: 'overview', intake: 'intakedash', assessment: 'tracker', operations: 'pipeline', about: 'portal' }
    openModulePage(id, defaults[id] || 'overview')
  }

  const setSubpageAndClearFilter = (nextSubpage) => {
    setSubpage(nextSubpage)
    setRouteFilter(null)
  }

  const goHome = () => {
    setScreen('home')
    setModule(null)
    setSelId(null)
    setSelAssessId(null)
    setRouteFilter(null)
  }

  const active  = useMemo(() => refs.filter(r => r.status === 'active'), [refs])
  const nr      = useMemo(() => refs.filter(r => r.status === 'non-responsive' || r.status === 'referred-out'), [refs])
  const pending = useMemo(() => active.filter(r => !['signed', 'completed'].includes((r.intake_paperwork || '').toLowerCase())), [active])
  const noIns   = useMemo(() => active.filter(r => !['yes', 'verified'].includes((r.insurance_verified || '').toLowerCase())).length, [active])
  const mergedAssessData = useMemo(() => assessData.map(record => mergeAssessmentRecord(record, refs)), [assessData, refs])
  const operationsRefs = useMemo(() => (
    role === 'All Staff'
      ? refs
      : refs.filter(ref => normalizeStaffName(ref.intake_personnel) === normalizeStaffName(role))
  ), [refs, role])
  const operationsAssessData = useMemo(() => (
    role === 'All Staff'
      ? mergedAssessData
      : mergedAssessData.filter(record => normalizeStaffName(record.intake_personnel) === normalizeStaffName(role))
  ), [mergedAssessData, role])

  const selectedRef = selId ? refs.find(r => r.id === selId) : null
  const selectedAssess = selAssessId
    ? mergedAssessData.find(r => String(r.assessment_id || r.id || '') === String(selAssessId))
    : null

  useEffect(() => {
    if (selId && !refs.some(record => record.id === selId)) setSelId(null)
  }, [refs, selId])

  useEffect(() => {
    if (selAssessId && !assessData.some(record => String(record.assessment_id || record.id || '') === String(selAssessId))) {
      setSelAssessId(null)
    }
  }, [assessData, selAssessId])

  const handleSelectAssessment = (record) => {
    const id = record?.assessment_id ?? record?.id ?? null
    setSelAssessId(id)
  }

  const deleteRecord = async (type, id) => {
    const res = type === 'assessment'
      ? await deleteAssessment(id)
      : await deleteReferral(id)

    if (res?.success) {
      if (type === 'assessment') setSelAssessId(current => (String(current) === String(id) ? null : current))
      else setSelId(current => (current === id ? null : current))
    }

    return res
  }

  if (screen === 'home') {
    return (
      <>
        <HomePage onEnterModule={enterModule} theme={theme} setTheme={setTheme} />
        {saved && <div className="toast">✅ Referral saved!</div>}
      </>
    )
  }

  const m = MODULES.find(x => x.id === module)
  const navItems = MODULE_NAV[module] || []
  const currentNavLabel = navItems.find(n => n.id === subpage)?.label || ''

  const renderPage = () => {
    if (loading) return (
      <div className="loader-wrap">
        <div className="spinner" />
        <div style={{ color: 'var(--muted)' }}>Connecting to database...</div>
      </div>
    )

    if (module === 'dashboard') {
      return (
        <DashboardPage
          refs={refs}
          setSelectedId={setSelId}
          openModulePage={openModulePage}
        />
      )
    }

    if (module === 'intake') {
      if (subpage === 'intakedash') return <IntakeDashboard refs={refs} onSelectRef={setSelId} openModulePage={openModulePage} />
      if (subpage === 'all')        return <AllReferralsPage refs={refs} role={role} setRole={setRole} onSelectRef={setSelId} statFilter={routeFilter} onClearStatFilter={() => setRouteFilter(null)} />
      if (subpage === 'new')        return <NewReferralPage onSave={saveReferral} saving={saving} />
      if (subpage === 'pending')    return <PendingDocsPage refs={refs} onSelectRef={setSelId} statFilter={routeFilter} onSetStatFilter={setRouteFilter} onClearStatFilter={() => setRouteFilter(null)} />
      if (subpage === 'insurance')  return <InsuranceVerifPage refs={refs} onSelectRef={setSelId} statFilter={routeFilter} onSetStatFilter={setRouteFilter} onClearStatFilter={() => setRouteFilter(null)} />
      if (subpage === 'nr')         return <NonResponsivePage refs={refs} onRestore={(id) => setStatus(id, 'active')} statFilter={routeFilter} onClearStatFilter={() => setRouteFilter(null)} />
    }

    if (module === 'about') {
      if (subpage === 'portal')    return <AboutPortalPage />
      if (subpage === 'locations') return <LocationsPage />
    }

    if (module === 'assessment') {
      if (subpage === 'tracker')    return <AssessmentTracker assessData={mergedAssessData} assessLoading={assessLoading} onSelectAssess={handleSelectAssessment} statFilter={routeFilter} onSetStatFilter={setRouteFilter} onClearStatFilter={() => setRouteFilter(null)} />
      if (subpage === 'interviews') return <ParentInterviewsPage assessData={mergedAssessData} assessLoading={assessLoading} onSelectAssess={handleSelectAssessment} statFilter={routeFilter} onSetStatFilter={setRouteFilter} onClearStatFilter={() => setRouteFilter(null)} />
      if (subpage === 'bcba')       return <BCBAAssignmentsPage assessData={mergedAssessData} assessLoading={assessLoading} onSelectAssess={handleSelectAssessment} statFilter={routeFilter} onSetStatFilter={setRouteFilter} onClearStatFilter={() => setRouteFilter(null)} />
      if (subpage === 'progress')   return <AssessmentProgressPage assessData={mergedAssessData} assessLoading={assessLoading} onSelectAssess={handleSelectAssessment} statFilter={routeFilter} onSetStatFilter={setRouteFilter} onClearStatFilter={() => setRouteFilter(null)} />
      if (subpage === 'txplan')     return <TreatmentPlansPage assessData={mergedAssessData} assessLoading={assessLoading} onSelectAssess={handleSelectAssessment} statFilter={routeFilter} onSetStatFilter={setRouteFilter} onClearStatFilter={() => setRouteFilter(null)} />
      if (subpage === 'readysvc')   return <ReadyForServicesPage assessData={mergedAssessData} assessLoading={assessLoading} onSelectAssess={handleSelectAssessment} statFilter={routeFilter} onSetStatFilter={setRouteFilter} onClearStatFilter={() => setRouteFilter(null)} />
    }

    if (module === 'operations') {
      if (subpage === 'pipeline')    return <PipelineOverviewPage refs={operationsRefs} assessData={operationsAssessData} openModulePage={openModulePage} />
      if (subpage === 'aging')       return <ReferralAgingPage refs={operationsRefs} onSelectRef={setSelId} />
      if (subpage === 'volume')      return <ClinicVolumePage refs={operationsRefs} />
      if (subpage === 'conversion')  return <ConversionRatePage refs={operationsRefs} />
      if (subpage === 'performance') return <IntakePerformancePage refs={operationsRefs} role={role} />
    }

    return (
      <div style={{ textAlign: 'center', padding: '80px 40px' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Page not found</div>
      </div>
    )
  }

  return (
    <>
      {saved && <div className="toast">✅ Referral saved!</div>}

      <div className="shell">
        <Sidebar
          module={module}
          subpage={subpage}
          setSubpage={setSubpageAndClearFilter}
          goHome={goHome}
          pendingCount={pending.length}
          nrCount={nr.length}
          unverifiedCount={noIns}
        />

        <div className="content">
          <div className="topbar">
            <div className="topbar-title">
              {m?.icon} {m?.name}{currentNavLabel ? ` — ${currentNavLabel}` : ''}
            </div>
            <div className="topbar-right">
              {(module === 'intake' || module === 'operations') && (
                <select
                  style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 7, padding: '4px 10px', color: 'var(--text)', fontSize: 12, fontWeight: 600 }}
                  value={role} onChange={e => setRole(e.target.value)}
                >
                  {ALL_ROLES.map(r => <option key={r}>{r}</option>)}
                </select>
              )}
              <span className="badge-pill">✓ {active.length} Active</span>
              {pending.length > 0 && (
                <span style={{ background: '#f59e0b18', color: '#f59e0b', border: '1px solid #f59e0b30', borderRadius: 20, padding: '3px 12px', fontSize: '11.5px', fontWeight: 700 }}>
                  {pending.length} Pending Docs
                </span>
              )}
              <ThemeToggle theme={theme} setTheme={setTheme} />
              <button
                className="btn-sm"
                onClick={() => {
                  load()
                  if (module === 'assessment' || module === 'operations') loadAssessments()
                }}
              >
                ↻ Refresh
              </button>
            </div>
          </div>

          <div className="page">
            {error && (
              <div className="error-bar">
                ⚠️ {error}
                <button className="x-btn" onClick={() => setError(null)}>✕</button>
              </div>
            )}
            {renderPage()}
          </div>

          <footer style={{ borderTop: '1px solid var(--border)', padding: '14px 28px', textAlign: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: 'var(--dim)' }}>
              © 2026 Behavioral Solutions of Mississippi &nbsp;•&nbsp; Intake Operations Portal developed by Zanteria Wells
            </span>
          </footer>
        </div>
      </div>

      {selectedRef && (
        <ReferralModal
          referral={selectedRef}
          onClose={() => setSelId(null)}
          onSave={updateReferral}
          onDelete={(id) => deleteRecord('referral', id)}
          onSetStatus={(id, status) => { setStatus(id, status); setSelId(null) }}
          onToggleParentInterview={toggleParentInterview}
        />
      )}

      {selectedAssess && (
        <AssessmentDetailModal
          assessment={selectedAssess}
          onClose={() => setSelAssessId(null)}
          onSave={saveAssessEdit}
        />
      )}
    </>
  )
}
