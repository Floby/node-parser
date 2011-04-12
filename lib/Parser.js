var EventEmitter = require('events').EventEmitter;
var sys = require('sys');
var assert = require('assert');

function Parser () {
    EventEmitter.apply(this);
}
sys.inherits(Parser, EventEmitter);
