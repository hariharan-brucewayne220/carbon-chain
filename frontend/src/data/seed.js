// Fallback seed data — mirrors supabase/seed_facilities.sql
export const FACILITIES = [
  {
    id: 1, chainId: null,
    orgName: 'SunVolt Energy', facilityName: 'Nevada Solar Farm',
    industryType: 'Power Plants', lat: 36.1699, lng: -115.1398,
    baselineEmissions: 500, reductionTarget: 20,
    stateCode: '32', county: 'Clark', orgWallet: null,
    reports: [
      { period: '2021', co2Tonnes: 470, meetsTarget: false, percentChange: 6,  isReduction: true  },
      { period: '2022', co2Tonnes: 420, meetsTarget: false, percentChange: 16, isReduction: true  },
      { period: '2023', co2Tonnes: 380, meetsTarget: true,  percentChange: 24, isReduction: true  },
    ],
    risk: { flood: { rating: 'Relatively Low', nri: 12 }, wildfire: { rating: 'Relatively High', nri: 68 }, hurricane: { rating: 'Very Low', nri: 2 }, overall: 'MEDIUM' },
  },
  {
    id: 2, chainId: null,
    orgName: 'SunVolt Energy', facilityName: 'Arizona Processing Plant',
    industryType: 'Petroleum Refining', lat: 33.4484, lng: -112.074,
    baselineEmissions: 800, reductionTarget: 20,
    stateCode: '04', county: 'Maricopa', orgWallet: null,
    reports: [
      { period: '2021', co2Tonnes: 820, meetsTarget: false, percentChange: 3,  isReduction: false },
      { period: '2022', co2Tonnes: 850, meetsTarget: false, percentChange: 6,  isReduction: false },
      { period: '2023', co2Tonnes: 900, meetsTarget: false, percentChange: 13, isReduction: false },
    ],
    risk: { flood: { rating: 'Very Low', nri: 4 }, wildfire: { rating: 'Relatively High', nri: 62 }, hurricane: { rating: 'Very Low', nri: 1 }, overall: 'HIGH' },
  },
  {
    id: 3, chainId: null,
    orgName: 'WindStream Corp', facilityName: 'Texas Wind Farm',
    industryType: 'Power Plants', lat: 31.9686, lng: -99.9018,
    baselineEmissions: 300, reductionTarget: 20,
    stateCode: '48', county: 'Coleman', orgWallet: null,
    reports: [
      { period: '2021', co2Tonnes: 280, meetsTarget: false, percentChange: 7,  isReduction: true  },
      { period: '2022', co2Tonnes: 260, meetsTarget: false, percentChange: 13, isReduction: true  },
      { period: '2023', co2Tonnes: 220, meetsTarget: true,  percentChange: 27, isReduction: true  },
    ],
    risk: { flood: { rating: 'Relatively Moderate', nri: 34 }, wildfire: { rating: 'Relatively Moderate', nri: 42 }, hurricane: { rating: 'Relatively High', nri: 58 }, overall: 'MEDIUM' },
  },
  {
    id: 4, chainId: null,
    orgName: 'WindStream Corp', facilityName: 'Oklahoma Turbine Facility',
    industryType: 'Power Plants', lat: 35.4676, lng: -97.5164,
    baselineEmissions: 450, reductionTarget: 20,
    stateCode: '40', county: 'Oklahoma', orgWallet: null,
    reports: [
      { period: '2021', co2Tonnes: 460, meetsTarget: false, percentChange: 2,  isReduction: false },
      { period: '2022', co2Tonnes: 470, meetsTarget: false, percentChange: 4,  isReduction: false },
      { period: '2023', co2Tonnes: 480, meetsTarget: false, percentChange: 7,  isReduction: false },
    ],
    risk: { flood: { rating: 'Relatively Moderate', nri: 38 }, wildfire: { rating: 'Relatively Low', nri: 18 }, hurricane: { rating: 'Relatively Moderate', nri: 41 }, overall: 'MEDIUM' },
  },
  {
    id: 5, chainId: null,
    orgName: 'GreenGrid Industries', facilityName: 'California Battery Storage',
    industryType: 'Electrical Equipment', lat: 34.0522, lng: -118.2437,
    baselineEmissions: 600, reductionTarget: 20,
    stateCode: '06', county: 'Los Angeles', orgWallet: null,
    reports: [
      { period: '2021', co2Tonnes: 570, meetsTarget: false, percentChange: 5,  isReduction: true  },
      { period: '2022', co2Tonnes: 520, meetsTarget: false, percentChange: 13, isReduction: true  },
      { period: '2023', co2Tonnes: 460, meetsTarget: true,  percentChange: 23, isReduction: true  },
    ],
    risk: { flood: { rating: 'Relatively Low', nri: 22 }, wildfire: { rating: 'Very High', nri: 88 }, hurricane: { rating: 'Very Low', nri: 3 }, overall: 'HIGH' },
  },
  {
    id: 6, chainId: null,
    orgName: 'GreenGrid Industries', facilityName: 'Oregon Hydropower Station',
    industryType: 'Power Plants', lat: 45.5152, lng: -122.6784,
    baselineEmissions: 200, reductionTarget: 20,
    stateCode: '41', county: 'Multnomah', orgWallet: null,
    reports: [
      { period: '2021', co2Tonnes: 190, meetsTarget: false, percentChange: 5,  isReduction: true  },
      { period: '2022', co2Tonnes: 175, meetsTarget: false, percentChange: 13, isReduction: true  },
      { period: '2023', co2Tonnes: 150, meetsTarget: true,  percentChange: 25, isReduction: true  },
    ],
    risk: { flood: { rating: 'Relatively High', nri: 61 }, wildfire: { rating: 'Relatively Moderate', nri: 44 }, hurricane: { rating: 'Very Low', nri: 2 }, overall: 'MEDIUM' },
  },
  {
    id: 7, chainId: null,
    orgName: 'EcoForge LLC', facilityName: 'New York Data Center',
    industryType: 'Other', lat: 40.7128, lng: -74.006,
    baselineEmissions: 1200, reductionTarget: 20,
    stateCode: '36', county: 'New York', orgWallet: null,
    reports: [
      { period: '2021', co2Tonnes: 1300, meetsTarget: false, percentChange: 8,  isReduction: false },
      { period: '2022', co2Tonnes: 1350, meetsTarget: false, percentChange: 13, isReduction: false },
      { period: '2023', co2Tonnes: 1400, meetsTarget: false, percentChange: 17, isReduction: false },
    ],
    risk: { flood: { rating: 'Very High', nri: 82 }, wildfire: { rating: 'Very Low', nri: 5 }, hurricane: { rating: 'Relatively High', nri: 64 }, overall: 'HIGH' },
  },
  {
    id: 8, chainId: null,
    orgName: 'EcoForge LLC', facilityName: 'New Jersey Manufacturing',
    industryType: 'Chemicals', lat: 40.0583, lng: -74.4057,
    baselineEmissions: 900, reductionTarget: 20,
    stateCode: '34', county: 'Burlington', orgWallet: null,
    reports: [
      { period: '2021', co2Tonnes: 880, meetsTarget: false, percentChange: 2,  isReduction: true  },
      { period: '2022', co2Tonnes: 840, meetsTarget: false, percentChange: 7,  isReduction: true  },
      { period: '2023', co2Tonnes: 700, meetsTarget: true,  percentChange: 22, isReduction: true  },
    ],
    risk: { flood: { rating: 'Relatively High', nri: 59 }, wildfire: { rating: 'Very Low', nri: 6 }, hurricane: { rating: 'Relatively High', nri: 57 }, overall: 'MEDIUM' },
  },
  {
    id: 9, chainId: null,
    orgName: 'CleanArc Energy', facilityName: 'Florida Solar Array',
    industryType: 'Power Plants', lat: 25.7617, lng: -80.1918,
    baselineEmissions: 350, reductionTarget: 20,
    stateCode: '12', county: 'Miami-Dade', orgWallet: null,
    reports: [
      { period: '2021', co2Tonnes: 340, meetsTarget: false, percentChange: 3,  isReduction: true  },
      { period: '2022', co2Tonnes: 310, meetsTarget: false, percentChange: 11, isReduction: true  },
      { period: '2023', co2Tonnes: 270, meetsTarget: true,  percentChange: 23, isReduction: true  },
    ],
    risk: { flood: { rating: 'Very High', nri: 91 }, wildfire: { rating: 'Relatively Low', nri: 21 }, hurricane: { rating: 'Very High', nri: 95 }, overall: 'HIGH' },
  },
  {
    id: 10, chainId: null,
    orgName: 'CleanArc Energy', facilityName: 'Georgia Biomass Plant',
    industryType: 'Pulp and Paper', lat: 33.749, lng: -84.388,
    baselineEmissions: 700, reductionTarget: 20,
    stateCode: '13', county: 'Fulton', orgWallet: null,
    reports: [
      { period: '2021', co2Tonnes: 720, meetsTarget: false, percentChange: 3,  isReduction: false },
      { period: '2022', co2Tonnes: 750, meetsTarget: false, percentChange: 7,  isReduction: false },
      { period: '2023', co2Tonnes: 780, meetsTarget: false, percentChange: 11, isReduction: false },
    ],
    risk: { flood: { rating: 'Relatively Moderate', nri: 36 }, wildfire: { rating: 'Relatively Low', nri: 17 }, hurricane: { rating: 'Relatively Moderate', nri: 39 }, overall: 'MEDIUM' },
  },
  {
    id: 11, chainId: null,
    orgName: 'NorthStar Renewables', facilityName: 'Michigan Wind Farm',
    industryType: 'Power Plants', lat: 42.3314, lng: -83.0458,
    baselineEmissions: 400, reductionTarget: 20,
    stateCode: '26', county: 'Wayne', orgWallet: null,
    reports: [
      { period: '2021', co2Tonnes: 390, meetsTarget: false, percentChange: 3,  isReduction: true  },
      { period: '2022', co2Tonnes: 360, meetsTarget: false, percentChange: 10, isReduction: true  },
      { period: '2023', co2Tonnes: 310, meetsTarget: true,  percentChange: 23, isReduction: true  },
    ],
    risk: { flood: { rating: 'Relatively Moderate', nri: 31 }, wildfire: { rating: 'Very Low', nri: 8 }, hurricane: { rating: 'Very Low', nri: 4 }, overall: 'LOW' },
  },
  {
    id: 12, chainId: null,
    orgName: 'NorthStar Renewables', facilityName: 'Minnesota Solar Park',
    industryType: 'Power Plants', lat: 44.9778, lng: -93.265,
    baselineEmissions: 280, reductionTarget: 20,
    stateCode: '27', county: 'Hennepin', orgWallet: null,
    reports: [
      { period: '2021', co2Tonnes: 275, meetsTarget: false, percentChange: 2,  isReduction: true  },
      { period: '2022', co2Tonnes: 260, meetsTarget: false, percentChange: 7,  isReduction: true  },
      { period: '2023', co2Tonnes: 220, meetsTarget: true,  percentChange: 21, isReduction: true  },
    ],
    risk: { flood: { rating: 'Relatively Moderate', nri: 28 }, wildfire: { rating: 'Very Low', nri: 6 }, hurricane: { rating: 'Very Low', nri: 1 }, overall: 'LOW' },
  },
  {
    id: 13, chainId: null,
    orgName: 'TerraVerde Solutions', facilityName: 'Colorado EV Battery Factory',
    industryType: 'Metals', lat: 39.7392, lng: -104.9903,
    baselineEmissions: 950, reductionTarget: 20,
    stateCode: '08', county: 'Denver', orgWallet: null,
    reports: [
      { period: '2021', co2Tonnes: 930, meetsTarget: false, percentChange: 2,  isReduction: true  },
      { period: '2022', co2Tonnes: 880, meetsTarget: false, percentChange: 7,  isReduction: true  },
      { period: '2023', co2Tonnes: 750, meetsTarget: true,  percentChange: 21, isReduction: true  },
    ],
    risk: { flood: { rating: 'Relatively Low', nri: 19 }, wildfire: { rating: 'Relatively High', nri: 66 }, hurricane: { rating: 'Very Low', nri: 1 }, overall: 'MEDIUM' },
  },
  {
    id: 14, chainId: null,
    orgName: 'TerraVerde Solutions', facilityName: 'Utah Lithium Processing',
    industryType: 'Minerals', lat: 40.7608, lng: -111.891,
    baselineEmissions: 1100, reductionTarget: 20,
    stateCode: '49', county: 'Salt Lake', orgWallet: null,
    reports: [
      { period: '2021', co2Tonnes: 1120, meetsTarget: false, percentChange: 2,  isReduction: false },
      { period: '2022', co2Tonnes: 1150, meetsTarget: false, percentChange: 5,  isReduction: false },
      { period: '2023', co2Tonnes: 1180, meetsTarget: false, percentChange: 7,  isReduction: false },
    ],
    risk: { flood: { rating: 'Relatively Low', nri: 14 }, wildfire: { rating: 'Relatively Moderate', nri: 44 }, hurricane: { rating: 'Very Low', nri: 1 }, overall: 'MEDIUM' },
  },
  {
    id: 15, chainId: null,
    orgName: 'PacificClean Energy', facilityName: 'Washington Hydro Station',
    industryType: 'Power Plants', lat: 47.6062, lng: -122.3321,
    baselineEmissions: 150, reductionTarget: 20,
    stateCode: '53', county: 'King', orgWallet: null,
    reports: [
      { period: '2021', co2Tonnes: 140, meetsTarget: false, percentChange: 7,  isReduction: true  },
      { period: '2022', co2Tonnes: 125, meetsTarget: false, percentChange: 17, isReduction: true  },
      { period: '2023', co2Tonnes: 105, meetsTarget: true,  percentChange: 30, isReduction: true  },
    ],
    risk: { flood: { rating: 'Relatively High', nri: 55 }, wildfire: { rating: 'Relatively Moderate', nri: 38 }, hurricane: { rating: 'Very Low', nri: 2 }, overall: 'MEDIUM' },
  },
]

export function getFacilityStatus(f) {
  if (!f.reports.length) return 'nodata'
  const latest = f.reports[f.reports.length - 1]
  const target = f.baselineEmissions * (1 - f.reductionTarget / 100)
  if (latest.co2Tonnes <= target) return 'compliant'
  if (latest.co2Tonnes <= f.baselineEmissions) return 'improving'
  return 'violation'
}

export function getLatestReport(f) {
  return f.reports.length ? f.reports[f.reports.length - 1] : null
}

export function fmtNum(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString('en-US')
}

export function fmtPct(n, decimals = 0) {
  if (n == null) return '—'
  const sign = n > 0 ? '+' : ''
  return `${sign}${Number(n).toFixed(decimals)}%`
}

export function shortAddr(addr) {
  if (!addr) return ''
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}
