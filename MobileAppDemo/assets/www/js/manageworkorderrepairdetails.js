/**
 * manageworkorderlabor.js
 */

"use strict";

/**
 * ManageWorkOrderRepairDetails object
 */
var ManageWorkOrderRepairDetails = function() {

    // Detect changes to repair details
    var repairDetailsChanged = false;
    
    // Currently saved equipment hour meter value.  New value entered
    // by user cannot be less than this
    var currentlySavedHourMeter = null;
    
    // All of the available standard job codes
    var standardJobCodes = [];
    
    // Holds list of available billing folders
    var folderArray = [];
    
    /**
     * Handling the onbeforeload event allows the app to confirm
     * leaving this page if there are unsaved changes
     */
    window.onbeforeunload = function() {
        if ( repairDetailsChanged ) {
            $.mobile.hidePageLoadingMsg();
            $("#manageWorkOrderParts").removeClass( "ui-btn-active" );
            $("#manageWorkOrderRepairDetails").addClass( "ui-btn-active" );
            return Localization.getText( "leavingRepairDetailsPagePrompt" );
        }
    };
    
    /**
     * Knockout view model for this page
     */
    var repairDetailsViewModel = {
        additionalRepairNotes : ko.observable( "" ),
        availableBillingFolders : ko.observableArray( [] ),
        hourMeter : ko.observable( 0 ),
        laborHours : ko.observableArray( [] ),
        poNumber : ko.observable( "" ),
        poNumberRequired : ko.observable( false ),
        repairCodeId : ko.observable( "" ),
        repairCodeDescription : ko.observable( "" ),
        repairCodeNotes : ko.observable( "" ),
        selectedBillingFolder : ko.observable( "" ),
        standardJobCodeId : ko.observable( "" ),
        standardJobCode : ko.observable( null ),
        writable : ko.observable( false ),
        // Click handler for the save button
        saveWorkOrder : saveClickHandler,
        selectRepairCode : selectRepairCode
    };
    
    /**
     * Init this object
     */
    function init() {
        debug && console.log( "ManageWorkOrderRepairDetails.init" );
        ManageWorkOrder.init();
        
        // Folder list filtered by those chosen by Crown that are work order related
        var filteredFolderIds = [ "402", "403", "404", "405", "406", "407", "408", "426", "427", "428", "431", "433", "436", "437", "439", "440", "443", "444" ];
        folderArray = _.filter( JSONData.getObjectsByDataType( "folders" ), function( folderInList ) {
            return ( _.indexOf( filteredFolderIds, folderInList.internalId, true ) != -1 );
        });
        
        // When the additional repair notes TextArea is selected, silently scroll the page
        $( '#additionalRepairNotes' ).focus( function() {
        	$.mobile.silentScroll( 62 );
        });
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
                var clockingTime = new Date( clockingInList.timeStart ).getTime();
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
                    laborListItem.type = Localization.getText( "travelTimeLabel" ); 
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
     * Populate the standard job code info on the page
     */
    function populateStandardJobCodeInfo( workOrder ) {
        debug && console.log( "ManageWorkOrderRepairDetails.populateStandardJobCodeInfo" );
        repairDetailsViewModel.standardJobCodeId( workOrder.workOrderSegments[0].standardJobCodeId );
        repairDetailsViewModel.standardJobCode( workOrder.workOrderSegments[0].standardJobCode );
        repairDetailsViewModel.repairCodeId( workOrder.workOrderSegments[0].standardJobCode.completeJobCode );
        repairDetailsViewModel.repairCodeDescription( workOrder.workOrderSegments[0].standardJobCode.description );
        repairDetailsViewModel.repairCodeNotes( workOrder.workOrderSegments[0].standardJobCode.notes );
    }

    /**
     * populatePage
     * Populate the work order repair work page
     * @param pageId - Page ID for manage work order page being populated
     */
    function populatePage( pageId ) {
        debug && console.log( "ManageWorkOrderRepairDetails.populatePage: Populating the page" );
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
        currentlySavedHourMeter = hourMeter;
        var workOrderBillingFolder = _.find( folderArray, function( folderInList ) {
            return folderInList.webId == workOrder.workOrderSegments[0].folderId;
        });
        repairDetailsViewModel.selectedBillingFolder( workOrderBillingFolder.description );
        
        // Populate the standard job code part of the page.  If the work order
        // does not have this information, get it from the database
        if ( workOrder.workOrderSegments[0].standardJobCode ) {
            populateStandardJobCodeInfo( workOrder );
        } else {
            debug && console.log( "ManageWorkOrderRepairDetails.populatePage: Getting standard job code info from DB" );
            JSONData.getObjectFromDatabaseById( "standardJobCodes", workOrder.workOrderSegments[0].standardJobCodeId,
                function( standardJobCode ) {
                    if ( standardJobCode ) {
                        workOrder.workOrderSegments[0].standardJobCode = standardJobCode;
                        JSONData.saveJSON( "workOrders", workOrder );
                        populateStandardJobCodeInfo( workOrder );
                    }
                }
            );
        }
        
        populateLaborHoursList();
        repairDetailsViewModel.poNumberRequired( ManageWorkOrder.getCustomer().poNumberRequired ||  
                                                 ManageWorkOrder.getWorkOrder().documentReference );
        if ( ManageWorkOrder.getWorkOrder().documentReference ) {
            repairDetailsViewModel.poNumber( ManageWorkOrder.getWorkOrder().documentReference );
        }
        
        // Set up the writable flag, the dirty flag and apply the knockout bindings
        // Repair details page is made read only if the technician signed the work order.
        repairDetailsViewModel.writable( !ManageWorkOrder.isReadOnly() &&
                                         !JSONData.isWorkOrderSignedByTechnician( ManageWorkOrder.getWorkOrder() ) );
                
        ko.applyBindings( repairDetailsViewModel );
        debug && console.log( "ManageWorkOrderRepairDetails.populatePage: Writable = " + repairDetailsViewModel.writable() );
    };

    /**
     * To set the "dirty" flag, bind this function as the onchange handler to any element that
     * changes a value in the model 
     */
    function valueChanged() {
        debug && console.log( "ManageWorkOrderRepairDetails: value changed" );
        repairDetailsChanged = true;
    }
    
    /**
     * Save work order click handler
     */
    function saveClickHandler() {

        // Repair code must be chosen to save the work order
        if ( repairDetailsViewModel.repairCodeId() ) {
        
            if ( repairDetailsViewModel.hourMeter() < currentlySavedHourMeter ) {
                // Equipment hour meter cannot be less than currently saved value
                Dialog.showAlert( Localization.getText( "equipmentHoursLabel" ),
                                  Localization.getText( "equipmentHourMeterValueInvalid" ) + currentlySavedHourMeter,
                                  null, "350px" );
            } else if ( repairDetailsViewModel.hourMeter() == currentlySavedHourMeter ){
                // Display confirm when equipment hour meter is unchanged
                Dialog.showConfirmYesNo( Localization.getText( "equipmentHoursLabel" ),
                                         Localization.getText( "equipmentHoursUnchangedPrompt"),
                    function() {
                        UIFrame.closeActiveDialog();
                        saveWorkOrder();
                    }, function() {
                        UIFrame.closeActiveDialog();
                    }
                );
            } else {
                saveWorkOrder();
            }
        } else {
            Dialog.showAlert( Localization.getText( "repairCodeMissingTitle" ),
                              Localization.getText( "repairCodeMissingPrompt" ),
                              null, "350px" );
        }
    }
    
    /**
     * Save the updated repair details into the work order
     */
    function saveWorkOrder() {
        var workOrder = ManageWorkOrder.getWorkOrder();
        
        // Update the billing folder ID
        var selectedBillingFolder = _.find( folderArray, function( folderInList ) {
            return folderInList.description == repairDetailsViewModel.selectedBillingFolder();
        });
        workOrder.workOrderSegments[0].folderId = selectedBillingFolder.webId;
        
        // Update the equipment hour meter
        workOrder.workOrderSegments[0].hourMeter = parseInt(repairDetailsViewModel.hourMeter());
        debug && console.log( "ManageWorkOrderRepairDetails.saveWorkOrder: Changing hourMeter to " + workOrder.workOrderSegments[0].hourMeter );
        
        // Update the document reference which contains the PO number
        if ( repairDetailsViewModel.poNumberRequired() ) {
            workOrder.documentReference = repairDetailsViewModel.poNumber();
            debug && console.log( "ManageWorkOrderRepairDetails.saveWorkOrder: Changing documentReference to " + workOrder.documentReference );
        }
        
        // Update the repair notes
        workOrder.workOrderSegments[0].notesBottom = repairDetailsViewModel.additionalRepairNotes();
        debug && console.log( "ManageWorkOrderRepairDetails.saveWorkOrder: Changing notesBottom to " + workOrder.workOrderSegments[0].notesBottom );
        
        // Update the standard job code
        if ( repairDetailsViewModel.standardJobCodeId() != "" ) {
            workOrder.workOrderSegments[0].standardJobCodeId = repairDetailsViewModel.standardJobCodeId();
            workOrder.workOrderSegments[0].standardJobCode = repairDetailsViewModel.standardJobCode();
            debug && console.log( "ManageWorkOrderRepairDetails.saveWorkOrder: Changing standardJobCodeId to " + workOrder.workOrderSegments[0].standardJobCodeId );
        }
        
        // Save the updates
        debug && console.log( "ManageWorkOrderRepairDetails.saveWorkOrder: Saving updated repair details into work order " + workOrder.documentNumber );
        workOrder.postToMiddleTierRequired = true;
        JSONData.saveJSON( "workOrders", workOrder );
        
        // Post the work order to the middle tier
        JSONData.postWorkOrder( workOrder, true, true, function( updatedWorkOrder ) {
            debug && console.log( "ManageWorkOrderRepairDetails.saveChanges: Work order " +
                                  updatedWorkOrder.documentNumber + " successfully posted to middle tier" );
        }, null );
        
        // Dialog.showAlert( Localization.getText( "partsSaved" ), Localization.getText( "workOrderPartsSaved" ));
        repairDetailsChanged = false;
        currentlySavedHourMeter = workOrder.workOrderSegments[0].hourMeter;
    }
    
    /**
     * Select a repair code for the work order
     */
    function selectRepairCode() {
        debug && console.log( "ManageWorkOrderRepairDetails.selectRepairCode: Selecting repair code for work order" );
        
        var dialogFn = function() {
            var dialogHtml = new EJS({url: 'templates/selectrepaircodedialog' }).render( {
                currentRepairCodeId : repairDetailsViewModel.repairCodeId(),
                currentRepairCodeDescription : repairDetailsViewModel.repairCodeDescription(),
                currentRepairCodeNotes : repairDetailsViewModel.repairCodeNotes()
            });
            $(document).simpledialog2({
                mode : 'blank',
                blankContent : dialogHtml,
                height: '400px',
                width: '600px'
            });
        };
        
        if ( standardJobCodes.length == 0 ) {
            JSONData.getObjectsFromDatabase( "standardJobCodes", function( results ) {
                standardJobCodes = results;
                dialogFn();
            });
        } else {
            dialogFn();
        }
    }
    
    /**
     * Change the currently selected repair code
     */
    function changeSelectedRepairCode( jobCode ) {
        var standardJobCode = _.find( standardJobCodes, function( jobCodeInList ){
            return jobCodeInList.completeJobCode == jobCode;    
        });
        if ( standardJobCode.notes ) {
            $("#selectedRepairCode").text( standardJobCode.completeJobCode + " - " + standardJobCode.notes );
        } else {
            $("#selectedRepairCode").text( standardJobCode.completeJobCode + " - " + standardJobCode.description );
        }
    }
    
    /**
     * Get the standard job code list for segment 1
     */
    function getStandardJobCodeSegment1List() {
        var segment1List = _.filter( standardJobCodes, function( jobCodeInList ) {
            return jobCodeInList.completeJobCode.length == 2;
        });
        return _.sortBy( segment1List, function( segmentInList ) {
            return segmentInList.completeJobCode;
        });
    }

    /**
     * Get the standard job code list for segment 2
     */
    function getStandardJobCodeSegment2List( segment1JobCode ) {
        if ( !segment1JobCode ) {
            throw "ManageWorkOrderRepairDetails.getStandardJobCodeSegment2List: Required parameter segment1JobCode is undefined";
        }
        var segment2List = _.filter( standardJobCodes, function( jobCodeInList ) {
            return ( jobCodeInList.completeJobCode.length == 4 &&
                     jobCodeInList.completeJobCode.substr( 0, 2 ) == segment1JobCode );
        });
        return _.sortBy( segment2List, function( segmentInList ) {
            return segmentInList.completeJobCode;
        });
    }

    /**
     * Get the standard job code list for segment 3
     */
    function getStandardJobCodeSegment3List( segment2JobCode ) {
        if ( !segment2JobCode ) {
            throw "ManageWorkOrderRepairDetails.getStandardJobCodeSegment3List: Required parameter segment2JobCode is undefined";
        }
        var segment3List = _.filter( standardJobCodes, function( jobCodeInList ) {
            return ( jobCodeInList.completeJobCode.length > 4 &&
                     jobCodeInList.completeJobCode.substr( 0, 4 ) == segment2JobCode );
        });
        return _.sortBy( segment3List, function( segmentInList ) {
            return segmentInList.completeJobCode;
        });
    }
    
    /**
     * Populate the segment 2 select element with options for the specified segment 1 job code
     * @param segment1JobCode
     */
    function populateSegment2List( segment1JobCode ) {
        debug && console.log( "selectrepaircodedialog.populateSegment2List: Populating segment2 list with job codes for segment1 job code " +
                              segment1JobCode );
        var segment2Select = $('#segment2Select'); 
        segment2Select.children('option').remove();
        var segment2List = ManageWorkOrderRepairDetails.getStandardJobCodeSegment2List( segment1JobCode );
        for ( var index = 0; index < segment2List.length; index++ ) {
            segment2Select.append( "<option value='" + segment2List[index].completeJobCode + "'>" +
                                   segment2List[index].completeJobCode.substr( 2, 2 ) + " - " + segment2List[index].description + "</option>" );   
        }
        segment2Select.selectmenu( "refresh", true );
        populateSegment3List( segment2List[0].completeJobCode );
    }

    /**
     * Populate the segment 3 select element with options for the specified segment 2 job code
     * @param segment2JobCode
     */
    function populateSegment3List( segment2JobCode ) {
        debug && console.log( "selectrepaircodedialog.populateSegment3List: Populating segment3 list with job codes for segment2 job code " +
                              segment2JobCode );
        var segment3Select = $('#segment3Select'); 
        segment3Select.children('option').remove();
        var segment3List = ManageWorkOrderRepairDetails.getStandardJobCodeSegment3List( segment2JobCode );
        for ( var index = 0; index < segment3List.length; index++ ) {
            segment3Select.append( "<option value='" + segment3List[index].completeJobCode + "'>" +
                                   segment3List[index].completeJobCode.substr( 4 ) + " - " + segment3List[index].description + "</option>" );   
        }
        segment3Select.selectmenu( "refresh", true );
        changeSelectedRepairCode( segment3List[0].completeJobCode );
    }
    
    /**
     * Repopulate the other segment lists when a segment1 selection is made
     */
    function onSegment1Change() {
        var segment1JobCode = $("#segment1Select").val();
        debug && console.log( "selectrepaircodedialog.onSegment1Change: segment1 changed to " + segment1JobCode );
        populateSegment2List( segment1JobCode );
    }

    /**
     * Repopulate the segment3 list when a segment2 selection is made
     */
    function onSegment2Change() {
        var segment2JobCode = $("#segment2Select").val();
        debug && console.log( "selectrepaircodedialog.onSegment2Change: segment2 changed to " + segment2JobCode );
        populateSegment3List( segment2JobCode );
    }
    
    /**
     * Change the currently selected repair code value when segment3 selection is made
     */
    function onSegment3Change() {
        var segment3JobCode = $("#segment3Select").val();
        debug && console.log( "selectrepaircodedialog.onSegment3Change: segment3 changed to " + segment3JobCode );
        changeSelectedRepairCode( segment3JobCode );
    }
    
    /**
     * Set the work order's repair code.  This is used by the
     * selectrepaircodedialog to save the selected repair code
     * @param repairCode - Selected repair code
     */
    function setRepairCode( repairCode ) {
        if ( !repairCode ) {
            throw "ManageWorkOrderRepairDetails.setRepairCode: Required parameter repairCode is undefined";
        }
        
        // Get the standardJobCode information for the selected repair code
        var standardJobCode = _.find( standardJobCodes, function( jobCodeInList ) {
            return jobCodeInList.completeJobCode == repairCode;
        });
        if ( standardJobCode ) {
            // Update view model with the standard job code information
            repairDetailsViewModel.repairCodeId( standardJobCode.completeJobCode );
            repairDetailsViewModel.repairCodeDescription( standardJobCode.description );
            repairDetailsViewModel.repairCodeNotes( standardJobCode.notes );
            repairDetailsViewModel.standardJobCodeId( standardJobCode.webId );
            repairDetailsViewModel.standardJobCode( standardJobCode );
            repairDetailsChanged = true;
        } else {
            throw "ManageWorkOrderRepairDetails.setRepairCode: standardJobCode not found for repairCode " + repairCode;
        }
    }
    
    return {
        'changeSelectedRepairCode'          : changeSelectedRepairCode,
        'getStandardJobCodeSegment1List'    : getStandardJobCodeSegment1List,
        'getStandardJobCodeSegment2List'    : getStandardJobCodeSegment2List,
        'getStandardJobCodeSegment3List'    : getStandardJobCodeSegment3List,
        'init'                              : init,
        'onSegment1Change'                  : onSegment1Change,
        'onSegment2Change'                  : onSegment2Change,
        'onSegment3Change'                  : onSegment3Change,
        'populateLaborHoursList'            : populateLaborHoursList,
        'populatePage'                      : populatePage,
        'setRepairCode'                     : setRepairCode,
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
