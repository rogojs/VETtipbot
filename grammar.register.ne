@{%
const moo = require("moo");

let grammarDefinition = {
  keyword: ['register']
};

const lexer = moo.compile(grammarDefinition);
%}

@lexer lexer

command -> (%keyword) {%
  (data) => { 
    return { 
      command: data[0][0][1]["value"])
    };
  }
%}
