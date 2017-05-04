(function ()
{
    function _UserService ( $q, $http, localStorageService, $rootScope, $state, apiUrl, serviceUrl )
    {
        var _currentUser;

        function login ( login, password )
        {
            var deferred = $q.defer ();

            var post = { login: login, password: password };

            $http.post ( serviceUrl + '/student/signin', post, { withCredentials: true, headers: { 'Content-Type': 'application/json' } } )
                .success ( function ( result )
                {
                    if ( result.error || !result.data )
                    {
                        deferred.reject ( result.error );
                        return;
                    }

                    var data = result.data;

                    storeCurrentUser ( data.user );

                    deferred.resolve ( data.user );
                } )
                .error ( function ( result, status )
                {
                    deferred.reject ( result != null && ( typeof result === 'object' ) ? result.error : [ { text: ( result || 'une erreur est survenue' ) + ' (' + status + ')' } ] );
                } );

            return deferred.promise;
        }

        function logout ()
        {
            var deferred = $q.defer ();

            localStorageService.remove ( 'user' );

            _currentUser = null;

            $http.get ( serviceUrl + '/student/logout', { withCredentials: true, headers: { 'Content-Type': 'application/json' } } )
                .success ( function ( result )
                {
                    if ( result.error || !result.data )
                    {
                        deferred.reject ( result.error );
                        return;
                    }

                    var data = result.data;

                    console.log ( "disconnected from the service" );
                    deferred.resolve ( data );
                } )
                .error ( function ( result, status )
                {
                    deferred.reject ( result != null && ( typeof result === 'object' ) ? result.error : [ { text: ( result || 'une erreur est survenue' ) + ' (' + status + ')' } ] );
                } );

            return deferred.promise;
        }

        function info ()
        {
            var deferred = $q.defer ();

            localStorageService.remove ( 'user' );

            $http.get ( serviceUrl + '/student/info', { withCredentials: true } )
                .success ( function ( result )
                {
                    if ( result.error || !result.data )
                    {
                        deferred.reject ( result.error );
                        return;
                    }

                    var data = result.data;

                    storeCurrentUser ( data );

                    deferred.resolve ( data );
                } )
                .error ( function ( result, status )
                {
                    if ( status == 401 )
                    {
                        handleNotConnected ( status );
                    }
                    else
                    {
                        deferred.reject ( result != null && ( typeof result === 'object' ) ? result.error : [ { text: ( result || 'une erreur est survenue' ) + ' (' + status + ')' } ] );
                    }
                } );

            return deferred.promise;
        }

        function ports ()
        {
            var deferred = $q.defer ();

            $http.get ( serviceUrl + '/student/ports?schoolbag_id=' + currentUserSchoolbag (), { withCredentials: true } )
                .success ( function ( result )
                {
                    if ( result.error || !result.data )
                    {
                        deferred.reject ( result.error );
                        return;
                    }

                    var data = result.data;

                    deferred.resolve ( data );
                } )
                .error ( function ( result, status )
                {
                    if ( status == 401 )
                    {
                        handleNotConnected ( status );
                    }
                    else
                    {
                        deferred.reject ( result != null && ( typeof result === 'object' ) ? result.error : [ { text: ( result || 'une erreur est survenue' ) + ' (' + status + ')' } ] );
                    }
                } );

            return deferred.promise;
        }

        function currentUser ()
        {
            if ( !_currentUser )
            {
                _currentUser = localStorageService.get ( 'user' );
            }
            return _currentUser;
        }

        function currentToken ()
        {
            var user = currentUser ();
            return user.token;
        }

        function currentUserId ()
        {
            var user = currentUser ();
            return user.userId;
        }

        function currentUserName ()
        {
            var user = currentUser ();
            return user.firstname + " " + user.lastname;
        }

        function currentUserSchoolbag ()
        {
            var user = currentUser ();
            return user.schoolbagId;
        }

        function teacherId ()
        {
            var user = currentUser ();
            return user.teacherId;
        }

        function storeCurrentUser ( user )
        {
            localStorageService.set ( 'user', user );
            _currentUser = user;
        }

        function handleNotConnected ( status )
        {
            if ( status == 401 )
            {
                $state.go ( "signin" );
            }
        }

        return {
            login            : login,
            logout           : logout,
            info             : info,
            ports            : ports,
            current          : currentUser,
            currentToken     : currentToken,
            currentId        : currentUserId,
            currentName      : currentUserName,
            currentSchoolbag : currentUserSchoolbag,
            teacherId        : teacherId
        };
    }

    _UserService.$inject = [
        '$q', '$http', 'localStorageService', '$rootScope', '$state', 'apiUrl', 'serviceUrl'
    ];

    appServices.factory ( 'UserService', _UserService );
}) ();
