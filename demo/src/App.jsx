import { useEffect, useMemo, useState } from 'react'
import { useTheme } from './hooks/useTheme'
import { useDemoReferrals } from './hooks/useDemoReferrals'
import { useDemoAssessments } from './hooks/useDemoAssessments'
import { useDemoActivityLogs, appendDemoActivityLog } from './hooks/useDemoActivityLogs'
import { MODULES, MODULE_NAV } from './lib/constants'
import { getAssessmentRecordId, needsInsuranceVerification } from './lib/utils'

import { DemoLandingPage } from './components/DemoLandingPage'
import { DemoBanner } from './components/DemoBanner'
import { DemoTour } from './components/DemoTour'
import { HomePage } from './components/HomePage'
import { Sidebar } from './components/Sidebar'
import { ThemeToggle } from './components/ThemeToggle'
import { ReferralModal } from './components/ReferralModal'
import { AssessmentDetailModal } from './components/AssessmentDetailModal'

import { DashboardPage } from './pages/DashboardPage'
import { AllReferralsPage } from './pages/AllReferralsPage'
import { NewReferralPage } from './pages/NewReferralPage'
import { IntakeDashboard, PendingDocsPage, InsuranceVerifPage, NonResponsivePage } from './pages/IntakePages'
import { AboutPortalPage, LocationsPage } from './pages/AboutPage'
import { AssessmentTracker, ParentInterviewsPage, BCBAAssignmentsPage, AssessmentProgressPage, TreatmentPlansPage, ReadyForServicesPage } from './pages/AssessmentPages'
import { PipelineOverviewPage, ReferralAgingPage, ClinicVolumePage, ConversionRatePage, IntakePerformancePage } from './pages/OperationsPages'

// Demo identity — no real auth
const DEMO_SESSION = { user: { id: 'demo-user' } }
const DEMO_PROFILE = { full_name: 'Demo User', role: 'Intake Coordinator', office: 'MERIDIAN' }

export default function App() {
  const { theme, setTheme } = useTheme()
  const { refs, loading, error, saving, saved, setError, load, saveReferral, updateReferral, deleteReferral, setStatus, toggleParentInterview } = useDemoReferrals()
  const { assessData, assessLoading, loadAssessments, saveAssessEdit, deleteAssessment } = useDemoAssessments()
  const [activityRefreshKey, setActivityRefreshKey] = useState(0)
  const { logs: _logs } = useDemoActivityLogs(8, activityRefreshKey)

  const [screen, setScreen] = useState('landing')
  const [module, setModule] = useState(null)
  const [subpage, setSubpage] = useState(null)
  const [selId, setSelId] = useState(null)
  const [selAssessId, setSelAssessId] = useState(null)
  const [routeFilter, setRouteFilter] = useState(null)
  const [showTour, setShowTour] = useState(false)

  // Load referrals on mount
  useEffect(() => { load() }, [load])

  // Show tour on first portal entry
  const maybeTriggerTour = () => {
    if (!localStorage.getItem('bsom_tour_seen')) setShowTour(true)
  }

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
    const defaults = { dashboard: 'overview', intake: 'intakedash', assessment: 'tracker', operations: 'pipeline', about: 'locations' }
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

  const active = useMemo(() => refs.filter(r => r.status === 'active'), [refs])
  const nr = useMemo(() => refs.filter(r => r.status === 'non-responsive' || r.status === 'referred-out'), [refs])
  const pending = useMemo(() => active.filter(r => !['signed', 'completed'].includes((r.intake_paperwork || '').toLowerCase())), [active])
  const noIns = useMemo(() => active.filter(r => needsInsuranceVerification(r.insurance_verified)).length, [active])

  const selectedRef = selId ? refs.find(r => r.id === selId) : null
  const selectedAssess = selAssessId
    ? assessData.find(r => String(getAssessmentRecordId(r) || '') === String(selAssessId))
    : null

  useEffect(() => {
    if (selId && !refs.some(r => r.id === selId)) setSelId(null)
  }, [refs, selId])

  useEffect(() => {
    if (selAssessId && !assessData.some(r => String(getAssessmentRecordId(r) || '') === String(selAssessId))) setSelAssessId(null)
  }, [assessData, selAssessId])

  const handleSelectAssessment = (record) => setSelAssessId(getAssessmentRecordId(record))

  const writeActivity = (entry) => {
    appendDemoActivityLog(entry)
    setActivityRefreshKey(k => k + 1)
  }

  const fmtRef = (r) => r ? `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Referral' : 'Referral'
  const fmtAssess = (r) => r?.client_name || 'Assessment'
  const actor = `${DEMO_PROFILE.full_name} (${DEMO_PROFILE.role})`

  const handleCreateReferral = async (form) => {
    const res = await saveReferral(form)
    if (res?.success && res?.data) {
      writeActivity({ action: 'referral_created', entity_type: 'referral', entity_id: String(res.data.id ?? ''), client_name: fmtRef(res.data), description: `${fmtRef(res.data)} was added to the intake pipeline.`, office: res.data.office || '', actor })
    }
    return res
  }

  const handleUpdateReferral = async (id, patch) => {
    const res = await updateReferral(id, patch)
    if (res?.success && res?.data) {
      const fields = Object.keys(patch || {})
      const action = fields.length === 1 && fields[0] === 'insurance_verified' ? 'insurance_verified' : 'referral_updated'
      writeActivity({ action, entity_type: 'referral', entity_id: String(id), client_name: fmtRef(res.data), description: `${fmtRef(res.data)} was updated.`, office: res.data.office || '', actor })
    }
    return res
  }

  const handleUpdateAssessment = async (id, patch) => {
    const res = await saveAssessEdit(id, patch)
    if (res?.success && res?.data) {
      writeActivity({ action: 'assessment_updated', entity_type: 'assessment', entity_id: String(id), client_name: fmtAssess(res.data), description: `${fmtAssess(res.data)} assessment details were updated.`, office: res.data.clinic || '', actor })
    }
    return res
  }

  const handleSetReferralStatus = async (id, status) => {
    const res = await setStatus(id, status)
    if (res?.success && res?.data) {
      writeActivity({ action: 'referral_status_changed', entity_type: 'referral', entity_id: String(id), client_name: fmtRef(res.data), description: `${fmtRef(res.data)} status changed to ${status}.`, office: res.data.office || '', actor })
    }
    return res
  }

  const handleToggleParentInterview = async (id, val) => {
    const res = await toggleParentInterview(id, val)
    if (res?.success && res?.data) {
      writeActivity({ action: val ? 'parent_interview_ready' : 'parent_interview_unmarked', entity_type: 'referral', entity_id: String(id), client_name: fmtRef(res.data), description: val ? `${fmtRef(res.data)} marked ready for parent interview.` : `${fmtRef(res.data)} removed from parent interview list.`, office: res.data.office || '', actor })
    }
    return res
  }

  const deleteRecord = async (type, id) => {
    const res = type === 'assessment' ? await deleteAssessment(id) : await deleteReferral(id)
    if (res?.success) {
      if (type === 'assessment') setSelAssessId(cur => (String(cur) === String(id) ? null : cur))
      else setSelId(cur => (cur === id ? null : cur))
    }
    return res
  }

  // Stub document upload — no real storage in demo
  const handleUploadClientDocument = async ({ referral, documentType }) => {
    writeActivity({ action: 'document_uploaded', entity_type: 'referral', entity_id: String(referral?.id ?? ''), client_name: fmtRef(referral), description: `${fmtRef(referral)} had a ${documentType} uploaded (demo).`, office: referral?.office || '', actor })
    return { success: true, data: { id: `doc-${Date.now()}` } }
  }

  // ── Screens ──

  if (screen === 'landing') {
    return (
      <DemoLandingPage
        theme={theme}
        setTheme={setTheme}
        onEnter={() => { setScreen('home'); maybeTriggerTour() }}
      />
    )
  }

  if (screen === 'home') {
    return (
      <>
        <DemoBanner onShowTour={() => setShowTour(true)} />
        <HomePage
          onEnterModule={enterModule}
          theme={theme}
          setTheme={setTheme}
          topRightContent={(
            <div className="home-account-card">
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{DEMO_PROFILE.role}</div>
                <div style={{ fontSize: 13, fontWeight: 800 }}>{DEMO_PROFILE.full_name}</div>
              </div>
              <button className="btn-sm" onClick={() => setScreen('landing')}>← Exit Demo</button>
            </div>
          )}
        />
        {saved && <div className="toast">✅ Referral saved!</div>}
        {showTour && <DemoTour onClose={() => setShowTour(false)} />}
      </>
    )
  }

  // Module screen
  const m = MODULES.find(x => x.id === module)
  const navItems = MODULE_NAV[module] || []
  const currentNavLabel = navItems.find(n => n.id === subpage)?.label || ''

  const renderPage = () => {
    if (loading) return (
      <div className="loader-wrap">
        <div className="spinner" />
        <div style={{ color: 'var(--muted)' }}>Loading demo data...</div>
      </div>
    )

    if (module === 'dashboard') {
      return <DashboardPage refs={refs} setSelectedId={setSelId} openModulePage={openModulePage} activityRefreshKey={activityRefreshKey} />
    }

    if (module === 'intake') {
      if (subpage === 'intakedash') return <IntakeDashboard refs={refs} onSelectRef={setSelId} openModulePage={openModulePage} />
      if (subpage === 'all') return <AllReferralsPage refs={refs} onSelectRef={setSelId} statFilter={routeFilter} onClearStatFilter={() => setRouteFilter(null)} />
      if (subpage === 'new') return <NewReferralPage onSave={handleCreateReferral} saving={saving} />
      if (subpage === 'pending') return <PendingDocsPage refs={refs} onSelectRef={setSelId} statFilter={routeFilter} onSetStatFilter={setRouteFilter} onClearStatFilter={() => setRouteFilter(null)} />
      if (subpage === 'insurance') return <InsuranceVerifPage refs={refs} onSelectRef={setSelId} statFilter={routeFilter} onSetStatFilter={setRouteFilter} onClearStatFilter={() => setRouteFilter(null)} />
      if (subpage === 'nr') return <NonResponsivePage refs={refs} onRestore={(id) => handleSetReferralStatus(id, 'active')} statFilter={routeFilter} onClearStatFilter={() => setRouteFilter(null)} />
    }

    if (module === 'about') {
      if (subpage === 'portal') return <AboutPortalPage />
      if (subpage === 'locations') return <LocationsPage />
    }

    if (module === 'assessment') {
      if (subpage === 'tracker') return <AssessmentTracker assessData={assessData} assessLoading={assessLoading} onSelectAssess={handleSelectAssessment} statFilter={routeFilter} onSetStatFilter={setRouteFilter} onClearStatFilter={() => setRouteFilter(null)} />
      if (subpage === 'interviews') return <ParentInterviewsPage assessData={assessData} assessLoading={assessLoading} onSelectAssess={handleSelectAssessment} statFilter={routeFilter} onSetStatFilter={setRouteFilter} onClearStatFilter={() => setRouteFilter(null)} />
      if (subpage === 'bcba') return <BCBAAssignmentsPage assessData={assessData} assessLoading={assessLoading} onSelectAssess={handleSelectAssessment} statFilter={routeFilter} onSetStatFilter={setRouteFilter} onClearStatFilter={() => setRouteFilter(null)} />
      if (subpage === 'progress') return <AssessmentProgressPage assessData={assessData} assessLoading={assessLoading} onSelectAssess={handleSelectAssessment} statFilter={routeFilter} onSetStatFilter={setRouteFilter} onClearStatFilter={() => setRouteFilter(null)} />
      if (subpage === 'txplan') return <TreatmentPlansPage assessData={assessData} assessLoading={assessLoading} onSelectAssess={handleSelectAssessment} statFilter={routeFilter} onSetStatFilter={setRouteFilter} onClearStatFilter={() => setRouteFilter(null)} />
      if (subpage === 'readysvc') return <ReadyForServicesPage assessData={assessData} assessLoading={assessLoading} onSelectAssess={handleSelectAssessment} statFilter={routeFilter} onSetStatFilter={setRouteFilter} onClearStatFilter={() => setRouteFilter(null)} />
    }

    if (module === 'operations') {
      if (subpage === 'pipeline') return <PipelineOverviewPage refs={refs} assessData={assessData} openModulePage={openModulePage} />
      if (subpage === 'aging') return <ReferralAgingPage refs={refs} onSelectRef={setSelId} />
      if (subpage === 'volume') return <ClinicVolumePage refs={refs} />
      if (subpage === 'conversion') return <ConversionRatePage refs={refs} />
      if (subpage === 'performance') return <IntakePerformancePage refs={refs} />
    }

    return (
      <div style={{ textAlign: 'center', padding: '80px 40px' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🔍</div>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Page not found</div>
      </div>
    )
  }

  return (
    <>
      <DemoBanner onShowTour={() => setShowTour(true)} />
      {saved && <div className="toast">✅ Referral saved!</div>}

      <div className="shell" style={{ paddingTop: 36 }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 12px', borderRadius: 999, background: 'var(--surface2)', border: '1px solid var(--border2)' }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    {DEMO_PROFILE.role} — {DEMO_PROFILE.office}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800 }}>{DEMO_PROFILE.full_name}</div>
                </div>
              </div>
              <span className="badge-pill">✓ {active.length} Active</span>
              {pending.length > 0 && (
                <span style={{ background: '#f59e0b18', color: '#f59e0b', border: '1px solid #f59e0b30', borderRadius: 20, padding: '3px 12px', fontSize: '11.5px', fontWeight: 700 }}>
                  {pending.length} Pending Docs
                </span>
              )}
              <ThemeToggle theme={theme} setTheme={setTheme} />
              <button className="btn-sm" onClick={() => setScreen('landing')}>← Exit Demo</button>
              <button className="btn-sm" onClick={() => { load(); if (module === 'assessment' || module === 'operations') loadAssessments() }}>↻ Refresh</button>
            </div>
          </div>

          <div className="page">
            {error && (
              <div className="error-bar">
                ⚠️ {error}
                <button className="x-btn" onClick={() => setError(null)}>✕</button>
              </div>
            )}
            <div className={`page-inner ${module === 'intake' && subpage === 'all' ? 'page-inner-wide' : ''}`}>
              {renderPage()}
            </div>
          </div>

          <footer style={{ borderTop: '1px solid var(--border)', padding: '14px 28px', textAlign: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: 'var(--dim)' }}>
              © 2026 Behavioral Solutions of Mississippi &nbsp;•&nbsp; Demo Version — Sample Data Only
            </span>
          </footer>
        </div>
      </div>

      {selectedRef && (
        <ReferralModal
          referral={selectedRef}
          onClose={() => setSelId(null)}
          onSave={handleUpdateReferral}
          onUploadDocument={handleUploadClientDocument}
          onDelete={(id) => deleteRecord('referral', id)}
          onSetStatus={async (id, status) => { const res = await handleSetReferralStatus(id, status); if (res?.success) setSelId(null); return res }}
          onToggleParentInterview={handleToggleParentInterview}
        />
      )}

      {selectedAssess && (
        <AssessmentDetailModal
          assessment={selectedAssess}
          onClose={() => setSelAssessId(null)}
          onSave={handleUpdateAssessment}
          onDelete={(id) => deleteRecord('assessment', id)}
        />
      )}

      {showTour && <DemoTour onClose={() => setShowTour(false)} />}
    </>
  )
}
