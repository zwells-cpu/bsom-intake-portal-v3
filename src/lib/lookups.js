import { API_BASE } from './api'

export function cleanLookupValue(value) {
  return String(value || '').trim().replace(/\s+/g, ' ')
}

export function normalizeLookupValue(value) {
  return cleanLookupValue(value).toLowerCase()
}

function getSortOrder(record) {
  const value = record?.sort_order
  return Number.isFinite(Number(value)) ? Number(value) : Number.MAX_SAFE_INTEGER
}

export function normalizeOptions(list, key = 'name') {
  if (!Array.isArray(list)) return []

  return list
    .map((item) => {
      if (typeof item === 'string') {
        const label = cleanLookupValue(item)
        return label ? { id: label, label, value: label, raw: item } : null
      }

      const label = cleanLookupValue(item?.[key])
      if (!label) return null

      return {
        id: item?.id ?? label,
        label,
        value: label,
        raw: item,
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      const sortA = getSortOrder(a.raw)
      const sortB = getSortOrder(b.raw)
      if (sortA !== sortB) return sortA - sortB
      return a.label.localeCompare(b.label)
    })
}

export function optionValues(options) {
  return (options || []).map(option => cleanLookupValue(option?.value ?? option?.label ?? option)).filter(Boolean)
}

export function includeCurrentOption(options, currentValue) {
  const current = cleanLookupValue(currentValue)
  if (!current) return options
  return options.some(option => option.toLowerCase() === current.toLowerCase()) ? options : [current, ...options]
}

async function fetchLookup(path, key = 'name') {
  try {
    const res = await fetch(`${API_BASE}${path}`)
    if (!res.ok) return []
    const data = await res.json()
    return normalizeOptions(Array.isArray(data) ? data : [], key)
  } catch {
    return []
  }
}

export function getBcbaStaff() {
  return fetchLookup('/bcba-staff', 'full_name')
}

export function getOffices() {
  return fetchLookup('/offices', 'name')
}

export function getInsurancePayers() {
  return fetchLookup('/insurance-payers', 'name')
}

export function getReferralSources() {
  return fetchLookup('/referral-sources', 'name')
}
