/**
 * index.js
 */

"use strict";

/**
 * Block widths for the login page
 */
var Index = function() {
    
   // Knockout view model for the login page
   var indexViewModel = {
       version : ko.observable( "" ),
       jsonDemo : function() {
           debug && console.log( "Index.jsonDemo: Running JSON demo" );
           JSONData.reset();
       },
       dbDemo : function() {
           console.log( "Index.jsonDemo: Running database demo" );
           Dialog.showAlert( "Dialog Test", "Testing dialog position" );
       }
   };
   
   /**
    * Initialization
    */
   var init = _.once( function( pageId ) {
       debug && console.log( "Index.init: Index page initialization" );
       
       // Load the app's configuration data
       debug && console.log( "Index.init: Loading configuration" );
       var config = JSONData.getConfig();
       if ( !config ) {
           debug && console.log( "Index.init: Configuration data missing.  Calling loadConfiguration() to load it" );
           JSONData.loadConfiguration( function() {
               debug && console.log( "Index.init: Configuration data loaded.  Current page will be reloaded" );
               UIFrame.reloadCurrentPage();
           });
       }
       
       // Set selected language option to match current language
       var currentLanguage = Localization.getLanguage();
       $("option[value=" + currentLanguage + "]").attr( "selected", "true" );
       
       // Display version number on the login page
       if ( !_.isNull( JSONData.getConfig() ) && ( typeof JSONData.getConfig().version !== 'undefined' ) ) {
           indexViewModel.version( JSONData.getConfig().version );
       } else {
           indexViewModel.version( "" );
       }
       
       // Apply the knockout bindings
       ko.applyBindings( indexViewModel );

       // This MUST be the last line inside each page specific init function
       UIFrame.postPageSpecificInit( pageId );
   });
   
   return {
       'init'           : init
   };
}();

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
    debug && console.log( "Index.selectLanguage.change: Changing language to " + $(this).val() );
    Localization.setLanguage( $(this).val(), true );
});

/**
 * pageinit handler for login page
 */
$("div:jqmData(role='page')").on( "pageinit", function( event, ui ) {
    // All pages must set pageId to this.id
    var pageId = this.id;
    debug && console.log( "Index.pageinit: Initializing " + pageId );
    // This MUST be called by every page specific pageinit event handler!
    UIFrame.init( pageId, function() {
        Index.init( pageId );
    });
});

