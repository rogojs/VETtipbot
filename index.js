require('dotenv').config();
const { Bot } = require('./bot');

const tipbot = new Bot({
  logging: {
    host: process.env.LOG_HOST,
    level: process.env.LOG_LEVEL,
    index: process.env.LOG_INDEX,
  },
  network: process.env.VECHAIN_API,
  snooWrap: {
    userAgent: process.env.USER_AGENT,
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    username: process.env.REDDIT_USER,
    password: process.env.REDDIT_PASS,
  },
});

tipbot.run();
