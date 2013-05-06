/**
 * manageworkorderrepairwork.js
 */

"use strict";

/**
 * ManageWorkOrderParts object
 */
var ManageWorkOrderParts = function() {

    // Available actions for the select part location dialog
    var ADD_NEW_PART = "ADD_NEW_PART";
    var CHANGE_PART_QTY = "CHANGE_PART_QTY";
    var CHANGE_PART_LOCATION = "CHANGE_PART_LOCATION";

    // PSRT model cross reference
    var psrtModelCrossReference = null;

    // Holds list of all stock areas
    var stockAreaArray = [];

    // Local storage flag to indicate that inventory add page was opened to add parts
    var LS_INVENTORY_ADD_OPENED = "vanInventoryAddOpened";

    // Local storage location for number of parts in part list.  This allows us to
    // show the Save button if parts are added on the inventory page
    var LS_PART_COUNT = "partCount";

    /**
     * Knockout view model
     */
    var partsViewModel = {
        isQueryingInventory : ko.observable( true ),
        outsidePurchasePartList : ko.observableArray([]),
        outsidePurchaseReceipt : ko.observable(""),
        partNumber : ko.observable( "" ),
        parts : ko.observableArray([]),
        quantity : ko.observable( 1 ),
        selectedMfg : ko.observable( "" ),
        writable : ko.observable( false ),
        // Click handler for deleting a part from the list
        deletePart : deletePartFromList,
        // Click handler for the adding a part from the header information
        addPartFromHeader : quickAddPartHandler,
        // Click handler for decrementing a part's quantity inside the part header
        decrementQtyInHeader : function() {
            debug && console.log( "ManageWorkOrderParts.decrementQtyInHeader: Decrementing quantity in part header" );
            var newQty = parseInt( this.quantity() ) - 1;
            if ( newQty < 1 ) {
                newQty = 1;
            }
            this.quantity( newQty );
        },
        // Click handler for incrementing a part's quantity inside the part header
        incrementQtyInHeader : function() {
            debug && console.log( "ManageWorkOrderParts.incrementQtyInHeader: Incrementing quantity in part header" );
            var newQty = parseInt( this.quantity() ) + 1;
            this.quantity( newQty );
        },
        // Click handler for decrementing a part's quantity inside the part list
        decrementPartQtyInList : function( part, event ) {
            var newQty = parseInt( part.qtyOrdered() );
            if ( newQty > 1 ) {
                debug && console.log( "ManageWorkOrderParts.partsViewModel.decrementPartQtyInList: Decrementing quantity for " + part.product.productCode );
                part.qtyOrdered( parseInt(newQty - 1) );
                changePartQuantityInList( event.currentTarget.id );
            } else {
                debug && console.log( "ManageWorkOrderParts.partsViewModel.decrementPartQtyInList: Currenty qty = 1, decrement ignored" );
                part.qtyOrdered( parseInt(newQty) );
            }
        },
        // Click handler for incrementing a part's quantity inside the part list
        incrementPartQtyInList : function( part, event ) {
            debug && console.log( "ManageWorkOrderParts.partsViewModel.incrementPartQtyInList: Incrementing quantity for " + part.product.productCode );
            var newQty = parseInt( part.qtyOrdered() );
            part.qtyOrdered( parseInt(newQty + 1) );
            changePartQuantityInList( event.currentTarget.id );
        },
        // Is the part location link visible inside the parts list?
        isPartLocationLinkVisible : function( partIndex ) {
            debug && console.log( "ManageWorkOrderParts.partsViewModel.isPartsLocationVisible: Checking visibility for part index " + partIndex );
            var visible = false;
            if ( this.writable() ) {
                var part = this.parts()[partIndex];
                if ( part.inventoryId && part.writable() ) {
                    visible = true;
                }
            }
            return visible;
        },
        onPartLocationClick : changePartLocationInList,
        // Click handler for saving the changes
        saveChanges : saveChanges
    };

    // Part management state object.  This allows
    // methods inside this module to share information when
    // adding and editing parts in the list.
    var PartMgmtState = {
        inventoryInfoForPart : null,
        qtyAdjustmentForCurrentLocation : 0,
        qtyForNewLocation : 0,
        stockAreasForPart : [],
        totalQtyForPart : 0,
        vanInventoryForPart : null,
        vanQtyForPart : 0,
        woLineForPart : null,
        init : function() {
            this.inventoryInfoForPart = null;
            this.qtyAdjustmentForCurrentLocation = 0;
            this.qtyForNewLocation = 0;
            this.stockAreasForPart = [];
            this.totalQtyForPart = null;
            this.vanInventoryForPart = null;
            this.vanQtyForPart = 0;
            this.woLineForPart = null;
        }
    };

    // Local copy of inventory data
    var partsInventory = null;

    /**
     * After the PhoneGap deviceready event fires, run postLoadFn()
     */
    document.addEventListener( "deviceready", onDeviceReady, false );
    function onDeviceReady() {
        debug && console.log( "ManageWorkOrderParts.onDeviceReady: Calling postLoadFn" );
        postLoadFn();
    }

    /**
     * After this page loads on Chrome Desktop, run postLoadFn()
     */
    $(window).load( function() {
        if ( Util.isRunningOnChromeDesktop() ) {
            debug && console.log( "ManageWorkOrderParts.window.load: Calling postLoadFn" );
            postLoadFn();
        } else {
            debug && console.log( "ManageWorkOrderParts.window.load: App running on tablet. postLoadFn skipped." );
        }
    });

    /**
     * This function is executed after the page loads on Chrome Desktop
     * or when the onDeviceReady event fires on the tablet.
     * Use this function to determine if a periodic JSON feed update
     * is needed.  This allows PhoneGap to finish loading which makes
     * the LoadURL plugin available.  This fixes SFAM-173.
     */
    function postLoadFn() {
        debug && console.log( "ManageWorkOrderParts.postLoadFn: Running postLoadFn" );
        UIFrame.showElement( "div#manageWorkOrderPartsPageContent", "block" );

        // Set the navigate to page save changes function
        UIFrame.setNavigateToPageSaveChangesFunction( saveChanges );

        WorkOrder.displayWorkOrderChangedAlert( JSONData.getObjectById( "workOrders",
                                                                        ManageWorkOrder.getWorkOrder().webId, null ), null );
        if ( window.localStorage.getItem( LS_INVENTORY_ADD_OPENED ) ) {
            window.localStorage.removeItem( LS_INVENTORY_ADD_OPENED );
            var workOrderParts = _.filter( ManageWorkOrder.getWorkOrder().workOrderSegments[0].workOrderLines, function( workOrderLineInList ) {
                return workOrderLineInList.type == WorkOrder.WORK_ORDER_LINE_PART_TYPE;
            });
            if ( window.localStorage.getItem( LS_PART_COUNT ) != workOrderParts.length ) {
                debug && console.log( "ManageWorkOrderParts.postLoadFn: Inventory page changed parts list" );
                JSONData.setUnsavedChanges( ( window.localStorage.getItem( LS_PART_COUNT ) != workOrderParts.length ),
                                            "manageWorkOrderSave" );
            } else {
                // Inventory page made no changes...
                // Remove skip update flag when returning from inventory page
                debug && console.log( "ManageWorkOrderParts.postLoadFn: Inventory page did not change part list" );
                JSONData.setSkipJSONFeedUpdate( false );
            }
        } else {
            JSONData.setUnsavedChanges( false, "manageWorkOrderSave" );
        }
        window.localStorage.removeItem( LS_PART_COUNT );
    }

    /**
     * Init this object
     * @param pageId
     */
    function init( pageId ) {
        debug && console.log( "ManageWorkOrderParts.init" );
        ManageWorkOrder.init();

        // Set the periodic JSON feed update complete function for this page
        JSONData.setPageSpecificPeriodicUpdateCompleteFn( periodicJSONFeedUpdateCompleteFn );

        // Populate the page
        stockAreaArray = JSONData.getObjectsByDataType( "stockAreas" );
        ManageWorkOrderParts.populatePage( pageId );

        // Initialize the local file system.  This is needed for PSRT integration
        debug && console.log( "ManageWorkOrderParts.init: Initializing the local file system" );
        LocalFS.init();

        // Load the PSRT model cross reference data
        JSONData.loadJSON( "json/psrtModelCrossReference.json", function( data ) {
            debug && console.log( "ManageWorkOrderParts.init: PSRT model cross reference data loaded" );
            psrtModelCrossReference = data;
        });

        // Get the inventory data
        JSONData.getObjectsFromDatabase( "inventory", function( inventoryData ) {
            debug && console.log( "ManageWorkOrderParts.init: getObjectsFromDatabase returned " +
                                  inventoryData.length + " inventory objects" );
            partsInventory = inventoryData;
            partsViewModel.isQueryingInventory( false );
        });
    }

    /**
     * This function is called by JSONData.periodicJSONUpdateComplete() when
     * a periodic JSON feed update is complete.  It allows this page to
     * to update the work order part list after a JSON feed update
     */
    function periodicJSONFeedUpdateCompleteFn( dataType ) {
        if ( dataType && dataType == "workOrders" ) {
            // Repopulate the parts list after a JSON feed update
            ManageWorkOrder.loadWorkOrder();
            WorkOrder.displayWorkOrderChangedAlert( ManageWorkOrder.getWorkOrder(), function() {
                debug && console.log( "ManageWorkOrderParts.periodicJSONFeedUpdateCompleteFn: Repopulating parts list" );
                partsViewModel.parts.splice( 0, partsViewModel.parts().length );
                populatePartsList();
            });
        }
    }

    /**
     * Populate the parts list
     */
    function populatePartsList() {
        // Initial part list comes from the work order's line item array
        var workOrderParts = _.filter( ManageWorkOrder.getWorkOrder().workOrderSegments[0].workOrderLines, function( workOrderLineInList ) {
            return workOrderLineInList.type == WorkOrder.WORK_ORDER_LINE_PART_TYPE;
        });
        // Push the work order parts into the observable array
        if ( workOrderParts ) {
            debug && console.log( "ManageWorkOrderParts.populatePartsList: Work order contains " + workOrderParts.length + " parts" );
            var technicianUserId = JSONData.getTechnicianUserId();
            var currentWorkOrderPart = null;

            // KNOCKOUT DEMO
            // UNDERSTORE _.each DEMO
            _.each( workOrderParts, function( currentWorkOrderPart ) {
                // Make the part's location and the quantity observable before adding
                // the part to the observable array.
                var addPartToListFn = function( part ) {
                    debug && console.log( "ManageWorkOrderParts.addPartToListFn: Adding " + part.product.productCode +
                                              " to part list." );
                    part.qtyOrdered = ko.observable( part.qtyOrdered );
                    part.currentQty = part.qtyOrdered();
                    // A part is writable if its user ID matches the currently logged in technician
                    // and the lineStatus is false.
                    part.writable = ko.observable( true );
                    if ( part.userId ) {
                        part.writable( part.userId == technicianUserId );
                    }
                    if ( part.writable() &&
                        part.status != null && part.status != undefined ) {
                        part.writable( part.status == 0 );
                    }
                    partsViewModel.parts.push( part );
                };

                var addPartUsingInventoryDbTableFn = function( part ) {
                    debug && console.log( "ManageWorkOrderParts.addPartUsingInventoryDbTableFn: Adding " + part.product.productCode +
                                              " to part list using inventory DB table" );
                    JSONData.getObjectFromDatabaseById( "inventory", part.inventoryId, function( inventoryObj ) {
                        part.location =
                            ko.observable( JSONData.getInventoryLocationStringFromObj( inventoryObj ) );
                        addPartToListFn( part );
                    });
                };

                if ( currentWorkOrderPart.location ) {
                    currentWorkOrderPart.location = ko.observable( currentWorkOrderPart.location );
                    addPartToListFn( currentWorkOrderPart );
                } else {
                    if ( currentWorkOrderPart.product.productCode == WorkOrder.OUTSIDE_PART_PURCHASE_PRODUCE_CODE ) {
                        currentWorkOrderPart.location = ko.observable( Localization.getText( "outsidePurchasePartLocation" ) );
                        addPartToListFn( currentWorkOrderPart );
                    } else {
                        addPartUsingInventoryDbTableFn( currentWorkOrderPart );
                    }
                }
            });
        }
    }

    /**
     * populatePage
     * Populate the work order repair work page
     * @param pageId - Page ID for manage work order page being populated
     */
    function populatePage( pageId ) {
        debug && console.log( "ManageWorkOrderParts.populatePage: Populating the page" );

        // If running on Chrome Desktop, set the content div width to auto
        if ( Util.isRunningOnChromeDesktop() ) {
            $( "div.manage-work-order-parts-content" ).css( "width", $(document).width() - 164 );
        }

        ManageWorkOrder.populatePage( pageId );
        populatePartsList();

        // Set up the writable flag, the dirty flag and apply the knockout bindings
        partsViewModel.writable( ManageWorkOrder.isWritable() &&
                                 WorkOrder.getManageWorkOrderActivity() == WorkOrder.MANAGE_WORK_ORDER_OPEN ||
                                 WorkOrder.getManageWorkOrderActivity() == WorkOrder.MANAGE_WORK_ORDER_OPEN_NOCLOCKING );

        ko.applyBindings( partsViewModel );
        debug && console.log( "ManageWorkOrderParts.populatePage: Writable = " + partsViewModel.writable() );

        // Bind handler for add parts menu
        $("#addPartsMenu").change( addPartsFromMenu );
    }

    /**
     * Handling the onbeforeload event allows the app
     * fix the styles for the parts and repair details buttons
     */
    window.onbeforeunload = function() {
        $("#manageWorkOrderParts").addClass( "ui-btn-active" );
        $("#manageWorkOrderRepairDetails").removeClass( "ui-btn-active" );
    };

    /**
     * Handle taps on the add parts menu
     */
    function addPartsFromMenu() {
        debug && console.log( "ManageWorkOrderParts.addPartsFromMenu: " + this.value + " selected" );

        // this.value contains selected menu item
        switch ( this.value ) {
            case "addFromInventory" :
                openInventory();
                break;

            case "addFromPSRT" :
                if ( Util.isRunningOnChromeDesktop() ) {
                    addPSRTPartsToPartList();
                } else {
                    startPSRT();
                }
                break;

            case "addFromOutsidePurchase" :
                displayOutsidePurchaseDialog();
                break;
        }

        // Reset select control for parts menu after choice is made
        $("#addPartsMenu")[0].selectedOptions = [];
        _.each( $("#addPartsMenu").children( 'option' ), function( optionInList ) {
            optionInList.selected = false;
        });
    }

    /**
     * Change the inventory quantity for a part by the amount
     * specified inside the part object passed in
     * @param inventoryId
     * @param qty - quantity change
     * @param increaseQty - If true, inventory quantity is increased
     *                      If false, inventory quantity is decreased
     */
    function changeInventoryQtyForPart( inventoryId, qty, increaseQty ) {
        var inventoryForPart = _.find( partsInventory, function( inventoryInList ) {
            return inventoryInList.webId == inventoryId;
        });
        if ( inventoryForPart ) {
            if ( increaseQty ) {
                inventoryForPart.quantity += qty;
            } else {
                inventoryForPart.quantity -= qty;
            }
            inventoryForPart.changed = true;
            debug && console.log( "ManageWorkOrderParts.changeInventoryQtyForPart: Quantity for inventory ID " +
                                  inventoryId + ( increaseQty ? " increased" : " decreased" ) + " by " + qty +
                                  " to " + inventoryForPart.quantity );
        } else {
            debug && console.log( "ManageWorkOrderParts.changeInventoryQtyForPart: Inventory object does not exist" );
        }
    }

    /**
     * Create a new WorkOrderLine object for the specified product
     * @param product - Product JSON object
     * @returns WorkOrderLine JSON object for the product
     */
    function createWorkOrderLineForProduct( product ) {
        if ( !product ) {
            throw "ManageWorkOrderParts.createWorkOrderLineForProduct: Required parameter product is undefined";
        }
        var woLineForProduct = WorkOrder.createNewWorkOrderLine();
        woLineForProduct.type = WorkOrder.WORK_ORDER_LINE_PART_TYPE;
        woLineForProduct.product.webId = product.webId;
        woLineForProduct.product.productCode = product.productCode;
        woLineForProduct.product.manufacturer = partsViewModel.selectedMfg();
        woLineForProduct.description = product.description;
        return woLineForProduct;
    }

    /**
     * Handle part quantity changes inside the parts list.  This allows us
     * to adjust the location for the part.
     * @param qtyInputElement - Quantity input element that changed
     */
    function onPartQtyChanged( qtyInputElement ) {
        debug && console.log( "ManageWorkOrderParts.onPartQtyChanged: Quantity changed inside input element ID " + qtyInputElement.id );
        changePartQuantityInList( qtyInputElement.id );
    }

    /**
     * Display the part location selection dialog
     * @param action - String containing action associated the location made inside this dialog
     *                 (ADD_NEW_PART, CHANGE_PART_QTY, CHANGE_PART_LOCATION)
     * @param prompt - String containing ID of prompt to display in the dialog
     * @param partNumber
     */
    function displaySelectPartLocationDialog( action, prompt, partNumber ) {
        if ( !action || !prompt ) {
            throw "ManageWorkOrderParts.displaySelectPartLocationDialog: One or more required parameters (action, prompt) are undefined";
        }
        if ( PartMgmtState.stockAreasForPart.length == 0 ) {
            throw "ManageWorkOrderParts.displaySelectPartLocationDialog: PartMgmtState.stockAreasForPart is empty";
        }
        PartMgmtState.stockAreasForPart = _.sortBy( PartMgmtState.stockAreasForPart, function( stockAreaInList ) {
            return stockAreaInList.name;
        });

        var promptText = Localization.getText( prompt );
        if ( partNumber && _.isString( partNumber ) ) {
            promptText = promptText.replace( "partNumber", partNumber );
        }

        var dialogHtml = new EJS({url: 'templates/selectpartlocationdialog' }).render( {
            action : action,
            prompt : promptText,
            stockAreas : PartMgmtState.stockAreasForPart
        });
        Dialog.showDialog({
            mode : 'blank',
            blankContent : dialogHtml,
            fullScreenForce: true,
            zindex: '1000',
            width: '600px'
        });
        debug && console.log( "ManageWorkOrderParts.displaySelectPartLocationDialog: Dialog now displayed" );
        $("#selectPartLocationDialog").focus();
    }

    /**
     * Handle part location changes inside the parts list.
     */
    function changePartLocationInList( part, event ) {
        debug && console.log( "ManageWorkOrderParts.changePartLocationInList: Handling location change for part in list" );
        PartMgmtState.init();
        PartMgmtState.woLineForPart = part;

        // Get the stock areas whose respective quantities are sufficient to fulfill the part's current quantity
        PartMgmtState.inventoryInfoForPart = _.filter( partsInventory, function( inventoryInList ) {
            return ( ( inventoryInList.productCode == PartMgmtState.woLineForPart.product.productCode ) &&
                     ( inventoryInList.webId != PartMgmtState.woLineForPart.inventoryId ) &&
                     ( inventoryInList.quantity >= PartMgmtState.woLineForPart.qtyOrdered() ) );
        });
        if ( PartMgmtState.inventoryInfoForPart && PartMgmtState.inventoryInfoForPart.length > 0 ) {
            _.each( PartMgmtState.inventoryInfoForPart, function( inventoryInList ) {
                var stockArea = $.extend( true, {}, JSONData.getObjectFromArrayById( stockAreaArray, inventoryInList.stockAreaId ) );
                stockArea.name = stockArea.name + " - " + inventoryInList.binName;
                stockArea.inventoryId = inventoryInList.webId;
                PartMgmtState.stockAreasForPart.push( stockArea );
            });
            displaySelectPartLocationDialog( CHANGE_PART_LOCATION, "selectNewPartLocationPrompt",
                                             PartMgmtState.woLineForPart.product.productCode );
        } else {
            Dialog.showAlert( Localization.getText( "selectPartLocationTitle" ), Localization.getText( "partNotInStockInOtherLocationPrompt") );
        }
    }

    /**
     * Delete a part from the parts list
     */
    function deletePartFromList( part ) {
        debug && console.log( "ManageWorkOrderParts.partsViewModel.deletePart: Deleting part " + part.productCode );
        // Display a confirmation dialog before deleting a part
        var deletePartPrompt = Localization.getText( "deletePartPrompt" ) +
                               new EJS({ url: "templates/deletepartinfo" }).render({
                                   part : part
                               });
        Dialog.showConfirmYesNo( Localization.getText( "deletePartTitle" ),
                                 deletePartPrompt, function() {
            // Add part's quantity back to the inventory
            changeInventoryQtyForPart( part.inventoryId, part.qtyOrdered(), true );

            var workOrder = ManageWorkOrder.getWorkOrder();

            for( var line in workOrder.workOrderSegments[0].workOrderLines ) {
                if( workOrder.workOrderSegments[0].workOrderLines[line].webId == part.webId ) {
                    workOrder.workOrderSegments[0].workOrderLines[line].deleted = true;
                    workOrder.postToMiddleTierRequired = true;
                    JSONData.saveJSON( "workOrders", workOrder );
                    break;
                }
            }

            // Remove part from the observable array
            partsViewModel.parts.remove( part );
            JSONData.setSkipJSONFeedUpdate( true );
            JSONData.setUnsavedChanges( true, "manageWorkOrderSave" );
            Dialog.closeDialog( false );
        }, function() {
            Dialog.closeDialog( false );
        }, "500px" );
    }

    /**
     * Validate the part information entered on the part bar.  Invalid
     * input will display the appropriate alert.
     * @returns true if the part input is valid, false otherwise.
     */
    function isQuickAddInputValid() {
        debug && console.log( "ManageWorkOrderParts.isQuickAddInputValid: Validating quick add part input" );
        var valid = false;
        // Make sure part number and quantity are valid
        if ( partsViewModel.partNumber() ) {
            if ( partsViewModel.quantity() > 0 ) {
                valid = true;
            } else {
                Dialog.showAlert( Localization.getText( "invalidPartQuantity" ), Localization.getText( "quickAddPartQuantityIsZero" ) );
            }
        } else {
            Dialog.showAlert( Localization.getText( "invalidPartNumber" ), Localization.getText( "quickAddPartNumberMissing" ) );
        }
        return valid;
    }

    /**
     * This method is used by the select part location dialog to add
     * parts to the work order after the user selects a location for a part.
     * @param selectedStockAreaIndex - selected stock area index
     * @param action - location action being handled by the dialog
     * @param canceled - was selection canceled?
     */
    function selectPartLocationDialogCallback( selectedStockAreaIndex, action, canceled ) {
        if ( canceled ) {
            if ( action == CHANGE_PART_QTY ) {
                // If location selection was canceled and an existing part quantity
                // was changed, undo the part quantity change
                PartMgmtState.woLineForPart.qtyOrdered( parseInt(PartMgmtState.woLineForPart.currentQty) );
            }
        } else {
            if ( !selectedStockAreaIndex ) {
                throw "ManageWorkOrderParts.selectPartLocationDialogCallback: " +
                      "Required parameter selectedStockAreaIndex is undefined";
            }
            var stockAreaForPart = PartMgmtState.stockAreasForPart[ selectedStockAreaIndex ];
            debug && console.log( "ManageWorkOrderParts.selectPartLocationDialogCallback: Stock area ID = " + stockAreaForPart.webId );
            var inventoryForPart = _.find( PartMgmtState.inventoryInfoForPart, function( inventoryInList ) {
                return inventoryInList.webId == stockAreaForPart.inventoryId;
            });
            debug && console.log( "ManageWorkOrderParts.selectPartLocationDialogCallback: Inventory ID = " + inventoryForPart.webId );

            switch ( action ) {
                case ADD_NEW_PART :
                    debug && console.log( "ManageWorkOrderParts.selectPartLocationDialogCallback: Adding new part" );
                    // Adding a new part to the list...
                    // If the van quantity is not 0, we need to add two part lines.
                    // One for the van's quantity and one for the selected location.
                    if ( PartMgmtState.vanQtyForPart > 0 ) {
                        PartMgmtState.woLineForPart.qtyOrdered = PartMgmtState.vanQtyForPart;
                        PartMgmtState.woLineForPart.inventoryId = PartMgmtState.vanInventoryForPart.webId;
                        addPartToList( PartMgmtState.woLineForPart );
                    }
                    // Add one line for the part using the selected location
                    PartMgmtState.woLineForPart.qtyOrdered = PartMgmtState.totalQtyForPart - PartMgmtState.vanQtyForPart;
                    PartMgmtState.woLineForPart.inventoryId = inventoryForPart.webId;
                    addPartToList( PartMgmtState.woLineForPart );
                    break;
                case CHANGE_PART_QTY :
                    debug && console.log( "ManageWorkOrderParts.selectPartLocationDialogCallback: Changing part qty in list" );
                    // Changing an existing part in the list...
                    // Add 2nd line for additional location
                    var newPart = Util.clone( PartMgmtState.woLineForPart );
                    newPart.qtyOrdered = PartMgmtState.qtyForNewLocation;
                    newPart.inventoryId = inventoryForPart.webId;
                    addPartToList( newPart );
                    // Set part quantity in list to what can be filled by this part's current location
                    PartMgmtState.woLineForPart.qtyOrdered( parseInt(PartMgmtState.woLineForPart.currentQty) + parseInt(PartMgmtState.qtyAdjustmentForCurrentLocation) );
                    PartMgmtState.woLineForPart.currentQty = PartMgmtState.woLineForPart.qtyOrdered();
                    changeInventoryQtyForPart( PartMgmtState.woLineForPart.inventoryId, PartMgmtState.qtyAdjustmentForCurrentLocation, false );
                    break;
                case CHANGE_PART_LOCATION :
                    debug && console.log( "ManageWorkOrderParts.selectPartLocationDialogCallback: Changing part location in list" );
                    // Adjust inventory quantities to reflect location change
                    changeInventoryQtyForPart( PartMgmtState.woLineForPart.inventoryId, PartMgmtState.woLineForPart.qtyOrdered(), true );
                    changeInventoryQtyForPart( inventoryForPart.webId, PartMgmtState.woLineForPart.qtyOrdered(), false );
                    PartMgmtState.woLineForPart.inventoryId = inventoryForPart.webId;
                    PartMgmtState.woLineForPart.location( JSONData.getInventoryLocationString( PartMgmtState.woLineForPart.inventoryId, partsInventory ) );
                    JSONData.setSkipJSONFeedUpdate( true );
                    JSONData.setUnsavedChanges( true, "manageWorkOrderSave" );
                    break;
            }
        }
    }

    /**
     * Set the new part's location and quantity
     * @param workOrderLineForPart - WorkOrderLine JSON object for part
     */
    function setNewPartLocationAndQuantity( workOrderLineForPart ) {
        if ( !workOrderLineForPart ) {
            throw "ManageWorkOrderParts.setNewPartLocationAndQuantity: Required parameter workOrderLineForPart is undefined";
        }

        var displayPartLocationDialog = false;
        var displayPartRequestDialog = false;

        // Re-initialize vars used across methods
        PartMgmtState.init();

        // Default part location is parts request whose inventory ID is null
        workOrderLineForPart.inventoryId = null;
        // Default part quantity is the value set in our view model
        PartMgmtState.totalQtyForPart = parseInt( partsViewModel.quantity() );
        workOrderLineForPart.qtyOrdered = PartMgmtState.totalQtyForPart;

        // Get the part's inventory information
        PartMgmtState.inventoryInfoForPart = _.filter( partsInventory, function( inventoryInList ) {
            return ( inventoryInList.productId == workOrderLineForPart.product.webId );
        });

        var selectPartLocationPrompt = null;
        if ( PartMgmtState.inventoryInfoForPart && PartMgmtState.inventoryInfoForPart.length > 0 ) {
            // Get the stock area's for the part and determine if the part is available in the van
            _.each( PartMgmtState.inventoryInfoForPart, function( inventoryInList ) {
                var stockArea = $.extend( true, {}, JSONData.getObjectFromArrayById( stockAreaArray, inventoryInList.stockAreaId ) );

                // Consider van as stock area for part only if van has a quantity > 0
                if ( stockArea.type == JSONData.STOCK_AREA_TYPE_VAN &&
                     inventoryInList.quantity > 0 ) {
                    PartMgmtState.vanInventoryForPart = inventoryInList;
                    PartMgmtState.vanQtyForPart = PartMgmtState.vanInventoryForPart.quantity;
                }

                // Only consider other stock areas that have a quantity > 0
                if ( inventoryInList.quantity > 0 && stockArea.type != JSONData.STOCK_AREA_TYPE_VAN ) {
                    stockArea.quantity = inventoryInList.quantity;
                    stockArea.inventoryId = inventoryInList.webId;
                    stockArea.name = stockArea.name + " - " + inventoryInList.binName;
                    PartMgmtState.stockAreasForPart.push( stockArea );
                }
            });

            // Filter stock areas for part to those whose quantity is sufficent
            // after the part's quantity is first fulfilled by the van
            PartMgmtState.stockAreasForPart = _.filter( PartMgmtState.stockAreasForPart, function( stockAreaInList ) {
                return PartMgmtState.totalQtyForPart <= ( stockAreaInList.quantity + PartMgmtState.vanQtyForPart );
            });

            // Can the part be fulfilled using the van's quantity
            if ( PartMgmtState.vanInventoryForPart ) {
                if ( PartMgmtState.vanInventoryForPart.quantity >= PartMgmtState.totalQtyForPart ) {
                    debug && console.log( "ManageWorkOrderParts.setNewPartLocationAndQuantity: Location for part number " +
                                          workOrderLineForPart.product.productCode +
                                          " set to van bin " + PartMgmtState.vanInventoryForPart.binName );
                    workOrderLineForPart.inventoryId = PartMgmtState.vanInventoryForPart.webId;
                    workOrderLineForPart.qtyOrdered  = PartMgmtState.totalQtyForPart;
                    addPartToList( workOrderLineForPart );
                } else {
                    // If van quantity is insufficient and there are no other stock areas
                    // that contain a sufficient quantity, display confirm dialog before
                    // adding part
                    if ( PartMgmtState.stockAreasForPart.length == 0 ) {
                        // Add one line for van's quantity
                        workOrderLineForPart.qtyOrdered = PartMgmtState.vanQtyForPart;
                        workOrderLineForPart.inventoryId = PartMgmtState.vanInventoryForPart.webId;
                        addPartToList( workOrderLineForPart );
                        // Add 2nd line for PARTS REQUEST quantity
                        workOrderLineForPart.qtyOrdered = PartMgmtState.totalQtyForPart - PartMgmtState.vanQtyForPart;
                        workOrderLineForPart.inventoryId = null;
                        addPartToList( workOrderLineForPart );
                        Dialog.closeDialog();
                    } else {
                        selectPartLocationPrompt = "selectPartLocationSomeInVanPrompt";
                        displayPartLocationDialog = PartMgmtState.stockAreasForPart.length > 0;
                    }
                }
            } else {
                if ( PartMgmtState.stockAreasForPart.length > 0 ) {
                    selectPartLocationPrompt = "selectPartLocationNotInVanPrompt";
                    displayPartLocationDialog = true;
                } else {
                    displayPartRequestDialog = true;
                }
            }
        } else {
            displayPartRequestDialog = true;
        }

        if ( displayPartLocationDialog ) {
            // Part is in a different location.  Display location selection dialog.
            PartMgmtState.woLineForPart = workOrderLineForPart;
            displaySelectPartLocationDialog( ADD_NEW_PART, selectPartLocationPrompt, workOrderLineForPart.product.productCode );
        } else if ( displayPartRequestDialog ) {
            addPartToList( workOrderLineForPart );
        }
    }

    /**
     * Add a part to the parts list
     * @param workOrderLineForPart - Work order line for the new part
     */
    function addPartToList( workOrderLineForPart ) {
        if ( !workOrderLineForPart ) {
            throw "ManageWorkOrderParts.addPartToList: Required parameter workOrderLineForPart is undefined";
        }
        if ( !workOrderLineForPart.product.productCode ) {
            throw "ManageWorkOrderParts.addPartToList: workOrderLineForPart.product.productCode is 0 or undefined";
        }
        if ( !workOrderLineForPart.qtyOrdered ) {
            throw "ManageWorkOrderParts.addPartToList: workOrderLineForPart.qtyOrdered is 0 or undefined";
        }

        // Populate new work order line with part information
        var newPart = $.extend( true, {}, workOrderLineForPart );
        newPart.webId = Util.getUniqueId();
        newPart.clientReference = Util.getUniqueId();

        // Set the new part's manufacturer
        if ( partsViewModel.selectedMfg() != "" && newPart.product.manufacturer == "" ) {
            newPart.product.manufacturer = partsViewModel.selectedMfg();
        }

        // Make the new part's location and qtyOrdered properties
        // observable before adding the new part to the observable array.
        // Differences between outside part purchases and other parts are handled here too.
        if ( workOrderLineForPart.product.productCode == WorkOrder.OUTSIDE_PART_PURCHASE_PRODUCE_CODE ) {
            newPart.location = Localization.getText( "outsidePurchasePartLocation" );
            newPart.description = workOrderLineForPart.description;
        } else {
            newPart.location = ko.observable( JSONData.getInventoryLocationString( workOrderLineForPart.inventoryId, partsInventory ) );
        }
        newPart.qtyOrdered = ko.observable( parseInt( workOrderLineForPart.qtyOrdered ) );

        // currentQty is used to restore the qtyOrdered value to a previous value
        // during inline part list editing
        newPart.currentQty = newPart.qtyOrdered();
        debug && console.log( "ManageWorkOrderParts.addPartToList: parts size before quickAdd = " +
                              partsViewModel.parts().length );

        // Add new part to observable array...parts list will automatically update itself
        debug && console.log( "ManageWorkOrderParts.addPartToList: Adding part -" +
                              " Mfg: " + newPart.product.manufacturer +
                              " Part #: " + newPart.product.productCode +
                              " Qty: " + newPart.qtyOrdered() );

        // Make new part writable
        newPart.writable = ko.observable( true );
        partsViewModel.parts.push( newPart );
        debug && console.log( "ManageWorkOrderParts.addPartToList: parts size after quickAdd = " +
                              partsViewModel.parts().length );
        JSONData.setSkipJSONFeedUpdate( true );
        JSONData.setUnsavedChanges( true, "manageWorkOrderSave" );

        // Change inventory quantity for the part
        changeInventoryQtyForPart( newPart.inventoryId, newPart.qtyOrdered(), false );

        // Clear the quick add part entry fields.
        partsViewModel.partNumber( "" );
        partsViewModel.quantity( 1 );
        partsViewModel.selectedMfg( "" );
    }

    /**
     * Used by the select part manufacturer dialog to set the part
     * manufacturer inside the view model.
     * @param mfg - manufacturer
     */
    function setQuickAddPartMfg( mfg ) {
        partsViewModel.selectedMfg( mfg );
    }


    // quickAddPartHandler() populates this array and then,
    // setNewPartManufacturer uses the array to set the manufacturer
    // for a new part
    var productsForNewQuickAddPart = null;

    /**
     * Set the manufacturer for the new part being added to the work
     * order
     */
    function setNewPartManufacturer() {
        // If a mfg was selected, add the part to the list
        if ( partsViewModel.selectedMfg() ) {
            // Get the product for the selected manufacturer and add it to the parts list
            var product = _.find( productsForNewQuickAddPart, function( productInList ) {
                // The selectpartmfgdialog sets selected mfg inside the view model
                return productInList.manufacturer == partsViewModel.selectedMfg();
            });

            var woLineForProduct = createWorkOrderLineForProduct( product );
            setNewPartLocationAndQuantity( woLineForProduct );
        }
    }

    /**
     * Click handler for the Add button for quickly adding a new part
     * It collects the information from the part header and adds the
     * part to the part list
     */
    function quickAddPartHandler() {
        if ( isQuickAddInputValid() ) {
            debug && console.log( "ManageWorkOrderParts.quickAddPartHandler: Starting mfg and location logic for part " + partsViewModel.partNumber() );
            // Look up the part number inside the list of available products.
            JSONData.getProducts( JSONData.PRODUCT_TYPE_PART, partsViewModel.partNumber(),
                // Successful query for products
                function( products ) {
                    productsForNewQuickAddPart = products;
                    if ( productsForNewQuickAddPart && productsForNewQuickAddPart.length > 0 ) {
                        // Get the part's manufacturer and add the new part to the parts list
                        if ( productsForNewQuickAddPart.length == 1 ) {
                            debug && console.log( "ManageWorkOrderParts.quickAddPartHandler: Single mfg found for part number " +
                                                  partsViewModel.partNumber() );
                            partsViewModel.selectedMfg( productsForNewQuickAddPart[0].manufacturer );
                            setNewPartLocationAndQuantity( createWorkOrderLineForProduct( productsForNewQuickAddPart[0] ) );
                        } else {
                            // Display dialog to allow technician to select mfg for part number if
                            // part has multiple manufacturers
                            debug && console.log( "ManageWorkOrderParts.quickAddPartHandler: Multiple mfgs found for part number " +
                                                  partsViewModel.partNumber() );
                            var allMfgs = JSONData.getObjectsByDataType( "manufacturers" );
                            var mfgsForDlg = [];
                            var mfgForProduct = null;
                            _.each( productsForNewQuickAddPart, function( productInList ) {
                                mfgForProduct = _.find( allMfgs, function( mfgInList ) {
                                    return mfgInList.internalId == productInList.manufacturer;
                                });
                                mfgsForDlg.push( mfgForProduct );
                            });
                            mfgsForDlg = _.sortBy( mfgsForDlg, function( mfgInList ) {
                                return mfgInList.internalId;
                            });
                            displayPartMfgSelectionDialog( mfgsForDlg );
                        }
                    } else {
                        Dialog.showAlert( Localization.getText( "invalidPartNumber" ), Localization.getText( "quickAddPartNumberInvalid") );
                    }
                }
            );
        }
    }

    /**
     * Display the part manufacturer selection dialog
     */
    function displayPartMfgSelectionDialog( mfgList ) {
        debug && console.log( "ManageWorkOrderParts.displayPartMfgSelectionDialog: Loading mfg selection dialog" );
        var dialogHtml = new EJS({url: 'templates/selectpartmfgdialog' }).render( {
            partNumber : partsViewModel.partNumber(),
            mfgs : mfgList
        });
        debug && console.log( "ManageWorkOrderParts.displayPartMfgSelectionDialog: Showing mfg selection dialog" );
        Dialog.showDialog({
            mode : 'blank',
            blankContent : dialogHtml,
            fullScreenForce: true,
            zindex: '1000',
            width : '600px'
        });
        debug && console.log( "ManageWorkOrderParts.displayPartMfgSelectionDialog: Mfg selection dialog displayed" );
        $("#selectPartMfgDialog").focus();
    }

    /**
     * Change a part inside the list
     * @param partIndex - Index into observable parts array for part being changed
     */
    function changePartQuantityInList( partIndex ) {
        PartMgmtState.init();
        var partToChange = partsViewModel.parts()[partIndex];
        var qtyChange = partToChange.qtyOrdered() - partToChange.currentQty;

        debug && console.log( "ManageWorkOrderParts.changePartQuantityInList: Changing qty and location for part at index " +
                              partIndex );
        debug && console.log( "ManageWorkOrderParts.changePartQuantityInList: Part quantity being changed by " + qtyChange );

        // Get inventory object for the part
        var currentInventory = _.find( partsInventory, function( inventoryInList ) {
            return inventoryInList.webId == partToChange.inventoryId;
        });
        if ( currentInventory ) {
            // Can the current inventory location fulfill the new quantity?
            if ( currentInventory.quantity < qtyChange ) {

                // Fill part of the quantity change with what's left in the current inventory location
                var currentInventoryQtyAdjustment = currentInventory.quantity;
                var remainingQtyChangeForNewLocation = qtyChange - currentInventoryQtyAdjustment;
                debug && console.log( "ManageWorkOrderParts.changePartQuantityInList: Qty adjustment for current location: " +
                                      currentInventoryQtyAdjustment + " Qty for new location: " + remainingQtyChangeForNewLocation );

                var inventoryInfoForChangedPart = _.filter( partsInventory, function( inventoryInList ) {
                    return ( inventoryInList.productCode == partToChange.product.productCode &&
                             inventoryInList.webId != partToChange.inventoryId &&
                             inventoryInList.quantity >= remainingQtyChangeForNewLocation );
                });
                if ( inventoryInfoForChangedPart && inventoryInfoForChangedPart.length > 0 ) {
                    // Prompt user to choose location that can fulfill quantity that cannot be
                    // fulfilled by the current inventory location
                    debug && console.log( "ManageWorkOrderParts.changePartQuantityInList: New quantity requires additional part location" );

                    // Get additional stock areas for the part being changed
                    _.each( inventoryInfoForChangedPart, function( inventoryInList ) {
                        var stockArea = $.extend( true, {}, JSONData.getObjectFromArrayById( stockAreaArray, inventoryInList.stockAreaId ) );
                        stockArea.inventoryId = inventoryInList.webId;
                        stockArea.name = stockArea.name + " - " + inventoryInList.binName;
                        PartMgmtState.stockAreasForPart.push( stockArea );
                    });

                    // Display the part location dialog
                    PartMgmtState.woLineForPart = partToChange;
                    PartMgmtState.inventoryInfoForPart = inventoryInfoForChangedPart;
                    PartMgmtState.qtyAdjustmentForCurrentLocation = currentInventoryQtyAdjustment;
                    PartMgmtState.qtyForNewLocation = remainingQtyChangeForNewLocation;
                    displaySelectPartLocationDialog( CHANGE_PART_QTY, "selectPartLocationPrompt",
                                                     PartMgmtState.woLineForPart.product.productCode );
                } else {
                    // Prompt user to confirm a parts request if no inventory locations exist for new quantity
                    debug && console.log( "ManageWorkOrderParts.changePartQuantityInList: New quantity requires part request" );
                    var promptText = Localization.getText( "partsRequestForChangedQty" ).replace( "partNumber", partToChange.product.productCode );
                    Dialog.showConfirmYesNo( Localization.getText( "partsRequest" ), promptText,
                        function() {
                            // Add 2nd line for PARTS REQUEST quantity
                            var newPart = Util.clone( partToChange );
                            newPart.qtyOrdered = remainingQtyChangeForNewLocation;
                            newPart.product.productCode = partToChange.product.productCode;
                            newPart.inventoryId = null;
                            addPartToList( newPart );
                            // Set part quantity in list to current qty plus part of new qty that can
                            // be filled
                            partToChange.qtyOrdered( parseInt(partToChange.currentQty) + parseInt(currentInventoryQtyAdjustment) );
                            partToChange.currentQty = partToChange.qtyOrdered();
                            changeInventoryQtyForPart( partToChange.inventoryId, currentInventoryQtyAdjustment, false );
                            JSONData.setSkipJSONFeedUpdate( true );
                            JSONData.setUnsavedChanges( true, "manageWorkOrderSave" );
                            Dialog.closeDialog();
                        },
                        function() {
                            partToChange.qtyOrdered( parseInt(partToChange.currentQty) );
                            Dialog.closeDialog();
                        }
                    );
                }
            } else {
                debug && console.log( "ManageWorkOrderParts.changePartQuantityInList: Current location fulfils new quantity" );
                changeInventoryQtyForPart( partToChange.inventoryId, Math.abs(qtyChange), qtyChange < 0 );
                partToChange.currentQty = partToChange.qtyOrdered();
                JSONData.setSkipJSONFeedUpdate( true );
                JSONData.setUnsavedChanges( true, "manageWorkOrderSave" );
            }
        } else {
            // Changing quantity for part listed as parts request
            debug && console.log( "ManageWorkOrderParts.changePartQuantityInList: Changing quantity for part listed as parts request" );
            partToChange.currentQty = partToChange.qtyOrdered();
            JSONData.setSkipJSONFeedUpdate( true );
            JSONData.setUnsavedChanges( true, "manageWorkOrderSave" );
        }
    }

    /**
     * Save the updated parts list into the work order and save the inventory changes
     * @param postToMiddleTierAfterSave - Boolean, post to middle tier after save? Default = true
     */
    function saveChanges( postToMiddleTierAfterSave ) {
        var inventoryChangesSavedCompleteFn;

        if ( typeof postToMiddleTierAfterSave == "undefined" ) {
            postToMiddleTierAfterSave = true;
        }
        var workOrder = ManageWorkOrder.getWorkOrder();
        debug && console.log( "ManageWorkOrderParts.saveChanges: Saving updated parts into work order " + workOrder.documentNumber );
        // Get the updated parts list
        var newPartsList = ko.toJS( partsViewModel.parts() );
        var deletedPartsList = _.filter( workOrder.workOrderSegments[0].workOrderLines, function( partsLine ) {
            return partsLine.deleted;
        });

        // Create a new set of work order lines with old parts information removed
        var newWorkOrderLines = _.reject( workOrder.workOrderSegments[0].workOrderLines, function( lineInList ) {
            return lineInList.type == WorkOrder.WORK_ORDER_LINE_PART_TYPE;
        });
        // Add the updated parts list to the new work order lines list.
        // While in this loop, remove extra properties used by the UI and make
        // sure all number properties are int values and not strings
        _.each( newPartsList, function( partInList ) {
            partInList.dateUpdated = Util.getISOCurrentTime();
            newWorkOrderLines.push( partInList );
        });

        // Add the updated deleted list to the new work order lines list
        _.each( deletedPartsList, function( partInList ) {
            newWorkOrderLines.push( partInList );
        });

        // Save the work order and mark the model is not dirty.
        workOrder.workOrderSegments[0].workOrderLines = newWorkOrderLines;
        workOrder.postToMiddleTierRequired = true;
        JSONData.saveJSON( "workOrders", workOrder, true );

        // Part changes saved locally...turn off skipping the JSON feed update
        JSONData.setSkipJSONFeedUpdate( false );

        // Post the work order to the middle tier
        if ( postToMiddleTierAfterSave ) {
            WorkOrder.postWorkOrder( workOrder, true, false, function( updatedWorkOrder ) {
                debug && console.log( "ManageWorkOrderParts.saveChanges: Work order " +
                                      updatedWorkOrder.documentNumber + " successfully posted to middle tier" );
                    WorkOrder.displayWorkOrderChangedAlert( updatedWorkOrder, function() {
                        UIFrame.reloadCurrentPage();
                    });
            }, null );
        }

        // Save the inventory changes
        var inventoryChanges = _.filter( partsInventory, function( inventoryInList ) {
            return inventoryInList.changed !== undefined && inventoryInList.changed == true;
        });
        inventoryChangesSavedCompleteFn = function() {
            JSONData.setUnsavedChanges( false, "manageWorkOrderSave" );
            // Navigate to a page after save completes.  If page is not saved in local storage, this
            // call does nothing
            UIFrame.navigateToPageAfterSaveCompletes();
        };
        if ( inventoryChanges && inventoryChanges.length > 0 ) {
            JSONData.saveInventoryQuantityChanges( inventoryChanges, function() {
                debug && console.log( "ManageWorkOrderParts.saveChanges: Inventory changes saved" );
                inventoryChangesSavedCompleteFn();
            });
        } else {
            debug && console.log( "ManageWorkOrderParts.saveChanges: No inventory changes detected" );
            inventoryChangesSavedCompleteFn();
        }
    }

    /**
     * Start PSRT
     */
    function startPSRT() {
        Util.startPSRT( ManageWorkOrder.getEquipment().serialNumber, psrtModelCrossReference[ ManageWorkOrder.getEquipment().productCode ],
                ManageWorkOrder.getCustomer().name, ManageWorkOrder.getWorkOrder().documentNumber );
    }

    /**
     * Open the inventory page when the addPart button is clicked
     */
    function openInventory() {
        debug && console.log( "ManageWorkOrderParts.openInventory: Add part button pressed, opening inventory page." );
        window.localStorage.setItem( LS_INVENTORY_ADD_OPENED, true );
        // When navigating to/from inventory page to add parts, skip the periodic JSON
        // feed update so that the added parts don't get removed
        JSONData.setSkipJSONFeedUpdate( true );
        window.localStorage.setItem( LS_PART_COUNT, partsViewModel.parts().length );
        UIFrame.navigateToPage( "vaninventoryadd.html", false, null );
    }

    /**
     * Open the outside part purchase dialog
     */
    function displayOutsidePurchaseDialog() {
        debug && console.log( "ManageWorkOrderParts.displayOutsidePurchaseDialog: Displaying outside part purchase dialog" );

        // Initialize the view model with an empty outside purchase part list
        partsViewModel.outsidePurchasePartList.removeAll();
        addLineToOutsidePurchasePartList( null, null );

        // Add view model defs for the dialog's part list buttons
        partsViewModel.takeOutsidePurchaseReceiptPicture = takeOutsidePurchaseReceiptPicture;
        partsViewModel.decrementOutsidePurchasePartQty = decrementOutsidePurchasePartQty;
        partsViewModel.incrementOutsidePurchasePartQty = incrementOutsidePurchasePartQty;
        partsViewModel.addLineToOutsidePurchasePartList = addLineToOutsidePurchasePartList;

        // Display the dialog
        var dialogHtml = new EJS({url: 'templates/outsidepartpurchasedialog' }).render( {
        });
        Dialog.showDialog({
            mode : 'blank',
            blankContent : dialogHtml,
            height : '400px',
            width : '900px'
        });

        // Apply the dialog's knockout bindings
        ko.applyBindings( partsViewModel, $("#outsidePurchaseDialog")[0] );
    }

    /**
     * Decrement quantity for a part on the outside purchase parts dialog
     */
    function decrementOutsidePurchasePartQty( part, event ) {
        var newQty = parseInt( part.quantity() );
        if ( newQty > 1 ) {
            debug && console.log( "ManageWorkOrderParts.decrementOutsidePurchasePartQty: Decrementing quantity for outside purchase part" );
            part.quantity( newQty - 1 );
        } else {
            debug && console.log( "ManageWorkOrderParts.decrementOutsidePurchasePartQty: Currenty qty = 1, decrement ignored" );
            part.quantity( newQty );
        }
    }

    /**
     * Increment quantity for a part on the outside purchase parts dialog
     */
    function incrementOutsidePurchasePartQty( part, event) {
        var newQty = parseInt( part.quantity() );
        debug && console.log( "ManageWorkOrderParts.incrementOutsidePurchasePartQty: Incrementing qty for outside purchase part to " + newQty );
        part.quantity( newQty + 1 );
    }

    /**
     * Add a line to the outside purchase dialog part list
     */
    function addLineToOutsidePurchasePartList( part, event ) {
        debug && console.log( "ManageWorkOrderParts.addLineToOutsidePurchasePartList: Adding new line" );
        // Hide the current add line button.  New line will now contain add line button.
        if ( event ) {
            $( event.currentTarget ).hide();
        }
        var outsidePurchasePart = {};
        outsidePurchasePart.quantity = ko.observable( 1 );
        outsidePurchasePart.description = ko.observable( "" );
        outsidePurchasePart.priceEach = ko.observable( 0.00 );
        partsViewModel.outsidePurchasePartList.push( outsidePurchasePart );
    }

    /**
     * Add the outside purchase parts to the part list
     */
    function addOutsidePartPurchasesToPartList() {
        debug && console.log( "ManageWorkOrderParts.addOutsidePartPurchasesToPartList: Adding outside purchases to the parts list" );
        Dialog.closeDialog();

        var workOrderLine = null;
        _.each( partsViewModel.outsidePurchasePartList(), function( partInList ) {
            // Any part in the list with invalid or missing input will be ignored
            if ( partInList.quantity() >= 1 &&
                 partInList.description().length > 0 &&
                 partInList.priceEach() > 0.00 ) {
                // Create a work order line for each part
                workOrderLine = WorkOrder.createNewWorkOrderLine();
                workOrderLine.cost                 = parseFloat( partInList.priceEach() );
                workOrderLine.description          = partInList.description();
                workOrderLine.qtyOrdered           = partInList.quantity();
                workOrderLine.type                 = WorkOrder.WORK_ORDER_LINE_PART_TYPE;
                workOrderLine.product.webId        = WorkOrder.OUTSIDE_PART_PURCHASE_WEBID;
                workOrderLine.product.manufacturer = WorkOrder.OUTSIDE_PART_PURCHASE_MFG;
                workOrderLine.product.productCode  = WorkOrder.OUTSIDE_PART_PURCHASE_PRODUCE_CODE;
                addPartToList( workOrderLine );
            } else {
                console.warn( "ManageWorkOrderParts.addOutsidePartPurchasesToPartList: Outside part has invalid or missing values" );
            }
        });
    }

    /**
     * Take a picture of the outside purchase receipt
     */
    function takeOutsidePurchaseReceiptPicture() {
        Util.takePicture( function( imageData ) {
            debug && console.log( "ManageWorkOrderParts.takeOutsidePurchaseReceiptPicture: Successful" );
            partsViewModel.outsidePurchaseReceipt( "data:image/png;base64," + imageData );
            debug && console.log( "ManageWorkOrderParts.takeOutsidePurchaseReceiptPicture: Start of image data: " +
                                  partsViewModel.outsidePurchaseReceipt().substr( 0, 50 ) );
        });
    }

    /**
     * Add parts from PSRT cart XML file to the part list.
     * This is called when the mobile app is resumed.
     */
    function addPSRTPartsToPartList() {
        var config = Config.getConfig();
        var psrtStarted = ( window.localStorage.getItem( Util.LS_PSRT_STARTED ) || Util.isRunningOnChromeDesktop() );
        if ( psrtStarted ) {
            // Remove the PSRT started flag.  This prevents other resume events
            // from mistakenly attempting to add PSRT parts
            window.localStorage.removeItem( Util.LS_PSRT_STARTED );
            var cartFilename = config.externalStorageDirectory + config.psrtCartDirectory + "/" + ManageWorkOrder.getWorkOrder().documentNumber + ".xml";
            debug && console.log( "ManageWorkOrderParts.addPSRTPartsToPartList: Attempting to add parts from PSRT cart file: " +
                                  cartFilename );
            try {
                $.ajax( {
                    url : cartFilename,
                    dataType : 'xml',
                    // Loading cart XML succeeded
                    success : function( cartXml, textStatus, jqXHR ) {
                        debug && console.log( "ManageWorkOrderParts.addPSRTPartsToPartList: Loading PSRT cart file successful" );

                        // Remove JSON file that initiated this PSRT part request and the cart XML file
                        var jsonPartRequestFile = config.externalStorageDirectory + config.psrtRequestDirectory + "/" +
                                                  ManageWorkOrder.getWorkOrder().documentNumber + ".json";
                        debug && console.log( "ManageWorkOrderParts.addPSRTPartsToPartList: Deleting JSON part request file " +
                                              jsonPartRequestFile + " and XML cart file " + cartFilename );
                        LocalFS.deleteFile( jsonPartRequestFile, null, null );
                        LocalFS.deleteFile( cartFilename, null, null );

                        // Get the items from the cart
                        var items = $(cartXml).find( "CartItem" );
                        if ( items && items.length > 0 ) {
                            debug && console.log( "ManageWorkOrderParts.addPSRTPartsToPartList: PSRT cart file contains " +
                                                  items.length + " items" );

                            // Original logic leaves mfg and location blank.
                            _.each( items, function( itemInList ) {
                                var workOrderLine = WorkOrder.createNewWorkOrderLine();
                                var itemXml = $(itemInList);
                                workOrderLine.cost                = itemXml.find( "ItemPrice" ).text();
                                workOrderLine.description         = itemXml.find( "PartDescription" ).text();
                                workOrderLine.qtyOrdered          = parseInt( itemXml.find( "Quantity" ).text() );
                                workOrderLine.type                = WorkOrder.WORK_ORDER_LINE_PART_TYPE;
                                workOrderLine.product.productCode = itemXml.find( "PartCode" ).text();

                                // Get the part's inventory ID
                                var inventoryIDs = _.filter( partsInventory, function( inventoryInList ) {
                                    return ( inventoryInList.productCode == workOrderLine.product.productCode &&
                                             inventoryInList.quantity >= workOrderLine.qtyOrdered );
                                });
                                if ( inventoryIDs.length > 0 ) {
                                    // If there is more than one inventory location for the PSRT part, use
                                    // the van location if it's available. Otherwise, use the first one in the list
                                    var inventoryForItem = _.find( inventoryIDs, function( inventoryInList ) {
                                        return ( JSONData.isStockAreaOnVan( inventoryInList.stockAreaId ) );
                                    });
                                    if ( inventoryForItem ) {
                                        workOrderLine.inventoryId = inventoryForItem.webId;
                                    } else {
                                        workOrderLine.inventoryId = inventoryIDs[0].webId;
                                    }
                                }

                                debug && console.log( "ManageWorkOrderParts.addPSRTPartsToPartList: Adding following PSRT part to list: " +
                                                      "Cost: " + workOrderLine.cost + " Description: '" + workOrderLine.description +
                                                      "' Quantity: " + workOrderLine.qtyOrdered +
                                                      " Product Code: " + workOrderLine.product.productCode +
                                                      " Inventory ID: " + workOrderLine.inventoryId );

                                // Get the part's mfg from the product DB table
                                JSONData.getProducts( JSONData.PRODUCT_TYPE_PART, workOrderLine.product.productCode,
                                    function( products ) {
                                        if ( products && products.length > 0 ) {
                                            workOrderLine.product.webId        = products[0].webId;
                                            workOrderLine.product.manufacturer = products[0].manufacturer;
                                            debug && console.log( "ManageWorkOrderParts.addPSRTPartsToPartList: Adding PSRT part number " +
                                                                  workOrderLine.product.productCode + " with manufacturer set to " +
                                                                  workOrderLine.product.manufacturer );
                                            // If description comes back blank, use description from products table
                                            if ( workOrderLine.description == "" ) {
                                                workOrderLine.description = products[0].description;
                                            }
                                            addPartToList( workOrderLine );
                                        } else {
                                            console.warn( "ManageWorkOrderParts.addPSRTPartsToPartList: PSRT part number " +
                                                          workOrderLine.product.productCode + " not found in products database table.  Mfg left blank." );
                                            addPartToList( workOrderLine );
                                        }
                                    }
                                );
                            });
                            debug && console.log( "ManageWorkOrderParts.addPSRTPartsToPartList: All PSRT parts processed" );
                        } else {
                            console.warn( "ManageWorkOrderParts.addPSRTPartsToPartList: PSRT cart file contains no CartItem elements" );
                        }
                    },
                    // Loading cart XML failed
                    error : function( jqXHR, textStatus, errorThrown ) {
                        console.error( "ManageWorkOrderParts.addPSRTPartsToPartList: Loading PSRT cart file failed" );
                    }
                });
            } catch ( exc ) {
                JSONData.logException( exc );
            }
        } else {
            debug && console.log( "ManageWorkOrderParts.addPSRTPartsToPartList: PSRT was not started.  No parts will be added" );
        }
    }

    return {
        'addOutsidePartPurchasesToPartList' : addOutsidePartPurchasesToPartList,
        'addPartsFromMenu'                  : addPartsFromMenu,
        'addPSRTPartsToPartList'            : addPSRTPartsToPartList,
        'decrementOutsidePurchasePartQty'   : decrementOutsidePurchasePartQty,
        'incrementOutsidePurchasePartQty'   : incrementOutsidePurchasePartQty,
        'init'                              : init,
        'onPartQtyChanged'                  : onPartQtyChanged,
        'populatePage'                      : populatePage,
        'selectPartLocationDialogCallback'  : selectPartLocationDialogCallback,
        'setNewPartManufacturer'            : setNewPartManufacturer,
        'setQuickAddPartMfg'                : setQuickAddPartMfg
    };
}();

/**
 * pageinit event handler
 */
$("div:jqmData(role='page')").on( "pageinit", function( event, ui ) {
    // All pages must set pageId to this.id
    var pageId = this.id;
    debug && console.log( "ManageWorkOrderParts.pageinit" );
    UIFrame.init( pageId, function() {
        debug && console.log( "ManageWorkOrderParts.pageinit: Executing page specific init" );
        ManageWorkOrderParts.init( pageId );
        // This MUST be the last line inside each page specific init function
        UIFrame.postPageSpecificInit( pageId );
    });
});

