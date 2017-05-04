appControllers.controller ( 'SettingsCtrl', function ( $scope, $state, $ionicScrollDelegate, $timeout, $window, $ionicModal, VideoService, UserService, ApiService, GlobalChatService, frontCam, backCam )
{

    $scope.safeApply = function( fn )
    {
        var phase = this.$root.$$phase;
        if( phase == '$apply' || phase == '$digest' )
        {
            if( fn && ( typeof( fn ) === 'function' ) )
            {
                fn ();
            }
        }
        else 
        {
            this.$apply( fn );
        }
    };

    $ionicModal.fromTemplateUrl( 'frontVideoModal', {
        scope     : $scope,
        animation : 'slide-in-up'
    } ).then( function( modal )
    {
        $scope.frontVideoModal = modal;
    } );

    $ionicModal.fromTemplateUrl( 'backVideoModal', {
        scope     : $scope,
        animation : 'slide-in-up'
    } ).then( function( modal )
    {
        $scope.backVideoModal = modal;
    } );

    $ionicModal.fromTemplateUrl( 'micModal', {
        scope     : $scope,
        animation : 'slide-in-up'
    } ).then( function( modal )
    {
        $scope.micModal = modal;
    } );

    $scope.$on('modal.hidden', function()
    {
        VideoService.stop ( 'frontVideoSettings' );
        VideoService.stop ( 'backVideoSettings' );
        ApiService.stopMediaTestStream ();
    } );

    $scope.$on('$destroy', function() {
        $scope.micModal.remove();
        $scope.frontVideoModal.remove();
        $scope.backVideoModal.remove();
    } );

    $scope.vuMeterCss = {
        height: '0',
    };

    $scope.studentName = ( function ()
    {
        var student = UserService.current ().students[ 0 ];
        return student.firstname + ' ' + student.lastname
    } ) ()

    $scope.showChat = false;
    $scope.chatPaneCss = 'chat-pane';
    $scope.chatPresence = GlobalChatService.getPresence ();
    $scope.chatCount = 0;
    $scope.chat = {
        messages : [],
        field    : ''
    };

    $scope.$on( 'chatMessagesUpdated', function()
    {
        $scope.safeApply ( function ()
        {
            $scope.chat.messages = GlobalChatService.getMessages ();
            if ( !$scope.showChat )
            {
                $scope.chatCount = ++$scope.chatCount;
                GlobalChatService.updateCount ( $scope.chatCount );
                $window.document.getElementById ( 'notification_settings' ).play();
            }
            $ionicScrollDelegate.$getByHandle( 'chat' ).scrollBottom();  
        } );
    } );

    $scope.$on( 'chatPresenceUpdated', function()
    {
        $scope.safeApply ( function ()
        {
            $scope.chatPresence = GlobalChatService.getPresence ();
        } );
    } );

    $scope.$on( 'chatArchiveUpdated', function()
    {
        $scope.safeApply ( function ()
        {
            $scope.chat.messages = GlobalChatService.getMessages ();
        } );
    } );

    _vuMeter = function ( level )
    {
        var unitPx   = 32,
            unitZone = ( 100 / 8 );
    
        $window.document.querySelector ( '#vuMeterLevel' ).style.height = ( unitPx * Math.round( level / unitZone ) ) + 'px';
    }

    $scope.showFrontVideoModal = function ()
    {
        $scope.frontVideoModal.show();
        $window.document.querySelector ( '.front-video.spinner' ).style.display = 'block';
        $window.document.querySelector ( '.front-video.video-error' ).style.display = 'none';
        UserService.ports ()
            .then ( function ( data )
            {
                VideoService.start ( 'frontVideoSettings', frontCam.rtspUrl.replace ( 'xxxx', data.front_cam ), function ()
                {
                    $window.document.querySelector ( '.front-video.spinner' ).style.display = 'none';
                }, function ()
                {
                    $window.document.querySelector ( '.front-video.spinner' ).style.display = 'none';
                } );
            } )
            .catch ( function ()
            {
                $window.document.querySelector ( '.front-video.spinner' ).style.display = 'none';
                $window.document.querySelector ( '.front-video.video-error' ).style.display = 'block';
                console.log ( 'cannot connect to camera: no port defined' );
            } );
        componentHandler.upgradeDom();
    }

    $scope.showBackVideoModal = function ()
    {
        $scope.backVideoModal.show();
        $window.document.querySelector ( '.back-video.spinner' ).style.display = 'block';
        $window.document.querySelector ( '.back-video.video-error' ).style.display = 'none';
        UserService.ports ()
            .then ( function ( data )
            {
                VideoService.start ( 'backVideoSettings', backCam.rtspUrl.replace ( 'xxxx', data.rear_cam ), function ()
                {
                    $window.document.querySelector ( '.back-video.spinner' ).style.display = 'none';
                }, function ()
                {
                    $window.document.querySelector ( '.back-video.spinner' ).style.display = 'none';
                } );
            } )
            .catch ( function ()
            {
                $window.document.querySelector ( '.back-video.spinner' ).style.display = 'none';
                $window.document.querySelector ( '.back-video.video-error' ).style.display = 'block';
                console.log ( 'cannot connect to camera: no port defined' );
            } );
        componentHandler.upgradeDom();
    }

    $scope.showMicModal = function ()
    {
        $scope.micModal.show();
         _vuMeter ( 0 );
        ApiService.setAudioTestStream ( 'micTest', _vuMeter );
    }

    $scope.logout = function ()
    {
        ApiService.disconnect ();
        GlobalChatService.close ();
        UserService.logout ()
            .then ( function ()
            {
                $state.go ( 'signin' );
            } )
            .catch ( function ( error )
            {  
                console.log ( "Error", error )
            } );
    };

    $scope.go = function ()
    {
        if ( ApiService.isCalling () )
        {
            $state.go ( 'main' );
        }
        else
        {
            if ( ApiService.isConnected () )
            {
                ApiService.inviteToJoinRoom ();
            }
            else
            {
                $state.go ( 'home' );
            }
        }
    };

    $scope.toggleChat = function ()
    {
        if ( !$scope.showChat )
        {
            $scope.chatCount = 0;
            GlobalChatService.updateCount ( $scope.chatCount );
            $scope.chatPaneCss = 'chat-pane chat-pane-visible';
        }
        else {
            $scope.chatPaneCss = 'chat-pane';
        }
        $scope.showChat = !$scope.showChat;
        GlobalChatService.setShowChat ( $scope.showChat );
    }

    $scope.sendMessage = function ()
    {
        $scope.safeApply ( function ()
        {
            GlobalChatService.sendMessage ( $scope.chat.field );
            $scope.chat.field = "";
        } );

        $timeout ( function()
        {
            $window.document.querySelector ( '#chatField' ).focus ();
        } );
    };

    $scope.$on ( '$ionicView.enter', function ()
    {
        $scope.safeApply ( function ()
        {
            $scope.showChat = GlobalChatService.getShowChat ();
            $scope.chatCount = GlobalChatService.getCount ();
            $scope.chat.messages = GlobalChatService.getMessages ();
            $scope.chatPaneCss = $scope.showChat ? 'chat-pane chat-pane-visible' : 'chat-pane';
        } );

        GlobalChatService.open ();

        ApiService.apiReady ( function ()
        {
            if ( !ApiService.isConnected () )
            {
                ApiService.init ();
                ApiService.connect ();
            }
            else
            {
                console.log ( "Bistri API already connected" );
            }
        } );
    } );

    $scope.$on ( '$ionicView.leave', function ()
    {
    } );

} );