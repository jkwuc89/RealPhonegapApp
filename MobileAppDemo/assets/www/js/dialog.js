/**
 * dialog.js
 * 
 * Set up the mobile app's Dialog
 */

"use strict";

/**
 * Dialog
 * Encapsulate the dialog functionality for the application
 */
var Dialog = function() {
	/**
     * Function to show an alert dialog box using the simpledialog plugin. 
     *  Arguments should be localized before being passed to this function.
     * @param title the dialog title
     * @param body the dialog body
     * @param okHandler - function called when OK is tapped, optional
     */
    function showAlert( title, body, okHandler, width ) {
    	debug && console.log( "Dialog.showAlert: Showing dialog" );
    	
    	var dialogWidth = "300px";
    	if( width ) {
    		dialogWidth = width;
    	}
    	
    	// Replace instances of textual end line characters with an HTML end line character
    	body = body.replace( /\n/gm, '<br />' );
    	
    	// Build the dialog variable for the simpleDialog2 plug in
    	var dialog = new EJS({ url: "templates/alertdialog" }).render({
    		title: title,
    		body: body
    	});
    	
    	$(document).simpledialog2({
            blankContent : dialog,
            width: dialogWidth,
            fullScreenForce: true
        });
    	
    	if ( okHandler && _.isFunction( okHandler ) ) {
    	    $('#btnOkay').click( okHandler );
    	} else {
    	    // Default OK handler closes the alert dialog
    	    $('#btnOkay').click( function() {
    	        UIFrame.closeActiveDialog(); 
    	    } );
    	}
    }
    
    /**
     * Function to show a please wait dialog box using the simpledialog plugin. 
     * Arguments should be localized before being passed to this function.
     * The caller of this method will need to call UIFrame.closeActiveDialog()
     * to close this dialog because this dialog has no buttons on it.
     * @param title the dialog title
     * @param body the dialog body
     */
    function showPleaseWait( title, body, width ) {
        debug && console.log( "Dialog.showPleaseWait: Showing dialog" );
        
        var dialogWidth = "300px";
        if( width ) {
        	dialogWidth = width;
        }
        
        // Replace instances of textual end line characters with an HTML end line character
        body = body.replace("\n", "<br />");
        
        // Build the dialog variable for the simpleDialog2 plug in
        var dialog = new EJS({ url: "templates/pleasewaitdialog" }).render({
        	title: title,
            body: body
        });
        
        $(document).simpledialog2({
            blankContent : dialog,
            fullScreenForce: true,
            zindex: '1000',
            width: dialogWidth
        });
    }
    
    /**
     * Function to show a confirm dialog box using the simpledialog plugin. 
     *  Arguments should be localized before being passed to this function.
     * @param title the dialog title
     * @param body the dialog body
     */
    function showConfirm( title, body, handler ) {
    	debug && console.log( "Dialog.showConfirm: Showing dialog" );
    	
    	body = body.replace("\n", "<br />");
    	 
    	// Build the dialog variable for the simpleDialog2 plug in
    	var dialog = new EJS({ url: "templates/confirmdialog" }).render({
    		title: title,
    		body: body
    	});
    	
    	$(document).simpledialog2({
            blankContent : dialog,
            fullScreenForce: true
        });
    	
    	// Assign the handler variable to the listener for the okay button selection\	
    	$('#btnOkay').click( handler );
    }
    
    /**
     * Function to show a confirm dialog box using the simpledialog plugin. 
     *  Arguments should be localized before being passed to this function.
     * @param title the dialog title
     * @param body the dialog body
     * @param yesHandler - Function called when Yes is tapped
     * @param noHandler - Function called when No is tapped, defaults to 
     *                    simply closing the dialog
     * @param width - Width of the dialog specified as "###px" where ### is the width in pixels, optional
     */
    function showConfirmYesNo( title, body, yesHandler, noHandler, width ) {
    	debug && console.log( "Dialog.showConfirmYesNo: Rendering dialog template" );
    	
    	body = body.replace("\n", "<br />");
    	 
    	// Build the dialog variable for the simpleDialog2 plug in
    	var dialog = new EJS({ url: "templates/confirmdialogyesno" }).render({
    		title: title,
    		body: body
    	});
    	
    	var dialogOptions = {};
    	dialogOptions.blankContent = dialog;
    	dialogOptions.fullScreenForce = true;
    	dialogOptions.zindex = '1000';
    	if ( width ) {
    	    dialogOptions.width = width;
    	}
        debug && console.log( "Dialog.showConfirmYesNo: Displaying dialog" );
    	$(document).simpledialog2( dialogOptions );
    	
    	// Assign the handlers to the buttons	
    	$('#btnYes').click( yesHandler );
    	if ( _.isFunction( noHandler ) ) {
    	    $('#btnNo').click( noHandler );
    	} else {
    	    $('#btnNo').click( function() {
    	        UIFrame.closeActiveDialog();
    	    });
    	}
    }
    
    // Public accessible methods are exposed here
    return {
    	'showAlert'        : showAlert,
    	'showConfirm'      : showConfirm,
    	'showConfirmYesNo' : showConfirmYesNo,
    	'showPleaseWait'   : showPleaseWait
    };
}();