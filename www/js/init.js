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
        debug && console.log( "init.mobileinit: Setting jQuery Mobile defaults at " + new Date() );
        $.mobile.allowCrossDomainPages = true;
        $.support.cors = true;
        $.mobile.ajaxEnabled = false;
        $.mobile.buttonMarkup.hoverDelay = 0;
        $.mobile.defaultPageTransition = "none";
        //noinspection JSPotentiallyInvalidConstructorUsage
        $.mobile.page.prototype.options.domCache = true;
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
            debug && console.log( "init.$(window).load: Running postLoadFn" );
            postLoadFn();
        } else {
            debug && console.log( "init.$(window).load: App running on tablet. postLoadFn skipped." );
        }
    });

    /**
     * This function is executed after the page loads on Chrome Desktop
     * or when the onDeviceReady event fires on the tablet.
     */
    function postLoadFn() {
        var config = Config.getConfig();
        var currentPageId = ( UIFrame.getCurrentPageId() || null);
        var deviceInfo = null;
        var externalStorageDirectory;
        var psrtUrl;
        var useNativeTasksMenu = true;
        var usePhonegapLoadURLPlugin = false;
        var useScrollableDivs = false;
        var osVersionNumber;

        var DEVICES_NOT_SUPPORTING_NATIVE_TASKS_MENU = [
            "espresso10spr",
            "espresso10vzw"
        ];
        var DEVICES_NOT_SUPPORTING_SCROLLABLE_DIVS = [
            "espresso10spr",
            "espresso10vzw"
        ];

        if ( Util.isRunningOnChromeDesktop() ) {
            useScrollableDivs = true;
        } else {
            deviceInfo = "Device Name: '"     + device.name     + "' - " +
                         "Device Cordova: '"  + device.cordova  + "' - " +
                         "Device Platform: '" + device.platform + "' - " +
                         "Device UUID: '"     + device.uuid     + "' - " +
                         "Device Version: '"  + device.version  + "'";
            debug && console.log( "init.postLoadFn: " + deviceInfo );
            osVersionNumber = Number( device.version.substring( 0, 3 ) );
            useNativeTasksMenu = ( _.indexOf( DEVICES_NOT_SUPPORTING_NATIVE_TASKS_MENU, device.name ) == -1 );
            useScrollableDivs = ( device.platform == "iOS" || ( osVersionNumber >= 4.1 &&
                                ( _.indexOf( DEVICES_NOT_SUPPORTING_SCROLLABLE_DIVS, device.name ) == -1 ) ) );
            // iOS does not use the Load URL plugin
            usePhonegapLoadURLPlugin = ( device.platform != "iOS" );
        }

        if ( !_.isUndefined( UIFrame ) ) {
            if ( currentPageId && currentPageId == "loginPage" ) {
                // SFAM-205: Samsung Galaxy Tab requires using jQuery Mobile theming for the tasks menu
                debug && console.log( "init.postLoadFn: Using native themed tasks menu: " + useNativeTasksMenu );
                config[UIFrame.USE_NATIVE_TASKS_MENU] = useNativeTasksMenu;
                // Allow scrollable divs on Android versions + tablets that support them
                debug && console.log( "init.postLoadFn: Using scrollable divs: " + useScrollableDivs );
                config[UIFrame.USE_SCROLLABLE_DIVS] = useScrollableDivs;
                // Use Phonegap plugin for page navigation?
                debug && console.log( "Init.postLoadFn: Using Phonegap LoadURL plugin: " +
                                      usePhonegapLoadURLPlugin );
                config[UIFrame.USE_PHONEGAP_LOADURL_PLUGIN] = usePhonegapLoadURLPlugin;
                // External storage directory
                if ( deviceInfo && config.externalStorageDirectories[ device.name ] ) {
                    externalStorageDirectory = config.externalStorageDirectories[ device.name ];
                } else {
                    externalStorageDirectory = config.externalStorageDirectories[ "default" ];
                }
                debug && console.log( "Init.postLoadFn: External storage directory: " + externalStorageDirectory );
                config.externalStorageDirectory = externalStorageDirectory;
                // PSRT URL
                psrtUrl = "file://" + externalStorageDirectory + config.psrtHtmlFile;
                debug && console.log( "Init.postLoadFn: PSRT URL: " + psrtUrl );
                config.psrtUrl = psrtUrl;
                Config.saveConfiguration( config );
            }
        }

        // Current page ID must be non-null to set the indicators
        if ( Util && currentPageId ) {
            debug && console.log( "init.postLoadFn: Calling Util.isOnline" );
            // If read only mode, change online indicator to read only
            if ( config.readOnlyMode ) {
                $("#onlineIndicator").text( Localization.getText( "readOnly" ) );
            } else {
                if ( Util.isOnline( false ) ) {
                    $("#onlineIndicator").text( Localization.getText( "online" ) );
                } else {
                    $("#onlineIndicator").text( Localization.getText( "offline" ) );
                }
            }
        }

        // iOS requires opening the DB here
        if ( MobileDb ) {
            debug && console.log( "init.postLoadFn: MobileDb.openDB" );
            MobileDb.openDB();
        }
        // Handle the back button ourselves
        document.addEventListener( "backbutton", backKeyDown, true );

        // Handle the offline and online events for all pages except the login page
        debug && console.log( "init.postLoadFn: Adding event handlers for online and offline" );
        document.addEventListener( "offline", function() {
            debug && console.log( "init.offline: Mobile app is now offline" );
            if ( !config.readOnlyMode ) {
                $("#onlineIndicator").text( Localization.getText( "offline" ) );
            }
            window.localStorage.setItem( "onlineStatus", "offline" );
        }, false );
        document.addEventListener( "online", function() {
            debug && console.log( "init.online: Mobile app is now online" );
            if ( !config.readOnlyMode ) {
                $("#onlineIndicator").text( Localization.getText( "online" ) );
            }
            window.localStorage.setItem( "onlineStatus", "online" );
            if ( $("div:jqmData(role='page')")[0].id != "loginPage" ) {
                // When app goes online, post locally saved data to the middle tier
                if ( JSONData && _.isFunction( JSONData.postLocallySavedData ) ) {
                    JSONData.postLocallySavedData( false, null );
                }
            }
        }, false );
    }

    /**
     * Handle the back button ourselves
     */
    function backKeyDown() {
        debug && console.log( "init.backKeyDown: Back button tapped" );
        UIFrame.navigateToPreviousPage();
    }
}();