//  WARNING: AUTO-GENERATED FILE. DON'T MODIFY IT. If you need to update it, go to [PROJECT_ROOT]/config/constants.js
//
//  All values are defined into respective environment file under [PROJECT_ROOT]/config
//  To switch environment, run the following command:
//      gulp replace --env ENVNAME
//  with ENVNAME equls to localdev or production
angular.module ( 'starter.constants', [] )
    .constant ( 'apiUrl', 'https://api.bistri.com' )
    .constant ( 'apiSettings', {"appId":"5edba652","appKey":"d30d0410ad2019b854eb181c40ca1a59","debug":false} )
    .constant ( 'serviceUrl', 'https://bsf.bistri.com' )
    .constant ( 'stream', {"width":640,"height":480} )
    .constant ( 'frontCam', {"rtspUrl":"rtsp://bsf:aKe0tH7C@127.0.0.1:xxxx/test"} )
    .constant ( 'backCam', {"rtspUrl":"rtsp://bsf:aKe0tH7C@127.0.0.1:xxxx/videoSub","ptzUrl":"http://192.168.225.110:88/CGIProxy.fcgi?","user":"bsf","password":"aKe0tH7C","delay":3000} );