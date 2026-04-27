import { supabase } from './lib/supabase'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTheme } from './hooks/useTheme'
import { useIdleTimeout } from './hooks/useIdleTimeout'
import { useReferrals } from './hooks/useReferrals'
import { useAssessments } from './hooks/useAssessments'
import { useBcbaStaff } from './hooks/useBcbaStaff'
import { MODULES, MODULE_NAV } from './lib/constants'

import { HomePage } from './components/HomePage'
import { Sidebar } from './components/Sidebar'
import { ThemeToggle } from './components/ThemeToggle'
import { ReferralModal } from './components/ReferralModal'
import { AssessmentDetailModal } from './components/AssessmentDetailModal'

import { ActivityLogPage, DashboardPage } from './pages/DashboardPage'
import { ClientProfilePage } from './pages/ClientProfilePage'
import { AllReferralsPage } from './pages/AllReferralsPage'
import { NewReferralPage } from './pages/NewReferralPage'
import { IntakeDashboard, PendingDocsPage, InsuranceVerifPage, NonResponsivePage } from './pages/IntakePages'
import { AboutPortalPage, LocationsPage } from './pages/AboutPage'
import { AssessmentTracker, ParentInterviewsPage, BCBAAssignmentsPage, AssessmentProgressPage, TreatmentPlansPage, ReadyForServicesPage } from './pages/AssessmentPages'
import { PipelineOverviewPage, ReferralAgingPage, ClinicVolumePage, ConversionRatePage, IntakePerformancePage } from './pages/OperationsPages'
import { createActivityLog } from './lib/activityLogs'
import { getAssessmentRecordId, needsInsuranceVerification } from './lib/utils'
import { API_BASE } from './lib/api'

const NAV_STATE_KEY = 'bsom-portal-nav'

const REFERRAL_DOCUMENT_FIELDS = new Set(['referral_form', 'permission_assessment', 'vineland', 'srs2', 'autism_diagnosis', 'intake_paperwork', 'iep_report', 'attends_school'])
const REFERRAL_CONTACT_FIELDS  = new Set(['caregiver', 'caregiver_phone', 'caregiver_email', 'referral_source', 'referral_source_phone', 'referral_source_fax', 'provider_npi', 'point_of_contact'])
const REFERRAL_INSURANCE_FIELDS = new Set(['insurance', 'secondary_insurance'])

function describeReferralUpdate(name, changedFields, afterData) {
  const fields = changedFields.filter(f => f !== 'current_stage')
  if (!fields.length) return `${name}'s referral record was updated.`
  if (fields.every(f => REFERRAL_DOCUMENT_FIELDS.has(f)))  return `${name}'s document checklist was updated.`
  if (fields.every(f => REFERRAL_CONTACT_FIELDS.has(f)))   return `${name}'s contact information was updated.`
  if (fields.every(f => REFERRAL_INSURANCE_FIELDS.has(f))) return `${name}'s insurance information was updated.`
  if (fields.includes('office') && fields.length === 1) {
    const office = afterData?.office
    return office ? `${name} was transferred to ${office}.` : `${name}'s office was updated.`
  }
  if (fields.includes('intake_personnel') && fields.length === 1) {
    const staff = afterData?.intake_personnel
    return staff ? `${name} was assigned to ${staff}.` : `${name} was assigned to a staff member.`
  }
  if (fields.length === 1 && fields[0] === 'notes') return `Notes were updated for ${name}.`
  if (fields.length === 1 && fields[0] === 'reason_for_referral') return `Reason for referral was updated for ${name}.`
  return `${name}'s referral record was updated.`
}

function getReferralUpdateAction(changedFields) {
  const fields = changedFields.filter(f => f !== 'current_stage')
  if (fields.every(f => REFERRAL_DOCUMENT_FIELDS.has(f)))   return 'documents_updated'
  if (fields.every(f => REFERRAL_CONTACT_FIELDS.has(f)))    return 'contact_info_updated'
  if (fields.every(f => REFERRAL_INSURANCE_FIELDS.has(f)))  return 'insurance_updated'
  if (fields.includes('office') && fields.length === 1)     return 'office_transferred'
  if (fields.includes('intake_personnel') && fields.length === 1) return 'staff_assigned'
  if (fields.length === 1 && fields[0] === 'notes')         return 'notes_updated'
  return 'referral_updated'
}

function describeAssessmentUpdate(name, changedFields, afterData) {
  if (changedFields.includes('authorization_status')) {
    const val = afterData?.authorization_status
    return val ? `${name} authorization status updated to "${val}".` : `${name}'s authorization status was updated.`
  }
  if (changedFields.includes('treatment_plan_status')) {
    const val = afterData?.treatment_plan_status
    return val ? `${name} treatment plan status updated to "${val}".` : `${name}'s treatment plan was updated.`
  }
  if (changedFields.includes('parent_interview_status')) {
    const val = afterData?.parent_interview_status
    return val ? `${name} parent interview status updated to "${val}".` : `${name}'s parent interview status was updated.`
  }
  if (changedFields.includes('assigned_bcba')) {
    const bcba = afterData?.assigned_bcba
    return bcba ? `${name} was assigned to ${bcba}.` : `${name}'s BCBA assignment was removed.`
  }
  if (changedFields.includes('ready_for_services')) {
    return afterData?.ready_for_services
      ? `${name} was marked ready for services.`
      : `${name} was removed from ready-for-services.`
  }
  return `${name}'s assessment details were updated.`
}

function getAssessmentUpdateAction(changedFields) {
  if (changedFields.includes('authorization_status'))   return 'authorization_status_updated'
  if (changedFields.includes('treatment_plan_status'))  return 'treatment_plan_updated'
  if (changedFields.includes('parent_interview_status')) return 'parent_interview_updated'
  if (changedFields.includes('assigned_bcba'))          return 'bcba_assigned'
  if (changedFields.includes('ready_for_services'))     return 'ready_for_services_updated'
  return 'assessment_updated'
}

function readSavedNav() {
  try {
    const raw = sessionStorage.getItem(NAV_STATE_KEY)
    if (!raw) return null
    const saved = JSON.parse(raw)
    return saved?.screen === 'module' && saved?.module ? saved : null
  } catch {
    return null
  }
}

export default function App() {
  const { theme, setTheme } = useTheme()
  const { refs, loading, error, saving, saved, setError, load, saveReferral, updateReferral, deleteReferral, setStatus, toggleParentInterview } = useReferrals()
  const { assessData, assessLoading, loadAssessments, saveAssessEdit, deleteAssessment } = useAssessments()
  const { bcbaStaff, activeBcbaStaff, bcbaStaffLoading, bcbaStaffError, setBcbaStaffError, createBcbaStaff, updateBcbaStaff, deactivateBcbaStaff, loadBcbaStaff } = useBcbaStaff()
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
  const [activityRefreshKey, setActivityRefreshKey] = useState(0)

  const [screen, setScreen] = useState(() => readSavedNav()?.screen ?? 'home')
  const [module, setModule] = useState(() => readSavedNav()?.module ?? null)
  const [subpage, setSubpage] = useState(() => readSavedNav()?.subpage ?? null)
  const [selId, setSelId] = useState(null)
  const [selAssessId, setSelAssessId] = useState(null)
  const [routeFilter, setRouteFilter] = useState(null)
  const [profileId, setProfileId] = useState(null)

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
    if (!session || recoveryMode) return
    loadBcbaStaff({ includeInactive: true })
  }, [loadBcbaStaff, recoveryMode, session])

  useEffect(() => {
    let cancelled = false

    const loadProfile = async () => {
      if (!session?.user?.id || recoveryMode) {
        setProfile(null)
        setProfileLoading(false)
        return
      }

      setProfileLoading(true)

      let data = null
      let profileError = null
      try {
        const profileRes = await fetch(`${API_BASE}/profiles/${session.user.id}`)
        if (!profileRes.ok) throw new Error(`HTTP ${profileRes.status}`)
        data = await profileRes.json()
      } catch (err) {
        profileError = err
      }

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

  // Persist navigation across browser refreshes (session-scoped).
  useEffect(() => {
    if (screen === 'module' && module) {
      sessionStorage.setItem(NAV_STATE_KEY, JSON.stringify({ screen, module, subpage }))
    } else {
      sessionStorage.removeItem(NAV_STATE_KEY)
    }
  }, [screen, module, subpage])

  // When session resolves and nav was restored to assessment/operations, trigger data load.
  const _restoredModule = useRef(readSavedNav()?.module ?? null)
  useEffect(() => {
    if (!session || recoveryMode) return
    const m = _restoredModule.current
    if (m === 'assessment' || m === 'operations') loadAssessments()
  }, [session, recoveryMode, loadAssessments])

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
  const readyForInterview = useMemo(() => refs.filter(r => r.ready_for_parent_interview === true), [refs])
  const noIns = useMemo(() => active.filter(r => needsInsuranceVerification(r.insurance_verified)).length, [active])
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
    const record = type === 'assessment'
      ? assessData.find(item => String(getAssessmentRecordId(item) || '') === String(id))
      : refs.find(item => item.id === id)

    const res = type === 'assessment'
      ? await deleteAssessment(id)
      : await deleteReferral(id)

    if (res?.success) {
      if (type === 'assessment') setSelAssessId(current => (String(current) === String(id) ? null : current))
      else setSelId(current => (current === id ? null : current))

      if (type === 'assessment' && record) {
        await writeAssessmentActivity({
          action: 'assessment_deleted',
          record,
          description: `${formatAssessmentName(record)} assessment was deleted.`,
          details_json: { deleted: true },
        })
      } else if (type === 'referral' && record) {
        await writeReferralActivity({
          action: 'referral_deleted',
          record,
          description: `${formatReferralName(record)} referral was deleted.`,
          details_json: { deleted: true, status: record.status || '' },
        })
      }
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
  const safeCreateActivityLog = async (entry) => {
    const result = await createActivityLog(entry)
    if (result !== null) setActivityRefreshKey(current => current + 1)
    return result !== null
  }

  const writeReferralActivity = async ({ action, record, description, details_json = {} }) => {
    if (!session?.user?.id || !record) return

    await safeCreateActivityLog({
      user_id:      session.user.id,
      user_email:   session.user.email   || null,
      user_role:    profile?.role        || null,
      action,
      entity_type:  'referral',
      entity_id:    String(record.id ?? ''),
      entity_label: formatReferralName(record),
      description,
      details_json: { office: record.office || '', ...details_json },
    })
  }

  const writeAssessmentActivity = async ({ action, record, description, details_json = {} }) => {
    if (!session?.user?.id || !record) return

    await safeCreateActivityLog({
      user_id:      session.user.id,
      user_email:   session.user.email || null,
      user_role:    profile?.role      || null,
      action,
      entity_type:  'assessment',
      entity_id:    String(getAssessmentRecordId(record) ?? ''),
      entity_label: formatAssessmentName(record),
      description,
      details_json: { clinic: record.clinic || record.office || '', ...details_json },
    })
  }
  const handleUploadClientDocument = async ({ referral, documentType, file }) => {
    if (!file) return { success: false, error: 'Please select a file to upload.' }

    const referralId = referral?.id
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', documentType)
    formData.append('uploaded_by', session?.user?.id || '')
    formData.append('uploaded_by_name', displayName)
    formData.append('client_name', formatReferralName(referral))

    try {
      const res = await fetch(`${API_BASE}/referrals/${referralId}/documents`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const text = await res.text()
        let msg = text
        try { msg = JSON.parse(text)?.error || text } catch {}
        return { success: false, error: msg || 'Upload failed.' }
      }
      const data = await res.json()
      await writeReferralActivity({
        action: 'document_uploaded',
        record: referral,
        description: `${formatReferralName(referral)} document uploaded: ${documentType}.`,
        details_json: { document_type: documentType },
      })
      return { success: true, data }
    } catch {
      return { success: false, error: 'Could not reach the server. Check your connection.' }
    }
  }

  const handleCreateReferral = async (form) => {
    const res = await saveReferral(form)

    if (res?.success && res?.data) {
      await writeReferralActivity({
        action: 'referral_created',
        record: res.data,
        description: `${formatReferralName(res.data)} was added to the intake pipeline.`,
        details_json: {
          insurance: res.data.insurance || '',
          status: res.data.status || '',
        },
      })
      openModulePage('intake', 'all')
    }

    return res
  }

  const handleUpdateReferral = async (id, patch) => {
    const before = refs.find(r => r.id === id)
    const res = await updateReferral(id, patch)

    if (res?.success && res?.data) {
      const changedFields = Object.keys(patch || {})

      if (changedFields.length === 1 && changedFields[0] === 'insurance_verified') {
        await writeReferralActivity({
          action: 'insurance_verified',
          record: res.data,
          description: `${formatReferralName(res.data)} insurance status updated.`,
          details_json: {
            changed_fields: ['insurance_verified'],
            before: { insurance_verified: before?.insurance_verified ?? null },
            after:  { insurance_verified: res.data.insurance_verified ?? null },
          },
        })
      } else {
        const criticalFields = ['status', 'intake_paperwork', 'office', 'insurance', 'assigned_bcba', 'authorization_status']
        const beforeVals = {}
        const afterVals  = {}
        criticalFields.forEach(f => {
          if (changedFields.includes(f)) {
            beforeVals[f] = before?.[f] ?? null
            afterVals[f]  = res.data[f]  ?? null
          }
        })
        const name = formatReferralName(res.data)
        await writeReferralActivity({
          action: getReferralUpdateAction(changedFields),
          record: res.data,
          description: describeReferralUpdate(name, changedFields, res.data),
          details_json: {
            changed_fields: changedFields,
            ...(Object.keys(beforeVals).length ? { before: beforeVals, after: afterVals } : {}),
          },
        })
      }
    }

    return res
  }

  const handleUpdateAssessment = async (id, patch) => {
    const before = assessData.find(r => String(getAssessmentRecordId(r) || '') === String(id))
    const res = await saveAssessEdit(id, patch)

    if (res?.success && res?.data) {
      const changedFields = Object.keys(patch || {})
      const criticalFields = ['authorization_status', 'assessment_status', 'treatment_plan_status', 'parent_interview_status', 'ready_for_services', 'assigned_bcba']
      const beforeVals = {}
      const afterVals  = {}
      criticalFields.forEach(f => {
        if (changedFields.includes(f)) {
          beforeVals[f] = before?.[f] ?? null
          afterVals[f]  = res.data[f] ?? null
        }
      })
      const assessName = formatAssessmentName(res.data)
      await writeAssessmentActivity({
        action: getAssessmentUpdateAction(changedFields),
        record: res.data,
        description: describeAssessmentUpdate(assessName, changedFields, res.data),
        details_json: {
          changed_fields: changedFields,
          ...(Object.keys(beforeVals).length ? { before: beforeVals, after: afterVals } : {}),
        },
      })
    }

    return res
  }

  const handleSetReferralStatus = async (id, status) => {
    const before = refs.find(r => r.id === id)
    const res = await setStatus(id, status)

    if (res?.success && res?.data) {
      await writeReferralActivity({
        action: 'referral_status_changed',
        record: res.data,
        description: `${formatReferralName(res.data)} status changed to ${status}.`,
        details_json: {
          changed_fields: ['status'],
          before: { status: before?.status ?? null },
          after:  { status },
        },
      })
    }

    return res
  }

  const handleToggleParentInterview = async (id, val) => {
    const res = await toggleParentInterview(id, val)

    if (res?.success && res?.data) {
      await writeReferralActivity({
        action: val ? 'parent_interview_ready_enabled' : 'parent_interview_ready_disabled',
        record: res.data,
        description: val
          ? `${formatReferralName(res.data)} was marked ready for parent interview.`
          : `${formatReferralName(res.data)} was unmarked from ready for parent interview.`,
        details_json: { ready_for_parent_interview: val === true },
      })
    }

    return res
  }

  const handleOpenProfile = async (id) => {
    setProfileId(id)
    setSubpageAndClearFilter('profile')
    const record = refs.find(r => r.id === id)
    if (record) {
      await writeReferralActivity({
        action: 'client_profile_viewed',
        record,
        description: `${formatReferralName(record)} client profile was viewed.`,
        details_json: {},
      })
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoginPending(true)
    setLoginError(null)
    setResetSuccess(null)

    const { data: loginData, error: signInError } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    })

    if (signInError) {
      setLoginError(signInError.message)
    } else if (loginData?.user) {
      await safeCreateActivityLog({
        user_id:    loginData.user.id,
        user_email: loginData.user.email || null,
        user_role:  null,
        action:     'user_signed_in',
        description: 'User signed in.',
        details_json: {},
      })
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

  const handleSignOut = async (reason = 'manual') => {
    setSignOutPending(true)
    setLoginError(null)

    if (session?.user?.id) {
      await safeCreateActivityLog({
        user_id:     session.user.id,
        user_email:  session.user.email || null,
        user_role:   profile?.role      || null,
        action:      reason === 'idle' ? 'session_timeout' : 'user_signed_out',
        description: reason === 'idle' ? 'Session ended due to inactivity.' : 'User signed out.',
        details_json: { reason },
      })
    }

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
    onTimeout: () => handleSignOut('idle'),
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
      <div style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '32px',
        background: 'var(--bg)',
        position: 'relative',
        overflow: 'hidden',
      }}>

        {/* Subtle branded background glow — works in both light + dark */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 70% 55% at 50% 0%, color-mix(in srgb, var(--accent) 12%, transparent), transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, position: 'relative', zIndex: 1 }}>
          {/* Logo + portal name above the card */}
          <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 72, height: 72, borderRadius: 18,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden',
            }}>
              <img src="/bsom-logo.jpg" alt="BSOM" style={{ width: 60, height: 60, objectFit: 'contain' }} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)', marginBottom: 4 }}>
                Behavioral Solutions of Mississippi
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>
                BSOM Intake Portal
              </div>
            </div>
          </div>

          {/* Card */}
          <div style={{
            width: '100%', maxWidth: 420,
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 24,
            boxShadow: '0 4px 40px rgba(0,0,0,0.15)',
            padding: 28,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--accent)' }}>
                  Secure Access
                </div>
                <h1 style={{ margin: '8px 0 0', fontSize: 26, lineHeight: 1.1 }}>
                  {recoveryMode ? 'Reset password' : 'Staff Sign In'}
                </h1>
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
                <div className="error-bar" style={{ margin: 0 }}>{loginError}</div>
              )}

              {resetSuccess && (
                <div style={{ margin: 0, borderRadius: 12, border: '1px solid #16a34a33', background: '#16a34a12', color: '#16a34a', padding: '12px 14px', fontSize: 13, fontWeight: 600 }}>
                  {resetSuccess}
                </div>
              )}

              <button
                type="submit"
                disabled={recoveryMode ? resetPending : loginPending}
                style={{
                  border: 'none', borderRadius: 12, padding: '13px 16px',
                  background: 'var(--accent)', color: '#fff', fontWeight: 800,
                  fontSize: 14, cursor: (recoveryMode ? resetPending : loginPending) ? 'wait' : 'pointer',
                  opacity: (recoveryMode ? resetPending : loginPending) ? 0.75 : 1,
                  marginTop: 2,
                }}
              >
                {recoveryMode
                  ? (resetPending ? 'Updating password...' : 'Reset Password')
                  : (loginPending ? 'Signing in...' : 'Sign In')}
              </button>
            </form>
          </div>

          {/* Footer tagline below card */}
          <div style={{ marginTop: 20, fontSize: 11, color: 'var(--dim)', textAlign: 'center' }}>
            Internal staff portal &nbsp;·&nbsp; Authorized access only
          </div>
        </div>
      </div>
    )
  }

  if (screen === 'home') {
    return (
      <>
        <HomePage
          onEnterModule={enterModule}
          onAddReferral={() => openModulePage('intake', 'new')}
          onScheduleParentInterview={() => openModulePage('assessment', 'interviews')}
          onEnterSubpage={openModulePage}
          theme={theme}
          setTheme={setTheme}
          displayName={displayName}
          activeCount={active.length}
          pendingDocsCount={pending.length}
          readyForInterviewCount={readyForInterview.length}
          assessmentsCount={assessData.length}
          statsLoading={loading}
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
        {saved && <div className="toast">Referral saved.</div>}
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
      if (subpage === 'activity') {
        return <ActivityLogPage activityRefreshKey={activityRefreshKey} />
      }

      return (
        <DashboardPage
          refs={refs}
          setSelectedId={setSelId}
          openModulePage={openModulePage}
          activityRefreshKey={activityRefreshKey}
        />
      )
    }

    if (module === 'intake') {
      if (subpage === 'intakedash') return <IntakeDashboard refs={refs} onSelectRef={setSelId} openModulePage={openModulePage} />
      if (subpage === 'all') return <AllReferralsPage refs={refs} onSelectRef={setSelId} onOpenProfile={handleOpenProfile} statFilter={routeFilter} onClearStatFilter={() => setRouteFilter(null)} />
      if (subpage === 'profile') return <ClientProfilePage referralId={profileId} onBack={() => setSubpageAndClearFilter('all')} />
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
      if (subpage === 'bcba') return <BCBAAssignmentsPage assessData={assessData} assessLoading={assessLoading} onSelectAssess={handleSelectAssessment} statFilter={routeFilter} onSetStatFilter={setRouteFilter} onClearStatFilter={() => setRouteFilter(null)} bcbaStaff={bcbaStaff} bcbaStaffLoading={bcbaStaffLoading} bcbaStaffError={bcbaStaffError} setBcbaStaffError={setBcbaStaffError} createBcbaStaff={createBcbaStaff} updateBcbaStaff={updateBcbaStaff} deactivateBcbaStaff={deactivateBcbaStaff} userRole={profile?.role} />
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
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Page not found</div>
      </div>
    )
  }

  return (
    <>
      {saved && <div className="toast">Referral saved.</div>}

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
              {m?.name}{currentNavLabel ? ` - ${currentNavLabel}` : ''}
            </div>
            <div className="topbar-right">
              <div className="topbar-profile">
                <div className="topbar-profile-text">
                  <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--muted)' }}>
                    {profileLoading ? 'Loading profile' : `${displayRole} - ${displayOffice}`}
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
                </div>
              </div>
              <span className="badge-pill">{active.length} Active</span>
              {pending.length > 0 && (
                <span style={{ background: '#f59e0b18', color: '#f59e0b', border: '1px solid #f59e0b30', borderRadius: 20, padding: '3px 12px', fontSize: '11.5px', fontWeight: 700 }}>
                  {pending.length} Pending Docs
                </span>
              )}
              <button
                className="btn-sm"
                onClick={() => {
                  load()
                  if (module === 'assessment' || module === 'operations') {
                    loadAssessments()
                    loadBcbaStaff({ includeInactive: true })
                  }
                }}
              >
                Refresh
              </button>
            </div>
          </div>

          <div className="page">
            {error && (
              <div className="error-bar">
                {error}
                <button className="x-btn" onClick={() => setError(null)}>Close</button>
              </div>
            )}
            <div className={`page-inner ${module === 'intake' && subpage === 'all' ? 'page-inner-wide' : ''}`}>
              {renderPage()}
            </div>
          </div>

          <footer className="footer-shell">
            <div className="footer-side">
              <ThemeToggle theme={theme} setTheme={setTheme} />
            </div>
            <div className="footer-side footer-side-center">
            <span style={{ fontSize: 11, color: 'var(--dim)' }}>
              © 2026 Behavioral Solutions of Mississippi &nbsp;•&nbsp; Intake Operations Portal developed by Zanteria Wells
            </span>
            </div>
            <div className="footer-side footer-side-right">
              <button className="btn-sm" onClick={handleSignOut} disabled={signOutPending}>
                {signOutPending ? 'Signing out...' : 'Sign Out'}
              </button>
            </div>
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
          onSetStatus={async (id, status) => {
            const res = await handleSetReferralStatus(id, status)
            if (res?.success) setSelId(null)
            return res
          }}
          onToggleParentInterview={handleToggleParentInterview}
        />
      )}

      {selectedAssess && (
        <AssessmentDetailModal
          assessment={selectedAssess}
          onClose={() => setSelAssessId(null)}
          onSave={handleUpdateAssessment}
          onDelete={(id) => deleteRecord('assessment', id)}
          bcbaStaff={activeBcbaStaff}
        />
      )}

      {idleWarningModal}
    </>
  )
}
