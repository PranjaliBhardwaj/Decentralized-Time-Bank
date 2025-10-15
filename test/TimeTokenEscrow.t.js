import { expect } from "chai";
import pkg from "hardhat";
const { ethers } = pkg;

describe("TimeToken & TimeEscrow", function () {
  it("mints token and completes escrow flow", async function () {
    const [owner, requester, provider] = await ethers.getSigners();

    const TimeToken = await ethers.getContractFactory("TimeToken");
    const token = await TimeToken.deploy(owner.address);
    await token.waitForDeployment();

    // Mint to requester
    const amount = ethers.parseUnits("10", 18);
    await (await token.mint(requester.address, amount)).wait();

    const TimeEscrow = await ethers.getContractFactory("TimeEscrow");
    const escrow = await TimeEscrow.deploy(await token.getAddress());
    await escrow.waitForDeployment();

    // Approve and create escrow by requester
    const tokenAsRequester = token.connect(requester);
    await (await tokenAsRequester.approve(await escrow.getAddress(), amount)).wait();
    const tx = await escrow.connect(requester).createEscrow(provider.address, amount);
    const receipt = await tx.wait();

    // Extract escrowId from event
    const created = receipt.logs.map(l => {
      try { return escrow.interface.parseLog(l); } catch { return null; }
    }).filter(Boolean).find(e => e.name === "EscrowCreated");
    const escrowId = created?.args[0];

    // Both confirm
    await (await escrow.connect(provider).confirm(escrowId)).wait();
    await (await escrow.connect(requester).confirm(escrowId)).wait();

    // Provider receives funds
    const providerBal = await token.balanceOf(provider.address);
    expect(providerBal).to.equal(amount);
  });
});


