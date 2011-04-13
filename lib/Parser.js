var EventEmitter = require('events').EventEmitter;
var sys = require('sys');
var assert = require('assert');

function makeIgnore(ignored) {
    return function ignore(token, type, next) {
        if(type === 'eof') {
            this._ignored = ignored;
            if(ignored.length) {
                console.warn('ignored %d tokens', ignored.length);
            }
            return;
        }
        ignored.push(token);
        next(makeIgnore(ignored));
    }
}

function Parser (tokenizer) {
    EventEmitter.apply(this);
    if(!tokenizer) throw Error("you must specify a tokenizer");
    this._tokenizer = tokenizer;
    this._queue = []; // queue of functions to be called on the next token
    //this._queue.push(makeIgnore(0));

    var self = this;
    this._tokenizer.on('end', function() {
        self._newToken('', 'eof');
    });
    this._tokenizer.on('token', function(token, type) {
        self._newToken(token, type);
    });
}
sys.inherits(Parser, EventEmitter);

Parser.prototype.initialHandler = function initialHandler(h) {
    // h is the first handler in the queue, this function must be
    // called in subclasses constructors
    if(typeof h === 'handler') {
        for (var i = 0; i < h.length; ++i) {
            this.initialHandler(h[i]);
        };
        return;
    }
    assert.equal(typeof h, 'function');
    this._queue.unshift(h);
};

Parser.prototype.defaultHandler = function defaultHandler(h) {
    function DEFAULT(token, type, next) {
        next(DEFAULT);
        h.apply(this, arguments);
    }
    //DEFAULT.toString = function toString() {
        //return "DEFAULT -> "+h;
    //}
    this._queue.push(DEFAULT);
    this._haveDefault = true;
};

Parser.prototype._newToken = function _newToken(token, type) {
    if(!this._haveDefault) this.defaultHandler(makeIgnore([]));
    // this is a really naive implementation
    var expand = false;
    do {
        var f = this._queue.shift();
        if(!f) {
            this.emit('error', new SyntaxError("no handler for "+token));
            return;
        }
        queue = this._queue;
        function next(fun) {
            queue.unshift.apply(queue, arguments);
        }
        expand = f.call(this, token, type, next);
    } while(expand === true)
    if(type === 'eof') {
        this._reachedEnd();
    }
};

Parser.prototype._reachedEnd = function _reachedEnd() {
    this.emit('end');
};

Parser.prototype.write = function write(data, encoding) {
    this._tokenizer.write(data, encoding);
};
Parser.prototype.end = function end(data, encoding) {
    this._tokenizer.end(data, encoding);
};

module.exports = Parser;

// common primitives
Parser.checkType = function checkType(type_to_check) {
    return function checkType(token, type, next) {
        assert.equal(type, type_to_check,
            "unexpect token "+token+"("+type+"). expected "+type_to_check);

        return true; // expand this
    }
}
Parser.expect = function expect(expected) {
    return function expecting(token, type, next) {
        assert.equal(type, expected,
                    "unexpected token "+token+". expecting "+expected);
    }
}
Parser.list = function list(separator, handler, end) {
    function expectSeparator(token, type, next) {
        if(type === separator) {
            // if we have or separator
            next(handler, expectSeparator);
            return;
        }
        if(type === end) {
            // if we reached the token ending the list
            // then our job is over
            return true;
        }
        // if it's something else then it is an unexpected token
        throw new SyntaxError("unexpected token "+token+". expecting "+separator);
    }
    return function listExpander(token, type, next) {
        next(handler, expectSeparator);
        return true;
    }
}
