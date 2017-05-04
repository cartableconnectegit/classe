// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module ( 'starter', [ 'ionic', 'starter.constants', 'starter.directives', 'starter.services', 'starter.controllers', 'LocalStorageModule' ] )

    .run ( function ( $ionicPlatform, LazyLoaderService, apiUrl )
    {
        $ionicPlatform.ready ( function ()
        {
            if ( window.cordova && window.cordova.plugins.Keyboard )
            {
                cordova.plugins.Keyboard.hideKeyboardAccessoryBar ( true );
                cordova.plugins.Keyboard.disableScroll ( false );
            }

            if ( window.StatusBar )
            {
                StatusBar.hide ();
            }
        } );

        LazyLoaderService.load ( apiUrl + '/bistri.conference.min.js', function ()
        {
            ionic.EventController.trigger( 'bistriJSLoaded', null );

            LazyLoaderService.load ( [ 'js/kurento/kurento-client.js', 'js/kurento/kurento-utils.js' ], function ()
            {
                ionic.EventController.trigger( 'kurentoJSLoaded', null );
            } );
        } );

    } )

    .config ( function ( $provide, $stateProvider, $urlRouterProvider )
    {
        $provide.decorator( '$exceptionHandler', [ '$delegate', function( $delegate )
        {
            return function( exception, cause )
            {
                $delegate( exception, cause );

                var message  = exception.toString(),
                    callback = function( stackframes )
                    {
                        var stringifiedStack = stackframes.map ( function ( sf )
                        {
                            return sf.toString();
                        } ).join( '\n' );
                        navigator.crashlytics.logException ( 'ERROR: ' + message + ', stacktrace: ' + stringifiedStack );
                    },
                    errback  = function( err ) {
                        console.log( err.message );
                    };

                StackTrace.fromError( exception )
                    .then( callback )
                        .catch(errback);
            };
        } ] );

        $stateProvider

            .state ( 'signin', {
                url: "/signin",
                templateUrl: "templates/signin.html",
                controller: 'SigninCtrl'
            } )

            .state ( 'home', {
                url: "/home",
                templateUrl: "templates/home.html",
                controller: 'HomeCtrl'
            } )

            .state ( 'settings', {
                url: "/settings",
                templateUrl: "templates/settings.html",
                controller: 'SettingsCtrl'
            } )

            .state ( 'pending', {
                url: "/pending",
                templateUrl: "templates/pending.html",
                controller: 'PendingCtrl'
            } )

            .state ( 'incoming', {
                url: "/incoming",
                templateUrl: "templates/incoming.html",
                controller: 'IncomingCtrl',
                params: { 
                    data: undefined
                }
            } )

            .state ( 'main', {
                url: "/main",
                templateUrl: "templates/main.html",
                controller: 'MainCtrl'
            } )

            .state ( 'offline', {
                url: "/offline",
                templateUrl: "templates/offline.html"
            } );

        // if none of the above states are matched, use this as the fallback
        $urlRouterProvider.otherwise ( '/home' );
    } )

    .directive( "ngTouchStart", [ function ()
    {
        return function ( scope, elem, attrs )
        {
            elem.bind( "touchstart mousedown", function ( e )
            {
                e.preventDefault();
                e.stopPropagation();
                scope.$apply ( attrs[ "ngTouchStart" ] );
            } );
        }
    } ] )

    .directive( "ngTouchEnd", [ function ()
    {
        return function ( scope, elem, attrs )
        {
            elem.bind( "touchend mouseup", function ( e )
            {
                e.preventDefault();
                e.stopPropagation();
                scope.$apply ( attrs[ "ngTouchEnd" ] );
            } );
        }
    } ] )

    .controller ( "globalController", [ '$window', '$state', 'ApiService', function ( $window, $state, ApiService )
    {
        document.addEventListener ( 'online', function ()
        {
            ApiService.setStateAsDirty ();
            $state.go ( 'home' );
        }, false );

        document.addEventListener ( 'offline', function ()
        {
            $state.go ( 'offline' );
        }, false );

    } ] );
