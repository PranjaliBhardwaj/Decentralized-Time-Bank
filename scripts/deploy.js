import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  // Deploy TimeToken
  const TimeToken = await ethers.getContractFactory("TimeToken");
  const token = await TimeToken.deploy(deployer.address);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("TimeToken deployed:", tokenAddress);

  // Deploy TimeEscrow with token address
  const TimeEscrow = await ethers.getContractFactory("TimeEscrow");
  const escrow = await TimeEscrow.deploy(tokenAddress);
  await escrow.waitForDeployment();
  const escrowAddress = await escrow.getAddress();
  console.log("TimeEscrow deployed:", escrowAddress);

  // Optional: mint some tokens to deployer for testing
  const mintAmount = ethers.parseUnits("1000", 18);
  const mintTx = await token.mint(deployer.address, mintAmount);
  await mintTx.wait();
  console.log("Minted 1000 TTK to deployer");

  // Log tx hashes
  console.log("Token tx:", token.deploymentTransaction().hash);
  console.log("Escrow tx:", escrow.deploymentTransaction().hash);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});