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

                if ( bc )
                {
                    $window.onBistriConferenceReady ();
                }
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
            bc.startStream ( MediaService.getConstraints (), function ( stream )
            {
                _datachannel = null;
                _callStarted = false;
                _roomJoined  = false;
                _localStream = stream;

                bc.call ( UserService.teacherId (), UserService.currentSchoolbag (), { stream: _localStream } );

                _callTimer = setTimeout ( cancelInvitation, callTimeout * 1000 );
            } );
        }

        function cancelInvitation ()
        {
            if ( _callTimer )
            {
                clearTimeout ( _callTimer );
                _callStarted = false;
                _callTimer = null;
            }

            bc.endCall ( UserService.teacherId (), UserService.currentSchoolbag () );

            if ( _roomJoined )
            {
                bc.quitRoom ( UserService.currentSchoolbag () );
            }
        }

        function joinRoom ( room )
        {
            bc.startStream ( MediaService.getConstraints (), function ( stream )
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
            endCalls( UserService.currentSchoolbag () );
            bc.quitRoom ( UserService.currentSchoolbag () );
        }

        function endCalls ()
        {
            bc.endCalls ( UserService.currentSchoolbag () );
        }

        function sendPTZAction ( action )
        {
            var data = JSON.stringify ( {
                type   : 'ptz', 
                action : action
            } );

            if ( _datachannel )
            {
                _datachannel.send ( data );
            }
            else
            {
                console.log ( 'no data channel found' );
            }
        }

        function closeChannel ()
        {
            if ( _datachannel )
            {
                _datachannel.close ();
            }
        }

        function setVideoTestStream ( id )
        {
            bc.startStream ( { video: true, audio: false }, function ( stream )
            {
                bc.attachStream ( stream, $window.document.querySelector ( '#' + id ), { mirror: true, autoplay: true } );
                _mediaTest = stream;
            } );
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

        function updateMediaState ()
        {
            if ( _localStream )
            {
                bc.muteVideo ( _localStream, !MediaService.getVideo () );
                bc.muteMicrophone( !MediaService.getAudio () );
            }
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
                        data.members.forEach ( function ( member )
                        {
                            bc.call ( member.id, data.room, {
                                stream   : _localStream
                            } );
                            bc.openDataChannel ( member.id, 'chatChannel', data.room );
                        } );
                        updateMediaState ();
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
                    } ); 
                } );

                bc.signaling.bind ( 'onQuitRoomError', function ()
                {
                    if ( _roomJoined )
                    {
                        _callStarted = false;

                        bc.stopStream ( _localStream, function ()
                        {
                            _roomJoined = false;
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
                        bc.call ( data.pid, data.room, {
                            stream   : _localStream
                        } );
                        bc.openDataChannel ( data.pid, 'chatChannel', data.room );
                        updateMediaState ();
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

                bc.channels.bind( "onDataChannelCreated", setDataChannel );
                
                bc.channels.bind( "onDataChannelRequested", setDataChannel );

                bc.streams.bind ( "onStreamAdded", function ( stream )
                {
                    var node = $window.document.querySelector ( '.audioTeacher' );
                    bc.attachStream ( stream, node );
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
            setVideoTestStream   : setVideoTestStream,
            setAudioTestStream   : setAudioTestStream,
            stopMediaTestStream  : stopMediaTestStream,
            onCallEnded          : onCallEnded,
            isCalling            : isCalling,
            setStateAsDirty      : setStateAsDirty,
            updateMediaState     : updateMediaState,
            sendPTZAction        : sendPTZAction
        };
    }

    _ApiService.$inject = [
        '$rootScope', '$state', '$window', 'UserService', 'MediaService', 'VideoService', 'apiSettings', 'apiUrl'
    ];

    appServices.factory ( 'ApiService', _ApiService );

}) ();