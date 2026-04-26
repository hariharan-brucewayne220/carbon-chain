import { useState } from 'react'
import { ethers } from 'ethers'
import { getContract } from '../lib/contract'
import { supabase } from '../lib/supabase'

export function useContract() {
  const [pending, setPending] = useState(false)
  const [txHash, setTxHash]   = useState(null)

  async function getSignerContract() {
    if (!window.ethereum) throw new Error('MetaMask not found')
    const provider = new ethers.BrowserProvider(window.ethereum)
    const signer   = await provider.getSigner()
    const contract = getContract(signer)
    if (!contract) throw new Error('Contract address not configured')
    return contract
  }

  async function registerFacility({ orgName, facilityName, industryType, lat, lng, baselineEmissions, reductionTarget }) {
    setPending(true); setTxHash(null)
    try {
      const c   = await getSignerContract()
      const lat6 = BigInt(Math.round(lat * 1e6))
      const lng6 = BigInt(Math.round(lng * 1e6))
      const tx   = await c.registerFacility(
        orgName, facilityName, industryType, lat6, lng6,
        BigInt(baselineEmissions), BigInt(reductionTarget)
      )
      setTxHash(tx.hash)
      const receipt = await tx.wait()
      // dual-write to Supabase
      if (supabase) {
        const event = receipt.logs.find((l) => l.fragment?.name === 'FacilityRegistered')
        await supabase.from('facilities').insert({
          chain_facility_id: Number(event?.args?.facilityId || 0),
          org_name: orgName, facility_name: facilityName, industry_type: industryType,
          location: `POINT(${lng} ${lat})`,
          baseline_emissions: baselineEmissions, reduction_target: reductionTarget,
        })
      }
      return { txHash: tx.hash, receipt }
    } finally {
      setPending(false)
    }
  }

  async function reportEmissions({ facilityId, co2Tonnes, period }) {
    setPending(true); setTxHash(null)
    try {
      const c   = await getSignerContract()
      const tx  = await c.reportEmissions(BigInt(facilityId), BigInt(co2Tonnes), period)
      setTxHash(tx.hash)
      const receipt = await tx.wait()
      if (supabase) {
        await supabase.from('emission_reports').insert({
          facility_id: facilityId, co2_tonnes: co2Tonnes, period,
          meets_target: false, tx_hash: tx.hash,
        })
      }
      return { txHash: tx.hash, receipt }
    } finally {
      setPending(false)
    }
  }

  return { pending, txHash, registerFacility, reportEmissions }
}
