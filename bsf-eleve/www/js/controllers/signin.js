appControllers.controller ( 'SigninCtrl', function ( $scope, $state, UserService, serviceUrl, localStorageService )
{
    $scope.error = {
        messages : []
    };

    $scope.signin = {
        login    : "",
        password : ""
    };

    $scope.pwdInsert = function ( value )
    {
        var field    = document.querySelector ( '#schoolbag_password' ),
            password = $scope.signin.password;

        field.parentElement.MaterialTextfield.change ( password + value );

        $scope.signin.password = password + value;
    };

    $scope.pwdReset = function ()
    {
        var field    = document.querySelector ( '#schoolbag_password' );

        field.parentElement.MaterialTextfield.change ( '' );

        $scope.signin.password = '';
    };

    $scope.signIn = function ()
    {
        UserService.login ( $scope.signin.login, $scope.signin.password )
            .then ( function ( user )
            {
                localStorageService.set ( 'login', $scope.signin.login );
                $scope.signin.password = "";
                $scope.error.messages = [];
                $state.go ( 'home' );
            } )
            .catch ( function ( errors )
            {
                $scope.error.messages = [];
                errors.forEach ( function ( error )
                {
                    $scope.error.messages.push ( error );
                } );
            } );
    };

    $scope.$on ( '$ionicView.enter', function ()
    {
        var field = document.querySelector ( '#user_id' ),
            login = localStorageService.get ( 'login' );

        componentHandler.upgradeDom();

        if ( login )
        {
            field.parentElement.MaterialTextfield.change ( login );
            $scope.signin.login = login;
        }
    } );
} );