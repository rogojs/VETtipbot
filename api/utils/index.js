const bip39 = require('bip39');
const hdkey = require('ethereumjs-wallet/hdkey');

const hdWalletPath = "m/44'/818'/0'/0/00";
const stringFormat = 'hex';

function Utils() {
}

Utils.generateMnemonic = function generateMnemonic() {
  return bip39.generateMnemonic();
};

Utils.createWalletFromMnemonic = function createWalletFromMnemonic(mnemonic) {
  const seed = bip39.mnemonicToSeed(mnemonic);
  const hdwallet = hdkey.fromMasterSeed(seed);

  const wallet = hdwallet.derivePath(hdWalletPath).getWallet();
  const address = `0x${wallet.getAddress().toString(stringFormat)}`;
  const privateKey = wallet.getPrivateKey().toString(stringFormat);
  const publicKey = wallet.getPublicKey().toString(stringFormat);

  return {
    address,
    publicKey,
    privateKey,
  };
};

module.exports.Utils = Utils;
