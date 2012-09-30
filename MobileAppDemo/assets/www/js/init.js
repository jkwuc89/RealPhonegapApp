/**
 * init.js
 */

"use strict";

/**
 * mobileinit event handler - used to set app defaults
 */
$(document).on("mobileinit", function() {
    debug && console.log( "init.mobileinit: Setting jQuery Mobile defaults" );
    $.mobile.ajaxEnabled = false;
    $.mobile.buttonMarkup.hoverDelay = 0;
    $.mobile.defaultPageTransition = "none";
    $.mobile.page.prototype.options.domCache = true;
    $.mobile.loadingMessageTextVisible = true;
});

/**
 * deviceready is fired when PhoneGap is fully loaded and ready to use
 */
document.addEventListener( "deviceready", onDeviceReady, false );
function onDeviceReady() {
    debug && console.log( "init.onDeviceReady: PhoneGap is ready" );
    if ( Util ) {
        debug && console.log( "init.onDeviceReady: Calling Util.isOnline" );
        if ( Util.isOnline() ) {
            $("#onlineIndicator").text( Localization.getText( "online" ) );
        } else {
            $("#onlineIndicator").text( Localization.getText( "offline" ) );
        }
    }
    // iOS requires opening the DB here
    if ( MobileDb ) {
        debug && console.log( "init.onDeviceReady: MobileDb.openDB" );
        MobileDb.openDB();
    }
    // Handle the offline and online events for all pages except the login page
    document.addEventListener( "offline", function( event ) {
        debug && console.log( "init.offline: Mobile app is now offline" );
        $("#onlineIndicator").text( Localization.getText( "offline" ) );
        window.localStorage.setItem( "onlineStatus", "offline" );
    }, false );
    document.addEventListener( "online", function( event ) {
        debug && console.log( "init.online: Mobile app is now online" );
        $("#onlineIndicator").text( Localization.getText( "online" ) );
        window.localStorage.setItem( "onlineStatus", "online" );
        if ( JSONData && _.isFunction( JSONData.postSavedWorkOrders ) ) {
            JSONData.postSavedWorkOrders();
        }
    }, false );
}
