var CharRange = require('./lib/regexpbody').CharRange;

var cr = new CharRange('');
// console.log(cr.direct());
// console.log('\n');
console.log(cr._pool());