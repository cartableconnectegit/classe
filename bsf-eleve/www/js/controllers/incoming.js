appControllers.controller ( 'IncomingCtrl', function ( $window, $scope, $state, $stateParams, ApiService )
{
    var ringing = $window.document.getElementById ( 'ringing' );

    $scope.userName = $stateParams.data.name;

    $scope.accept = function ()
    {
        ApiService.joinRoom ( $stateParams.room );
    };

    $scope.reject = function ()
    {
        $state.go ( 'settings' );
    };

    $scope.$on ( '$ionicView.enter', function ()
    {
        componentHandler.upgradeDom();
        ringing.play ();
    } );

    $scope.$on ( '$ionicView.leave', function ()
    {
        ringing.pause();
        ringing.currentTime = 0;
    } );
} );