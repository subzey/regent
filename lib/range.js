/*jshint node:true, esnext:true */
'use strict';

class BasicRange {}
Object.assign(BasicRange.prototype, {
	special: false,
});

class Range extends BasicRange {
	constructor(from, to) {
		super();
		if (from > to) {
			throw new RangeError('invalid range');
		}
		this.from = +from;
		this.to = +to;
	}
	inspect() {
		return `[Range ${this.from}-${this.to}]`;
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
	inspect() {
		return `[SpecialRange ${this.str}]`;
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
			new Range(0x00, 0x09),
			new Range(0x0B, 0x0C),
			new Range(0x0E, 0x2027),
			new Range(0x202A, 0xFFFF)
		],
		notInCharClass: true,
	});

	// Something that is completely inverse to dot. Not a real char class
	const specialDotInverse = Object.assign(new SpecialRange(), {
		str: undefined,
		subranges: [
			new Range(0x0A, 0x0A),
			new Range(0x0D, 0x0D),
			new Range(0x2028, 0x2029)
		],
		notInCharClass: true,
	});

	specialDot.inverse = specialDotInverse;
	specialDotInverse.inverse = specialDot;


	// /\d/
	const specialDigits = Object.assign(new SpecialRange(), {
		str: '\\d',
		subranges: [
			new Range(0x30, 0x39)
		]
	});

	// /\D/
	const specialDigitsInverse = Object.assign(new SpecialRange(), {
		str: '\\D',
		subranges: [
			new Range(0x00, 0x2F),
			new Range(0x3A, 0xFFFF)
		]
	});

	specialDigits.inverse = specialDigitsInverse;
	specialDigitsInverse.inverse = specialDigits;

	// /\w/
	const specialAlphanumeric = Object.assign(new SpecialRange(), {
		str: '\\w',
		subranges: [
			new Range(0x30, 0x39),
			new Range(0x41, 0x5A),
			new Range(0x5F, 0x5F),
			new Range(0x61, 0x7A)
		]
	});

	// /\W/
	const specialAlphanumericInverse = Object.assign(new SpecialRange(), {
		str: '\\W',
		subranges: [
			new Range(0x00, 0x2F),
			new Range(0x3A, 0x40),
			new Range(0x5B, 0x5E),
			new Range(0x60, 0x60),
			new Range(0x7B, 0xFFFF)
		]
	});

	specialAlphanumeric.inverse = specialAlphanumericInverse;
	specialAlphanumericInverse.inverse = specialAlphanumeric;

	// /\s/
	const specialWhitespace = Object.assign(new SpecialRange(), {
		str: '\\s',
		subranges: [
			new Range(0x09, 0x0D),
			new Range(0x20, 0x20),
			new Range(0xA0, 0xA0),
			new Range(0x1680, 0x1680),
			new Range(0x180E, 0x180E),
			new Range(0x2000, 0x200A),
			new Range(0x2028, 0x2029),
			new Range(0x202F, 0x202F),
			new Range(0x205F, 0x205F),
			new Range(0x3000, 0x3000),
			new Range(0xFEFF, 0xFEFF)
		]
	});

	// /\S/
	const specialWhitespaceInverse = Object.assign(new SpecialRange(), {
		str: '\\S',
		subranges: [
			new Range(0x00, 0x08),
			new Range(0x0E, 0x1F),
			new Range(0x21, 0x9F),
			new Range(0xA1, 0x167F),
			new Range(0x1681, 0x180D),
			new Range(0x180F, 0x1FFF),
			new Range(0x200B, 0x2027),
			new Range(0x202A, 0x202E),
			new Range(0x2030, 0x205E),
			new Range(0x2060, 0x2FFF),
			new Range(0x3001, 0xFEFE),
			new Range(0xFF00, 0xFFFF)
		]
	});

	exports.specialRanges = [
		specialAlphanumeric,
		specialAlphanumericInverse,
		specialDigits,
		specialDigitsInverse,
		specialWhitespace,
		specialWhitespaceInverse,
		specialDot,
	];
}

exports.Range = Range;
exports.SpecialRange = SpecialRange;
