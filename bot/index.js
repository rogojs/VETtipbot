const Snoowrap = require('snoowrap');
const EventEmitter = require('events');
const { RedditEmitter } = require('./platforms/reddit');
const grammar = require('../parsers/grammar').parse;
const command = require('../parsers/command').parse;
const { Api } = require('../api');

function Bot(options) {
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
      default: return true;
    }
  };

  Bot.prototype.run = function run() {
    this.commentEvents.on('comment', (comment) => {
      this.internalEmitters.comments.emit('comment', comment);
    });

    this.messageEvents.on('message', (message) => {
      this.internalEmitters.directMessages.emit('message', message);
    });

    this.internalEmitters.comments.on('comment', (comment) => {
      if (comment.body.length <= 100) {
        const grammarResult = grammar(comment.body);

        // TODO replace with logging
        if (grammarResult === null) {
          console.log(comment.body);
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
        const grammarResult = grammar(message.body);

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

    this.internalEmitters.comments.on('@sendvtho', (source, payee, payor, amount) => {
      this.api
        .sendvtho(source, payee, payor, amount)
        .then(() => {
          console.log('completed @sendvtho');
        })
        .catch(() => {
          console.log('error @sendvtho');
        });
    });

    this.internalEmitters.directMessages.on('@register', (source, username) => {
      this.api
        .registerCustomer(source, username)
        .then(() => {
          console.log('completed @register');
        })
        .catch(() => {
          console.log('error @register');
        });
    });

    this.internalEmitters.directMessages.on('@deposit', (source, username) => {
      this.api
        .sendAddress(source, username)
        .then(([customer, address]) => {
          // todo add logging
          console.log('completed @deposit');
          this.sendMessage(source, username, 'your vtho tipbot deposit address', `Open your [QR Code](https://us-central1-vechain-address-qrcode.cloudfunctions.net/showAddress?address=${address.address}) in a new window to scan.`);
        })
        .catch(() => {
          // todo add logging
          console.log('error @deposit');
        });
    });

    this.internalEmitters.directMessages.on('@balance', (source, username) => {
      this.api
        .sendBalance(source, username)
        .then((result) => {
          this.sendMessage(source, username, 'your vtho tipbot balance', `Your current balance is ${result / 100000000000000000000} VTHO`);
          // todo add logging
          console.log('completed @balance');
        })
        .catch(() => {
          // todo add logging
          console.log('error @balance');
        });
    });

    this.internalEmitters.directMessages.on('@withdraw', (source, username, address, amount) => {
      this.api
        .withdraw(source, username, address, amount, { reddit: this.snooWrap })
        .then((result) => {
          console.log(result);
          console.log('completed @withdraw');
        })
        .catch(() => {
          console.log('error @withdraw');
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
}

module.exports.Bot = Bot;
