const Billboard = artifacts.require('./Convergent_Billboard.sol');

const ARAGON_DAO_VAULT = {
  "rinkeby": "0xbAE0fFFc9AE5B27B01DDF5Bc4Bfd5Ff58d21A362",
  "mainnet": "0xB8001be99e38BE45fa9Caa4A6353Ca75063b4e4c",
}

module.exports = (deployer, network) => {
  
  const vaultAddr = network === 'mainnet' ? ARAGON_DAO_VAULT.mainnet : ARAGON_DAO_VAULT.rinkeby;

  deployer.deploy(Billboard, '1000', '1', vaultAddr);
}
