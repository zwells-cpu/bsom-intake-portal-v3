const ROLE_LABELS = {
  admin: 'Admin',
  intake: 'Intake',
}

const OFFICE_LABELS = {
  all: 'ALL',
  meridian: 'Meridian',
  forest: 'Forest',
  flowood: 'Flowood',
}

export function normalizeRole(role) {
  const normalized = String(role || '').trim().toLowerCase()
  return normalized === 'admin' || normalized === 'intake' ? normalized : 'intake'
}

export function normalizeOffice(office) {
  const normalized = String(office || '').trim().toLowerCase()
  return OFFICE_LABELS[normalized] || 'ALL'
}

export function normalizeProfile(profile) {
  if (!profile) return null
  return {
    ...profile,
    role: normalizeRole(profile.role),
    office: normalizeOffice(profile.office),
    is_active: profile.is_active !== false,
  }
}

export function isAdmin(profileOrRole) {
  const role = typeof profileOrRole === 'string' ? profileOrRole : profileOrRole?.role
  return normalizeRole(role) === 'admin'
}

export function isIntake(profileOrRole) {
  const role = typeof profileOrRole === 'string' ? profileOrRole : profileOrRole?.role
  return normalizeRole(role) === 'intake'
}

export function formatRoleLabel(role) {
  return ROLE_LABELS[normalizeRole(role)]
}

export function formatOfficeLabel(office) {
  const normalized = normalizeOffice(office)
  return normalized === 'ALL' ? 'All' : normalized
}

export function formatProfileAccessLabel(profile) {
  return `${formatRoleLabel(profile?.role)} · ${formatOfficeLabel(profile?.office)}`
}
