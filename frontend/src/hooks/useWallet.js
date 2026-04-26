// Direct ethers.js MetaMask hook — no wagmi needed
import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { SEPOLIA_CHAIN_ID } from '../lib/constants'

function shortAddr(addr) {
  return addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : null
}

export function useWallet() {
  const [address, setAddress]  = useState(null)
  const [chainId, setChainId]  = useState(null)
  const [mounted, setMounted]  = useState(false)

  useEffect(() => {
    setMounted(true)
    if (!window.ethereum) return

    window.ethereum.request({ method: 'eth_accounts' }).then((accs) => {
      if (accs.length) { setAddress(accs[0]) }
    })
    window.ethereum.request({ method: 'eth_chainId' }).then((id) => {
      setChainId(parseInt(id, 16))
    })

    const onAccounts = (accs) => setAddress(accs[0] || null)
    const onChain    = (id) => setChainId(parseInt(id, 16))
    window.ethereum.on('accountsChanged', onAccounts)
    window.ethereum.on('chainChanged', onChain)
    return () => {
      window.ethereum.removeListener('accountsChanged', onAccounts)
      window.ethereum.removeListener('chainChanged', onChain)
    }
  }, [])

  const connect = useCallback(async () => {
    if (!window.ethereum) {
      alert('MetaMask not detected. Please install MetaMask.')
      return
    }
    const accs = await window.ethereum.request({ method: 'eth_requestAccounts' })
    const id   = await window.ethereum.request({ method: 'eth_chainId' })
    setAddress(accs[0] || null)
    setChainId(parseInt(id, 16))
  }, [])

  const disconnect = useCallback(() => setAddress(null), [])

  const isConnected  = mounted && !!address
  const wrongNetwork = isConnected && chainId !== SEPOLIA_CHAIN_ID

  return {
    address,
    isConnected,
    wrongNetwork,
    shortAddress: shortAddr(address),
    connect,
    disconnect,
  }
}
