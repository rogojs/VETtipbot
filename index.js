require('dotenv').config();

const Snoowrap = require('snoowrap');
const Snoostorm = require('snoostorm');
const EventEmitter = require('events');

// Event emitter
let eventEmitter = new EventEmitter();

// Build Snoowrap and Snoostorm clients
const r = new Snoowrap({
  userAgent: 'vet-tipbot-dev',
  clientId: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  username: process.env.REDDIT_USER,
  password: process.env.REDDIT_PASS
});

const client = new Snoostorm(r);

// Configure options for stream: subreddit & results per query
const streamOpts = {
  subreddit: 'VETtipbot',
  results: 25
};

// Create a Snoostorm CommentStream with the specified options
const comments = client.CommentStream(streamOpts);

// On comment, perform whatever logic you want to do
comments.on('comment', (comment) => {
  eventEmitter.emit('comment', comment);
  
});
  
eventEmitter.on('comment',commentHandler);

function commentHandler(comment){
  console.log(`${JSON.stringify(comment)}`)
}
