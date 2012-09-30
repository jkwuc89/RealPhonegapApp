/**
 * newpage.js 
 * Use this as a template for creating a new JavaScript module 
 * for a new page 
 */

"use strict";

/**
 * 
 */
var NewPage = function() {
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
