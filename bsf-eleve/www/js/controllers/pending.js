appControllers.controller ( 'PendingCtrl', function ( $scope, $state, UserService, ApiService )
{
    $scope.stop = function ()
    {
        ApiService.cancelInvitation ();
    };

    $scope.$on ( '$ionicView.enter', function ()
    {
        componentHandler.upgradeDom();
    } );
} );