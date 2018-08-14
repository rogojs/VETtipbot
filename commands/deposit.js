const commandName = '@deposit';

exports.command = `${commandName} <source> <username>`;

exports.describe = 'get address for deposits';

exports.builder = (yargs) => {
  yargs
    .positional('source', { describe: 'source of username', type: 'string', choices: ['reddit'] })
    .positional('username', { describe: 'username', type: 'string' });
};

exports.handler = (argv) => {
  const { _, source, username } = argv;

  if (argv.emitter) {
    argv.emitter.emit(_[0], source, username);
  }
};
