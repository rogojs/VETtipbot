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

  this.commentEvents.on('error', (error) => {
    this.logger.error('comment.events.error', { error });
  });

  this.messageEvents = this.redditEmitter.Messages({
    interval: process.env.REDDIT_MESSAGE_INTERVAL,
  });

  this.messageEvents.on('error', (error) => {
    this.logger.error('message.events.error', { error });
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
      case '@help':
        processedResult.parameters = [context.source, context.username];
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
        .then((result) => {
          this.logger.info('tip.success', {
            source, payee, payor, amount,
          });
          this.sendMessage(
            source,
            payee,
            'VeChain TipBot Tip Receipt',
            `You sent ${amount} VTHO to ${payor}. [Click to see this transaction on VeForge](https://testnet.veforge.com/transactions/${result.transactionHash})`,
          );

          this.sendMessage(
            source,
            payor,
            'VeChain TipBot Tip Receipt',
            `[/u/${payee}](https://www.reddit.com/u/${payee}) sent you ${amount} VTHO. [Click to see this transaction on VeForge](https://testnet.veforge.com/transactions/${result.transactionHash}) Message [@help](https://www.reddit.com/message/compose/?to=VETtipbot&subject=TipBotIgnoresThis&message=@help) to this tipbot for more information. `,
          );
        })
        .catch((error) => {
          this.logger.warn('tip.warn', {
            source, payee, payor, amount, error,
          });
          this.sendMessage(
            source,
            payee,
            'VeChain TipBot Tip Request',
            'I am sorry. Your tip request failed. The tipbot sent a message to the system administrators.',
          );
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
            `You have registered an address with the VeChain TipBot. [Click to see your QR code and add funds using the VeChainThor Wallet](https://us-central1-vechain-address-qrcode.cloudfunctions.net/showAddress?address=${address.address})`);
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
            `[Click to see your QR deposit code; use your wallet scan to add funds](https://us-central1-vechain-address-qrcode.cloudfunctions.net/showAddress?address=${address.address})`);
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
          const amountAsVTHO = this.api.fromVTHO(result);
          //const amountAsVTHO = this.api.asBigNumber(result);
          this.logger.info('balance.success', { source, username });
          this.sendMessage(source,
            username,
            'VeChain TipBot Balance Request',
            `Your current balance: ${amountAsVTHO} VTHO or ${result}`);
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
            `Successfully sent ${amount} VTHO to ${address} [View Transaction On VeForge](https://testnet.veforge.com/transactions/${result.transactionHash})`);
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

    this.internalEmitters.directMessages.on('@help', (source, username) => {
      this.logger.info('help.success', { source, username });

      this.sendMessage(source,
        username,
        'VeChain TipBot Help Request',
        'Click [here](https://vechain-tipbot-help.firebaseapp.com/) for help and shortcut links.');
    });

    this.internalEmitters.directMessages.on('@faucet', (source, username) => {
      this.api
        .faucet(source, username)
        .then(() => {
          this.logger.info('faucet.success', { source, username });
        })
        .catch(() => {
          this.logger.warn('faucet.warn', { source, username });
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
