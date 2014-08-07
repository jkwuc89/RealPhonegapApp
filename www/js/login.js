/**
 * login.js
 */

"use strict";

/**
 * Block widths for the login page
 */
var Login = function() {

    var portraitSpacer = "20%",
        portraitCenter = "60%",
        landscapeSpacer = "30%",
        landscapeCenter = "40%";

    // Knockout view model for the login page
    var loginViewModel = {
        dataDebug : ko.observable( false ),
        username : ko.observable( "" ),
        password : ko.observable( "" ),
        server : ko.observable( "" ),
        version : ko.observable( "" ),
        login : function() {
            login();
        }
    };

    /**
     * After the overview page loads, prompt the tech for the middle tier
     * host if it is not set inside the configuration
     */
    $(window).load( function() {
        // SFAM-186: Prompt for middle tier base URL if it's not defined yet
        var config = Config.getConfig();
        if ( config.middleTierBaseUrl ) {
            debug && console.log( "Login.pageinit: Middle tier URL = " + config.middleTierBaseUrl );
            if ( config.middleTierLabel ) {
                loginViewModel.server( Localization.getText( config.middleTierLabel ) );
            }
        } else {
            debug && console.log( "Login.pageinit: Asking tech to choose middle tier host" );
            // Display the middle tier selection dialog
            var middleTierList = config.middleTierUrls;
            var dialog = new EJS({ url: "templates/selectmiddletierdialog" }).render({
                middleTierList: middleTierList
            });
            Dialog.showDialog({
                blankContent : dialog,
                width: '400px',
                fullScreenForce: true
            });
            $('#btnOkay').click( function() {
                var selectedMiddleTier = _.find( middleTierList, function( listItem ) {
                    return ( listItem.label == $("#middleTierList" ).val() );
                });
                var readOnlyMode = ( $("#readOnlyMode").attr( 'checked' ) == "checked" );
                Dialog.closeDialog( false );
                debug && console.log( "Login.window.load: Selected middle tier: " + JSON.stringify( selectedMiddleTier ) );
                debug && console.log( "Login.window.load: Read only mode = " + readOnlyMode );
                config.middleTierBaseUrl = selectedMiddleTier.url;
                config.middleTierLabel = selectedMiddleTier.label;
                config.readOnlyMode = readOnlyMode;
                Config.saveConfiguration( config );
                UIFrame.reloadCurrentPage();
            });
        }
    });

    /**
     * Initialization
     */
    var init = _.once( function( pageId ) {
        var currentTime;
        var logonObj = JSONData.getObjectById( JSONData.JSON_DATATYPE_LOGON, JSONData.LOGON_WEBID, null );
        var logonTime;

        debug && console.log( "Login.init: Logon page initialization" );

        // Load the app's configuration data
        debug && console.log( "Login.init: Loading configuration" );
        var config = Config.getConfig();
        if ( !config ) {
            debug && console.log( "Login.init: Configuration data missing.  Calling loadConfiguration() to load it" );
            Config.loadConfiguration( function() {
                debug && console.log( "Login.init: Configuration data loaded.  Current page will be reloaded" );
                // Reload the login page
                UIFrame.reloadCurrentPage();
            });
        }

        // Set selected language option to match current language
        /*var currentLanguage = Localization.getLanguage();
        $("option[value=" + currentLanguage + "]").attr( "selected", "true" );*/

        // Display version number on the login page
        if ( !_.isNull( Config.getConfig() ) && ( typeof Config.getConfig().version !== 'undefined' ) ) {
            loginViewModel.version( Config.getConfig().version );
        } else {
            loginViewModel.version( "" );
        }

        // Apply the knockout bindings
        ko.applyBindings( Login.loginViewModel );

        // Apply the handler for the username field events
        var usernameField = $('#username');
        usernameField.focus( function() {
            if( $( this ).val() == Localization.getText( "username" )) {
                $( this ).removeClass( "default-text-active" );
                $( this ).val( "" );
            }
        });
        usernameField.blur( function() {
            if( $( this ).val() == "" ) {
                $( this ).addClass( "default-text-active" );
                $( this ).val( Localization.getText( "username" ));
            }
        });

        // Apply the handler for the password field events
        var passwordField = $( '#password' );
        var passwordFake = $( '#passwordFake' );
        passwordFake.focus( function() {
            passwordField.show();
            $( this ).hide();

            passwordField.val( "" );
            passwordField.focus();
        });
        passwordField.blur( function() {
            if ( $( this ).val() == "" ) {
                passwordFake.show();
                $( this ).hide();
            }
        });

        usernameField.live( 'keydown', function( e ) {
            var keyCode = e.keyCode || e.which;
            if ( keyCode === 9 ) {
                e.preventDefault();
                passwordField.show();
                passwordFake.hide();
                passwordField.val( "" );
                passwordField.focus();
           }
        });

        // Assign the default value to the username and password fields
        usernameField.val( Localization.getText( "username" ));
        passwordFake.val( Localization.getText( "password" ));
        passwordField.val( "" );
        passwordField.hide();

        UIFrame.clearPageHistory();

        // Automatically logon? This is done when the mobile app's last state is paused,
        // an idle time logoff has not occurred and the logon object exists
        if ( logonObj ) {
            // Automatic logon can only occur within idle timeout span
            currentTime = new Date().getTime();
            logonTime = new Date( logonObj.logonDateTime ).getTime();
            if ( ( currentTime - logonTime < ( config.idleTimeout * 60 * 1000 ) ) &&
                 window.localStorage.getItem( JSONData.LS_APP_PAUSED ) &&
                 !window.localStorage.getItem( JSONData.LS_IDLE_TIME_LOGOFF_OCCURRED ) ) {
                debug && console.log( "Login.init: Attempting automatic login after application pause" );
                JSONData.logon( logonObj.username, logonObj.password, true );
            } else {
                debug && console.log( "Login.init: Conditions for automatic login not met" );
            }
        }

        // This MUST be the last line inside each page specific init function
        UIFrame.postPageSpecificInit( pageId );
    });

   /**
    * Login handler
    */
   function login() {
       debug && console.log( "Login.login(): Logging on as username " + loginViewModel.username() +
                             " with password " + loginViewModel.password() );
       Dialog.showPleaseWait( Localization.getText( "loginAttemptHeader"),  Localization.getText( "loginAttempt"), "350px" );
       JSONData.logon( loginViewModel.username(), loginViewModel.password(), false );
   }

   /**
    * Set the login page block widths based on the specified orientation
    */
   function setBlockWidths( orientation ) {
       debug && console.log( "Login.setBlockWidths: Adjusting login page to " + orientation + " orientation" );
       var loginSpacerBlock = $(".login-spacer-block");
       var loginCenterBlock = $(".login-center-block");
       switch ( orientation ) {
           case "portrait" :
               loginSpacerBlock.width( portraitSpacer );
               loginCenterBlock.width( portraitCenter );
               break;
           case "landscape" :
               loginSpacerBlock.width( landscapeSpacer );
               loginCenterBlock.width( landscapeCenter );
               break;
       }
   }

   return {
       'init'           : init,
       'loginViewModel' : loginViewModel,
       'setBlockWidths' : setBlockWidths
   };
}();

/**
 * Adjust the block widths when then orientation changes
 */
$(window).on("orientationchange", function( event ) {
    Login.setBlockWidths( event.orientation );
});

/**
 * Disable the ability to turn off the footer by tapping on the screen
 */
$("[data-role=footer]").fixedtoolbar({ tapToggle: false });

/**
 * Change handler for the language dropdown
 */
/*$("#selectLanguage").change( function( event ) {
    // Write file for selected language to local storage so that all pages
    // will use it
    debug && console.log( "Login.selectLanguage.change: Changing language to " + $(this).val() );
    Localization.setLanguage( $(this).val(), true );
});*/

/**
 * pageinit handler for login page
 */
$("div:jqmData(role='page')").on( "pageinit", function() {
    // All pages must set pageId to this.id
    var pageId = this.id;
    debug && console.log( "Login.pageinit: Initializing " + pageId );
    if( window.innerHeight > window.innerWidth ) {
        Login.setBlockWidths( "portrait" );
    }
    // This MUST be called by every page specific pageinit event handler!
    UIFrame.init( pageId, function() {
        Login.init( pageId );
    });
});

