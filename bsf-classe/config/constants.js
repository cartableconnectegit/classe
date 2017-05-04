//  @@usageMessage
//
//  All values are defined into respective environment file under [PROJECT_ROOT]/config
//  To switch environment, run the following command:
//      gulp replace --env ENVNAME
//  with ENVNAME equls to localdev or production
angular.module ( 'starter.constants', [] )
    .constant ( 'apiUrl', '@@apiUrl' )
    .constant ( 'apiSettings', '@@apiSettings' )
    .constant ( 'serviceUrl', '@@serviceUrl' )
    .constant ( 'stream', '@@stream' )
    .constant ( 'frontCam', '@@frontCam' )
    .constant ( 'backCam', '@@backCam' );