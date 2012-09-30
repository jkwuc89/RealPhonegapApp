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

    // Holds list of available equipment
    var equipmentArray = [];
    
    // Holds a list of preloaded translations
    var translations = {};
    
    var defaultListItems = "";
    
    /**
     * Initialization
     */
    var init = _.once( function() {
        customerArray = JSONData.getObjectsByDataType( "customers" );
        equipmentArray = JSONData.getObjectsByDataType( "equipment" );
        
        // Preload translations
        translations.open = Localization.getText( "open" );
        translations.addressHeader = Localization.getText( "addressHeader" );
        translations.pmType = Localization.getText( "pmType" );
        translations.noAvailableJobCode = Localization.getText( "noAvailableJobCode" );
        translations.scheduled = Localization.getText( "scheduled" );
        translations.lastServiceDateLabel = Localization.getText( "lastServiceDateLabel" );
        translations.phoneExtension = Localization.getText( "phoneExtension" );
        translations.jobCode = Localization.getText( "jobCode" );
        
        populateListViews();
    });
    
    /**
     * Populate the pms due list
     */
    function populateListViews( pmsDueList, repopulatingList ) {
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
        	var equipment = null;
        	
            // Only display future PM schedules due in the next 10 days in the next month
            var now = new Date();
            
            // Passing the current year, the current month + 1 and 0 as the day returns the
            // last day of the month
            var pmDateCutoff = new Date( now.getFullYear(), now.getMonth() + 1, 0 ).getTime() - ( 1000 * 60 * 60 * 24 );
            
            pmsDue = _.filter( 
            	_.sortBy( JSONData.getObjectsByDataType( "pmSchedules" ), function( pmDue ) {
            	    var customer = JSONData.getObjectFromArrayById( customerArray, pmDue.customerId );
            	    var sortCriteria = (customer.name + customer.webId);
                	if ( pmDue.equipmentId ) {
                		equipment = JSONData.getObjectFromArrayById( equipmentArray, pmDue.equipmentId );
                		if ( equipment ) {
                		    sortCriteria += equipment.serialNumber;
                		}
                	} 
                	return sortCriteria;
                }),
            	function ( pmScheduleInList ) {
	                return ( new Date( pmScheduleInList.dateSchedule ).getTime() <= pmDateCutoff );
            	});	
        }
        
        // Remove all existing items from the pms due list
        var pmsDueList = $('#pmsDueList'); 
        pmsDueList.children('li').remove();

        debug && console.log( "PmsDue.populateListViews: " + pmsDue.length + " pmsdue found." );
        var currentCustomer = null,
            currentCustomerId = null,
            currentCustomerAddress = null,
            currentCustomerMainContact = null,
            currentCustomerMainCommDetail = null,
            distanceGuidedSearchCount = new Array(0, 0, 0, 0),
            dueDateGuidedSearchCount = new Array(0, 0, 0, 0),
            pmsDueCount = 0,
            pmDueItemTemplate        = new EJS({url: 'templates/pmduelistitem'}),
            pmDueListDividerTemplate = new EJS({url: 'templates/pmduelistdivider'}),
            serviceQuoteCount = 0,
            workOrderCount = 0;
        
        // date criteria for the pms due
        var dayHrs = 1000 * 60 * 60 * 24,
        	today = new Date().getTime(),
        	dueDate = null,
        	pmListItem = "";
                
        //for ( var i = 0; i < pmsDue.length; i++ ) {
        for( var currentPmDue in pmsDue ) {
        	currentPmDue = pmsDue[currentPmDue];
            dueDate = new Date( currentPmDue.dateSchedule );
            
            // Add a list divider when the customer ID changes
            if ( currentCustomerId == null || currentCustomerId != currentPmDue.customerId ) {
                currentCustomer = JSONData.getObjectFromArrayById( customerArray, currentPmDue.customerId );
                
                currentCustomerAddress =  Util.getObjectFromArray( currentCustomer.addresses, 'webId', currentCustomer.mainAddressId );
                if ( !currentCustomerAddress ) {
                    currentCustomerAddress = currentCustomer.addresses[0];
                }
                currentCustomerMainContact =  Util.getObjectFromArray( currentCustomer.contacts, 'webId', currentCustomer.mainContactId );
                if ( currentCustomerAddress.communicationDetails && currentCustomerAddress.communicationDetails.length > 0 ) {
                    currentCustomerMainCommDetail = JSONData.getMainCommunicationDetails( currentCustomerAddress.communicationDetails );
                }
                
                // Get the number of work orders for the current customer
                workOrderCount = JSONData.getFilteredObjectCount( "workOrders", function( workOrderFromList ) {
                    return workOrderFromList.customerId == currentCustomer.webId &&
                        workOrderFromList.workOrderSegments[0].webStatus != JSONData.WORK_ORDER_STATUS_REJECTED &&
                        workOrderFromList.workOrderSegments[0].webStatus != JSONData.WORK_ORDER_STATUS_COMPLETED;
                });
                pmsDueCount = _.filter( pmsDue, function( pmDueFromList ) {
                    return pmDueFromList.customerId == currentCustomer.webId; 
                });
                
                pmListItem = pmDueListDividerTemplate.render({
                    customer : currentCustomer,
                    contact: currentCustomerMainContact,
                    address : currentCustomerAddress,
                    communicationDetail: currentCustomerMainCommDetail,
                    pmsCount : Localization.formatNumber( pmsDueCount.length, "n0" ),
                    woCount : Localization.formatNumber( workOrderCount, "n0" ),
                    sqCount : Localization.formatNumber( serviceQuoteCount, "n0" ),
                    translations : translations
                });
                
                // Add a list divider when the customer ID changes
                pmsDueList.append( pmListItem );
                
                // Add a guided search item when the customer ID changes
                if ( !repopulatingList ) {
                    defaultListItems += pmListItem;
                    UIFrame.addGuidedSearchItem( currentCustomer.name, "customer" + currentCustomer.webId, pmsDueCount.length );
                }
                
                currentCustomerId = currentCustomer.webId;
            }
            
            pmListItem = pmDueItemTemplate.render({
                pmDue : currentPmDue,
                customer : currentCustomer,
                translations : translations
            });
            
            // Add the pm due to the list
            pmsDueList.append( pmListItem );            
            if( !repopulatingList ) {
            	defaultListItems += pmListItem;
            }            
            
            // Increment the respective dueDateGuidedSearchCount for the date difference between today and this pm due
            var dateDiff = parseInt(( dueDate.setHours(0,0,0,0) - today) / dayHrs);
            if( dateDiff < 0 ) { // Any past due pms
                dueDateGuidedSearchCount[0] ++;
            } else if( dateDiff <= 5 ){ // Any due in the next 5 days
                dueDateGuidedSearchCount[1] ++;
                dueDateGuidedSearchCount[2] ++;
                dueDateGuidedSearchCount[3] ++;
            }
            else if( dateDiff <= 10 ) { // Any due in the next 10 days
                dueDateGuidedSearchCount[2] ++;
                dueDateGuidedSearchCount[3] ++;
            }
            else if ( dateDiff <= 20) { // Any due in the next 20 days
                dueDateGuidedSearchCount[3] ++;
            } 
        }
        
        // Update the list divider and guided search counts
        UIFrame.updateListDividerItemCount( currentCustomerId, pmsDueCount.length );
        if( !repopulatingList ) {        
            UIFrame.updateGuidedSearchItemCount( "customer" + currentCustomerId, pmsDueCount.length );
        }
        
        if( !repopulatingList ) {
            // Add the Due Date divider to the guided search list
            UIFrame.addGuidedSearchDivider( Localization.getText( "dueDate" ));
                
            // Loop through all of the pms from the results
            UIFrame.addGuidedSearchItem( Localization.getText( "guidedSearchHeaderDate1" ), "daysPast", dueDateGuidedSearchCount[0] );
            UIFrame.addGuidedSearchItem( Localization.getText( "guidedSearchHeaderDate2" ), "days5",    dueDateGuidedSearchCount[1] );
            UIFrame.addGuidedSearchItem( Localization.getText( "guidedSearchHeaderDate3" ), "days10",   dueDateGuidedSearchCount[2] );
            UIFrame.addGuidedSearchItem( Localization.getText( "guidedSearchHeaderDate4" ), "days20",   dueDateGuidedSearchCount[3] );
                    
                
            // Add the Distance divider to the guided search list
            UIFrame.addGuidedSearchDivider( Localization.getText( "distance" ));
                
            // Loop through all of the customers from the results
            UIFrame.addGuidedSearchItem( Localization.getText( "guidedSearchHeaderDistance1" ), "distance0",  distanceGuidedSearchCount[0] );
            UIFrame.addGuidedSearchItem( Localization.getText( "guidedSearchHeaderDistance2" ), "distance5",  distanceGuidedSearchCount[1] );
            UIFrame.addGuidedSearchItem( Localization.getText( "guidedSearchHeaderDistance3" ), "distance10", distanceGuidedSearchCount[2] );
            UIFrame.addGuidedSearchItem( Localization.getText( "guidedSearchHeaderDistance4" ), "distance25", distanceGuidedSearchCount[3] );
        }
        
        // Refresh the list so that it is themed correctly
        pmsDueList.listview('refresh');
        
        // Bind the click handler to the pm due item class
        // so that we can control navigation to the work order details page
        $('.list-item-padding').on( "tap", function() {
        	pmSelection = this.id;
        	Dialog.showConfirmYesNo( Localization.getText( "createWorkOrderDialogHeader" ), Localization.getText( "createWorkOrderDialogText" ), createWorkOrder,
        		function() {
        	        UIFrame.closeActiveDialog();
        		}
        	);
        });

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
        
        if ( repopulatingList ) {
            UIFrame.adjustListViewBorders();
        }
    }
    
    /**
     * Guided search click handler for the pms due list page
     * @param event - the click event
     */
    function guidedSearchClickHandler( event ) {
        debug && console.log( "PmsDue.guidedSearchClickHandler" );

        var filteredPmsDue = null;
        // Filter the list by the Due Date Guided Search Items
        if ( this.id.indexOf( "days" ) != -1 ) {
            debug && console.log( "PmsDue.guidedSearchClickHandler : Filtering work orders using date filtering" );
            var date = new Date();
            date.setHours(0,0,0,0);
            
            var today = date.getTime();
            var dayHrs = 1000 * 60 * 60 * 24;
            
            // Check for the correct filter id and use the respective filter
            if( this.id == "daysPast" ) { // Return any pms that are past due
                filteredPmsDue = JSONData.getFilteredObjectList( "pmSchedules", function( currentPM ) {
                        return new Date( currentPM.dateSchedule ).getTime() < today;
                });
            } else if( this.id == "days5" ) { // Return any pms due in the next 5 days
                filteredPmsDue = JSONData.getFilteredObjectList( "pmSchedules", function( currentPM ) {
                    return (((new Date( currentPM.dateSchedule ).setHours(0,0,0,0) - today) / dayHrs ) <= 5) &&
                           new Date( currentPM.dateSchedule ).setHours(0,0,0,0) >= today;
                });
            } else if( this.id == "days10" ) { 
                filteredPmsDue = JSONData.getFilteredObjectList( "pmSchedules", function( currentPM ) {
                    return (((new Date( currentPM.dateSchedule ).setHours(0,0,0,0) - today) / dayHrs ) <= 10) &&
                           new Date( currentPM.dateSchedule ).setHours(0,0,0,0) >= today;
                });
            } else if( this.id == "days20" ) {
                filteredPmsDue = JSONData.getFilteredObjectList( "pmSchedules", function( currentPM ) {
                    return (((new Date( currentPM.dateSchedule ).setHours(0,0,0,0) - today) / dayHrs ) <= 20) &&
                           new Date( currentPM.dateSchedule ).setHours(0,0,0,0) >= today;
                });
            }
        } else if( this.id.indexOf( "customer" ) == 0 ) {
            // Filter by customer
            var customerId = this.id.match( /customer(\d+)/ )[1];
            debug && console.log( "PmsDue.guidedSearchClickHandler: Filtering pms due using customer Id: " + customerId );

    		var customer = null;
    		var now = new Date();
    		var pmDateCutoff = new Date( now.getFullYear(), now.getMonth() + 1, 0 ).getTime() - ( 1000 * 60 * 60 * 24 );
            filteredPmsDue = _.filter(
                	_.sortBy( JSONData.getObjectsByDataType( "pmSchedules" ), function( pmDue ) {
                	    customer = JSONData.getObjectFromArrayById( customerArray, pmDue.customerId );
                    	return customer.name + customer.webId;
                    }),
                	function ( pmScheduleInList ) {
    	                return ( new Date( pmScheduleInList.dateSchedule ).getTime() <= pmDateCutoff ) && pmScheduleInList.customerId == customerId;
                	});
        } else if( this.id.indexOf( "distance" ) == 0 ) {
            // Filter by the distance
            debug && console.log( "PmsDue.guidedSearchClickHandler : Filtering pms using distance filtering" );
        } else if( this.id.indexOf( "pm" ) == 0 ) {
            // Filter by the pm serial
            debug && console.log( "PmsDue.guidedSearchClickHandler : Filtering pms using id filtering" );
            var customer = null;
            var now = new Date();
            var pmWebId = this.id.match( /pm(\d+)/ )[1];
            var pmDateCutoff = new Date( now.getFullYear(), now.getMonth() + 1, 0 ).getTime() + ( 1000 * 60 * 60 * 24 * 10 );
            filteredPmsDue = _.filter( 
                	_.sortBy( JSONData.getObjectsByDataType( "pmSchedules" ), function( pmDue ) {
                	    customer = JSONData.getObjectFromArrayById( customerArray, pmDue.customerId );
                    	return customer.name + customer.webId;
                    }),
                	function ( pmScheduleInList ) {
    	                return ( new Date( pmScheduleInList.dateSchedule ).getTime() <= pmDateCutoff ) && pmScheduleInList.webId == pmWebId;
                	});
        }

        if( filteredPmsDue == null ) {
            filteredPmsDue = [];
        }
         
        populateListViews( filteredPmsDue, true );
        UIFrame.changeListFilter( "" );
        UIFrame.refreshGuidedSearchWithSelectedItem( this, clearGuidedSearch );
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
        
        // Bind the click handler to the pm due item class
        // so that we can control navigation to the work order details page
        $('.list-item-padding').on( "tap", function() {
        	pmSelection = this.id;
        	Dialog.showConfirmYesNo( Localization.getText( "createWorkOrderDialogHeader" ), Localization.getText( "createWorkOrderDialogText" ), createWorkOrder,
        		function() {
        	        UIFrame.closeActiveDialog();
        		}
        	);
        });
        UIFrame.resetGuidedSearch( this );
        UIFrame.adjustListViewBorders();
    }
    
    /**
     * Assign event listeners for the Close/Create buttons in the create new work order dialog box
     */
    function createWorkOrder() {
        debug && console.log( "PmsDue.createWorkOrder: Creating new work order"  );
        JSONData.createNewWorkOrder();
        var newWorkOrder = JSONData.createNewWorkOrder();
        
        // Open the PM and create a new work order
        var openPM = JSONData.getObjectById( "pmSchedules", pmSelection);
        var equipment = openPM.equipment;
        var customer = JSONData.getObjectFromArrayById( customerArray, openPM.customerId );
        var branch = JSONData.getObjectById( "branches", customer.branchId );
        
        var newWorkOrderFn = function( standardJobCode ) {
            // Update the PM-related items for this work order
            newWorkOrder.documentNumber = "PM" + UIFrame.getNewValidWorkOrderNumber();
            newWorkOrder.customerId = customer.webId;
            newWorkOrder.dateOpened  = Util.getISOCurrentTime();
            newWorkOrder.addressId = customer.mainAddressId;
            newWorkOrder.workOrderSegments[0].pmScheduleId = openPM.webId;
            newWorkOrder.workOrderSegments[0].equipment = equipment;
            if ( branch && branch.webId ) {
                newWorkOrder.workOrderSegments[0].branchId = branch.webId;
            }
            newWorkOrder.workOrderSegments[0].folderId = 359;
            newWorkOrder.workOrderSegments[0].equipmentId = equipment.webId;
            newWorkOrder.workOrderSegments[0].hourMeter = equipment.hourMeter;
            newWorkOrder.workOrderSegments[0].odometer = equipment.odometer;
            newWorkOrder.workOrderSegments[0].standardJobCodeId = openPM.standardJobCodeId;
            newWorkOrder.workOrderSegments[0].webStatus = JSONData.WORK_ORDER_STATUS_NOT_STARTED;
            if ( standardJobCode ) {
                newWorkOrder.workOrderSegments[0].standardJobCode = standardJobCode;
            } else {
                newWorkOrder.workOrderSegments[0].standardJobCode = null;
            }
            
            // Create the work order for JSON storage
            JSONData.saveJSON( "workOrders", newWorkOrder );
            
            window.localStorage.setItem( "workOrderFilter", newWorkOrder.webId );
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
    
    return {
        'init'              : init,
        'populateListViews' : populateListViews 
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
