import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { FACILITIES, getFacilityStatus } from '../data/seed'

// Match Supabase facility to seed entry to get lat/lng and risk data
function getSeedMatch(f) {
  return FACILITIES.find(
    (s) => s.facilityName === f.facility_name || s.id === f.id
  )
}

export function useFacilities() {
  const [facilities, setFacilities] = useState(FACILITIES)
  const [loading, setLoading]       = useState(false)

  useEffect(() => {
    if (!supabase) return
    setLoading(true)
    Promise.all([
      supabase.from('facilities').select('*').eq('active', true),
      supabase.from('emission_reports').select('*').order('reported_at', { ascending: true }),
    ]).then(([{ data: facs, error: fe }, { data: reports, error: re }]) => {
      if (fe || re || !facs || facs.length === 0) {
        console.warn('Supabase returned empty or errored, using seed data', fe || re)
        return
      }
      const repMap = {}
      ;(reports || []).forEach((r) => {
        if (!repMap[r.facility_id]) repMap[r.facility_id] = []
        repMap[r.facility_id].push({
          period: r.period, co2Tonnes: r.co2_tonnes,
          meetsTarget: r.meets_target, percentChange: r.percent_change,
          isReduction: r.is_reduction, txHash: r.tx_hash,
        })
      })
      setFacilities(
        facs.map((f) => {
          const seed = getSeedMatch(f)
          return {
            id: f.id, chainId: f.chain_facility_id,
            orgName: f.org_name, facilityName: f.facility_name,
            industryType: f.industry_type, orgWallet: f.org_wallet,
            // Use seed lat/lng — PostGIS geography can't be parsed directly
            lat: seed?.lat ?? 39.5,
            lng: seed?.lng ?? -98.35,
            baselineEmissions: f.baseline_emissions,
            reductionTarget: f.reduction_target,
            stateCode: f.state_code, county: f.county,
            reports: repMap[f.id] || [],
            risk: seed?.risk ?? { flood:{rating:'Unknown',nri:0}, wildfire:{rating:'Unknown',nri:0}, hurricane:{rating:'Unknown',nri:0}, overall:'MEDIUM' },
          }
        })
      )
    }).finally(() => setLoading(false))
  }, [])

  const withStatus = facilities.map((f) => ({ ...f, status: getFacilityStatus(f) }))
  return { facilities: withStatus, loading }
}
