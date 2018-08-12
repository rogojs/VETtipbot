const Snoowrap = require('snoowrap');
const Snoostorm = require('snoostorm');
const EventEmitter = require('events');
const grammar = require('../parsers/grammar').parse;
const command = require('../parsers/command').parse;
const { Api } = require('../api');

function Bot(options) {
  this.eventEmitter = new EventEmitter();
  this.api = new Api({ network: options.network });
  this.snooWrap = new Snoowrap(options.snooWrap);
  this.snoostorm = new Snoostorm(this.snooWrap);
  this.comments = this.snoostorm.CommentStream(options.streamOpts);

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
        return this.snooWrap.getSubmission(context.parentId).author.name.then((name) => {
          processedResult.parameters = [
            context.source,
            context.username,
            name,
            grammarResult.parameters[0]];
          return new Promise((resolve) => {
            resolve(processedResult);
          });
        });
      default:
        processedResult.parameters = grammarResult.parameters;
        return new Promise((resolve) => { resolve(processedResult); });
    }
  };

  Bot.prototype.run = function run() {
    this.comments.on('comment', (comment) => {
      this.eventEmitter.emit('comment', comment);
    });

    this.eventEmitter.on('comment', (comment) => {
      if (comment.body.length <= 100) {
        const grammarResult = grammar(comment.body);

        if (grammarResult) {
          this.grammarPostProcessor(grammarResult,
            {
              source: 'reddit',
              username: comment.author.name,
              parentId: comment.parent_id,
            })
            .then((processedResult) => {
              const commandText = `${processedResult.command.replace('!', '@')} ${processedResult.parameters.join(' ')}`;
              command(commandText, { emitter: this.eventEmitter });
            });
        }
      }
    });

    this.eventEmitter.on('@register', (source, username) => {
      this.api
        .registerCustomer(source, username)
        .then(() => {
          console.log('completed @register');
        });
    });

    this.eventEmitter.on('@sendvtho', (source, payee, payor, amount) => {
      this.api
        .sendvtho(source, payee, payor, amount)
        .then(() => {
          console.log('completed @sendvtho');
        });
    });
  };
}

module.exports.Bot = Bot;
