( function ()
{
    function _VideoService ( $rootScope, $state, $window )
    {
        var videos = {};

        function getopts( args, opts )
        {
            var result = opts.default || {};

            args.replace ( new RegExp( "([^?=&]+)(=([^&]*))?", "g" ), function( $0, $1, $2, $3 )
            { 
              result[$1] = $3;
            } );

            return result;
        };

        var args = getopts ( location.search, {
            default: {
                ws_uri      : 'ws://bsf.bistri.com:8888/kurento',
                ice_servers : undefined
            }
        } );

        if ( args.ice_servers )
        {
            $window.kurentoUtils.WebRtcPeer.prototype.server.iceServers = JSON.parse ( args.ice_servers );
        } 

        function WebRTCVideo ()
        {
            this._count      = 0;
            this._id         = null;
            this._pipeline   = null;
            this._webRtcPeer = null;
            this._srcUrl     = null;
            this._mediaUrl   = null;
            this._videoNode  = null;
            this._timer      = null;
            this._onFlowing  = function (){};
            this._onTimeout  = function (){};
        };

        WebRTCVideo.prototype.start = function ( id, srcUrl, success, timeout )
        {
            this._id        = id;
            this._srcUrl    = srcUrl;
            this._count     = 0;
            this._timer     = null;
            this._videoNode = $window.document.querySelector ( '#' + id );

            if ( typeof success === 'function' )  
            {
                this._onFlowing = success;
            }

            if ( typeof timeout === 'function' )  
            {
                this._onTimeout = timeout;
            }

            if ( this._mediaUrl )
            {
                this._videoNode.src = this._mediaUrl;
                this._onFlowing ();
                return;
            }

            var options = {
                remoteVideo : this._videoNode
            };

            this._webRtcPeer = $window.kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly ( options, function ( error )
            {
                if( error )
                {
                    return console.error ( error );
                }
                this._webRtcPeer.generateOffer ( this._onOffer.bind ( this ) );
                this._webRtcPeer.peerConnection.addEventListener ( 'iceconnectionstatechange', function( event )
                {
                    if( this._webRtcPeer && this._webRtcPeer.peerConnection)
                    {
                        console.log( 'oniceconnectionstatechange -> ' + this._webRtcPeer.peerConnection.iceConnectionState );
                        console.log( 'icegatheringstate -> ' + this._webRtcPeer.peerConnection.iceGatheringState );
                    }
                }.bind ( this ) );
            }.bind ( this ) );
        };

        WebRTCVideo.prototype.stop = function ()
        {
            if ( this._webRtcPeer )
            {
                this._webRtcPeer.dispose ();
                this._webRtcPeer = null;
            }

            if ( this._pipeline )
            {
                this._pipeline.release ();
                this._pipeline = null;
            }

            if ( this._timer )
            {
                clearTimeout ( this._timer );
                this._timer = null;
            }

            this._mediaUrl = null;
        };

        WebRTCVideo.prototype._flowChecker = function ()
        {
            if ( this._videoNode.readyState == 4 )
            {
                this._onFlowing ()
            }
            else
            {
                if ( this._count++ <= 450 )
                {
                    this._timer = setTimeout ( this._flowChecker.bind ( this ), 200 );
                }
                else
                {
                    this._onTimeout ();
                }
            }
        }

        WebRTCVideo.prototype._onOffer = function ( error, sdpOffer )
        {
            if ( error ) return this._onError ( error );

            kurentoClient ( args.ws_uri, function ( error, kurentoClient )
            {
                if ( error ) return this._onError ( error );

                kurentoClient.create ( "MediaPipeline", function ( error, p )
                {
                    if ( error ) return this._onError ( error );

                    this._pipeline = p;

                    this._pipeline.create ( "PlayerEndpoint", { uri: this._srcUrl }, function ( error, player )
                    {
                        if ( error ) return this._onError ( error );

                        this._pipeline.create ( "WebRtcEndpoint", function ( error, webRtcEndpoint )
                        {
                            if ( error ) return this._onError ( error );

                            this._setIceCandidateCallbacks ( webRtcEndpoint, this._webRtcPeer, this._onError );

                            webRtcEndpoint.processOffer ( sdpOffer, function( error, sdpAnswer )
                            {
                                if ( error ) return this._onError ( error );

                                webRtcEndpoint.gatherCandidates ( this._onError );

                                this._webRtcPeer.processAnswer ( sdpAnswer );

                            }.bind ( this ) );

                            player.connect ( webRtcEndpoint, function ( error )
                            {
                                if ( error ) return this._onError ( error );

                                player.play ( function ( error )
                                {
                                    if ( error ) return this._onError ( error );

                                    this._mediaUrl = this._videoNode.src;

                                    this._flowChecker ();

                                    console.log ( "Player playing ..." );
                                }.bind ( this ) );
                            }.bind ( this ) );
                        }.bind ( this ) );
                    }.bind ( this ) );
                }.bind ( this ) );
            }.bind ( this ) );
        };

        WebRTCVideo.prototype._setIceCandidateCallbacks = function ( webRtcEndpoint, webRtcPeer, onError )
        {
            webRtcPeer.on( 'icecandidate', function( candidate )
            {
                candidate = kurentoClient.register.complexTypes.IceCandidate( candidate );
                webRtcEndpoint.addIceCandidate(candidate, onError);
            } );

            webRtcEndpoint.on( 'OnIceCandidate', function ( event )
            {
                var candidate = event.candidate;
                webRtcPeer.addIceCandidate( candidate, onError );
            } );
        };

        WebRTCVideo.prototype._onError = function ( error )
        {
            if( error )
            {
                console.error( error );
                stop();
            }
        }

        function start ( id, srcUrl, success, timeout )
        {
            if ( !videos [ id ] )
            {
                var webrtcVideo = new WebRTCVideo ();

                videos [ id ] = webrtcVideo;
                webrtcVideo.start ( id, srcUrl, success, timeout );
            }
            else
            {
                videos [ id ].start ( id, srcUrl, success, timeout );
            }
        }

        function stop ( id )
        {
            if ( videos [ id ] )
            {
                videos [ id ].stop ();
                delete videos [ id ];
            }
        }

        return {
            start : start,
            stop  : stop
        };
    }

    _VideoService.$inject = [
        '$rootScope', '$state', '$window'
    ];

    appServices.factory ( 'VideoService', _VideoService );

} ) ();