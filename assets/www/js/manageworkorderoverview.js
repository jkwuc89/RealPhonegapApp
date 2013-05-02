/**
 * manageworkorderoverview.js
 */

"use strict";

/**
 * ManageWorkOrderOverview object
 */
var ManageWorkOrderOverview = function() {

    // Has the equipment been changed?
    var equipmentChanged = false;

    /**
     * After the PhoneGap deviceready event fires, run postLoadFn()
     */
    document.addEventListener( "deviceready", onDeviceReady, false );
    function onDeviceReady() {
        debug && console.log( "ManageWorkOrderOverview.onDeviceReady: Running postLoadFn" );
        postLoadFn();
    }

    /**
     * After the overview page loads on Chrome Desktop, run postLoadFn()
     */
    $(window).load( function() {
        if ( Util.isRunningOnChromeDesktop() ) {
            debug && console.log( "ManageWorkOrderOverview.window.load: Running postLoadFn" );
            postLoadFn();
        } else {
            debug && console.log( "ManageWorkOrderOverview.window.load: App running on tablet. postLoadFn skipped." );
        }
    });

    /**
     * Set the original work order values in local storage.  This allows
     * the manage work order pages to verify values that require a change or require confirmation.
     */
    function setOriginalWorkOrderValues() {
        // When the current work order changes, save the current hour meter
        // value inside local storage.  This will be used by the repair details
        // page to suppress some of the "hour meter unchanged" prompts.
        var originalHourMeterValue = ManageWorkOrder.getWorkOrder().workOrderSegments[0].hourMeter;
        debug && console.log( "ManageWorkOrderOverview.setOriginalHourMeter: Saving original hour meter value: " +
            originalHourMeterValue );
        window.localStorage.setItem( ManageWorkOrder.LS_ORIGINAL_HOUR_METER_VALUE, originalHourMeterValue );

        // Set the billing folder verified flag to false which forces the tech to confirm
        // the folder selection on the repair details page.
        WorkOrder.setBillingFolderVerified( false );
    }

    /**
     * This function is executed after the page loads on Chrome Desktop
     * or when the onDeviceReady event fires on the tablet.
     */
    function postLoadFn() {
        var manageWorkOrderId;
        var workOrdersChanged;
        debug && console.log( "ManageWorkOrderOverview.postLoadFn: Running..." );
        // Do not clear the unsaved changes flag if an equipment change was done
        JSONData.setUnsavedChanges( equipmentChanged, "manageWorkOrderSave" );
        UIFrame.showElement( "div#manageWorkOrderOverviewPageContent", "block" );

        // Use "Add Equipment" for change equipment button if work order has no equipment assigned
        if ( ManageWorkOrder.getEquipment().missing ) {
            $( "#changeEquipment" ).find( "span.ui-btn-text" ).text( Localization.getText( "addEquipment" ) );
        }

        // Set the navigate to page save changes function
        UIFrame.setNavigateToPageSaveChangesFunction( saveWorkOrder );

        WorkOrder.displayWorkOrderChangedAlert( ManageWorkOrder.getWorkOrder(), function() {
            var currentActivity = WorkOrder.getManageWorkOrderActivity();
            // Set the current work order ID if manage work order is being opened in writable mode
            // and its not being edited
            if ( !ManageWorkOrder.isReadOnly() && currentActivity == WorkOrder.MANAGE_WORK_ORDER_OPEN ) {
                manageWorkOrderId = ManageWorkOrder.getWorkOrder().webId;
                setOriginalWorkOrderValues();
                // First time into this page, these won't match when opening a different work order.
                // This causes the code inside the block to execute.  When the page reloads after the post,
                // these will match causing the else block below to execute.
                if ( WorkOrder.getCurrentWorkOrderId() != manageWorkOrderId ) {
                    debug && console.log( "ManageWorkOrderOverview.postLoadFn: Setting current work order ID to " + manageWorkOrderId );
                    workOrdersChanged = WorkOrder.setCurrentWorkOrderId( manageWorkOrderId );
                    // Update the current work order in the footer
                    UIFrame.updateCurrentWorkOrderStatus();

                    // Reload the work order to pick up the status change and refresh
                    // the manage work order header
                    ManageWorkOrder.loadWorkOrder();
                    ManageWorkOrder.populateHeader();

                    // Post the work orders affected by the status changes
                    WorkOrder.postWorkOrders( workOrdersChanged, function() {
                        debug && console.log( "ManageWorkOrderOverview.postLoadFn: Changed work orders posted to middle tier" );
                        UIFrame.reloadCurrentPage();
                    });
                } else {
                    // Post any saved technician clockings.  This takes care of posting a closed
                    // non-productive clocking resulting from opening a work order.
                    JSONData.postSavedTechnicianClockings( function() {
                        debug && console.log( "ManageWorkOrderOverview.postLoadFn: postSavedTechnicianClockings complete" );
                    });
                }
            } else if ( currentActivity == WorkOrder.MANAGE_WORK_ORDER_EDIT ||
                        currentActivity == WorkOrder.MANAGE_WORK_ORDER_OPEN_NOCLOCKING ) {
                setOriginalWorkOrderValues();
            }
        });
    }

    /**
     * Init this object
     */
    function init() {
        debug && console.log( "ManageWorkOrderOverview.init" );
        ManageWorkOrder.init();

        // Set the periodic JSON feed update complete function for this page
        JSONData.setPageSpecificPeriodicUpdateCompleteFn( periodicJSONFeedUpdateCompleteFn );
    }

    /**
     * This function is called by JSONData.periodicJSONUpdateComplete() when
     * a periodic JSON feed update is complete.  It allows this page to
     * react to changes that the JSON feed update brought in.
     */
    function periodicJSONFeedUpdateCompleteFn( dataType ) {
        if ( dataType && dataType == "workOrders" ) {
            debug && console.log( "ManageWorkOrderOverview.periodicJSONFeedUpdateCompleteFn: Checking for work order updates" );
            ManageWorkOrder.loadWorkOrder();
            var workOrder = ManageWorkOrder.getWorkOrder();
            if ( workOrder ) {
                WorkOrder.displayWorkOrderChangedAlert( workOrder, function() {
                    debug && console.log( "ManageWorkOrderOverview.periodicJSONFeedUpdateCompleteFn: Local changes retained after JSON feed update" );
                });
            }
        }
    }

    /**
     * populatePage
     * Populate the work order overview page
     * @param pageId - Page ID for manage work order page being populated
     */
    function populatePage( pageId ) {
        debug && console.log( "ManageWorkOrderOverview.populatePage: Populating the page" );

        // Populate the common parts of manage work order
        ManageWorkOrder.populatePage( pageId );

        // Hide the save button
        $("#manageWorkOrderSave").hide();

        // Populate the customer and contact information
        var workOrder   = ManageWorkOrder.getWorkOrder();
        var customer    = ManageWorkOrder.getCustomer();
        var equipment   = ManageWorkOrder.getEquipment();

        // Set up the clicking bindings
        ManageWorkOrder.viewModel.changeContact = changeContact;
        ManageWorkOrder.viewModel.changeEquipment = changeEquipment;
        ManageWorkOrder.viewModel.saveWorkOrder = saveWorkOrder;
        ManageWorkOrder.viewModel.selectContact = selectContact;

        // Overview page is writable if WO is not read only and it is not signed by the technician or
        // it's signed by the tech and the tech is editing the work order
        ManageWorkOrder.viewModel.writable = ko.observable( ManageWorkOrder.isWritable() );

        // Is the change equipment button visible?
        ManageWorkOrder.viewModel.isChangeEquipmentVisible = ko.computed( function() {
            return ( ManageWorkOrder.viewModel.writable() &&
                     !WorkOrder.isPMWorkOrder( ManageWorkOrder.getWorkOrder()) );
        });

        // Are we loading this page after a customer selected new equipment?
        var newEquipmentId = window.localStorage.getItem( JSONData.LS_WORK_ORDER_SELECTED_EQUIPMENT_ID );
        if ( newEquipmentId ) {
        	var oldEquipment = null;
        	if ( ManageWorkOrder.getEquipment() ) {
        		oldEquipment = ManageWorkOrder.getEquipment();
        	}
        	
        	// Do nothing if the old and new equipment are the same
        	if( newEquipmentId != oldEquipment.webId ) {
                JSONData.getObjectFromDatabaseById( "equipment", newEquipmentId, function( equipmentFromDB ) {
                	equipment = equipmentFromDB;
                	
                    ManageWorkOrder.setEquipment( equipmentFromDB );
                    ManageWorkOrder.viewModel.equipment = ko.mapping.fromJS( equipmentFromDB );
                    ManageWorkOrder.viewModel.workOrder.workOrderSegments()[0].hourMeter = equipment.hourMeter;
                    debug && console.log( "ManageWorkOrderOverview.populatePage: New equipment selected for work order: " +
                                          JSON.stringify( equipmentFromDB ) );

                    ko.applyBindings( ManageWorkOrder.viewModel );
                    
                    // Update the special text fields that aren't initialized by the viewModel
                    equipment.hourMeter ? 
                    	$("#hourMeter").text( Localization.formatNumber( equipment.hourMeter, "n0" ) ) :
                    	$("#hourMeter").text( "" );
                    
                    JSONData.isEquipmentUnderWarranty( equipment ) ?
                        $("#warranty").text( Localization.getText( "yes" ) ) :
                        $("#warranty").text( Localization.getText( "no" ) );

                    JSONData.setUnsavedChanges( true, "manageWorkOrderSave" );
                    equipmentChanged = true;

                    // Use "Change Equipment" for change equipment button after equipment change
                    $( "#changeEquipment" ).find( "span.ui-btn-text" ).text( Localization.getText( "changeEquipment" ) );
                });
        	} else {
                ko.applyBindings( ManageWorkOrder.viewModel );
        	}
        	
            window.localStorage.removeItem( JSONData.LS_WORK_ORDER_SELECTED_EQUIPMENT_ID );
        } else {
            ko.applyBindings( ManageWorkOrder.viewModel );	
        }

        // Display the customer notes
        var customerNotes = JSONData.getFilteredObjectList( "notes", function( noteInList ) {
            return noteInList.customerId == customer.webId;
        });
        if ( customerNotes ) {
            var notesHtml = "";
            for ( var noteIndex = 0; noteIndex < customerNotes.length; noteIndex++ ) {
                notesHtml = notesHtml.concat( "<span>" + customerNotes[noteIndex].message + "</span><br/>" );
            }
            $("#customerInstructions").append( notesHtml );
        }

        // Populate the rest of the fields that require localization or some logic to get their values
        if ( equipment.nextPMDate ) {
            var pmContractYorN = ( new Date( equipment.nextPMDate ) >= new Date() ? Localization.getText( "yes" ) : Localization.getText( "no") );
            $("#pmContractYorN").text( pmContractYorN );
            $("#nextPMDate").text( Localization.formatDateTime( equipment.nextPMDate, "d" ) );
        }
        if ( equipment.lastServiceDate ) {
            $("#lastServiceDate").text( Localization.formatDateTime( equipment.lastServiceDate, "d" ) );
        }

        // Used merged standard code information if it's available
        if ( workOrder.workOrderSegments[0].standardJobCode ) {
            debug && console.log( "ManageWorkOrderOverview.populatePage: Using standard job code info from merged work order" );
            $("#jobCode").text( workOrder.workOrderSegments[0].standardJobCode.completeJobCode );
            $("#jobCodeDescription").text( workOrder.workOrderSegments[0].standardJobCode.description );
        } else {
            // Otherwise, query the DB for it
            debug && console.log( "ManageWorkOrderOverview.populatePage: Using standard job code info from the DB" );
            JSONData.getObjectFromDatabaseById( "standardJobCodes", workOrder.workOrderSegments[0].standardJobCodeId,
                function( standardJobCode ) {
                    if ( standardJobCode ) {
                        $("#jobCode").text( standardJobCode.completeJobCode );
                        $("#jobCodeDescription").text( standardJobCode.description );
                    } else {
                        // Standard job code information is hidden if work order does not have a standard job code
                        $("#standardJobCodeInfo").hide();
                    }
                }
            );
        }

        JSONData.isEquipmentUnderWarranty( equipment ) ?
            $("#warranty").text( Localization.getText( "yes" ) ) :
            $("#warranty").text( Localization.getText( "no" ) );
        if ( equipment.hourMeter ) {
            $("#hourMeter").text( Localization.formatNumber( equipment.hourMeter, "n0" ) );
        }
        $("#workOrderDate").text( Localization.formatDateTime( workOrder.workOrderSegments[0].dateOpened, "d" ) );
        $("#openWorkOrdersCount").text( Localization.formatNumber( WorkOrder.getWorkOrderCountForCustomer( null, customer.webId ), "n0" ) );
        $("#openPMsDueCount").text( Localization.formatNumber( JSONData.getPMCountForCustomer( null, customer.webId, true ), "n0" ) );
    }

    /**
     * Change the contact information for this work order
     */
    function changeContact( id ) {
        if( JSONData.isTechnicianTraveling() ) {
            $( '#contactName' ).blur();
            $( '#contactNumber' ).blur();
            Dialog.showConfirmYesNo( Localization.getText( "technicianStatusTraveling" ),
                                     Localization.getText( "contactChangeTravelNavAlert" ),
                function() {
                    Dialog.closeDialog( false );
                    Clocking.switchTravelToProductive();
                },
                function() {
                    // Since we cannot disable a field and trigger this onClick method, enforce the blur event for the contact fields
                    Dialog.closeDialog( false );
                }, "400px" );
        }
    }

    /**
     * Change the equipment for the work order
     */
    function changeEquipment() {
        debug && console.log( "ManageWorkOrderOverview.changeEquipment: Loading customer equipment page" );
        var completeNativationFn = function() {
            // Pass customer ID to customer equipment page
            window.localStorage.setItem( JSONData.LS_CURRENT_CUSTOMER_ID, ManageWorkOrder.getCustomer().webId );
            // Let customer equipment page know that it's being used for equipment selection
            window.localStorage.setItem( JSONData.LS_WORK_ORDER_EQUIPMENT_SELECTION, true );
            UIFrame.navigateToPage( "customerequipment.html", false, null );
        };

        // Prevent changes to equipment while the current time is set to traveling
        if ( JSONData.isTechnicianTraveling() ) {
                Dialog.showConfirmYesNo( Localization.getText( "technicianStatusTraveling" ),
                                         Localization.getText( "equipmentChangeTravelNavAlert" ),
                    function() {
                        // SFAM-297: Switch to productive clocking and complete the navigation
                        Dialog.closeDialog( false );
                        Clocking.switchTravelToProductive();
                        completeNativationFn();
                    }, null, "400px" );
        } else {
            completeNativationFn();
        }
    }

    /**
     * Mark the overview page as "dirty" when the contact information is changed
     */
    function onChangeContact() {
        JSONData.setUnsavedChanges( true, "manageWorkOrderSave" );
    }

    /**
     * Select a contact for the work order using a pop-up dialog that
     * displays a list of available contacts
     */
    function selectContact() {
        var openSelectContactDlgFn = function() {
            debug && console.log( "ManageWorkOrderOverview.selectContact: Display work order contact selection dialog" );
            var dialogPrompt = Localization.getText( "selectWorkOrderContactPrompt" ).replace( "workOrder", ManageWorkOrder.getWorkOrder().documentNumber );
            var dialogHtml = new EJS({url: 'templates/selectworkordercontactdialog' }).render( {
                dialogPrompt : dialogPrompt
            });
            Dialog.showDialog({
                mode : 'blank',
                blankContent : dialogHtml,
                width: '600px'
            });

            // Apply the dialog's knockout bindings
            ManageWorkOrder.viewModel.selectedContact = ko.observable("");
            ManageWorkOrder.viewModel.saveSelectedContact = saveSelectedContact;
            ko.applyBindings( ManageWorkOrder.viewModel, $("#selectWorkOrderContactDialog")[0] );
        };

        if ( JSONData.isTechnicianTraveling() ) {
            Dialog.showConfirmYesNo( Localization.getText( "technicianStatusTraveling" ),
                                     Localization.getText( "selectContactTravelNavAlert" ),
                function() {
                    Dialog.closeDialog( false );
                    Clocking.switchTravelToProductive();
                    openSelectContactDlgFn();
                }, null, "400px" );
        } else {
            openSelectContactDlgFn();
        }
    }

    /**
     * Save the selected contact information into the work order
     */
    function saveSelectedContact() {
        debug && console.log( "ManageWorkOrderOverview.saveSelectedContact: Saving selected contact " +
                              JSON.stringify( ManageWorkOrder.viewModel.selectedContact() ) + " into the work order" );
        Dialog.closeDialog( false );
        ManageWorkOrder.viewModel.workOrder.contactName( ManageWorkOrder.viewModel.selectedContact().name );
        ManageWorkOrder.viewModel.workOrder.contactNumber( ManageWorkOrder.viewModel.selectedContact().number );
        JSONData.setUnsavedChanges( true, "manageWorkOrderSave" );
    }

    /**
     * Save the work order
     * @param postToMiddleTierAfterSave - Boolean, post to middle tier after save? Default = true
     */
    function saveWorkOrder( postToMiddleTierAfterSave ) {
        var workOrder = ManageWorkOrder.getWorkOrder();
        if ( typeof postToMiddleTierAfterSave == "undefined" ) {
            postToMiddleTierAfterSave = true;
        }
        debug && console.log( "ManageWorkOrderOverview.saveWorkOrder: Saving equipment change for work order " + workOrder.documentNumber );
        workOrder.contactName = ManageWorkOrder.viewModel.workOrder.contactName();
        workOrder.contactNumber = ManageWorkOrder.viewModel.workOrder.contactNumber();
        if ( !ManageWorkOrder.viewModel.equipment.missing ) {
            workOrder.workOrderSegments[0].equipmentId = ManageWorkOrder.viewModel.equipment.webId();
            workOrder.workOrderSegments[0].equipment = ManageWorkOrder.getEquipment();
            workOrder.workOrderSegments[0].hourMeter = ManageWorkOrder.getEquipment().hourMeter;
            
            // When the equipment is changed and saved for this work order, update the original hour meter value
            window.localStorage.setItem( ManageWorkOrder.LS_ORIGINAL_HOUR_METER_VALUE, ManageWorkOrder.getEquipment().hourMeter );
        }
        workOrder.postToMiddleTierRequired = true;
        JSONData.saveJSON( "workOrders", workOrder, true );
        JSONData.setUnsavedChanges( false, "manageWorkOrderSave" );
        if ( postToMiddleTierAfterSave ) {
            WorkOrder.postWorkOrder( workOrder, true, true, function( updatedWorkOrder ) {
                debug && console.log( "ManageWorkOrderOverview.saveChanges: Work order " +
                                      updatedWorkOrder.documentNumber + " successfully posted to middle tier" );
                WorkOrder.displayWorkOrderChangedAlert( updatedWorkOrder );
            }, null );
        }

        // Navigate to a page after save completes.  If page is not saved in local storage, this
        // call does nothing
        UIFrame.navigateToPageAfterSaveCompletes();
    }

    return {
        'init'                              : init,
        'onChangeContact'                   : onChangeContact,
        'populatePage'                      : populatePage
    };
}();

/**
 * pageinit event handler
 */
$("div:jqmData(role='page')").on( "pageinit", function( event, ui ) {
    // All pages must set pageId to this.id
    var pageId = this.id;
    debug && console.log( "ManageWorkOrderOverview.pageinit" );
    UIFrame.init( pageId, function() {
        debug && console.log( "ManageWorkOrderOverview.pageinit: Executing page specific init" );
        ManageWorkOrderOverview.init();
        ManageWorkOrderOverview.populatePage( pageId );

        // This MUST be the last line inside each page specific init function
        UIFrame.postPageSpecificInit( pageId );
    });
});

