/**
 * pmsdue.js
 */

"use strict";

/**
 * PmsDue
 * Using the Revealing Module JavaScript pattern to encapsulate
 * the pms due functionality into an object
 */
var PmsDue = function() {

    var pmsDue = null,
        pmSelection = null;

    // Holds list of available customers
    var customerArray  = [];

    // Holds a list of preloaded translations
    var translations = {};

    var defaultListItems = "";

    /**
     * This function is called by JSONData.periodicJSONUpdateComplete() when
     * a periodic JSON feed update is complete.  It allows this page to
     * to update the pm schedule list
     * @param dataType - String containing data type of feed that completed
     */
    function periodicJSONFeedUpdateCompleteFn( dataType ) {
        if ( dataType == "pmSchedules" ) {
            debug && console.log( "PmsDue.periodicJSONFeedUpdateCompleteFn: Periodic JSON update complete" );
            if ( window.localStorage.getItem( JSONData.LS_JSON_FEED_UPDATE_MANUALLY_STARTED ) ) {
                Dialog.closeDialog( false );
            }
            // SFAM-263: Turn off updates for pmSchedules feed
            Config.setUpdateSupportedForJSONFeed( "pmSchedules", false );

            // Reload the customer array because new PMs may reference new customers
            customerArray = JSONData.getObjectsByDataType( "customers" );
            debug && console.log( "PmsDue.periodicJSONFeedUpdateCompleteFn: Refreshing PM due list" );
            loadPMsDueList();
            populateListViews( pmsDue, false );
        }
    }

    /**
     * Load the pmsDue array
     */
    function loadPMsDueList() {
        pmsDue = _.filter(
            _.sortBy( JSONData.getObjectsByDataType( "pmSchedules" ), function( pmDue ) {
                var customer = JSONData.getObjectFromArrayById( customerArray, pmDue.customerId );
                var sortCriteria;
                if ( customer ) {
                    sortCriteria = (customer.name + customer.webId);
                }
                if ( pmDue.equipment ) {
                    sortCriteria += pmDue.equipment.serialNumber;
                }
                return sortCriteria;
            }), function ( pmScheduleInList ) {
                return ( JSONData.isPMBeforeCutoffDate( pmScheduleInList ) );
            }
        );
    }

    /**
     * Initialization
     */
    var init = _.once( function() {
        JSONData.setPageSpecificPeriodicUpdateCompleteFn( periodicJSONFeedUpdateCompleteFn );
        customerArray = JSONData.getObjectsByDataType( "customers" );
        // Preload translations
        translations.open = Localization.getText( "open" );
        translations.addressHeader = Localization.getText( "addressLabel" );
        translations.pmType = Localization.getText( "pmTypeHeader" );
        translations.noAvailableJobCode = Localization.getText( "noAvailableJobCode" );
        translations.scheduled = Localization.getText( "scheduled" );
        translations.lastServiceDateHeader = Localization.getText( "lastServiceDateHeader" );
        translations.phoneExtension = Localization.getText( "phoneExtension" );
        translations.jobCode = Localization.getText( "jobCode" );
        translations.customerId = Localization.getText( "customerIdHeader" );

        // SFAM-263: Tapping on refresh will manually start the periodic JSON feed update
        $( "#refresh" ).click( function() {
            Config.setUpdateSupportedForJSONFeed( "pmSchedules", true );

            // Performing a manual refresh displays a progress dialog
            Dialog.showPleaseWait( Localization.getText( "manualJSONFeedRefreshTitle" ),
                                   Localization.getText( "manualJSONFeedRefreshProgress" ), "400px" );
            JSONData.getPeriodicJSONFeedUpdates( true );
        });

        populateListViews();
    });

    /**
     * Bind the click handler to the pm due item class
     * to prompt technician to create a new work order
     */
    function bindPMDueItemClickHandler() {
        $('.list-item-padding').on( "click", function() {
            pmSelection = this.id;
            var pmForNewWorkOrder = JSONData.getObjectById( "pmSchedules", pmSelection, null );
            var promptText = Localization.getText( "createWorkOrderDialogText" )
                                .replace( "serialNumber", pmForNewWorkOrder.equipment.serialNumber );
            Dialog.showConfirmYesNo( Localization.getText( "createWorkOrderDialogHeader" ), promptText, createWorkOrder,
                function() {
                    Dialog.closeDialog( false );
                }, "400px" );
        });
    }

    /**
     * Populate the pms due list
     */
    function populateListViews( pmsDueList, repopulatingList ) {
        var folder;
        debug && console.log( "PmsDue.populateListViews: Populating the pms due list" );
        if( repopulatingList === undefined ) {
            repopulatingList = false;
        }

        // Add the Customers divider to the guided search list
        if( !repopulatingList ) {
             $('#guidedSearchList').children('li').remove();
            UIFrame.addGuidedSearchDivider( Localization.getText( "customers" ) );
        }

        if( pmsDueList && pmsDueList.length >= 0 ) {
            pmsDue = pmsDueList;
        } else {
            loadPMsDueList();
        }

        // Remove all existing items from the pms due list
        var pmsDueList = $('#pmsDueList');
        pmsDueList.children('li').remove();

        debug && console.log( "PmsDue.populateListViews: " + pmsDue.length + " pmsdue found." );
        var pmDueDate,
            pmsDueCount = 0,
            currentCustomer = null,
            currentCustomerId = null,
            currentCustomerAddress = null,
            currentCustomerMainContact = null,
            currentCustomerMainCommDetail = null,
            distanceGuidedSearchCount = new Array(0, 0, 0, 0),
            dueDateGuidedSearchCount = new Array(0, 0, 0, 0),
            pmDueItemTemplate        = new EJS({url: 'templates/pmduelistitem'}),
            pmDueListDividerTemplate = new EJS({url: 'templates/pmduelistdivider'}),
            serviceQuoteCount = 0,
            workOrderCount = 0;

        // date criteria for the pms due
        var dayHrs = 1000 * 60 * 60 * 24,
            today = new Date().setHours( 0, 0, 0, 0 ),
            dueDate = null,
            pmListItem = "";

        for( var currentPmDue in pmsDue ) {
            currentPmDue = pmsDue[currentPmDue];
            if ( currentPmDue.dateOverride ) {
                dueDate = new Date( currentPmDue.dateOverride );
            } else {
                dueDate = new Date( currentPmDue.dateSchedule );
            }


            // Add a list divider when the customer ID changes
            if ( currentCustomerId == null || currentCustomerId != currentPmDue.customerId ) {
                currentCustomer = JSONData.getObjectFromArrayById( customerArray, currentPmDue.customerId );

                if ( currentCustomer ) {
                    currentCustomerAddress =  Util.getObjectFromArray( currentCustomer.addresses, 'webId', currentPmDue.addressId );
                    if ( !currentCustomerAddress ) {
                        currentCustomerAddress = currentCustomer.addresses[0];
                    }
                    currentCustomerMainContact =  Util.getObjectFromArray( currentCustomer.contacts, 'webId', currentCustomer.mainContactId );
                    if ( currentCustomerAddress.communicationDetails && currentCustomerAddress.communicationDetails.length > 0 ) {
                        currentCustomerMainCommDetail = JSONData.getMainCommunicationDetails( currentCustomerAddress.communicationDetails );
                    }
                }

                // Get the number of work orders for the current customer
                workOrderCount = WorkOrder.getWorkOrderCountForCustomer( null, currentPmDue.customerId );
                pmsDueCount = JSONData.getPMCountForCustomer( pmsDue, currentPmDue.customerId, true );

                pmListItem = pmDueListDividerTemplate.render({
                    customer : currentCustomer,
                    contact: currentCustomerMainContact,
                    address : currentCustomerAddress,
                    communicationDetail: currentCustomerMainCommDetail,
                    pmsCount : Localization.formatNumber( pmsDueCount, "n0" ),
                    woCount : Localization.formatNumber( workOrderCount, "n0" ),
                    sqCount : Localization.formatNumber( serviceQuoteCount, "n0" ),
                    translations : translations
                });

                // Add a list divider when the customer ID changes
                pmsDueList.append( pmListItem );

                // Add a guided search item when the customer ID changes
                if ( !repopulatingList ) {
                    defaultListItems += pmListItem;
                    if ( currentCustomer ) {
                        UIFrame.addGuidedSearchItem( currentCustomer.name, "customer" + currentCustomer.webId, pmsDueCount );
                    }
                }

                if ( currentCustomer ) {
                    currentCustomerId = currentCustomer.webId;
                }
            }

            if ( currentPmDue.dateOverride ) {
                pmDueDate = currentPmDue.dateOverride;
            } else {
                pmDueDate = currentPmDue.dateSchedule;
            }

            // Get the folder description
            if ( currentPmDue.folderId ) {
                folder = JSONData.getObjectById( "folders", currentPmDue.folderId );
            } else {
                folder = null;
            }
            pmListItem = pmDueItemTemplate.render({
                pmDue : currentPmDue,
                pmDueDate : pmDueDate,
                customer : currentCustomer,
                translations : translations,
                folder : folder
            });

            // Add the pm due to the list
            pmsDueList.append( pmListItem );
            if( !repopulatingList ) {
                defaultListItems += pmListItem;
            }

            // Increment the respective dueDateGuidedSearchCount for the date difference between today and this pm due
            var dateDiff = ( dueDate.setHours( 0, 0, 0, 0 ) - today ) / dayHrs;
            if ( dateDiff < 0 ) { // Any past due pms
                dueDateGuidedSearchCount[0] ++;
            } else if ( dateDiff <= 5 ){ // Any due in the next 5 days
                dueDateGuidedSearchCount[1] ++;
                dueDateGuidedSearchCount[2] ++;
                dueDateGuidedSearchCount[3] ++;
            }
            else if ( dateDiff <= 10 ) { // Any due in the next 10 days
                dueDateGuidedSearchCount[2] ++;
                dueDateGuidedSearchCount[3] ++;
            }
            else if ( dateDiff <= 20) { // Any due in the next 20 days
                dueDateGuidedSearchCount[3] ++;
            }
        }

        // Update the list divider and guided search counts
        UIFrame.updateListDividerItemCount( currentCustomerId, pmsDueCount );
        if( !repopulatingList ) {
            UIFrame.updateGuidedSearchItemCount( "customer" + currentCustomerId, pmsDueCount );
        }

        if( !repopulatingList ) {
            // Add the Due Date divider to the guided search list
            UIFrame.addGuidedSearchDivider( Localization.getText( "dueDate" ));

            // Loop through all of the pms from the results
            UIFrame.addGuidedSearchItem( Localization.getText( "guidedSearchHeaderDate1" ), "daysPast", dueDateGuidedSearchCount[0] );
            UIFrame.addGuidedSearchItem( Localization.getText( "guidedSearchHeaderDate2" ), "days5",    dueDateGuidedSearchCount[1] );
            UIFrame.addGuidedSearchItem( Localization.getText( "guidedSearchHeaderDate3" ), "days10",   dueDateGuidedSearchCount[2] );
            UIFrame.addGuidedSearchItem( Localization.getText( "guidedSearchHeaderDate4" ), "days20",   dueDateGuidedSearchCount[3] );


            // Guided search by distance disabled because GPS functionality is not currently implemented
            // Add the Distance divider to the guided search list
            // UIFrame.addGuidedSearchDivider( Localization.getText( "distance" ));

            // Loop through all of the customers from the results
//            UIFrame.addGuidedSearchItem( Localization.getText( "guidedSearchHeaderDistance1" ), "distance0",  distanceGuidedSearchCount[0] );
//            UIFrame.addGuidedSearchItem( Localization.getText( "guidedSearchHeaderDistance2" ), "distance5",  distanceGuidedSearchCount[1] );
//            UIFrame.addGuidedSearchItem( Localization.getText( "guidedSearchHeaderDistance3" ), "distance10", distanceGuidedSearchCount[2] );
//            UIFrame.addGuidedSearchItem( Localization.getText( "guidedSearchHeaderDistance4" ), "distance25", distanceGuidedSearchCount[3] );
        }

        // Refresh the list so that it is themed correctly
        pmsDueList.listview('refresh');

        bindPMDueItemClickHandler();

        // Refresh the guided search list
        if( !repopulatingList ) {
            UIFrame.refreshGuidedSearch();

            var initFilter = "";

            // If an initial list filter is found, invoke the populateListViews method after the list is filtered
            if( window.localStorage.getItem( "pmCustomerFilter" )) {
                initFilter = window.localStorage.getItem( "pmCustomerFilter" );

                var filterCustomer = JSONData.getObjectFromArrayById( customerArray , initFilter ),
                    filterCustomerGuidedSearchItem = "#customer" + filterCustomer.webId;
                UIFrame.initListFilter( filterCustomer.name );

                var initialFilteredList =_.filter( pmsDue, function( currentPM ) {
                    return currentPM.customerId == initFilter;
                });

                // Check the length of the filtered PMs Due list
                if ( initialFilteredList && initialFilteredList.length > 0 ) {
                    populateListViews( initialFilteredList, true );
                    UIFrame.changeListFilter( "" );
                    UIFrame.refreshGuidedSearchWithSelectedItem( $( filterCustomerGuidedSearchItem ), clearGuidedSearch );
                } else {
                    debug && console.log( "PmsDue.guidedSearchClickHandler: Filtering skipped because no work orders match selected filter criteria" );
                }

                window.localStorage.removeItem( "pmCustomerFilter" );
            } else if(window.localStorage.getItem( "pmIdFilter" ) ) {
                initFilter = window.localStorage.getItem( "pmIdFilter" );

                var filterPMGuidedSearchItem = "#pm" + initFilter;
                UIFrame.initListFilter( "pm" + initFilter );

                // Filter the list by the initial list filter
                var initialFilteredList = _.filter( pmsDue, function( currentPM ) {
                    return currentPM.webId == initFilter;
                });

                // Check the length of the filtered PMs Due list
                if ( initialFilteredList && initialFilteredList.length > 0 ) {
                    populateListViews( initialFilteredList, true );
                    UIFrame.changeListFilter( "" );
                    UIFrame.refreshGuidedSearchWithSelectedItem( $( filterPMGuidedSearchItem ), clearGuidedSearch );
                } else {
                    debug && console.log( "PmsDue.guidedSearchClickHandler: Filtering skipped because no work orders match selected filter criteria" );
                }

                window.localStorage.removeItem( "pmIdFilter" );
            }

            UIFrame.bindGuidedSearchClickHandler( guidedSearchClickHandler );
        }

        UIFrame.adjustListViewBorders();
    }

    /**
     * Guided search click handler for the pms due list page
     * @param event - the click event
     */
    function guidedSearchClickHandler( event ) {
        debug && console.log( "PmsDue.guidedSearchClickHandler" );
        var customer;
        var dateFilterFn;
        var filterId = this.id;
        var filteredPmsDue = null;

        loadPMsDueList();

        // Filter the list by the Due Date Guided Search Items
        if ( filterId.indexOf( "days" ) != -1 ) {
            debug && console.log( "PmsDue.guidedSearchClickHandler : Filtering work orders using date filtering" );
            dateFilterFn = function( currentPmDue, filterId ) {
                var dateDiff;
                var dayHrs = 1000 * 60 * 60 * 24;
                var dueDate;
                var matchesFilter = false;
                var today = new Date().setHours( 0, 0, 0, 0 );
                if ( currentPmDue.dateOverride ) {
                    dueDate = new Date( currentPmDue.dateOverride );
                } else {
                    dueDate = new Date( currentPmDue.dateSchedule );
                }
                dateDiff = ( dueDate.setHours( 0, 0, 0, 0 ) - today ) / dayHrs;

                switch ( filterId ) {
                    case "daysPast" :
                        matchesFilter = ( dateDiff < 0 );
                        break;
                    case "days5" :
                        matchesFilter = ( dateDiff <= 5 && dateDiff >= 0 );
                        break;
                    case "days10" :
                        matchesFilter = ( dateDiff <= 10 && dateDiff >= 0 );
                        break;
                    case "days20" :
                        matchesFilter = ( dateDiff <= 20 && dateDiff >= 0 );
                        break;
                }
                return matchesFilter;
            };
            filteredPmsDue = _.filter( pmsDue, function( pmInList ) {
                return dateFilterFn( pmInList, filterId );
            });
        } else if( filterId.indexOf( "customer" ) == 0 ) {
            // Filter by customer
            var customerId = filterId.match( /customer(\d+)/ )[1];
            debug && console.log( "PmsDue.guidedSearchClickHandler: Filtering pms due using customer Id: " + customerId );
            customer = null;
            filteredPmsDue = _.filter(
                _.sortBy( pmsDue, function( pmDue ) {
                    customer = JSONData.getObjectFromArrayById( customerArray, pmDue.customerId );
                    if ( customer ) {
                        return customer.name + customer.webId;
                    } else {
                        return pmDue.customerId;
                    }
                }),
                function ( pmScheduleInList ) {
                    return pmScheduleInList.customerId == customerId;
                }
            );
        } else if( filterId.indexOf( "distance" ) == 0 ) {
            // Filter by the distance
            debug && console.log( "PmsDue.guidedSearchClickHandler : Filtering pms using distance filtering" );
        } else if( filterId.indexOf( "pm" ) == 0 ) {
            // Filter by the pm serial
            debug && console.log( "PmsDue.guidedSearchClickHandler : Filtering pms using id filtering" );
            customer = null;
            var pmWebId = filterId.match( /pm(\d+)/ )[1];
            filteredPmsDue = _.filter(
                _.sortBy( pmsDue, function( pmDue ) {
                    customer = JSONData.getObjectFromArrayById( customerArray, pmDue.customerId );
                    return customer.name + customer.webId;
                }),
                function ( pmScheduleInList ) {
                    return pmScheduleInList.webId == pmWebId;
                }
            );
        }

        if ( !filteredPmsDue ) {
            filteredPmsDue = [];
        }

        populateListViews( filteredPmsDue, true );
        UIFrame.changeListFilter( "" );
        UIFrame.refreshGuidedSearchWithSelectedItem( this, clearGuidedSearch );

        // Adjust the list view borders after the guided search is applied
        UIFrame.adjustListViewBorders();
    }

    /**
     * Guided search click handler for pms due resets the list views
     * after filtering the pms due
     * @param event - click event
     */
    function clearGuidedSearch( event ) {
        var pmsList = $('#pmsDueList');

        // These two calls must be the first two lines in all custom clear handlers
        event.preventDefault();
        event.stopPropagation();
        debug && console.log( "PmsDue.clearGuidedSearch: Resetting pm list views" );

        pmsList.empty();
        pmsList.append( defaultListItems );
        pmsList.listview( 'refresh' );

        bindPMDueItemClickHandler();

        UIFrame.resetGuidedSearch( this );
        UIFrame.adjustListViewBorders();
    }

    /**
     * Assign event listeners for the Close/Create buttons in the create new work order dialog box
     */
    function createWorkOrder() {
        debug && console.log( "PmsDue.createWorkOrder: Creating new work order"  );
        var newWorkOrder = WorkOrder.createNewWorkOrder();

        // Open the PM and create a new work order
        var openPM = JSONData.getObjectById( "pmSchedules", pmSelection);
        var equipment = openPM.equipment;
        var customer = JSONData.getObjectFromArrayById( customerArray, openPM.customerId );
        var branch = JSONData.getObjectById( "branches", JSONData.getTechnicianBranchId() );

        var newWorkOrderFn = function( standardJobCode ) {
            // Update the PM-related items for this work order
            newWorkOrder.documentNumber = "PM" + WorkOrder.getNewLocalWorkOrderNumber();
            newWorkOrder.customerId = customer.webId;
            newWorkOrder.dateOpened  = Util.getISOCurrentTime();
            newWorkOrder.addressId = customer.mainAddressId;
            newWorkOrder.workOrderSegments[0].pmScheduleId = openPM.webId;
            newWorkOrder.workOrderSegments[0].equipment = equipment;
            if ( branch && branch.webId ) {
                newWorkOrder.workOrderSegments[0].branchId = branch.webId;
            }
            
            // TODO this may need to be null, folderID should be determined upstream depending on equipment, not by the mobile app
            newWorkOrder.workOrderSegments[0].folderId = WorkOrder.PLANNED_MAINTENANCE_FOLDER_ID;
            newWorkOrder.workOrderSegments[0].equipmentId = equipment.webId;
            newWorkOrder.workOrderSegments[0].hourMeter = equipment.hourMeter;
            newWorkOrder.workOrderSegments[0].odometer = equipment.odometer;
            newWorkOrder.workOrderSegments[0].standardJobCodeId = openPM.standardJobCodeId;
            newWorkOrder.workOrderSegments[0].webStatus = WorkOrder.WORK_ORDER_STATUS_NOT_STARTED;
            if ( standardJobCode ) {
                newWorkOrder.workOrderSegments[0].standardJobCode = standardJobCode;
            } else {
                newWorkOrder.workOrderSegments[0].standardJobCode = null;
            }

            // Create the work order for JSON storage
            JSONData.saveJSON( "workOrders", newWorkOrder );

            window.localStorage.setItem( JSONData.LS_INITIAL_WORK_ORDER_LIST_FILTER, newWorkOrder.webId );
            JSONData.deleteJSON( "pmSchedules", openPM.webId );
            UIFrame.navigateToPage( "workorderlist.html" );
        };

        // Get the standard job code object for the new work order
        if ( openPM.standardJobCodeId ) {
            JSONData.getObjectFromDatabaseById( "standardJobCodes", openPM.standardJobCodeId,
                function( standardJobCode ) {
                    newWorkOrderFn( standardJobCode );
                }
            );
        } else {
            newWorkOrderFn( null );
        }
    }

    /**
     * Display the notes for a PM schedule in the PMs Due list
     * @param event
     * @param pmDueId
     */
    function displayPMSchduleNotes( event, pmDueId ) {
        event.stopPropagation();
        event.preventDefault();
        var pmDue = JSONData.getObjectFromArrayById( pmsDue, pmDueId );
        if ( pmDue && pmDue.note && pmDue.note.length > 0 ) {
            debug && console.log( "PmsDue.displayPMSchduleNotes: Displaying notes for PM schedule ID " + pmDueId );
            Dialog.showScrollableDialog( Localization.getText( "plannedMaintenanceNotes" ),
                                         pmDue.note, null, "500px" );
        }
    }

    return {
        'displayPMSchduleNotes' : displayPMSchduleNotes,
        'init'                  : init,
        'populateListViews'     : populateListViews
    };
}();

/**
 * pageinit event handler for the pms due list page
 */
$("div:jqmData(role='page')").on( "pageinit", function( event, ui ) {
    // All pages must set pageId to this.id
    var pageId = this.id;
    debug && console.log( "PmsDue.pageinit: Initializing " + pageId );

    // This MUST be called by every page specific pageinit event handler!
    UIFrame.init( pageId, function() {
        debug && console.log( "PmsDue.pageinit: Executing page specific init" );

        // Initialize the page and populate the pms due list
        PmsDue.init();

        // Adjust the style to hide the search form that appears at the top of the
        // pm due list
        var pmsDueListSearchFormStyle = {
            'margin-left'  : '0px',
            'margin-right' : '0px',
            'margin-top'   : '0px',
            'margin-bottom': '0px',
            'border-style' : 'none'
        };
        $(".ui-listview-filter").css( pmsDueListSearchFormStyle );

        // This MUST be the last line inside each page specific init function
        UIFrame.postPageSpecificInit( pageId );
    });
});
