const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');

// Saying this outloud makes you sound really smart
// Sort of like repeating things you learn in KSP
const hierarchicalDeterministicWalletPath = "m/44'/818'/0'/0/00";

function Utils() {
}

Utils.generateMnemonic = function generateMnemonic() {
  return bip39.generateMnemonic();
};

Utils.createWalletFromMnemonic = function createWalletFromMnemonic(mnemonic) {
  const seed = bip39.mnemonicToSeed(mnemonic);
  const hdwallet = hdkey.fromMasterSeed(seed);

  const wallet = hdwallet.derivePath(hierarchicalDeterministicWalletPath).getWallet();
  const address = `0x${wallet.getAddress().toString('hex')}`;
  const privateKey = wallet.getPrivateKey().toString('hex');
  const publicKey = wallet.getPublicKey().toString('hex');

  return {
    address,
    publicKey,
    privateKey,
  };
};

module.exports.Utils = Utils;
