export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || ''
export const ETHERSCAN_BASE   = 'https://sepolia.etherscan.io'
export const SEPOLIA_CHAIN_ID = 11155111

export const STATUS_META = {
  compliant:   { fg: '#10b981', label: 'Compliant',     bg: 'rgba(16,185,129,0.15)' },
  improving:   { fg: '#f59e0b', label: 'Improving',     bg: 'rgba(245,158,11,0.15)' },
  violation:   { fg: '#ef4444', label: 'Non-Compliant', bg: 'rgba(239,68,68,0.15)'  },
  nodata:      { fg: '#64748b', label: 'No Data',       bg: 'rgba(100,116,139,0.15)'},
}

export const RISK_META = {
  flood:     { label: 'Flood',     bg: '#1e40af', accent: '#60a5fa', icon: '🌊' },
  wildfire:  { label: 'Wildfire',  bg: '#b45309', accent: '#f59e0b', icon: '🔥' },
  hurricane: { label: 'Hurricane', bg: '#7c2d12', accent: '#ea580c', icon: '🌀' },
}

export const INDUSTRIES = [
  'Power Plants', 'Petroleum Refining', 'Chemicals', 'Metals',
  'Minerals', 'Pulp and Paper', 'Waste', 'Electrical Equipment', 'Other',
]

export const PERIODS = ['2021', '2022', '2023', '2024']
