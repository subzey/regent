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
	// Warning! Works only with sorted ranges array!
	const Range = require('./range').Range;
	let fromCode = 0;
	const inverseRanges = [];

	for (let range of ranges) {
		if (fromCode !== range.from) {
			inverseRanges.push(new Range(fromCode, range.from - 1));
		}
		fromCode = range.to + 1;
	}

	if (fromCode <= 0xFFFF) {
		inverseRanges.push(new Range(fromCode, 0xFFFF));
	}

	return inverseRanges;
};

const isRangeContainedWithin = (range, containerRanges) => {
	if (range.subranges) {
		for (let subrange of range.subranges) {
			if (!isRangeContainedWithin(subrange, containerRanges)){
				return false;
			}
		}
		return true;
	}

	let from = range.from;
	let to = range.to;

	let unwrappedContainerRanges = [];
	for (let containerRange of containerRanges) {
		if (containerRange.subranges) {
			for (let subrange of containerRange.subranges) {
				unwrappedContainerRanges.push(subrange);
			}
		} else {
			unwrappedContainerRanges.push(containerRange);
		}
	}

	for (let container of unwrappedContainerRanges) {
		if (to < container.from || from > container.to) {
			// Completely unrelated range
			continue;
		} else if (from >= container.from && to <= container.to) {
			// -XXXXXX-
			// XXXXXXXX
			return true;
		} else if (from >= container.from && to > container.to) {
			// --XXXXXX
			// XXXXXX--
			//   ->
			// ------XX
			// XXXXXX--
			from = container.to + 1;
		} else if (from < container.from && to <= container.to) {
			// XXXXXX--
			// --XXXXXX
			//   ->
			// XX------
			// --XXXXXX
			to = container.from - 1;
		}
	}

	return (to < from);
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

// Main entry point.
// Generates all available ranges combinations
// and the correspoinding regexp body
const grinder = (str) => {
	const Range = require('./range').Range;
	const specialRanges = require('./range').specialRanges;

	const usedRanges = getRangesFromString(str);
	const freeRanges = inverseRanges(usedRanges);

	const availableFreeRanges = specialRanges.filter((specialRange) => {
		// I.e, we cannot use /\w/ if "A" is used as a literal
		return !isRangeIntersected(specialRange, usedRanges);
	}).concat(freeRanges).sort((a, b) => b.size() - a.size());

	console.log(availableFreeRanges);



	const _sharedResultsArray = [];

	const _recurse = (state) => {
		let ptr = state.depth;
		if (ptr < availableFreeRanges.length) {
			let range = availableFreeRanges[ptr];
			// Recurse without actually changing anything
			_recurse({
				appliedFree: state.appliedFree,
				appliedUsed: state.appliedUsed,
				depth: state.depth + 1
			});

			if (!isRangeContainedWithin(range, state.appliedFree)){
				// Recurse with range applied
				_recurse({
					appliedFree: [range].concat(state.appliedFree),
					appliedUsed: state.appliedUsed,
					depth: state.depth + 1
				});
			}
		} else {
			if (state.appliedFree.length || state.appliedUsed.length) {
				_sharedResultsArray.push(state);
			}
		}
	};

	_recurse({
		appliedFree: [],
		appliedUsed: [],
		depth: 0
	});


	const serializeRangesComplex = require('./regexpclass').serializeRangesComplex;
	return _sharedResultsArray.map((state) => {
		return '/' + serializeRangesComplex(state.appliedFree, state.appliedUsed) + '/';
	});
};

exports.getRangesFromString = getRangesFromString;
exports.inverseRanges = inverseRanges;
exports.isRangeContainedWithin = isRangeContainedWithin;
exports.isRangeIntersected = isRangeIntersected;
exports.grinder = grinder;