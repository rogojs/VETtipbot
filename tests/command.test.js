/* global describe it */
const { expect } = require('chai');
const command = require('../parsers/command').parse;

describe('command parser', () => {
  describe('@register command', () => {
    it('takes two arguments', (done) => {
      command('@register', {}, (err) => {
        expect(err).to.have.property('message');
        expect(err.message).to.have.string('Not enough non-option arguments');
        done();
      });
    });
    it('does not take one argument', (done) => {
      command('@register discord', {}, (err) => {
        expect(err).to.be.an('object');
        done();
      });
    });
    it('does not take three arguments', (done) => {
      command('@register discord is a strange place', {}, (err) => {
        expect(err).to.be.an('object');
        done();
      });
    });
    it('allows reddit as a valid source', (done) => {
      command('@register reddit vetbot', {}, (err) => {
        expect(err).to.be.null;
        done();
      });
    });
    it('does not only allow twitter as a valid source', (done) => {
      command('@register twitter vetbot', {}, (err) => {
        expect(err).to.be.an('object');
        done();
      });
    });
    it('does not only allow discord as a valid source', (done) => {
      command('@register discord vetbot', {}, (err) => {
        expect(err).to.be.an('object');
        done();
      });
    });
    it('parses a source for the command', (done) => {
      command('@register reddit reddituser', {}, (err, argv) => {
        expect(argv).to.have.property('source');
        expect(argv.source).to.equal('reddit');
        done();
      });
    });
    it('parses a username for the command', (done) => {
      command('@register reddit reddituser', {}, (err, argv) => {
        expect(argv).to.have.property('username');
        expect(argv.username).to.equal('reddituser');
        done();
      });
    });
  });
});
