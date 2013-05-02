/**
 * PhoneGap plugin that loads a URL
 */
window.LoadURL = function( params, success, fail ) {
    if ( _.isUndefined( cordova ) || _.isUndefined( cordova.exec ) ) {
        $.mobile.hidePageLoadingMsg();
        console.error( "window.LoadURL: cordova and / or cordova.exec is undefined" );
        fail();
    } else {
        return cordova.exec(
            // Success callback
            function( args ) {
                success( args );
            },
            // Failure callback
            function( args ) {
                fail( args );
            },
        'LoadURL', 'start', [params]);
    }
};
