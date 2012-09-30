/**
 * customerequipment.js
 */

"use strict";

/**
 * CustomerEquipment
 * Using the Revealing Module JavaScript pattern to encapsulate
 * the customer equipment functionality into an object
 */
var CustomerEquipment = function() {
	var equipment = null,
		customerId = null,
		guidedSearch = "",
		allEquipment = null,
		defaultListItems = "",
		currentCustomer = null,
		customerEquipment = null,
		currentCustomerAddress =  null,
		currentCustomerMainContact =  null,
		sortCriteria = "sortByManufacturer",
		currentCustomerMainCommDetail = null,
		customerSelectionList = $( "#customerSelectionList" ),
		pms = JSONData.getObjectsByDataType( "pmSchedules" ),
		workOrders = JSONData.getObjectsByDataType( "workOrders" ),
		manufacturers = JSONData.getObjectsByDataType("manufacturers");
	
	/**
     * Populate the customer list
     */
	function populateListViews( customerEquipmentList, repopulatingList ) {	
		debug && console.log( "Customers.populateListViews: Populating the customers list" );

		// Retrieve the required customerId from local storage
		if( window.localStorage.getItem( "customerId" ) != "") {
			customerId = window.localStorage.getItem( "customerId" );
		}
		
		if( customerEquipmentList && customerEquipmentList.length >= 0 ) {
			customerEquipment = customerEquipmentList;
	    } else {
	    	// Save a one-time reference for the customer equipment
	    	equipment = JSONData.getFilteredObjectList( "equipment", function( currentEquipment ) {
				return currentEquipment.ownerId == customerId;
			});
	    	
	    	allEquipment = customerEquipment = _.sortBy( equipment, function( currentEquipment ) {
	    		return currentEquipment.product.manufacturer + currentEquipment.product.productCode + currentEquipment.serialNumber;
	    	});
	    }
	    
	    if( repopulatingList === undefined ) {
	    	repopulatingList = false;
	    }
	    
		var pmsDueCount = 0,
			openPMTotal = 0,
			openWOTotal = 0,
			workOrderCount = 0,
			customerEquipmentList = $('#customerEquipmentList'),
			currentCustomerListItem = new EJS({ url: 'templates/customerequipmentcustomer' }),
			customerEquipmentListItem = new EJS({ url: 'templates/customerequipmentlistitem' }),
			customerEquipmentListDivider = new EJS({ url: 'templates/customerequipmentlistdivider' });

		if( !repopulatingList ) {
			currentCustomer = JSONData.getObjectById( "customers", customerId );
			if( currentCustomer.shipToAddressId ) {
				currentCustomerAddress = JSONData.getObjectFromArrayById( currentCustomer.addresses, currentCustomer.mainAddressId );
			} else {
			    currentCustomerAddress = currentCustomer.addresses[0];
			}
			
			if( currentCustomer.mainContactId ) {
				currentCustomerMainContact = JSONData.getObjectFromArrayById( currentCustomer.contacts, currentCustomer.mainContactId );
			} else {
			    currentCustomerMainContact = currentCustomer.contacts[0];
			}
			
			if ( currentCustomerAddress.communicationDetails && currentCustomerAddress.communicationDetails.length > 0 ) {
				currentCustomerMainCommDetail = JSONData.getMainCommunicationDetails( currentCustomerAddress.communicationDetails );
			}
			
			pmsDueCount = _.filter( pms, function( pm ) {
	               return pm.customerId == currentCustomer.webId; 
	        }).length;
			
			workOrderCount = _.filter( workOrders, function( wo ) {
	              return wo.customerId == currentCustomer.webId; 
	        }).length;
			
			if ( currentCustomerAddress.communicationDetails && currentCustomerAddress.communicationDetails.length > 0 ) {
			    currentCustomerMainCommDetail = JSONData.getMainCommunicationDetails( currentCustomerAddress.communicationDetails );
			}
			
			// Add the customer to the customer selection list
			customerSelectionList.append( currentCustomerListItem.render({
				customer: currentCustomer,
				mainContact: currentCustomerMainContact,
				address : currentCustomerAddress,
				communicationDetail: currentCustomerMainCommDetail,
				pmsCount: pmsDueCount,
				woCount: workOrderCount
			}));

			
			// Refresh the customerSelectionList
			customerSelectionList.listview('refresh');
		}
		
		// Clear the customer equipment list and add the header
		customerEquipmentList.children('li').remove();
		customerEquipmentList.append( customerEquipmentListDivider.render( ));
		
		var customerListItem = "",
			equipmentManufacturers = {},
			currentManufacturer = "",
			manufacturerInternalId = "";
		
		// If there are equipment items for this customer, process the list
		if( customerEquipment != null ) {
			debug && console.log( "CustomerEquipment.populateListViews: Customer equipment list contains " + customerEquipment.length + " items" );
			var currentEquipment = null;
			for(var equipment in customerEquipment) {
				currentEquipment = customerEquipment[equipment];
				
				// Retrieve the manufacturer internal id from the equipment JSON
				manufacturerInternalId = currentEquipment.product.manufacturer;
				
				// Get the manufacturer object
				currentManufacturer = _.find( manufacturers, function( currentMfg ) {
	                return currentMfg.internalId == manufacturerInternalId;
	            });

				// If a new equipment manufacturer, add it, otherwise increment the relevant count
				if( equipmentManufacturers[currentManufacturer.webId] === undefined ) {
					equipmentManufacturers[currentManufacturer.webId] = {};
					equipmentManufacturers[currentManufacturer.webId]['count'] = 1;
					equipmentManufacturers[currentManufacturer.webId]['description'] = currentManufacturer.description;
					equipmentManufacturers[currentManufacturer.webId]['internalId'] = currentManufacturer.internalId;
					
				} else {
					equipmentManufacturers[currentManufacturer.webId]['count'] ++;
				}
				
				// Get the number of work orders and PMs due for the current customer
		        workOrderCount = _.filter( workOrders, function( wo ) {
		            return wo.workOrderSegments[0].equipmentId == currentEquipment.webId; 
		        }).length;
		           
		        pmsDueCount = _.filter( pms, function( pm ) {
		            return pm.equipmentId == currentEquipment.webId; 
		        }).length;
				
		        customerListItem = customerEquipmentListItem.render({
					equipment: currentEquipment,
					manufacturer: currentManufacturer
			 	});
		        
				// Add the current piece of equipment to the equipment list
			 	customerEquipmentList.append( customerListItem );
			 	
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
		} else {
			debug && console.log( "CustomerEquipment.populateListViews: Customer equipment list is null" );
		}
		
		// Add all of the customer equipment items to the list
		customerEquipmentList.listview( 'refresh' );

		if( !repopulatingList ) {			
			// Sort equipmentManufacturers by count descending
			equipmentManufacturers = _.sortBy( equipmentManufacturers, function( mfg ) {
				return mfg.description;
			}); 
			
	    	UIFrame.addGuidedSearchDivider( Localization.getText( "openItems" ));
		    UIFrame.addGuidedSearchItem( Localization.getText("pmsDuePage"), "openPeriodicMaintenanceGuidedSearch", openPMTotal );
		    UIFrame.addGuidedSearchItem( Localization.getText("workOrders"), "openWorkOrdersGuidedSearch", openWOTotal );
			
			UIFrame.addGuidedSearchDivider( Localization.getText( "manufacturerLabel" ) );
			for( var manufacturer in equipmentManufacturers ) {
				UIFrame.addGuidedSearchItem( equipmentManufacturers[ manufacturer ]['description'], 
						"mfg" + equipmentManufacturers[ manufacturer ]['internalId'], 
						equipmentManufacturers[ manufacturer ]['count']);
			}
			
			// Bind the guided search click handler
	        UIFrame.bindGuidedSearchClickHandler( guidedSearchClickHandler );
			UIFrame.refreshGuidedSearch();
			
	        // Bind the sort on change handler
	        $("#sortList").change( sortChangeHandler );
	        
	        $('#customerEquipmentList').on("updatelayout", function() {
	        	// ensure that the header is still an item in the list
	        	var listItems = $('#customerEquipmentList').children(":visible");
	        	if( listItems.length != 0 ) {
		        	if( listItems[0].id !== "listDivider" ) {
		        		debug && console.log( "CustomerEquipment.populateListViews: Adding missing listview divider" );
		        		// prepend the divider if not found
		        		
		        		$('.customer-equipment-list-divider').remove();
		        		customerEquipmentList.prepend( customerEquipmentListDivider.render() );
		        		customerEquipmentList.listview( 'refresh' );
		        	}
	        	}
	        });
		}
		
		// Bind a click listener for the customer equipment list items
		$('.customer-list-item').click( function() {
			var equipmentWebId = this.id.substring( 9 );
			debug && console.log( "CustomerEquipment.populateListViews: User selected equipment item: " + equipmentWebId );
			
			// Save the equipment web id in localstorage and open the equipment details page
			var equipmentId = this.id.match( /equipment(\w+)/ )[1];
			
			window.localStorage.setItem( "equipmentId", equipmentId );
			window.localStorage.setItem( "customerId", customerId );
			window.localStorage.setItem( "guidedSearch", guidedSearch );
			window.localStorage.setItem( "sortValue", $( "#sortList" ).val() );
			
			UIFrame.navigateToPage( "equipmentdetail.html" );
		});
		
        if ( repopulatingList ) {
            UIFrame.adjustListViewBorders();
        }
	}
	
	/**
     * Guided search click handler for the customer equipment list page
     * @param event - the click event
     */
    function guidedSearchClickHandler( event ) {
        debug && console.log( "CustomerEquipment.guidedSearchClickHandler" );
        
        var filteredCustomerEquipment = null;
        guidedSearch = this.id;
        	
        // Find the relevant guided search filter
        if( this.id.indexOf("model") != -1 ) {
        	var model = this.id.match( /model([\w\-\d\/]+)/ )[1];
        	
        	debug && console.log( "CustomerEquipment.guidedSearchClickHandler: Filtering customer equipment by model: " + model ); 
            filteredCustomerEquipment = _.filter( allEquipment, function( currentEquipment ) {
                return currentEquipment.ownerId == customerId && currentEquipment.product.productCode == model;
            });
        	// Filter by manufacturer
        } else if( this.id.indexOf("mfg") != -1 ) {
        	var mfgId = this.id.match( /mfg([\w\-\d\/\&]+)/ )[1];
        	
            debug && console.log( "CustomerEquipment.guidedSearchClickHandler: Filtering customer equipment by manufacturer: " + mfgId ); 
            filteredCustomerEquipment = _.filter( allEquipment , function( currentEquipment ) {
            	return currentEquipment.ownerId == customerId && currentEquipment.product.manufacturer == mfgId;
            });
        } else if( this.id.indexOf( "openPeriodicMaintenanceGuidedSearch" ) != -1 ) {
        	debug && console.log( "CustomerEquipment.guidedSearchClickHandler : Filtering customer equipment using open PM filtering" );
        	var pmsDueCount = 0;
        	
        	filteredCustomerEquipment = _.filter( allEquipment , function( currentEquipment ) {
        		pmsDueCount = _.filter( pms, function( pm ) {
                    return pm.equipmentId == currentEquipment.webId; 
                });
        		
        		
        		return pmsDueCount.length > 0;
        	});
        	
        } else if( this.id.indexOf("openWorkOrdersGuidedSearch") != -1 ) {
        	debug && console.log( "CustomerEquipment.guidedSearchClickHandler : Filtering customer equipment using open WO filtering" );
        	var workOrderCount = 0;
        	
        	filteredCustomerEquipment = _.filter( allEquipment , function( currentEquipment ) {
	        	workOrderCount = _.filter( workOrders, function( workOrder ) {
	                return workOrder.workOrderSegments[0].equipmentId == currentEquipment.webId; 
	            });

	    		return workOrderCount.length > 0;
        	});
        } 
        
        // Check the length of the filtered customer equipment list
        if ( filteredCustomerEquipment == null ) {
        	filteredCustomerEquipment = [];
        }
        
        populateListViews( filteredCustomerEquipment, true );
        UIFrame.changeListFilter( "" );
        
        UIFrame.refreshGuidedSearchWithSelectedItem( this, clearGuidedSearch );
    }
    
    /**
     * Guided search click handler for customer equipment resets the list views
     * after filtering the equipment
     * @param event - click event    
     */
    function clearGuidedSearch( event ) {
    	var customerEquipmentList = $('#customerEquipmentList');
    	
        // These two calls must be the first two lines in all custom clear handlers
        event.preventDefault();
        event.stopPropagation();
        debug && console.log( "CustomerEquipment.clearGuidedSearch: Resetting customer equipment list views" );
        
        customerEquipmentList.empty();
        customerEquipmentList.append( defaultListItems );
        customerEquipmentList.listview( 'refresh' );

        // Bind a click listener for the customer equipment list items
		$('.customer-equipment-list-item').click( function() {
			var equipmentWebId = this.id.substring( 9 );
			debug && console.log( "CustomerEquipment.populateListViews: User selected equipment item: " + equipmentWebId );
			
			// Save the equipment web id in localstorage and open the equipment details page
			var equipmentId = this.id.match( /equipment(\w+)/ )[1];
			
			window.localStorage.setItem( "invokingPage", "customerequipment");
			window.localStorage.setItem( "equipmentId", equipmentId );
			window.localStorage.setItem( "customerId", customerId );
			window.localStorage.setItem( "guidedSearch", guidedSearch );
			window.localStorage.setItem( "sortValue", sortCriteria );
			
			UIFrame.navigateToPage( "equipmentdetail.html" );
		});
    }
    
    /**
     * Handle the sort change event
     */
    function sortChangeHandler() {
        debug && console.log( "CustomerEquipment.sortChangeHandler: Changing sort criteria to " + this.value );
        sortCriteria = this.value;
        sortList();
    }
    
    /**
     * Sort the customer equipment list.  Sort by manufacturer is the default criteria
     */
	function sortList( ) {
		var sortedList = [];
		
        if( sortCriteria == "sortBySerial" ) {
            debug && console.log( "CustomerEquipment.sortList: Sorting by serial" );
            
            sortedList = _.sortBy( customerEquipment, function( currentEquipment ) {
                return currentEquipment.serialNumber;
            });
        } else {
            debug && console.log( "CustomerEquipment.sortList: Sorting by manufacturer" );
            
            sortedList = _.sortBy( customerEquipment, function( currentEquipment ) {
                return currentEquipment.product.manufacturer;
            });
        }
        
        populateListViews( sortedList, true );
	}
    
	/**
	 * Display a list of the customer's additional contacts
	 */
	function displayAdditionalContacts() {
		debug && console.log( "CustomerEquipment.displayAdditionalContacts: Retrieving additional contacts" );
		var currentContact = null,
			additionalFound = false,
			additionalContactsString = "";
		
		for( var i = 0; i < currentCustomer.contacts.length; i++ ) {
			currentContact = currentCustomer.contacts[i];
			if( currentCustomer.mainContactId != currentContact.webId ) {
				additionalContactsString += "<li onclick='CustomerEquipment.displayContactInformation(" + '"' + 
				currentContact.webId + '"' + ")' style='font-size: large;'>" + currentContact.firstName + " " + currentContact.lastName + "</li>";
				
				additionalFound = true;
			}
		}
		
		if( additionalFound ) {
			additionalContactsString += "<br />";
			
			var additionalContactsPopup = new EJS({ url: 'templates/additionalcontactspopup'}).render({
				additionalContactsString: additionalContactsString
			});
		
			$(document).simpledialog2({
	            mode : 'blank',
	            width: '400px',
	            headerText: Localization.getText('additionalContactsButton'),
	            blankContent : additionalContactsPopup
	        });
		} else {
			Dialog.showAlert( Localization.getText( "customerContacts"), Localization.getText( "noAdditionalContactsDialog" ) );
		}
	}
	
	/** 
	 * When a contact from the additional contacts list is selected, display the contact information
	 */	
	function displayContactInformation( contactId ) {
		debug && console.log( "CustomerEquipment.displayContactInformation: Contact.webId " + contactId + " was selected ");
		
		UIFrame.closeActiveDialog();
		
		// Assign initial values for each variable, many contact details may be empty
		var mobilePhone = "",
			homePhone = "",
			workPhone = "",
			email = "",
			address = ""; 
		
		var contact = JSONData.getObjectFromArrayById( currentCustomer.contacts, contactId );
		
		// Retrieve the communication details for this contact
		var commDetails = contact.address.communicationDetails;
		
		// Retrieve the JSON-data for the communcation details
		mobilePhone = _.find( commDetails, function( detail ) {
            return detail.type == "CELL";
        });
		homePhone = _.find( commDetails, function( detail ) {
            return detail.type == "PHONE";
        });
		workPhone = _.find( commDetails, function( detail ) {
            return detail.type == "PHONE";
        });
		email = _.find( commDetails, function( detail ) {
            return detail.type == "EM_INV";
        });
		
		// If any of the values are undefined assign " - ", otherwise save the value of the current object
		mobilePhone = ( mobilePhone == undefined ) ? " - " : mobilePhone.information;
		homePhone = ( homePhone == undefined ) ? " - " : homePhone.information;
		workPhone = ( workPhone == undefined ) ? " - " : workPhone.information;
		email = ( email == undefined ) ? " - " : email.information;
		
		address = contact.address;
		
		var contactPopup = new EJS({ url: 'templates/contactpopup'}).render({
			contact: contact,
			customer: currentCustomer,
			mobilePhone: mobilePhone,
			homePhone: homePhone,
			workPhone: workPhone,
			email: email,
			address: address
		});
	
		$(document).simpledialog2({
			mode : 'blank',
            width: '400px',
            headerText: Localization.getText('contactInformation'),
            blankContent : contactPopup
        });
	}
	
	/**
	 * Display an alert with the equipment notes
	 */
	function displayCustomerNotes() {
		debug && console.log( "CustomerEquipment.displayCustomerNotes: Retrieving notes" );
		
		// Retrieve the notes for this customer
		var notes = JSONData.getFilteredObjectList( "notes", function( currentNote ) {
            return currentNote.customerId == customerId;
        });
		
		// If there are currently no notes related to this customer
		if( notes == null ) {
			Dialog.showAlert( Localization.getText( "customerNotes" ), Localization.getText( "noCustomerNotes" ) );
		} else {
			var notesString = "";
			
			// Scan the notes and add the relevant details to the notesString
			for( var currentNote in notes ) {
				notesString += "<h4>" + Localization.formatDateTime( notes[currentNote].dateCreated, 'd' ) + "</h4>";
				notesString +=  "<div style='margin-left: 20px;'>" + notes[currentNote].message + "</div><hr />";
			}
			
			notesString += "<br />";
			
			var notesPopup = new EJS({url: 'templates/notespopup'}).render({
				notes: notesString
			});
			
			$(document).simpledialog2({
				mode: 'blank',
				width: '400px',
				headerText: Localization.getText('customerNotes'),
				blankContent : notesPopup
			});
		}
	}
	
	/**
	 *  Assign the Done button listener
	 */ 
	function doneButtonHandler() {
		var invokingPage = window.localStorage.getItem( "invokingPage" );
    	
    	if( invokingPage == "manageworkorderoverview-customer" ) {
        	window.localStorage.removeItem( "invokingPage" );
    		UIFrame.navigateToPage( "manageworkorderoverview.html" );	
    	} else if( invokingPage == "manageworkorderdiagnostics-customer" ) {
        	window.localStorage.removeItem( "invokingPage" );
    		UIFrame.navigateToPage( "manageworkorderdiagnostics.html" );	
    	} else if( invokingPage == "manageworkorderparts-customer" ) {
        	window.localStorage.removeItem( "invokingPage" );
    		UIFrame.navigateToPage( "manageworkorderparts.html" );	
    	} else if( invokingPage == "manageworkorderrepairdetails-customer" ) {
        	window.localStorage.removeItem( "invokingPage" );
    		UIFrame.navigateToPage( "manageworkorderrepairdetails.html" );	
    	} else if( invokingPage == "manageworkorderreview-customer" ) {
        	window.localStorage.removeItem( "invokingPage" );
    		UIFrame.navigateToPage( "manageworkorderreview.html" );	
    	} else if( invokingPage == "manageworkorderrepairdetails-customer" ) {
        	window.localStorage.removeItem( "invokingPage" );
    		UIFrame.navigateToPage( "manageworkorderrepairdetails.html" );
    	} else {
    		UIFrame.navigateToPage( "customers.html" );
    	}
	}
	
	return {
		'displayAdditionalContacts' : displayAdditionalContacts,
		'displayContactInformation' : displayContactInformation,
		'displayCustomerNotes' : displayCustomerNotes,
		'doneButtonHandler' : doneButtonHandler,
		'populateListViews' : populateListViews
	};
}();

/**
 * pageinit event handler 
 */
$("div:jqmData(role='page')").on( "pageinit", function( event, ui ) {
    // All pages must set pageId to this.id
    var pageId = this.id;
    debug && console.log( "CustomerEquipment.pageinit: Initializing " + pageId );
    // This MUST be called by every page specific pageinit event handler!
    UIFrame.init( pageId, function() {
        debug && console.log( "CustomerEquipment.pageinit: Page specific init goes here" );

        // Hide the footer and the header icons
        $('#footer').remove();
        $('.headerIcon').hide();
        $('#tasksMenuDiv').hide();
        
        // Bind the listeners for the done buttons
        $('#btnDone').click( CustomerEquipment.doneButtonHandler );
        
        // Bind the listener to show the list of additional contacts
        $('#additionalContactsButton').click( CustomerEquipment.displayAdditionalContacts );
        
        // Bind the listener to show the equipment notes
        $('#notesButton').click( CustomerEquipment.displayCustomerNotes );
        
        CustomerEquipment.populateListViews();
        
        // Handle a previous guided search option
        if( window.localStorage.getItem( "guidedSearch" )) {
        	var guidedSearchItem = "#" +  window.localStorage.getItem( "guidedSearch" );
        	$( guidedSearchItem ).click();
        	
        	window.localStorage.removeItem( "guidedSearch" );
        } 
        
        // Handle a previous sort option
        if( window.localStorage.getItem( "sortValue" )) {
        	$( "#sortList" ).val( window.localStorage.getItem( "sortValue" ) );
			window.localStorage.removeItem( "sortValue" );
        }
        
        // Adjust the style for the search form that appears at the top of the
        // customer equipment list
        var customerListSearchFormStyle = {
            'margin-left'  : '0px',
            'margin-right' : '0px',
            'margin-top'   : '0px',
            'border-style' : 'none'
        };
        $(".ui-listview-filter").css( customerListSearchFormStyle );
        
        // This MUST be the last line inside each page specific init function
        UIFrame.postPageSpecificInit( pageId );
    });
});
