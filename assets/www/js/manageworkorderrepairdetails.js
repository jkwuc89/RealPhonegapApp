/**
 * manageworkorderlabor.js
 */

"use strict";

/**
 * ManageWorkOrderRepairDetails object
 */
var ManageWorkOrderRepairDetails = function() {

    // Currently saved equipment hour meter value.  New value entered
    // by user cannot be less than this
    var currentlySavedHourMeter = parseInt( window.localStorage.getItem( ManageWorkOrder.LS_ORIGINAL_HOUR_METER_VALUE ), 10 );

    // Holds list of available billing folders
    var folderArray = [];

    // All of the available standard job codes
    var standardJobCodes = [];

    // Holds list of available standard job code manufacturers
    var standardJobCodeMfgs = [];

    /**
     * Handling the onbeforeload event allows the app
     * fix the styles for the parts and repair details buttons
     */
    window.onbeforeunload = function() {
        $("#manageWorkOrderParts").addClass( "ui-btn-active" );
        $("#manageWorkOrderRepairDetails").removeClass( "ui-btn-active" );
    };

    /**
     * Load event allows us to display the work order changed alert when required
     */
    $(window).load( function() {
        WorkOrder.displayWorkOrderChangedAlert( ManageWorkOrder.getWorkOrder(), null );
    });

    /**
     * Knockout view model for this page
     */
    var repairDetailsViewModel = {
        additionalRepairNotes : ko.observable( "" ),
        availableBillingFolders : ko.observableArray( [] ),
        availableRepairCodeMfgs : ko.observableArray( [] ),
        availableXcodes : ko.observableArray( [] ),
        hasCommonFolder : ko.observable( false ),
        hasEquipment : ko.observable( true ),
        hourMeter : ko.observable( 0 ),
        isQueryingStandardJobCodes : ko.observable( false ),
        laborHours : ko.observableArray( [] ),
        pmWorkOrder : ko.observable( false ),
        poNumber : ko.observable( "" ),
        poNumberRequired : ko.observable( false ),
        repairCodeId : ko.observable( "" ),
        repairCodeDescription : ko.observable( "" ),
        repairCodeNotes : ko.observable( "" ),
        repairCodeSegment1Caption : ko.observable( "" ),
        repairCodeSegment1List : ko.observable( [] ),
        repairCodeSegment2Caption : ko.observable( "" ),
        repairCodeSegment2List : ko.observable( [] ),
        repairCodeSegment3Caption : ko.observable( "" ),
        repairCodeSegment3List : ko.observable( [] ),
        repairTypeCaption : ko.observable( "" ),
        selectedBillingFolder : ko.observable( "" ),
        selectedRepairCodeMfg : ko.observable( "" ),
        selectedRepairCodeSegment1 : ko.observable( "" ),
        selectedRepairCodeSegment2 : ko.observable( "" ),
        selectedRepairCodeSegment3 : ko.observable( "" ),
        selectedXcode : ko.observable(),
        standardJobCodeId : ko.observable( "" ),
        standardJobCode : ko.observable( null ),
        writable : ko.observable( false ),
        xcodeCaption : ko.observable( "" ),
        // Click handler for the save button
        saveWorkOrder : saveClickHandler
    };

    /**
     * Init this object
     */
    function init() {
        var allStandardJobCodeMfgs = JSONData.getObjectsByDataType( "standardJobCodeManufacturers" )
        debug && console.log( "ManageWorkOrderRepairDetails.init" );
        ManageWorkOrder.init();

        // Set the periodic JSON feed update complete function for this page
        JSONData.setPageSpecificPeriodicUpdateCompleteFn( periodicJSONFeedUpdateCompleteFn );

        // Set the navigate to page save changes function
        UIFrame.setNavigateToPageSaveChangesFunction( saveClickHandler );

        // Folder list filtered by those chosen by Crown that are work order related
        var filteredFolderIds = [ "402", "403", "404", "405", "406", "407", "408", "426", "427", "428", "431", "433", "436", "437", "439", "440", "443", "444" ];
        folderArray = _.filter( JSONData.getObjectsByDataType( "folders" ), function( folderInList ) {
            return ( _.indexOf( filteredFolderIds, folderInList.internalId, true ) != -1 );
        });

        // Put repair code mfg first
        standardJobCodeMfgs.push( _.find( allStandardJobCodeMfgs, function( mfgInList ) {
            return mfgInList.webId == JSONData.REPAIR_CODES_MFG_ID;
        }));
        // Put battery codes mfg second
        standardJobCodeMfgs.push( _.find( allStandardJobCodeMfgs, function( mfgInList ) {
            return mfgInList.webId == JSONData.BATTERY_CODES_MFG_ID;
        }));
        // Put dock and doors codes mfg second
        standardJobCodeMfgs.push( _.find( allStandardJobCodeMfgs, function( mfgInList ) {
            return mfgInList.webId == JSONData.DOCK_AND_DOOR_CODES_MFG_ID;
        }));

        // If the opened work order is a PM, prevent the issue where a QW PM WO doesn't have a standardJobCodeId
        // (must be assigned by mobile app)
        var workOrder = ManageWorkOrder.getWorkOrder();
        if ( WorkOrder.isPMWorkOrder( workOrder ) && workOrder.workOrderSegments[0].standardJobCodeId == null ) {
            workOrder.workOrderSegments[0].standardJobCodeId = Config.getConfig().PMStandardJobCodeWebId;
            JSONData.saveJSON( "workOrders", workOrder, true );
        }
        
        // When the additional repair notes TextArea is selected, silently scroll the page
        $( '#additionalRepairNotes' ).focus( function() {
            $.mobile.silentScroll( 62 );
        });
    }

    /**
     * This function is called by JSONData.periodicJSONUpdateComplete() when
     * a periodic JSON feed update is complete.  This will ensure that the technician
     * maintains control of the data and an update for the related fields cannot be 
     * updated by the middle-tier. 
     */
    function periodicJSONFeedUpdateCompleteFn( dataType ) {
        if ( dataType && dataType == "workOrders" ) {
            ManageWorkOrder.loadWorkOrder();
            debug && console.log( "ManageWorkOrderRepairDetails.periodicJSONFeedUpdateCompleteFn: Local changes retained after JSON feed update" );
        }
    }
    
    /**
     * Populate the labor hours list
     */
    function populateLaborHoursList() {
        repairDetailsViewModel.laborHours.removeAll();
        var workOrder = ManageWorkOrder.getWorkOrder();
        var workOrderClockings = _.filter( JSONData.getObjectsByDataType( "technicianClocking" ), function( clockingInList ) {
            return ( clockingInList.workOrderHeaderId == workOrder.webId &&
                     clockingInList.workOrderSegmentId == workOrder.workOrderSegments[0].webId );
        });
        // Build and push the labor hours into the observable array
        if ( workOrderClockings ) {
            debug && console.log( "ManageWorkOrderRepairDetails.populatePage: Adding items to the Labor Hours list" );
            // Sort the clockings by start time before adding them to the labor hours list
            workOrderClockings = _.sortBy( workOrderClockings, function( clockingInList ) {
                var clockingTime = ( clockingInList.timeEnd ) ? new Date( clockingInList.timeEnd ).getTime() : new Date().getTime();
                debug && console.log( "ManageWorkOrderRepairDetails.populatePage: Sort clockings - current clocking time = " + clockingTime );
                return clockingTime;
            });
            for ( var i = 0; i < workOrderClockings.length; i++ ) {
                // Calculate and populate the properties needed to display
                // the labor hours list
                var laborListItem = {};
                laborListItem.date = Localization.formatDateTime( workOrderClockings[i].timeStart, "d" );
                laborListItem.startTime = Localization.formatDateTime( workOrderClockings[i].timeStart, "t" );
                if ( workOrderClockings[i].timeEnd ) {
                    laborListItem.endTime = Localization.formatDateTime( workOrderClockings[i].timeEnd, "t" );
                    var startTime = new Date( workOrderClockings[i].timeStart ).getTime();
                    var endTime = new Date( workOrderClockings[i].timeEnd ).getTime();
                    laborListItem.hours = Localization.formatNumber( ( endTime - startTime ) / 1000 / 60 / 60, "n1" );
                    laborListItem.inProgress = false;
                } else {
                    laborListItem.endTime = Localization.getText( "inProgressStatus" );
                    laborListItem.inProgress = true;
                    laborListItem.hours = "-";
                }
                if ( workOrderClockings[i].technicianStatus == JSONData.TECHNICIAN_STATUS_TRAVELING ) {
                    if ( workOrderClockings[i].laborCodeId == JSONData.LABOR_CODE_ID_PARTS_RUN ) {
                        laborListItem.type = Localization.getText( "travelForPartsLabel" );
                    } else {
                        laborListItem.type = Localization.getText( "travelTimeLabel" );
                    }
                } else {
                    laborListItem.type = Localization.getText( "productiveTimeLabel" );
                }
                repairDetailsViewModel.laborHours().push( laborListItem );
            }

            // These lines cause the labor hours list on the page to get refreshed
            // and set the details button as active.  These are needed when a technician
            // changes from traveling to productive while on the repair details page.
            repairDetailsViewModel.laborHours.valueHasMutated();
            $("#manageWorkOrderRepairDetails").addClass( "ui-btn-active" );
        }
    }

    /**
     * Repopulate the standard job code segment selectors
     * when the standard job code mfg is changed
     * @param newValue - New standard job code mfg value
     */
    function onStandardJobCodeMfgChange( newValue ) {
        if ( newValue ) {
            debug && console.log( "ManageWorkOrderRepairDetails.onStandardJobCodeMfgChange: New standard job code mfg = " + JSON.stringify( newValue ) );
            repairDetailsViewModel.repairCodeSegment1List( getStandardJobCodeSegment1List( newValue.webId ) );
            repairDetailsViewModel.repairCodeSegment2List(
                getStandardJobCodeSegment2List( newValue.webId, repairDetailsViewModel.repairCodeSegment1List()[0].completeJobCode )
            );
            repairDetailsViewModel.repairCodeSegment3List(
                getStandardJobCodeSegment3List( newValue.webId, repairDetailsViewModel.repairCodeSegment2List()[0].completeJobCode )
            );
            // Update the standard job code details only if a standard job code is already selected
            if ( repairDetailsViewModel.repairCodeId() ) {
                updateSelectedStandardJobCode( repairDetailsViewModel.repairCodeSegment3List()[0] );
            }
            repairDetailsViewModel.repairCodeId( "" );
        }
    }

    /**
     * Repopulate the standard job code segment 2 and segment 3 selectors
     * when the segment 1 selection is changed
     * @param newValue - New segment 1 value
     */
    function onStandardJobCodeSegment1Change( newValue ) {
        if ( newValue ) {
            debug && console.log( "ManageWorkOrderRepairDetails.onStandardJobCodeSegment1Change: New standard job segment 1 = " + JSON.stringify( newValue ) );
            repairDetailsViewModel.repairCodeSegment2List(
                getStandardJobCodeSegment2List( repairDetailsViewModel.selectedRepairCodeMfg().webId, newValue.completeJobCode )
            );
            repairDetailsViewModel.repairCodeSegment3List(
                getStandardJobCodeSegment3List( repairDetailsViewModel.selectedRepairCodeMfg().webId, repairDetailsViewModel.repairCodeSegment2List()[0].completeJobCode )
            );
            // Update the standard job code details only if a standard job code is already selected
            if ( repairDetailsViewModel.repairCodeId() ) {
                repairDetailsViewModel.repairCodeId( "" );
            }
        }
    }

    /**
     * Repopulate the standard job code segment 3 selector
     * when the segment 2 selection is changed
     * @param newValue - New segment 2 value
     */
    function onStandardJobCodeSegment2Change( newValue ) {
        if ( newValue ) {
            debug && console.log( "ManageWorkOrderRepairDetails.onStandardJobCodeSegment2Change: New standard job segment 2 = " + JSON.stringify( newValue ) );
            repairDetailsViewModel.repairCodeSegment3List(
                getStandardJobCodeSegment3List( repairDetailsViewModel.selectedRepairCodeMfg().webId, newValue.completeJobCode )
            );
            // Update the standard job code details only if a standard job code is already selected
            if ( repairDetailsViewModel.repairCodeId() ) {
                repairDetailsViewModel.repairCodeId( "" );
            }
        }
    }

    /**
     * Refresh standard job code details when the segment 3 is changed
     * @param newValue - New segment 3 value
     */
    function onStandardJobCodeSegment3Change( newValue ) {
        if ( newValue ) {
            debug && console.log( "ManageWorkOrderRepairDetails.onStandardJobCodeSegment3Change: New standard job segment 3 = " + JSON.stringify( newValue ) );
            updateSelectedStandardJobCode( newValue );
        }
    }

    /**
     * Update the repair code details are of the page that displays
     * the selected standard job code.
     * @param standardJobCode - Standard job code
     */
    function updateSelectedStandardJobCode( standardJobCode ) {
        if ( standardJobCode ) {
            debug && console.log( "ManageWorkOrderRepairDetails.updateSelectedStandardJobCode: Standard job code = " + JSON.stringify( standardJobCode ) );
            repairDetailsViewModel.standardJobCodeId( standardJobCode.webId );
            repairDetailsViewModel.standardJobCode( standardJobCode );
            repairDetailsViewModel.repairCodeId( standardJobCode.completeJobCode );
            repairDetailsViewModel.repairCodeDescription( standardJobCode.description );
            repairDetailsViewModel.repairCodeNotes( standardJobCode.notes );
        }
    }

    /**
     * Populate the standard job code mfg info on the page
     */
    function populateStandardJobCodeMfgInfo( workOrder ) {
        // Populate the repair code mfg drop down
        repairDetailsViewModel.availableRepairCodeMfgs.splice( 0, repairDetailsViewModel.availableRepairCodeMfgs().length );
        _.each( standardJobCodeMfgs, function( mfgInList ) {
            repairDetailsViewModel.availableRepairCodeMfgs.push( mfgInList );
        });
        if ( !_.isUndefined( workOrder.workOrderSegments[0].standardJobCode ) &&
             !_.isNull( workOrder.workOrderSegments[0].standardJobCode ) ) {
            var workOrderStandardJobCodeMfg = _.find( standardJobCodeMfgs, function( mfgInList ) {
                return mfgInList.webId === workOrder.workOrderSegments[0].standardJobCode.standardJobCodeManufacturerId;
            });
            if ( !_.isNull( workOrderStandardJobCodeMfg ) && !_.isUndefined( workOrderStandardJobCodeMfg ) ) {
                repairDetailsViewModel.selectedRepairCodeMfg( workOrderStandardJobCodeMfg );
            }
        }

        repairDetailsViewModel.selectedRepairCodeMfg.subscribe( onStandardJobCodeMfgChange );

        $("#repairCodeMfgList").selectmenu( 'refresh' );
        JSONData.setUnsavedChanges( false, "manageWorkOrderSave" );
    }

    /**
     * Set the standard job code select elements to the repair code ID in the view model
     */
    function setSelectedStandardJobCode() {

        var completeRepairCode = repairDetailsViewModel.repairCodeId();
        var repairCodeSegment1 = completeRepairCode.substr( 0, 2 );
        var repairCodeSegment2 = completeRepairCode.substr( 0, 4 );

        // Change the segment selections to match the work order's current standard job code
        repairDetailsViewModel.selectedRepairCodeSegment1( _.find( repairDetailsViewModel.repairCodeSegment1List(), function( codeInList ){
            return codeInList.completeJobCode == repairCodeSegment1;
        }));
        $("#segment1Select").selectmenu( 'refresh' );
        repairDetailsViewModel.selectedRepairCodeSegment2( _.find( repairDetailsViewModel.repairCodeSegment2List(), function( codeInList ){
            return codeInList.completeJobCode == repairCodeSegment2;
        }));
        $("#segment2Select").selectmenu( 'refresh' );
        repairDetailsViewModel.selectedRepairCodeSegment3( _.find( repairDetailsViewModel.repairCodeSegment3List(), function( codeInList ){
            return codeInList.completeJobCode == completeRepairCode;
        }));
        $("#segment3Select").selectmenu( 'refresh' );

        repairDetailsViewModel.repairCodeId( completeRepairCode );
    }

    /**
     * Populate the standard job code info on the page
     */
    function populateStandardJobCodeInfo( workOrder ) {
        var populateFn = function() {
            debug && console.log( "ManageWorkOrderRepairDetails.populateStandardJobCodeInfo: Using populateFn to set standard job code info on page" );

            // Merge the standard job code information into the work order
            if ( workOrder.workOrderSegments[0].standardJobCodeId &&
                 ( _.isNull( workOrder.workOrderSegments[0].standardJobCode ) ||
                   _.isUndefined( workOrder.workOrderSegments[0].standardJobCode ) ) ) {
                workOrder.workOrderSegments[0].standardJobCode = _.find( standardJobCodes, function( codeInList ) {
                    return codeInList.webId == workOrder.workOrderSegments[0].standardJobCodeId;
                });
                JSONData.saveJSON( "workOrders", workOrder, true );
            }

            // Populate the standard job code info for the work order
            if ( workOrder.workOrderSegments[0].standardJobCode ) {
                updateSelectedStandardJobCode( workOrder.workOrderSegments[0].standardJobCode );
            }

            // If the standard job code manufacturer ID is 1, we have a PM work order
            // This causes the repair action code selection controls to be hidden
            if ( WorkOrder.isPMWorkOrder( workOrder ) ) {
            	repairDetailsViewModel.pmWorkOrder( true );              
            } else {

                // Populate the repair code selection drop downs
                if ( repairDetailsViewModel.repairCodeId() ) {
                    // Populate the segment selections to match the work order's current standard job code
                    repairDetailsViewModel.repairCodeSegment1List(
                        getStandardJobCodeSegment1List( repairDetailsViewModel.standardJobCode().standardJobCodeManufacturerId )
                    );
                    repairDetailsViewModel.repairCodeSegment2List(
                        getStandardJobCodeSegment2List( repairDetailsViewModel.standardJobCode().standardJobCodeManufacturerId,
                                                        repairDetailsViewModel.repairCodeId().substr( 0, 2 ) )
                    );
                    repairDetailsViewModel.repairCodeSegment3List(
                        getStandardJobCodeSegment3List( repairDetailsViewModel.standardJobCode().standardJobCodeManufacturerId,
                                                        repairDetailsViewModel.repairCodeId().substr( 0, 4 ) )
                    );
                    setSelectedStandardJobCode();
                } else {
                    // Work order does not have a standard job code assigned...populate the segment selections with default values
                    repairDetailsViewModel.repairCodeSegment1List( getStandardJobCodeSegment1List( JSONData.REPAIR_CODES_MFG_ID ) );
                    repairDetailsViewModel.repairCodeSegment2List(
                        getStandardJobCodeSegment2List( JSONData.REPAIR_CODES_MFG_ID,
                                                        repairDetailsViewModel.repairCodeSegment1List()[0].completeJobCode )
                    );
                    repairDetailsViewModel.repairCodeSegment3List(
                        getStandardJobCodeSegment3List( JSONData.REPAIR_CODES_MFG_ID,
                                                        repairDetailsViewModel.repairCodeSegment2List()[0].completeJobCode )
                    );
                }

                // Subscribe to segment changes so that we can change the select contents when
                // selections are made
                repairDetailsViewModel.selectedRepairCodeSegment1.subscribe( onStandardJobCodeSegment1Change );
                repairDetailsViewModel.selectedRepairCodeSegment2.subscribe( onStandardJobCodeSegment2Change );
                repairDetailsViewModel.selectedRepairCodeSegment3.subscribe( onStandardJobCodeSegment3Change );

                populateStandardJobCodeMfgInfo( workOrder );

                // Add CSS style to put a space between each select used to choose the standard job code
                var selectStyle = {
                    "background-color" : "silver",
                    "padding-left" : "4px"
                };
                $("#segment1Select").parents( "div.ui-select" ).css( selectStyle );
                selectStyle["padding-right"] = "4px";
                $("#segment2Select").parents( "div.ui-select" ).css( selectStyle );
            }
        };

        // Get the standard job codes from the DB
        if ( standardJobCodes.length > 0 ) {
            populateFn();
        } else {
            debug && console.log( "ManageWorkOrderRepairDetails.populateStandardJobCodeInfo: Querying DB for standard job code list" );
            repairDetailsViewModel.isQueryingStandardJobCodes( true );
            JSONData.loadStandardJobCodesFromDatabase( function() {
                repairDetailsViewModel.isQueryingStandardJobCodes( false );
                debug && console.log( "ManageWorkOrderRepairDetails.populateStandardJobCodeInfo: Standard job code DB query complete" );
                standardJobCodes = JSONData.getStandardJobCodes();
                populateFn();
                JSONData.setUnsavedChanges( false, "manageWorkOrderSave" );
            });
        }
    }

    /**
     * populatePage
     * Populate the work order repair work page
     * @param pageId - Page ID for manage work order page being populated
     */
    function populatePage( pageId ) {
        var currentActivity = WorkOrder.getManageWorkOrderActivity();
        var xcodeLineInWorkOrder;
        var xcodes;
        debug && console.log( "ManageWorkOrderRepairDetails.populatePage: Populating the page" );

        // If running on Chrome Desktop, set the content div width to auto
        if ( Util.isRunningOnChromeDesktop() ) {
            $( "div.manage-work-order-repair-details-content" ).css( "width", $(document).width() - 164 );
        }

        ManageWorkOrder.populatePage( pageId );

        var workOrder = ManageWorkOrder.getWorkOrder();

        // Initialize the observable values
        repairDetailsViewModel.additionalRepairNotes( workOrder.workOrderSegments[0].notesBottom );
        var sortedFolders = _.sortBy( folderArray, function( folderInList ) {
            return folderInList.description;
        });
        _.each( sortedFolders, function( folderInList ) {
            repairDetailsViewModel.availableBillingFolders().push( folderInList.description );
        });
        
        var hourMeter = 0;
        if ( workOrder.workOrderSegments[0].hourMeter != null ) {
            hourMeter = workOrder.workOrderSegments[0].hourMeter;
        }
        repairDetailsViewModel.hourMeter( hourMeter );
        var workOrderBillingFolder = _.find( folderArray, function( folderInList ) {
            return folderInList.webId == workOrder.workOrderSegments[0].folderId;
        });
        
        // Check that the work order has a common folder defined in the folderArray
        if ( _.isUndefined( workOrderBillingFolder ) ) {
        	 var uncommonFolder = _.find( JSONData.getObjectsByDataType( "folders" ), function( folderInList ) {
        		 return folderInList.webId == workOrder.workOrderSegments[0].folderId;
        	 });
        	 
        	 if( !_.isUndefined( uncommonFolder ) &&  !_.isUndefined( uncommonFolder.description ) && !_.isNull( uncommonFolder.description )) {
        	        debug && console.log( "ManageWorkOrderRepairDetails: Uncommon folder found, assigning folder display to read-only with value " + uncommonFolder.description  );
        	        
        		 // Folder must be inserted to available options, or else it will not display properly
            	 repairDetailsViewModel.availableBillingFolders().push( uncommonFolder.description );
        		 repairDetailsViewModel.selectedBillingFolder( uncommonFolder.description );
        	 }
        	 repairDetailsViewModel.hasCommonFolder( false );
        } else if( !_.isUndefined( workOrderBillingFolder.description ) && !_.isNull( workOrderBillingFolder.description ) ) {
        	repairDetailsViewModel.hasCommonFolder( true );
            repairDetailsViewModel.selectedBillingFolder( workOrderBillingFolder.description );
        }

        // Populate the select captions
        repairDetailsViewModel.repairCodeSegment1Caption( Localization.getText( "repairCodeSegment1Caption" ) );
        repairDetailsViewModel.repairCodeSegment2Caption( Localization.getText( "repairCodeSegment2Caption" ) );
        repairDetailsViewModel.repairCodeSegment3Caption( Localization.getText( "repairCodeSegment3Caption" ) );
        repairDetailsViewModel.repairTypeCaption( Localization.getText( "repairTypeCaption" ) );
        repairDetailsViewModel.xcodeCaption( Localization.getText( "xcodeCaption" ) );

        // Populate the standard job code part of the page.
        populateStandardJobCodeInfo( workOrder );

        // Populate the labor hours part of the page.
        populateLaborHoursList();

        // Populate the X codes select and subscribe to changes
        xcodes = _.sortBy( JSONData.getObjectsByDataType( "xcodes" ), function( xcodeInList ) {
            return xcodeInList.completeJobCode;
        });
        _.each( xcodes, function( xcodeInList ) {
            repairDetailsViewModel.availableXcodes.push( xcodeInList );
        });

        // When setting the selected Xcode, we must set it to an element inside
        // the observable array
        xcodeLineInWorkOrder = WorkOrder.getXcodeLineFromWorkOrder( workOrder );
        if ( xcodeLineInWorkOrder && !xcodeLineInWorkOrder.deleted ) {
            repairDetailsViewModel.selectedXcode( _.find( repairDetailsViewModel.availableXcodes(), function( xcodeInList ) {
                return xcodeInList.webId == xcodeLineInWorkOrder.xcode.webId;
            }));
        }
        repairDetailsViewModel.selectedXcodeText = ko.computed( function() {
            if ( repairDetailsViewModel.selectedXcode() ) {
                return ( repairDetailsViewModel.selectedXcode().completeJobCode + ' ' +
                         repairDetailsViewModel.selectedXcode().description );
            } else {
                return "";
            }
        });

        // Populate the PO number using the documentReference property
        repairDetailsViewModel.poNumberRequired( ManageWorkOrder.getCustomer().poNumberRequired ||
                                                 ManageWorkOrder.getWorkOrder().documentReference );
        if ( ManageWorkOrder.getWorkOrder().documentReference ) {
            repairDetailsViewModel.poNumber( $.trim( ManageWorkOrder.getWorkOrder().documentReference ) );
        }

        // Set up the writable flag, the dirty flag and apply the knockout bindings
        // Repair details page is made read only if the technician signed the work order.
        repairDetailsViewModel.writable( ManageWorkOrder.isWritable() );

        // Initialize the has equipment observable
        if( ManageWorkOrder.getEquipment().webId == undefined ) {
            repairDetailsViewModel.hasEquipment( false );	
        }

        // Functions for determining when page sections should be visible
        repairDetailsViewModel.isRepairCodeSelectionVisible = ko.computed( function() {
            return ( repairDetailsViewModel.writable() &&
                     !repairDetailsViewModel.pmWorkOrder() &&
                     !repairDetailsViewModel.isQueryingStandardJobCodes() &&
                     currentActivity == WorkOrder.MANAGE_WORK_ORDER_OPEN );
        });
        repairDetailsViewModel.isRepairNotesWritable = ko.computed( function() {
            return ( repairDetailsViewModel.writable() &&
                     currentActivity == WorkOrder.MANAGE_WORK_ORDER_OPEN ||
                     currentActivity == WorkOrder.MANAGE_WORK_ORDER_OPEN_NOCLOCKING );
        });
        repairDetailsViewModel.isStandardJobCodeInformationVisible = ko.computed( function() {
            return ( ( repairDetailsViewModel.repairCodeId() ||
                       repairDetailsViewModel.selectedXcode() ) &&
                       !repairDetailsViewModel.isQueryingStandardJobCodes() );
        });

        ko.applyBindings( repairDetailsViewModel );
        debug && console.log( "ManageWorkOrderRepairDetails.populatePage: Writable = " + repairDetailsViewModel.writable() );
        UIFrame.showElement( "div#manageWorkOrderRepairDetailsPageContent", "block" );
    }

    /**
     * To set the "dirty" flag, bind this function as the onchange handler to any element that
     * changes a value in the model
     */
    function valueChanged() {
        debug && console.log( "ManageWorkOrderRepairDetails: value changed" );
        JSONData.setUnsavedChanges( true, "manageWorkOrderSave" );
    }

    /**
     * Save work order click handler
     */
    function saveClickHandler() {
        var billingFolderHeader  = $("#billingFolderHeader");
        var equipmentHoursHeader = $("#equipmentHoursHeader");

        // Reset label colors for properties being verified
        billingFolderHeader.css( "color", "#000000" );
        equipmentHoursHeader.css( "color", "#000000" );

        // After checking the equipment hours, this function is called to
        // confirm the billing folder selection before saving the work order
        var confirmBillingFolderFn = function() {
            var confirmPrompt =
                Localization.getText( "billingFolderConfirmPrompt" ).replace( "billingFolder",
                                                                              repairDetailsViewModel.selectedBillingFolder() );
            if ( WorkOrder.isBillingFolderVerified() ) {
                saveWorkOrder();
            } else {
                Dialog.showConfirmYesNo( Localization.getText( "billingFolderLabel" ),
                                         confirmPrompt,
                    function() {
                        Dialog.closeDialog( false );
                        WorkOrder.setBillingFolderVerified( true );
                        saveWorkOrder();
                    },
                    function() {
                        Dialog.closeDialog( false );
                        billingFolderHeader.css( "color", "#FF0000" );
                    }, "400px"
                );
            }
        };

        if ( repairDetailsViewModel.hourMeter() < currentlySavedHourMeter ) {
            // Equipment hour meter cannot be less than currently saved value
            equipmentHoursHeader.css( "color", "#FF0000" );
            Dialog.showAlert( Localization.getText( "equipmentHoursLabel" ),
                              Localization.getText( "equipmentHourMeterValueInvalid" ) + currentlySavedHourMeter,
                              null, "350px" );
        } else if ( repairDetailsViewModel.hourMeter() == currentlySavedHourMeter ){
            // Display confirm when equipment hour meter is unchanged
            Dialog.showConfirmYesNo( Localization.getText( "equipmentHoursLabel" ),
                                     Localization.getText( "equipmentHoursUnchangedPrompt"),
                function() {
                    Dialog.closeDialog( false );
                    confirmBillingFolderFn();
                }, function() {
                    equipmentHoursHeader.css( "color", "#FF0000" );
                    Dialog.closeDialog( false );
                }, '400px'
            );
        } else {
            confirmBillingFolderFn();
        }
    }

    /**
     * Save the updated repair details into the work order
     * @param postToMiddleTierAfterSave - Boolean, post to middle tier after save? Default = true
     */
    function saveWorkOrder( postToMiddleTierAfterSave ) {
        var selectedXcode;
        var workOrder = ManageWorkOrder.getWorkOrder();
        if ( typeof postToMiddleTierAfterSave == "undefined" ) {
            postToMiddleTierAfterSave = true;
        }

        // Update the billing folder ID.  Use entire folder feed so that uncommon
        // folders can also be saved
        var selectedBillingFolder = _.find( JSONData.getObjectsByDataType( "folders" ), function( folderInList ) {
            return folderInList.description == repairDetailsViewModel.selectedBillingFolder();
        });
        workOrder.workOrderSegments[0].folderId = selectedBillingFolder.webId;

        // Update the equipment hour meter
        workOrder.workOrderSegments[0].hourMeter = parseInt(repairDetailsViewModel.hourMeter());
        debug && console.log( "ManageWorkOrderRepairDetails.saveWorkOrder: Changing hourMeter to " + workOrder.workOrderSegments[0].hourMeter );

        // Update the document reference which contains the PO number
        workOrder.documentReference = $.trim( repairDetailsViewModel.poNumber() );
        debug && console.log( "ManageWorkOrderRepairDetails.saveWorkOrder: Changing documentReference to " + workOrder.documentReference );

        // Update the repair notes
        workOrder.workOrderSegments[0].notesBottom = repairDetailsViewModel.additionalRepairNotes();
        debug && console.log( "ManageWorkOrderRepairDetails.saveWorkOrder: Changing notesBottom to " + workOrder.workOrderSegments[0].notesBottom );

        // Update the standard job code
        if ( repairDetailsViewModel.standardJobCodeId() != "" ) {
            workOrder.workOrderSegments[0].standardJobCodeId = repairDetailsViewModel.standardJobCodeId();
            workOrder.workOrderSegments[0].standardJobCode = repairDetailsViewModel.standardJobCode();
            debug && console.log( "ManageWorkOrderRepairDetails.saveWorkOrder: Changing standardJobCodeId to " + workOrder.workOrderSegments[0].standardJobCodeId );
        }

        // Add the selected xcode
        selectedXcode = repairDetailsViewModel.selectedXcode();
        if ( selectedXcode ) {
            WorkOrder.addXcodeToWorkOrder( workOrder, selectedXcode );
        } else {
            WorkOrder.removeXcodeFromWorkOrder( workOrder );
        }

        // Save the updates
        debug && console.log( "ManageWorkOrderRepairDetails.saveWorkOrder: Saving updated repair details into work order " + workOrder.documentNumber );
        workOrder.postToMiddleTierRequired = true;
        JSONData.saveJSON( "workOrders", workOrder, true );
        JSONData.setUnsavedChanges( false, "manageWorkOrderSave" );

        // Post the work order to the middle tier
        if ( postToMiddleTierAfterSave ) {
            WorkOrder.postWorkOrder( workOrder, true, true, function( updatedWorkOrder ) {
                debug && console.log( "ManageWorkOrderRepairDetails.saveChanges: Work order " +
                                          updatedWorkOrder.documentNumber + " successfully posted to middle tier" );
                WorkOrder.displayWorkOrderChangedAlert( updatedWorkOrder, null );
            }, null );
        }

        // Navigate to a page after save completes.  If page is not saved in local storage, this
        // call does nothing
        UIFrame.navigateToPageAfterSaveCompletes();
    }

    /**
     * Get the standard job code list for segment 1
     * @param standardJobCodeMfgId - Segment 1 list is filtered by
     *                               the seelected standard job code mfg id.
     */
    function getStandardJobCodeSegment1List( standardJobCodeMfgId ) {
        var segment1List = _.filter( standardJobCodes, function( jobCodeInList ) {
            return ( jobCodeInList.completeJobCode.length == 2 &&
                     jobCodeInList.completeJobCode !== "PM" &&
                     jobCodeInList.standardJobCodeManufacturerId == standardJobCodeMfgId );
        });
        return _.sortBy( segment1List, function( segmentInList ) {
            return segmentInList.completeJobCode;
        });
    }

    /**
     * Get the standard job code list for segment 2
     * @param standardJobCodeMfgId - Selected standard job code manufacturer ID
     * @param segment1JobCode - Selected segment 1 complete job code
     */
    function getStandardJobCodeSegment2List( standardJobCodeMfgId, segment1JobCode ) {
        if ( !segment1JobCode || !standardJobCodeMfgId ) {
            throw "ManageWorkOrderRepairDetails.getStandardJobCodeSegment2List: One or more required parameters ( standardJobCodeMfgId, segment1JobCode ) are null or undefined";
        }
        var segment2List = _.filter( standardJobCodes, function( jobCodeInList ) {
            return ( jobCodeInList.completeJobCode.length == 4 &&
                     jobCodeInList.completeJobCode.substr( 0, 2 ) == segment1JobCode &&
                     jobCodeInList.standardJobCodeManufacturerId == standardJobCodeMfgId );
        });
        return _.sortBy( segment2List, function( segmentInList ) {
            return segmentInList.completeJobCode;
        });
    }

    /**
     * Get the standard job code list for segment 3
     * @param standardJobCodeMfgId - Selected standard job code manufacturer ID
     * @param segment2JobCode - Selected segment 2 complete job code
     */
    function getStandardJobCodeSegment3List( standardJobCodeMfgId, segment2JobCode ) {
        if ( !segment2JobCode || !standardJobCodeMfgId ) {
            throw "ManageWorkOrderRepairDetails.getStandardJobCodeSegment3List: One or more required parameters ( standardJobCodeMfgId, segment2JobCode ) are null or undefined";
        }
        var segment3List = _.filter( standardJobCodes, function( jobCodeInList ) {
            return ( jobCodeInList.completeJobCode.length > 4 &&
                     jobCodeInList.completeJobCode.substr( 0, 4 ) == segment2JobCode &&
                     jobCodeInList.standardJobCodeManufacturerId == standardJobCodeMfgId );
        });
        return _.sortBy( segment3List, function( segmentInList ) {
            return segmentInList.completeJobCode;
        });
    }

    return {
        'getStandardJobCodeSegment1List'    : getStandardJobCodeSegment1List,
        'getStandardJobCodeSegment2List'    : getStandardJobCodeSegment2List,
        'getStandardJobCodeSegment3List'    : getStandardJobCodeSegment3List,
        'init'                              : init,
        'populateLaborHoursList'            : populateLaborHoursList,
        'populatePage'                      : populatePage,
        'valueChanged'                      : valueChanged
    };
}();

/**
 * pageinit event handler
 */
$("div:jqmData(role='page')").on( "pageinit", function( event, ui ) {
    // All pages must set pageId to this.id
    var pageId = this.id;
    debug && console.log( "ManageWorkOrderRepairDetails.pageinit" );
    UIFrame.init( pageId, function() {
        debug && console.log( "ManageWorkOrderRepairDetails.pageinit: Executing page specific init" );
        ManageWorkOrderRepairDetails.init();
        ManageWorkOrderRepairDetails.populatePage( pageId );
        // This MUST be the last line inside each page specific init function
        UIFrame.postPageSpecificInit( pageId );
    });
});
