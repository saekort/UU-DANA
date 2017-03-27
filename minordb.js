'use strict'


// fetch data once !
if(!database)
{
  var database = require('./minor_data/database.json');
  //console.log('Found #: ' + database.length);
}

function setcompare(val, strategy)
{
  // for startperiod
  if(Array.isArray(val))
  {
    var stdcompare = function(haystack,needle) {
      var cntperiods = 0;
      for(var j = 0; j < needle.length; j++)
        if(haystack.includes(needle[j])) cntperiods++;
      return cntperiods == needle.length;
    }
    return stdcompare;
  }

  if(strategy == 'absolute')
  {
    var stdcompare = function(a,b) {
      return a == b;
    }
    return stdcompare;
  }

  // default strategy is: contains
  var stdcompare = function(a,b) {
    return a.toLowerCase().includes( b.toLowerCase() );
  }
  return stdcompare;
}

module.exports = {

  countMinors: function(crit) {

    if(crit)
    {
      return this.findMinors(crit).length;     
    }
    return database.length;
  },

  findMinors: function(crit, strat) {
    var ids = [];
    var key;
    var value;
    if(crit)
    {
      for(var i = 0; i < database.length; i++)
      {
        var cntmatches = 0;
        for(key in crit)
        {
          value = database[i][key];

          if(!strat) strat = 'default';
          var compare = setcompare(value, strat);
          if( compare(value, crit[key]) ) cntmatches++;
        }
        if(cntmatches == Object.keys(crit).length) ids.push(i);
      } 
    }
    return ids;
  },
  getMinor: function(idx) {
    if(idx < 0) return {};
    if(idx >= database.length) return {};
    return database[idx];
  },
  getAreas: function() {
    // Even snel zo. 
    var gebieden = 
      ['Health and life sciences'
      ,'Social and behavioural sciences'
      ,'Law, economics and governance'
      ,'Earth and sustainability'
      ,'Information technology'
      ,'Nature'
      ,'Art, culture and history'
      ,'Language, literature and communication'
      ,'Religion, philosophy and ethics '
      ];
    return gebieden;
  },
  baseUrl: function() {
    return 'https://students.uu.nl';
  }

}
