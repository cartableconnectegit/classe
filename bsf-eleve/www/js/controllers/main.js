appControllers.controller ( 'MainCtrl', function ( $window, $rootScope, $scope, $state, $ionicScrollDelegate, $timeout, UserService, MediaService, VideoService, ApiService, GlobalChatService, frontCam, backCam, $ionicModal )
{
	
    componentHandler.upgradeDom();

    $scope.chat = {
        messages : [],
        field    : ''
    };
    $scope.video1Css = 'videoMain';
    $scope.video2Css = 'videoSub';
    $scope.showChat = false;
    $scope.chatPaneCss = 'chat-pane';
    $scope.chatCount = 0;
    $scope.camLabel = 'CAMÉRA SAC';
    $scope.showControls = false;
    $scope.toggleWebcamCss = MediaService.getVideo () ? 'toggle-webcam-on' : 'toggle-webcam-off';

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

    ApiService.onCallEnded ( function ( message )
    {
        VideoService.stop ( 'video1' );
        VideoService.stop ( 'video2' );
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
            $scope.chat.field = '';
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

    $scope.toggleVideoStream = function ()
    {
        videoState = !MediaService.getVideo ();
        MediaService.setVideo ( videoState, function ()
        {
            ApiService.updateMediaState ();
            $scope.toggleWebcamCss = videoState ? 'toggle-webcam-on' : 'toggle-webcam-off';
        } );
    }

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

    $scope.toggleVideo = function ( video )
    {
        if ( video == 'video1' )
        {
            if ( $scope.video1Css == 'videoMain' )
            {
                return; 
            }
            $scope.video1Css = 'videoMain';
            $scope.video2Css = 'videoSub';
            $scope.showControls = false;
            $scope.camLabel = 'CAMÉRA SAC';
        }
        else
        {
            if ( $scope.video2Css == 'videoMain' )
            {
                return; 
            }
            $scope.video1Css = 'videoSub';
            $scope.video2Css = 'videoMain';
            $scope.showControls = true;
            $scope.camLabel = 'CAMÉRA AMBIANCE';
        }
    };

    $scope.settings = function ()
    {
        $state.go ( 'settings' );
    };

    $scope.ptzUp = function ()
    {
        ApiService.sendPTZAction( 'moveUp' );
    };

    $scope.ptzDown = function ()
    {
        ApiService.sendPTZAction( 'moveDown' );
    };

    $scope.ptzLeft = function ()
    {
        ApiService.sendPTZAction( 'moveLeft' );
    };

    $scope.ptzRight = function ()
    {
        ApiService.sendPTZAction( 'moveRight' );
    };

    $scope.ptzStop = function ()
    {
        ApiService.sendPTZAction( 'moveStop' );
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

        UserService.ports ()
            .then ( function ( data )
            {
                $window.document.querySelector ( '.video1.spinner' ).style.display = 'block';
                $window.document.querySelector ( '.video2.spinner' ).style.display = 'block';

                VideoService.start ( 'video1', frontCam.rtspUrl.replace ( 'xxxx', data.front_cam ), function ()
                {
                    $window.document.querySelector ( '.video1.spinner' ).style.display = 'none';
                }, function ()
                {
                    $window.document.querySelector ( '.video1.spinner' ).style.display = 'none';
                } );

                VideoService.start ( 'video2', backCam.rtspUrl.replace ( 'xxxx', data.rear_cam ), function ()
                {
                    $window.document.querySelector ( '.video2.spinner' ).style.display = 'none';
                }, function ()
                {
                    $window.document.querySelector ( '.video2.spinner' ).style.display = 'none';
                } );
            } )
            .catch ( function ()
            {  
                console.log ( 'cannot connect to cameras: no ports defined' );
            } );

        if ( $window.plugins && $window.plugins.insomnia )
        {
            $window.plugins.insomnia.keepAwake ();
        }
    } );

    $scope.$on ( '$ionicView.leave', function ()
    {
        if ( $window.plugins && $window.plugins.insomnia )
        {
            $window.plugins.insomnia.allowSleepAgain ();
        }
    } );

	
	$ionicModal.fromTemplateUrl( 'captureModal', {
        scope     : $scope,
        animation : 'slide-in-up'
    } ).then( function( modal )
    {
        $scope.captureModal = modal;
    } );
	
	$scope.showCapture = function ()
    {
		 $scope.captureModal.show();
       /* var isVideoEnabled = MediaService.getVideo ();

        $scope.captureModal.show();

        if ( isVideoEnabled )
        {
            ApiService.setVideoTestStream ( 'videoSettings' );
        }*/
    }
	
	$scope.cancelCapture = function() {
      $scope.captureModal.hide();
   };
   
	
   
   $ionicModal.fromTemplateUrl( 'editCaptureModal', {
        scope     : $scope,
        animation : 'slide-in-up'
    } ).then( function( modal )
    {
        $scope.editCaptureModal = modal;
    } );
	
	
	$scope.editCapture = function ()
    {
		$scope.captureModal.hide();
		$scope.editCaptureModal.show();
		var canvas = document.getElementById("signatureCanvas");
		var signaturePad = new SignaturePad(canvas);
		signaturePad.fromDataURL('bg.jpg')		
    }
	
	$scope.cancelEditCapture = function() {
		//var canvas = document.getElementById("signatureCanvas");
		//var signaturePad = new SignaturePad(canvas);
		//signaturePad.clear();
		//signaturePad.fromDataURL('img/bg.jpg')
		$scope.editCaptureModal.hide();
   };
	
	
} );