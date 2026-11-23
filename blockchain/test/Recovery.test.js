const { expect } = require('chai');
const { ethers, network } = require('hardhat');
describe('Recovery and per-transaction reputation', function () {
  let escrow, reputation, buyer, seller, stranger;
  beforeEach(async function () {
    [buyer, seller, stranger] = await ethers.getSigners();
    escrow = await (await ethers.getContractFactory('Escrow')).deploy(stranger.address);
    reputation = await (await ethers.getContractFactory('Reputation')).deploy(await escrow.getAddress());
    await escrow.connect(stranger).setReputationContract(await reputation.getAddress());
    await escrow.createTransaction(seller.address, 1, {value:100});
  });
  const advance = async days => { await network.provider.send('evm_increaseTime', [days*86400+1]); await network.provider.send('evm_mine'); };
  it('allows anyone to settle after inspection, but not before', async function () {
    await escrow.connect(seller).markDelivered(0);
    await expect(escrow.connect(stranger).confirmCompletion(0)).to.be.reverted;
    await advance(1);
    await escrow.connect(stranger).confirmCompletion(0);
    expect((await reputation.getReputation(seller.address)).disputesWon).to.equal(0);
  });
  it('refunds undelivered funds after 30 days', async function () {
    await expect(escrow.refundExpired(0)).to.be.reverted;
    await advance(30);
    await escrow.connect(stranger).refundExpired(0);
    expect((await escrow.getTransaction(0)).status).to.equal(4);
  });
  it('refunds an abandoned dispute after 30 days', async function () {
    await escrow.raiseDispute(0);
    await advance(30);
    await escrow.refundExpired(0);
    expect((await escrow.getTransaction(0)).status).to.equal(4);
  });
  it('allows a new rating for a subsequent completed transaction', async function () {
    for (let id=0; id<2; id++) {
      if (id) await escrow.createTransaction(seller.address,1,{value:100});
      await escrow.connect(seller).markDelivered(id);
      await escrow.confirmCompletion(id);
      await reputation.submitRating(id,seller.address,5);
    }
    expect((await reputation.getReputation(seller.address)).ratingCount).to.equal(2);
  });
});
