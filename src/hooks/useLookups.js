import { useEffect, useState } from 'react'
import { getBcbaStaff, getInsurancePayers, getOffices, getReferralSources } from '../lib/lookups'

export function useLookups() {
  const [loading, setLoading] = useState(false)
  const [lookups, setLookups] = useState({
    bcbaOptions: [],
    officeOptions: [],
    insuranceOptions: [],
    referralSourceOptions: [],
  })

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      const [bcbaOptions, officeOptions, insuranceOptions, referralSourceOptions] = await Promise.all([
        getBcbaStaff(),
        getOffices(),
        getInsurancePayers(),
        getReferralSources(),
      ])

      if (!cancelled) {
        setLookups({ bcbaOptions, officeOptions, insuranceOptions, referralSourceOptions })
        setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return { loading, ...lookups }
}
