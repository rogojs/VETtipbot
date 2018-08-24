require('dotenv').config();
const { Bot } = require('./bot');

const tipbot = new Bot({
  network: process.env.VECHAIN_API,
  streamOpts: { subreddit: process.env.REDDIT_CHANNELS, results: process.env.REDDIT_MSG_MAX },
  snooWrap: {
    userAgent: process.env.USER_AGENT,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS,
  },
});

tipbot.run();
