const Snoowrap = require('snoowrap');
const Snoostorm = require('snoostorm');
const EventEmitter = require('events');
const grammar = require('../parsers/grammar').parse;
const command = require('../parsers/command').parse;
const { Api } = require('../api');

function Bot(options) {
  this.eventEmitter = new EventEmitter();
  this.api = new Api();
  this.snooWrap = new Snoowrap(options.snooWrap);
  this.snoostorm = new Snoostorm(options.snooWrap);
  this.comments = this.snoostorm.CommentStream(options.streamOpts);

  function grammarPostProcessor(grammarResult, context) {
    if (!grammarResult) { return null; }

    const processedResult = {
      command: null,
      paramaters: null,
    };

    processedResult.command = grammarResult.command.replace('!', '@');

    switch (processedResult.command) {
      case '@register':
        processedResult.parameters = [context.source, context.username];
        break;
      default:
        processedResult.parameters = grammarResult.parameters;
        break;
    }

    return processedResult;
  }


  Bot.prototype.run = function run() {
    this.comments.on('comment', (comment) => {
      // TODO scale here as needed
      this.eventEmitter.emit('comment', comment);
    });

    this.eventEmitter.on('comment', (comment) => {
      if (comment.body.length <= 100) {
        const grammarResult = grammar(comment.body);

        if (grammarResult) {
          const processedResult = grammarPostProcessor(grammarResult, { source: 'reddit', username: comment.author.name });
          const commandText = `${processedResult.command.replace('!', '@')} ${processedResult.parameters.join(' ')}`;
          command(commandText, { emitter: this.eventEmitter });
        }
      }
    });

    this.eventEmitter.on('@register', (source, username) => {
      this.api.registerCustomer(source, username);
    });
  };
}

module.exports.Bot = Bot;
