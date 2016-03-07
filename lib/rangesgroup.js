/*jshint node:true, esnext:true */
'use strict';

let getRangesFromString = (str) => {
	const Range = require('./range').Range;
	const ranges = [];
	const distinctChars = Array.from(new Set(str)).sort();

	let lastRange = null;

	for (let character of distinctChars) {
		let charCode = character.charCodeAt(0);

		if (lastRange && lastRange.to === charCode -1) {
			lastRange.to = charCode;
		} else {
			lastRange = new Range(charCode, charCode);
			ranges.push(lastRange);
		}
	}

	return ranges;
};

const inverseRanges = (ranges) => {
	const Range = require('./range').Range;
	return subtractRanges([new Range(0, 0xFFFF)], ranges);
};

const isRangeContainedWithin = (range, containerRanges) => {
	return subtractRanges([range], containerRanges).length === 0;
};

const isRangeIntersected = (range, intersectingRanges) => {
	if (range.subranges) {
		for (let subrange of range.subranges) {
			if (isRangeIntersected(subrange, intersectingRanges)){
				return true;
			}
		}
		return false;
	}

	let from = range.from;
	let to = range.to;

	for (let intersecting of intersectingRanges) {
		if (intersecting.subranges) {
			if (isRangeIntersected(range, intersecting.subranges)){
				return true;
			}
		} else if (
			to >= intersecting.from && from <= intersecting.to ||
			intersecting.to >= from && intersecting.from <= to
		) {
			return true;
		}
	}

	return false;
};

const flattenRanges = (ranges) => {
	let flattened = [];
	for (let range of ranges) {
		if (range.subranges) {
			for (let subrange of range.subranges) {
				flattened.push(subrange)
			}
		} else {
			flattened.push(range);
		}
	}
	return flattened;
}

const subtractRanges = (ranges, referenceRanges) => {
	// shrinks the provided range so that it doesn't intersect with
	// any from fererence ranges
	// subtractRanges([<10-20>], [<5-12>, <17-25>]) -> [<13-16>]
	// subtractRanges([<0-40>], [<5-12>]) -> [<0-4>, <13-40>]

	const Range = require('./range').Range;
	let retVal = flattenRanges(ranges);
	let flattenedRanges = flattenRanges(referenceRanges);

	for (let refRange of flattenedRanges) {
		for (let i = retVal.length; i--; ) {
			let range = retVal[i];

			if (refRange.from > range.to || refRange.to < range.from) {
				// Not intersecting
				continue;
			}

			retVal.splice(i, 1);

			if (range.to > refRange.to) {
				retVal.splice(i, 0, new Range(refRange.to + 1, range.to));
			}

			if (range.from < refRange.from) {
				retVal.splice(i, 0, new Range(range.from, refRange.from - 1));
			}
		}
	}
	return retVal;
};

// Main entry point.
// Generates all available ranges combinations
// and the correspoinding regexp body
const grinder = (str) => {
	const Range = require('./range').Range;
	const specialRanges = require('./range').specialRanges;

	const usedRanges = getRangesFromString(str);

	const neg = _grindNegative(usedRanges);

	for (let r of neg) {
		console.log(require('./regexpclass').serializeRanges(r, true));
	}
};

const _grindNegative = (usedRanges) => {
	const Range = require('./range').Range;
	const specialRanges = (require('./range').specialRanges
		.filter(
			(specialRange) => isRangeIntersected(specialRange, usedRanges)
		)
		.sort(
			(a, b) => b.size() - a.size()
		)
	);

	const pool = [...specialRanges, ...usedRanges];
	const retVal = [];

	const _recurse = (appliedRanges, depth, merge) => {
		if (depth >= pool.length) {
			if (!merge) {
				retVal.push(appliedRanges);
			}
			return;
		}
		let range = pool[depth];
		let subtraction = subtractRanges([range], appliedRanges);

		if (range.special) {
			// Recurse with not applied
			_recurse(appliedRanges, depth + 1);
			if (subtraction.length !== 0) {
				// Recurse with applied: only if not contained
				_recurse(appliedRanges.concat(range), depth + 1);
			}
			return;
		}

		let pickedRange;
		if (subtraction.length === 1) {
			pickedRange = subtraction[0];
		} else {
			pickedRange = range;
		}

		if (merge) {
			let prevRange = appliedRanges.pop();
			pickedRange = new Range(prevRange.from, pickedRange.to);
		}

		_recurse(appliedRanges.concat(pickedRange), depth + 1);
		_recurse(appliedRanges.concat(pickedRange), depth + 1, true);
	}
	_recurse([], 0);

	return retVal;
};

exports.getRangesFromString = getRangesFromString;
exports.inverseRanges = inverseRanges;
exports.isRangeContainedWithin = isRangeContainedWithin;
exports.isRangeIntersected = isRangeIntersected;
exports.subtractRanges = subtractRanges;
exports.grinder = grinder;