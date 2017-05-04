(function ()
{
    function _PTZ ( $http, backCam )
    {
        var BASE_URL = backCam.ptzUrl,
            USERNAME = backCam.user,
            PASSWORD = backCam.password,
            DELAY    = 0; //backCam.delay,
            AUTH     = "usr=" + encodeURIComponent ( USERNAME ) + "&pwd=" + encodeURIComponent ( PASSWORD );

        function move ( command, delay )
        {
            setTimeout ( function ()
            {
                $http.get ( BASE_URL + "cmd=" + command + "&" + AUTH, {} )
                    .success ( function ( result )
                    {
                        //TODO: Manage errors
                        //cgi execute result
                        //1) We orgnize the cgi execute result as xml format, for example:
                        //<CGI_Result>
                        //    <result>0</result>
                        //    <isDHCP>1</isDHCP>
                        //    <ip>192.168.1.8</ip>
                        //    <gate>0.0.0.0</gate>
                        //    <mask>255.255.255.0</mask>
                        //    <dns1>0.0.0.0</dns1>
                        //    <dns2>0.0.0.0</dns2>
                        //</CGI_Result>
                        //
                        //<result></result> means the common execute result
                        //value mean
                        //    0 Success
                        //    -1 CGI request string format error
                        //    -2 Username or password error
                        //    -3 Access deny
                        //    -4 CGI execute fail
                        //    -5 Timeout
                        //    -6 Reserve
                        //    -7 Unknown error
                        //    -8 Reserve
                    } )
                    .error ( function ( err, status )
                    {
                        //TODO: Manage errors
                    } );
            }, ( delay ? DELAY : 0 ) );
        }

        function moveUp ()
        {
            move ( "ptzMoveUp", true );
        }

        function moveDown ()
        {
            move ( "ptzMoveDown", true );
        }

        function moveLeft ()
        {
            move ( "ptzMoveLeft", true );
        }

        function moveRight ()
        {
            move ( "ptzMoveRight", true );
        }

        function moveStop ()
        {
            move ( "ptzStopRun", false ); 
        }

        return {
            moveUp    : moveUp,
            moveDown  : moveDown,
            moveLeft  : moveLeft,
            moveRight : moveRight,
            moveStop  : moveStop
        };
    }

    _PTZ.$inject = [
        '$http', 'backCam'
    ];

    appServices.factory ( 'PTZService', _PTZ );

}) ();