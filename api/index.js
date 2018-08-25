require('dotenv').config();
const fs = require('fs');
const path = require('path');
const Web3 = require('web3');
const { thorify } = require('thorify');
const request = require('superagent');
const { Platform, Customer, Address } = require('./data/models');
const { Utils } = require('./utils');

function createCustomer(platform, username) {
  if (platform === null && platform.id === null) {
    throw new Error('Platform is null or id not found');
  }

  return Customer
    .findOne({
      where: {
        username,
        platformId: platform.id,
      },
    })
    .then((result) => {
      if (result === null) {
        const newCustomer = Customer.build({
          username,
          platformId: platform.id,
        });

        return newCustomer.save();
      }

      return result;
    });
}

function createAddress(customer, name) {
  if (customer === null && customer.id === null) {
    throw new Error('Customer is null or id not found');
  }

  return Address
    .findOne({
      where: {
        name,
        customerId: customer.id,
      },
      include: [{
        model: Customer,
        as: 'customer',
      }],
    })
    .then((result) => {
      if (result === null) {
        const mnemonic = Utils.generateMnemonic();
        const wallet = Utils.createWalletFromMnemonic(mnemonic);
        const newAddress = Address.build({
          name,
          privateKey: wallet.privateKey,
          publicKey: wallet.publicKey,
          address: wallet.address,
          mnemonicPhrase: mnemonic,
          customerId: customer.id,
        });

        return newAddress.save();
      }
      return result;
    });
}

function Api(options) {
  const defaultOptions = {
    usingDefault: true,
  };
  this.options = options || defaultOptions;

  this.web3 = new Web3();

  thorify(this.web3, this.options.network);

  Api.prototype.registerCustomer = function registerCustomer(source, username) {
    return Platform
      .findAll({
        name: source,
      })
      .then(results => createCustomer(results[0], username))
      .then(customer => createAddress(customer, '_default'));
  };

  Api.prototype.sendvtho = function sendvtho(source, payee, payor, amount) {
    return Platform
      .findOne({
        name: source,
      })
      .then(platform => Promise.all([
        createCustomer(platform, payee),
        createCustomer(platform, payor)]))
      .then(customers => Promise.all([
        createAddress(customers[0], '_default'),
        createAddress(customers[1], '_default')]))
      .then(addresses => this.sendEnergy(addresses[0], addresses[1], amount));
  };

  Api.prototype.sendEnergy = function sendEnergy(addressFrom, addressTo, amount) {
    this.web3.eth.accounts.wallet.clear();
    this.web3.eth.accounts.wallet.add(`0x${addressFrom.privateKey}`);

    const contract = JSON.parse(fs.readFileSync(path.resolve('./api/vechain/build/contracts/Energy.json')));

    const contractObject = new this.web3.eth.Contract(contract.abi,
      process.env.VECHAIN_ENERGY_CONTRACT_ADDRESS);

    return contractObject
      .methods.transfer(addressTo.address, amount)
      .send({ from: addressFrom.address });
  };

  Api.prototype.sendBalanceInContext = function sendBalanceInContext(address) {
    this.web3.eth.accounts.wallet.clear();
    this.web3.eth.accounts.wallet.add(address.privateKey);

    const contract = JSON.parse(fs.readFileSync(path.resolve('./api/vechain/build/contracts/Energy.json')));

    const contractObject = new this.web3.eth.Contract(contract.abi,
      process.env.VECHAIN_ENERGY_CONTRACT_ADDRESS);

    return contractObject
      .methods.balanceOf(address.address)
      .call({ from: address.address });
  };

  Api.prototype.sendAddress = function sendAddress(source, username) {
    return Platform
      .findOne({
        name: source,
      })
      .then(platform => Promise.all([
        createCustomer(platform, username)]))
      .then(([customer]) => Promise.all([
        customer,
        createAddress(customer, '_default')]));
  };

  Api.prototype.sendBalance = function sendBalance(source, username) {
    return Platform
      .findOne({
        name: source,
      })
      .then(platform => createCustomer(platform, username))
      .then(customer => createAddress(customer, '_default'))
      .then(address => this.sendBalanceInContext(address));
  };

  Api.prototype.withdraw = function withdraw(source, payee, address, amount) {
    return Platform
      .findOne({
        name: source,
      })
      .then(platform => Promise.all([
        createCustomer(platform, payee)]))
      .then(customers => Promise.all([
        createAddress(customers[0], '_default'),
        address]))
      .then(([payeeAddress, rawAddress]) => this.sendEnergy(
        payeeAddress,
        { address: rawAddress },
        amount,
      ));
  };

  Api.prototype.faucet = function faucet(source, username) {
    return Platform
      .findOne({
        name: source,
      })
      .then(platform => createCustomer(platform, username))
      .then(customer => createAddress(customer, '_default'))
      .then(address => this.faucetFundAccount(address));
  };

  Api.prototype.faucetFundAccount = function faucetFundAccount(address) {
    request
      .post('https://faucet.outofgas.io/requests')
      .send({ to: address.address })
      .end(() => { });
  };
}

module.exports.Api = Api;
