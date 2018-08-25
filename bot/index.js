const Snoowrap = require('snoowrap');
const EventEmitter = require('events');
const winston = require('winston');
const Elasticsearch = require('winston-elasticsearch');
const { RedditEmitter } = require('./platforms/reddit');
const grammar = require('../parsers/grammar').parse;
const command = require('../parsers/command').parse;
const { Api } = require('../api');


function Bot(options) {
  this.logger = winston.createLogger({
    level: process.env.LOG_LEVEL,
    format: winston.format.json(),
    transports: [
      new winston.transports.Console({ format: winston.format.simple() }),
      new Elasticsearch({ indexPrefix: 'tipbot-logs', level: 'info' }),
    ],
  });

  this.internalEmitters = {
    comments: new EventEmitter(),
    directMessages: new EventEmitter(),
  };

  this.api = new Api({ network: options.network });
  this.snooWrap = new Snoowrap(options.snooWrap);

  this.redditEmitter = new RedditEmitter(this.snooWrap);

  this.commentEvents = this.redditEmitter.Comments({
    subreddit: process.env.REDDIT_CHANNELS,
    maxItems: parseInt(process.env.REDDIT_COMMENT_MAXITEMS, 10),
    interval: process.env.REDDIT_COMMENT_INTERVAL,
  });

  this.messageEvents = this.redditEmitter.Messages({
    interval: process.env.REDDIT_MESSAGE_INTERVAL,
  });

  Bot.prototype.grammarPostProcessor = function grammarPostProcessor(grammarResult, context) {
    if (!grammarResult) { return null; }

    const processedResult = {
      command: null,
      parameters: null,
    };

    processedResult.command = grammarResult.command.replace('!', '@');

    switch (processedResult.command) {
      case '@register':
        processedResult.parameters = [context.source, context.username];
        return new Promise((resolve) => { resolve(processedResult); });
      case '@tip':
        processedResult.command = '@sendvtho';
        return this.snooWrap
          .getComment(context.parentId).author.name
          .then((name) => {
            processedResult.parameters = [
              context.source,
              context.username,
              name,
              grammarResult.parameters[0]];
            return new Promise((resolve) => {
              resolve(processedResult);
            });
          });
      case '@deposit':
        processedResult.parameters = [context.source, context.username];
        return new Promise((resolve) => { resolve(processedResult); });
      case '@balance':
        processedResult.parameters = [context.source, context.username];
        return new Promise((resolve) => { resolve(processedResult); });
      case '@withdraw':
        processedResult.parameters = [
          context.source,
          context.username,
          grammarResult.parameters[0],
          grammarResult.parameters[1]];
        return new Promise((resolve) => { resolve(processedResult); });
      case '@faucet':
        processedResult.parameters = [context.source, context.username];
        return new Promise((resolve) => { resolve(processedResult); });
      default:
        processedResult.parameters = grammarResult.parameters;
        return new Promise((resolve) => { resolve(processedResult); });
    }
  };

  Bot.prototype.sendMessage = function sendMessage(type, username, subject, message) {
    switch (type) {
      case 'reddit':
        this.snooWrap.composeMessage({
          to: username,
          subject,
          text: message,
        });
        break;
      default:
      // take no action
    }

    return true;
  };

  Bot.prototype.setupRedditEmitters = function setupRedditEmitters() {
    this.commentEvents.on('comment', (comment) => {
      this.internalEmitters.comments.emit('comment', comment);
    });

    this.messageEvents.on('message', (message) => {
      this.internalEmitters.directMessages.emit('message', message);
    });
  };

  Bot.prototype.setupCommentHandlers = function setupCommentHandlers() {
    this.internalEmitters.comments.on('@sendvtho', (source, payee, payor, amount) => {
      this.api
        .sendvtho(source, payee, payor, amount)
        .then(() => {
          this.logger.info('tip.success', {
            source, payee, payor, amount: amount / 100000000000000000000,
          });
          this.sendMessage(source, payee, 'your tip receipt', `You just tipped ${payor} ${amount} VTHO. Check your transaction [here](https://testnet.veforge.com/transactions/0xf57088cde11f6fd70248415aea2d81b828f8cc3654b98f679f7c2853810a8829).`);
        })
        .catch((error) => {
          console.log(error);
          this.logger.warn('tip.warn', {
            source, payee, payor, amount: amount / 100000000000000000000,
          });
          this.sendMessage(source, payee, 'your tip failed', `I could not tip ${payor} ${amount} VTHO. The transaction failed with this error: REASONS`);
        });
    });
  };

  Bot.prototype.setupMessageHandlers = function setupMessageHandlers() {
    this.internalEmitters.directMessages.on('@register', (source, username) => {
      this.api
        .registerCustomer(source, username)
        .then((address) => {
          this.logger.info('register.success', { source, username, address: address.address });
          this.sendMessage(source,
            username,
            'VeChain TipBot Registration Request',
            `You have registered an address with the VeChain TipBot. [Deposit Using Wallet Scan](https://us-central1-vechain-address-qrcode.cloudfunctions.net/showAddress?address=${address.address}). [View On VeForge](https://explore.veforge.com/accounts/${address.address})`);
        })
        .catch((error) => {
          this.logger.warn('register.warn', { source, username, error });
          this.sendMessage(source,
            username,
            'VeChain TipBot Registration Request',
            'I am sorry. Your registration request failed. The tipbot sent a message to the system administrators.');
        });
    });

    this.internalEmitters.directMessages.on('@deposit', (source, username) => {
      this.api
        .sendAddress(source, username)
        .then(([customer, address]) => {
          this.logger.info('deposit.success', {
            source, username, address: address.address, id: customer.id,
          });
          this.sendMessage(source,
            username,
            'VeChain TipBot Deposit Request',
            `[Deposit Using Wallet Scan](https://us-central1-vechain-address-qrcode.cloudfunctions.net/showAddress?address=${address.address}). [View On VeForge](https://explore.veforge.com/accounts/${address.address})`);
        })
        .catch((error) => {
          this.logger.warn('deposit.warn', { source, username, error });
          this.sendMessage(source,
            username,
            'VeChain TipBot Deposit Request',
            'I am sorry. Your deposit request failed. The tipbot sent a message to the system administrators.');
        });
    });

    this.internalEmitters.directMessages.on('@balance', (source, username) => {
      this.api
        .sendBalance(source, username)
        .then((result) => {
          this.logger.info('balance.success', { source, username });
          this.sendMessage(source,
            username,
            'VeChain TipBot Balance Request',
            `Current balance: ${result / 100000000000000000000} VTHO`);
        })
        .catch(() => {
          this.logger.warn('balance.warn', { source, username });
          this.sendMessage(source,
            username,
            'VeChain TipBot Balance Request',
            'I am sorry. Your balance request failed. The tipbot sent a message to the system administrators.');
        });
    });

    this.internalEmitters.directMessages.on('@withdraw', (source, username, address, amount) => {
      this.api
        .withdraw(source, username, address, amount, { reddit: this.snooWrap })
        .then((result) => {
          this.logger.info('withdraw.success', {
            source, username, address, amount, result,
          });
          this.sendMessage(source,
            username,
            'VeChain TipBot Withdrawal Request',
            `Successfully sent ${amount} to ${address} [View Transaction On VeForge](https://explore.veforge.com/transactions/${result.transactionHash})`);
        })
        .catch((error) => {
          this.logger.warn('withdraw.warn', {
            source, username, address, amount, error,
          });
          this.sendMessage(source,
            username,
            'VeChain TipBot Withdrawal Request',
            'I am sorry. Your withdrawal request failed. The tipbot sent a message to the system administrators.');
        });
    });

    this.internalEmitters.directMessages.on('@faucet', (source, username) => {
      this.api
        .faucet(source, username)
        .then(() => {
          console.log('completed @faucet');
        })
        .catch(() => {
          console.log('error @faucet');
        });
    });
  };

  Bot.prototype.linkEmitters = function linkEmitters() {
    this.internalEmitters.comments.on('comment', (comment) => {
      if (comment.body.length <= 100) {
        this.logger.info('comment.raw', { raw: comment.body });

        const grammarResult = grammar(comment.body);

        if (grammarResult === null) {
          this.logger.warn('grammar.failed', { raw: comment.body });
        }

        if (grammarResult) {
          this.grammarPostProcessor(grammarResult,
            {
              source: 'reddit',
              username: comment.author.name,
              parentId: comment.parent_id,
            })
            .then((processedResult) => {
              const commandText = `${processedResult.command.replace('!', '@')} ${processedResult.parameters.join(' ')}`;
              command(commandText, { emitter: this.internalEmitters.comments });
            });
        }
      }
    });

    this.internalEmitters.directMessages.on('message', (message) => {
      if (message.body.length <= 100) {
        this.logger.info('message.raw', { raw: message.body });

        const grammarResult = grammar(message.body);

        if (grammarResult === null) {
          this.logger.warn('grammar.failed', { raw: message.body });
        }

        if (grammarResult) {
          this.grammarPostProcessor(grammarResult,
            {
              source: 'reddit',
              username: message.author.name,
            })
            .then((processedResult) => {
              const commandText = `${processedResult.command.replace('!', '@')} ${processedResult.parameters.join(' ')}`;
              command(commandText, { emitter: this.internalEmitters.directMessages });
            });
        }
      }
    });
  };

  Bot.prototype.run = function run() {
    process.on('unhandledRejection', (reason, p) => {
      this.logger.error('tipbot.error', { reason, p });
    });


    this.setupRedditEmitters();

    this.linkEmitters();

    this.setupCommentHandlers();

    this.setupMessageHandlers();

    this.logger.info('Bot Started',
      {
        PID: process.pid, argv: process.argv, cwd: process.cwd(), title: process.title,
      });
  };
}

module.exports.Bot = Bot;

/*
  Balance
  @balance
  VeChain TipBot : Your Balance Request
  Success -
  Your balance is 12345 VTHO.
  Click [here] for more details.
  Failure -
  I am sorry. Your balance request failed.
  The tipbot sent a message to the system administrators.

  Deposit
  @deposit
  VeChain TipBot : Your Deposit Request
  Success -
  Click [here] to view your deposit address.
  Failure -
  I am sorry. Your deposit request failed.
  The tipbot sent a message to the system administrators.


  Withdraw
  @withdraw
  VeChain TipBot : Your Withdrawal Request
  Success -
  You withdrew 12345 VTHO.
  Click [here] to view your transaction details.
  *Failure -
  I am sorry. Your withdrawal request failed.
  The tipbot sent a message to the system administrators.
  *Insufficent Funds -
  I am sorry. You do not have sufficient funds to complete this withdrawal.
  Your account details are [here].

  Tip
  @tip
  VeChain TipBot : Your Tip Request
  Success -
  You sent 12345 VTHO to JoeShmoe
  Click [here] to view your transaction details.
  *Failure -
  I am sorry. Your withdrawal request failed.
  The tipbot sent a message to the system administrators.
  *Insufficent Funds -
  I am sorry. You do not have sufficient funds to complete this transaction.
  Your account details are [here].
  Add funds to your account by sending @deposit to the VeChain TipBot.
  
  For additional information send @help to the VeChain TipBot.

  Help
  @help
  VeChain TipBot Help

  The VeChain TipBot (VCT) allows you to send and receive tips using VTHO.

  We are currently only available on Reddit.

  VCT listens to your direct messages.
  VCT responds to the following commands -
  @help
    Sends you the help message you are reading now
  @deposit
    Sends you a link to the deposit address for your tip jar
  @balance
    Sends you the current balance of your tip jar
  @withdraw VALID-VECHAIN-ADDRESS VTH-AMOUNT
    Send the VTHO-AMOUNT from your tip jar to the VALID-VECHAIN-ADDRESS
  @register
    Creates a tip jar for you (this happens AUTOMATICALLY with any command you send and is not required to start using VCT)

  VCT also scans replies in VeChain and VeChainTrader.
  VCT will respond to the following in comment replies -
  @tip VTHO-AMOUNT
    Sends the VTHO-AMOUNT from your tip jar to the reddit user whose comment you replied.
    An account will automatically be created for the receipient if it does not exist.
    They will be notified that a tip has been sent to them.
*/
