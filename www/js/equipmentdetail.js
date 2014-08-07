/**
 * equipmentdetail.js
 */

"use strict";

/**
 *
 */
var EquipmentDetail = function() {
    // Local variables that may be maintained across different equipment detail contexts
    var parts = null,
        workOrders = null,
        equipment = null,
        equipmentId = null,
        openWorkList = null,
        standardJobCodeArray = [],
        plannedMaintenance = null,
        equipmentWorkOrders = null,
        partsListInitialized = false,
        navBarContext = "workHistory",
        detailsContext = "workOrderHistory",
        psrtModelCrossReference = null;

    /**
     * Perform the inventory load and display after the page loads
     */
    $(window).load( function() {
        Dialog.showPleaseWait( Localization.getText( "equipmentDetailPage" ),
                               Localization.getText( "loadingEquipmentFromDB" ), '400px' );

        // Retrieve the required equipmentId from local storage
        if ( window.localStorage.getItem( "equipmentId" ) != "") {
            equipmentId = window.localStorage.getItem( "equipmentId" );
        }

        debug && console.log( "EquipmentDetail.init: Getting all SQLite data before populating page" );
        JSONData.loadStandardJobCodesFromDatabase( function() {
            debug && console.log( "EquipmentDetail.init: loadStandardJobCodesFromDatabase returned.  Loading equipment from database." );
            standardJobCodeArray = JSONData.getStandardJobCodes();
            JSONData.getObjectFromDatabaseById( "equipment", equipmentId, function( equipmentFromDB ) {
                Dialog.closeDialog( false );
                UIFrame.showElement( "div#equipmentDetailPageContent", "block" );
                equipment = equipmentFromDB;
                debug && console.log( "EquipmentDetail.init: Equipment loaded from DB.  Populating page." );
                populateWorkHistoryListView();

                // Bind the listeners for the done buttons
                $('#btnDone').click( function() {
                    debug && console.log( "EquipmentDetail: Done button clicked" );
                    var invokingPage = window.localStorage.getItem( "invokingPage" );

                    if( invokingPage == "manageworkorderoverview" ) {
                        window.localStorage.removeItem( "invokingPage" );
                        UIFrame.navigateToPage( "manageworkorderoverview.html" );
                    } else if( invokingPage == "manageworkorderdiagnostics" ) {
                        window.localStorage.removeItem( "invokingPage" );
                        UIFrame.navigateToPage( "manageworkorderdiagnostics.html" );
                    } else if( invokingPage == "manageworkorderparts" ) {
                        window.localStorage.removeItem( "invokingPage" );
                        UIFrame.navigateToPage( "manageworkorderparts.html" );
                    } else if( invokingPage == "manageworkorderrepairdetails" ) {
                        window.localStorage.removeItem( "invokingPage" );
                        UIFrame.navigateToPage( "manageworkorderrepairdetails.html" );
                    } else if( invokingPage == "manageworkorderreview" ) {
                        window.localStorage.removeItem( "invokingPage" );
                        UIFrame.navigateToPage( "manageworkorderreview.html" );
                    } else if( invokingPage == "manageworkorderrepairdetails" ) {
                        window.localStorage.removeItem( "invokingPage" );
                        UIFrame.navigateToPage( "manageworkorderrepairdetails.html" );
                    } else {
                        UIFrame.navigateToPage( "customerequipment.html" );
                    }
                });

                // Bind the listener to create a new work order
                $('#newButton').click( newWorkOrder );

                // Bind the listener to show equipment alerts
                $('#alertsButton').click( EquipmentDetail.showAlerts );

                // Bind the listener to go to the Crown Catalog
                $('#catalogButton').click( EquipmentDetail.showCatalog );

                // Bind the listener to show the equipment notes
                $('#notesButton').click( EquipmentDetail.showNotes );

                $('#specsButton').click( EquipmentDetail.showSpecs );

                // Bind the listener to show the warranty information
                $('#warrantyLabel').click( EquipmentDetail.showWarranty );

                // Adjust the style for the search form that appears at the top of the
                // equipment detail list
                var equipmentListSearchFormStyle = {
                    'margin-left'  : '0px',
                    'margin-right' : '0px',
                    'margin-top'   : '0px',
                    'border-style' : 'none'
                };
                $(".ui-listview-filter").css( equipmentListSearchFormStyle );
            });
        });
    } );

    /**
     * Initialization
     */
    var init = _.once( function( pageId ) {
        // Initialize the local file system.  This is needed for PSRT integration
        debug && console.log( "EquipmentDetail.init: Initializing the local file system" );
        LocalFS.init();

        // Load the PSRT model cross reference data
        JSONData.loadJSON( "json/psrtModelCrossReference.json", function( data ) {
            debug && console.log( "EquipmentDetail.init: PSRT model cross reference data loaded" );
            psrtModelCrossReference = data;
        }, null );

        // This MUST be the last line inside each page specific init function
        UIFrame.postPageSpecificInit( pageId );
    });

    /**
     * Populate the equipment detail list
     */
    function populateWorkHistoryListView( workOrderList, repopulatingList ) {
        debug && console.log( "EquipmentDetail.populateWorkHistoryListView: Populating the equipment detail list" );

        if( workOrderList && workOrderList.length >= 0 ) {
            workOrders = workOrderList;
        } else {
            workOrders = JSONData.getFilteredObjectList( "workOrders", function( currentWorkOrder ) {
                return ( currentWorkOrder.workOrderSegments[0].equipmentId == equipmentId && currentWorkOrder.workOrderSegments[0].dateClosed != "" &&
                         currentWorkOrder.workOrderSegments[0].dateClosed != null );
            });
        }

        // Save an array of all work orders relevant to this piece of equipment for parts history
        if( equipmentWorkOrders == null ) {
            equipmentWorkOrders = workOrders;
        }

        if( repopulatingList === undefined ) {
            repopulatingList = false;
        }

        var currentEquipment = equipment,
            manufacturerInternalId = currentEquipment.manufacturer,
            warranty = currentEquipment.warranty,
            customer,
            customerAddress = null,
            equipmentInfoArea = $('#equipmentInfoArea'),
            equipmentDetailList = $('#equipmentDetailList'),
            equipmentDetailHistoryListItem = new EJS({ url: 'templates/equipmentdetailhistorylistitem' }),
            equipmentSelectionListItem = new EJS({ url: 'templates/equipmentdetailequipment' });

        // Check if the equipment is a rental equipment
        if( !_.isNull( currentEquipment.rentalCustomerId )) {
            customer = JSONData.getObjectById( "customers", currentEquipment.rentalCustomerId, null );
        } else {
            customer = JSONData.getObjectById( "customers", currentEquipment.ownerId, null );
        }

        if ( !customer ) {
            JSONData.handleDataMissingError( "customer", currentEquipment.ownerId );
            return;
        }

        // Check if the equipment is a rental equipment
        if( !_.isNull( currentEquipment.rentalAddress )) {
            customerAddress = Util.getObjectFromArray( customer.addresses, 'webId', currentEquipment.rentalAddress );
        } else if ( customer.mainAddressId ) {
            customerAddress = Util.getObjectFromArray( customer.addresses, 'webId', customer.mainAddressId );
        } else {
            customerAddress = customer.addresses[0];
        }

        var manufacturer = _.find( JSONData.getObjectsByDataType("manufacturers"), function( currentMfg ) {
            return currentMfg.internalId == manufacturerInternalId;
        });

        if( !repopulatingList ) {
            var customerEquipmentId = "",
                warrantyDisplay = "";

            if( currentEquipment.customerEquipmentId == "" ) {
                customerEquipmentId = " - ";
            } else {
                customerEquipmentId = currentEquipment.customerEquipmentId;
            }

            if( !warranty ) {
                warrantyDisplay = " - ";
            } else if( warranty.description = "" ){
                warrantyDisplay = " - ";
            } else {
                warrantyDisplay = warranty.description;
            }

            // Add the equipment detail item to the display
            equipmentInfoArea.append( equipmentSelectionListItem.render({
                equipment: currentEquipment,
                customerEquipmentId: customerEquipmentId,
                warrantyDisplay : warrantyDisplay,
                manufacturer: manufacturer,
                warranty: warranty,
                customer: customer,
                address: customerAddress
            }));
        }

        equipmentDetailList.children('li').remove();

        var currentWorkOrder = null,
            workOrderCount = 0,
            plannedMaintenanceCount = 0;

        // If work orders were found, add the list items
         if( workOrders != null ) {
             var segmentIndex = 0,
                  standardJobCode = "";
            for (var i = 0; i < workOrders.length; i++ ) {
                currentWorkOrder = workOrders[i];
                segmentIndex = 0;
                standardJobCode = "";

                // Ensure that this work order does not have multiple segments
                if( currentWorkOrder.workOrderSegments.length != 1 ){
                    // Find the correct work order segment index
                    // TODO TEST THIS
                    for( var x = 0; x < currentWorkOrder.workOrderSegments.length; x++ ) {
                        if( currentWorkOrder.workOrderSegments[x].equipmentId == equipmentId ) {
                            segmentIndex = x;
                        }
                    }
                }

                if( currentWorkOrder.workOrderSegments[segmentIndex].standardJobCodeId != null ) {
                    standardJobCode = JSONData.getObjectFromArrayById( standardJobCodeArray,
                            currentWorkOrder.workOrderSegments[segmentIndex].standardJobCodeId );
                } else {
                    standardJobCode = null;
                }

                equipmentDetailList.append( equipmentDetailHistoryListItem.render({
                    workOrder: currentWorkOrder,
                    segment: currentWorkOrder.workOrderSegments[segmentIndex],
                    standardJobCode: standardJobCode
                }));

                // Determine if this was a WO or PM
                if( currentWorkOrder.documentNumber.substring(0, 2) == "PM" ) {
                    plannedMaintenanceCount ++;
                } else {
                    workOrderCount ++;
                }

            }
        }

        equipmentDetailList.listview('refresh');

        // Display the guided search items
        if( !repopulatingList ) {
            UIFrame.addGuidedSearchDivider(Localization.getText("workHistory"));
            UIFrame.addGuidedSearchItem( Localization.getText("workOrders"), "workOrders", workOrderCount );
            UIFrame.addGuidedSearchItem( Localization.getText("plannedMaintenance"), "plannedMaintenance", plannedMaintenanceCount );

            UIFrame.refreshGuidedSearch();
            UIFrame.bindGuidedSearchClickHandler( guidedSearchClickHandler );

            $('.work-order-history-list-item').click( function() {
                debug && console.log( "EquipmentDetail.WorkHistoryItem: Displaying the work order history review page for work order: " + this.id );
                window.localStorage.setItem( "historyReviewId", this.id );
                UIFrame.navigateToPage( "workorderhistoryreview.html" );
            });
        }

        if ( repopulatingList ) {
            UIFrame.adjustListViewBorders();
        }
    }

    /**
     * Populate the open work list
     */
    function populateOpenWorkListView( ) {
        var pmDueDate;
        debug && console.log( "EquipmentDetail.populateOpenWorkListView: Resetting equipment detail list views" );

        // If this list has been previously compiled, assign the list items and refresh
        if(openWorkList == null) {
            openWorkList = $('#openWorkList');

            var standardJobCode = null,
                openPMListItem = new EJS({ url: 'templates/equipmentdetailopenplannedmaintenance' }),
                openWOListItem = new EJS({ url: 'templates/equipmentdetailopenworkorder' });

            //
            if( plannedMaintenance == null ) {
                plannedMaintenance = JSONData.getFilteredObjectList( "pmSchedule", function( currentPM ) {
                    return currentPM.equipmentId == equipmentId;
                });
            }

            // Add the pms due to the list
            if( plannedMaintenance != null ) {
                var currentPM = null;
                for( var i = 0; i < plannedMaintenance.length; i++ ) {
                    currentPM = plannedMaintenance[i];
                    standardJobCode = JSONData.getObjectFromArrayById( standardJobCodeArray, currentPM.standardJobCodeId );
                    if ( currentPM.dateOverride ) {
                        pmDueDate = new Date( currentPM.dateOverride );
                    } else {
                        pmDueDate = new Date( currentPM.dateSchedule );
                    }
                    openWorkList.append( openPMListItem.render({
                        pmDue: currentPM,
                        pmDueDate: pmDueDate,
                        standardJobCode: standardJobCode,
                        equipment: equipment
                    }));
                }
            }


            // Save an array of work orders relevant to this piece of equipment if workOrders is currently null
            if( workOrders == null ) {
                // Save an array of work orders relevant to this piece of equipment
                workOrders = JSONData.getFilteredObjectList( "workOrders", function( currentWorkOrder ) {
                    return currentWorkOrder.workOrderSegments[0].equipmentId == equipmentId;
                });
            }

            // Add the open work orders to the list
            if( workOrders != null ) {
                var currentWorkOrder = null,
                    standardJobCode = null;
                for( var i = 0; i < workOrders.length; i++ ) {
                    currentWorkOrder = workOrders[i];
                    if( currentWorkOrder.workOrderSegments[0].dateClosed == "" || currentWorkOrder.workOrderSegments[0].dateClosed == null ) {
                        if( currentWorkOrder.workOrderSegments[0].standardJobCodeId != null ) {
                            standardJobCode = JSONData.getObjectFromArrayById( standardJobCodeArray,
                                    currentWorkOrder.workOrderSegments[0].standardJobCodeId );
                        } else {
                            standardJobCode = null;
                        }
                        openWorkList.append( openWOListItem.render({
                            workOrder: currentWorkOrder,
                            standardJobCode: standardJobCode
                        }));
                    }
                }
            }
        }

        // Open planned maintenance item click listener
        $('.open-planned-maintenance').click( function () {
            debug && console.log( "EquipmentDetail.openWorkOrderHandler: Opening pms due list filtered for pm :" + this.id );
            window.localStorage.setItem( "pmIdFilter", this.id );

              UIFrame.navigateToPage( "pmsdue.html" );
        });

        // Open work order item click listener
        $('.open-work-order').click( function() {
            var workOrder = JSONData.getObjectById( "workOrders", this.id);

            debug && console.log( "EquipmentDetail.openWorkOrderHandler: Opening work order list filtered for work order:" + workOrder.documentNumber );
               window.localStorage.setItem( JSONData.LS_INITIAL_WORK_ORDER_LIST_FILTER, workOrder.webId );

            UIFrame.navigateToPage( "workorderlist.html" );
        });

        $('#openWorkList').listview('refresh');
    }

    /**
    * Populate the parts list
    */
    function populatePartsListView( partsList ) {
        debug && console.log( "EquipmentDetail.populatePartsListView: Populating the parts list view" );

        // Retrieve the parts array
        if( partsList && partsList.size() >= 1 ) {
            parts = partsList;
        } else {
            parts = getPartsList();
        }

        debug && console.log( "EquipmentDetail.populatePartsListView: Found " + parts.size() + " parts for the parts list ");

        var daysPast = null,
            dayHrs = 1000 * 60 * 60 * 24,
             today = new Date().getTime(),
            partsList = $('#partsList'),
            partsListItem = new EJS({ url: 'templates/equipmentdetailpart' }),
            days30Count = 0,
            days60Count = 0,
            days90Count = 0,
            days180Count = 0,
            days365Count = 0;

        partsList.children('li').remove();
        if( parts != null && parts.size() != 1) {
            for( var currentPart in parts ) {
                if( parts[currentPart]['id'] != undefined ) {
                    partsList.append( partsListItem.render({
                        description: parts[currentPart]['description'],
                        manufacturer: parts[currentPart]['mfg'],
                        productCode: parts[currentPart]['productCode'],
                        documentNumber: parts[currentPart]['workOrderDocumentNumber'],
                        hourMeter: parts[currentPart]['hourMeter'],
                        dateClosed: parts[currentPart]['dateClosed'],
                        count: parts[currentPart]['count']
                    }));
                }

                daysPast = parseInt( ( today - new Date( parts[currentPart]['dateClosed'] ).setHours(0,0,0,0)) / dayHrs );

                if( daysPast <= 30 ) {
                    days365Count ++;
                    days180Count ++;
                    days90Count ++;
                    days60Count ++;
                    days30Count ++;
                } else if( daysPast <= 60 ) {
                    days365Count ++;
                    days180Count ++;
                    days90Count ++;
                    days60Count ++;
                } else if( daysPast <= 90 ) {
                    days365Count ++;
                    days180Count ++;
                    days90Count ++;
                } else if( daysPast <= 180 ) {
                    days365Count ++;
                    days180Count ++;
                } else if( daysPast <= 365 ) {
                    days365Count ++;
                }
            }
        }

        partsList.listview('refresh');

        if( !partsListInitialized ) {
            addPartsGuidedSearchDivider( Localization.getText( "daysPast" ) );
            addPartsGuidedSearchItem( Localization.getText( "days30" ), "days30", days30Count );
            addPartsGuidedSearchItem( Localization.getText( "days60" ), "days60", days60Count );
            addPartsGuidedSearchItem( Localization.getText( "days90" ), "days90", days90Count );
            addPartsGuidedSearchItem( Localization.getText( "days180" ), "days180", days180Count );
            addPartsGuidedSearchItem( Localization.getText( "days365" ), "days365", days365Count );

            refreshPartsGuidedSearch();

            partsListInitialized = true;
            UIFrame.bindGuidedSearchClickHandler( guidedSearchClickHandler );
        }
    }

    /**
     * Add guided search divider for the parts list. This is a page-specific function
     */
    function addPartsGuidedSearchDivider( dividerValue ) {
        debug && console.log( "EquipmentDetail.addPartsGuidedSearchDivider: Adding " + dividerValue );
        var dividerTemplate = new EJS({url: 'templates/guidedsearchdivider'});
        $('#guidedSearchListParts').append( dividerTemplate.render( { dividerValue : dividerValue } ) );
    }

    /**
     * Add guided search item. This is a page-specific function
     * @param itemText - Used as search item text
     * @param itemId - DOM ID for the item count which allows it to be updated later
     * @param itemCount - Item count value, optional
     */
    function addPartsGuidedSearchItem( itemText, itemId, itemCount ) {
        debug && console.log( "EquipmentDetail.addPartsGuidedSearchItem: Adding guided search item for " + itemText );

        $('#guidedSearchListParts').append( new EJS({url: 'templates/guidedsearchitem'}).render({
            itemText : itemText,
            itemId : itemId,
            itemCount : itemCount
        }));
    }


    /**
     * Guided search click handler for equipment detail resets the list views
     * after filtering the equipment
     * @param event - click event
     */
    function clearGuidedSearch( event ) {
        // These two calls must be the first two lines in all custom clear handlers
        event.preventDefault();
        event.stopPropagation();
        debug && console.log( "EquipmentDetail.clearGuidedSearch: Resetting equipment detail list views" );
        if( detailsContext == "workOrderHistory" ) {
            populateWorkHistoryListView( null, true );
        } else if( detailsContext == "partsHistory" ) {
            populatePartsListView();
        }
        UIFrame.resetGuidedSearch( this );
    }

    /**
     * Clicking on a clear button clears the search filter,
     * changes the item theme back to the default, and hides the clear button
     * @param event - Clear button click event
     */
    function defaultGuidedSearchClearClickHandler( event ) {
        // Prevent this event from propagating
        event.preventDefault();
        event.stopPropagation();
        debug && console.log( "EquipmentDetail.defaultGuidedSearchClearClickHandler: Inside clearButton click handler" );
        resetGuidedSearch( this );
    }

    /**
     * Retrieve a list of relevant parts from the EquipmentWorkOrders
     * @param filter optional variable to filter by the amount of days past
     * @returns part
     */
    function getPartsList( filter ) {
        var parts = {};
        // Ensure that workOrders isn't null
        if( equipmentWorkOrders != null ) {
            var dayHrs = 1000 * 60 * 60 * 24;
            var product = null;
            // Process the work orders
            for( var i = 0; i < equipmentWorkOrders.length; i++ ) {
                // Process the work order segments
                for( var x = 0; x < equipmentWorkOrders[i].workOrderSegments.length; x++ ) {
                    if( equipmentWorkOrders[i].workOrderSegments[x].equipmentId == equipmentId ) {
                        // Process the segment lines
                        for( var y = 0; y < equipmentWorkOrders[i].workOrderSegments[x].workOrderLines.length; y++ ) {
                            var currentWorkOrderLine = equipmentWorkOrders[i].workOrderSegments[x].workOrderLines[y];
                            // Performance improvement: Don't look up each product.  Use
                            // data from workOrderLine instead
                            // If the product is a part
                            if( currentWorkOrderLine.product.manufacturer != WorkOrder.WORK_ORDER_LINE_MFG_LABOR ) {
                                var startDateFilter = 0,
                                    workOrderDateClosed = new Date( equipmentWorkOrders[i].workOrderSegments[x].dateClosed ).setHours(0,0,0,0);

                                // If a filter was defined, determine the corresponding startDateFilter value
                                if( filter != undefined ) {
                                    startDateFilter = new Date().setHours(0,0,0,0) - ( dayHrs * filter) ;
                                }

                                if( parts[product.webId] == undefined && workOrderDateClosed > startDateFilter) {
                                    parts[product.webId] = {};

                                    //alert( parts[product.webId] );

                                    parts[product.webId]['id'] = currentWorkOrderLine.product.webId;
                                    parts[product.webId]['description'] = currentWorkOrderLine.description;
                                    parts[product.webId]['mfg'] = currentWorkOrderLine.product.manufacturer;
                                    parts[product.webId]['productCode'] = currentWorkOrderLine.product.productCode;
                                    parts[product.webId]['workOrderDocumentNumber'] = equipmentWorkOrders[i].documentNumber;
                                    parts[product.webId]['dateClosed'] = equipmentWorkOrders[i].workOrderSegments[x].dateClosed;
                                    parts[product.webId]['hourMeter'] = equipmentWorkOrders[i].workOrderSegments[x].hourMeter;
                                    parts[product.webId]['count'] = 1;
                                } else if( parts[product.webId] != undefined && workOrderDateClosed > startDateFilter ) {
                                    parts[product.webId]['count'] ++;

                                    // Update the date if it is more recent
                                    if( new Date( parts[product.webId]['dateClosed'] ).getTime() <
                                            new Date( equipmentWorkOrders[i].workOrderSegments[x].dateClosed ).getTime()) {
                                        parts[product.webId]['dateClosed'] = equipmentWorkOrders[i].workOrderSegments[x].dateClosed;
                                    }

                                    // Update the hour meter if it is more recent
                                    if( parts[product.webId]['hourMeter'] < equipmentWorkOrders[i].workOrderSegments[x].hourMeter ) {
                                        parts[product.webId]['hourMeter'] = equipmentWorkOrders[i].workOrderSegments[x].hourMeter;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }

        parts.size = function() {
            var size = 0,
                key = null;
            for( key in parts ) {
                if( parts.hasOwnProperty(key)) {
                    size++;
                }
            }
            return size;
        };

        return parts;
    }

    /**
     * Guided search click handler for the equipment detail list page
     * @param event - the click event
     */
    function guidedSearchClickHandler() {
        debug && console.log( "EquipmentDetail.guidedSearchClickHandler" );

        var filter = this.id;
        var filteredDetails = null;

        if( filter == "workOrders" ) {
            filteredDetails = JSONData.getFilteredObjectList( "workOrders", function( currentWorkOrder ) {
                return ( currentWorkOrder.workOrderSegments[0].equipmentId == equipmentId &&
                         currentWorkOrder.workOrderSegments[0].dateClosed != null &&
                         currentWorkOrder.documentNumber.toLowerCase().indexOf("w") != -1 );
            });
        } else if( filter == "plannedMaintenance" ) {
            filteredDetails = JSONData.getFilteredObjectList( "workOrders", function( currentWorkOrder ) {
                return ( currentWorkOrder.workOrderSegments[0].equipmentId == equipmentId &&
                         currentWorkOrder.workOrderSegments[0].dateClosed != "" &&
                         currentWorkOrder.documentNumber.toLowerCase().indexOf("pm") != -1 );
            });
        } else if( filter.indexOf( "days" ) != -1 ) {
            filter = this.id.match( /days(\d+)/ )[1];

            filteredDetails = getPartsList( filter );
        }

        //alert( filteredDetails );

        if( filteredDetails == null ) {
            filteredDetails = [];
        }

        if( detailsContext == "workOrderHistory" ) {
            populateWorkHistoryListView( filteredDetails, true );
        } else if( detailsContext == "partsHistory" ) {
            populatePartsListView( filteredDetails );
        }

        UIFrame.changeListFilter( "" );
        UIFrame.refreshGuidedSearchWithSelectedItem( this, clearGuidedSearch );

        // Adjust the list view borders after the guided search is applied
        UIFrame.adjustListViewBorders();
    }

    /**
     * Refresh the guided search by highlighting the selected item
     * and displaying a clear button on it.  Previously selected item
     * is reset back to the default theme
     * @param selectedItem
     * @param clearButtonClickHandler - Clear button click handler.  If undefined,
     *                                  defaultClearButtonClickHandler is used.
     */
    function refreshPartsGuidedSearchWithSelectedItem( selectedItem, clearButtonClickHandler ) {
        // Hide all of the clear buttons and reset all of the item themes
        $(".guided-search-clear-button").hide();
        $(".guided-search-item").each( function() {
            $(this).removeClass("ui-btn-up-e").addClass("ui-btn-up-c");
        });

        // Then, Show the clear button for the selected item
        var clearButton = $(selectedItem).find("a.guided-search-clear-button");
        clearButton.show();

        // And, change the theme for the selected item
        $(selectedItem).removeClass("ui-btn-up-c").addClass("ui-btn-up-e");

        // Clicking on a clear button clears the filter by executing the specified
        // clear function
        if ( !clearButtonClickHandler ) {
            clearButtonClickHandler = defaultGuidedSearchClearClickHandler;
        }
        clearButton.click( clearButtonClickHandler );
    }

    /**
     * Refresh the guided search list.  This also binds a click handler
     * for guided search items that will highlight user selections and
     * add the X image to a guided search item.
     */
    function refreshPartsGuidedSearch() {
        debug && console.log( "EquipmentDetail.refreshPartsGuidedSearch" );
        $('#guidedSearchListParts').listview( 'refresh' );

        // Adjust the position of the red-x buttons that can appear next to each
        // guided search item
        var guidedSearchClearButtonPos = {
            'right' : '7px',
            'top'   : '45%'
        };
        $(".guided-search-clear-button").find("span[data-theme='r']").each( function() {
            $(this).css( guidedSearchClearButtonPos );
        });

        // Set the theme for the clear button's surrounding anchor to
        // match the theme of a selected guided search item.
        $("a.guided-search-clear-button").removeClass("ui-btn-up-c").addClass("ui-btn-up-e");

        // All clear buttons are initially hidden
        $(".guided-search-clear-button").hide();
    }

    /**
     * Function to swap the navbar layout
     * @param layout identifier of the active navbar button
     */
    function swapLayout( layout ) {
        UIFrame.refreshGuidedSearchWithSelectedItem(null, clearGuidedSearch);

        // Hide all the list areas
        $('#workHistoryListArea').hide();
        $('#openWorkListArea').hide();
        $('#partsListArea').hide();

        // After displaying the correct list area, populate the relevant list view
        if( layout == "workHistoryListArea" ) {
            detailsContext = "workOrderHistory";
            navBarContext = "workHistory";
            $('#equipmentDetailListHeader').show();
            $('#workHistoryListArea').show();
            populateWorkHistoryListView( equipmentWorkOrders, true );
        } else if( layout == "openWorkListArea" ) {
            detailsContext = "openWork";
            navBarContext = "openWork";
            $('#equipmentDetailListHeader').hide();
            $('#openWorkListArea').show();
            populateOpenWorkListView();
        } else if( layout == "partsListArea" ) {
            detailsContext = "partsHistory";
            navBarContext = "parts";
            $('#equipmentDetailListHeader').show();
            $('#partsListArea').show();
            populatePartsListView();
        }

    }

    /**
     * Update a guided search item count. This is a page-specific function
     * @param itemCountId - DOM ID of item to update
     * @param itemCount - New count value
     */
    function updatePartsGuidedSearchItemCount( itemCountId, itemCount ) {
        debug && console.log( "EquipmentDetail.updatePartsGuidedSearchItemCount: Updating " + itemCountId + " to " + itemCount );
        $('#guidedSearchCount' + itemCountId ).text( itemCount );
    }

    /**
     * Function to prompt the user to create a new work order
     */
    function newWorkOrder() {
        var cancelFn = function() {
            debug && console.log( "EquipmentDetail.newWorkOrder.cancelFn: New work order creation canceled" );
            Dialog.closeDialog( false );
            reassignNavBarContext();
        };
        var saveFn = function() {
            debug && console.log( "EquipmentDetail.newWorkOrder.saveFn: Saving new work order" );
            saveNewWorkOrder();
        };
        WorkOrder.displayNewWorkOrderDialog( WorkOrder.NEW_WORK_ORDER_DIALOG_TYPES.EQUIPMENT, saveFn, cancelFn );
    }

    /**
     * After a dialog has been selected and cleared, re-initialize the navbar indication for the current page context.
     */
    function reassignNavBarContext() {
        var btnContext = "#" + navBarContext;
        $( btnContext ).addClass( $.mobile.activeBtnClass );
    }

    /**
     * Create and save a new work order
     */
    function saveNewWorkOrder() {
        var branch = JSONData.getObjectById( "branches", equipment.branchId, null ),
            customer = JSONData.getObjectById( "customers", equipment.ownerId, null ),
            newWorkOrder = WorkOrder.createNewWorkOrder();

        // Check for the rentalCustomerId
        if( !_.isNull( equipment.rentalCustomerId )) {
            newWorkOrder.customerId = equipment.rentalCustomerId;
        } else {
            newWorkOrder.customerId = customer.webId;
        }

        // Check for the rentalAddress
        if( !_.isNull( equipment.rentalAddress )) {
            newWorkOrder.addressId = equipment.rentalAddress;
        } else {
            newWorkOrder.addressId = customer.mainAddressId;
        }

        newWorkOrder.dateOpened  = Util.getISOCurrentTime();
        newWorkOrder.addressId = customer.mainAddressId;
        newWorkOrder.workOrderSegments[0].branchId = branch.webId;
        newWorkOrder.workOrderSegments[0].equipment = equipment;
        newWorkOrder.workOrderSegments[0].equipmentId = equipment.webId;
        newWorkOrder.workOrderSegments[0].hourMeter = equipment.hourMeter;
        newWorkOrder.workOrderSegments[0].odometer = equipment.odometer;
        WorkOrder.populateNewWorkOrderFromDialog( newWorkOrder );

        // Create the work order for JSON storage
        JSONData.saveJSON( "workOrders", newWorkOrder );

        // clear the previous page's guided search status
        window.localStorage.setItem( "guidedSearch", "");
        window.localStorage.setItem( "sortValue",  "");

        window.localStorage.setItem( JSONData.LS_INITIAL_WORK_ORDER_LIST_FILTER, newWorkOrder.webId );

        Dialog.closeDialog( false );
        UIFrame.navigateToPage( "workorderlist.html", false, null );
    }

    /**
     * Function to show the equipment-related alerts
     */
    function showAlerts() {
        debug && console.log( "EquipmentDetail.showAlerts: Showing equipment alerts.");
        // Do nothing for now
    }

    /**
     * Function to show the Crown Catalog
     */
    function showCatalog() {
        debug && console.log( "EquipmentDetail.showCatalog: Invoking the Util.startPSRT for equipment " + equipmentId );
        Util.startPSRT( equipment, psrtModelCrossReference );
    }

    /**
     * Function to show the equipment notes
     */
    function showNotes() {
        debug && console.log( "EquipmentDetail.showNotes: Displaying equipment notes.");
        var title = Localization.getText( "equipmentNotes" );
        if( equipment.notes ) {
            var equipmentNotes = equipment.notes.replace( /&#10;/g, "\n" );
            Dialog.showScrollableDialog( title, equipmentNotes );
        } else {
            Dialog.showAlert( title, Localization.getText( "noEquipmentNotes" ) );
        }
    }

    /**
     * Show the equipment specs (serviceInstructions)
     */
    function showSpecs() {
        debug && console.log( "EquipmentDetail.showSpecs: Displaying equipment specs.");

        // If there are no equipment serviceInstructions
        var title = Localization.getText( "equipmentSpecs" );
        if ( equipment.serviceInstructions ) {
            var equipmentSpecs = equipment.serviceInstructions.replace( /&#10;/g, "\n" );
            Dialog.showScrollableDialog( title, equipmentSpecs );
        } else {
            Dialog.showAlert( title, Localization.getText( "noEquipmentSpecs" ) );
        }
    }

    /**
     * Function to show the warranty information
     */
    function showWarranty() {
        debug && console.log( "EquipmentDetail.showWarranty: Displaying warranty notes.");
        // Do nothing for now
        /*

        if( equipment.warranty == null ) {
            alert( Localization.getText( "noWarranty" ) );
        } else {
            var warranty = equipment.warranty;

            var warrantyPopup = new EJS({url: 'templates/warrantypopup'}).render({
                warranty: warranty
            });

            Dialog.showDialog({
                mode: 'blank',
                width: '400px',
                headerText: Localization.getText('warrantyLabel'),
                blankContent : warrantyPopup
            });
        }*/
    }

    return {
        'init'                          : init,
        'populateWorkHistoryListView'   : populateWorkHistoryListView,
        'reassignNavBarContext'         : reassignNavBarContext,
        'saveNewWorkOrder'              : saveNewWorkOrder,
        'showAlerts'                    : showAlerts,
        'showCatalog'                   : showCatalog,
        'showNotes'                     : showNotes,
        'showSpecs'                     : showSpecs,
        'showWarranty'                  : showWarranty,
        'swapLayout'                    : swapLayout
    };
}();

/**
 * pageinit event handler
 */
$("div:jqmData(role='page')").on( "pageinit", function( event, ui ) {
    // All pages must set pageId to this.id
    var pageId = this.id;
    debug && console.log( "EquipmentDetail.pageinit: Initializing " + pageId );
    // This MUST be called by every page specific pageinit event handler!
    UIFrame.init( pageId, function() {
        debug && console.log( "EquipmentDetail.pageinit: Page specific init goes here" );
        UIFrame.hideElement( "div#equipmentDetailPageContent" );

        // Initialize the list area
        $('#openWorkListArea').hide();
        $('#partsListArea').hide();
        EquipmentDetail.init( pageId );
    });
});
