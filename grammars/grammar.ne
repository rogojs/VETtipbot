@{%
const moo = require("moo");

// Simplistic grammar definition, semantics are left for another level
let grammarDefinition = {
  operator: /[@|!][a-z]+/,
  text: /[a-zA-Z0-9_\-\.]+/,
  whitespace: / /
};

const lexer = moo.compile(grammarDefinition);
%}

# Defining an external lexer 
@lexer lexer

# Nearley grammar syntax 
command -> (%operator ( %whitespace parameter ):* ) {% 
  (data) => { 
    return {
      command: data[0][0].value,
      parameters: data[0][1].map( (d) => { return d[1][0].value; } )
    };
  }
%}
parameter -> %text