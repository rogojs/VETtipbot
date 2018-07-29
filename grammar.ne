@{%
const moo = require("moo");

let grammarDefinition = {
  operator: /[@|!][a-z]+/,
  text: /[a-zA-Z0-9_\-\.]+/,
  whitespace: / /
};

const lexer = moo.compile(grammarDefinition);
%}

@lexer lexer

# command -> (%preprocessor %keyword ( %whitespace parameter ):* ) {% 
# (data) => { 
#    return { 
#      command: data[0][0][1]["value"],
#      parameters: data[0][0][2].map( (d) => { return d[1][0].value; } )
#    };
#  }
# %}
# parameter -> %text | %number

command -> (%operator ( %whitespace parameter ):* ) {% 
  (data) => { 
    return {
      command: data[0][0].value,
      parameters: data[0][1].map( (d) => { return d[1][0].value; } )
    };
  }
%}
parameter -> %text