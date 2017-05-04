appControllers.controller ( 'MainCtrl', function ( $window, $rootScope, $scope, $state, $ionicScrollDelegate, $timeout, VideoService, ApiService, GlobalChatService, PTZService )
{
    componentHandler.upgradeDom();

    $scope.chatPaneCss = 'chat-pane';
    $scope.showChat = false;
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

    $scope.$on( 'chatArchiveUpdated', function()
    {
        $scope.safeApply ( function ()
        {
            $scope.chat.messages = GlobalChatService.getMessages ();
        } );
    } );

    ApiService.onVideoShown ( function ()
    {
        $window.document.querySelector ( '.main-view .spinner' ).style.display = 'none';
    } );

    ApiService.onPTZMessage ( function ( action )
    {
        switch ( action )
        {
            case 'moveUp':
                PTZService.moveUp();
                break;
            case 'moveDown':
                PTZService.moveDown();
                break;
            case 'moveLeft':
                PTZService.moveLeft();
                break;
            case 'moveRight':
                PTZService.moveRight();
                break;
            case 'moveStop':
                PTZService.moveStop();
                break;
        };
    } );

    ApiService.onCallEnded ( function ( message )
    {
        $state.go ( 'settings' );
    } );

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

    $scope.stop = function ()
    {
        ApiService.quitRoom ();
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

    $scope.settings = function ()
    {
        $state.go ( 'settings' );
    };

    $scope.$on ( '$ionicView.enter', function ()
    {
        componentHandler.upgradeDom ();

        $scope.safeApply ( function ()
        {
            $scope.showChat = GlobalChatService.getShowChat ();
            $scope.chatCount = GlobalChatService.getCount ();
            $scope.chat.messages = GlobalChatService.getMessages ();
            $scope.chatPaneCss = $scope.showChat ? 'chat-pane chat-pane-visible' : 'chat-pane';
        } );

        GlobalChatService.open ();

        if ( $window.plugins && $window.plugins.insomnia )
        {
            $window.plugins.insomnia.keepAwake ();
        }
    } );

    $scope.$on ( '$ionicView.leave', function ()
    {
        $window.document.querySelector ( '.main-view .spinner' ).style.display = 'block';
        if ( $window.plugins && $window.plugins.insomnia )
        {
            $window.plugins.insomnia.allowSleepAgain ();
        }
    } );

} );