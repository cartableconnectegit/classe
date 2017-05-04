(function ()
{

    function _GlobalChat ( $rootScope, UserService, ChatService )
    {

        var presence = 'offline',
            show     = false,
            count    = 0,
            messages = [],
            opened   = false;

        ChatService.onChatReady ( function ()
        { 
            ChatService.joinChannel ( UserService.studentsId ()[ 0 ] );
        } );

        ChatService.onPresenceReceived ( function ( data )
        {

            console.log ( "chatPresenceUpdated", data.status );

            presence = data.status;
            $rootScope.$broadcast( "chatPresenceUpdated" );
        } );

        ChatService.onMessageReceived ( function ( message )
        {
            var lastMessage = messages.length ? messages[ messages.length - 1 ] : null;

            if ( !lastMessage || lastMessage.isLocal != message.isLocal )
            {
                messages.push ( {
                    isLocal : message.isLocal,
                    css     : message.isLocal ? 'chat-local' : 'chat-remote',
                    user    : message.user,
                    content : [ message.text ]
                } );
            }
            else
            {
               lastMessage.content.push ( message.text );
            }
            $rootScope.$broadcast( "chatMessagesUpdated" );
        } );

        ChatService.onArchiveReceived ( function ( archive )
        {
            archive.forEach ( function ( message )
            {
                var lastMessage = messages.length ? messages[ messages.length - 1 ] : null;

                if ( !lastMessage || lastMessage.isLocal != message.isLocal )
                {
                    messages.push ( {
                        isLocal : message.isLocal,
                        css     : message.isLocal ? 'chat-local' : 'chat-remote',
                        user    : message.user,
                        content : [ message.text ]
                    } );
                }
                else
                {
                   lastMessage.content.push ( message.text );
                }
            } );
            $rootScope.$broadcast( "chatArchiveUpdated" );
        } );

        function sendMessage ( message )
        {
            ChatService.sendMessage ( UserService.studentsId ()[ 0 ], message );
        }

        function getPresence ()
        {
            return presence;
        }

        function getMessages ()
        {
            return messages;
        }

        function setShowChat ( value )
        {
            show = value;
        }

        function getShowChat ()
        {
            return show;
        }

        function updateCount ( value )
        {
            count = value;
        }

        function getCount ()
        {
            return count;
        }

        function close ()
        {
            if ( opened )
            {
                ChatService.close ();
                opened = false;
            }
        }

        function open ()
        {
            if ( !opened )
            {
                ChatService.open ();
                opened = true;
            }
        }

        return {
            getPresence : getPresence,
            getMessages : getMessages,
            sendMessage : sendMessage,
            getShowChat : getShowChat,
            setShowChat : setShowChat,
            updateCount : updateCount,
            getCount    : getCount,
            open        : open,
            close       : close
        };
    };

    _GlobalChat.$inject = [
        '$rootScope', 'UserService', 'ChatService'
    ];

    appServices.factory ( 'GlobalChatService', _GlobalChat );

}) ();