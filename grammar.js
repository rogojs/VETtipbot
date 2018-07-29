// Generated automatically by nearley, version 2.15.0
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

const moo = require("moo");

let grammarDefinition = {
  operator: /[@|!][a-z]+/,
  text: /[a-zA-Z0-9_\-\.]+/,
  whitespace: / /
};

const lexer = moo.compile(grammarDefinition);
var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "command$subexpression$1$ebnf$1", "symbols": []},
    {"name": "command$subexpression$1$ebnf$1$subexpression$1", "symbols": [(lexer.has("whitespace") ? {type: "whitespace"} : whitespace), "parameter"]},
    {"name": "command$subexpression$1$ebnf$1", "symbols": ["command$subexpression$1$ebnf$1", "command$subexpression$1$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "command$subexpression$1", "symbols": [(lexer.has("operator") ? {type: "operator"} : operator), "command$subexpression$1$ebnf$1"]},
    {"name": "command", "symbols": ["command$subexpression$1"], "postprocess":  
        (data) => { 
          return {
            command: data[0][0].value,
            parameters: data[0][1].map( (d) => { return d[1][0].value; } )
          };
        }
        },
    {"name": "parameter", "symbols": [(lexer.has("text") ? {type: "text"} : text)]}
]
  , ParserStart: "command"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
