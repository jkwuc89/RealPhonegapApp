/**
 * init.js
 */

"use strict";

/**
 * Init
 */
var Init = function() {
    /**
     * mobileinit event handler - used to set app defaults
     */
    $(document).on("mobileinit", function() {
        debug && console.log( "init.mobileinit: Setting jQuery Mobile defaults" );
        $.mobile.ajaxEnabled = false;
        $.mobile.defaultPageTransition = "fade";
        $.mobile.loadingMessageTextVisible = true;
    });

    /**
     * After the PhoneGap deviceready event fires, run postLoadFn()
     */
    document.addEventListener( "deviceready", onDeviceReady, false );
    function onDeviceReady() {
        debug && console.log( "init.onDeviceReady: PhoneGap is ready at " + new Date() );
        debug && console.log( "init.onDeviceReady: Running postLoadFn" );
        postLoadFn();
    }

    /**
     * After the overview page loads on Chrome Desktop, run postLoadFn()
     */
    $(window).load( function() {
        if ( Util.isRunningOnChromeDesktop() ) {
            debug && console.log( "init.window.load: App running on Chrome Desktop.  Calling postLoadFn." );
            postLoadFn();
        } else {
            debug && console.log( "init.window.load: App running on tablet" );
        }
    });

    /**
     * This function is executed after the page loads on Chrome Desktop
     * or when the onDeviceReady event fires on the tablet.
     */
    function postLoadFn() {
        debug && console.log( "Init.postLoadFn: Started at " + new Date() );
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
        }, false );
    }
}();

