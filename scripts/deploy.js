const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  const CarbonRegistry = await ethers.getContractFactory("CarbonRegistry");
  const registry = await CarbonRegistry.deploy();
  await registry.waitForDeployment();

  const address = await registry.getAddress();
  console.log("CarbonRegistry deployed to:", address);
  console.log("Etherscan: https://sepolia.etherscan.io/address/" + address);
  console.log('\nAdd to frontend/.env:');
  console.log("VITE_CONTRACT_ADDRESS=" + address);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
