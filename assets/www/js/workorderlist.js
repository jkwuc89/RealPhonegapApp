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

    // Current listview search text
    var LS_CURRENT_LISTVIEW_SEARCH_TEXT = "workOrderListSearchText";

    /**
     * Clear workOrderFilter that filters by work order number
     * when leaving the work order list page.
     */
    window.onbeforeunload = function() {
        window.localStorage.removeItem( JSONData.LS_INITIAL_WORK_ORDER_LIST_FILTER );
        window.localStorage.removeItem( LS_CURRENT_LISTVIEW_SEARCH_TEXT );
    };

    /**
     * After the PhoneGap deviceready event fires, run postLoadFn()
     */
    document.addEventListener( "deviceready", onDeviceReady, false );
    function onDeviceReady() {
        debug && console.log( "WorkOrderList.onDeviceReady: Running postLoadFn" );
        postLoadFn();
    }

    /**
     * After this page loads on Chrome Desktop, run postLoadFn()
     */
    $(window).load( function( event ) {
        if ( Util.isRunningOnChromeDesktop() ) {
            debug && console.log( "WorkOrderList.window.load: Running postLoadFn" );
            postLoadFn();
        } else {
            debug && console.log( "WorkOrderList.window.load: App running on tablet. postLoadFn skipped." );
        }
    });

    /**
     * This function is executed after the page loads on Chrome Desktop
     * or when the onDeviceReady event fires on the tablet.
     */
    function postLoadFn() {
        // Execute this load method for the work order list page only
        if ( UIFrame.getCurrentPageId() === "workOrderListPage" ) {
            debug && console.log( "WorkOrderList.postLoadFn: Running..." );
            // SFAM-177: Display alert if work order list page was opened after a JSON refresh
            // and the current work order was deleted.
            var deletedWorkOrder = window.localStorage.getItem( JSONData.LS_CURRENT_WORK_ORDER_DELETED );
            if ( deletedWorkOrder ) {
                UIFrame.updateCurrentWorkOrderStatus();
                Dialog.showAlert( Localization.getText( "currentWorkOrderDeletedTitle" ),
                                  Localization.getText( "currentWorkOrderDeletedPrompt" ).replace( "workOrder", deletedWorkOrder ),
                                  null, '400px' );
                window.localStorage.removeItem( JSONData.LS_CURRENT_WORK_ORDER_DELETED );
            }
            var workOrdersToPost = WorkOrder.getWorkOrdersRequiringPostToMiddleTier();
            if ( workOrdersToPost.length > 0 ) {
                WorkOrder.postWorkOrders( workOrdersToPost, function() {
                    debug && console.log( "WorkOrderList.postLoadFn: Repopulating list views after postWorkOrders" );
                    populateListViews( loadWorkOrders(), false );
                });
            }

            // Apply dispatched work order filter?
            if ( window.localStorage.getItem( UIFrame.LS_APPLY_DISPATCHED_WORKORDER_FILTER ) ) {
                window.localStorage.removeItem( UIFrame.LS_APPLY_DISPATCHED_WORKORDER_FILTER );
                $( "#dispatchedStatus" ).click();
            }

        } else {
            debug && console.log( "WorkOrderList.postLoadFn: Skipped because current page is not work order list page" );
        }
    }

    /**
     * Get the list of work orders, completed and rejected work orders are not returned
     * @returns Array of work orders
     */
    function loadWorkOrders() {
        debug && console.log( "WorkOrderList.loadWorkOrders: Loading work order array" );
        workOrderArray = _.filter( JSONData.getObjectsByDataType( "workOrders" ), function( workOrderInList ) {
            return ( workOrderInList.workOrderSegments[0].webStatus != WorkOrder.WORK_ORDER_STATUS_COMPLETED &&
                     workOrderInList.workOrderSegments[0].webStatus != WorkOrder.WORK_ORDER_STATUS_REJECTED );
        });
        return workOrderArray;
    }

    /**
     * Get the list of work orders, completed and rejected work orders are not returned
     * @returns Array of work orders
     */
    function loadCustomers() {
        customerArray = JSONData.getObjectsByDataType( "customers" );
        return customerArray;
    }

    /**
     * This function is called by JSONData.periodicJSONUpdateComplete() when
     * a periodic JSON feed update is complete.  It allows this page to
     * to update the work order list when needed.
     * @param dataType - String containing data type of feed that completed
     */
    function periodicJSONFeedUpdateCompleteFn( dataType ) {
        if ( dataType && dataType == "workOrders" ) {
            debug && console.log( "WorkOrders.periodicJSONFeedUpdateCompleteFn: Periodic JSON update complete" );
            if ( window.localStorage.getItem( JSONData.LS_JSON_FEED_UPDATE_MANUALLY_STARTED ) ) {
                Dialog.closeDialog( false );
            }
            if ( JSONData.getNumWorkOrdersSavedDuringLastUpdate() > 0 ) {
                debug && console.log( "WorkOrderList.periodicJSONFeedUpdateCompleteFn: Repopulating work order list with updated work orders" );
                customerArray   = loadCustomers();
                pmScheduleArray = JSONData.getObjectsByDataType( "pmSchedules" );
                workOrderArray = loadWorkOrders();
                populateListViews( null, false );
            } else {
                debug && console.log( "WorkOrderList.periodicJSONFeedUpdateCompleteFn: Repopulating work order list skipped because no work orders were saved" );
            }
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
        customerArray   = loadCustomers();
        pmScheduleArray = JSONData.getObjectsByDataType( "pmSchedules" );
        workOrderArray  = loadWorkOrders();

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
     * Save the currently entered listview search text
     */
    function saveListviewSearchText() {
        // Save the current listview search text so that it can be reapplied
        var currentSearchText = $("div.ui-input-search").children("input").val();
        if ( currentSearchText.length > 0 ) {
            debug && console.log( "WorkOrderList.refreshPage: Saving current listview search text: " + currentSearchText );
            window.localStorage.setItem( LS_CURRENT_LISTVIEW_SEARCH_TEXT, currentSearchText );
        }
    }

    /**
     * Apply the previously saved listview search text
     */
    function applySavedListviewSearchText() {
        var savedSearchText = window.localStorage.getItem( LS_CURRENT_LISTVIEW_SEARCH_TEXT );
        if ( savedSearchText ) {
            debug && console.log( "WorkOrders.populateListViews: Reapplying saved listview search text: " + savedSearchText );
            UIFrame.changeListFilter( savedSearchText );
            UIFrame.adjustListViewBorders();
            window.localStorage.removeItem( LS_CURRENT_LISTVIEW_SEARCH_TEXT );
        }
    }

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
        for ( var currentStatusIndex in WorkOrder.VALID_WORK_ORDER_STATUSES ) {
            workOrderStatusCounts[WorkOrder.VALID_WORK_ORDER_STATUSES[currentStatusIndex].webStatus] = 0;
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
            workOrderNumbers = [];

        for ( var workOrder in workOrders ) {
            currentWorkOrder = workOrders[workOrder];

            // Update work order status count
            workOrderStatusCounts[currentWorkOrder.workOrderSegments[0].webStatus]++;

            // Rejected work orders are not displayed
            if ( currentWorkOrder.workOrderSegments[0].webStatus == WorkOrder.WORK_ORDER_STATUS_REJECTED ) {
                continue;
            }
            currentCustomerWorkOrderCount++;
            workOrderNumbers.push( currentWorkOrder.documentNumber );

            // New customer?
            if ( currentCustomerId === null || currentCustomerId != currentWorkOrder.customerId ) {
                currentCustomer = JSONData.getObjectFromArrayById( customerArray, currentWorkOrder.customerId );

                // Customer information needed by the work order item template
                if ( currentCustomer ) {
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
                }

                // Update the item counts for the current customer
                if ( currentCustomerId !== null ) {
                    UIFrame.updateListDividerItemCount( currentCustomerId, currentCustomerWorkOrderCount );
                    if ( !repopulatingList ) {
                        UIFrame.updateGuidedSearchItemCount( "customer" + currentCustomerId, currentCustomerWorkOrderCount );
                    }
                }

                if ( currentCustomer ) {
                    currentCustomerId = currentCustomer.webId;
                }
                currentCustomerWorkOrderCount = 0;

                // Get the number of work orders and PMs due for the current customer
                workOrderCount = WorkOrder.getWorkOrderCountForCustomer( workOrderArray, currentCustomerId );
                pmsDueCount = JSONData.getPMCountForCustomer( pmScheduleArray, currentCustomerId, true );
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
            for ( var workOrderStatus in WorkOrder.VALID_WORK_ORDER_STATUSES ) {
                currentWorkOrderStatus = WorkOrder.VALID_WORK_ORDER_STATUSES[workOrderStatus];
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

            var initFilter = window.localStorage.getItem( JSONData.LS_INITIAL_WORK_ORDER_LIST_FILTER );

            // If an initial list filter is found, invoke the populateListViews method after the list is filtered
            if ( initFilter ) {
                var filteredWorkOrders = _.filter( workOrderArray, function( workOrderInList ) {
                    return ( workOrderInList.webId == initFilter ||
                             workOrderInList.clientReference == initFilter );
                });

                if ( filteredWorkOrders == null ) {
                    filteredWorkOrders = [];
                }
                populateListViews( filteredWorkOrders, true );
                UIFrame.changeListFilter( "" );
            }

            // Bind the guided search click handler
            UIFrame.bindGuidedSearchClickHandler( guidedSearchClickHandler );
            // Bind the sort on change handler
            $("#sortList").change( sortChangeHandler );
        }

        // Toggle new work order banner
        toggleNewWorkOrderBanner( _.any( workOrderArray, function( workOrderInList ) {
            return workOrderInList.workOrderSegments[0].webStatus == WorkOrder.WORK_ORDER_STATUS_DISPATCHED;
        }));

        // Update toolbox icon count
        UIFrame.updateToolboxCountBadge();

        // Re-apply guided search selection and listview search text
        if ( !repopulatingList ) {
            if ( currentlySelectedGuidedSearchItem ) {
                $(currentlySelectedGuidedSearchItem).click();
            } else {
                applySavedListviewSearchText();
            }
        }

        UIFrame.adjustListViewBorders();
    }

    /**
     * Guided search click handler for the work orders list page
     */
    function guidedSearchClickHandler() {

        debug && console.log( "WorkOrderList.guidedSearchClickHandler" );

        // Changing guided search selection clears the initial work order list filter
        window.localStorage.removeItem( JSONData.LS_INITIAL_WORK_ORDER_LIST_FILTER );

        var filteredWorkOrders = null;
        if ( this.id.indexOf( "Status" ) != -1 ) {
            // Filter by work order status
            var selectedStatus = this.id;
            debug && console.log( "WorkOrderList.guidedSearchClickHandler: Filtering work orders using status: " + selectedStatus );
            // Get the webStatus value for the selected guided search status and filter
            // the work orders using this value
            var webStatus = _.find( WorkOrder.VALID_WORK_ORDER_STATUSES, function( currentStatus ) {
                return currentStatus.id == selectedStatus;
            }).webStatus;
            filteredWorkOrders = _.filter( workOrderArray, function( currentWorkOrder ) {
                return WorkOrder.getWorkOrderStatus( currentWorkOrder ) == webStatus;
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

        applySavedListviewSearchText();

        // Adjust the list view borders after the guided search is applied
        UIFrame.adjustListViewBorders();
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
        // Clear the initial work order list filter
        window.localStorage.removeItem( JSONData.LS_INITIAL_WORK_ORDER_LIST_FILTER );
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
                    if ( customer ) {
                        return ( customer.name + customer.webId );
                    } else {
                        return workOrderInList.customerId;
                    }
                });
                break;
        }
        workOrders = sortedList;
    }

    /**
     * Open manage work order UI for the specified work order
     * arguments - Array passed in by JS containing the following:
     *             [0] - Work order ID, manage work order pages will display this work order
     *             [1] - Read only boolean. When true, the manage work order pages will be in read only mode,
     *                   when false, the manage work order pages will allow the work
     *                   order to be changed.
     *             [2] - Reopening boolean. When true, a work order is being reopened after being
     *                   signed by a technician
     */
    function openManageWorkOrder() {
        if ( !arguments || arguments.length < 2 ) {
            throw "WorkOrderList.openManageWorkOrder: arguments array is undefined or contains less than 2 arguments";
        }
        var workOrderId = arguments[0];
        var workOrder = JSONData.getObjectById( "workOrders", workOrderId, null );
        var readOnly = arguments[1];
        var reopening = false;
        if ( arguments.length === 3 ) {
            reopening = arguments[2];
        }

        // Manage work order ID is used by manage work order pages to display
        // the correct work order
        WorkOrder.setManageWorkOrderId( workOrderId );

        // Set manage work order writable flag based on how manage work order is being opened
        WorkOrder.setManageWorkOrderWritable( !readOnly );

        debug && console.log( "WorkOrderList.openManageWorkOrder: Opening manage work order ID: " + workOrderId );
        debug && console.log( "WorkOrderList.openManageWorkOrder: Reopening = " + reopening );

        // SFAM-230: If reopening a work order, clear the technician signature
        if ( !readOnly && reopening ) {
            debug && console.log( "WorkOrderList.openManageWorkOrder: Removing technician signature from work order " +
                                  workOrder.documentNumber );
            workOrder.workOrderSegments[0].technicianSignature = null;
            workOrder.postToMiddleTierRequired = true;
            WorkOrder.setManageWorkOrderWritable( true );
            JSONData.saveJSON( "workOrders", workOrder, true );
        }

        // If the current page is the overview page, reload it.
        // Otherwise, navigate to it.
        if ( UIFrame.getCurrentPage().id === "manageWorkOrderOverviewPage" ) {
            UIFrame.reloadCurrentPage();
        } else {
            UIFrame.navigateToPage( "manageworkorderoverview.html", false, null );
        }
    }

    /**
     * Refresh the current page.
     * @param reassignedWorkOrder - Was work order reassigned?
     */
    function refreshPage( reassignedWorkOrder ) {
        if ( UIFrame.getCurrentPage().id.indexOf( "manageWorkOrder" ) === 0 ) {
            // What we do with the current manage work order page depends upon the current work order status
            if ( reassignedWorkOrder ) {
                debug && console.log( "WorkOrderList.refreshPage: Navigating to work order list page after reassignment from manage work order" );
                UIFrame.navigateToPage( "workorderlist.html" );
            } else {
                debug && console.log( "WorkOrderList.refreshPage: Reloading current manage work order page" );
                UIFrame.reloadCurrentPage();
            }
        } else {
            debug && console.log( "WorkOrderList.refreshPage: Refreshing the work order list page" );
            // Update the toolbox icon count
            UIFrame.updateToolboxCountBadge();
            // Reassigning a work order requires us to refresh the work order array
            workOrderArray = loadWorkOrders();
            saveListviewSearchText();
            populateListViews( null, false );
        }
    }

    /**
     * Accept a work order by changing its status from dispatched to not started
     */
    function acceptWorkOrder( workOrderId ) {
        var dialog;
        // This function is called to change the work order to "not started" and post it to the MT
        var updateAndPostAcceptedWorkOrderFn = function( workOrderToUpdate ) {
            workOrderToUpdate.workOrderSegments[0].webStatus = WorkOrder.WORK_ORDER_STATUS_NOT_STARTED;
            workOrderToUpdate.postToMiddleTierRequired = true;
            JSONData.saveJSON( "workOrders", workOrderToUpdate, true );
            if ( Util.isOnline( false ) ) {
                debug && console.log( "WorkOrderList.acceptWorkOrder: Posting work order acceptance to middle tier." );
                WorkOrder.postWorkOrder( workOrderToUpdate, true, false,
                    function() {
                        debug && console.log( "WorkOrderList.acceptWorkOrder: Posting work order acceptance successful." );
                        refreshPage( false );
                    },
                    function() {
                        console.error( "WorkOrderList.acceptWorkOrder: Posting work order acceptance failed." );
                        refreshPage( false );
                    }
                );
            } else {
                debug && console.log( "WorkOrderList.acceptWorkOrder: App is offline. Posting work order acceptance to middle tier skipped." );
                refreshPage( false );
            }
        };
        var workOrder = JSONData.getObjectFromArrayById( workOrderArray, workOrderId );
        debug && console.log( "WorkOrderList.acceptWorkOrder: Accepting work order " + workOrder.documentNumber );

        // Version 1.0 of the mobile app does not support saving / posting an ETA
        if ( Config.getConfig().version.indexOf( "1.0" ) == -1 ) {
            // Display dialog that allows the technician to select the ETA date / time
            dialog = new EJS({ url: "templates/workorderetadialog" }).render({
                workOrderNumber : workOrder.documentNumber
            });

            Dialog.showDialog({
                blankContent : dialog,
                fullScreenForce: true,
                width: '600px',
                zindex: '1000'
            });

            // ETA date/time picker options
            var etaPickerOptions = {
                display: 'inline',
                minDate: new Date(),
                mode: 'scroller',
                preset: 'datetime',
                showLabel: false,
                theme: 'jqm'
            };
            $('#etaDateTime').scroller( etaPickerOptions );

            // Adjust the top position of the ETA dialog so that it displays correct
            // on top of long work order lists
            Dialog.moveDialogTop( "#workOrderETADialog", -125 );

            // Click handler for saving the ETA
            $('#saveETABtn').click( function() {
                workOrder.workOrderSegments[0].dateTimeETA = new Date( $('#etaDateTime').val() ).toISOString();
                updateAndPostAcceptedWorkOrderFn( workOrder );
            } );
        } else {
            updateAndPostAcceptedWorkOrderFn( workOrder );
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
        workOrder.workOrderSegments[0].webStatus = WorkOrder.WORK_ORDER_STATUS_REJECTED;

        // If the work order being reassigned is the current one, clear
        // the current work order and set the technician's status to logged in.
        var currentWorkOrder = WorkOrder.getCurrentWorkOrder();
        if ( currentWorkOrder && currentWorkOrder.webId == workOrder.webId ) {
            // Clear the current work order local storage location
            WorkOrder.removeCurrentWorkOrderId();
            // Update the work order status area in the footer
            UIFrame.updateCurrentWorkOrderStatus();
            // Set technician status to logged in
            JSONData.saveClockingStatus( 'technicianStatusLoggedIn', Util.getISOCurrentTime() );
        }

        // Save the reason inside the work order segment
        workOrder.workOrderSegments[0].rejectionReason = reason;

        // Save the updated JSON
        workOrder.postToMiddleTierRequired = true;
        JSONData.saveJSON( "workOrders", workOrder );
        if ( Util.isOnline() ) {
            WorkOrder.postWorkOrder( workOrder, true, false,
                function() {
                    debug && console.log( "WorkOrderList.reassignWorkOrder: Reassignment post to middle tier successful" );
                    refreshPage( true );
                },
                function() {
                    // FIXME: What should mobile app do if reassignment post to middle tier fails?
                    console.error( "WorkOrderList.reassignWorkOrder: Reassignment post to middle tier failed" );
                    refreshPage( true );
                }
            );
        } else {
            debug && console.log( "WorkOrderList.reassignWorkOrder: App is offline. Reassignment post to middle tier skipped." );
            refreshPage( true );
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
        Dialog.showDialog({
            mode : 'blank',
            width : '500px',
            blankContent : dialogHtml
        });
    }

    /**
     * Edit a work order.  Editing a work order does not change
     * the technician's clocking status
     * @param workOrderId - Number containing the webId of the work order to edit
     */
    function editWorkOrder( workOrderId ) {
        var workOrder = JSONData.getObjectFromArrayById( workOrderArray, workOrderId );
        debug && console.log( "WorkOrderList.editWorkOrder: Editing work order " + workOrder.documentNumber );
        // Editing the current work order if it's not signed by the tech is the same as opening it
        if ( workOrderId == WorkOrder.getCurrentWorkOrderId() &&
             !WorkOrder.isWorkOrderSignedByTechnician( workOrder ) ) {
            openWorkOrder( workOrderId, false );
        } else {
            // Editing a work order requires confirmation
            Dialog.showConfirmYesNo( Localization.getText( "editWorkOrder" ),
                                     Localization.getText( "editWorkOrderConfirm").replace( "workOrder", workOrder.documentNumber ),
                function() {
                    // Parts only work orders are opened using their own activity
                    if ( WorkOrder.isPartsOnlyWorkOrder( workOrder) ) {
                        WorkOrder.setManageWorkOrderActivity( WorkOrder.MANAGE_WORK_ORDER_OPEN_NOCLOCKING );
                    } else {
                        WorkOrder.setManageWorkOrderActivity( WorkOrder.MANAGE_WORK_ORDER_EDIT );
                    }
                    openManageWorkOrder( workOrderId, false );
                }, null, "400px" );
        }
    }

    /**
     * Open a work order
     * @param workOrderId - webId of work order to open
     * @param reopening - Is work order being reopened after collecting technician signature?
     *                    Optional, defaults to false.
     */
    function openWorkOrder( workOrderId, reopening ) {
        var workOrder = JSONData.getObjectFromArrayById( workOrderArray, workOrderId );
        if ( _.isUndefined( reopening ) || _.isNull( reopening ) ) {
            reopening = false;
        }
        debug && console.log( "WorkOrderList.openWorkOrder: Opening work order " + workOrder.documentNumber );
        debug && console.log( "WorkOrderList.openWorkOrder: Reopening = " + reopening );
        WorkOrder.setManageWorkOrderActivity( WorkOrder.MANAGE_WORK_ORDER_OPEN );

        // Changing the clocking status when opening a work order
        // requires the ID of the work order being opened
        JSONData.setWorkOrderIdForClockingChange( workOrderId );

        // Opening any work order requires that the work order be sent to the middle tier
        JSONData.saveJSON( "workOrders", workOrder, true );

        // Change the clocking status if technician is currently non productive
        // or is productive or traveling and is switching work orders
        var currentClockingStatus = JSONData.getCurrentClockingStatus( null );
        if (
             ( currentClockingStatus != "technicianStatusProductive" &&
               currentClockingStatus != "technicianStatusProductiveOrderApproval" &&
               currentClockingStatus != "technicianStatusTraveling"
             ) ||
             ( ( currentClockingStatus == "technicianStatusProductive" ||
                 currentClockingStatus == "technicianStatusProductiveOrderApproval" ||
                 currentClockingStatus == "technicianStatusTraveling" ) &&
               ( workOrderId != WorkOrder.getCurrentWorkOrderId() || reopening )
             )
           ) {

            var openManageWorkOrderArgs = [];
            openManageWorkOrderArgs[0] = workOrderId;
            openManageWorkOrderArgs[1] = false;
            openManageWorkOrderArgs[2] = reopening;
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
        WorkOrder.setManageWorkOrderId( workOrderId );
        WorkOrder.setManageWorkOrderWritable( WorkOrder.getCurrentWorkOrderId() == workOrderId );
        WorkOrder.setManageWorkOrderActivity( WorkOrder.MANAGE_WORK_ORDER_VIEW );
        UIFrame.navigateToPage( "manageworkorderoverview.html" );
    }

    /**
     * Open a list of actions for the work order. This method is called when the user taps and holds on a work order item. this
     * object contains the HTML LI element for the work order.
     * @param workOrder - Work order to use for action selection.  If null or undefined,
     *                    this.id is used to load it.  this.id is set by the work order list item
     *                    click handler.
     */
    function openWorkOrderActions( workOrder ) {
        var currentActivity = WorkOrder.getManageWorkOrderActivity();
        // Work order list item click handler will pass an event object to this method.
        // Manage work order will pass a work order object.  Check for that difference here.
        if ( _.isUndefined( workOrder.webId ) && _.isUndefined( workOrder.workOrderSegments ) ) {
            workOrder = JSONData.getObjectFromArrayById( workOrderArray, this.id );
        }

        // Build and display the work order actions popup menu
        debug && console.log( "WorkOrderList.openWorkOrderActions: Display actions for work order: " + workOrder.documentNumber );
        var popupMenuTemplate = null;

        // Popup menu is different for new work orders
        if ( WorkOrder.isNewWorkOrder( workOrder ) ) {
            popupMenuTemplate = "newworkorderpopupmenu";
        } else if ( workOrder.workOrderSegments[0].webStatus == WorkOrder.WORK_ORDER_STATUS_COMPLETED ) {
            // Completed work orders can be viewed only
            viewWorkOrder( workOrder.webId );
        } else {
            popupMenuTemplate = "acceptedworkorderpopupmenu";
        }
        var popupMenuHtml = new EJS({url: 'templates/' + popupMenuTemplate}).render( {
            workOrder : workOrder
        });
        Dialog.showDialog({
            mode : 'blank',
            width: '350px',
            blankContent : popupMenuHtml,
            headerText: workOrder.documentNumber
        });

        // Remove open choice if work order is parts only.
        // Until MT supports partsOnly property, we much check notesTop too
        if ( WorkOrder.isPartsOnlyWorkOrder( workOrder ) ) {
            $("#openWorkOrder").remove();
        }

        // If the actions menu was opened from one of the manage work order pages...
        if ( UIFrame.getCurrentPage().id.indexOf( "manageWorkOrder" ) === 0 ) {
            if ( WorkOrder.isNewWorkOrder( workOrder ) ) {
                // Remove the open choice and the edit choice if the work order is new
                $("#openWorkOrder").remove();
                $("#editWorkOrder").remove();
            } else {
                // Remove the accept choice if the work order is not new
                $("#acceptWorkOrder").remove();
            }
            // Remove the view choice
            $("#viewWorkOrder").remove();

            // Remove the edit choice if the work order is already being edited
            if ( currentActivity == WorkOrder.MANAGE_WORK_ORDER_EDIT ||
                 currentActivity == WorkOrder.MANAGE_WORK_ORDER_OPEN_NOCLOCKING ) {
                $("#editWorkOrder").remove();
            }

            if ( WorkOrder.getCurrentWorkOrderId() === WorkOrder.getManageWorkOrderId() ) {
                // Remove the open if current work order is the one being managed
                $("#openWorkOrder").remove();
                // Remove the edit choice if current work order is not signed by the tech.
                // If it is signed by the tech, editing the work order is OK
                if ( !WorkOrder.isWorkOrderSignedByTechnician( workOrder ) ) {
                    $("#editWorkOrder").remove();
                }
                // If the current work order is not signed by the technician, remove the reopen choice
                if ( !WorkOrder.isWorkOrderSignedByTechnician( workOrder ) ) {
                    $("#reopenWorkOrder").remove();
                }
            } else {
                // Remove the reopen choice if the current work order does not match
                // the one being managed.
                $("#reopenWorkOrder").remove();
            }
        } else {
            // Changes to Actions menu when it is displayed on the work order list page
            // Remove reopen item
            $("#reopenWorkOrder").remove();
            // Remote edit and view items when current work order ID matches work order that was tapped
            if ( workOrder.webId == WorkOrder.getCurrentWorkOrderId() ) {
                $("#editWorkOrder").remove();
                $("#viewWorkOrder").remove();
            }
        }
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
        'editWorkOrder'                     : editWorkOrder,
        'init'                              : init,
        'loadCustomers'                     : loadCustomers,
        'loadWorkOrders'                    : loadWorkOrders,
        'openManageWorkOrder'               : openManageWorkOrder,
        'openWorkOrder'                     : openWorkOrder,
        'openWorkOrderActions'              : openWorkOrderActions,
        'populateListViews'                 : populateListViews,
        'reassignWorkOrder'                 : reassignWorkOrder,
        'viewWorkOrder'                     : viewWorkOrder
    };
}();

/**
 * pageinit handler for the work order list page
 */
$("div:jqmData(role='page')").on( "pageinit", function() {

    if ( this.id === "workOrderListPage" ) {
        // All pages must set pageId to this.id
        var pageId = this.id;
        debug && console.log( "WorkOrderList.pageinit: Initializing " + pageId );

        // This MUST be called by every page specific pageinit event handler!
        UIFrame.init( pageId, function() {
            debug && console.log( "WorkOrderList.pageinit: Executing page specific init" );

            // Page initialization
            WorkOrderList.init( pageId );
        });

    } else {
        // If page ID is something other than workOrderListPage, do not call
        // the default init.  Instead, simply load the arrays to support
        // calling the work order action methods.
        debug && console.log( "WorkOrderList.pageinit: Skipped because pageId is not workOrderListPage" );
        WorkOrderList.loadWorkOrders();
        WorkOrderList.loadCustomers();
    }
});

