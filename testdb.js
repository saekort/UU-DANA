
var minordb = require('./minordb');


var a = minordb.findMinors({'name':'aarde'});
console.log(a);

console.log('test str absolute comparison');
var a = minordb.findMinors({'name':'Global Asia'},'absolute');
console.log(a);

console.log('test count of gebied en url');
var a = minordb.countMinors({'gebied':'milieu','url':'geo'});
console.log(a);

console.log('test periods');
var a = minordb.findMinors({'name':'Aarde, klimaat en  leven (biogeologie)','startperiod':[2,3]});
console.log(a);

var a = minordb.findMinors({'name':'Aarde, klimaat en  leven (biogeologie)','startperiod':[9,3]});
console.log(a);

var a = minordb.findMinors({'name':'Aarde, klimaat en  leven (biogeologie)','startperiod':[3]});
console.log(a);
