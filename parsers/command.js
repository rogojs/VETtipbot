const parser = require('yargs')
  .commandDir('../commands')
  .help(false);

exports.parse = parser.parse;
