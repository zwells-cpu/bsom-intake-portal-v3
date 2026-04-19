import { supabase } from './lib/supabase'
import { useEffect, useMemo, useState } from 'react'
import { useTheme } from './hooks/useTheme'
import { useIdleTimeout } from './hooks/useIdleTimeout'
import { useReferrals } from './hooks/useReferrals'
import { useAssessments } from './hooks/useAssessments'
import { MODULES, MODULE_NAV } from './lib/constants'

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
import { getAssessmentRecordId } from './lib/utils'

export default function App() {
  const { theme, setTheme } = useTheme()
  const { refs, loading, error, saving, saved, setError, load, saveReferral, updateReferral, deleteReferral, setStatus, toggleParentInterview } = useReferrals()
  const { assessData, assessLoading, loadAssessments, saveAssessEdit, deleteAssessment } = useAssessments()
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoading, setProfileLoading] = useState(false)
  const [recoveryMode, setRecoveryMode] = useState(false)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [resetPassword, setResetPassword] = useState('')
  const [resetConfirmPassword, setResetConfirmPassword] = useState('')
  const [loginError, setLoginError] = useState(null)
  const [loginPending, setLoginPending] = useState(false)
  const [resetPending, setResetPending] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(null)
  const [signOutPending, setSignOutPending] = useState(false)

  const [screen, setScreen] = useState('home')
  const [module, setModule] = useState(null)
  const [subpage, setSubpage] = useState(null)
  const [selId, setSelId] = useState(null)
  const [selAssessId, setSelAssessId] = useState(null)
  const [routeFilter, setRouteFilter] = useState(null)

  useEffect(() => {
    let mounted = true
    const isRecoveryLink = () => {
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ''))
      const searchParams = new URLSearchParams(window.location.search)
      return hashParams.get('type') === 'recovery' || searchParams.get('type') === 'recovery'
    }

    const initSession = async () => {
      const { data, error: sessionError } = await supabase.auth.getSession()

      if (!mounted) return

      if (sessionError) {
        setLoginError(sessionError.message)
      }

      setRecoveryMode(isRecoveryLink())
      setSession(data.session ?? null)
      setAuthLoading(false)
    }

    initSession()

    const { data: authListener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true)
        setResetSuccess(null)
        setLoginError(null)
      } else if (event === 'SIGNED_OUT') {
        setRecoveryMode(false)
      } else if (!isRecoveryLink()) {
        setRecoveryMode(false)
      }

      setSession(nextSession ?? null)
      setAuthLoading(false)
      setLoginError(null)
    })

    return () => {
      mounted = false
      authListener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!session || recoveryMode) return
    load()
  }, [load, recoveryMode, session])

  useEffect(() => {
    let cancelled = false

    const loadProfile = async () => {
      if (!session?.user?.id || recoveryMode) {
        setProfile(null)
        setProfileLoading(false)
        return
      }

      setProfileLoading(true)

      const { data, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, role, office')
        .eq('id', session.user.id)
        .maybeSingle()

      if (cancelled) return

      if (profileError) {
        setLoginError(profileError.message)
        setProfile(null)
      } else {
        setProfile(data ?? null)
      }

      setProfileLoading(false)
    }

    loadProfile()

    return () => {
      cancelled = true
    }
  }, [recoveryMode, session])

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
  const noIns = useMemo(() => active.filter(r => !['yes', 'verified'].includes((r.insurance_verified || '').toLowerCase())).length, [active])
  const operationsRefs = useMemo(() => refs, [refs])
  const operationsAssessData = useMemo(() => assessData, [assessData])

  const selectedRef = selId ? refs.find(r => r.id === selId) : null
  const selectedAssess = selAssessId
    ? assessData.find(r => String(getAssessmentRecordId(r) || '') === String(selAssessId))
    : null

  useEffect(() => {
    if (selId && !refs.some(record => record.id === selId)) setSelId(null)
  }, [refs, selId])

  useEffect(() => {
    if (selAssessId && !assessData.some(record => String(getAssessmentRecordId(record) || '') === String(selAssessId))) {
      setSelAssessId(null)
    }
  }, [assessData, selAssessId])

  const handleSelectAssessment = (record) => {
    const id = getAssessmentRecordId(record)
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

  const displayName = profile?.full_name || session?.user?.email || 'Signed-in user'
  const displayRole = profile?.role || 'Role pending'
  const displayOffice = profile?.office || 'Office pending'
  const formatReferralName = (record) => {
    if (!record) return 'Referral'
    const fullName = `${record.first_name || ''} ${record.last_name || ''}`.trim()
    return fullName || 'Referral'
  }
  const formatAssessmentName = (record) => record?.client_name || 'Assessment'
  const sanitizeFileName = (name) => (name || 'document')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')

  const handleUploadClientDocument = async ({ referral, documentType, file }) => {
    if (!session?.user?.id) return { success: false, error: 'You must be signed in to upload documents.' }
    if (!file) return { success: false, error: 'Please select a file to upload.' }

    const allowedMimeTypes = ['application/pdf']
    const isImage = typeof file.type === 'string' && file.type.startsWith('image/')

    if (!allowedMimeTypes.includes(file.type) && !isImage) {
      return { success: false, error: 'Only PDF and image files are allowed.' }
    }

    const referralId = referral?.id
    const clientName = formatReferralName(referral)
    const safeName = sanitizeFileName(file.name)
    const uploadId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`
    const filePath = `${referralId || 'unassigned'}/${uploadId}-${safeName}`

    const { error: uploadError } = await supabase
      .storage
      .from('client-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream',
      })

    if (uploadError) {
      return { success: false, error: uploadError.message }
    }

    const documentRecord = {
      uploaded_by: session.user.id,
      uploaded_by_name: displayName,
      client_name: clientName,
      referral_id: referralId,
      document_type: documentType,
      file_name: file.name,
      file_path: filePath,
      file_size: file.size || 0,
      mime_type: file.type || 'application/octet-stream',
    }

    const { data, error: insertError } = await supabase
      .from('client_documents')
      .insert(documentRecord)
      .select()
      .single()

    if (insertError) {
      await supabase.storage.from('client-documents').remove([filePath])
      return { success: false, error: insertError.message }
    }

    return { success: true, data }
  }

  const logActivity = async ({ actionType, entityType, entityId, entityName, details }) => {
    if (!session?.user?.id) return

    const payload = {
      user_id: session.user.id,
      user_name: displayName,
      user_role: displayRole,
      action_type: actionType,
      entity_type: entityType,
      entity_id: String(entityId ?? ''),
      entity_name: entityName,
      details: typeof details === 'string' ? details : JSON.stringify(details ?? {}),
    }

    const { error: activityError } = await supabase
      .from('activity_logs')
      .insert(payload)

    if (activityError) {
      console.error('Could not write activity log:', activityError.message)
    }
  }

  const handleCreateReferral = async (form) => {
    const res = await saveReferral(form)

    if (res?.success && res?.data) {
      await logActivity({
        actionType: 'referral created',
        entityType: 'referral',
        entityId: res.data.id,
        entityName: formatReferralName(res.data),
        details: {
          office: res.data.office || '',
          insurance: res.data.insurance || '',
          status: res.data.status || '',
        },
      })
    }

    return res
  }

  const handleUpdateReferral = async (id, patch) => {
    const res = await updateReferral(id, patch)

    if (res?.success && res?.data) {
      await logActivity({
        actionType: 'referral updated',
        entityType: 'referral',
        entityId: res.data.id || id,
        entityName: formatReferralName(res.data),
        details: {
          updated_fields: Object.keys(patch || {}),
          office: res.data.office || '',
          status: res.data.status || '',
        },
      })
    }

    return res
  }

  const handleUpdateAssessment = async (id, patch) => {
    const res = await saveAssessEdit(id, patch)

    if (res?.success && res?.data) {
      await logActivity({
        actionType: 'assessment updated',
        entityType: 'assessment',
        entityId: getAssessmentRecordId(res.data) || id,
        entityName: formatAssessmentName(res.data),
        details: {
          updated_fields: Object.keys(patch || {}),
          clinic: res.data.clinic || res.data.office || '',
          authorization_status: res.data.authorization_status || '',
        },
      })
    }

    return res
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginPending(true)
    setLoginError(null)
    setResetSuccess(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    })

    if (signInError) {
      setLoginError(signInError.message)
    }

    setLoginPending(false)
  }

  const handlePasswordReset = async (e) => {
    e.preventDefault()
    setResetPending(true)
    setLoginError(null)
    setResetSuccess(null)

    if (resetPassword.length < 6) {
      setLoginError('Password must be at least 6 characters long.')
      setResetPending(false)
      return
    }

    if (resetPassword !== resetConfirmPassword) {
      setLoginError('Passwords do not match.')
      setResetPending(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: resetPassword,
    })

    if (updateError) {
      setLoginError(updateError.message)
      setResetPending(false)
      return
    }

    setResetSuccess('Password updated. Please sign in with your new password.')
    setResetPassword('')
    setResetConfirmPassword('')
    setRecoveryMode(false)

    if (window.location.hash || window.location.search.includes('type=recovery')) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    await supabase.auth.signOut()
    setResetPending(false)
  }

  const handleSignOut = async () => {
    setSignOutPending(true)
    setLoginError(null)

    const { error: signOutError } = await supabase.auth.signOut()

    if (signOutError) {
      setLoginError(signOutError.message)
    } else {
      setProfile(null)
      setScreen('home')
      setModule(null)
      setSubpage(null)
      setSelId(null)
      setSelAssessId(null)
      setRouteFilter(null)
      setLoginPassword('')
    }

    setSignOutPending(false)
  }

  const { isWarning, secondsLeft, resetTimer } = useIdleTimeout({
    onTimeout: handleSignOut,
    enabled: !!session && !recoveryMode,
  })

  const idleWarningModal = isWarning ? (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
      display: 'grid', placeItems: 'center', padding: 24,
    }}>
      <div style={{
        width: '100%', maxWidth: 400,
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 20, boxShadow: 'var(--shadow)', padding: 28,
        display: 'grid', gap: 16,
      }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 8 }}>
            Session Timeout
          </div>
          <h2 style={{ margin: 0, fontSize: 22 }}>Are you still there?</h2>
        </div>
        <p style={{ margin: 0, fontSize: 14, color: 'var(--muted)', lineHeight: 1.5 }}>
          You'll be signed out automatically due to inactivity in{' '}
          <strong style={{ color: 'var(--text)' }}>
            {Math.floor(secondsLeft / 60)}:{String(secondsLeft % 60).padStart(2, '0')}
          </strong>.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={resetTimer}
            style={{
              flex: 1, border: 'none', borderRadius: 12, padding: '12px 16px',
              background: 'var(--accent)', color: '#fff', fontWeight: 800,
              fontSize: 14, cursor: 'pointer',
            }}
          >
            Stay Logged In
          </button>
          <button
            onClick={handleSignOut}
            style={{
              flex: 1, borderRadius: 12, padding: '12px 16px',
              background: 'transparent', border: '1px solid var(--border2)',
              color: 'var(--text)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
            }}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  ) : null

  if (authLoading) {
    return (
      <div className="loader-wrap">
        <div className="spinner" />
        <div style={{ color: 'var(--muted)' }}>Checking your session...</div>
      </div>
    )
  }

  if (!session || recoveryMode) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '32px', background: 'var(--bg)' }}>
        <div style={{ width: '100%', maxWidth: 420, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 24, boxShadow: 'var(--shadow)', padding: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)' }}>Secure Access</div>
              <h1 style={{ margin: '8px 0 0', fontSize: 28, lineHeight: 1.1 }}>{recoveryMode ? 'Reset password' : 'Sign in'}</h1>
            </div>
            <ThemeToggle theme={theme} setTheme={setTheme} />
          </div>

          <form onSubmit={recoveryMode ? handlePasswordReset : handleLogin} style={{ display: 'grid', gap: 14 }}>
            {recoveryMode ? (
              <>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>New Password</span>
                  <input
                    type="password"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 12, padding: '12px 14px', color: 'var(--text)', fontSize: 14 }}
                  />
                </label>

                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>Confirm Password</span>
                  <input
                    type="password"
                    value={resetConfirmPassword}
                    onChange={(e) => setResetConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 12, padding: '12px 14px', color: 'var(--text)', fontSize: 14 }}
                  />
                </label>
              </>
            ) : (
              <>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>Email</span>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    autoComplete="email"
                    required
                    style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 12, padding: '12px 14px', color: 'var(--text)', fontSize: 14 }}
                  />
                </label>

                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>Password</span>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    style={{ width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 12, padding: '12px 14px', color: 'var(--text)', fontSize: 14 }}
                  />
                </label>
              </>
            )}

            {loginError && (
              <div className="error-bar" style={{ margin: 0 }}>
                {loginError}
              </div>
            )}

            {resetSuccess && (
              <div style={{ margin: 0, borderRadius: 12, border: '1px solid #16a34a33', background: '#16a34a12', color: '#16a34a', padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>
                {resetSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={recoveryMode ? resetPending : loginPending}
              style={{ border: 'none', borderRadius: 12, padding: '13px 16px', background: 'var(--accent)', color: '#fff', fontWeight: 800, fontSize: 14, cursor: (recoveryMode ? resetPending : loginPending) ? 'wait' : 'pointer', opacity: (recoveryMode ? resetPending : loginPending) ? 0.75 : 1 }}
            >
              {recoveryMode ? (resetPending ? 'Updating password...' : 'Reset Password') : (loginPending ? 'Signing in...' : 'Sign In')}
            </button>
          </form>
        </div>
      </div>
    )
  }

  if (screen === 'home') {
    return (
      <>
        <HomePage
          onEnterModule={enterModule}
          theme={theme}
          setTheme={setTheme}
          topRightContent={(
            <div className="home-account-card">
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{profileLoading ? 'Loading profile...' : displayRole}</div>
                <div style={{ fontSize: 13, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 220 }}>{displayName}</div>
              </div>
              <button className="btn-sm" onClick={handleSignOut} disabled={signOutPending}>
                {signOutPending ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
          )}
        />
        {saved && <div className="toast">✅ Referral saved!</div>}
        {idleWarningModal}
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
      if (subpage === 'all') return <AllReferralsPage refs={refs} onSelectRef={setSelId} statFilter={routeFilter} onClearStatFilter={() => setRouteFilter(null)} />
      if (subpage === 'new') return <NewReferralPage onSave={handleCreateReferral} saving={saving} />
      if (subpage === 'pending') return <PendingDocsPage refs={refs} onSelectRef={setSelId} statFilter={routeFilter} onSetStatFilter={setRouteFilter} onClearStatFilter={() => setRouteFilter(null)} />
      if (subpage === 'insurance') return <InsuranceVerifPage refs={refs} onSelectRef={setSelId} statFilter={routeFilter} onSetStatFilter={setRouteFilter} onClearStatFilter={() => setRouteFilter(null)} />
      if (subpage === 'nr') return <NonResponsivePage refs={refs} onRestore={(id) => setStatus(id, 'active')} statFilter={routeFilter} onClearStatFilter={() => setRouteFilter(null)} />
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
      if (subpage === 'pipeline') return <PipelineOverviewPage refs={operationsRefs} assessData={operationsAssessData} openModulePage={openModulePage} />
      if (subpage === 'aging') return <ReferralAgingPage refs={operationsRefs} onSelectRef={setSelId} />
      if (subpage === 'volume') return <ClinicVolumePage refs={operationsRefs} />
      if (subpage === 'conversion') return <ConversionRatePage refs={operationsRefs} />
      if (subpage === 'performance') return <IntakePerformancePage refs={operationsRefs} />
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
              {m?.icon} {m?.name}{currentNavLabel ? ` - ${currentNavLabel}` : ''}
            </div>
            <div className="topbar-right">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 12px', borderRadius: 999, background: 'var(--surface2)', border: '1px solid var(--border2)', maxWidth: 260 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    {profileLoading ? 'Loading profile' : `${displayRole} - ${displayOffice}`}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
                </div>
              </div>
              <span className="badge-pill">✓ {active.length} Active</span>
              {pending.length > 0 && (
                <span style={{ background: '#f59e0b18', color: '#f59e0b', border: '1px solid #f59e0b30', borderRadius: 20, padding: '3px 12px', fontSize: '11.5px', fontWeight: 700 }}>
                  {pending.length} Pending Docs
                </span>
              )}
              <ThemeToggle theme={theme} setTheme={setTheme} />
              <button className="btn-sm" onClick={handleSignOut} disabled={signOutPending}>
                {signOutPending ? 'Signing out...' : 'Sign Out'}
              </button>
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
            <div className={`page-inner ${module === 'intake' && subpage === 'all' ? 'page-inner-wide' : ''}`}>
              {renderPage()}
            </div>
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
          onSave={handleUpdateReferral}
          onUploadDocument={handleUploadClientDocument}
          onDelete={(id) => deleteRecord('referral', id)}
          onSetStatus={(id, status) => { setStatus(id, status); setSelId(null) }}
          onToggleParentInterview={toggleParentInterview}
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

      {idleWarningModal}
    </>
  )
}
