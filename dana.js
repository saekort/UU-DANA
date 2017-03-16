'use strict';

let Wit = null;
let interactive = null;
try {
  // if running from repo
  Wit = require('../').Wit;
  interactive = require('../').interactive;
} catch (e) {
  Wit = require('node-wit').Wit;
  interactive = require('node-wit').interactive;
}

const accessToken = (() => {
  if (process.argv.length !== 3) {
    console.log('usage: node dana.js <wit-access-token>');
    process.exit(1);
  }
  return process.argv[2];
})();

const firstEntityValue = (entities, entity) => {
  const val = entities && entities[entity] &&
    Array.isArray(entities[entity]) &&
    entities[entity].length > 0 &&
    entities[entity][0].value
  ;
  if (!val) {
    return null;
  }
  return typeof val === 'object' ? val.value : val;
};

const actions = {
  send(request, response) {
    const {sessionId, context, entities} = request;
    const {text, quickreplies} = response;
    console.log('sending...', JSON.stringify(response));
  },
  getForecast({context, entities}) {
    var location = firstEntityValue(entities, 'location');
    if (location) {
      context.forecast = 'sunny in ' + location; // we should call a weather API here
      delete context.missingLocation;
    } else {
      context.missingLocation = true;
      delete context.forecast;
    }
    return context;
  },
  countminors({context, entities}) {
     var database = require(process.cwd() + '/minor_data/database.json');
     context.aantalminors = database.length;
     return(context);
  },
  getMinorInfo({context, entities}) {
	  var baseUrl = 'https://students.uu.nl';
	  console.log(entities);
	  var minor = firstEntityValue(entities, 'minor');
	  var minorUrl = '';
	  context.minor_type = minor;
	  
      var database = require(process.cwd() + '/minor_data/database.json');
	  
	  context.minor_url = '';
      var array_minor_matches = [];
      var text_minor_matches = '';
      if(minor != null)
      {
	      for(var i=0, j=0; i < database.length; i++) {

              // Find multiple matches
              if(database[i].name.toUpperCase().includes( minor.toUpperCase()))
              {
                  array_minor_matches.push( database[i].name );
                  j++;
                  if(j > 1) text_minor_matches = text_minor_matches + ", ";
                  text_minor_matches = text_minor_matches + "#" + j + " " +  database[i].name;

                  // Keep last url
			      context.minor_url = baseUrl + database[i].url;
              }
	      }
	  }
	  
      if( array_minor_matches.length > 1 )
      {
          context.minor_type = text_minor_matches;
		  context.minor_url = baseUrl;
	      return context;
      } 
	  if(context.minor_url == '') {
		  context.minor_type = '[UNKNOWN MINOR]';
		  context.minor_url = baseUrl;
	      return context;
	  }
	  return context;
	  
  }
};

const client = new Wit({accessToken, actions});
interactive(client);
