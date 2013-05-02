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
     * Wrapper for $(document).simpledialog2 that uses blockUI to prevent
     * all navigation while the dialog is displayed
     * @param dlgOptions - Object containing the simpledialog2 options
     */
    function showDialog( dlgOptions ) {
        if ( _.isUndefined( dlgOptions ) || _.isNull( dlgOptions ) ) {
            throw "Dialog.showDialog: Required parameter dlgOptions is missing";
        }
        dlgOptions.zindex = '1002';
        $(document).simpledialog2( dlgOptions );
        $.blockUI({ message: null });
    }

    /**
     * Is a dialog currently being displayed?
     */
    function isDialogDisplayed() {
        return $(".ui-simpledialog-container").length == 1;
    }

    /**
     * Close an open dialog.  Any post-close UI updates are handled by this method.
     * @param skipCallback - Boolean, skip calling defined callback if set to true, defaults to false
     */
    function closeDialog( skipCallback ) {
        if ( _.isUndefined( skipCallback ) ) {
            skipCallback = false;
        }
        if ( isDialogDisplayed() ) {
            $.unblockUI();
            debug && console.log( "Dialog.closeDialog: Closing currently displayed dialog" );
            $.mobile.sdCurrentDialog.close( skipCallback );
            switch ( UIFrame.getCurrentPageId() ) {
                case "manageWorkOrderRepairDetailsPage" :
                    // Restore the repair details button in the navbar as active
                    $("#manageWorkOrderRepairDetails").addClass( "ui-btn-active" );
                    break;
                case "manageWorkOrderPartsPage" :
                    // Restore the parts button in the navbar as active
                    $("#manageWorkOrderParts").addClass( "ui-btn-active" );
                    break;
            }
        } else {
            debug && console.log( "Dialog.closeDialog: Close skipped because no dialog is currently displayed" );
        }
    }

    /**
     * Chose the about dialog box
     */
    function showAbout() {
        debug && console.log( "Dialog.showAbout: Showing about dialog box" );

        // Build the dialog variable for the simpleDialog2 plug in
        var dialog = new EJS({ url: "templates/aboutdialog" }).render({
        });

        Dialog.showDialog({
            blankContent : dialog,
            width: "600px",
            fullScreenForce: true
        });

        // If there are unsaved changes, display unsaved changes warning
        // and hide the debug page button
        if ( window.localStorage.getItem( UIFrame.LS_UNSAVED_CHANGES ) ) {
            UIFrame.showElement( "#unsavedChangesWarning", "block" );
            UIFrame.hideElement( "#btnDebug" );
        }

        // Default OK handler closes the alert dialog
        $('#btnOkay').click( function() {
            Dialog.closeDialog( false );
        });
        // Debug button takes tech to the debug page
        $('#btnDebug').click( function() {
            // Use local storage item to bring tech back
            // to current page when Exit is tapped on debug page
            window.localStorage.setItem( "debugExitPage", UIFrame.getCurrentPage().url );
            UIFrame.navigateToPage( "debug.html", false, null );
        });
    }

    /**
     * Function to show an alert dialog box using the simpledialog plugin.
     *  Arguments should be localized before being passed to this function.
     * @param title the dialog title
     * @param body the dialog body
     * @param okHandler - function called when OK is tapped, optional
     * @param width - dialog width, use format "###px"
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

        Dialog.showDialog({
            blankContent : dialog,
            width: dialogWidth,
            fullScreenForce: true
        });

        if ( okHandler && _.isFunction( okHandler ) ) {
            $('#btnOkay').click( okHandler );
        } else {
            // Default OK handler closes the alert dialog
            $('#btnOkay').click( function() {
                Dialog.closeDialog();
            } );
        }
    }

    /**
     * Function to show a please wait dialog box using the simpledialog plugin.
     * Arguments should be localized before being passed to this function.
     * The caller of this method will need to call Dialog.closeDialog()
     * to close this dialog because this dialog has no buttons on it.
     * @param title the dialog title
     * @param body the dialog body
     * @param width - dialog width, use format "###px"
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

        var dlgOptions = {
            blankContent : dialog,
            fullScreenForce: true,
            width: dialogWidth,
            zindex: '1001'
        };
        $.blockUI({ message: null });
        Dialog.showDialog( dlgOptions );
        setDialogTopAndScrollIntoView();
    }

    /**
     * Function to show a confirm dialog box using the simpledialog plugin.
     *  Arguments should be localized before being passed to this function.
     * @param title the dialog title
     * @param body the dialog body
     * @param handler - OK button click handler fn
     */
    function showConfirm( title, body, handler ) {
        debug && console.log( "Dialog.showConfirm: Showing dialog" );

        body = body.replace("\n", "<br />");

        // Build the dialog variable for the simpleDialog2 plug in
        var dialog = new EJS({ url: "templates/confirmdialog" }).render({
            title: title,
            body: body
        });

        Dialog.showDialog({
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
        Dialog.showDialog( dialogOptions );

        // Assign the handlers to the buttons
        $('#btnYes').click( yesHandler );
        if ( _.isFunction( noHandler ) ) {
            $('#btnNo').click( noHandler );
        } else {
            $('#btnNo').click( function() {
                Dialog.closeDialog( false );
            });
        }
    }

    /**
     * Show a dialog with a scrollable, read-only text area.  This dialog is suitable
     * for textual content that is too long to fit inside a conventional dialog.
     * @param title - Dialog title
     * @param body - Text shown inside scrollable textarea element
     * @param closeHandler - Close button click handler function, optional
     * @param width - Dialog width in pixels, optional, defaults to 600px
     */
    function showScrollableDialog( title, body, closeHandler, width ) {
        debug && console.log( "Dialog.showScrollableDialog: Showing dialog" );

        var dialogWidth = "600px";
        if ( width ) {
            dialogWidth = width;
        }

        var dialog = new EJS({ url: "templates/scrollabletextdialog" }).render({
            title: title,
            body: body
        });

        Dialog.showDialog({
            blankContent : dialog,
            width: dialogWidth,
            fullScreenForce: true
        });

        if ( closeHandler && _.isFunction( closeHandler ) ) {
            $('#closeButton').click( closeHandler );
        } else {
            // Default close button handler closes this dialog
            $('#closeButton').click( function() {
                Dialog.closeDialog();
            } );
        }
    }

    /**
     * Move the top of a dialog up by the specified amount
     * @param dialogId - HTML DOM ID of dialog to move
     * @param top - Amount to move top in pixels
     */
    function moveDialogTop( dialogId, top ) {
        if ( _.isUndefined( dialogId ) || _.isNull( dialogId ) ||
            _.isUndefined( top ) || _.isNull( top ) ) {
            throw "Dialog.moveDialogTop: Required parameters (dialogId, top) are null or undefined";
        }
        var dlg = $( dialogId ).parent();
        var currentPos = dlg.offset();
        dlg.offset({
            top: currentPos.top + top,
            left: currentPos.left
        });
    }

    /**
     * Set the dialog's top position and scroll the document element
     * to show the dialog
     */
    function setDialogTopAndScrollIntoView() {
        var dlgContainer = $( "div.ui-simpledialog-container" );
        var dlgContainerOffset = dlgContainer.offset();
        dlgContainer.offset( {
            top: 220,
            left: dlgContainerOffset.left
        });
        $(document).scrollTop( 0 );
    }

    // Public accessible methods are exposed here
    return {
        'closeDialog'                   : closeDialog,
        'isDialogDisplayed'             : isDialogDisplayed,
        'moveDialogTop'                 : moveDialogTop,
        'setDialogTopAndScrollIntoView' : setDialogTopAndScrollIntoView,
        'showAbout'                     : showAbout,
        'showAlert'                     : showAlert,
        'showConfirm'                   : showConfirm,
        'showConfirmYesNo'              : showConfirmYesNo,
        'showDialog'                    : showDialog,
        'showPleaseWait'                : showPleaseWait,
        'showScrollableDialog'          : showScrollableDialog
    };
}();
