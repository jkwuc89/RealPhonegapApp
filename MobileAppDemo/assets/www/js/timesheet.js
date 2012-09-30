/**
 * timesheet.js
 */

"use strict";

/**
 * TimeSheet
 * Using the Revealing Module JavaScript pattern to encapsulate
 * the time sheet functionality into an object
 */
var TimeSheet = function() {

	var openEntries = false,
    	openEntryDates = {},
		technicianClocking = null;
	
	// Retrieve the required JSON elements to avoid many JSON retrievals
	var workOrders = JSONData.getObjectsByDataType( "workOrders" );
	var customers = JSONData.getObjectsByDataType( "customers" );
	var laborCodes = JSONData.getObjectsByDataType( "laborCodes" );
	
    $(window).load( function( event ) {
        var offset = $("ul#timeSheetList").offset();
        offset.left += 1;
        $("ul#timeSheetList").offset( offset );
    });

	/**
     * Populate the timesheet list
     */
    function populateListViews( technicianClockingList, repopulatingList ) {
        debug && console.log( "TimeSheet.populateListViews: Populating the time sheet list" );
        
        if( technicianClockingList && technicianClockingList.length >= 0 ) {
        	technicianClocking = _.sortBy( technicianClockingList, function( clocking ) {
        		return clocking.timeStart;
        	});
        } else {
        	technicianClocking = _.sortBy( JSONData.getObjectsByDataType( "technicianClocking" ), function( clocking ) {
        		return clocking.timeStart;
        	});
        }
        
        // Remove all existing items from the time sheet list
        var timeSheetList = $('#timeSheetList'); 
        timeSheetList.children('li').remove();
        
        var listItem = new EJS({ url: 'templates/timesheetlistitem' });
        
        timeSheetList.append( new EJS({ url: 'templates/timesheetlistdivider' }).render() );
        
        if( repopulatingList === null ) {
        	repopulatingList = false;
        }
        
        debug && console.log( "TimeSheet.populateListViews: " + technicianClocking.len + " clocking entries found." );
        
        var hours = 0.0,
        	todayCount = 0,
        	weekCount = 0,
        	week2Count = 0,
        	week3Count = 0,
        	hoursMilli = 1000 * 60 * 60,
        	startTime = null,
        	endTime = null,
        	type = null,
        	workOrder = null,
        	customer = null,
        	clockTime = null,
            dayHrs = 1000 * 60 * 60 * 24,
        	date = new Date();
        	date.setHours(0,0,0,0);
        
        var today = date.getTime();
        // Iterate through the technicianClocking items
        for( var clocking in technicianClocking ) {
        	clockTime = technicianClocking[clocking];
        	type = "";
        	workOrder = null;
        	customer = "";
        	
        	// If this entry is not a "Logged In" status item 
        	if( clockTime.technicianStatus != 900 ) {
        		
        		// If this clockTime item doesn't have a closed flag
        		if( !repopulatingList && !clockTime.closed ) {
        			
        			// If we haven't indicated openEntries are present
        			if( !openEntries ) {
	        			openEntries = true;
	        			UIFrame.addGuidedSearchDivider( Localization.getText( "openClockingEntries" ));
        			}
        			
        			date = new Date( clockTime.timeStart ).setHours(0,0,0,0);

        			if( openEntryDates[date] == undefined ) {
        				openEntryDates[date] = {};
        				openEntryDates[date]['id'] = Localization.formatDateTime( clockTime.timeStart, 'd');
        				openEntryDates[date]['count'] = 1;
        			} else {
        				openEntryDates[date].count ++;
        			}
        		}

	        	if( clockTime.timeEnd != "" ) {
	        		// Determine the time difference
		        	startTime = new Date( clockTime.timeStart );
		        	endTime =   new Date( clockTime.timeEnd );
		        	hours = ((endTime.getTime() - startTime.getTime()) / hoursMilli ).toFixed( 2 );
		        	
		        	// Re-format the start and end times for the list items
		        	date = Localization.formatDateTime( clockTime.timeStart, 'd' );
		        	endTime = Localization.formatDateTime( clockTime.timeEnd, 't' );
	        	} else {
	        		startTime = new Date( clockTime.timeStart );
	        		hours = (( new Date().getTime() - startTime.getTime()) / hoursMilli ).toFixed( 2 );
	        
	        		// Re-format the start and end times for the list items
	        		date = Localization.formatDateTime( clockTime.timeStart, 'd' );
	        		endTime = " - ";
	        	}

	        	// If available, retrieve the correct workOrder, customer and billing type information.
	        	if( clockTime.workOrderHeaderId != -1 ) {
	    			if( clockTime.workOrderHeaderId && workOrders.length > 0 ) {
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
	        	
	        	timeSheetList.append( listItem.render({
	        		date: date,
	        		startTime: startTime,
	        		endTime: endTime,
	        		clockTime: clockTime,
	        		hours: hours,
	        		type: type, 
	        		workOrder: workOrder,
	        		customer: customer
	        	}));
	        	
	        	var startTime = new Date( clockTime.timeStart ).setHours(0,0,0,0),
	        		endTime = new Date( clockTime.timeEnd ).setHours(0,0,0,0);
	        	
	        	// Increment the respective Display Range counters
	        	if( !repopulatingList && clockTime.closed ) {
		        	if((((( today - endTime ) / dayHrs ) <= 21) && endTime <= today ) || ((((today - startTime ) / dayHrs ) <= 21) && startTime <= today )) {
	        			week3Count ++;
	        			week2Count ++;
	        			weekCount ++;
	        		} else if((((( today - endTime ) / dayHrs ) <= 14) && endTime <= today ) || (((( today - startTime ) / dayHrs ) <= 14) && startTime <= today )) {
	        			week2Count ++;
	        			weekCount ++;
	        		} else if((((( today - endTime ) / dayHrs ) <= 7) && endTime <= today ) || (((( today - startTime ) / dayHrs ) <= 7) && startTime <= today )) {
	        			weekCount ++;
	        		} 
		        	
		        	if( endTime == today || startTime == today ) {
		        		todayCount ++;
	        		}  
	        	}
	        }
        }

	    if( !repopulatingList ) {
	    	// Find open dates if there were openEntries found
	    	if( openEntries ) {
	    		for( var openEntry in openEntryDates ) {
	    			UIFrame.addGuidedSearchItem( openEntryDates[openEntry].id, 
	    				"date" +  new Date( openEntryDates[openEntry].id ).getTime(), openEntryDates[openEntry].count );
	    		}	
	    	}
	    	
	        // Add the Guided Search Items
	        UIFrame.addGuidedSearchDivider( Localization.getText( "closedClockingHistory" ));
	        UIFrame.addGuidedSearchItem( Localization.getText( "week1" ), "Range2", weekCount );
	        UIFrame.addGuidedSearchItem( Localization.getText( "week2" ), "Range3", week2Count );
	        UIFrame.addGuidedSearchItem( Localization.getText( "week3" ), "Range4", week3Count );
	        
	        // Refresh the guided search area 
	        UIFrame.refreshGuidedSearch();
			UIFrame.bindGuidedSearchClickHandler( guidedSearchClickHandler );
	    }
        
        // Refresh the list so that it is themed correctly
        timeSheetList.listview('refresh');
        
        if ( repopulatingList ) {
            UIFrame.adjustListViewBorders();
        }
    }
   
    /** 
     * Close any open time entry items and navigate to the close out day page
     */
    function closeOutDay() {
    	debug && console.log( "TimeSheet.closeOutDay: User selected to close out day" );
    	
		if( JSONData.getNonProductiveClockingStatuses().indexOf( JSONData.getCurrentClockingStatus() ) != -1 ) {
			UIFrame.displayEndNonProductiveClockingDialog( "technicianStatusLoggedIn" );
		} else {
			UIFrame.navigateToPage( "closeoutday.html" );
		}
    }
    
    /**
     * Guided search click handler for the time sheet list page
     * @param event - the click event
     */
    function guidedSearchClickHandler( event ) {
    	debug && console.log( "TimeSheet.guidedSearchClickHandler" );

        var filteredTimeSheet = null;
        var date = new Date();
        date.setHours(0,0,0,0);
        
        var today = date.getTime();
        var dayHrs = 1000 * 60 * 60 * 24;
        var closeOutDayButton = $( '#closeOutDayButton' );
        
        // Filter all of the clocking entries for the last week
        if( this.id == "Range2") {
        	closeOutDayButton.hide(); 
        	
        	filteredTimeSheet = JSONData.getFilteredObjectList( "technicianClocking", function( currentClocking ) {
        		if( currentClocking.timeEnd != "" && currentClocking.closed ) {
		        	return (((today - new Date( currentClocking.timeEnd ).setHours(0,0,0,0)) / dayHrs ) <= 7) &&
					   	     new Date( currentClocking.timeEnd ).setHours(0,0,0,0) <= today;
        		}
        	});

        	window.localStorage.removeItem( "closeOutDate" );
        // Filter all of the clocking entries for the last 2 weeks
        } else if( this.id == "Range3") {
        	closeOutDayButton.hide();
        	
        	filteredTimeSheet = JSONData.getFilteredObjectList( "technicianClocking", function( currentClocking ) {
        		if( currentClocking.timeEnd != "" && currentClocking.closed ) {
		        	return (((today - new Date( currentClocking.timeEnd ).setHours(0,0,0,0)) / dayHrs ) <= 14) &&
					   	     new Date( currentClocking.timeEnd ).setHours(0,0,0,0) <= today;
        		} 
        	});

        	window.localStorage.removeItem( "closeOutDate" );
        } else if( this.id == "Range4" ) {
        	closeOutDayButton.hide();
        	
        	filteredTimeSheet = JSONData.getFilteredObjectList( "technicianClocking", function( currentClocking ) {
        		if( currentClocking.timeEnd != ""  && currentClocking.closed ) {
		        	return (((today - new Date( currentClocking.timeEnd ).setHours(0,0,0,0)) / dayHrs ) <= 21) &&
					   	     new Date( currentClocking.timeEnd ).setHours(0,0,0,0) <= today;
        		}
        	});
        	
        	window.localStorage.removeItem( "closeOutDate" );
        } else if( this.id.indexOf( "date" ) == 0 ) {
        	closeOutDayButton.show();
        	
        	var date = this.id.substring( 4 );
        	
        	filteredTimeSheet = JSONData.getFilteredObjectList( "technicianClocking", function( currentClocking ) {	
		        return ( currentClocking.technicianStatus != 900 ) ? 
		        		new Date( currentClocking.timeStart ).setHours(0,0,0,0) == date && !currentClocking.closed : false ;
        	});
        	
        	window.localStorage.setItem( "closeOutDate", new Date( filteredTimeSheet[0].timeStart ).setHours(0,0,0,0) );
        }
        
        if( filteredTimeSheet == null ) {
        	filteredTimeSheet = [];
        }
        
        populateListViews( filteredTimeSheet, true );
        UIFrame.changeListFilter( "" );
        UIFrame.refreshGuidedSearchWithSelectedItem( this, clearGuidedSearch );

    	// Force refresh of the close out day button by triggering a click outside of the closeOutDay area
    	$( '#timeSheetCloseOutDayArea' ).html();
    	
    }
    
    /**
     * Guided search click handler for pms due resets the list views
     * after filtering the pms due
     * @param event - click event    
     */
    function clearGuidedSearch( event ) {
        // These two calls must be the first two lines in all custom clear handlers
        event.preventDefault();
        event.stopPropagation();
        debug && console.log( "TimeSheet.clearGuidedSearch: Resetting clocking list views" );
        
        $('#closeOutDayButton').hide();
        populateListViews( null, true );
        UIFrame.resetGuidedSearch( this );
    }
    
    /**
     * Return the boolean value from the TimeSheet instance
     */
    function openTimeEntries() {
    	debug && console.log( "TimeSheet.openTimeEntries: openEntries: " + openEntries );
    	return openEntries;
    }
   
    /**
     * Select the most recent open clocking entry guided search item
     */
    function selectMostRecentOpenEntry() {
    	debug && console.log( "TimeSheet.selectMostRecentOpenEntry: Selecting the most recent open time entry" );
    	
    	var mostRecentDate = null;
    	
    	for( var entry in openEntryDates ) {
    		if( mostRecentDate == null ) {
    			mostRecentDate = entry; 
    		} else if( new Date( openEntryDates[entry].id ).setHours(0,0,0,0) > new Date( openEntryDates[mostRecentDate].id ).setHours(0,0,0,0) ) {
    			mostRecentDate = entry;
    		} 
    	}
    	
    	if( mostRecentDate != null ) {
    		var id = "#date" + new Date( openEntryDates[entry].id ).getTime();
	        $( id ).click();
	        return id;
    	}
    }
    
    /**
     * Return the total clocking entries
     */
    function totalEntries() {
    	return technicianClocking.length;
    }
    
    return {
    	'closeOutDay'       : closeOutDay,
    	'openTimeEntries'   : openTimeEntries,
        'populateListViews' : populateListViews,
        'selectMostRecentOpenEntry' : selectMostRecentOpenEntry,
        'totalEntries'      : totalEntries
    };
}();

/**
 * pageinit event handler 
 */
$("div:jqmData(role='page')").on( "pageinit", function( event, ui ) {
    // All pages must set pageId to this.id
    var pageId = this.id;
    debug && console.log( "Timesheet.pageinit: Initializing " + pageId );
    
    // This MUST be called by every page specific pageinit event handler!
    UIFrame.init( pageId, function() {
        debug && console.log( "TimeSheet.pageinit: Executing page specific init" );
  
        // Populate the time sheet list
        TimeSheet.populateListViews();

        // If there are open time entries, select the most recent, otherwise select the closed clocking history
        if( TimeSheet.openTimeEntries() ) {
        	TimeSheet.selectMostRecentOpenEntry();

            // If the class to animate the header is found on page init and openTimeEntries exist, remove it
            $( "[data-position='fixed']" ).css( "position", "fixed" ).removeClass( 'slidedown out reverse' );
        } else {
        	if( TimeSheet.totalEntries() > 0 ) {
            	$( '#Range2' ).click();        		
        	}

            // Hide by default
            $( '#closeOutDayButton' ).hide();
        }
        
        // Bind a listener to the closeOutDay button
        $( '#closeOutDayButton' ).click( function() {
        	if( TimeSheet.openTimeEntries() ) {
            		TimeSheet.closeOutDay();
        	}
        });
        
        // This MUST be the last line inside each page specific init function
        UIFrame.postPageSpecificInit( pageId );
    });
});
