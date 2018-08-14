const EventEmitter = require('events');

function RedditEmitter(snooWrapInstance) {
  this.snooWrapInstance = snooWrapInstance;

  RedditEmitter.prototype.Comments = function Comments(options) {
    let previousComments = [];
    const event = new EventEmitter();
    const start = Date.now();

    const intervalId = setInterval(() => {
      this.snooWrapInstance
        .getNewComments(options.subreddit, { limit: options.maxItems })
        .then((comments) => {
          comments.filter(comment => previousComments.every(element => element.id !== comment.id)
            && (comment.created_utc >= start / 1000))
            .forEach((filteredComment) => { event.emit('comment', filteredComment); });
          previousComments = comments;
        });
    }, options.interval);

    event.on('stop', () => {
      clearInterval(intervalId);
    });

    return event;
  };

  RedditEmitter.prototype.Messages = function Messages(options) {
    let previousComments = [];
    const event = new EventEmitter();
    const start = Date.now();

    const intervalId = setInterval(() => {
      this.snooWrapInstance
        .getInbox({ filter: 'messages' })
        .then((comments) => {
          comments.filter(comment => previousComments.every(element => element.id !== comment.id)
            && (comment.created_utc >= start / 1000))
            .forEach((filteredComment) => { event.emit('message', filteredComment); filteredComment.deleteFromInbox(); });
          previousComments = comments;
        });
    }, options.interval);

    event.on('stop', () => {
      clearInterval(intervalId);
    });

    return event;
  };
}

module.exports.RedditEmitter = RedditEmitter;
