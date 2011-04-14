# Synopsis
This module is basically a class that provides basics mechanisms for
parsing strings. It works with my [tokenizer](http://github.com/floby/node-tokenizer)
although it can be used pretty much with anything emitting tokens the same
way.
The parser work with a queue of functions. For each token the next function
in the queue is called.

# write you own parser

### tokenizer
Only one thing is required for the parser to work. This thing is a tokenizer
these concepts are very different and that is why they are implemented
separately. The easiest solution is to use my [tokenizer](http://github.com/floby/node-tokenizer)


## parser
The default behaviour upon receiving a new token is ignoring it. It prints
a warning when reaching EOF with the number of tokens that have been ignored.
However this is probably not what you want to do!

In order to parse what you need to parse you have to provide the parser
with the functions which will be called for each token. Let's call these
function handlers.
This can be achieved through configuration of the basic parser or
through inheritance.
    
    var Parser = require('parser');
    var util = require('util');
    var MyTokenizer = require('./MyTokenizer');

    function MyParser() {
        // MyTokenizer is the tokenizer we configured
        // but it's not the subject of this module
        Parser.apply(this, new MyTokenizer());

        // override the default behaviour
        this.defaultHandler(this.default);

        // specify the function that will be called on the first token
        this.initialHander(this.initial);
    }
    util.inherits(MyParser, Parser);

    /**
     * Of course you will have to define these function somewhere
     */

this is very theorical but you can have a look at what is in the example 
folder

## Handlers
Handlers are just javascript functions accepting the following arguments
* `token` the actual token which emitted by the tokenizer
* `type` the type of this token (i.e. `'number'`, `'whitespace'`, `'word'`)
* `next` a function to specify what needs to be called on the next token(s)

returning `true` from a handler causes the same token to be reemitted
to the next handler.

### Handlers utilities
there are a few handlers factories provided by this module.

* `checkType(type)` returns a handler that only checks the type of the
token without doing anything so the same token is pass down to the next
handler
* `expect(type)` returns a handler that checks for the specified type
and consumes the token
* `list(separator, element, end)` returns a handler expanding to the
handlers needed to parse a list of elements able to be parsed by `element`
and separated by tokens of type `separator`. The list should end by a
token of type `end`

# project
## TODOs
* more robustness / better error handling
* features requests
* Support for asynchronous handlers
* allow for complex separator an ending tokens for handler utilities

## Features requests / bugs
If you'd like the parser to do something that it doesn't do or want to report
a bug please use the github issue tracker on [github](http://github.com/floby/node-parser)

## fork / patches / pull requests
You are very welcome to send patches or pull requests
