const commandName = '@withdraw';

exports.command = `${commandName} <source> <payor> <address> <amount>`;

exports.describe = 'send vtho from payor to address';

exports.builder = (yargs) => {
  yargs
    .positional('source', { describe: 'transaction origination source', type: 'string', choices: ['reddit'] })
    .positional('payor', { describe: 'source of funds', type: 'string' })
    .positional('address', { describe: 'destination of funds', type: 'string' })
    .positional('amount', { describe: 'amount of vtho to send', type: 'number' });
};

exports.handler = (argv) => {
  const {
    _,
    source,
    payor,
    address,
    amount,
  } = argv;

  if (argv.emitter) {
    argv.emitter.emit(_[0], source, payor, address, amount);
  }
};
