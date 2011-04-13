var EventEmitter = require('events').EventEmitter;
var sys = require('sys');
var assert = require('assert');

function makeIgnore(number) {
    return function ignore(token, type, next) {
        if(type === 'eof') {
            console.warn('ignored %d tokens', number);
            return;
        }
        next(makeIgnore(number+1));
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

Parser.prototype.initialHander = function initialHander(h) {
    // h is the first handler in the queue, this function must be
    // called in subclasses constructors
    if(typeof h === 'handler') {
        for (var i = 0; i < h.length; ++i) {
            this.initialHander(h[i]);
        };
        return;
    }
    assert.equal(typeof h, 'function');
    this._queue.unshift(h);
};

Parser.prototype.defaultHandler = function defaultHandler(h) {
    function DEFAULT(token, type, next) {
        if(type === 'eof') {
            this._reachedEnd();
            return;
        }
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
    if(!this._haveDefault) this.defaultHandler(makeIgnore(0));
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
