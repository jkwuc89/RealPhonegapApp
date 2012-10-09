/**
 * newpage.js 
 * Use this as a template for creating a new JavaScript module 
 * for a new page 
 */

"use strict";

/**
 * Using the Revealing Module JavaScript pattern to encapsulate
 * the UI frame functionality into an object
 */
var NewPage = function() {

    /**
     * Initialization
     */
    var init = _.once( function( pageId ) {
        debug && console.log( "NewPage.init: New page initialization" );
    });    

    return {
        'init'           : init
    };

}();

/**
 * pageinit event handler 
 */
$("div:jqmData(role='page')").on( "pageinit", function( event, ui ) {
    // All pages must set pageId to this.id
    var pageId = this.id;
    debug && console.log( "NewPage.pageinit: Initializing " + pageId );
    // This MUST be called by every page specific pageinit event handler!
    UIFrame.init( pageId, function() {
        debug && console.log( "NewPage.pageinit: Page specific init goes here" );

        // This MUST be the last line inside each page specific init function
        UIFrame.postPageSpecificInit( pageId );
    });
});
