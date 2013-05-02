/**
 * clocking.js
 */

"use strict";

/**
 * Clocking
 * Encapsulate mobile app's clocking functionality
 */
var Clocking = function() {

    /**
     * Get the latest closed non-productive or productive clocking.  This ignores "logged in" clockings.
     * @return Object contain latest close clocking or null if it does not exist
     */
    function getLatestClosedClocking() {
        var latestClosedClocking = null;
        var allClosedClockings = _.filter( JSONData.getObjectsByDataType( "technicianClocking" ), function( clockingInList ) {
            return ( clockingInList.technicianStatus != JSONData.TECHNICIAN_STATUS_LOGGED_IN_OUT &&
                     clockingInList.timeEnd );
        });
        var sortedClosedClockings;
        if ( allClosedClockings && allClosedClockings.length > 0 ) {
            sortedClosedClockings = _.sortBy( allClosedClockings, function( clockingInList ) {
                return ( new Date( clockingInList.timeEnd ).getTime() );
            });
            latestClosedClocking = sortedClosedClockings[ sortedClosedClockings.length - 1 ];
        }
        return latestClosedClocking;
    }

    /**
     * Record time for the technician by opening a new time record
     * and closing the previous one.  The rules for closing and opening
     * time records is defined by the Crown document, Clocking Rules.doc.
     * @param clockingStatus - One of the keys for VALID_CLOCKING_STATUSES
     * @param startTime - Start time.  If undefined, current time is used.
     *                    Use Util.getISOCurrentTime() to pass in this value.
     */
    function recordTime( clockingStatus, startTime ) {
        var currentClockingStatus;
        var currentPageId;
        var customer;
        var latestClosedClocking;
        var gapTimeEntry;
        var workOrderIdForClockingStatus = null;
        var workOrderForClockingStatus = null;
        if ( !clockingStatus ) {
            throw "Clocking.recordTime: Required parameter clockingStatus is undefined";
        }
        var clockingStatusObj = _.find( JSONData.VALID_CLOCKING_STATUSES, function( validStatus ) {
            return validStatus.key == clockingStatus;
        });
        if ( !clockingStatusObj ) {
            throw "Clocking.recordTime: Required parameter clockingStatus is invalid";
        }
        if ( startTime && !Util.isValidISODateTimeStamp( startTime ) ) {
            throw "Clocking.recordTime: startTime is not a valid ISO formatted date/time string";
        }
        currentClockingStatus = JSONData.getCurrentClockingStatus( null );
        try {
            currentPageId = UIFrame.getCurrentPageId();
        } catch ( exc ) {
            currentPageId = null;
        }
        // Changing the clocking status to traveling or productive requires
        // that the related work order ID be set inside local storage
        if ( clockingStatusObj.technicianStatus == JSONData.TECHNICIAN_STATUS_PRODUCTIVE ||
            clockingStatusObj.technicianStatus == JSONData.TECHNICIAN_STATUS_TRAVELING ) {
            // If we are switching to traveling or productive, skip the post
            // of closed non-productive clocking.  The manage work order overview page
            // will post this when it loads.
            workOrderIdForClockingStatus = JSONData.getWorkOrderIdForClockingChange();
            if ( !workOrderIdForClockingStatus ) {
                throw "Clocking.recordTime: Work order ID for clocking change required when changing to traveling or productive";
            }
            // SFAM-187: Use POA if recording productive time against a work order
            // and the work order is already signed by a technician.
            // SFAM-230: Use POA only if work order for clocking status change is not the current work order.
            //           If it is the current work order, switching to productive to reopen a work order is OK.
            workOrderForClockingStatus = JSONData.getObjectById( "workOrders", workOrderIdForClockingStatus, null );
            if ( WorkOrder.isWorkOrderSignedByTechnician( workOrderForClockingStatus ) &&
                workOrderForClockingStatus.webId != WorkOrder.getCurrentWorkOrderId()
                ) {
                debug && console.log( "Clocking.recordTime: Changing productive clocking to POA because work order " +
                                      workOrderForClockingStatus.documentNumber + " is signed by the technician" );
                clockingStatus = "technicianStatusProductiveOrderApproval";
                clockingStatusObj = _.find( JSONData.VALID_CLOCKING_STATUSES, function( validStatus ) {
                    return validStatus.key == clockingStatus;
                });
            }
        }

        // Do nothing if the specified status matches the current status
        if ( clockingStatus == currentClockingStatus &&
            // Duplicate productive and traveling clockings with different start times are allowed
            !( ( clockingStatus == "technicianStatusProductive" ||
                clockingStatus == "technicianStatusTraveling" ||
                clockingStatus == "technicianStatusProductiveOrderApproval" ) &&
                startTime != JSONData.getCurrentClockingStartTime( null ) ) ) {
            debug && console.log( "Clocking.recordTime: No time entry created because new status equals current status" );
        } else {
            // Use current time if start time is not specified
            if ( !startTime ) {
                startTime = Util.getISOCurrentTime();
            }
            startTime = Util.setSecondsAndMillisecondsToZero( startTime );
            debug && console.log( "Clocking.recordTime: Creating new '" + clockingStatus + "' time entry with start time = " + startTime );

            // Find previously started time entry and close it out by adding a stop time
            JSONData.closeOpenTimeEntry( startTime );

            // Create new time entry.  Seconds and milliseconds are not part of the start time.
            var newTimeEntry = JSONData.createNewTechnicianClocking( startTime );
            newTimeEntry.laborCodeId = clockingStatusObj.laborCodeId;
            newTimeEntry.technicianStatus = clockingStatusObj.technicianStatus;
            newTimeEntry.unproductiveTimeReason = clockingStatusObj.unproductiveTimeReason;

            // Add a clientReference for this clocking
            newTimeEntry.clientReference = Util.getUniqueId();

            // If starting lunch, use a new clocking to fill the gap between
            // the current time and the end time of the previous clocking
            if ( clockingStatusObj.technicianStatus == JSONData.TECHNICIAN_STATUS_NON_PRODUCTIVE &&
                clockingStatus == "technicianStatusLunch" &&
                !JSONData.isFirstClockingOfTheDay() ) {
                var now = new Date();
                now.setSeconds( 0, 0 );
                var lunchStartTime = new Date( startTime );
                lunchStartTime.setSeconds( 0, 0 );
                if ( now.getTime() - lunchStartTime.getTime() > 0 ) {
                    // Clone latest clocking to start creation of gap clocking
                    latestClosedClocking = getLatestClosedClocking();
                    gapTimeEntry = Util.clone( latestClosedClocking );
                    gapTimeEntry.webId = Util.getUniqueId();
                    gapTimeEntry.clientReference = Util.getUniqueId();
                    gapTimeEntry.internalId = null;
                    gapTimeEntry.timeStart = latestClosedClocking.timeEnd;
                    gapTimeEntry.timeEnd = now.toISOString();
                    gapTimeEntry.postToMiddleTierRequired = true;

                    if ( latestClosedClocking.technicianStatus == JSONData.TECHNICIAN_STATUS_PRODUCTIVE ||
                         latestClosedClocking.technicianStatus == JSONData.TECHNICIAN_STATUS_TRAVELING ) {
                        // If latest was productive or travel, create TTRNC clocking to fill gap
                        debug && console.log( "Clocking.recordTime: Creating new TTRNC clocking to fill gap before new lunch clocking" );
                        gapTimeEntry.technicianStatus = JSONData.TECHNICIAN_STATUS_PRODUCTIVE;
                        gapTimeEntry.laborCodeId = JSONData.LABOR_CODE_ID_TTRNC;
                    }
                    JSONData.saveJSON( "technicianClocking", gapTimeEntry, true );
                    // Change lunch start time to end time of gap entry
                    newTimeEntry.timeStart = gapTimeEntry.timeEnd;
                }

            // Associate the work order to technician clocking if the status is productive
            // or traveling
            } else if ( clockingStatusObj.technicianStatus == JSONData.TECHNICIAN_STATUS_PRODUCTIVE ||
                        clockingStatusObj.technicianStatus == JSONData.TECHNICIAN_STATUS_TRAVELING ) {

                // Unproductive reason must be null for productive clocking
                newTimeEntry.unproductiveTimeReason = null;

                // Labor time type ID for all productive clockings is 1 because
                // this is the only ID used by Crown.
                newTimeEntry.laborTimeTypeId = 1;

                var workOrder = JSONData.getObjectById( "workOrders", workOrderIdForClockingStatus, null );

                // Associate the work order with the new time entry
                debug && console.log( "Clocking.recordTime: Associating new time entry with work order " +
                                      workOrder.documentNumber );

                newTimeEntry.workOrderHeaderId = workOrder.webId;
                newTimeEntry.workOrderSegmentId = workOrder.workOrderSegments[0].webId;
                if ( workOrder.workOrderSegments[0].clientReference ) {
                    newTimeEntry.workOrderSegmentClientReference = workOrder.workOrderSegments[0].clientReference;
                }
                newTimeEntry.workOrderDocumentNumber = workOrder.documentNumber;
                customer = JSONData.getObjectById( "customers", workOrder.customerId, null );
                if ( customer ) {
                    newTimeEntry.workOrderCustomerName = customer.name;
                }

                // Set the labor code
                newTimeEntry.laborCodeId = clockingStatusObj.laborCodeId;
                                                                                                       2
                // Clear out work order ID for clocking change
                JSONData.setWorkOrderIdForClockingChange( "" );
            }

            // Save time entry and update the technician status
            debug && console.log( "Clocking.recordTime: Saving new '" + clockingStatus + "' time entry with start time = " + startTime );
            JSONData.saveJSON( "technicianClocking", newTimeEntry, true );

            if ( UIFrame ) {
                UIFrame.updateCurrentTechnicianStatus( newTimeEntry );
            }

            // If the current page is the timesheet page, update it's list views
            // to reflect recorded clocking
            if ( currentPageId && currentPageId === "timeSheetPage" ) {
                TimeSheet.populateListViews( null, false );
                TimeSheet.selectMostRecentOpenEntry();
            }

        }
    }

    /**
     * Switch from travel clocking to productive clocking
     */
    function switchTravelToProductive() {
        var currentWorkOrderId = WorkOrder.getCurrentWorkOrderId();
        if ( currentWorkOrderId && JSONData.isTechnicianTraveling() ) {
            debug && console.log( "Clocking.switchTravelToProductive: Switching from travel to productive at " + new Date() );
            JSONData.setWorkOrderIdForClockingChange( currentWorkOrderId );
            JSONData.saveClockingStatus( 'technicianStatusProductive', Util.getISOCurrentTime() );
        } else {
            console.error( "Clocking.switchTravelToProductive: Switch skipped because current work order ID not set or current status is not traveling" );
        }
    }

    return {
        "getLatestClosedClocking"           : getLatestClosedClocking,
        "recordTime"                        : recordTime,
        "switchTravelToProductive"          : switchTravelToProductive
    }

}();
