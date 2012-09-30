/**
 * index.js
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
       version : ko.observable( "" ),
       login : function() {
           login();
       }
   };
   
   /**
    * Initialization
    */
   var init = _.once( function( pageId ) {
       debug && console.log( "Login.init: Logon page initialization" );
       
       // Load the app's configuration data
       debug && console.log( "Login.init: Loading configuration" );
       var config = JSONData.getConfig();
       if ( !config ) {
           debug && console.log( "Login.init: Configuration data missing.  Calling loadConfiguration() to load it" );
           JSONData.loadConfiguration( function() {
               debug && console.log( "Login.init: Configuration data loaded.  Current page will be reloaded" );
               // Reload the login page
               // window.location.reload();
               document.location.href = "index.html";
           });
       }
       
       // Set selected language option to match current language
       var currentLanguage = Localization.getLanguage();
       $("option[value=" + currentLanguage + "]").attr( "selected", "true" );
       
       // Display version number on the login page
       if ( !_.isNull( JSONData.getConfig() ) && ( typeof JSONData.getConfig().version !== 'undefined' ) ) {
           loginViewModel.version( JSONData.getConfig().version );
       } else {
           loginViewModel.version( "" );
       }
       
       // Apply the knockout bindings
       ko.applyBindings( Login.loginViewModel );

       // Apply the handler for the username field events
       $('#username').focus( function() {
    	   if( $( this ).val() == Localization.getText( "username" )) {
    		   $( this ).removeClass( "default-text-active" );
    		   $( this ).val( "" );
    	   }
       });
       $('#username').blur( function() {
    	   if( $( this ).val() == "" ) {
    		   $( this ).addClass( "default-text-active" );
    		   $( this ).val( Localization.getText( "username" ));
    	   }
       });
       
       // Apply the handler for the password field events
	   $( '#passwordFake' ).focus( function() { 
	       $( '#password' ).show();
    	   $( this ).hide();
    	   
		   $( '#password' ).val( "" );
		   $( '#password' ).focus();   
       });
       $('#password').blur( function() {
    	   if( $( this ).val() == "" ) {
    		   $( '#passwordFake' ).show();
    		   $( this ).hide();
    	   }
       });
       
       // Assign the default value to the username and password fields
       $( "#username" ).val( Localization.getText( "username" ));
       $( "#passwordFake" ).val( Localization.getText( "password" ));
       $( "#password" ).val( "" );
       $( "#password" ).hide();
       
       UIFrame.clearPageHistory();
       
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
       JSONData.logon( loginViewModel.username(), loginViewModel.password() );
   }

   /**
    * Set the login page block widths based on the specified orientation
    */
   function setBlockWidths( orientation ) {
       debug && console.log( "Login.setBlockWidths: Adjusting login page to " + orientation + " orientation" );
       switch ( orientation ) {
           case "portrait" :
               $(".login-spacer-block").width( portraitSpacer );
               $(".login-center-block").width( portraitCenter );
               break;
           case "landscape" :
               $(".login-spacer-block").width( landscapeSpacer );
               $(".login-center-block").width( landscapeCenter );
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
$("#selectLanguage").change( function( event ) {
    // Write file for selected language to local storage so that all pages 
    // will use it
    debug && console.log( "Login.selectLanguage.change: Changing language to " + $(this).val() );
    Localization.setLanguage( $(this).val(), true );
});

/**
 * pageinit handler for login page
 */
$("div:jqmData(role='page')").on( "pageinit", function( event, ui ) {
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

