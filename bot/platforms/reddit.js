const EventEmitter = require('events');

function RedditEmitter(snooWrapInstance) {
  this.epochInSeconds = Date.now() / 1000; // divided to match the units of the reddit api
  this.snooWrapInstance = snooWrapInstance;

  RedditEmitter.prototype.handleItem = function handleItem(type, emitter, item) {
    switch (type) {
      case 'comment':
        emitter.emit(type, item);
        break;
      case 'message':
        emitter.emit(type, item);
        item.deleteFromInbox();
        break;
      default:
    }
  };

  RedditEmitter.prototype.getItems = function getItems(type, options) {
    switch (type) {
      case 'comment':
        return this.snooWrapInstance.getNewComments(options.subreddit, { limit: options.maxItems });
      case 'message':
        return this.snooWrapInstance.getInbox({ filter: 'messages' });
      default:
        return null;
    }
  };

  RedditEmitter.prototype.CreateEmitter = function CreateEmitter(type, options) {
    if (!this[`${type}`]) {
      this[`${type}`] = [];
    }

    const event = new EventEmitter();

    const intervalId = setInterval(() => {
      this.getItems(type, options)
        .then((comments) => {
          comments
            .filter(comment => this[`${type}`]
              .every(previousComment => previousComment.id !== comment.id)
              && comment.created_utc >= this.epochInSeconds)
            .forEach((comment) => { this.handleItem(type, event, comment); });
          this[`${type}`] = comments;
        })
        .catch((err) => {
          event.emit('error', err);
        });
    }, options.interval);

    event.on('stop', () => {
      clearInterval(intervalId);
    });

    event.on('error', (error) => {
      // TODO use logger
      console.log(error);
    });

    return event;
  };

  RedditEmitter.prototype.Comments = function Comments(options) {
    return this.CreateEmitter('comment', options);
  };

  RedditEmitter.prototype.Messages = function Messages(options) {
    return this.CreateEmitter('message', options);
  };
}

module.exports.RedditEmitter = RedditEmitter;
