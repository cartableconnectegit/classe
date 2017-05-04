(function ()
{

    function getCookie( name )
    {
        var pattern = name + "=";
        var ca = document.cookie.split(';');
        for(var i = 0; i <ca.length; i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') {
                c = c.substring(1);
            }
            if (c.indexOf(pattern) == 0) {
                return c.substring(pattern.length,c.length);
            }
        }
        return "";
    };

    function getPayload ( type, params )
    {
        return JSON.stringify ( {
            type    : type,
            content : params
        } );
    };

    function _Chat ( UserService, serviceUrl )
    {
        var websocket        = undefined,
            messageReceived  = function (){},
            presenceReceived = function (){},
            archiveReceived  = function (){},
            chatReady        = function (){};

        function close ()
        {
            websocket.close();
        };

        function open ()
        {
            websocket = new SockJS( serviceUrl + '/chat' );

            websocket.onopen = function()
            {
                var payload = getPayload ( 'auth', {
                        id    : UserService.currentId (),
                        token : UserService.currentToken ()
                    } );

                websocket.send( payload );
                chatReady();
            };

            websocket.onmessage = function(e)
            {
                try {
                    var data = JSON.parse ( e.data );

                    if ( 'message' in data )
                    {
                        messageReceived ( data.message );
                    }
                    if ( 'status' in data )
                    {
                        presenceReceived ( data );
                    }
                    if ( 'archive' in data )
                    {
                        formatArchivedMessages ( data.archive );
                    }
                }
                catch ( e )
                {
                    console.log ( e );
                }
            };

            websocket.onclose = function()
            {
                console.log( 'close' );
            };
        };

        function joinChannel ( channel )
        {
            var payload = getPayload ( 'join', {
                    channel : channel
                } );

            websocket.send( payload );
        };

        function quitChannel ( channel )
        {
            var payload = getPayload ( 'quit', {
                    channel : channel
                } );

            websocket.send( payload );
        };

        function sendMessage ( channel, message )
        {
            var payload = getPayload ( 'send', {
                    channel : channel,
                    message : {
                        isLocal : false,
                        user    : UserService.currentName (),
                        text    : message
                    }
                } );

            websocket.send( payload );

            messageReceived ( {
                isLocal : true,
                user    : UserService.currentName (),
                text    : message
            } );
        };

        function onMessageReceived ( callback )
        {
            if ( typeof callback == 'function' )
            {
                messageReceived = callback;
            }
        };

        function onPresenceReceived ( callback )
        {
            if ( typeof callback == 'function' )
            {
                presenceReceived = callback;
            }
        };

        function onArchiveReceived ( callback )
        {
            if ( typeof callback == 'function' )
            {
                archiveReceived = callback;
            }
        };

        function onChatReady ( callback )
        {
            if ( typeof callback == 'function' )
            {
                chatReady = callback;
            }
        };

        function formatArchivedMessages ( messages )
        {
            var currentId = UserService.currentId ();

            archiveReceived ( messages.map ( function ( data )
            {
                var message = data.message;

                message.isLocal = ( data.sender_id == currentId ) ? true : false;
                return message;
            } ) );
        }

        return {
            open               : open,
            close              : close,
            sendMessage        : sendMessage,
            onMessageReceived  : onMessageReceived,
            onPresenceReceived : onPresenceReceived,
            onArchiveReceived  : onArchiveReceived,
            onChatReady        : onChatReady,
            joinChannel        : joinChannel,
            quitChannel        : quitChannel
        };
    };

    _Chat.$inject = [
        'UserService', 'serviceUrl'
    ];

    appServices.factory ( 'ChatService', _Chat );

}) ();