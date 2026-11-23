const service = require('./contractService');
module.exports = async function verify(row) {
  if (row.on_chain_tx_id == null || !/^\d+$/.test(String(row.on_chain_tx_id))) throw Object.assign(new Error('A valid on-chain escrow ID is required'), {status:400});
  const chain = await service.getOnChainTransaction(row.on_chain_tx_id);
  if (chain.buyer.toLowerCase() !== row.buyer_wallet.toLowerCase() || chain.seller.toLowerCase() !== row.seller_wallet.toLowerCase()) throw Object.assign(new Error('Escrow participants do not match the contract'), {status:403});
  return chain;
};
