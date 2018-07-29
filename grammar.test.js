/* global it, describe, beforeEach */
const { expect } = require('chai');
const nearley = require('nearley');
const compiledGrammar = require('./grammar.js');

const nearleyGrammar = nearley.Grammar.fromCompiled(compiledGrammar);
const parser = new nearley.Parser(nearleyGrammar);
const resetState = parser.save();

beforeEach(() => {
  parser.restore(resetState);
});

describe('[tipbot grammar]', () => {
  it('...allows @command syntax', () => {
    expect(() => { parser.feed('@mycommand'); }).to.not.throw();
  });

  it('...has an unambiguous grammar ', () => {
    expect(() => { parser.feed('@register a b abcd ab.cd 1.2 34_31'); }).to.not.throw();
    expect(parser.results).to.have.lengthOf(1);
  });

  it('...parses an empty string', () => {
    expect(() => { parser.feed(''); }).to.not.throw();
    expect(parser.results).to.have.lengthOf(0);
  });

  it('...provides a command property', () => {
    expect(() => { parser.feed('@mycommand'); }).to.not.throw();
    expect(parser.results[0]).to.have.property('command');
  });

  it('...provides a parameters property', () => {
    expect(() => { parser.feed('@register'); }).to.not.throw();
    expect(parser.results[0]).to.have.property('parameters');
  });

  it('...always provides all passed parameters', () => {
    expect(() => { parser.feed('@register 0 a B c'); }).to.not.throw();
    expect(parser.results[0].parameters).to.have.lengthOf(4);
  });

  it('...allows parameters with underscores, dashes, numbers, periods, and letters', () => {
    expect(() => { parser.feed('@register 1 a_bc 234efg abc.def abcd-fg-123.3'); }).to.not.throw();
    expect(parser.results[0].parameters).to.have.lengthOf(5);
  });
});
