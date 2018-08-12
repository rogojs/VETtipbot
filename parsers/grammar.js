const nearley = require('nearley');
const compiledGrammar = require('../grammars/grammar.js');

const nearleyGrammar = nearley.Grammar.fromCompiled(compiledGrammar);
const parser = new nearley.Parser(nearleyGrammar);
const resetState = parser.save();

function parse(openText) {
  try {
    parser.feed(openText.toLowerCase());
    const { results } = parser;
    parser.restore(resetState);
    return results[0];
  } catch (error) {
    // TODO: we should have a rolling log of commands sent in that result in an error
    return null;
  }
}

exports.parse = parse;
