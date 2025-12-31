const fs = require('fs');
const p = 'tmp_full_paste.csv';
let s = fs.readFileSync(p,'utf8');
const before = s.length;
// Replace occurrences like ..."...":"2,100.00"  -> ..."...","2,100.00"
// Only when the sequence is a closing quote, colon, opening quote followed by a digit
s = s.replace(/"\:"(?=\d)/g, '","');
fs.writeFileSync(p,s,'utf8');
console.log('Fixed characters delta:', before - s.length);
