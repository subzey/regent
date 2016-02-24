/*jshint node:true, esnext:true */
/*jshint eqnull:true */
'use strict';

const needsEscape = [']', '/', '\\', '\r', '\n', '\u2028', '\u2029'];
const needsTail = ['-', '^'];

class PoolItem {
	constructor(range) {
		this.range = range;
		this.fromCode = range.fromCode;
		this.toCode = range.toCode;
	}

	toString() {
		return regexpClassRepr(this.fromCode, this.toCode);
	}

	inspect() {
		return `/${this.toString()}/ (${this.fromCode} - ${this.toCode})`;
	}
}

Object.assign(PoolItem.prototype, {
	fromCode: undefined,
	toCode: undefined,
	ugliness: undefined,
	byteCount: undefined,
	count: undefined,
	stats: null
});

class CharRange {
	constructor(str) {
		// str is a plain unescaped code string
		this._ranges = getCharRanges(str);
		this._poolCache = Object.create(null);
	}

	direct() {
		return this._ranges;
	}

	inverse() {
		if (!this._inverseRanges) {
			this._inverseRanges = inverseRanges(this._ranges);
		}
		return this._inverseRanges;
	}

	_pool(quote) {
		if (!this._poolCache[quote]) {
			this._poolCache[quote] = generatePool(this.inverse(), quote, {});
		}
		return this._poolCache[quote];
	}

	allocate(number, quote) {
		// return {
		// 	body: '[a-c]',
		// 	tokens: ['a', 'b', 'c']
		// }
	}
}

const getCharRanges = (str) => {
	const ranges = [];
	const distinctChars = Array.from(new Set(str)).sort();

	for (let character of distinctChars) {
		let charCode = character.charCodeAt(0);

		if (ranges.length && charCode === ranges[ranges.length - 1].toCode + 1) {
			ranges[ranges.length - 1].toCode = charCode;
		} else {
			ranges.push({
				fromCode: charCode,
				toCode: charCode,
			});
		}
	}

	return ranges;
};

const inverseRanges = (ranges) => {
	let fromCode = 0;
	const inverseRanges = [];

	for (let range of ranges) {
		if (fromCode !== range.fromCode) {
			inverseRanges.push({
				fromCode: fromCode,
				toCode: range.fromCode - 1
			});
		}
		fromCode = range.toCode + 1;
	}
	inverseRanges.push({
		fromCode: fromCode,
		toCode: 0xFFFF
	});

	return inverseRanges;
};


const utf8ByteCount = require('./utf8').byteCount;
const characterUgliness = require('./utf8').characterUgliness;

let regexpClassRepr = (fromCode, toCode) => {
	if (fromCode === toCode) {
		return regexpClassChar(fromCode);
	} else {
		return regexpClassChar(fromCode) + '-' + regexpClassChar(toCode);
	}
};

let regexpClassChar = (charCode) => {
	let character = String.fromCharCode(charCode);
	if (character === ']' || character === '/' || character === '\\') {
		return '\\' + character;
	}
	if (character === '\r') {
		return '\\r';
	}
	if (character === '\n') {
		return '\\n';
	}
	return character;
};

const _lessUglyPoolItems = (poolItem) => {
	const alternatives = [];

	let fromCode = poolItem.fromCode;
	let toCode = poolItem.toCode;

	let fromUgliness = characterUgliness(fromCode);
	let toUgliness = characterUgliness(toCode);

	let lastUgliness = Math.max(fromUgliness, toUgliness);

	while (lastUgliness > 0 && fromCode < toCode) {
		if (toUgliness > fromUgliness) {
			toCode--;
			toUgliness = characterUgliness(toCode);
		} else {
			fromCode++;
			fromUgliness = characterUgliness(fromCode);
		}

		let ugliness = Math.max(fromUgliness, toUgliness);

		if (ugliness < lastUgliness) {
			alternatives.push(
				Object.assign(
					new PoolItem(poolItem.range),
					{
						fromCode: fromCode,
						toCode: toCode,
						ugliness: ugliness
					}
				)
			);
			lastUgliness = ugliness;
		}
	}

	return alternatives;
};

const _lessWordyPoolItems = (poolItem) => {
	const alternatives = [];

	if (poolItem.fromCode >= poolItem.toCode) {
		// nothing to do here
		return alternatives;
	}

	let fromBreakPoints = [];
	let minFromByteCount = +Infinity;

	// Search for charcodes with less bytes
	for (let i = poolItem.fromCode; i < poolItem.toCode; i++) {
		let byteCount = utf8ByteCount(regexpClassChar(i));

		if (byteCount < minFromByteCount) {
			minFromByteCount = byteCount;
			fromBreakPoints.push(i); // Must be executed at least once!
		}

		if (byteCount === 1) {
			// Exit early
			break;
		}

		if (byteCount === 2 && i >= 0x0080) {
			// Exit early
			break;
		}

		if (byteCount === 3 && i >= 0x0800) {
			// Exit early
			break;
		}
	}

	let toBreakPoints = [];
	let minToByteCount = +Infinity;

	for (let i = poolItem.fromCode; i > poolItem.fromCode; i--) {
		let byteCount = utf8ByteCount(regexpClassChar(i));

		if (byteCount < minToByteCount) {
			minToByteCount = byteCount;
			toBreakPoints.push(i);  // Must be executed at least once!
		}

		if (byteCount === 1) {
			// Exit early
			break;
		}

		if (byteCount === 2 && i >= 0x0080) {
			// Fast forward
			i = 0x0080;
			continue;
		}

		if (byteCount === 2 && i >= 0x0800) {
			// Fast forward
			i = 0x0800;
			continue;
		}
	}


	// Now pick all the combinations based on breakpoints
	for (let i = 0; i < fromBreakPoints.length; i++) {
		let fromCode = fromBreakPoints[i];
		for (let j = 0; j < toBreakPoints.length; j++) {
			let toCode = toBreakPoints[j];

			if (i === 0 && j === 0) {
				// We don't need to duplicate original entry
				continue;
			}

			if (toCode <= fromCode) {
				// We don't need many 1-char ranges
				// or invalid ranges
				continue;
			}

			alternatives.push(Object.assign(
				new PoolItem(poolItem.range),
				{
					fromCode: fromCode,
					toCode: toCode
				}
			));
		}
	}

	// Append a 1-char range
	alternatives.push(Object.assign(
		new PoolItem(poolItem.range),
		{
			fromCode: fromBreakPoints[fromBreakPoints.length - 1],
			toCode: fromBreakPoints[fromBreakPoints.length - 1]
		}
	));

	for (let newPoolItem of alternatives) {
		newPoolItem.byteCount = utf8ByteCount(newPoolItem.toString());
	}

	return alternatives;
};

const generatePool = (ranges, options) => {
	if (!options) {
		options = {};
	}

	// This character need to be escaped on string generation
	// So it should be count as 2 bytes internally
	let quoteCharCode = quote.charCodeAt(0);

	// Initial pool is exactly mapped to ranges
	const pool = ranges.map(
		range => new PoolItem(range)
	);

	// Expand pool with variats and add some info
	for (let poolChanged = true, killswitchCount = 100; poolChanged; ) {
		if (!poolChanged) {
			break;
		} else {
			poolChanged = false;
		}

		if (killswitchCount-- < 0) {
			throw new Error('killswitch: too many iterations');
		}

		if (!options.skipUgliness) {
			// Try to stay within readable ASCII
			for (let i = pool.length; i--; ){ // for .. of may cause infinite loop
				let poolItem = pool[i];
				if (poolItem.ugliness != null) {
					continue;
				}

				let fromUgliness = characterUgliness(poolItem.fromCode);
				let toUgliness = characterUgliness(poolItem.toCode);

				poolItem.ugliness = Math.max(fromUgliness, toUgliness);
				if (poolItem.ugliness > 0) {
					for (let item of _lessUglyPoolItems(poolItem)) {
						pool.push(item);
						poolChanged = true;
					}
				}
			}
		}

		if (true) {
			// Try to get range with shorter class representation
			for (let i = pool.length; i--; ){
				let poolItem = pool[i];
				if (poolItem.byteCount != null) {
					continue;
				}

				poolItem.byteCount = utf8ByteCount(poolItem.toString());

				for (let item of _lessWordyPoolItems(poolItem)) {
					pool.push(item);
					poolChanged = true;
				}
			}
		}
	}

	// Add more stats
	for (let poolItem of pool) {
		// Count
		poolItem.count = poolItem.toCode - poolItem.fromCode;

		// Exact char stats
	}


	return pool;
};

exports.CharRange = CharRange;


