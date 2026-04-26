import { ethers } from 'ethers'
import { CONTRACT_ADDRESS } from './constants'

// Minimal ABI — only the functions the frontend calls
export const ABI = [
  'function registerFacility(string,string,string,int256,int256,uint256,uint256) returns (uint256)',
  'function reportEmissions(uint256,uint256,string)',
  'function getFacility(uint256) view returns (tuple(uint256,address,string,string,string,int256,int256,uint256,uint256,uint256,bool))',
  'function getReports(uint256) view returns (tuple(uint256,uint256,uint256,string,bool,uint256,bool)[])',
  'function getOrgFacilities(address) view returns (uint256[])',
  'function facilityCount() view returns (uint256)',
  'event FacilityRegistered(uint256 indexed,address indexed,string,string,string,int256,int256,uint256,uint256)',
  'event EmissionReported(uint256 indexed,uint256,string,bool,uint256,bool)',
]

export function getContract(signerOrProvider) {
  if (!CONTRACT_ADDRESS) return null
  return new ethers.Contract(CONTRACT_ADDRESS, ABI, signerOrProvider)
}
