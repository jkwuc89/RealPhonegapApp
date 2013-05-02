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
        technicianClocking = null,
        technicianClockingAll = null;

    // Retrieve the required JSON elements to avoid many JSON retrievals
    var laborCodes = JSONData.getObjectsByDataType( "laborCodes" );

    // Local storage item for currently selected timesheet guided search item
    var LS_SELECTED_GUIDED_SEARCH_DATE = "timeSheetGuidedSearchDate";

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

        var workOrderForClocking;

        if( technicianClockingList && technicianClockingList.length >= 0 ) {
            technicianClocking = technicianClockingList;
        } else {
            technicianClocking = _.sortBy( _.filter( JSONData.getObjectsByDataType( "technicianClocking" ),
                function( clocking ) {
                    return clocking.technicianStatus != 900;
                }), function( clocking ) {
                    return new Date( clocking.timeStart ).getTime() + (( clocking.timeEnd ) ? new Date( clocking.timeEnd ).getTime() : new Date().getTime());
            });

            technicianClockingAll = technicianClocking;
        }

        // Remove all existing items from the time sheet list
        var timeSheetList = $('#timeSheetList');
        timeSheetList.children('li').remove();

        var listItem = new EJS({ url: 'templates/timesheetlistitem' });

        timeSheetList.append( new EJS({ url: 'templates/timesheetlistdivider' }).render() );

        if( repopulatingList === null ) {
            repopulatingList = false;
        }

        debug && console.log( "TimeSheet.populateListViews: " + technicianClocking.length + " clocking entries found." );

        var hours = 0.0,
            todayCount = 0,
            hoursMilli = 1000 * 60 * 60,
            startTime = null,
            endTime = null,
            type = null,
            workOrder = null,
            customer = null,
            clockTime = null,
            totalPaidHours = 0.00,
            totalUnpaidHours = 0.00,
            date = new Date();
            date.setHours(0,0,0,0);

        var today = date.getTime();

        if ( !repopulatingList ) {
            openEntryDates = {};
        }

        // Iterate through the technicianClocking items
        for( var clocking in technicianClocking ) {
            clockTime = technicianClocking[clocking];
            type = "";
            workOrder = null;
            customer = "";

            // SFAM-208: Fix any clockings that refer to temporary work order numbers
            if ( !_.isNull( clockTime.workOrderDocumentNumber ) &&
                 !_.isNull( clockTime.workOrderHeaderId ) ) {
                workOrderForClocking = JSONData.getObjectById( "workOrders", clockTime.workOrderHeaderId, null );
                if ( workOrderForClocking ) {
                    if ( clockTime.workOrderDocumentNumber != workOrderForClocking.documentNumber ) {
                        debug && console.log( "TimeSheet.populateListViews: Updating clocking webId " + clockTime.webId +
                                              " with work order number " + workOrderForClocking.documentNumber );
                        clockTime.workOrderDocumentNumber = workOrderForClocking.documentNumber;
                        JSONData.saveJSON( "technicianClocking", clockTime, true );
                    }
                } else {
                    console.warn( "TimeSheet.populateListViews: Work order " + clockTime.workOrderDocumentNumber +
                                  " does not exist inside local storage." );
                }
            }

            // If this clockTime item doesn't have a closed flag
            if( !repopulatingList ) {
                // If we haven't indicated openEntries are present
                if( !openEntries ) {
                    openEntries = true;
                    UIFrame.addGuidedSearchDivider( Localization.getText( "openClockingEntries" ));
                }

                date = new Date( clockTime.timeStart ).setHours(0,0,0,0);

                if ( openEntryDates[date] == undefined ) {
                    openEntryDates[date] = {};
                    openEntryDates[date]['id'] = Localization.formatDateTime( clockTime.timeStart, 'd');
                    openEntryDates[date]['count'] = 1;
                } else {
                    openEntryDates[date].count ++;
                }
            }

            if ( !_.isNull( clockTime.timeEnd ) && clockTime.timeEnd != "" ) {
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

            // SFAM-231: Exclude unproductive time from total hours calculation
            if ( JSONData.isClockingPaid( clockTime ) ) {
                totalPaidHours += parseFloat( hours );
            } else if ( JSONData.isClockingUnpaid( clockTime ) ) {
                totalUnpaidHours += parseFloat( hours );
            }

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
            } catch( e ) {
                type = " - ";
            }

            timeSheetList.append( listItem.render({
                date: date,
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
                if( endTime == today || startTime == today ) {
                    todayCount ++;
                }
            }
        }

        if( !repopulatingList ) {
            // Find open dates if there were openEntries found
            if( openEntries ) {
                $("#guidedSearchList").children("li").remove();
                for( var openEntry in openEntryDates ) {
                    UIFrame.addGuidedSearchItem( openEntryDates[openEntry].id,
                        "date" +  new Date( openEntryDates[openEntry].id ).setHours(0,0,0,0), openEntryDates[openEntry].count );
                }
            }

            // Refresh the guided search area
            UIFrame.refreshGuidedSearch();
            UIFrame.bindGuidedSearchClickHandler( guidedSearchClickHandler );

            $(".guided-search-clear-button").hide();
        }

        // Refresh the list so that it is themed correctly
        timeSheetList.listview('refresh');

        // Add the total hours to the display
        var totalHoursHeaderElem = $('#totalLaborHoursHeaderDisplay');
        var totalHoursElem = $('#totalHoursDisplay');
        var totalUnpaidHoursElem = $('#totalUnpaidHoursDisplay');
        totalHoursHeaderElem.hide();
        // Work-around for the slow Android rendering
        debug && console.log( "TimeSheet.populateListViews: totalHours = " + totalPaidHours );
        totalHoursElem.empty();
        setTimeout(function() {
            totalHoursElem.text( totalPaidHours.toFixed(2).toString() );
            totalUnpaidHoursElem.text( totalUnpaidHours.toFixed(2).toString() );
            totalHoursHeaderElem.show();
        }, 200 );

        if ( technicianClocking.length > 0 ) {
            $("#closeOutDayButton").show();
        }

        UIFrame.adjustListViewBorders();
    }

    /**
     * Guided search click handler for the time sheet list page
     * @param event - the click event
     */
    function guidedSearchClickHandler( event ) {
        debug && console.log( "TimeSheet.guidedSearchClickHandler" );

        var closeOutDayButton = $( '#closeOutDayButton' );
        closeOutDayButton.show();

        var date = this.id.substring( 4 );
        debug && console.log( "TimeSheet.guidedSearchClickHandler: Selecting date: " + date );

        var filteredTimeSheet = _.sortBy( _.filter( technicianClockingAll,
            function( currentClocking ) {
                return new Date( currentClocking.timeStart ).setHours(0,0,0,0) == date && !currentClocking.closed;
            }), function( currentClocking ) {

            return ( currentClocking.timeEnd ) ? new Date( currentClocking.timeEnd ).getTime() : new Date().getTime() ;
        });

        window.localStorage.setItem( JSONData.LS_CLOSE_OUT_DATE, date );
        window.localStorage.setItem( LS_SELECTED_GUIDED_SEARCH_DATE, date );

        if( filteredTimeSheet == null ) {
            filteredTimeSheet = [];
        }

        debug && console.log( "TimeSheet.guidedSearchClickHandler: filteredTimeSheet length = " + filteredTimeSheet.length );
        populateListViews( filteredTimeSheet, true );
        UIFrame.changeListFilter( "" );
        UIFrame.refreshGuidedSearchWithSelectedItem( this, null );

        // Force refresh of the close out day button by triggering a click outside of the closeOutDay area
        $( '#totalLaborHourDisplay' ).html();
        $(".guided-search-clear-button").hide();

        // Adjust the list view borders after the guided search is applied
        UIFrame.adjustListViewBorders();
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
        var id = null;

        for( var entry in openEntryDates ) {
            if( mostRecentDate == null ) {
                mostRecentDate = entry;
            } else if( new Date( openEntryDates[entry].id ).setHours(0,0,0,0) > new Date( openEntryDates[mostRecentDate].id ).setHours(0,0,0,0) ) {
                mostRecentDate = entry;
            }
        }

        if( mostRecentDate != null ) {
            id = "#date" + new Date( openEntryDates[entry].id ).getTime();
            
            $( id ).click();
        }
    }

    return {
        'LS_SELECTED_GUIDED_SEARCH_DATE'    : LS_SELECTED_GUIDED_SEARCH_DATE,
        'openTimeEntries'   				: openTimeEntries,
        'populateListViews' 				: populateListViews,
        'selectMostRecentOpenEntry' 		: selectMostRecentOpenEntry
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
            // Hide by default
            $( '#closeOutDayButton' ).hide();
        }

        // Bind a listener to the closeOutDay button
        $( '#closeOutDayButton' ).click( function() {

            // SFAM-241: If close out date is null, set it to the currently selected date inside guided search
            if ( !window.localStorage.getItem( JSONData.LS_CLOSE_OUT_DATE ) ) {
                window.localStorage.setItem( JSONData.LS_CLOSE_OUT_DATE,
                                             window.localStorage.getItem( TimeSheet.LS_SELECTED_GUIDED_SEARCH_DATE ) );
            }

            if ( TimeSheet.openTimeEntries() ) {
	          	JSONData.closeOutDayAttempt();
	        }
        });

        // This MUST be the last line inside each page specific init function
        UIFrame.postPageSpecificInit( pageId );
    });
});
