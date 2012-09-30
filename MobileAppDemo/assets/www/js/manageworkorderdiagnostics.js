/**
 * manageworkorderdiagnostics.js
 */

"use strict";

/**
 * ManageWorkOrderDiagnostics object
 */
var ManageWorkOrderDiagnostics = function() {
    
    /**
     * Init this object
     */
    function init() {
        debug && console.log( "ManageWorkOrderDiagnostics.init" );
        ManageWorkOrder.init();
    }
    
    /**
     * populatePage
     * Populate the work order diagnostics page
     * @param pageId - Page ID for manage work order page being populated
     */
    function populatePage( pageId ) {
        debug && console.log( "ManageWorkOrderDiagnostics.populatePage: Populating the page" );
        // Populate the common parts of manage work order
        ManageWorkOrder.populatePage( pageId );
    }
    
    return {
        'init'                 : init,
        'populatePage'         : populatePage
    };
}();

/**
 * pageinit event handler 
 */
$("div:jqmData(role='page')").on( "pageinit", function( event, ui ) {
    // All pages must set pageId to this.id
    var pageId = this.id;
    debug && console.log( "ManageWorkOrderDiagnostics.pageinit" );
    UIFrame.init( pageId, function() {
        debug && console.log( "ManageWorkOrderDiagnostics.pageinit: Executing page specific init" );
        ManageWorkOrderDiagnostics.init();
        ManageWorkOrderDiagnostics.populatePage( pageId );

        // This MUST be the last line inside each page specific init function
        UIFrame.postPageSpecificInit( pageId );
    });
});

