// Boilerplate implementation while testing
require('dotenv').config();
const { Bot } = require('./bot');

const tipbot = new Bot({
  streamOpts: { subreddit: process.env.REDDIT_CHANNELS, results: 25 },
  snooWrap: {
    userAgent: process.env.USER_AGENT,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS,
  },
});

tipbot.run();
