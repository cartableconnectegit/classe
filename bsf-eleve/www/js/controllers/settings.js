appControllers.controller ( 'SettingsCtrl', function ( $scope, $state, $ionicScrollDelegate, $timeout, $window, $ionicModal, MediaService, UserService, ApiService, GlobalChatService )
{
    var audioEnabled = MediaService.getAudio ();
    var videoEnabled = MediaService.getVideo ();

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

    $ionicModal.fromTemplateUrl( 'videoModal', {
        scope     : $scope,
        animation : 'slide-in-up'
    } ).then( function( modal )
    {
        $scope.videoModal = modal;
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
        ApiService.stopMediaTestStream ();
    } );

    $scope.$on('$destroy', function() {
        $scope.micModal.remove();
        $scope.videoModal.remove();
    } );

    $scope.showAudioOn  = !audioEnabled;
    $scope.showAudioOff = audioEnabled;
    $scope.showVideoOn  = !videoEnabled;
    $scope.showVideoOff = videoEnabled;

    $scope.vuMeterCss = {
        height: '0',
    };

    $scope.teacherName = ( function ()
    {
        var teacher = UserService.current ();

        return teacher.teacherName;
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

    $scope.showVideoModal = function ()
    {
        var isVideoEnabled = MediaService.getVideo ();

        $scope.videoModal.show();

        if ( isVideoEnabled )
        {
            ApiService.setVideoTestStream ( 'videoSettings' );
        }
    }

    $scope.enableVideo = function ()
    {
        MediaService.setVideo ( true, function ()
        {
            ApiService.setVideoTestStream ( 'videoSettings' );
            ApiService.updateMediaState ();
            $scope.showVideoOn  = false;
            $scope.showVideoOff = true;
        } );
    }

    $scope.disableVideo = function ()
    {
        MediaService.setVideo ( false, function ()
        {
            ApiService.stopMediaTestStream ();
            ApiService.updateMediaState ();
            $scope.showVideoOn  = true;
            $scope.showVideoOff = false;
        } );
    }

    $scope.showMicModal = function ()
    {
        var isAudioEnabled = MediaService.getAudio ();

        $scope.micModal.show();
        if ( isAudioEnabled )
        {
            _vuMeter ( 0 );
            ApiService.setAudioTestStream ( 'audioSettings', _vuMeter );
        }
    }

    $scope.enableAudio = function ()
    {
        MediaService.setAudio ( true, function ()
        {
            ApiService.setAudioTestStream ( 'audioSettings', _vuMeter );
            ApiService.updateMediaState ();
            $scope.showAudioOn  = false;
            $scope.showAudioOff = true;
        } );
    }

    $scope.disableAudio = function ()
    {
        MediaService.setAudio ( false, function ()
        {
            ApiService.stopMediaTestStream ();
            ApiService.updateMediaState ();
            $scope.showAudioOn  = true;
            $scope.showAudioOff = false;
            _vuMeter ( 0 );
        } );
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