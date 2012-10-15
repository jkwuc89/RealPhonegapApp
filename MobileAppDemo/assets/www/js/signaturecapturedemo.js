/**
 * signaturecapturedemo.js 
 */

"use strict";

/**
 * Using the Revealing Module JavaScript pattern to encapsulate
 * the UI frame functionality into an object
 */
var SignatureCaptureDemo = function() {

    // Signature pad instance
    var signaturePad = null;
    
    var demoViewModel = {
        signatureDate : ko.observable( Util.getISOCurrentTime() ),
        signatureImage : ko.observable(""),
        clearSignature : clearSignature,
        saveSignature : saveSignature
    };    
    
    /**
     * Initialization
     */
    var init = _.once( function( pageId ) {
        debug && console.log( "SignatureCaptureDemo.init: New page initialization" );

        // Add computed observable for displaying a formatted signature date
        demoViewModel.formattedSignatureDate = ko.computed( function() {
            return Localization.formatDateTime( demoViewModel.signatureDate(), "D" );
        });
        
        // Apply view model bindings to populate several of the fields on the overview page
        ko.applyBindings( demoViewModel );
        
        // Options for the signature pad initialization
        var options = {
            defaultAction : "drawIt",
            drawOnly : true,
            lineTop :  210,
            onFormError : null 
        };
        signaturePad = $('.sigPad').signaturePad( options );
    });    

    /**
     * Clear the signature
     */
    function clearSignature() {
        // Clear the signature when clear is tapped
        demoViewModel.signatureImage( "" );
        $("#signatureImage").hide();
        signaturePad.clearCanvas();
    }
    
    /**
     * Save and display the captured signature
     */
    function saveSignature() {
        // Check the size of the signature array for a signature
        var signatureString = signaturePad.getSignatureString();
        if ( signatureString != "[]" ) {
            // Update the view model to display the captured signature
            debug && console.log( "CaptureSignatureDemo.saveSignature:  Updating view model with signature" );
            demoViewModel.signatureImage( signaturePad.getSignatureImage() );
            $("#signatureImage").show();
        }    
    }
    
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
    debug && console.log( "SignatureCaptureDemo.pageinit: Initializing " + pageId );
    // This MUST be called by every page specific pageinit event handler!
    UIFrame.init( pageId, function() {
        debug && console.log( "SignatureCaptureDemo.pageinit: Page specific init goes here" );
        SignatureCaptureDemo.init( pageId );

        // This MUST be the last line inside each page specific init function
        UIFrame.postPageSpecificInit( pageId );
    });
});
