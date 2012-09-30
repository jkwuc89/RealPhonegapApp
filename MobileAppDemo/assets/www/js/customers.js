/**
 * customers.js
 */

"use strict";

/**
 * Customers
 * Using the Revealing Module JavaScript pattern to encapsulate
 * the customers functionality into an object
 */
var Customers = function() {
	var customers = null;
	var allCustomers = null;
	var workOrders = JSONData.getObjectsByDataType( "workOrders" );
	var pmSchedule = JSONData.getObjectsByDataType( "pmSchedules" );
	var defaultListItems = "";
	
	// Currently selected sort criteria
    var sortCriteria = "sortByName";

	/**
     * Populate the customer list
     */
	function populateListViews( customersList, repopulatingList ) {
		debug && console.log( "Customers.populateListViews: Populating the customers list" );
		
		customers = null;
	    if( customersList && customersList.length >= 0 ) {
	    	customers = customersList;
	    } else {
	    	allCustomers = customers = _.sortBy( JSONData.getObjectsByDataType( "customers" ), function( customer ) {
	    		return customer.name;
	    	});
	    }
	    
		if( repopulatingList === undefined ) {
	    	repopulatingList = false;
	    }
		
		// Remove all existing items from the customer list
	    var address = null,
	    	openWOTotal = 0,
	    	openPMTotal = 0,
	    	pmsDueCount = 0,
	    	commDetail = null,
	    	workOrderCount = 0,
	    	mainContact = null,
	    	customerListItem = "",
	    	currentCustomer = null,
	    	customersList = $('#customersList'),
	    	openHeader = Localization.getText( "open" ),
	    	addressHeader = Localization.getText( "addressLabel" ),
	    	listItem = new EJS({ url: 'templates/customerlistitem' }),
            now = new Date();
    	
	    var pmDateCutoff = new Date( now.getFullYear(), now.getMonth() + 1, 0 ).getTime() - ( 1000 * 60 * 60 * 24 );
	    
	    customersList.children('li').remove();
	   
	   debug && console.log( "Customers.populateListViews: " + customers.length + " customers found." );
	   for ( var customer in customers ) {
		   currentCustomer = customers[customer];
		   if ( currentCustomer.shipToAddressId ) {
		       address = ( currentCustomer.addresses) ? JSONData.getObjectFromArrayById( currentCustomer.addresses, currentCustomer.shipToAddressId ) : null;
		   } else {
		       address = currentCustomer.addresses[0];
		   }
		   if ( currentCustomer.mainContactId ) {
		       mainContact =  ( currentCustomer.mainContactId ) ? JSONData.getObjectFromArrayById( currentCustomer.contacts, currentCustomer.mainContactId ) : null;
		   } else {
		       mainContact = currentCustomer.contacts[0];
		   }
		   commDetail = address.communicationDetails && address.communicationDetails.length > 0 ? 
		    	JSONData.getMainCommunicationDetails( address.communicationDetails ) : null;
	    	
		   // Get the number of work orders and PMs due for the current customer
           workOrderCount = _.filter( workOrders, function( wo ) {
              return wo.customerId == currentCustomer.webId; 
           }).length;
           
           pmsDueCount = _.filter( pmSchedule, function( pmScheduleInList ) {
               return ( new Date( pmScheduleInList.dateSchedule ).getTime() <= pmDateCutoff ) && pmScheduleInList.customerId == currentCustomer.webId; 
           }).length;
		   
           customerListItem = listItem.render({
	    		customer: currentCustomer,
	    		mainContact: mainContact,
	    		address : address,
	    		addressHeader: addressHeader,
	    		communicationDetail: commDetail,
	    		openHeader: openHeader,
	    		pmsCount : Localization.formatNumber( pmsDueCount, "n0" ),
	    		woCount : Localization.formatNumber( workOrderCount, "n0" )
	    	});
           
	    	customersList.append( customerListItem ) ;
	    	
	    	if( !repopulatingList ) {
	    		if( pmsDueCount > 0 ) {
	    			openPMTotal ++;
	    		}
	    		
	    		if( workOrderCount > 0 ) {
	    			openWOTotal ++;
	    		}
	    		
	    		defaultListItems += customerListItem;
	    	}
	    }
	    
	    // Refresh the list so that it is themed correctly
	    customersList.listview('refresh');
	    
        if( !repopulatingList ) {
        	UIFrame.addGuidedSearchDivider( Localization.getText( "openItems" ));
		    UIFrame.addGuidedSearchItem( Localization.getText("pmsDuePage"), "openPeriodicMaintenanceGuidedSearch", openPMTotal );
		    UIFrame.addGuidedSearchItem( Localization.getText("workOrders"), "openWorkOrdersGuidedSearch", openWOTotal );
	        
		    // Refresh the guided search area 
	        UIFrame.refreshGuidedSearch();
	        UIFrame.bindGuidedSearchClickHandler( guidedSearchClickHandler );
        }
        

	    // Tapping a customer item opens a customer equipment page
        $('.customer-list-item').on( "tap", openCustomerEquipmentOnTap );
        
        if ( repopulatingList ) {
            UIFrame.adjustListViewBorders();
        }
	}
	
	/**
     * Guided search click handler for the customers list page
     * @param event - the click event
     */
    function guidedSearchClickHandler( event ) {
        debug && console.log( "Customers.guidedSearchClickHandler" );
        
        var pmsDueCount = 0,
        	workOrderCount = 0,
        	filteredCustomers = null;
        if( this.id.indexOf( "openPeriodic" ) != -1 ) {
        	debug && console.log( "Customers.guidedSearchClickHandler : Filtering customers using open PM filtering" );
        	var now = new Date();
        	var pmDateCutoff = new Date( now.getFullYear(), now.getMonth() + 1, 0 ).getTime() - ( 1000 * 60 * 60 * 24 );
        	
        	filteredCustomers = _.filter( allCustomers, function( currentCustomer ) {
        		pmsDueCount = _.filter( pmSchedule, function( pmScheduleInList ) {
                    return ( new Date( pmScheduleInList.dateSchedule ).getTime() <= pmDateCutoff ) && pmScheduleInList.customerId == currentCustomer.webId; 
                }).length;
        		
        		return pmsDueCount > 0;
            });
        } else if( this.id.indexOf("openWork") != -1 ) {
        	debug && console.log( "Customers.guidedSearchClickHandler : Filtering customers using open WO filtering" );
        	filteredCustomers = _.filter( allCustomers,  function( currentCustomer ) {
        		workOrderCount = _.filter( workOrders, function( wo ) {
                    return wo.customerId == currentCustomer.webId; 
                 }).length;
        		
        		return workOrderCount > 0;
            });
        }
        
        if( filteredCustomers == null ) {
        	filteredCustomers = [];
        }
        
        populateListViews( filteredCustomers, true );
        UIFrame.changeListFilter( "" );
        UIFrame.refreshGuidedSearchWithSelectedItem( this, clearGuidedSearch );
    }
    
    /**
     * Guided search click handler for pms due resets the list views
     * after filtering the pms due by status
     * @param event - click event    
     */
    function clearGuidedSearch( event ) {
    	var customersList = $('#customersList');
    	
        // These two calls must be the first two lines in all custom clear handlers
        event.preventDefault();
        event.stopPropagation();
        debug && console.log( "Customers.clearGuidedSearch: Resetting customer list views" );
        
        customersList.empty();
        customersList.append( defaultListItems );
        customersList.listview( 'refresh' );
        
        $('.customer-list-item').on( "tap", openCustomerEquipmentOnTap );
        UIFrame.resetGuidedSearch( this );
    }
    
	/**
	 * Open the customer equipment page when a customer from the customer list is selected
	 */
	function openCustomerEquipmentOnTap() {
		var customerId = this.id;
			customerId = customerId.substring( 8 );
			
		debug && console.log( "Customers.openCustomerEquipmentOnTap: Opening customer equipment for customer Id: " + customerId );
		window.localStorage.setItem( "customerId", customerId );
        UIFrame.navigateToPage( "customerequipment.html" );
	}
	
	 /**
     * Sort the customer list.  Sort by customer name is the default criteria
     */
	function sortList() {
		var sortedList = null;
		switch ( sortCriteria ) {
        case "sortByDistance" :
        	break;
        // Sort by name is the default
        default:
            debug && console.log( "Customers.sortList: Sorting by customer name" );
            sortedList = _.sortBy( customers, function( customer ) {
                return customer.name;
            });
            break;
		}
		customers = sortedList;
	}
	
	return {
		'populateListViews' : populateListViews,
		'openCustomerEquipmentOnTap' : openCustomerEquipmentOnTap
	};
}();

/**
 * pageinit event handler for the customer list page
 */
$("div:jqmData(role='page')").on( "pageinit", function( event, ui ) {
    // All pages must set pageId to this.id
    var pageId = this.id;
    debug && console.log( "Customers.pageinit: Initializing " + pageId );
    
    // This MUST be called by every page specific pageinit event handler!
    UIFrame.init( pageId, function() {
        debug && console.log( "Customers.pageinit: Executing page specific init" );
        // Populate the pms due list
        Customers.populateListViews();

        // Adjust the style to hide the search form that appears at the top of the
        // pm due list
        var customerListSearchFormStyle = {
            'margin-left'  : '0px',
            'margin-right' : '0px',
            'margin-top'   : '0px',
            'margin-bottom': '0px',
            'border-style' : 'none'
        };
        $(".ui-listview-filter").css( customerListSearchFormStyle );

        // Remove the customerId from localstorage if coming back from customer equipment page
        if( window.localStorage.getItem( "customerId" ) != "" ) {
        	window.localStorage.setItem( "customerId", "" );
        }
        
        // This MUST be the last line inside each page specific init function
        UIFrame.postPageSpecificInit( pageId );
    });
});
