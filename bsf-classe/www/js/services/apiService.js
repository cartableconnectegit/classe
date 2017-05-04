(function ()
{

    function _ApiService ( $rootScope, $state, $window, UserService, MediaService, VideoService, apiSettings, apiUrl )
    {
        var _script         = null,
            _localStream    = null,
            _ready          = false,
            _connected      = false,
            _mediaTest      = null,
            _datachannel    = null,
            _callStarted    = false,
            _roomJoined     = false,
            _pollingTimer   = null,
            _callTimer      = null,
            _dirty          = false,
            _apiReady       = function () {},
            _execPTZAction  = function () {},
            _videoShown     = function () {},
            _callEnded      = function () {};

        var callTimeout     = 90;

        /*----------------------------------------------------------------------
         * Service methods
         *----------------------------------------------------------------------*/

        function _ensureApiReady ()
        {
            if ( !_ready )
            {
                console.log ( 'Bistri API not ready yet' );
            }
            return _ready;
        }

        function apiReady ( callback )
        {
            if ( _ready )
            {
                callback ();
            }
            else
            {
                if ( typeof callback === 'function' )
                {
                    _apiReady = callback; 
                }

                if ( typeof bc != 'undefined' )
                {
                    $window.onBistriConferenceReady ();
                }
            }
        }

        function onPTZMessage ( callback )
        {
            if ( typeof callback === 'function' )
            {
                _execPTZAction = callback;
            }
        }

        function onVideoShown ( callback )
        {
            if ( typeof callback === 'function' )
            {
                _videoShown = callback;
            }
        }

        function onCallEnded ( callback )
        {
            if ( typeof callback === 'function' )
            {
                _callEnded = callback; 
            }
        }

        function init ( user )
        {
            if ( _ensureApiReady () )
            {
                bc.init ( {
                    appId    : apiSettings.appId,
                    appKey   : apiSettings.appKey,
                    debug    : apiSettings.debug,
                    userId   : UserService.currentId (),
                    userName : UserService.currentName ()
                } );
            }
        }

        function setStateAsDirty ()
        {
            _callStarted = false;
            _dirty = true;
        }

        function connect ()
        {
            if ( _ensureApiReady () )
            {
                bc.connect ();
            }
        }

        function disconnect ()
        {
            if ( _ensureApiReady () )
            {
                bc.disconnect (); 
            }
        }

        function isConnected ()
        {
            return _connected;
        }

        function localStream ()
        {
            return _localStream;
        }

        function inviteToJoinRoom ()
        {
            var schoolbagId = UserService.currentSchoolbag ();

            bc.startStream ( { audio: true, video: false }, function ( stream )
            {
                _datachannel = null;
                _callStarted = false;
                _roomJoined  = false;
                _localStream = stream;

                UserService.studentsId ().forEach ( function ( studentId )
                {
                    bc.call ( studentId, schoolbagId, { stream: _localStream } );
                } );

                _callTimer = setTimeout ( cancelInvitation, callTimeout * 1000 );
            } );
        }

        function cancelInvitation ()
        {
            var schoolbagId = UserService.currentSchoolbag ();

            UserService.studentsId ().forEach ( function ( studentId )
            {
                bc.endCall ( studentId, schoolbagId );
            } );

            if ( _roomJoined )
            {
                bc.quitRoom ( schoolbagId );
            }
        }

        function joinRoom ( room )
        {
            bc.startStream ( { audio: true, video: false }, function ( stream )
            {
                _datachannel = null;
                _callStarted = false;
                _roomJoined  = false;
                _localStream = stream;

                bc.joinRoom ( UserService.currentSchoolbag () );
            } );
        }

        function quitRoom ()
        {
            closeChannel ();
            endCalls ( UserService.currentSchoolbag () );
            bc.quitRoom ( UserService.currentSchoolbag () );
        }

        function endCalls ()
        {
            bc.endCalls ( UserService.currentSchoolbag () );
        }

        function closeChannel ()
        {
            if ( _datachannel )
            {
                _datachannel.close ();
            }
        }

        function setAudioTestStream ( id, callback )
        {
            bc.startStream ( { video: false, audio: true }, function ( stream )
            {
                bc.monitorAudioActivity( stream, function( audioLevel )
                {
                    callback ( audioLevel );
                } );

                bc.attachStream ( stream, $window.document.getElementById ( id ) );

                _mediaTest = stream;
            } );
        }

        function stopMediaTestStream ()
        {
            bc.stopStream ( _mediaTest, function ( )
            {
                bc.detachStream ( _mediaTest );
                _mediaTest = null;
            } );
        }

        function isCalling ()
        {
            return _callStarted;
        }

        /*----------------------------------------------------------------------
         * Bistri API lazy loading + events binding
         *----------------------------------------------------------------------*/

        $window.onBistriConferenceReady = function ()
        {
            if ( !_ready )
            {           
                _ready = true;
                var setDataChannel = function  ( dataChannel, remoteUserId )
                {
                    dataChannel.onOpen = function ()
                    {
                        _datachannel = dataChannel;
                    };

                    dataChannel.onClose = function ()
                    {
                        _datachannel = null;
                    };

                    dataChannel.onMessage = function ( event )
                    {
                        var data = JSON.parse ( event.data );
                        if ( data.type === 'ptz' )
                        {
                            _execPTZAction ( data.action );
                        }
                    };
                };

                bc.signaling.bind ( 'onConnected', function ()
                {
                    _connected = true;
                } );

                bc.signaling.bind ( 'onDisconnected', function ()
                {
                    _connected = false;
                } );

                bc.signaling.bind ( 'onIncomingRequest', function ( data )
                {
                    switch ( data.event )
                    {
                        case 'call':
                            $state.go ( 'incoming', { data: data } );
                            break;
                        case 'call-stop':
                            $state.go ( 'settings' );
                            break;
                    }
                } );

                bc.signaling.bind ( 'onJoinedRoom', function ( data )
                {
                    if ( _dirty )
                    {
                        _dirty = false;
                        return quitRoom ();
                    }

                    _roomJoined = true;

                    if ( data.members.length )
                    {
                        _callStarted = true;
                        $state.go ( 'main' );
                    }
                    else
                    {
                        $state.go ( 'pending' );
                    }
                } );

                bc.signaling.bind ( 'onQuittedRoom', function ()
                {
                    _roomJoined = false;
                    _callStarted = false;

                    bc.stopStream ( _localStream, function ()
                    {
                        _localStream = null;

                        _callEnded ();
                        $state.go ( 'settings' );
                    } )
                } );

                bc.signaling.bind ( 'onQuitRoomError', function ()
                {
                    if ( _roomJoined )
                    {
                        _callStarted = false;

                        bc.stopStream ( _localStream, function ()
                        {
                            _localStream = null;
                            _callEnded ();
                            $state.go ( 'settings' );
                        } );
                    }
                    else
                    {
                        $state.go ( 'settings' );
                    }
                } );

                bc.signaling.bind ( 'onPeerJoinedRoom', function ( data )
                {
                    if ( _roomJoined )
                    {
                        if ( _callTimer )
                        {
                            clearTimeout ( _callTimer );
                            _callTimer = null;
                        }
                        _callStarted = true;
                        $state.go ( 'main' );
                    }
                } );

                bc.signaling.bind ( 'onPeerQuittedRoom', function ()
                {
                    _callStarted = false;

                    if ( _roomJoined )
                    {
                        quitRoom ();
                    }
                } );

                bc.signaling.bind ( 'onPresence', function ( result )
                {
                    var student = UserService.current ().students[ 0 ],
                        name    = student.firstname + ' ' + student.lastname;

                    if ( typeof _presence === 'function' )
                    {
                        _presence ( result, name );
                    }
                } );
         
                bc.channels.bind( "onDataChannelCreated", setDataChannel );
                
                bc.channels.bind( "onDataChannelRequested", setDataChannel );

                bc.streams.bind ( "onStreamAdded", function ( stream )
                {
                    var node = $window.document.querySelector ( '.videoStudent' );
                    bc.attachStream ( stream, node );
                    _videoShown ();
                } );

                bc.streams.bind ( "onStreamClosed", function ( stream )
                {
                    bc.detachStream ( stream );
                } );

                _apiReady();
            }
        };

        return {
            apiReady             : apiReady,
            init                 : init,
            connect              : connect,
            disconnect           : disconnect,
            localStream          : localStream,
            isConnected          : isConnected,
            joinRoom             : joinRoom,
            inviteToJoinRoom     : inviteToJoinRoom,
            cancelInvitation     : cancelInvitation,
            quitRoom             : quitRoom,
            endCalls             : endCalls,
            setAudioTestStream   : setAudioTestStream,
            stopMediaTestStream  : stopMediaTestStream,
            onPTZMessage         : onPTZMessage,
            onVideoShown         : onVideoShown,
            onCallEnded          : onCallEnded,
            isCalling            : isCalling,
            setStateAsDirty      : setStateAsDirty
        };
    }

    _ApiService.$inject = [
        '$rootScope', '$state', '$window', 'UserService', 'MediaService', 'VideoService', 'apiSettings', 'apiUrl'
    ];

    appServices.factory ( 'ApiService', _ApiService );

}) ();