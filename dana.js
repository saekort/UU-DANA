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
  getMinorInfo({context, entities}) {
	  var baseUrl = 'https://students.uu.nl';
	  console.log(entities);
	  var minor = firstEntityValue(entities, 'minor');
	  var minorUrl = '';
	  context.minor_type = minor;
	  
	  var database = [
                  { url : "/beta/biologie/biologie-1" , name : "Biologie" }, 
                  { url : "/beta/biologie/structuurbiologie" , name : "Structuurbiologie"},
                  { url : "/beta/educatieve-minor-beta" , name : "Educatieve minor beta"},
                  { url : "/beta/farmacie-b/geneesmiddelonderzoek" , name : "Geneesmiddelonderzoek" },
                  { url : "/beta/geschiedenis-en-filosofie-van-de-natuurwetenschappen" , name : "Geschiedenis en Filosofie van de Natuurwetenschappen" }, 
                  { url : "/beta/informatica/computational-science" , name : "Computational Science" },
                  { url : "/beta/informatica/informatica" , name : "Informatica" }, 
                  { url : "/beta/informatica/informatica-voor-hbo-studenten" , name : "Informatica voor hbo-studenten" },
                  { url : "/beta/informatiekunde/informatiekunde-0" , name : "Informatiekunde" },
                  { url : "/beta/informatiekunde/organisatie-en-informatie-voor-hbo-studenten" , name : "Organisatie en informatie voor HBO-studenten" }, 
                  { url : "/beta/natuur-en-sterrenkunde/meteorologie-fysische-oceanografie-en-klimaat" , name : "Meteorologie, fysische oceanografie en klimaat" }, 
                  { url : "/beta/natuur-en-sterrenkunde/natuurkunde" , name : "Natuurkunde" },
                  { url : "/beta/scheikunde/nanomaterials" , name : "Nanomaterials" }, 
                  { url : "/beta/wiskunde/wiskunde-voor-informatici" , name : "Wiskunde voor informatici" }, 
                  { url : "/beta/wiskunde/wiskunde-voor-natuurkundigen" , name : "Wiskunde voor natuurkundigen" }, 
                  { url : "/beta/wiskunde/wiskunde-voor-niet-natuurkundigen" , name : "Wiskunde voor niet-natuurkundigen" },
                  { url : "/dgk/addiction" , name : "Addiction" }, 
                  { url : "/en/fss/health-behaviour-and-society" , name : "Health, Behaviour, and Society " }, 
                  { url : "/en/fss/methods-and-statistics-in-the-social-and-behavioural-sciences-methoden-en-technieken" , name : "Methods and Statistics in the Social and Behavioural Sciences (methoden en technieken)" }, 
                  { url : "/en/fss/social-neuroscience" , name : "Social Neuroscience" }, 
                  { url : "/en/fss/social-policies-in-contemporary-europe-new-inequalities-and-risks-spice", name : "Social Policies in Contemporary Europe: New inequalities and risks (SPiCE)" }, 
                  { url : "/en/geo/water-climate-and-ecosystems" , name : "Water, Climate and Ecosystems" }, 
                  { url : "/en/hum/comparative-media-studies" , name : "Comparative Media Studies" }, 
                  { url : "/en/hum/conflict-studies" , name : "Conflict Studies" },
                  { url : "/en/hum/creative-cities" , name : "Creative Cities" }, 
                  { url : "/en/hum/global-asia" , name : "Global Asia" }, 
                  { url : "/en/leg/economics-and-business-economics/business-economics" , name : "Business Economics" }, 
                  { url : "/en/leg/economics-and-business-economics/economics" , name : "Economics" },
                  { url : "/en/leg/economics-and-business-economics/entrepreneurship" , name : "Entrepreneurship" }, 
                  { url : "/en/node/351/atlantic-europe" , name : "Atlantic Europe" }, 
                  { url : "/en/node/351/english-language-and-culture" , name : "English Language and Culture" }, 
                  { url : "/en/node/351/ethics-in-modern-society" , name : "Ethics in Modern Society" }, 
                  { url : "/en/node/351/gender-studies" , name : "Gender Studies" }, 
                  { url : "/en/node/351/keltische-talen-en-cultuur" , name : "Keltische talen en cultuur" }, 
                  { url : "/en/node/351/postcolonial-studies" , name : "Postcolonial studies" }, 
                  { url : "/en/node/607/european-governance" , name : "European Governance" }, 
                  { url : "/fsw/algemene-sociale-wetenschappen-1" , name : "Algemene sociale wetenschappen" }, 
                  { url : "/fsw/arbeids-en-organisatiepsychologie" , name : "Arbeids- en Organisatiepsychologie" }, 
                  { url : "/fsw/arbeid-zorg-en-participatie" , name : "Arbeid, zorg en participatie" }, 
                  { url : "/fsw/beleidssociologie" , name : "Beleidssociologie" }, 
                  { url : "/fsw/burgerschap-identiteit-en-mondialisering" , name : "Burgerschap, Identiteit en Mondialisering" }, 
                  { url : "/fsw/cognitie" , name : "Cognitie" }, 
                  { url : "/fsw/culturele-diversiteit" , name : "Culturele diversiteit" }, 
                  { url : "/fsw/cultuur-communicatie-en-mediastudies" , name : "Cultuur, communicatie en mediastudies" }, 
                  { url : "/fsw/educatieve-minor-alfa" , name : "Educatieve minor alfa" }, 
                  { url : "/fsw/educatieve-minor-gamma" , name : "Educatieve minor gamma" },
                  { url : "/fsw/gehandicaptenzorg-en-kinderrevalidatie" , name : "Gehandicaptenzorg en kinderrevalidatie" }, 
                  { url : "/fsw/jeugd-en-criminaliteit" , name : "Jeugd en criminaliteit" },
                  { url : "/fsw/jeugdstudies-0" , name : "Jeugdstudies" }, 
                  { url : "/fsw/leerproblemen" , name : "Leerproblemen" }, 
                  { url : "/fsw/maatschappelijke-opvoedingsvraagstukken" , name : "Maatschappelijke opvoedingsvraagstukken" }, 
                  { url : "/fsw/multiculturele-samenleving" , name : "Multiculturele samenleving" }, 
                  { url : "/fsw/onderwijskunde-0" , name : "Onderwijskunde" }, 
                  { url : "/fsw/orthopedagogiek-0" , name : "Orthopedagogiek" }, 
                  { url : "/fsw/persoonlijkheid-en-relaties" , name : "Persoonlijkheid en relaties" }, 
                  { url : "/fsw/psychosociale-problemen" , name : "Psychosociale problemen" }, 
                  { url : "/fsw/research-en-development" , name : "Research en development" }, 
                  { url : "/fsw/sociaalwetenschappelijk-onderzoek" , name : "Sociaalwetenschappelijk onderzoek" },
                  { url : "/fsw/sociology-and-social-research" , name : "Sociology and Social Research" }, 
                  { url : "/fsw/sociology-contemporary-social-problems" , name : "Sociology: Contemporary Social Problems " }, 
                  { url : "/fsw/solidariteit-en-sociaal-kapitaal" , name : "Solidariteit en sociaal kapitaal" }, 
                  { url : "/fsw/sport-pedagogiek-en-beleid" , name : "Sport, pedagogiek en beleid" }, 
                  { url : "/geo/aw/aarde-klimaat-en-leven-biogeologie" , name : "Aarde, klimaat en  leven (biogeologie)" }, 
                  { url : "/geo/aw/aarde-water-en-milieu-geochemie" , name : "Aarde, water en milieu (geochemie)" }, 
                  { url : "/geo/aw/aardoppervlak-en-landvormen-fysische-geografie" , name: "Aardoppervlak en landvormen (fysische geografie)" }, 
                  { url : "/geo/aw/geologie-van-de-vaste-aarde" , name : "Geologie van de vaste aarde" }, 
                  { url : "/geo/aw/natuurkunde-van-de-vaste-aarde-geofysica" , name : "Natuurkunde van de vaste aarde (geofysica)" }, 
                  { url : "/geo/deltametropool-planningsvraagstukken-en-mobiliteit" , name: "Deltametropool: planningsvraagstukken en mobiliteit" }, 
                  { url : "/geo/duurzaam-ondernemen-en-innovatie" , name : "Duurzaam ondernemen en innovatie" }, 
                  { url : "/geo/duurzame-ontwikkeling" , name : "Duurzame ontwikkeling" }, 
                  { url : "/geo/entrepreneurship-in-life-sciences-and-health" , name : "Entrepreneurship in Life Sciences and Health" }, 
                  { url : "/geo/global-change" , name : "Global Change" }, 
                  { url : "/geo/globalisering-en-mondiale-ongelijkheid" , name : "Globalisering en mondiale ongelijkheid" }, 
                  { url : "/geo/innovatiewetenschap" , name : "Innovatiewetenschap (Innovation Science)" }, 
                  { url : "/geo/milieu-maatschappijwetenschappen-0" , name : "Milieu-maatschappijwetenschappen" },
                  { url : "/geo/milieu-natuurwetenschappen-0" , name : "Milieu-natuurwetenschappen" },
                  { url : "/geo/sgpl/development-geography" , name : "Development Geography" }, 
                  { url : "/geo/sgpl/economische-geografie" , name : "Economische geografie" }, 
                  { url : "/geo/sgpl/nationale-geo-informatie-minor" , name : "Nationale Geo-informatie minor" }, 
                  { url : "/geo/sgpl/planologie" , name : "Planologie" }, 
                  { url : "/geo/sgpl/sociale-geografie" , name : "Sociale geografie" }, 
                  { url : "/geo/sgpl/stadsgeografie" , name : "Stadsgeografie" }, 
                  { url : "/geo/sustainable-energy" , name : "Sustainable Energy" }, 
                  { url : "/gw/antieke-cultuur" , name : "Antieke cultuur" }, 
                  { url : "/gw/arabisch" , name : "Arabisch" }, 
                  { url : "/gw/archeologie" , name : "Archeologie" }, 
                  { url : "/gw/beeldcultuur-en-samenleving" , name : "Beeldcultuur en samenleving" }, 
                  { url : "/gw/brains-bodies-cognitie-en-emotie-in-de-geesteswetenschappen" , name: "Brains & Bodies: cognitie en emotie in de geesteswetenschappen"},
                  { url : "/gw/communicatie-en-informatiewetenschappen" , name : "Communicatie- en informatiewetenschappen" }, 
                  { url : "/gw/de-macht-en-onmacht-van-de-markt" , name : "De macht en onmacht van de markt" }, 
                  { url : "/gw/de-middellandse-zee-brug-en-kloof" , name : "De Middellandse zee: brug en kloof" }, 
                  { url : "/gw/de-sprekende-samenleving" , name : "De sprekende samenleving" }, 
                  { url : "/gw/digital-humanities" , name : "Digital Humanities" }, 
                  { url : "/gw/duitse-taal-en-cultuur-0" , name : "Duitse taal en cultuur" },
                  { url : "/gw/esthetica-filosofie-van-de-kunsten" , name : "Esthetica (filosofie van de kunsten)" }, 
                  { url : "/gw/franse-taal-en-cultuur-0" , name : "Franse taal en cultuur" },
                  { url : "/gw/game-studies" , name : "Game Studies" }, 
                  { url : "/gw/geschiedenis-0" , name : "Geschiedenis" }, 
                  { url : "/gw/geschiedenis-en-herinnering-in-de-digitale-wereld" , name : "Geschiedenis en herinnering in de digitale wereld" }, 
                  { url : "/gw/gouden-tijden-in-vroegmodern-europa" , name : "Gouden tijden in Vroegmodern Europa: conflict, competitie en creativiteit" }, 
                  { url : "/gw/griekse-taal-cultuur-in-de-europese-traditie" , name : "Griekse taal & cultuur in de Europese traditie" }, 
                  { url : "/gw/grote-werken-uit-de-literatuur" , name : "Grote werken uit de literatuur" }, 
                  { url : "/gw/het-goede-het-ware-het-schone" , name : "Het goede, het ware, het schone" }, 
                  { url : "/gw/internationale-betrekkingen" , name : "Internationale betrekkingen" }, 
                  { url : "/gw/islam" , name : "Islam" }, 
                  { url : "/gw/italiaanse-taal-en-cultuur-0" , name : "Italiaanse taal en cultuur" }, 
                  { url : "/gw/kunst-beleid-en-maatschappij" , name : "Kunst, beleid en maatschappij" }, 
                  { url : "/gw/kunstgeschiedenis-1" , name : "Kunstgeschiedenis" }, 
                  { url : "/gw/kunstmatige-intelligentie" , name : "Kunstmatige intelligentie" }, 
                  { url : "/gw/latijnse-taal-cultuur-in-de-europese-traditie" , name : "Latijnse taal & cultuur in de Europese traditie" }, 
                  { url : "/gw/literature-in-conflict" , name : "Literature in conflict" },
                  { url : "/gw/literatuur-en-levensbeschouwing" , name : "Literatuur en levensbeschouwing" }, 
                  { url : "/gw/literatuurwetenschap-0" , name : "Literatuurwetenschap" }, 
                  { url : "/gw/logopediewetenschap" , name : "Logopediewetenschap" }, 
                  { url : "/gw/middeleeuwen" , name : "Middeleeuwen" }, 
                  { url : "/gw/mnc" , name : "Media en cultuur" }, 
                  { url : "/gw/muziekwetenschap-1" , name : "Muziekwetenschap" }, 
                  { url : "/gw/nederlandse-cultuur" , name : "Nederlandse cultuur" }, 
                  { url : "/gw/nederlandse-taal-en-cultuur-1" , name : "Nederlandse taal en cultuur" }, 
                  { url : "/gw/politiek-tussen-nationale-staat-en-mondiale-samenleving" , name : "Politiek tussen nationale staat en mondiale samenleving" }, 
                  { url : "/gw/religie-in-het-publieke-domein" , name : "Religie in het publieke domein" }, 
                  { url : "/gw/religiestudies-0" , name : "Religiestudies" }, 
                  { url : "/gw/spaanse-taal-en-cultuur-0" , name : "Spaanse taal en cultuur" }, 
                  { url : "/gw/taalontwikkeling" , name : "Taalontwikkeling" }, 
                  { url : "/gw/taalwetenschap-0" , name : "Taalwetenschap" }, 
                  { url : "/gw/wat-is-de-mens" , name : "Wat is de mens?" }, 
                  { url : "/gw/wetenschapsgeschiedenis" , name : "Wetenschapsgeschiedenis" },
                  { url : "/rebo/bestuurs-en-organisatiewetenschap-algemeen" , name : "Bestuurs- en Organisatiewetenschap Algemeen" }, 
                  { url : "/rebo/criminologie-voor-studenten-rechtsgeleerdheid" , name : "Criminologie voor studenten Rechtsgeleerdheid" }, 
                  { url : "/rebo/crimonologie-voor-studenten-sociale-wetenschappen" , name: "Criminologie voor studenten Sociale Wetenschappen" }, 
                  { url : "/rebo/inleiding-in-het-recht" , name : "Inleiding in het recht " }, 
                  { url : "/rebo/sociaal-ondernemerschap" , name : "Sociaal Ondernemerschap" }, 
                  { url : "/rebo/theorie-van-het-recht" , name : "Theorie van het recht " }
	          ];
	  
	  context.minor_url = '';
	  
      if(minor != null)
      {
	      for(var i=0; i < database.length; i++) {
		      if(database[i].name.toUpperCase() == minor.toUpperCase()) {
			      context.minor_url = baseUrl + database[i].url;
		      }
	      }
	  }
	  
	  if(context.minor_url == '') {
		  context.minor_type = '[UNKNOWN MINOR]';
		  context.minor_url = baseUrl;
	  }
	  
//	  var result = database.filter(function(obj) {
//		  console.log(obj);
//		  return obj.name == minor;
//	  });
	  
//	  console.log(result);
	  
//	  switch(minor) {
//	  	case 'Addiction':
//	  		minorUrl = '/dgk/addiction';
//	  		break;
//	  	case 'Aarde, klimaat en  leven (biogeologie)' {
//	  	}
//	  	default:
//	  		context.minor_type = 'unknown';
//	  }
	  
//	  if(minor === 'Addiction') {
//		  minorUrl = '/dgk/addiction';
//	  } else if (minor === 'Aarde, klimaat en  leven (biogeologie)') {
//		  minorUrl = '/geo/aw/aarde-klimaat-en-leven-biogeologie';
//	  } else if (minor === 'Aarde, water en milieu (geochemie)') {
//		  minorUrl = '/geo/aw/aarde-water-en-milieu-geochemie';
//	  } else if (minor === 'Aardoppervlak en landvormen (fysische geografie)') {
//		  minorUrl = '/geo/aw/aardoppervlak-en-landvormen-fysische-geografie';
//	  } else if (minor === 'Algemene sociale wetenschappen') {
//		  minorUrl = '/fsw/algemene-sociale-wetenschappen-1';
//	  } else if (minor === 'Antieke cultuur') {
//		  minorUrl = '/gw/antieke-cultuur';
//	  } else if (minor === 'Arabisch') {
//		  minorUrl = '/gw/arabisch';
//	  } else if (minor === '') {
//		  minorUrl = '';
//	  } else {
//		  context.minor_type = 'unknown';
//	  }
	  
	  //context.minor_url = baseUrl + minorUrl;
	  
	  return context;
  }
};

const client = new Wit({accessToken, actions});
interactive(client);
