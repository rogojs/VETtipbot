const EventEmitter = require('events');
const grammar = require('./parsers/grammar').parse;
const command = require('./parsers/command').parse;

const eventEmitter = new EventEmitter();
const grammarResult = grammar('@register reddit rogo');

eventEmitter.on('@register', (source, username) => {
  console.log(`handled @register ${source} ${username}`);
});

if (grammarResult) {
  const commandText = `${grammarResult.command} ${grammarResult.parameters.join(' ')}`;
  command(commandText, { emitter: eventEmitter });
}


// Boilerplate code while we get the commands sorted out
// require('dotenv').config();

// const Snoowrap = require('snoowrap');
// const Snoostorm = require('snoostorm');
// const EventEmitter = require('events');

// // Event emitter
// const eventEmitter = new EventEmitter();

// // Build Snoowrap and Snoostorm clients
// const snooWrap = new Snoowrap({
//   userAgent: 'vet-tipbot-dev',
//   clientId: process.env.CLIENT_ID,
//   clientSecret: process.env.CLIENT_SECRET,
//   username: process.env.REDDIT_USER,
//   password: process.env.REDDIT_PASS,
// });

// const snoostorm = new Snoostorm(snooWrap);

// // Configure options for stream: subreddit & results per query
// const streamOpts = {
//   subreddit: 'VETtipbot',
//   results: 25,
// };

// // Create a Snoostorm CommentStream with the specified options
// const comments = snoostorm.CommentStream(streamOpts);

// // On comment, perform whatever logic you want to do
// comments.on('comment', (comment) => {
//   // remember we want to decouple the reddit stream handler(s) from the command handlers
//   eventEmitter.emit('comment', comment);
// });

// eventEmitter.on('comment', (comment) => {
//   console.log(`${JSON.stringify(comment)}`);
// });
