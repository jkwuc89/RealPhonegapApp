/**
 * closeoutday.js
 */

"use strict";

/**
 * CloseOutDay
 */
var CloseOutDay = function() {
    var numClockingsBeingClosedOut,
        openEntries = [],
        loggedInEntries = [],
        closeOutDate = null;

    // Retrieve the required JSON elements to avoid many JSON retrievals
    var laborCodes = JSONData.getObjectsByDataType( "laborCodes" );

    // Maintain technicianNotes to add to the timecard attempt
    var technicianNotes = "";

    /**
     * After the PhoneGap deviceready event fires, run postLoadFn()
     */
    document.addEventListener( "deviceready", onDeviceReady, false );
    function onDeviceReady() {
        debug && console.log( "CloseOutDay.onDeviceReady: Running postLoadFn" );
        postLoadFn();
    }

    /**
     * After this page loads on Chrome Desktop, run postLoadFn()
     */
    $(window).load( function() {
        if ( Util.isRunningOnChromeDesktop() ) {
            debug && console.log( "CloseOutDay.window.load: Running postLoadFn" );
            postLoadFn();
        } else {
            debug && console.log( "CloseOutDay.window.load: App running on tablet. postLoadFn skipped." );
        }
    });

    /**
     * This function is executed after the page loads on Chrome Desktop
     * or when the onDeviceReady event fires on the tablet.
     */
    function postLoadFn() {
        debug && console.log( "CloseOutDay.postLoadFn: Running..." );

        // Content ready...show the div that contains it
        UIFrame.showElement( "div#closeOutDayPageContent", "block" );

        // SFAM-282: Navigate back to the timesheet if there are no clocking's to close
        if ( numClockingsBeingClosedOut === 0 ) {
            Dialog.showAlert( Localization.getText( "closeOutDayPage" ),
                              Localization.getText( "closeOutDayNoClockingsAlert" ),
                function() {
                    window.localStorage.removeItem( JSONData.LS_CLOSE_OUT_DATE );
                    window.localStorage.removeItem( JSONData.LS_CLOSE_OUT_DAY_ATTEMPT );
                    UIFrame.navigateToPage( "timesheet.html", true, null );
                }, "400px" );
        }
    }

    /**
     * Populate the close out day timesheet list
     */
    function populateListViews( ) {
        numClockingsBeingClosedOut = 0;
        debug && console.log( "CloseOutDay.populateListViews: Populating the time sheet list" );
        closeOutDate = window.localStorage.getItem( JSONData.LS_CLOSE_OUT_DATE );

        // Remove all existing items from the pms due list
        var timeSheetList = $('#timeSheetList');
        timeSheetList.children('li').remove();

        var listItem = new EJS({url: 'templates/timesheetlistitem'}),
            listDivider = new EJS({url: 'templates/timesheetlistdivider'}),
            technicianClocking =  _.sortBy( JSONData.getObjectsByDataType("technicianClocking"), function( clocking ) {
                return clocking.timeStart;
            });

        timeSheetList.append( listDivider.render() );
        debug && console.log( "CloseOutDay.populateListViews: " + technicianClocking.length + " clocking entries found." );

        var hours = 0.0,
            totalPaidHours = 0.0,
            totalUnpaidHours = 0.0,
            hoursMilli = 1000 * 60 * 60,
            startTime = null,
            endTime = null,
            type = null,
            clockTime = null,
            weekDays = [
                "Sunday",
                "Monday",
                "Tuesday",
                "Wednesday",
                "Thursday",
                "Friday",
                "Saturday"
            ];

        var date = null,
            customer = null,
            workOrder = null;

        for ( var i = 0; i < technicianClocking.length; i++ ) {
            clockTime = technicianClocking[i];

            type = "";
            workOrder = "";
            customer = "";

            // If the clock time entry is not for "Logged In" and not closed out
            if ( !clockTime.closed && new Date( clockTime.timeStart ).setHours( 0, 0, 0, 0 ) == closeOutDate ) {

                if ( _.isNull( clockTime.timeEnd ) ) {
                    // TODO: Save me to LS
                    clockTime.timeEnd = Util.getISOCurrentTime();
                }

                if ( clockTime.technicianStatus == JSONData.TECHNICIAN_STATUS_LOGGED_IN_OUT ) {
                    loggedInEntries.push( clockTime );
                } else {
                    openEntries.push( clockTime );

                    // Determine the time difference
                    startTime = new Date( clockTime.timeStart );

                    // Re-format the start and end times for the list items
                    date = Localization.formatDateTime( clockTime.timeStart, 'd' );

                    // If available, retrieve the correct workOrder, customer and billing type information.
                    if ( clockTime.workOrderDocumentNumber ) {
                        workOrder = clockTime.workOrderDocumentNumber;
                    } else {
                        workOrder = " - ";
                    }
                    if ( clockTime.workOrderCustomerName ) {
                        customer = clockTime.workOrderCustomerName;
                    } else {
                        customer = " - ";
                    }
                    try {
                        type = JSONData.getObjectFromArrayById( laborCodes, clockTime.laborCodeId ).name;
                    } catch ( e ) {
                        type = " - ";
                    }

                    endTime = new Date( clockTime.timeEnd );
                    hours = ((endTime.getTime() - startTime.getTime()) / hoursMilli ).toFixed( 2 );
                    endTime = Localization.formatDateTime( clockTime.timeEnd, 't' );

                    // SFAM-231: Separate paid hours from unpaid hours
                    if ( JSONData.isClockingPaid( clockTime ) ) {
                        totalPaidHours += parseFloat( hours );
                    } else if ( JSONData.isClockingUnpaid( clockTime ) ) {
                        totalUnpaidHours += parseFloat( hours );
                    }

                    timeSheetList.append( listItem.render( {
                        date: date,
                        endTime: Localization.formatDateTime( clockTime.timeEnd, 't' ),
                        clockTime: clockTime,
                        hours: hours,
                        type: type,
                        workOrder: workOrder,
                        customer: customer
                    } ) );
                    numClockingsBeingClosedOut++;
                }
            }
        }

        // Refresh the list so that it is themed correctly
        timeSheetList.listview('refresh');
        $('#totalHoursDisplay').text( totalPaidHours.toFixed(2).toString());
        $('#totalUnpaidHoursDisplay').text( totalUnpaidHours.toFixed(2).toString());
        $('#dateDisplay').text( weekDays[ new Date().getDay() ] + ", " +
                                Localization.formatDateTime(Util.getISOCurrentTime(), 'd') );
    }

    /**
     * Add the agreement text to the signature canvas
     */
    function addCanvasText() {
        debug && console.log( "CloseOutDay.addCanvasText: Adding the agreement text" );
         // Obtain the signature canvas instance
        var canvas = document.getElementById("signatureCanvas");
        var context = canvas.getContext( "2d" );
        context.font = "10pt Arial";
        context.fillStyle = "black";
        context.fillText( Localization.getText("signatureConfirmation"), 10, 240 );
    }

    /**
     * Present a dialog for the user to add a technician note to a time card
     */
    function addTimeCardNote() {
        debug && console.log( "CloseOutDay.addTimeCardNote: Displaying the time card note input" );

        // For some reason, this is required when selecting a button
        addCanvasText();

        var newWorkOrderPopup = new EJS({url: 'templates/timecardtechniciannote'}).render({
            technicianNotes: technicianNotes
        });

        Dialog.showDialog({
            mode: 'blank',
            width: '600px',
            blankContent : newWorkOrderPopup
        });
    }

    /**
     * Save the added technician note to the new timeCard object
     */
    function saveTechnicianNote( notes ) {
        technicianNotes = $('#txtTechnicianNote').val();
        Dialog.closeDialog( false );
    }

    /**
     * Create and post a time card.  The post occurs if the mobile app is online.
     * @param openEntries - The collection of all clocking for the timeCard
     * @param signature - The technician signature object
     */
    function createAndPostTimeCard( openEntries, signature ) {
        var failedPostCallbackFn;
        var newTimeCard = {};
        var successfulPostCallbackFn;
        var timeCardLines = [];

        if ( !openEntries || !signature ) {
            throw "CloseOutDay.createAndPostTimeCard: Required parameter is undefined or null";
        }

        // Create and initialize the new time card header properties
        newTimeCard.timeCard = {};
        newTimeCard.timeCard.webId  			 = Util.getUniqueId();
        newTimeCard.timeCard.internalId			 = "";
        newTimeCard.timeCard.clientReference  	 = Util.getUniqueId();
        newTimeCard.timeCard.technicianNotes     = technicianNotes;
        newTimeCard.timeCard.technicianSignature = signature;

        // Must be online to post a time card
        if ( Util.isOnline( false ) ) {
            // Post locally saved data first
            JSONData.postLocallySavedData( true, function() {

                // Get clocking data for time card after post completes
                _.each( openEntries, function( clockingItem ) {
                    var clockingForTimeCard = JSONData.getObjectById( "technicianClocking",
                                                                      clockingItem.clientReference, "clientReference" );
                    var timeCardLine;
                    if ( clockingForTimeCard ) {
                        // Initialize each timeCardLine with the TimeCardLine required items
                        timeCardLine 			 	  	= {};
                        timeCardLine.webId 		 	  	= Util.getUniqueId();
                        timeCardLine.internalId  	  	= "";
                        timeCardLine.timeStart 	 	  	= clockingForTimeCard.timeStart;
                        timeCardLine.timeEnd 	 	  	= clockingForTimeCard.timeEnd;
                        timeCardLine.workOrderSegmentId = clockingForTimeCard.workOrderSegmentId;
                        timeCardLine.laborCodeId 	  	= clockingForTimeCard.laborCodeId;
                        timeCardLine.timeCardId	 	  	= newTimeCard.timeCard.webId;
                        timeCardLines.push( timeCardLine );
                    }
                });

                // Initialize the timeCardLines array with the processed open clocking
                newTimeCard.timeCard.timeCardLines = timeCardLines;

                // Mark time card as requiring a post and save time card to local storage
                newTimeCard.timeCard.postToMiddleTierRequired = true;
                JSONData.saveJSON( "timeCard", newTimeCard.timeCard, true );

                // If post locally save data is successful, proceed onto posting the time card
                if ( WorkOrder.getWorkOrdersRequiringPostToMiddleTier().length === 0 &&
                     JSONData.getTechnicianClockingsRequiringPostToMiddleTier( true ).length === 0 ) {
                    Dialog.showPleaseWait( Localization.getText( "postingTimeCardTitle" ), Localization.getText( "postingTimeCardText" ), "400px" );

                    // Callback for the successful time card post
                    successfulPostCallbackFn = function() {
                        debug && console.log( "CloseOutDay.createAndPostTimeCard: Posted new time card with " + newTimeCard.timeCard.timeCardLines.length +
                                                  " time card lines for " + signature.dateCaptured );
                        Dialog.closeDialog( false );

                        // Remove the clocking data included in the time card
                        _.each( openEntries, function( entry ) {
                            var entryToDelete = JSONData.getObjectById( "technicianClocking", entry.clientReference, "clientReference" );
                            if ( entryToDelete ) {
                                JSONData.deleteJSON( "technicianClocking", entryToDelete.webId );
                            }
                        });
                        _.each( loggedInEntries, function( entry ) {
                            var entryToDelete = JSONData.getObjectById( "technicianClocking", entry.clientReference, "clientReference" );
                            if ( entryToDelete ) {
                                JSONData.deleteJSON( "technicianClocking", entryToDelete.webId );
                            }
                        });

                        // Remove the locally stored time card
                        JSONData.deleteJSON( "timeCard", newTimeCard.timeCard.webId );

                        // Closing out the day resets the local work order number index
                        WorkOrder.resetLocalWorkOrderNumberIndex();

                        // Remove close out date
                        window.localStorage.removeItem( JSONData.LS_CLOSE_OUT_DATE );

                        // If logoff is in progress, complete the logoff after the work day is closed out
                        if ( window.localStorage.getItem( JSONData.LS_LOGOFF_IN_PROGRESS )) {
                            window.localStorage.removeItem( JSONData.LS_LOGOFF_IN_PROGRESS );

                            if ( window.localStorage.getItem( JSONData.LS_CLOSE_OUT_DAY_ATTEMPT ) ) {
                                window.localStorage.removeItem( JSONData.LS_CLOSE_OUT_DAY_ATTEMPT );
                            }

                            Dialog.showAlert( Localization.getText( "logoffConfirmTitle" ),
                                              Localization.getText( "timeCardPostSuccessLogoff" ),
                                function() {
                                    UIFrame.navigateToPage( "login.html", true, null );
                                }, "350px" );
                        } else {
                            Dialog.showAlert( Localization.getText( "closeOutDayPage" ),
                                              Localization.getText( "timeCardPostSuccess" ),
                                function() {
                                    if ( window.localStorage.getItem( JSONData.LS_CLOSE_OUT_DAY_ATTEMPT )) {
                                        window.localStorage.removeItem( JSONData.LS_CLOSE_OUT_DAY_ATTEMPT );
                                    }
                                    // Return to the home page
                                    UIFrame.navigateToPage( "home.html", true, null );
                                }, "250px"
                            );
                        }
                    };

                    // Callback for a failed post attempt
                    failedPostCallbackFn = function() {
                        Dialog.closeDialog( false );
                        Dialog.showAlert( Localization.getText( "timeCardPost" ),
                                          Localization.getText( "timeCardPostFail" ),
                            function() {
                                // If logoff is in progress, complete the logoff after the work day is closed out
                                if ( window.localStorage.getItem( JSONData.LS_LOGOFF_IN_PROGRESS ) ) {
                                    window.localStorage.removeItem( JSONData.LS_LOGOFF_IN_PROGRESS );
                                }
                                if( window.localStorage.getItem( JSONData.LS_CLOSE_OUT_DAY_ATTEMPT )) {
                                    window.localStorage.removeItem( JSONData.LS_CLOSE_OUT_DAY_ATTEMPT );
                                }
                                UIFrame.navigateToPage( "timesheet.html", true, null );
                            }, "350px"
                        );
                    };
                    JSONData.postTimeCard( newTimeCard, successfulPostCallbackFn, failedPostCallbackFn );
                } else {
                    // If post locally saved data failed, display alert and keep tech on the close out day page
                    Dialog.closeDialog( false );
                    Dialog.showAlert( Localization.getText( "closeOutDayPage"),
                                      Localization.getText( "closeOutDayPostSavedDataFailed"),
                                      null, "400px" );
                }
           });
        }
    }

    /**
     * Save the signature from the canvas and close out the day.
     * @param sigAPI - the signature API instance
     */
    function submitTimeCard( sigAPI ) {
        if ( Util.isOnline( false ) ) {
            debug && console.log( "CloseOutDay.submitTimeCard: Saving the canvas signature" );
            // Check the size of the signature array for a signature
            if( sigAPI.getSignature().length == 0 ) {
                Dialog.showAlert( Localization.getText( "closeOutDayPage" ), Localization.getText("signatureInvalid"), null, "350px" );
            } else {
                // For now, simply log out of the application
                Dialog.showConfirmYesNo( Localization.getText( "closeOutDayPage" ), Localization.getText( "closeOutDayPrompt" ), function() {
                    Dialog.closeDialog( false );
                    // Close any time entries and set the technician's clocking status to logged in if closeoutday is today
                    if ( closeOutDate == new Date().setHours( 0, 0, 0, 0 ) ) {
                        JSONData.closeOpenTimeEntry( null );
                        JSONData.changeClockingStatus( "technicianStatusLoggedIn", null, null );
                    }

                    // Create the Signature object
                    var signature = JSONData.createNewSignature();
                    var signatureImage = sigAPI.getSignatureImage();
                    signature.value = signatureImage.substr( signatureImage.indexOf(",") + 1 );

                    // Create and post the time card
                    createAndPostTimeCard( openEntries, signature );
                },
                    Dialog.closeDialog, null
                );
            }
        } else {
            // Finishing close out day requires the tablet to be online
            Dialog.showAlert( Localization.getText( "closeOutDayPage"),
                              Localization.getText( "closeOutDayOffline"),
                              null, "400px" );
        }
    }

    /**
     * Return the date of the day we wish to close out
     */
    function getCloseOutDate() {
        debug && console.log( "CloseOutDay.getCloseOutDate: Returning the close out date: " + closeOutDate );
        return closeOutDate;
    }

    return {
        'addCanvasText'     : addCanvasText,
        'addTimeCardNote'   : addTimeCardNote,
        'submitTimeCard'    : submitTimeCard,
        'getCloseOutDate'   : getCloseOutDate,
        'populateListViews' : populateListViews,
        'saveTechnicianNote': saveTechnicianNote
    };
}();

/**
 * pageinit event handler
 */
$("div:jqmData(role='page')").on( "pageinit", function() {
    // All pages must set pageId to this.id
    var pageId = this.id;
    debug && console.log( "CloseOutDay.pageinit: Initializing " + pageId );

    // This MUST be called by every page specific pageinit event handler!
    UIFrame.init( pageId, function() {
        debug && console.log( "CloseOutDay.pageinit: Page specific init goes here" );

        // Hide content until it's populated and ready to display
        // UIFrame.hideElement( "body" );

        // Populate the time sheet list
        CloseOutDay.populateListViews();

        // Options for the signature pad initialization
        var options = {
            defaultAction : "drawIt",
            drawOnly : true,
            lineTop :  210,
            onFormError : null // handle signature issues in CloseOutDay.signatureError()
        };

        var api = $('.sigPad').signaturePad( options );

        CloseOutDay.addCanvasText();

        // Hide the footer and the header icons
        $('#footer').remove();
        $('.headerIcon').hide();
        $('#tasksMenuDiv').hide();
        $('.ui-btn-hidden').attr('style', 'margin-top: 0px;');

        // Bind the close out day header button listeners
        $('#btnCancel').click( function() {
            window.localStorage.removeItem( JSONData.LS_CLOSE_OUT_DATE );
            window.localStorage.removeItem( JSONData.LS_CLOSE_OUT_DAY_ATTEMPT );
            if( window.localStorage.getItem( JSONData.LS_LOGOFF_IN_PROGRESS )) {
            	window.localStorage.removeItem( JSONData.LS_LOGOFF_IN_PROGRESS  );
            }
            UIFrame.navigateToPage( "timesheet.html", true, null );
        });
        $('#btnDone').click( function() {
            CloseOutDay.submitTimeCard( api );
            $('#signatureCanvas').trigger('click');
        });

        // Bind the signature form button listeners
        $('#clearButton').click( function() {
            CloseOutDay.addCanvasText();
        });

        $('#addTimeCardNote').click( function() {
            CloseOutDay.addTimeCardNote();
        });

        var height = screen.height - 135;
        $('#closeOutDayArea').height(height + "px");

        // This MUST be the last line inside each page specific init function
        UIFrame.postPageSpecificInit( pageId );
    });
});
