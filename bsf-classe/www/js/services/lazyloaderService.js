( function ()
{
    function _LazyLoaderService ( $rootScope, $state, $window )
    {
        function LazyJSLoader ( source, callback )
        {
            this._loaded   = 0,
            this._source  = source instanceof Array ? source : [ source ],
            this._callback = callback;
            this._load ();
        }

        LazyJSLoader.prototype._load = function ()
        {
            this._source.forEach ( function ( src )
            {
                var _script = document.createElement ( 'script' );

                $window.document.body.appendChild ( _script );

                if ( typeof this._callback == 'function' )
                {
                    _script.addEventListener ( 'load', function ()
                    {
                        if ( ++this._loaded == this._source.length )
                        {
                            this._callback ();
                        }
                    }.bind ( this ) );
                }
                _script.src = src;
            }.bind ( this ) );
        };

        function load ( sources, callback )
        {
            return new LazyJSLoader ( sources, callback );
        }

        return {
            load : load
        };
    }

    _LazyLoaderService.$inject = [
        '$rootScope', '$state', '$window'
    ];

    appServices.factory ( 'LazyLoaderService', _LazyLoaderService );

} ) ();