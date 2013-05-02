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
	// Constants
	var NEW_EMPTY_WORK_ORDER = 0;
	
    var equipmentArray = null,
        customerId = null,
        guidedSearch = "",
        allEquipment = null,
        defaultListItems = "",
        currentCustomer = null,
        customerEquipment = null,
        selectedWorkOrderType = 0,
        currentCustomerAddress =  null,
        currentCustomerMainContact =  null,
        sortCriteria = "sortByManufacturer",
        currentCustomerMainCommDetail = null,
        customerInfoArea = $( "#customerSelectionListArea" ),
        pms = JSONData.getObjectsByDataType( "pmSchedules" ),
        workOrders = JSONData.getObjectsByDataType( "workOrders" ),
        manufacturers = JSONData.getObjectsByDataType("manufacturers");

    var isSelectingEquipmentForWorkOrder = false;

    /**
     * Use the window load event to populate the equipment list with equipment
     * information from the DB.
     */
    $(window).load( function() {
        debug && console.log( "CustomerEquipment.init: Loading equipment from the database.");
        Dialog.showPleaseWait( Localization.getText( "equipment" ), Localization.getText( "loadingEquipmentFromDB" ), '400px' );
        JSONData.getEquipmentFromDatabaseForCustomer( customerId, function( equipmentFromDB ) {
            Dialog.closeDialog();
            debug && console.log( "CustomerEquipment.init: Equipment loaded from database. List views will now be populated.");
            $("#loadingEquipmentFromDB").hide();
            equipmentArray = equipmentFromDB;
            CustomerEquipment.populateListViews();
            UIFrame.adjustListViewBorders();
        });
    });

    /**
     * One time initialization of the customer equipment page
     */
    var init = _.once( function() {
        // Retrieve the required customerId from local storage
        customerId = window.localStorage.getItem( JSONData.LS_CURRENT_CUSTOMER_ID );
    });

    /**
     * Bind a click listener for the customer equipment list items
     */
    function bindListItemClickHandler() {
        $('.customer-list-item').click( function() {
            var equipmentWebId = this.id.substring( 9 );
            debug && console.log( "CustomerEquipment.populateListViews: User selected equipment item: " + equipmentWebId );
            // Save the equipment web id in localstorage and open the equipment details page
            var equipmentId = this.id.match( /equipment(\w+)/ )[1];
            if ( isSelectingEquipmentForWorkOrder ) {
                debug && console.log( "CustomerEquipment.listItemClickHandler: Navigating to manage WO overview page with equipment ID: " + equipmentId );
                window.localStorage.setItem( JSONData.LS_WORK_ORDER_SELECTED_EQUIPMENT_ID, equipmentId );
                UIFrame.navigateToPage( "manageworkorderoverview.html", false, null );
            } else {
                window.localStorage.setItem( "equipmentId", equipmentId );
                window.localStorage.setItem( JSONData.LS_CURRENT_CUSTOMER_ID, customerId );
                window.localStorage.setItem( "guidedSearch", guidedSearch );
                window.localStorage.setItem( "sortValue", $( "#sortList" ).val() );

                UIFrame.navigateToPage( "equipmentdetail.html", false, null );
            }
        });
    }

    /**
     * Populate the customer list
     */
    function populateListViews( customerEquipmentList, repopulatingList ) {
        var workOrder;
        debug && console.log( "CustomerEquipment.populateListViews: Populating the customers list" );

        // This page loads differently and acts differently if it is being used to select equipment
        if ( window.localStorage.getItem( JSONData.LS_WORK_ORDER_EQUIPMENT_SELECTION ) ) {
            isSelectingEquipmentForWorkOrder = true;
            window.localStorage.removeItem( JSONData.LS_WORK_ORDER_EQUIPMENT_SELECTION );
            debug && console.log( "CustomerEquipment.populateListViews: Customer equipment page being used for equipment selection" );

            // Replace the Done button with the Cancel button
            $("#doneButtonSection").hide();
            $("#cancelButtonSection").show();

            // We are setting the title manually so don't translate it
            workOrder = WorkOrder.getManageWorkOrder();
            var title = Localization.getText( "selectEquipmentForWorkOrder" ) + " " + workOrder.documentNumber;
            var htmlPageId = $("div:jqmData(role='page')").attr( "id" );
            $("h1#" + htmlPageId).text( title );
            $("h1#" + htmlPageId).attr( "translate", "no" );
        }

        if( customerEquipmentList && customerEquipmentList.length >= 0 ) {
            customerEquipment = customerEquipmentList;
        } else {
            // Save a one-time reference for the customer equipment
            allEquipment = customerEquipment = _.sortBy( equipmentArray, function( currentEquipment ) {
                return currentEquipment.manufacturer + currentEquipment.productCode + currentEquipment.serialNumber;
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

        if ( !repopulatingList ) {
            currentCustomer = JSONData.getObjectById( "customers", customerId, null );
            if ( !currentCustomer ) {
                JSONData.handleDataMissingError( "customer", customerId );
            } else {
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

                workOrderCount = WorkOrder.getWorkOrderCountForCustomer( workOrders, currentCustomer.webId );
                pmsDueCount = JSONData.getPMCountForCustomer( pms, currentCustomer.webId, true );

                if ( currentCustomerAddress.communicationDetails && currentCustomerAddress.communicationDetails.length > 0 ) {
                    currentCustomerMainCommDetail = JSONData.getMainCommunicationDetails( currentCustomerAddress.communicationDetails );
                }

                // Add the customer to the customer selection list
                customerInfoArea.append( currentCustomerListItem.render({
                    customer: currentCustomer,
                    mainContact: currentCustomerMainContact,
                    address : currentCustomerAddress,
                    communicationDetail: currentCustomerMainCommDetail,
                    pmsCount: pmsDueCount,
                    woCount: workOrderCount
                }));
            }
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
                manufacturerInternalId = currentEquipment.manufacturer;

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
                workOrderCount = WorkOrder.getWorkOrderCountForEquipment( workOrders, currentEquipment.webId );
                pmsDueCount = JSONData.getPMCountForEquipment( pms, currentEquipment.webId, true );

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

        bindListItemClickHandler();

        if ( repopulatingList ) {
            UIFrame.adjustListViewBorders();
        }
    }

    /**
     * Guided search click handler for the customer equipment list page
     */
    function guidedSearchClickHandler() {
        debug && console.log( "CustomerEquipment.guidedSearchClickHandler" );

        var filteredCustomerEquipment = null;
        guidedSearch = this.id;

        // Find the relevant guided search filter
        if( this.id.indexOf("model") != -1 ) {
            var model = this.id.match( /model([\w\-\d\/]+)/ )[1];

            debug && console.log( "CustomerEquipment.guidedSearchClickHandler: Filtering customer equipment by model: " + model );
            filteredCustomerEquipment = _.filter( allEquipment, function( currentEquipment ) {
                if( !_.isNull( currentEquipment.rentalCustomerId )) {
                    return currentEquipment.rentalCustomerId == customerId && currentEquipment.productCode == model;
                }
                return currentEquipment.ownerId == customerId && currentEquipment.productCode == model;
            });
            // Filter by manufacturer
        } else if( this.id.indexOf("mfg") != -1 ) {
            var mfgId = this.id.match( /mfg([\w\-\d\/\&]+)/ )[1];

            debug && console.log( "CustomerEquipment.guidedSearchClickHandler: Filtering customer equipment by manufacturer: " + mfgId );
            filteredCustomerEquipment = _.filter( allEquipment , function( currentEquipment ) {
                if( !_.isNull( currentEquipment.rentalCustomerId )) {
                    return currentEquipment.rentalCustomerId == customerId && currentEquipment.manufacturer == mfgId
                }

                return currentEquipment.ownerId == customerId && currentEquipment.manufacturer == mfgId;
            });
        } else if( this.id.indexOf( "openPeriodicMaintenanceGuidedSearch" ) != -1 ) {
            debug && console.log( "CustomerEquipment.guidedSearchClickHandler : Filtering customer equipment using open PM filtering" );
            var pmsDueCount = 0;
            filteredCustomerEquipment = _.filter( allEquipment , function( currentEquipment ) {
                pmsDueCount = _.filter( pms, function( pm ) {
                    return ( pm.equipmentId == currentEquipment.webId &&
                             JSONData.isPMBeforeCutoffDate( pm ) );
                });
                return pmsDueCount.length > 0;
            });
        } else if( this.id.indexOf("openWorkOrdersGuidedSearch") != -1 ) {
            debug && console.log( "CustomerEquipment.guidedSearchClickHandler : Filtering customer equipment using open WO filtering" );
            filteredCustomerEquipment = _.filter( allEquipment, function( currentEquipment ) {
                return ( WorkOrder.getWorkOrderCountForEquipment( workOrders, currentEquipment.webId ) > 0 )
            });
        }

        // Check the length of the filtered customer equipment list
        if ( filteredCustomerEquipment == null ) {
            filteredCustomerEquipment = [];
        }

        populateListViews( filteredCustomerEquipment, true );
        UIFrame.changeListFilter( "" );

        UIFrame.refreshGuidedSearchWithSelectedItem( this, clearGuidedSearch );

        // Adjust the list view borders after the guided search is applied
        UIFrame.adjustListViewBorders();
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

        bindListItemClickHandler();

        UIFrame.resetGuidedSearch( this );
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
                return currentEquipment.manufacturer;
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
                additionalContactsString += "<li data-theme='c' style='border-left: none; border-right: none;'><a href='#' onclick='CustomerEquipment.displayContactInformation(" + '"' +
                currentContact.webId + '"' + ")' style='font-size: large;'>" + currentContact.firstName + " " + currentContact.lastName + "</a></li>";
                additionalFound = true;
            }
        }

        if( additionalFound ) {
            additionalContactsString += "<br />";

            var additionalContactsPopup = new EJS({ url: 'templates/additionalcontactspopup'}).render({
                additionalContactsString: additionalContactsString
            });

            Dialog.showDialog({
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

        Dialog.closeDialog();

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
            return detail.type == JSONData.COMM_DETAIL_TYPE_CELL;
        });
        homePhone = _.find( commDetails, function( detail ) {
            return detail.type == JSONData.COMM_DETAIL_TYPE_PHONE;
        });
        workPhone = _.find( commDetails, function( detail ) {
            return detail.type == JSONData.COMM_DETAIL_TYPE_PHONE;
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

        Dialog.showDialog({
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

            Dialog.showDialog({
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
        } else if ( isSelectingEquipmentForWorkOrder ) {
            UIFrame.navigateToPage( "manageworkorderoverview.html" );
        } else {
            UIFrame.navigateToPage( "customers.html" );
        }
    }
    
    /**
     * Function to prompt the user to create a new work order
     */
    function newWorkOrder() {
        var cancelFn = function() {
            debug && console.log( "CustomerEquipment.newWorkOrder.cancelFn: New work order creation canceled" );
            Dialog.closeDialog( false );
        };
        var saveFn = function() {
            debug && console.log( "CustomerEquipment.newWorkOrder.saveFn: Saving new work order" );
            saveNewWorkOrder();
        };
        WorkOrder.displayNewWorkOrderDialog( WorkOrder.NEW_WORK_ORDER_DIALOG_TYPES.EMPTY, saveFn, cancelFn );
    }
    
    /**
     * Create and save a new work order
     */
    function saveNewWorkOrder() {
        var newWorkOrder = WorkOrder.createNewWorkOrder();
        newWorkOrder.customerId = customerId;
        newWorkOrder.dateOpened  = Util.getISOCurrentTime();
        newWorkOrder.addressId = currentCustomer.mainAddressId;
        newWorkOrder.workOrderSegments[0].branchId = currentCustomer.branchId;
        newWorkOrder.workOrderSegments[0].equipmentId = null;
        newWorkOrder.workOrderSegments[0].hourMeter = null;
        newWorkOrder.workOrderSegments[0].odometer = null;
        WorkOrder.populateNewWorkOrderFromDialog( newWorkOrder );

        // Create the work order for JSON storage
        JSONData.saveJSON( "workOrders", newWorkOrder, true );

        // clear the previous page's guided search status
        window.localStorage.setItem( "guidedSearch", "" );
        window.localStorage.setItem( "sortValue",  "" );

        window.localStorage.setItem( JSONData.LS_INITIAL_WORK_ORDER_LIST_FILTER, newWorkOrder.webId );

        Dialog.closeDialog( false );
        UIFrame.navigateToPage( "workorderlist.html", false, null );
    }

    return {
        'displayAdditionalContacts' : displayAdditionalContacts,
        'displayContactInformation' : displayContactInformation,
        'displayCustomerNotes'      : displayCustomerNotes,
        'doneButtonHandler'         : doneButtonHandler,
        'init'                      : init,
        'newWorkOrder'              : newWorkOrder,
        'populateListViews'         : populateListViews,
        'saveNewWorkOrder'          : saveNewWorkOrder
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
        $('.headerIcon').hide();
        $('#tasksMenuDiv').hide();

        // Bind the listeners for the done buttons
        $('#btnDone').click( CustomerEquipment.doneButtonHandler );
        $('#btnCancel').click( CustomerEquipment.doneButtonHandler );

        // Bind the listener to show the list of additional contacts
        $('#additionalContactsButton').click( CustomerEquipment.displayAdditionalContacts );

        // Bind the listener to show the equipment notes
        $('#notesButton').click( CustomerEquipment.displayCustomerNotes );

        // Bind the listener to create a new work order
        $('#newButton').click( CustomerEquipment.newWorkOrder );

        CustomerEquipment.init();

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
