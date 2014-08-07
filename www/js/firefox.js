/**
 * PhoneGap plugin that starts Firefox
 */
window.Firefox = function( params, success, fail ) {
    return cordova.exec(
        // Success callback
        function( args ) {
            success( args );
        },
        // Failure callback
        function( args ) {
            fail( args );
        },
    'Firefox', 'start', [params]);
};
