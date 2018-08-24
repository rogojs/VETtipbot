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
    maxItems: 1000,
    interval: 15000,
  });

  this.messageEvents = this.redditEmitter.Messages({
    interval: 15000,
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
        return this.snooWrap.getComment(context.parentId).author.name.then((name) => {
          processedResult.parameters = [
            context.source,
            context.username,
            name,
            grammarResult.parameters[0]];
          return new Promise((resolve) => {
            resolve(processedResult);
          });
        })
          .catch(() => {
            console.log('oops, @tip error');
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

  Bot.prototype.run = function run() {
    this.commentEvents.on('comment', (comment) => {
      this.internalEmitters.comments.emit('comment', comment);
    });

    this.messageEvents.on('message', (message) => {
      this.internalEmitters.directMessages.emit('message', message);
    });

    this.internalEmitters.comments.on('comment', (comment) => {
      console.log(1);
      if (comment.body.length <= 100) {
        console.log(2);
        const grammarResult = grammar(comment.body);
        console.log(grammarResult);

        if(grammarResult === null)
        {
          console.log(comment.body);
        }

        if (grammarResult) {
          console.log(3);
          this.grammarPostProcessor(grammarResult,
            {
              source: 'reddit',
              username: comment.author.name,
              parentId: comment.parent_id,
            })
            .then((processedResult) => {
              console.log(4);
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
        });
    });

    this.internalEmitters.directMessages.on('@register', (source, username) => {
      this.api
        .registerCustomer(source, username)
        .then(() => {
          console.log('completed @register');
        });
    });

    this.internalEmitters.directMessages.on('@deposit', (source, username) => {
      this.api
        .sendAddress(source, username, { reddit: this.snooWrap })
        .then(() => {
          console.log('completed @deposit');
        });
    });

    this.internalEmitters.directMessages.on('@balance', (source, username) => {
      this.api
        .sendBalance(source, username, { reddit: this.snooWrap })
        .then(() => {
          console.log('completed @balance');
        });
    });

    this.internalEmitters.directMessages.on('@withdraw', (source, username, address, amount) => {
      this.api
        .withdraw(source, username, address, amount, { reddit: this.snooWrap })
        .then(() => {
          console.log('completed @withdraw');
        });
    });

    this.internalEmitters.directMessages.on('@faucet', (source, username) => {
      this.api
        .faucet(source, username, { reddit: this.snooWrap })
        .then(() => {
          console.log('completed @faucet');
        });
    });
  };
}

module.exports.Bot = Bot;
