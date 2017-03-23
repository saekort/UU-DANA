// Global (sorry) queueu van vraag/antwoord pairs
qa = [];

function showqalist( qa )
{
    console.log(JSON.stringify(qa));
    while( qa.length > 8 ) qa.shift();
    $("#msgs").empty();
    for( i = 0; i < qa.length; i++ )
    {
        // <br> blijkt nodig anders lopen vraag en antwoordregels over elkaar heen
    	var name = 'YOU:';
    	if(qa[i][0] == 'answer') {
    		name = 'DANA:';
    	}
        $("#msgs").append( "<li class=\"msg " + qa[i][0] + "\"><i class=\"fa fa-user\"></i> <b>" + name + "</b> " + qa[i][1] + "</li><li style=\"clear: both; list-style: none;\"></li>");
        window.scrollTo(0,document.body.scrollHeight);
    }
}

function addqalist( qa, type, msg )
{
    qa.push([type,msg]);
}

$(document).ready(function(){

	console.log('test');
    var socket = io();

    // Trigger welcome!
    socket.emit('msg', {message: 'hi'});

    $("#message").focus();

    $("#commandtext").submit( function( event ) {
        event.preventDefault();

        console.log('sup?');
        var msg = $("#message").val();
        if(msg)
        {
        	console.log('Emitting ' + {message: msg});
            socket.emit('msg', {message: msg});

            addqalist(qa,"question",msg);
            showqalist(qa);
            $("#message").val("");
        }
    });

    socket.on('msg', function(data){
    	console.log('sup?');
        addqalist(qa,"answer",data.message);
        showqalist(qa);
    });
});
