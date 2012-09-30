/**
 * closeoutday.js
 */

"use strict";

/**
 * 
 */
var CloseOutDay = function() {
	var openEntries = [],
		closeOutDate = null;
	
	// Retrieve the required JSON elements to avoid many JSON retrievals
	var workOrders = JSONData.getObjectsByDataType( "workOrders" );
	var customers = JSONData.getObjectsByDataType( "customers" );
	var laborCodes = JSONData.getObjectsByDataType( "laborCodes" );
	
	/**
     * Populate the close out day timesheet list
     */
    function populateListViews( ) {
    	 debug && console.log( "CloseOutDay.populateListViews: Populating the time sheet list" );
    	 closeOutDate = window.localStorage.getItem( "closeOutDate" );
    	 
    	 window.localStorage.setItem( "closeOutDate", "" );
			
         // Remove all existing items from the pms due list
         var timeSheetList = $('#timeSheetList'); 
         timeSheetList.children('li').remove();
         
         var listItem = new EJS({url: 'templates/timesheetlistitem'}),
         	 listDivider = new EJS({url: 'templates/timesheetlistdivider'}),
         	 technicianClocking =  _.sortBy( JSONData.getObjectsByDataType("technicianClocking"), function( clocking ) {
         		return clocking.timeStart;
         	});
         
         timeSheetList.append( listDivider.render() );
         debug && console.log( "CloseOutDay.populateListViews: " + technicianClocking.len + " clocking entries found." );
         
         var hours = 0.0,
         	 totalHours = 0.0,
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
         
         for(var i = 0; i < technicianClocking.length; i++) {
         	clockTime = technicianClocking[i];
         	
        	type = "";
        	workOrder = "";
        	customer = "";
        	
         	// If the clock time entry is not for "Logged In" and not closed out
         	if( clockTime.technicianStatus != 900 && !clockTime.closed && new Date( clockTime.timeStart).setHours(0,0,0,0) == closeOutDate ) {
         		openEntries.push( clockTime );
         		
         		// Determine the time difference
 	        	startTime = new Date( clockTime.timeStart );
 	        	totalHours += parseFloat( hours );
 	        	
 	        	// Re-format the start and end times for the list items
	        	date = Localization.formatDateTime( clockTime.timeStart, 'd');
	        	
	        	// If available, retrieve the correct workOrder, customer and billing type information.
	        	if( clockTime.workOrderHeaderId != -1 ) {
	    			if( clockTime.workOrderHeaderId ) {
	    				workOrder = JSONData.getObjectFromArrayById( workOrders, clockTime.workOrderHeaderId );
	    			} 
	    			
	        		if( workOrder ) {
	        			customer = JSONData.getObjectFromArrayById( customers, workOrder.customerId ).name;
	        			workOrder = workOrder.documentNumber;
	        		} else {
	        			workOrder = " - ";
	        			customer = " - ";
	        		}
	        	} else {
        			workOrder = " - ";
        			customer = " - ";
        		}

	        	try {
	        		type = JSONData.getObjectFromArrayById( laborCodes, clockTime.laborCodeId ).name;
	        	} catch( e ) {
	        		type = " - ";
	        	}
 	        	
	        	if( clockTime.timeEnd != "" ) {
	 	        	endTime = new Date( clockTime.timeEnd );
	 	        	hours = ((endTime.getTime() - startTime.getTime()) / hoursMilli ).toFixed( 2 );
	        	} else {
	        		endTime =   " - ";
	        		hours = ((new Date().getTime() - startTime.getTime()) / hoursMilli ).toFixed( 2 );
	        	}
	        	
 	        	timeSheetList.append( listItem.render({ 
 	        		date: date,
	        		clockTime: clockTime,
 	        		hours: hours,
 	        		type: type, 
 	        		workOrder: workOrder,
 	        		customer: customer
 	        	}));
 	        }
         }
         
         // Get the first clocking item to use for determine the day to close out
         var firstClocking = technicianClocking[0],
         	 firstDay = new Date( firstClocking.timeStart ); 
                  
	     // Refresh the list so that it is themed correctly
	     timeSheetList.listview('refresh');
	     $('#totalHoursDisplay').text( totalHours.toFixed(2).toString());  
	     $('#dateDisplay').text( weekDays[ firstDay.getDay() ] + ", " + 
	         Localization.formatDateTime(firstClocking.timeStart, 'd') );
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
     * Save the signature from the canvas and close out the day.
     * @param sigAPI - the signature API instance
     */
    function closeEntries( sigAPI ) {
    	debug && console.log( "CloseOutDay.closeEntries: Saving the canvas signature" );
    	
    	// Check the size of the signature array for a signature
    	if( sigAPI.getSignature().length == 0 ) {
    		Dialog.showAlert( Localization.getText( "invalidSignature" ), Localization.getText("signatureInvalid"), null, "350px" );
    	} else {        	
        	//sigAPI.getSignature() to retrieve the drawn signature as a native JavaScript array
        	//sigAPI.getSignatureString() to retrieve the drawn signature as a JavaScript string in the JSON format
    		
    		// For now, simply log out of the application
    		Dialog.showConfirmYesNo( Localization.getText( "closeOutDayPage" ), Localization.getText( "closeOutDayPrompt" ), function() {
    			// Close any time entries and set the technician's clocking status to logged in if closeoutday is today
    			if( closeOutDate == new Date().setHours(0,0,0,0) ) {
	            	JSONData.closeOpenTimeEntry( null );
	            	JSONData.changeClockingStatus( "technicianStatusLoggedIn", null, null );
    			}
    			
    			// Close out the open time entries
    			for( var clockTime in openEntries ) {
    				openEntries[clockTime].closed = true;
                 	JSONData.saveJSON( "technicianClocking", openEntries[clockTime] );
    			}
            	
            	// Return to the home page
    			UIFrame.navigateToPage( "home.html" );
    		}, 
        		UIFrame.closeActiveDialog, null
        	);	
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
		'closeEntries'      : closeEntries,
		'getCloseOutDate'   : getCloseOutDate,
        'populateListViews' : populateListViews
    };
}();

/**
 * pageinit event handler 
 */
$("div:jqmData(role='page')").on( "pageinit", function( event, ui ) {
    // All pages must set pageId to this.id
    var pageId = this.id;
    debug && console.log( "CloseOutDay.pageinit: Initializing " + pageId );

    // This MUST be called by every page specific pageinit event handler!
    UIFrame.init( pageId, function() {
        debug && console.log( "CloseOutDay.pageinit: Page specific init goes here" );

        if( window.localStorage.getItem( "closeOutPreviousDay") != "") {
        	window.localStorage.removeItem( "closeOutPreviousDay" );
        }
        
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
        if( window.localStorage.getItem( "closeOutPreviousDay" ) && window.localStorage.getItem( "closeOutPreviousDay" ) != "" ) {
        	window.localstorage.setItem( "closeOutPreviousDay", "" );
        	$('#btnCancel').remove();
        } else {
        	$('#btnCancel').click( function() {
                UIFrame.navigateToPage( "timesheet.html" );
            });
        }
        
        $('#btnDone').click( function() {
        	CloseOutDay.closeEntries( api );
            $('#signatureCanvas').trigger('click');
        });

        // Bind the signature form button listeners
        $('#clearButton').click(function() {
            CloseOutDay.addCanvasText();
        });

        var height = screen.height - 135;
        $('#closeOutDayArea').height(height + "px");
        
        // This MUST be the last line inside each page specific init function
        UIFrame.postPageSpecificInit( pageId );
    });
});