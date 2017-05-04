(function ()
{
    function _MediaService ( localStorageService, $rootScope, $state, stream )
    {

        function _get ()
        {
            return localStorageService.get ( 'media' );
        }

        function _set ( label, status, callback )
        {
            var media = _get ();

            media[ label ] = status
            localStorageService.set ( 'media', media );
            if ( typeof callback == 'function' )
            {
                callback ();
            }
        }

        function getAudio ()
        {
            return _get ().audio;
        }

        function setAudio ( status, callback )
        {
            var media = _set ( 'audio', status, callback );
        }

        function getVideo ()
        {
            return _get ().video;
        }

        function setVideo ( status, callback )
        {
            var media = _set ( 'video', status, callback );

            console.log ( localStorageService.get ( 'media' ) );
        }

        function remove ()
        {
            return localStorageService.remove ( 'media' );
        }

        function getConstraints ()
        {
            return {
                audio : true,
                video : {
                    mandatory : {
                        maxWidth  : stream.width,
                        maxHeight : stream.height
                    },
                    optional  : []
                }
            };
        }

        if ( !_get () )
        {
            localStorageService.set ( 'media', { 
                audio: true,
                video: true
            } );
        }

        return {
            getAudio       : getAudio,
            getVideo       : getVideo,
            setAudio       : setAudio,
            setVideo       : setVideo,
            remove         : remove,
            getConstraints : getConstraints
        };
    }

    _MediaService.$inject = [
        'localStorageService', '$rootScope', '$state', 'stream'
    ];

    appServices.factory ( 'MediaService', _MediaService );
}) ();