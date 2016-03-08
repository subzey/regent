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

	// DEBUG
	if (neg) {
		console.log('Checking validity...');
		for (let r of neg) {
			let reStr = '/' + require('./regexpclass').serializeRanges(r, true) + '/';
			try {
				let re = eval(reStr);
				if (re.test(str)) {
					console.error('regexp fail', reStr, str);
					console.error(r);
				}
			} catch (e) {
				console.error(reStr, e);
			};
		}
		console.log('Done');
	}
	//
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

	const specialRangesVariations = [];
	{
		const _recurse = (appliedRanges, depth) => {
			if (depth >= specialRanges.length) {
				specialRangesVariations.push(appliedRanges);
				return;
			}
			const range = specialRanges[depth];
			_recurse(appliedRanges, depth + 1);
			if (subtractRanges([range], appliedRanges).length === 0) {
				// There's no need to apply ranges that are fully contained
				return;
			}
			if (appliedRanges.some(comparedRange => comparedRange === range.inverse)) {
				// If we apply both range and its inverse,
				// then we'll out of free chars
				// for example, [^\w\W]
				return;
			}
			_recurse(appliedRanges.concat(range), depth + 1);
		};

		_recurse([], 0);
	}

	const retVal = [];

	for (let appliedSpecialRanges of specialRangesVariations) {
		let pool = subtractRanges(usedRanges, appliedSpecialRanges);
		let boundaries = [];
		for (let i = 0; i < pool.length; i++) {
			let range = pool[i];
			let prevRange = pool[i - 1] || {to: -1};
			let nextRange = pool[i + 1] || {from: 0x10000};
			boundaries.push({
				left: _getAlternativeBoundaries(range.from, prevRange.to + 1),
				right: _getAlternativeBoundaries(range.to, nextRange.from - 1),
			});
		}

		const _recurse = (appliedRanges, depth, merge) => {
			if (depth >= pool.length) {
				if (!merge) {
					retVal.push(appliedSpecialRanges.concat(appliedRanges));
					// process.stdout.write('\u001b[s\u001b[0J');
					// appliedSpecialRanges.map(v => console.log(v));
					// appliedRanges.map(v => console.log(v));
					// process.stdout.write('\u001b[u');
				}
				return;
			}
			let leftBoundaries = boundaries[depth].left;
			let rightBoundaries = boundaries[depth].right;
			if (merge) {
				appliedRanges = appliedRanges.slice();
				let prevRange = appliedRanges.pop();
				leftBoundaries = [prevRange.from];
			}

			for (let leftBoundary of leftBoundaries) {
				for (let rightBoundary of rightBoundaries) {
					if (rightBoundary < leftBoundary) {
						continue;
					}
					_recurse(appliedRanges.concat(new Range(leftBoundary, rightBoundary)), depth + 1);
				}
				_recurse(appliedRanges.concat(new Range(leftBoundary, rightBoundaries[0])), depth + 1, true);
			}

		}
		_recurse([], 0);
	}
	process.stdout.write('\u001b[0J');
	console.log(`Negative grind done (${retVal.length})`)

	return retVal;
};

const _getAlternativeBoundaries = (start, end) => {
	if (!isFinite(start) || start < 0 || start > 0xFFFF) {
		throw new RangeError('start is out of bounds');
	}
	if (!isFinite(end) || end < 0 || end > 0xFFFF) {
		throw new RangeError('end is out of bounds');
	}

	const charUgliness = require('./utf8').charUgliness;
	const byteCount = require('./utf8').byteCount;
	const escapeClassChar = require('./regexpclass').escapeClassChar;

	const retVal = [];
	let minByteCount = Infinity;
	let minUgliness = Infinity;

	const length = Math.abs(start - end);
	for (let i = 0; i <= length; i++) {
		let charCode;
		if (start < end) {
			charCode = start + i;
		} else {
			charCode = start - i;
		}

		let currentByteCount = byteCount(escapeClassChar(String.fromCharCode(charCode)));
		let currentUgliness = charUgliness(charCode);

		if (currentByteCount < minByteCount) {
			retVal.push(charCode);
			minByteCount = currentByteCount;
			minUgliness = currentUgliness;
		} else if (currentUgliness < minUgliness){
			retVal.push(charCode);
			minUgliness = currentUgliness;
		}
	}

	return retVal;
};

exports.getRangesFromString = getRangesFromString;
exports.inverseRanges = inverseRanges;
exports.isRangeContainedWithin = isRangeContainedWithin;
exports.isRangeIntersected = isRangeIntersected;
exports.subtractRanges = subtractRanges;
exports.grinder = grinder;