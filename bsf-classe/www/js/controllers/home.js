appControllers.controller ( 'HomeCtrl', function ( $scope, $state, $ionicModal, UserService )
{
    componentHandler.upgradeDom();

    $scope.errors = [];

    $ionicModal.fromTemplateUrl( 'infoError', {
        scope     : $scope,
        animation : 'slide-in-up'
    } ).then( function( modal )
    {
        $scope.infoError = modal;
    } );

    $scope.$on('modal.hidden', function()
    {
        $scope.errors = [];
        $state.go ( 'signin' );
    } );

    $scope.$on('$destroy', function() {
        $scope.infoError.remove();
    } );

    $scope.$on ( '$ionicView.enter', function ()
    {
        componentHandler.upgradeDom();

        UserService.info ().then ( function ( user )
        {
            $state.go ( 'settings' );
        } ).catch ( function ( error )
        {
            $scope.errors = error;
            $scope.infoError.show();
        } );
    } );
} );