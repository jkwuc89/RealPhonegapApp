/**
 * home.js
 */

"use strict";

/**
 * Home
 * Encapsulate the homepage display
 */
var Home = function() {
    // Holds list of available customers
    var customerArray = [];

    // Holds list of available pm schedules
    var pmScheduleArray = [];

    // Holds list of available work orders
    var workOrderArray = [];

    /**
     * Use the window onload event to fix the list view borders
     */
    $(window).load( function( event ) {
        adjustListViewBorders();
    });

    /**
     * Fix the border between the work order list and the PMs due list
     */
    function adjustListViewBorders() {
        // Fix the border between the work order list and the pms due list
        var workOrderList = $("#workOrderList");
        var pmsDueList    = $("#plannedMaintenanceList");
        // Turn off the border for all list items inside the shorter list
        if ( workOrderList.height() >= pmsDueList.height() ) {
            debug && console.log( "Home.window.load: Using work order list border" );
            workOrderList.children( "li" ).css( "border-right", "solid 1px black" );
            pmsDueList.children( "li" ).css( "border-left", "none" );
        } else {
            debug && console.log( "Home.window.load: Using pms due list border" );
            workOrderList.children( "li" ).css( "border-right", "none" );
            pmsDueList.children( "li" ).css( "border-left", "solid 1px black" );
        }
        // Add a bottom border to the last list item in each of the lists
        workOrderList.children('li').last().css( "border-bottom", "solid 1px black" );
        pmsDueList.children('li').last().css( "border-bottom", "solid 1px black" );
    }

    /**
     * This function is called by JSONData.periodicJSONUpdateComplete() when
     * a periodic JSON feed update is complete.  It allows this page to
     * to update the work order list and the pm schedule list
     */
    function periodicJSONFeedUpdateCompleteFn() {
        debug && console.log( "Home.periodicJSONFeedUpdateCompleteFn: Periodic JSON update complete" );
        // Reload the customer array because new work orders or PMs may reference new customers
        customerArray = JSONData.getObjectsByDataType( "customers" );
        if ( JSONData.getNumWorkOrdersSavedDuringLastUpdate() > 0 ) {
            debug && console.log( "Home.periodicJSONFeedUpdateCompleteFn: Refreshing work order list" );
            // Do not show completed or rejected work orders on the home page
            workOrderArray  = _.filter( JSONData.getObjectsByDataType( "workOrders" ), function( workOrderInList ) {
                return ( workOrderInList.workOrderSegments[0].webStatus != WorkOrder.WORK_ORDER_STATUS_COMPLETED &&
                         workOrderInList.workOrderSegments[0].webStatus != WorkOrder.WORK_ORDER_STATUS_REJECTED );
            });
            populateWorkOrderList();
        } else {
            debug && console.log( "Home.periodicJSONFeedUpdateCompleteFn: Work order list refresh skipped because no work orders were saved during last update" );
        }
        if ( JSONData.getNumPMSchedulesSavedDuringLastUpdate() > 0 ) {
            debug && console.log( "Home.periodicJSONFeedUpdateCompleteFn: Refreshing PM due list" );
            pmScheduleArray = _.filter(
                _.sortBy( JSONData.getObjectsByDataType( "pmSchedules" ), function( pmDue ) {
                    return ( JSONData.getObjectFromArrayById( customerArray, pmDue.customerId ).name + pmDue.customerId );
                }),
                function ( pmScheduleInList ) {
                    return ( JSONData.isPMBeforeCutoffDate( pmScheduleInList ) );
            });
            populatePlannedMaintenanceList();
        } else {
            debug && console.log( "Home.periodicJSONFeedUpdateCompleteFn: PM due list refresh skipped because no pm schedules were saved during last update" );
        }
        adjustListViewBorders();
    }

    /**
     * Initialization
     */
    var init = _.once( function( pageId ) {
        debug && console.log( "Home.init: Getting all SQLite data before populating page" );

        // Set the periodic JSON feed update complete function for this page
        JSONData.setPageSpecificPeriodicUpdateCompleteFn( periodicJSONFeedUpdateCompleteFn );

        customerArray   = JSONData.getObjectsByDataType( "customers" );
        pmScheduleArray = _.filter(
            _.sortBy( JSONData.getObjectsByDataType( "pmSchedules" ), function( pmDue ) {
                var customerForPM = JSONData.getObjectFromArrayById( customerArray, pmDue.customerId );
                if ( customerForPM ) {
                    return ( customerForPM.name + pmDue.customerId );
                } else {
                    return pmDue.customerId;
                }
            }),
            function ( pmScheduleInList ) {
                return ( JSONData.isPMBeforeCutoffDate( pmScheduleInList ) );
        });

        // Do not show completed or rejected work orders on the home page
        workOrderArray  = _.filter( JSONData.getObjectsByDataType( "workOrders" ), function( workOrderInList ) {
            return ( workOrderInList.workOrderSegments[0].webStatus != WorkOrder.WORK_ORDER_STATUS_COMPLETED &&
                     workOrderInList.workOrderSegments[0].webStatus != WorkOrder.WORK_ORDER_STATUS_REJECTED );
        });

        Home.checkTechnicianClocking();

        // Populate the list views
        Home.populateWorkOrderList();
        Home.populatePlannedMaintenanceList();

        $('#imgMessagesLandscape').click( function( clickEvent ) {
            UIFrame.navigateToPage( "messages.html" );
        });

        $('#imgMapLandscape').click( function( clickEvent ) {
            UIFrame.navigateToPage( "map.html" );
        });

        $('#imgTimeSheetLandscape').click( function( clickEvent ) {
            UIFrame.navigateToPage( "timesheet.html" );
        });

        $('#imgMessagesPortrait').click( function( clickEvent ) {
            UIFrame.navigateToPage( "messages.html" );
        });

        $('#imgMapPortrait').click( function( clickEvent ) {
            UIFrame.navigateToPage( "map.html" );
        });

        $('#imgTimeSheetPortrait').click( function( clickEvent ) {
            UIFrame.navigateToPage( "timesheet.html" );
        });

        updateIconBarMessageBadge( JSONData.getNewMessageCount() );

        // Initialize the work initial list filters to empty
        window.localStorage.setItem( JSONData.LS_INITIAL_WORK_ORDER_LIST_FILTER, "");
        window.localStorage.setItem( "plannedMaintenanceFilter", "");

        // This MUST be the last line inside each page specific init function
        UIFrame.postPageSpecificInit( pageId );
    });

    /**
     * If a time entry exists from the previous day, prompt the user to close the previous day entry
     */
    function checkTechnicianClocking() {
        debug && console.log( "Home.checkTechnicianClocking: User must close out previous day." );

        var today = new Date().setHours(0,0,0,0),
            clocking = JSONData.getObjectsByDataType( "technicianClocking" );


        if( clocking && clocking.length > 0 ) {
            for( var clockItem in clocking ) {
                if( !clocking[clockItem].closed && new Date( clocking[clockItem].timeStart ).setHours(0,0,0,0) < today ) {
                    window.localStorage.setItem( "checkTechnicianClocking", "openEntryFound" );
                    //UIFrame.navigateToPage( "closeoutday.html" );
                }
            }
        }
    }

   /**
    * Populate the work order list
    */
   function populatePlannedMaintenanceList() {
       debug && console.log( "Home.populatePlannedMaintenance: Populating the pms due list" );

        // Remove all existing items from the pms due list
        var pmsDueList = $('#plannedMaintenanceList');
        pmsDueList.children('li').remove();

        debug && console.log( "Home.populatePlannedMaintenanceList: " + pmScheduleArray.length + " pmsdue found." );
        var addressString = "",
            currentCustomer = null,
            currentCustomerAddress = null,
            pmsDueCount = null;
        var pmDueItemTemplate = new EJS({url: 'templates/homepageplannedmaintenancelistitem'});

        for ( var i = 0; i < pmScheduleArray.length; i++ ) {
            currentCustomer = JSONData.getObjectFromArrayById( customerArray, pmScheduleArray[i].customerId );
            if ( currentCustomer ) {
                currentCustomerAddress = _.find( currentCustomer.addresses, function( address ) {
                    return address.webId == pmScheduleArray[i].addressId;
                });

                if( currentCustomerAddress ) {
                    addressString =  currentCustomerAddress.street + ", ";

                    if( currentCustomerAddress.street2 != null ) {
                        addressString += currentCustomerAddress.street2 + ", ";
                    }

                    addressString += currentCustomerAddress.city + ", " +  currentCustomerAddress.state + " " + currentCustomerAddress.postalCode;
                } else {
                    addressString = "";
                }
            }

            pmsDueCount = _.filter( pmScheduleArray , function( pmDueFromList ) {
                if ( currentCustomer && currentCustomer.webId ) {
                    return pmDueFromList.customerId == currentCustomer.webId;
                }
            });

            // Avoid an out-of-bounds issue by making sure the index isn't the final
            if( i < pmScheduleArray.length - 1) {
                // If this results customerId is not the same as the next
                if( pmScheduleArray[i].customerId != pmScheduleArray[ i + 1 ].customerId) {

                    // Add the customer details to the pm due list
                    pmsDueList.append( pmDueItemTemplate.render({
                        pmDue : pmScheduleArray[i],
                        customer : currentCustomer,
                        address : addressString,
                        currentCustomerPmsDueCount : Localization.formatNumber( pmsDueCount.length, "n0" )
                     }));
                }
            }

            // If this is the final result
            else {
                // Add the customer details to the pm due list
                pmsDueList.append( pmDueItemTemplate.render({
                    pmDue : pmScheduleArray[i],
                    customer : currentCustomer,
                    address : addressString,
                    currentCustomerPmsDueCount : Localization.formatNumber( pmsDueCount.length, "n0" )
                }));
            }

            currentCustomerAddress = null;
        }

        // Refresh the list so that it is themed correctly
        pmsDueList.listview('refresh');

        // Bind the click handler to the work order item class
        // so that we can control navigation to the work order details page
        $('.home-page-planned-maintenance-list-item').on( "click", openPlannedMaintenanceDueDetails );
   }

   /**
    * Populate the work order list
    */
    function populateWorkOrderList() {
       debug && console.log( "Home.populateWorkOrderList: Populating the list views" );

        var workOrders = _.sortBy( workOrderArray, function( workOrderInList ) {
            return new Date( workOrderInList.workOrderSegments[0].dateOpened ).getTime();
        });


       // Remove all existing items from the work order list
       var workOrderList = $('#workOrderList');
       workOrderList.children('li').remove();

       debug && console.log( "Home.populateWorkOrderList: " + workOrders.length + " workorders found." );
       var color = null,
           currentCustomer = null,
           standardJobCode = null,
           equipment = null,
           currentCustomerId = null,
           currentCustomerWorkOrderCount = 0,
           currentWorkOrder = null,
           workOrderItemTemplate = new EJS({url: 'templates/homepageworkorderlistitem'});

       var date = new Date();
       date.setHours(0,0,0,0);

       var today = date.getTime();
       var dayHrs = 1000 * 60 * 60 * 24;

       for ( var i = 0; i < workOrders.length; i++, currentCustomerWorkOrderCount++ ) {
           color = "black";
           currentWorkOrder = workOrders[i];
           equipment = currentWorkOrder.workOrderSegments[0].equipment;

           if ( currentWorkOrder.workOrderSegments[0].standardJobCodeId ) {
               standardJobCode = currentWorkOrder.workOrderSegments[0].standardJobCode;
           } else {
               standardJobCode = null;
           }

           // New customer?
           if ( currentCustomerId === null || currentCustomerId != currentWorkOrder.customer ) {
               currentCustomer = JSONData.getObjectFromArrayById( customerArray, currentWorkOrder.customerId );
               if ( currentCustomer ) {
                   currentCustomerId = currentCustomer.webId;
               }
               currentCustomerWorkOrderCount = 0;
           }

           if(((today - new Date(currentWorkOrder.dateOpened).setHours(0,0,0,0)) / dayHrs) >= 10 ) {
               color = "red";
           }

           // Add the work order to the list
           workOrderList.append( workOrderItemTemplate.render( {
               workOrder : currentWorkOrder,
               customer : currentCustomer,
               equipment : equipment,
               standardJobCode : standardJobCode,
               color: color
           }));
       }

       // Refresh the list so that it is themed correctly
       workOrderList.listview('refresh');

       // Bind the click handler to the work order item class
       // so that we can control navigation to the work order details page
       $('.home-page-work-order-list-item').on( "click", openWorkOrderDetails );
   }

   /**
    * Open the planned maintenance page for the item that was tapped.
    * This object should pass an identifier that can filter the pm due by the selected customer
    */
    function openPlannedMaintenanceDueDetails() {
        var customer;
        var customerId = JSONData.getObjectById( "pmSchedules", this.id, null ).customerId;
        debug && console.log( "Home.openPlannedMaintenanceDetails: PM Due selection id:" + this.id );
        customer = JSONData.getObjectById( "customers", customerId, null );
        if ( customer ) {
            // Pass the work order ID using local storage
            debug && console.log( "Home.openPlannedMaintenanceDetails: Opening pms due filtered for customer:" + customer.name );
            window.localStorage.setItem( "pmCustomerFilter", customer.webId );
            UIFrame.navigateToPage( "pmsdue.html", false, null );
        } else {
            JSONData.handleDataMissingError( "customer", customerId );
        }
    }

    /**
     * Open the work order details page for the item that was tapped on and
     *  change the active work order status to On Hold
     */
    function openWorkOrderDetails() {
        debug && console.log( "Home.openWorkOrderDetails: Work Order selection id:" + this.id );

        var workOrder = JSONData.getObjectFromArrayById( workOrderArray, this.id );

        // Pass the work order ID using local storage
        debug && console.log( "Home.openPlannedMaintenanceDetails: Opening work order list filtered for work order:" + workOrder.documentNumber );
        window.localStorage.setItem( JSONData.LS_INITIAL_WORK_ORDER_LIST_FILTER, workOrder.webId );

        UIFrame.navigateToPage( "workorderlist.html" );
    }


    /**
     * Sort the pmScheduleArray list.  Sort by customer name is the default criteria
     */
    function sortList() {
        var sortedList = null;
        debug && console.log( "Home.sortList: Sorting by customer name" );
        sortedList = _.sortBy( pmScheduleArray, function( pmDue ) {
            return JSONData.getObjectFromArrayById( customerArray, pmDue.customerId ).name;
        });

        pmScheduleArray = sortedList;
    }

    /**
     * Update the message count badge on the messages icon in the home page icon bar.
     * If the message count is 0, the badge is removed.
     */
    function updateIconBarMessageBadge( count ) {
        debug && console.log( "UIFrame.updateIconBarMessageBadge: Changing message count to " + count );
        $( '#messagesIconLandscape' ).mobileBadge({
            count: count,
            position: 'topright'
        });
    }

   return {
        'checkTechnicianClocking' : checkTechnicianClocking,
        'init' : init,
        'populateWorkOrderList' : populateWorkOrderList,
        'populatePlannedMaintenanceList' : populatePlannedMaintenanceList
   };
}();

/**
 * pageinit event handler
 */
$("div:jqmData(role='page')").on( "pageinit", function( event, ui ) {
    // All pages must set pageId to this.id
    var pageId = this.id;
    debug && console.log( "Home.pageinit: Initializing " + pageId );
    UIFrame.init( pageId, function() {
        debug && console.log( "Home.pageinit: Executing page specific init" );

        // Page initialization
        Home.init( pageId );
    });
});

