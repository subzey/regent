/*jshint node:true, esnext:true */
'use strict';

let escapeChar = (character) => {
	switch (character) {
		case '\r':
			return '\\r';
		case '\n':
			return '\\n';
		case '$':
		case '(':
		case ')':
		case '*':
		case '+':
		case '.':
		case '/':
		case '?':
		case '[':
		case '\\':
		// ']' does not need to be escaped
		case '^':
		case '{':
		case '|':
		case '}':
		case '\u2028':
		case '\u2029':
			return '\\' + character;
		default:
			return character;
	}
};

exports.escapeChar = escapeChar;