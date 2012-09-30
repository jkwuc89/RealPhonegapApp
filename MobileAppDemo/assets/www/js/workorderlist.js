/**
 * workorderlist.js
 */

"use strict";

/**
 * WorkOrdeers Using the Revealing Module JavaScript pattern to encapsulate the work order functionality into an object
 */
var WorkOrderList = function() {

    // Holds list of work orders currently being displayed
    var workOrders = null;
    
    // Holds list of all customers
    var customerArray = [];

    // Holds list of all pm schedules
    var pmScheduleArray = [];
    
    // Holds list of all work orders
    var workOrderArray = [];
    
    // Currently selected sort criteria
    var sortCriteria = "sortByCustomer";
    
    // Holds list of preloaded translations for work order list item template.
    var workOrderItemTranslations = {};
    
    // Currently selected guided search
    var currentlySelectedGuidedSearchItem = null;

    /**
     * After the work order list page loads, ask technician about
     * posting work orders to the middle tier.
     */
    $(window).load( function( event ) {
        var workOrdersToPost = JSONData.getWorkOrdersRequiringPostToMiddleTier();
        if ( workOrdersToPost.length > 0 ) {
            JSONData.postWorkOrders( workOrdersToPost, function() {
                debug && console.log( "WorkOrderList.window.load: Repopulating list views after postWorkOrders" );
                populateListViews( getWorkOrders(), false );
            });
        }
    });
    
    /**
     * Get the list of work orders, completed and rejected work orders are not returned
     * @returns Array of work orders
     */
    function getWorkOrders() {
        workOrderArray = _.filter( JSONData.getObjectsByDataType( "workOrders" ), function( workOrderInList ) {
            return ( workOrderInList.workOrderSegments[0].webStatus != JSONData.WORK_ORDER_STATUS_COMPLETED &&
                     workOrderInList.workOrderSegments[0].webStatus != JSONData.WORK_ORDER_STATUS_REJECTED );
        });
        return workOrderArray;
    }
    
    /**
     * This function is called by JSONData.periodicJSONUpdateComplete() when
     * a periodic JSON feed update is complete.  It allows this page to
     * to update the work order list when needed.
     */
    function periodicJSONFeedUpdateCompleteFn() {
        debug && console.log( "WorkOrders.periodicJSONFeedUpdateCompleteFn: Periodic JSON update complete" );
        UIFrame.closeActiveDialog();
        if ( JSONData.getNumWorkOrdersSavedDuringLastUpdate() > 0 ) {
            debug && console.log( "WorkOrderList.periodicJSONFeedUpdateCompleteFn: Repopulating work order list with updated work orders" );
            customerArray   = JSONData.getObjectsByDataType( "customers" );
            pmScheduleArray = JSONData.getObjectsByDataType( "pmSchedules" ); 
            workOrderArray = getWorkOrders();
            populateListViews( null, false );
        } else {
            debug && console.log( "WorkOrderList.periodicJSONFeedUpdateCompleteFn: Repopulating work order list skipped because no work orders were saved" );
        }
    }

    /**
     * Initialization
     */
    var init = _.once( function( pageId ) {
        debug && console.log( "WorkOrderList.init: Getting all SQLite data before populating page" );
            
        // Set the periodic JSON feed update complete function for this page
        JSONData.setPageSpecificPeriodicUpdateCompleteFn( periodicJSONFeedUpdateCompleteFn );
        
        // Preload work order list item translations
        workOrderItemTranslations.jobCodeLabel   = Localization.getText( "jobCodeLabel" );
        workOrderItemTranslations.phoneExtension = Localization.getText( "phoneExtension" );
        workOrderItemTranslations.open           = Localization.getText( "open" );
        workOrderItemTranslations.openedOn       = Localization.getText( "openedOn" );
        
        // Preload customers, work orders and pm schedules
        customerArray   = JSONData.getObjectsByDataType( "customers" );
        pmScheduleArray = JSONData.getObjectsByDataType( "pmSchedules" ); 
        workOrderArray  = getWorkOrders();
            
        // Populate the work order list
        WorkOrderList.populateListViews( null, false );
        
        // Adjust the style for the search form that appears at the top of the
        // work order list
        var workOrderListSearchFormStyle = {
            'margin-left'  : '0px',
            'margin-right' : '0px',
            'margin-top'   : '0px',
            'border-style' : 'none'
        };
        $(".ui-listview-filter").css( workOrderListSearchFormStyle );

        // Remove the customerId from localstorage if coming back from customer equipment page
        if( window.localStorage.getItem( "customerId" ) != "" ) {
            window.localStorage.removeItem( "customerId" );
        }
        
        // Tapping on refresh will manually start the periodic JSON feed update
        $( "#refresh" ).click( function() {
            // Performing a manual refresh displays a progress dialog
            Dialog.showPleaseWait( Localization.getText( "manualJSONFeedRefreshTitle" ),
                                   Localization.getText( "manualJSONFeedRefreshProgress" ), "400px" );
            JSONData.getPeriodicJSONFeedUpdates( true );
        });
        
        // This MUST be the last line inside each page specific init function
        UIFrame.postPageSpecificInit( pageId );
    });

    /**
     * Populate the work order list
     * @param workOrderList - Work order list used to populate the list views.  If undefined,
     *                        all available work orders are used.
     * @param repopulatingList - If false, the guided search list view is also populated (default).
     *                           If true, the guided search list is left as is.                       
     */
    function populateListViews( workOrderList, repopulatingList ) {
        debug && console.log( "WorkOrders.populateListViews: Populating the work order list" );
        if ( repopulatingList === undefined ) {
            repopulatingList = false;
        }
        
        // If not repopulating the list, remove all existing items from the guided search list
        // and add the customers divider
        if ( !repopulatingList ) {
            $('#guidedSearchList').children('li').remove();
            UIFrame.addGuidedSearchDivider( Localization.getText( "customers" ) );
        }
        
        // Remove all existing items from the work order list
        var workOrderListElement = $('#workOrderList');
        workOrderListElement.children('li').remove();
        
        if ( workOrderList && workOrderList.length >= 0 ) {
            workOrders = workOrderList;
        } else {
            workOrders = workOrderArray;
        }
        sortWorkOrders();

        // This will be used to set up guided search based on work order status
        var workOrderStatusCounts = {};
        for ( var currentStatusIndex in JSONData.VALID_WORK_ORDER_STATUSES ) {
            workOrderStatusCounts[JSONData.VALID_WORK_ORDER_STATUSES[currentStatusIndex].webStatus] = 0;
        }
        
        debug && console.log( "WorkOrders.populateWorkOrderList: " + workOrders.length + " workorders found." );
        var currentCustomer = null,
            currentCustomerId = null,
            currentCustomerWorkOrderCount = 0,
            currentCustomerAddress = null,
            currentCustomerMainContact = null,
            currentCustomerMainCommDetail = null,
            currentWorkOrder = null,
            pmsDueCount = 0,
            workOrderCount = 0,
            workOrderItemTemplate        = new EJS({url: 'templates/workorderlistitem'}),
            workOrderListDividerTemplate = new EJS({url: 'templates/workorderlistdivider'}),
            workOrderNumbers = [],
            now = new Date();
        	var pmDateCutoff = new Date( now.getFullYear(), now.getMonth() + 1, 0 ).getTime() - ( 1000 * 60 * 60 * 24 );
        
        for ( var workOrder in workOrders ) {
            currentWorkOrder = workOrders[workOrder];
            
            // Update work order status count
            workOrderStatusCounts[currentWorkOrder.workOrderSegments[0].webStatus]++;
            
            // Rejected work orders are not displayed
            if ( currentWorkOrder.workOrderSegments[0].webStatus == JSONData.WORK_ORDER_STATUS_REJECTED ) {
                continue;
            }
            currentCustomerWorkOrderCount++;
            workOrderNumbers.push( currentWorkOrder.documentNumber );
            
            // New customer?
            if ( currentCustomerId === null || currentCustomerId != currentWorkOrder.customerId ) {
                currentCustomer = JSONData.getObjectFromArrayById( customerArray, currentWorkOrder.customerId );

                // Customer information needed by the work order item template
                if ( currentCustomer.addresses ) {
                    if ( currentCustomer.mainAddressId ) {
                        currentCustomerAddress = JSONData.getObjectFromArrayById( currentCustomer.addresses, currentCustomer.mainAddressId );
                    } else {
                        currentCustomerAddress = currentCustomer.addresses[0];
                    }
                }
                if ( currentCustomer.contacts && currentCustomer.mainContactId ) {
                    currentCustomerMainContact = JSONData.getObjectFromArrayById( currentCustomer.contacts, currentCustomer.mainContactId );
                }
                if ( currentCustomerAddress.communicationDetails && currentCustomerAddress.communicationDetails.length > 0 ) {
                    currentCustomerMainCommDetail = JSONData.getMainCommunicationDetails( currentCustomerAddress.communicationDetails );
                }
                
                // Add a list divider when the customer ID changes and the sort order
                // is not by customer
                if ( sortCriteria == "sortByCustomer" ) {
                    workOrderListElement.append( workOrderListDividerTemplate.render( {
                        customer : currentCustomer
                    }));
                }

                // Add a guided search item when the customer ID changes
                if ( !repopulatingList ) {
                    UIFrame.addGuidedSearchItem( currentCustomer.name, "customer" + currentCustomer.webId );
                }
                
                // Update the item counts for the current customer 
                if ( currentCustomerId !== null ) {
                    UIFrame.updateListDividerItemCount( currentCustomerId, currentCustomerWorkOrderCount );
                    if ( !repopulatingList ) {
                        UIFrame.updateGuidedSearchItemCount( "customer" + currentCustomerId, currentCustomerWorkOrderCount );
                    }
                }
                
                currentCustomerId = currentCustomer.webId;
                currentCustomerWorkOrderCount = 0;
                
                // Get the number of work orders and PMs due for the current customer
                workOrderCount = _.filter( workOrderArray, function( workOrderFromList ) {
                    return workOrderFromList.customerId == currentCustomerId &&
                           workOrderFromList.workOrderSegments[0].webStatus != JSONData.WORK_ORDER_STATUS_REJECTED &&
                           workOrderFromList.workOrderSegments[0].webStatus != JSONData.WORK_ORDER_STATUS_COMPLETED;
                }).length;
                pmsDueCount = _.filter( pmScheduleArray, function ( pmScheduleInList ) {
                	return ( new Date( pmScheduleInList.dateSchedule ).getTime() <= pmDateCutoff ) && pmScheduleInList.customerId == currentCustomerId;
                }).length;
            }
            // Add the work order to the list
            debug && console.log( "WorkOrders.populateListViews: Adding work order list item" );
            workOrderListElement.append( workOrderItemTemplate.render( {
                workOrder : currentWorkOrder,
                customer : currentCustomer,
                address : currentCustomerAddress,
                contact : currentCustomerMainContact,
                communicationDetail : currentCustomerMainCommDetail,
                workOrderCount : Localization.formatNumber( workOrderCount, "n0" ),
                pmsDueCount : Localization.formatNumber( pmsDueCount, "n0" ),
                workOrderItemTranslations : workOrderItemTranslations
            }));
        }
        
        // Update the list divider and guided search counts
        UIFrame.updateListDividerItemCount( currentCustomerId, currentCustomerWorkOrderCount + 1 );
        if ( !repopulatingList ) {
            UIFrame.updateGuidedSearchItemCount( "customer" + currentCustomerId, currentCustomerWorkOrderCount + 1 );
        }
        
        // Refresh the work order item list so that it is themed correctly
        workOrderListElement.listview('refresh');

        // Tapping a work order item displays the work order actions menu
        $('.work-order-list-item').click( openWorkOrderActions );

        if ( !repopulatingList ) {
            // Add work order statuses to guided search
            UIFrame.addGuidedSearchDivider( Localization.getText( "status" ) );
            var currentWorkOrderStatus = null;
            for ( var workOrderStatus in JSONData.VALID_WORK_ORDER_STATUSES ) {
                currentWorkOrderStatus = JSONData.VALID_WORK_ORDER_STATUSES[workOrderStatus];
                // Rejected status is not displayed inside guided search.
                if ( currentWorkOrderStatus.id == "rejectedStatus" || currentWorkOrderStatus.id == "completedStatus" ) {
                    continue;
                }
                UIFrame.addGuidedSearchItemWithIcon( Localization.getText( currentWorkOrderStatus.id ),
                        currentWorkOrderStatus.icon, 
                        currentWorkOrderStatus.id, workOrderStatusCounts[currentWorkOrderStatus.webStatus] );
            }
            
            // Refresh the guided search list
            UIFrame.refreshGuidedSearch();
            
            var initFilter = window.localStorage.getItem( "workOrderFilter" );
            
            // If an initial list filter is found, invoke the populateListViews method after the list is filtered
            if( initFilter !== "" ) {
                UIFrame.initListFilter( JSONData.getObjectFromArrayById( workOrderArray, initFilter ).documentNumber );
                
                var filteredWorkOrders = _.filter( workOrderArray, function( workOrderInList ) {
                    return workOrderInList.webId == initFilter;
                });
                
                if ( filteredWorkOrders == null ) {
                    filteredWorkOrders = [];
                }
                
                var workOrderGuidedSearchItem = "#" + JSONData.getObjectFromArrayById( workOrderArray, initFilter ).documentNumber;
                populateListViews( filteredWorkOrders, true );
                UIFrame.changeListFilter( "" );
                UIFrame.refreshGuidedSearchWithSelectedItem( workOrderGuidedSearchItem, clearGuidedSearch );
            }
            
            // Bind the guided search click handler
            UIFrame.bindGuidedSearchClickHandler( guidedSearchClickHandler );
            // Bind the sort on change handler
            $("#sortList").change( sortChangeHandler );
        }

        // Toggle new work order banner
        toggleNewWorkOrderBanner( _.any( workOrderArray, function( workOrderInList ) {
            return workOrderInList.workOrderSegments[0].webStatus == JSONData.WORK_ORDER_STATUS_DISPATCHED;
        }));
        
        // Update toolbox icon count
        UIFrame.updateToolboxCountBadge( workOrderStatusCounts[JSONData.WORK_ORDER_STATUS_DISPATCHED] );
        
        // Re-apply guided search selection
        if ( !repopulatingList && currentlySelectedGuidedSearchItem ) { 
            $(currentlySelectedGuidedSearchItem).click();
        }
        
        if ( repopulatingList ) {
            UIFrame.adjustListViewBorders();
        }
    }
    
    /**
     * Guided search click handler for the work orders list page
     */
    function guidedSearchClickHandler() {
        
        debug && console.log( "WorkOrderList.guidedSearchClickHandler" );

        var filteredWorkOrders = null;
        if ( this.id.indexOf( "Status" ) != -1 ) {
            // Filter by work order status
            var selectedStatus = this.id;
            debug && console.log( "WorkOrderList.guidedSearchClickHandler: Filtering work orders using status: " + selectedStatus );
            // Get the webStatus value for the selected guided search status and filter
            // the work orders using this value
            var webStatus = _.find( JSONData.VALID_WORK_ORDER_STATUSES, function( currentStatus ) {
                return currentStatus.id == selectedStatus;
            }).webStatus;
            filteredWorkOrders = _.filter( workOrderArray, function( currentWorkOrder ) {
                return JSONData.getWorkOrderStatus( currentWorkOrder ) == webStatus;
            });
        } else if ( this.id.indexOf( "customer" ) == 0 ) {
            // Filter by customer
            var customerId = this.id.match( /customer(\d+)/ )[1];
            debug && console.log( "WorkOrderList.guidedSearchClickHandler: Filtering work orders using customer Id: " + customerId ); 
            filteredWorkOrders = _.filter( workOrderArray, function( currentWorkOrder ) {
                return currentWorkOrder.customerId == customerId;
            });
        } else {
            // Filter by work order number
            var workOrderNumber = this.id;
            debug && console.log( "WorkOrderList.guidedSearchClickHandler: Filtering work orders using work order number: " + workOrderNumber );
            filteredWorkOrders = _.filter( workOrderArray, function( currentWorkOrder ) {
                return currentWorkOrder.documentNumber == workOrderNumber;
            });
        }
        if ( filteredWorkOrders == null ) {
            filteredWorkOrders = [];
        }

        // Clear the currently selected guided search before repopulating list to 
        // prevent this method from being called repeatedly
        currentlySelectedGuidedSearchItem = null;
        
        populateListViews( filteredWorkOrders, true );
        
        // Save the currently selected guided search.
        currentlySelectedGuidedSearchItem = "#" + this.id;
        
        UIFrame.changeListFilter( "" );
        UIFrame.refreshGuidedSearchWithSelectedItem( this, clearGuidedSearch );
    }
    
    /**
     * Guided search click handler for work orders resets the list views
     * after filtering the work orders by status
     * @param event - click event    
     */
    function clearGuidedSearch( event ) {
        // These two calls must be the first two lines in all custom clear handlers
        event.preventDefault();
        event.stopPropagation();
        debug && console.log( "WorkOrderList.clearGuidedSearch: Resetting work order list views" );
        currentlySelectedGuidedSearchItem = null;
        populateListViews( null, true );
        UIFrame.resetGuidedSearch( this );
    }
    
    /**
     * Handle the sort change event
     */
    function sortChangeHandler() {
        debug && console.log( "WorkOrderList.sortChangeHandler: Changing sort criteria to " + this.value );
        sortCriteria = this.value;
        populateListViews( workOrders, true );
    }
    
    /**
     * Sort the work order list.  Sort by customer name is the default criteria
     */
    function sortWorkOrders() {
        var sortedList = null;
        switch ( sortCriteria ) {
            case "sortByOldest" :
                debug && console.log( "WorkOrderList.sortList: Sorting by oldest" );
                sortedList = _.sortBy( workOrders, function( workOrderInList ) {
                    return new Date( workOrderInList.workOrderSegments[0].dateOpened ).getTime();
                });
                break;
            case "sortByNewest" :
                debug && console.log( "WorkOrderList.sortList: Sorting by newest" );
                sortedList = _.sortBy( workOrders, function( workOrderInList ) {
                    // Negating the time value sorts the list in descending order
                    return -(new Date( workOrderInList.workOrderSegments[0].dateOpened ).getTime());
                });
                break;
            case "sortByNumber" :
                debug && console.log( "WorkOrderList.sortList: Sorting by number" );
                sortedList = _.sortBy( workOrders, function( workOrderInList ) {
                    return workOrderInList.documentNumber;
                });
                break;
            // Sort by customer is the default
            default:
                debug && console.log( "WorkOrderList.sortList: Sorting by customer name" );
                sortedList = _.sortBy( workOrders, function( workOrderInList ) {
                    var customer = JSONData.getObjectFromArrayById( customerArray, workOrderInList.customerId );
                    return ( customer.name + customer.webId );
                });
                break;
        }
        workOrders = sortedList;
    }

    /**
     * Open manage work order UI for the specified work order
     * @param arguments - Array containing the following:
     *               [0] - Work order ID, manage work order pages will display this work order
     *               [1] - Read only boolean. When true, the manage work order pages will be in read only mode,
     *                     when false, the manage work order pages will allow the work
     *                     order to be changed.
     */
    function openManageWorkOrder() {
        if ( !arguments || arguments.length != 2 ) {
            throw "WorkOrderList.openManageWorkOrder: arguments is undefined or is not a 2 element array";
        }
        var workOrderId = arguments[0];
        var readOnly = arguments[1];
        
        // Manage work order ID is used by manage work order pages to display
        // the correct work order
        JSONData.setManageWorkOrderId( workOrderId );
        
        // Set manage work order writable flag based on how manage work order is being opened
        JSONData.setManageWorkOrderWritable( !readOnly );

        debug && console.log( "WorkOrderList.openManageWorkOrder: Opening manage work order ID: " + workOrderId );
        UIFrame.navigateToPage( "manageworkorderoverview.html" );
    }

    /**
     * Refresh the work order list page.
     */
    function refreshPage() {
        debug && console.log( "WorkOrderList.refreshPage: Refreshing the page" );
        // Update the toolbox icon count
        UIFrame.updateToolboxCountBadge();
        // Reassigning a work order requires us to refresh the work order array
        workOrderArray = getWorkOrders();
        populateListViews( null, false );
    }

    
    /**
     * Accept a work order by changing its status from dispatched to not started
     */
    function acceptWorkOrder( workOrderId ) {
        var workOrder = JSONData.getObjectFromArrayById( workOrderArray, workOrderId );
        debug && console.log( "WorkOrderList.acceptWorkOrder: Accepting work order " + workOrder.documentNumber );
        var workOrder = JSONData.getObjectById( "workOrders", workOrderId );
        workOrder.workOrderSegments[0].webStatus = JSONData.WORK_ORDER_STATUS_NOT_STARTED;
        workOrder.postToMiddleTierRequired = true;
        JSONData.saveJSON( "workOrders", workOrder );
        if ( Util.isOnline() ) {
            debug && console.log( "WorkOrderList.acceptWorkOrder: Posting work order acceptance to middle tier." ); 
            JSONData.postWorkOrder( workOrder, true, false,
                function() {
                    debug && console.log( "WorkOrderList.acceptWorkOrder: Posting work order acceptance successful." );
                    refreshPage();
                },
                function() {
                    // FIXME: Should mobile app continue with acceptance if post failed?
                    console.error( "WorkOrderList.acceptWorkOrder: Posting work order acceptance failed." );
                    refreshPage();
                }
            );
        } else {
            debug && console.log( "WorkOrderList.acceptWorkOrder: App is offline. Posting work order acceptance to middle tier skipped." );
            refreshPage();
        }
    }
    
    /**
     * Reassign a work order.  This sets the status to rejected and saves
     * the reason.
     * @param workOrder - Work order being reassigned
     * @param reason - Reassignment reason
     */
    function reassignWorkOrder( workOrder, reason ) {
        if ( !workOrder || !reason ) {
           throw "WorkOrderList.reassignWorkOrder: One or more required parameters (workOrder, reason) are null or undefined";
        }
        // Set the status to rejected
        workOrder.workOrderSegments[0].webStatus = JSONData.WORK_ORDER_STATUS_REJECTED;

        // If the work order being reassigned is the current one, clear
        // the current work order and set the technician's status to logged in.
        var currentWorkOrder = JSONData.getCurrentWorkOrder();
        if ( currentWorkOrder && currentWorkOrder.webId == workOrder.webId ) {
            // Clear the current work order local storage location
            JSONData.removeCurrentWorkOrderId();
            // Update the work order status area in the footer
            UIFrame.updateCurrentWorkOrderStatus();
            // Set technician status to logged in
            JSONData.saveClockingStatus( 'technicianStatusLoggedIn', Util.getISOCurrentTime() );
        }
        
        // Save the reason
        // TODO: Which JSON property is used to save the reason?
        // Save the updated JSON
        workOrder.postToMiddleTierRequired = true;
        JSONData.saveJSON( "workOrders", workOrder );
        if ( Util.isOnline() ) {
            JSONData.postWorkOrder( workOrder, true, false,
                function() {
                    debug && console.log( "WorkOrderList.reassignWorkOrder: Reassignment post to middle tier successful" );
                    refreshPage();
                },
                function() {
                    // FIXME: What should mobile app do if reassignment post to middle tier fails?
                    console.error( "WorkOrderList.reassignWorkOrder: Reassignment post to middle tier failed" );
                    refreshPage();
                }
            );
        } else {
            debug && console.log( "WorkOrderList.reassignWorkOrder: App is offline. Reassignment post to middle tier skipped." );
            refreshPage();
        }
    }
    
    /**
     * Display the reassign work order dialog.  This allows the technician to enter a reassignment reason.
     * @param workOrderId - ID of work order being reassigned.
     */
    function displayReassignWorkOrderDialog( workOrderId ) {
        if ( !workOrderId ) {
            throw "WorkOrderList.displayReassignWorkOrderDialog: Required parameter workOrderId is undefined";
        }
        var workOrder = JSONData.getObjectFromArrayById( workOrderArray, workOrderId );
        var customer  = JSONData.getObjectFromArrayById( customerArray, workOrder.customerId );
        var equipment = workOrder.workOrderSegments[0].equipment;
        debug && console.log( "WorkOrderList.displayReassignWorkOrderDialog: Reassigning work order " + workOrder.documentNumber );
        var dialogHtml = new EJS({url: 'templates/reassignworkorderdialog'}).render( {
            workOrder: workOrder,
            customer: customer,
            equipment: equipment
        });
        $(document).simpledialog2({
            mode : 'blank',
            width : '500px',
            blankContent : dialogHtml
        });
    }
    
    /**
     * Open a work order
     */
    function openWorkOrder( workOrderId ) {
        var workOrder = JSONData.getObjectFromArrayById( workOrderArray, workOrderId );
        debug && console.log( "WorkOrderList.openWorkOrder: Opening work order " + workOrder.documentNumber );

        // Changing the clocking status when opening a work order
        // requires the ID of the work order being opened
        JSONData.setWorkOrderIdForClockingChange( workOrderId );
        
        // Opening any work order requires that the work order be sent to the middle tier
        JSONData.saveJSON( "workOrders", workOrder );
        
        // Change the clocking status if technician is currently non productive
        // or is productive or traveling and is switching work orders
        var currentClockingStatus = JSONData.getCurrentClockingStatus( null );
        if (( currentClockingStatus != "technicianStatusProductive" && currentClockingStatus != "technicianStatusTraveling" ) || 
             (( currentClockingStatus == "technicianStatusProductive" || currentClockingStatus == "technicianStatusTraveling" ) &&
                 workOrderId != JSONData.getCurrentWorkOrderId() )) {
        	
            var openManageWorkOrderArgs = [];
            openManageWorkOrderArgs[0] = workOrderId;
            openManageWorkOrderArgs[1] = false;
            JSONData.changeClockingStatus( "technicianStatusProductive", openManageWorkOrder, openManageWorkOrderArgs );
        } else {
            // Otherwise, open the manage work order UI
            openManageWorkOrder( workOrderId, false );
        }
    }
    
    /**
     * View a work order
     */
    function viewWorkOrder( workOrderId ) {
        var workOrder = JSONData.getObjectFromArrayById( workOrderArray, workOrderId );
        debug && console.log( "WorkOrderList.viewWorkOrder: Viewing work order " + workOrder.documentNumber );
        JSONData.setManageWorkOrderId( workOrderId );
        JSONData.setManageWorkOrderWritable( JSONData.getCurrentWorkOrderId() == workOrderId );
        UIFrame.navigateToPage( "manageworkorderoverview.html" );
    }
    
    /**
     * Open a list of actions for the work order. This method is called when the user taps and holds on a work order item. this
     * object contains the HTML LI element for the work order.
     */
    function openWorkOrderActions() {
        // Build and display the work order actions popup menu
        var workOrder = JSONData.getObjectFromArrayById( workOrderArray, this.id );
        debug && console.log( "WorkOrderList.openWorkOrderActions: Display actions for work order: " + workOrder.documentNumber );
        var popupMenuTemplate = null;
        
        // Popup menu is different for new work orders
        if ( JSONData.isNewWorkOrder( workOrder ) ) {
            popupMenuTemplate = "newworkorderpopupmenu";
        } else if ( workOrder.workOrderSegments[0].webStatus == JSONData.WORK_ORDER_STATUS_COMPLETED ) {
            // Completed work orders can be viewed only
            viewWorkOrder( workOrder.webId );
        } else {
            popupMenuTemplate = "acceptedworkorderpopupmenu";
        }
        var popupMenuHtml = new EJS({url: 'templates/' + popupMenuTemplate}).render( {
            workOrder : workOrder
        });
        $(document).simpledialog2({
            mode : 'blank',
            width: '350px',
            blankContent : popupMenuHtml,
            headerText: workOrder.documentNumber
        });
        
    }
    
    /**
     * Toggle the new work order banner based on the presence of new work orders
     */
    function toggleNewWorkOrderBanner( showBanner ) {
        if ( showBanner ) {
            $("#workOrderListNewBanner").show();
        } else {
            $("#workOrderListNewBanner").hide();
        }
    }
    
    return {
        'acceptWorkOrder'                   : acceptWorkOrder,
        'displayReassignWorkOrderDialog'    : displayReassignWorkOrderDialog,
        'getWorkOrders'                     : getWorkOrders,
        'init'                              : init,
        'openManageWorkOrder'               : openManageWorkOrder,
        'openWorkOrder'                     : openWorkOrder,
        'populateListViews'                 : populateListViews,
        'reassignWorkOrder'                 : reassignWorkOrder,
        'viewWorkOrder'                     : viewWorkOrder
    };
}();

/**
 * pageinit handler for the work order list page
 */
$("div:jqmData(role='page')").on( "pageinit", function() {
    // All pages must set pageId to this.id
    var pageId = this.id;
    debug && console.log( "WorkOrderList.pageinit: Initializing " + pageId );
    
    // This MUST be called by every page specific pageinit event handler!
    UIFrame.init( pageId, function() {
        debug && console.log( "WorkOrderList.pageinit: Executing page specific init" );

        // Page initialization
        WorkOrderList.init( pageId );
    });
});

