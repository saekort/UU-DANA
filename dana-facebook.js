'use strict';

// Messenger API integration example
// We assume you have:
// * a Wit.ai bot setup (https://wit.ai/docs/quickstart)
// * a Messenger Platform setup (https://developers.facebook.com/docs/messenger-platform/quickstart)
// You need to `npm install` the following dependencies: body-parser, express, request.
//
// 1. npm install body-parser express request
// 2. Download and install ngrok from https://ngrok.com/download
// 3. ./ngrok http 8445
// 4. WIT_TOKEN=your_access_token FB_APP_SECRET=your_app_secret FB_PAGE_TOKEN=your_page_token node examples/messenger.js
// 5. Subscribe your page to the Webhooks using verify_token and `https://<your_ngrok_io>/webhook` as callback URL.
// 6. Talk to your bot on Messenger!

const bodyParser = require('body-parser');
const crypto = require('crypto');
const express = require('express');
const fetch = require('node-fetch');
const request = require('request');
const finalhandler = require('finalhandler')
const serveStatic = require('serve-static')
const path = require('path');

const serve = serveStatic('public', {'index': ['index.html']});

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

let Wit = null;
let log = null;
try {
  // if running from repo
  Wit = require('../').Wit;
  log = require('../').log;
} catch (e) {
  Wit = require('node-wit').Wit;
  log = require('node-wit').log;
}

// Webserver parameter
const PORT = process.env.PORT || 8445;
const REDIRECT_PORT = process.env.REDIRECT_PORT || 8480;

// Wit.ai parameters
const WIT_TOKEN = process.env.WIT_TOKEN || 'TEMP';

// Messenger API parameters
const FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN || 'TEMP';
if (!FB_PAGE_TOKEN) { throw new Error('missing FB_PAGE_TOKEN') }
const FB_APP_SECRET = process.env.FB_APP_SECRET || 'TEMP';
if (!FB_APP_SECRET) { throw new Error('missing FB_APP_SECRET') }

let FB_VERIFY_TOKEN = null;
crypto.randomBytes(8, (err, buff) => {
  if (err) throw err;
  FB_VERIFY_TOKEN = buff.toString('hex');
  console.log(`/webhook will accept the Verify Token "${FB_VERIFY_TOKEN}"`);
});

// ----------------------------------------------------------------------------
// Messenger API specific code

// See the Send API reference
// https://developers.facebook.com/docs/messenger-platform/send-api-reference

const fbMessage = (id, text) => {
  const body = JSON.stringify({
    recipient: { id },
    message: { text },
  });
  const qs = 'access_token=' + encodeURIComponent(FB_PAGE_TOKEN);
  return fetch('https://graph.facebook.com/me/messages?' + qs, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body,
  })
  .then(rsp => rsp.json())
  .then(json => {
    if (json.error && json.error.message) {
      throw new Error(json.error.message);
    }
    return json;
  });
};

// ----------------------------------------------------------------------------
// Wit.ai bot specific code

// This will contain all user sessions.
// Each session has an entry:
// sessionId -> {fbid: facebookUserId, context: sessionState}
const sessions = {};

const findOrCreateSession = (fbid) => {
  let sessionId;
  // Let's see if we already have a session for the user fbid
  Object.keys(sessions).forEach(k => {
    if (sessions[k].fbid === fbid) {
      // Yep, got it!
      sessionId = k;
    }
  });
  if (!sessionId) {
    // No session found for user fbid, let's create a new one
    sessionId = new Date().toISOString();
    sessions[sessionId] = {fbid: fbid, context: {}};
  }
  return sessionId;
};

// Our bot actions
const actions = {
  send({sessionId}, {text}) {
    // Our bot has something to say!
    // Let's retrieve the Facebook user whose session belongs to
    const recipientId = sessions[sessionId].fbid;
    if (recipientId) {
      // Yay, we found our recipient!
      // Let's forward our bot response to her.
      // We return a promise to let our bot know when we're done sending
      return fbMessage(recipientId, text)
      .then(() => null)
      .catch((err) => {
        console.error(
          'Oops! An error occurred while forwarding the response to',
          recipientId,
          ':',
          err.stack || err
        );
      });
    } else {
      console.error('Oops! Couldn\'t find user for session:', sessionId);
      // Giving the wheel back to our bot
      return Promise.resolve()
    }
  },
  // You should implement your custom actions here
  // See https://wit.ai/docs/quickstart
};

// Setting up our bot
const wit = new Wit({
  accessToken: WIT_TOKEN,
  actions,
  logger: new log.Logger(log.INFO)
});

// Starting our webserver and putting it all together
var fs = require('fs');
var http = require('http');
var https = require('https');

var ssl_privatekey = process.env.SSL_PRIVATEKEY || 'certs/privatekey.key';
var ssl_certificate = process.env.SSL_CERTIFICATE || 'certs/certificate.crt';
var ssl_chain = process.env.SSL_CHAIN || 'certs/chain.crt';

var privateKey = fs.readFileSync(ssl_privatekey);
var certificate = fs.readFileSync(ssl_certificate);
var chain = fs.readFileSync(ssl_chain);

var credentials = {key: privateKey, cert: certificate, ca: chain};

const app = express();

var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

app.use(({method, url}, rsp, next) => {
  rsp.on('finish', () => {
    console.log(`${rsp.statusCode} ${method} ${url}`);
  });
  next();
});
app.use(bodyParser.json({ verify: verifyRequestSignature }));

// Webhook setup
app.get('/webhook', (req, res) => {
  if (req.query['hub.mode'] === 'subscribe' &&
    req.query['hub.verify_token'] === FB_VERIFY_TOKEN) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(400);
  }
});

app.use(express.static(path.join(__dirname, 'public')));

// Message handler
app.post('/webhook', (req, res) => {
  // Parse the Messenger payload
  // See the Webhook reference
  // https://developers.facebook.com/docs/messenger-platform/webhook-reference
  const data = req.body;

  if (data.object === 'page') {
    data.entry.forEach(entry => {
      entry.messaging.forEach(event => {
        if (event.message && !event.message.is_echo) {
          // Yay! We got a new message!
          // We retrieve the Facebook user ID of the sender
          const sender = event.sender.id;

          // We retrieve the user's current session, or create one if it doesn't exist
          // This is needed for our bot to figure out the conversation history
          const sessionId = findOrCreateSession(sender);

          // We retrieve the message content
          const {text, attachments} = event.message;

          if (attachments) {
            // We received an attachment
            // Let's reply with an automatic message
            fbMessage(sender, 'Sorry I can only process text messages for now.')
            .catch(console.error);
          } else if (text) {
            // We received a text message

            // Let's forward the message to the Wit.ai Bot Engine
            // This will run all actions until our bot has nothing left to do
            wit.runActions(
              sessionId, // the user's current session
              text, // the user's message
              sessions[sessionId].context // the user's current session state
            ).then((context) => {
              // Our bot did everything it has to do.
              // Now it's waiting for further messages to proceed.
              console.log('Waiting for next user messages');

              // Based on the session state, you might want to reset the session.
              // This depends heavily on the business logic of your bot.
              // Example:
              // if (context['done']) {
              //   delete sessions[sessionId];
              // }

              // Updating the user's current session state
              sessions[sessionId].context = context;
            })
            .catch((err) => {
              console.error('Oops! Got an error from Wit: ', err.stack || err);
            })
          }
        } else {
          console.log('received event', JSON.stringify(event));
        }
      });
    });
  }
  res.sendStatus(200);
});

/*
 * Verify that the callback came from Facebook. Using the App Secret from
 * the App Dashboard, we can verify the signature that is sent with each
 * callback in the x-hub-signature field, located in the header.
 *
 * https://developers.facebook.com/docs/graph-api/webhooks#setup
 *
 */
function verifyRequestSignature(req, res, buf) {
  var signature = req.headers["x-hub-signature"];

  if (!signature) {
    // For testing, let's log an error. In production, you should throw an
    // error.
    console.error("Couldn't validate the signature.");
  } else {
    var elements = signature.split('=');
    var method = elements[0];
    var signatureHash = elements[1];

    var expectedHash = crypto.createHmac('sha1', FB_APP_SECRET)
                        .update(buf)
                        .digest('hex');

    if (signatureHash != expectedHash) {
      throw new Error("Couldn't validate the request signature.");
    }
  }
}

//------------------ SOCKET
var database = require(process.cwd() + '/minor_data/database.json');
var io = require('socket.io').listen(httpsServer);

io.on('connection', function (socket) {

  const actions_local = {
    send(request, response) {
      const {sessionId, context, entities} = request;
      const {text, quickreplies} = response;
      //console.log('@'+text);
      socket.emit('msg', { 'message' : text });
    },
    getListofTopicAreas({context, entities}) {
      var minordb = require('./minordb');
      var gebieden = minordb.getAreas();
      var gstr = gebieden.join('; ');
      context.gebieden = gstr;
      return context;
    },
    findMinorsinTopicArea({context, entities}) {
      //console.log(entities);
      var minordb = require('./minordb');
      var area = firstEntityValue(entities, 'topicArea');
      var mlist = minordb.findMinors({'gebied': area});
      var resp = [];
      for(var i = 0; i < mlist.length; i++)
      {
         resp.push( '#' + mlist[i] + ' ' + minordb.getMinor(i)['name']); 
      }
      context.minors = resp.join('; ');
      return context;
    },
    getMinorInfo({context, entities}) {
      var num = firstEntityValue(entities, 'number');
      if(num && Number.isInteger(num))
      {
        return this.getMinorId(num, {context, entities})
      }

      // Get info based on string...
      console.log(entities);
      var minors = firstEntityValue(entities, 'minor');
      var minordb = require('./minordb');
      var minor_a = minordb.findMinors({'name' : minors});
      if(minor_a.length == 1)
      {
        var minor = minordb.getMinor(minor_a[0]);
        context.custom = 'You can find more information about the minor ' + minor['name']
                       + ' here: ' + minordb.baseUrl() + minor['url'];
        return context;
      }
      if(minor_a.length > 1)
      {
        var resp = [];
        for(var i = 0; i < minor_a.length; i++)
        {
           resp.push( '#' + minor_a[i] + ' ' + minordb.getMinor(i)['name']); 
        }
        context.custom = 'I found ' + minor_a.length + ' minors: ' + resp.join('; ')
                       + '. Type #number as shorthand to select a minor.';
        return context;
      }
      return context;
    },
    getMinorId(num, {context, entities}) {
      console.log(entities);
      var minordb = require('./minordb');
      var minor = minordb.getMinor(num);
      context.minor_type = minor['name'];
      context.minor_url = minordb.baseUrl() + minor['url'];
      return context;
    },
    getMinorInfoOld({context, entities}) {
      var baseUrl = 'https://students.uu.nl';
      console.log(entities);
      var minor = firstEntityValue(entities, 'minor');
      var minorUrl = '';
      context.minor_type = minor;
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
      if(context.minor_url == '') 
      {
        context.minor_type = '[UNKNOWN MINOR]';
        context.minor_url = baseUrl;
        return context;
      }
      return context;
    },
    default({context, entities}) {
      //console.log(arguments);
      //console.log(arguments);
      //console.log(JSON.stringify(entities) );
      return context;
    }
  };

  var uuid = require('uuid');
  var sessionId = uuid.v1();

  //const client = new Wit({accessToken, actions_local});
  console.log(actions_local);
  const client = new Wit({
	  accessToken: WIT_TOKEN,
	  actions: actions_local,
	  logger: new log.Logger(log.INFO)
	});
  console.log(JSON.stringify(client));
  var sessions = {};
  sessions[sessionId] = { context: {} };
  
  socket.on('msg', function (data) {
    console.log(data);
    var r = client.runActions(
      sessionId,
      data.message,
      sessions[sessionId].context
    ).then((context) => {
      sessions[sessionId].context = context;
    }).catch((err) => {
      console.error('Error: ', err.stack || err);
      socket.emit('msg', {'message':'ERROR, DANA seems down'} );
    });
  });
});
//-------------------- END SOCKET

httpServer.listen(REDIRECT_PORT);
httpsServer.listen(PORT);
