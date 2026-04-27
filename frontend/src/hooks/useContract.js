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
      const c    = await getSignerContract()
      const lat6 = BigInt(Math.round(lat * 1e6))
      const lng6 = BigInt(Math.round(lng * 1e6))
      const tx   = await c.registerFacility(
        orgName, facilityName, industryType, lat6, lng6,
        BigInt(baselineEmissions), BigInt(reductionTarget)
      )
      setTxHash(tx.hash)
      await tx.wait()

      // Get the real on-chain facility ID — facilityCount after registration
      const chainId = Number(await c.facilityCount())

      if (supabase) {
        const provider = new ethers.BrowserProvider(window.ethereum)
        const wallet   = await (await provider.getSigner()).getAddress()
        const { error } = await supabase.rpc('insert_facility', {
          p_chain_id: chainId,
          p_org:      orgName,
          p_name:     facilityName,
          p_industry: industryType,
          p_lat:      lat,
          p_lng:      lng,
          p_baseline: baselineEmissions,
          p_target:   reductionTarget,
          p_wallet:   wallet,
        })
        if (error) console.warn('Supabase insert failed:', error)
      }
      return { txHash: tx.hash, chainId }
    } finally {
      setPending(false)
    }
  }

  async function reportEmissions({ facilityId, co2Tonnes, period, baselineEmissions, reductionTarget }) {
    setPending(true); setTxHash(null)
    try {
      const c   = await getSignerContract()
      const tx  = await c.reportEmissions(BigInt(facilityId), BigInt(co2Tonnes), period)
      setTxHash(tx.hash)
      await tx.wait()
      if (supabase) {
        // Find the Supabase facility row that matches this chain ID
        const { data } = await supabase
          .from('facilities')
          .select('id')
          .eq('chain_facility_id', facilityId)
          .single()
        if (data) {
          const target      = Math.round((baselineEmissions || 0) * (1 - (reductionTarget || 20) / 100))
          const meetsTarget = co2Tonnes <= target
          const isReduction = co2Tonnes < (baselineEmissions || 0)
          const pctChange   = baselineEmissions
            ? Math.abs(((co2Tonnes - baselineEmissions) / baselineEmissions) * 100).toFixed(2)
            : 0
          await supabase.from('emission_reports').insert({
            facility_id:    data.id,
            co2_tonnes:     co2Tonnes,
            period,
            meets_target:   meetsTarget,
            is_reduction:   isReduction,
            percent_change: pctChange,
            tx_hash:        tx.hash,
          })
        }
      }
      return { txHash: tx.hash }
    } finally {
      setPending(false)
    }
  }

  return { pending, txHash, registerFacility, reportEmissions }
}
