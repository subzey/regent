/*jshint node:true, esnext:true */
'use strict';

class BasicRange {}
Object.assign(BasicRange.prototype, {
	special: false,
});

class Range extends BasicRange {
	constructor(from, to) {
		this.from = +from;
		this.to = +to;
	}
}
Object.assign(Range.prototype, {
	from: undefined,
	to: undefined,
});

class SpecialRange extends BasicRange {
	toString() {
		return this.str;
	}
}
Object.assign(SpecialRange.prototype, {
	special: true,
	str: undefined,
	inverse: null,
	subranges: null,
	notInCharClass: false,
});

// Instances
{
	// /./
	const specialDot = Object.assign(new SpecialRange(), {
		str: '.',
		subranges: [
			new BasicRange(0x00, 0x09),
			new BasicRange(0x0B, 0x0C),
			new BasicRange(0x0E, 0x2027),
			new BasicRange(0x2029, 0xFFFF)
		],
		notInCharClass: true,
	});

	// Something that is completely inverse to dot. Not a real char class
	const specialDotInverse = Object.assign(new SpecialRange(), {
		str: '[\\r\\n\\\u2028\\\u2028]',
		subranges: [
			new BasicRange(0x0A, 0x0A),
			new BasicRange(0x0D, 0x0D),
			new BasicRange(0x2028, 0x2029)
		],
		notInCharClass: true,
	});

	specialDot.inverse = specialDotInverse;
	specialDotInverse.inverse = specialDot;


	// /\d/
	const specialDigits = Object.assign(new SpecialRange(), {
		str: '\\d',
		subranges: [
			new BasicRange(0x30, 0x39)
		]
	});

	// /\D/
	const specialDigitsInverse = Object.assign(new SpecialRange(), {
		str: '\\D',
		subranges: [
			new BasicRange(0x00, 0x2F),
			new BasicRange(0x3A, 0xFFFF)
		]
	});

	specialDigits.inverse = specialDigitsInverse;
	specialDigitsInverse.inverse = specialDigits;

	// /\w/
	const specialAlphanumeric = Object.assign(new SpecialRange(), {
		str: '\\w',
		subranges: [
			new BasicRange(0x30, 0x39),
			new BasicRange(0x41, 0x5A),
			new BasicRange(0x5F, 0x5F),
			new BasicRange(0x61, 0x7A)
		]
	});

	// /\W/
	const specialAlphanumericInverse = Object.assign(new SpecialRange(), {
		str: '\\W',
		subranges: [
		]
	});
}