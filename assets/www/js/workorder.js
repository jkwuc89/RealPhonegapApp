/**
 * workorder.js
 */

"use strict";

/**
 * WorkOrder
 * Encapsulate mobile app's work order functionality
 */
var WorkOrder = function() {
    /**
     * Work order constants
     */
    var CUST_PAY_FOLDER_ID                      = 357;
    var FMPM_FOLDER_ID                          = 377;
    var FW_FOLDER_ID                            = 358;
    var MANAGE_WORK_ORDER_EDIT                  = "EDIT";
    var MANAGE_WORK_ORDER_OPEN                  = "OPEN";
    var MANAGE_WORK_ORDER_OPEN_NOCLOCKING       = "OPEN-NOCLOCKING";
    var MANAGE_WORK_ORDER_VIEW                  = "VIEW";
    var NEW_WORK_ORDER_PM                       = 1;
    var NEW_WORK_ORDER_FMPM                     = 2;
    var NEW_WORK_ORDER_FW                       = 3;
    var NEW_WORK_ORDER_EMPTY                    = 4;
    var NEW_WORK_ORDER_RUNNING                  = 0;
    var NEW_WORK_ORDER_DOWN                     = 1;
    var NEW_WORK_ORDER_DIALOG_TYPES = {
        EQUIPMENT : 1,
        EMPTY : 2
    };
    var OUTSIDE_PART_PURCHASE_MFG               = "N/A";
    var OUTSIDE_PART_PURCHASE_PRODUCE_CODE      = "MISC";
    var OUTSIDE_PART_PURCHASE_WEBID             = 1447361;
    var PLANNED_MAINTENANCE_FOLDER_ID           = 359;
    var SEGMENT_COUNT                           = "segmentCount";
    var VALID_MANAGE_WORK_ORDER_ACTIVITIES      = [
        MANAGE_WORK_ORDER_EDIT,
        MANAGE_WORK_ORDER_OPEN,
        MANAGE_WORK_ORDER_OPEN_NOCLOCKING,
        MANAGE_WORK_ORDER_VIEW
    ];
    var WORK_ORDER_LINE_NOTE_TYPE               = 1;
    var WORK_ORDER_LINE_PART_TYPE               = 0;
    var WORK_ORDER_LINE_LABOR_TYPE              = 8;
    var WORK_ORDER_LINE_MFG_LABOR               = "LABR";
    var WORK_ORDER_LINE_PTR                     = "PTR";
    var WORK_ORDER_LINE_TTR                     = "TTR";
    var WORK_ORDER_SEGMENT_ACTION_CALL_AT_SITE  = "000008";

    /**
     * Local storage flag for verifying the selected billing folder
     */
    var LS_BILLING_FOLDER_VERIFIED = "billingFolderVerified";

    /**
     * Local storage location for the currently open work order ID
     */
    var LS_CURRENT_WORK_ORDER_ID = "currentWorkOrderId";

    /**
     * Local storage location for work order ID being viewed inside
     * the manage work order pages
     */
    var LS_MANAGE_WORK_ORDER_ID = "manageWorkOrderId";

    /**
     * Local storage location for making manage work order writable
     */
    var LS_MANAGE_WORK_ORDER_WRITABLE = "manageWorkOrderWritable";

    /**
     * Local storage location for the manage work order activity
     */
    var LS_MANAGE_WORK_ORDER_ACTIVITY = "manageWorkOrderActivity";

    /**
     * Valid work order statuses
     */
    var WORK_ORDER_STATUS_DISPATCHED        = 0;
    var WORK_ORDER_STATUS_NOT_STARTED       = 100;
    var WORK_ORDER_STATUS_REJECTED          = 200;
    var WORK_ORDER_STATUS_IN_PROGRESS       = 500;
    var WORK_ORDER_STATUS_WAITING_ON_HOLD   = 600;
    var WORK_ORDER_STATUS_COMPLETED         = 700;
    var VALID_WORK_ORDER_STATUSES = [
        {
            id : "dispatchedStatus",
            webStatus : WORK_ORDER_STATUS_DISPATCHED,
            icon : "dispatchedstatusicon.png"
        },
        {
            id : "rejectedStatus",
            webStatus : WORK_ORDER_STATUS_REJECTED,
            icon : "dispatchedstatusicon.png"
        },
        {
            id : "notStartedStatus",
            webStatus : WORK_ORDER_STATUS_NOT_STARTED,
            icon : "notstartedstatusicon.png"
        },
        {
            id : "inProgressStatus",
            webStatus : WORK_ORDER_STATUS_IN_PROGRESS,
            icon : "inprogressstatusicon.png"
        },
        {
            id : "waitingOnHoldStatus",
            webStatus : WORK_ORDER_STATUS_WAITING_ON_HOLD,
            icon : "waitingonholdstatusicon.png"
        },
        {
            id : "completedStatus",
            webStatus : WORK_ORDER_STATUS_COMPLETED,
            icon : "completedstatusicon.png"
        }
    ];

    /**
     * Add changed flag to a work order if the work order was
     * changed during a JSON feed refresh
     * @param workOrder
     */
    function addChangedFlagToWorkOrder( workOrder ) {
        if ( WorkOrder.isWorkOrderChanged( workOrder ) ) {
            // If a periodic JSON feed changed the work order, add a changed flag to the work order
            if ( JSONData.isPeriodicJSONFeedUpdateRunning() ) {
                workOrder.changed = true;
            }
        }
    }

    /**
     * Add a new line to the work order.
     */
    function addLineToWorkOrder( workOrder, workOrderLine ) {
        if ( !workOrder || !_.isObject( workOrder ) ) {
            throw "WorkOrder.addLineToWorkOrder: Required parameter workOrder is undefined or is not an object";
        }
        if ( !workOrderLine || !_.isObject( workOrderLine ) ) {
            throw "WorkOrder.addLineToWorkOrder: Required parameter workOrderLine is undefined or is not an object";
        }
        workOrder.workOrderSegments[0].workOrderLines.push( workOrderLine );
        workOrder.postToMiddleTierRequired = true;
        JSONData.saveJSON( "workOrders", workOrder, true );
    }

    /**
     * Create a new work order line object with all values except webId, dateAdded and dateUpdated
     * initialized to 0/null.
     * @returns Object containing the new work order line
     */
    function createNewWorkOrderLine() {
        var createDate = Util.getISOCurrentTime();
        var workOrderLine = {};
        workOrderLine.webId             = Util.getUniqueId();
        workOrderLine.allocated         = 0;
        workOrderLine.clientReference   = Util.getUniqueId();
        workOrderLine.cost              = 0;
        workOrderLine.dateAdded         = createDate;
        workOrderLine.dateUpdated       = createDate;
        workOrderLine.description       = "";
        workOrderLine.equipmentId       = null;
        workOrderLine.instructions      = null;
        workOrderLine.internalId        = null;
        workOrderLine.inventoryId       = null;
        workOrderLine.lineNumber        = 0;
        workOrderLine.note              = null;
        workOrderLine.qtyBackOrder      = 0;
        workOrderLine.qtyOrdered        = 0;
        workOrderLine.salePriceBranch   = 0;
        workOrderLine.salePriceCustomer = 0;
        workOrderLine.standardJobCodeId = null;
        workOrderLine.status            = 0;
        workOrderLine.userId            = JSONData.getTechnicianUserId();
        workOrderLine.type              = 0;
        workOrderLine.wait              = 0;
        workOrderLine.writable          = true;
        workOrderLine.product = {};
        workOrderLine.product.webId        = 0;
        workOrderLine.product.manufacturer = "";
        workOrderLine.product.productCode  = null;
        return workOrderLine;
    }

    /**
     * Create a new work order segment object with all propertied nulled out except
     * for the webId, dateOpened and dateCreated.
     * @returns Object containing the new work order segment
     */
    function createNewWorkOrderSegment() {
        var createDate = Util.getISOCurrentTime();
        var workOrderSegment = {};
        workOrderSegment.webId               = Util.getUniqueId();
        workOrderSegment.branchId            = null;
        workOrderSegment.chargeCode          = null;
        workOrderSegment.clientReference     = Util.getUniqueId();
        workOrderSegment.currencyCode        = null;
        workOrderSegment.customerSignature   = null;
        workOrderSegment.dateClosed          = null;
        workOrderSegment.dateCompleted       = null;
        workOrderSegment.dateOpened          = createDate;
        workOrderSegment.dateStarted         = null;
        workOrderSegment.dateUpdated         = createDate;
        workOrderSegment.departmentId        = null;
        workOrderSegment.discountCode        = null;
        workOrderSegment.hourMeter           = 0;
        workOrderSegment.equipmentId         = null;
        workOrderSegment.odometer            = 0;
        workOrderSegment.folderId            = 0;
        workOrderSegment.internalId          = null;
        workOrderSegment.notesBottom         = "";
        workOrderSegment.noteInstructions    = null;
        workOrderSegment.notesTop            = "";
        workOrderSegment.partsOnly           = false;
        workOrderSegment.pmScheduleId        = null;
        workOrderSegment.priceCode           = null;
        workOrderSegment.segmentAction       = WORK_ORDER_SEGMENT_ACTION_CALL_AT_SITE;
        workOrderSegment.segmentName         = "";
        workOrderSegment.segmentType         = 0;
        workOrderSegment.serviceTruckId      = null;
        workOrderSegment.shipToAddressId     = null;
        workOrderSegment.shipToCustomerId    = null;
        workOrderSegment.standardJobCodeId   = null;
        workOrderSegment.status              = null;
        workOrderSegment.taxCodeId           = null;
        workOrderSegment.technicianSignature = null;
        workOrderSegment.webStatus           = WORK_ORDER_STATUS_DISPATCHED;
        workOrderSegment.workOrderLines      = [];
        return workOrderSegment;
    }

    /**
     * Create a new work order with all values nulled out except for the webId.
     * @returns Object containing the new work order
     */
    function createNewWorkOrder() {
        var newWorkOrder = {};
        newWorkOrder.webId             = Util.getUniqueId();
        // clientReference is used by middle tier to prevent duplicate work orders
        // from being created.
        newWorkOrder.clientReference   = Util.getUniqueId();
        newWorkOrder.addressId         = null;
        newWorkOrder.companyId         = null;
        newWorkOrder.contactName       = null;
        newWorkOrder.contactNumber     = null;
        newWorkOrder.customerId        = null;
        newWorkOrder.dateOpened        = null;
        newWorkOrder.documentNumber    = null;
        newWorkOrder.internalId        = null;
        // This marks the new work order as newly created by the mobile app
        newWorkOrder.newWorkOrder      = true;
        newWorkOrder.note              = null;
        newWorkOrder.postToMiddleTierRequired = true;
        newWorkOrder.workOrderSegments = [];
        newWorkOrder.workOrderSegments.push( createNewWorkOrderSegment() );
        return newWorkOrder;
    }

    /**
     * Display the work order changed alert.  After the alert is displayed, the
     * changed property is removed from the work order.
     * @param workOrder - Work order to check for a change
     * @param callbackFn - Function called when this method completes the check
     */
    function displayWorkOrderChangedAlert( workOrder, callbackFn ) {
        if ( workOrder && _.isObject( workOrder ) && !_.isUndefined( workOrder.changed ) && workOrder.changed ) {
            Dialog.showAlert( Localization.getText( "currentWorkOrderChangedTitle" ),
                              Localization.getText( "currentWorkOrderChangedPrompt" ),
                function() {
                    Dialog.closeDialog( false );
                    delete workOrder.changed;
                    // We purposefully bypass saveJSON to remove the changed property from the work order because
                    // saveJSON can reintroduce the changed property
                    window.localStorage.setItem( "workOrders." + workOrder.webId, JSON.stringify( workOrder ) );
                    if ( _.isFunction( callbackFn ) ) {
                        callbackFn();
                    }
                }, '400px'
            );
            Dialog.setDialogTopAndScrollIntoView();
        } else {
            debug && console.log( "WorkOrder.displayWorkOrderChangedAlert: Nothing to check" );
            if ( _.isFunction( callbackFn ) ) {
                callbackFn();
            }
        }
    }

    /**
     * Get the current work order ID
     * @returns String containing current work order ID from local storage or null if it does not exist
     */
    function getCurrentWorkOrderId() {
        debug && console.log( "WorkOrder.getCurrentWorkOrderId: Getting current work order ID" );
        return window.localStorage.getItem( LS_CURRENT_WORK_ORDER_ID );
    }

    /**
     * Get the work order ID from local storage that will be viewable inside
     * the manage work order pages.
     * @returns String containing work order ID from local storage or null if it does not exist
     */
    function getManageWorkOrderId() {
        debug && console.log( "WorkOrder.getManageWorkOrderId: Getting manage work order ID" );
        return window.localStorage.getItem( LS_MANAGE_WORK_ORDER_ID );
    }

    /**
     * Get the current work order
     * @returns Object for the current work order or null if a current work order is not set
     */
    function getCurrentWorkOrder() {
        debug && console.log( "WorkOrder.getCurrentWorkOrder: Getting the current work order" );
        var currentWorkOrderId = WorkOrder.getCurrentWorkOrderId();
        return ( currentWorkOrderId ? JSONData.getObjectById( "workOrders", currentWorkOrderId, null ) : null );
    }

    /**
     * Get the work order being managed by the manage work order pages
     * @returns Object for the manage work order or null if a manage work order is not set
     */
    function getManageWorkOrder() {
        debug && console.log( "WorkOrder.getManageWorkOrder: Getting the manage work order" );
        var manageWorkOrderId = WorkOrder.getManageWorkOrderId();
        return ( manageWorkOrderId ? JSONData.getObjectById( "workOrders", manageWorkOrderId, null ) : null );
    }

    /**
     * Get a new local work order document number.
     * @returns String containing new local work order number
     */
    function getNewLocalWorkOrderNumber() {
        var date = new Date();
        var configuration = Config.getConfig();
        var newWorkOrderIndex = configuration.localWorkOrderIndex;
        var tempWorkOrderNumber = "";
        var validWorkOrderNumber = false;
        var pmWorkOrders = _.sortBy( _.filter( JSONData.getObjectsByDataType( "workOrders" ), function( wo ) {
            return wo.workOrderSegments[0].folderId == PLANNED_MAINTENANCE_FOLDER_ID;
        }), function( wo ) {
            return wo.documentNumber;
        });

        newWorkOrderIndex++;
        newWorkOrderIndex = ( newWorkOrderIndex < 10 ) ? "00" + newWorkOrderIndex :
            ( newWorkOrderIndex < 100 ) ? "0" + newWorkOrderIndex: newWorkOrderIndex;

        tempWorkOrderNumber = date.getYear() - 100;
        tempWorkOrderNumber += ( date.getMonth() < 9 ) ? "0" + parseInt( date.getMonth() + 1 ).toString() : parseInt( date.getMonth() + 1 ).toString() ;
        tempWorkOrderNumber += ( date.getDate() < 10 ) ? "0" + parseInt( date.getDate()).toString() : parseInt( date.getDate()).toString() ;

        // Loop through the local work order document numbers to ensure that the localWorkOrderIndex is accurate
        if ( pmWorkOrders.length > 0 ) {
            while( !validWorkOrderNumber ) {
                debug && console.log( "WorkOrder.getNewValidWorkOrderNumber: Attempting new workOrderindex " + newWorkOrderIndex );
                if ( _.filter( pmWorkOrders, function( wo ) {
                    //noinspection JSReferencingMutableVariableFromClosure
                    return wo.documentNumber.substring( 0, 11 ) == "PM" + tempWorkOrderNumber + newWorkOrderIndex;
                }).length == 0 ) {
                    debug && console.log( "WorkOrder.getNewValidWorkOrderNumber: workOrderindex " + newWorkOrderIndex + " is valid" );
                    validWorkOrderNumber = true;
                } else {
                    debug && console.log( "WorkOrder.getNewValidWorkOrderNumber: workOrderindex " + newWorkOrderIndex +
                                          " is invalid, incremening configuration.newWorkOrderIndex" );
                    newWorkOrderIndex++;
                    newWorkOrderIndex = ( newWorkOrderIndex < 10 ) ? "00" + newWorkOrderIndex :
                        ( newWorkOrderIndex < 100 ) ? "0" + newWorkOrderIndex: newWorkOrderIndex;
                }
            }
        }

        var newDocumentNumber = tempWorkOrderNumber + newWorkOrderIndex;

        // Increment the localWorkOrderIndex
        configuration.localWorkOrderIndex = parseInt( newWorkOrderIndex, 10 );
        Config.saveConfiguration( configuration );

        debug && console.log( "WorkOrder.getNewValidWorkOrderNumber: New local work order number = " + newDocumentNumber );
        return newDocumentNumber;
    }

    /**
     * Return the number of new work orders
     * @param workOrderArray - Array of work order objects
     *                         If null or undefined, getObjectsByDataType is used
     */
    function getNewWorkOrderCount( workOrderArray ) {
        debug && console.log( "WorkOrder.getNewWorkOrderCount: Getting new work order count" );

        if ( !workOrderArray ) {
            workOrderArray = JSONData.getObjectsByDataType( "workOrders" );
        }
        var newWorkOrders = _.filter( workOrderArray, function( currentWorkOrder ) {
            return isNewWorkOrder( currentWorkOrder );
        });
        return ( newWorkOrders ? newWorkOrders.length : 0 );
    }

    /**
     * Get all of the split work orders for a multi-segment work order
     * @param workOrder Any work order that makes up part of a multi-segment work order
     * @return Array containing all of the split work orders
     */
    function getSplitWorkOrders( workOrder ) {
        // Get all of the split work orders whose web ID matches the work order passed in
        var webIdWithoutSuffix = Util.removeSuffixFromId( workOrder.webId );
        var splitWorkOrders = _.filter( JSONData.getObjectsByDataType( "workOrders" ), function( workOrderInList ) {
            //noinspection JSUnresolvedFunction
            return ( ( _.isString( workOrderInList.webId ) &&
                workOrderInList.webId.indexOf( webIdWithoutSuffix ) === 0 ) &&
                workOrderInList.webId.indexOf( "-" ) > 0 );
        });
        if ( splitWorkOrders.length > 1 ) {
            splitWorkOrders = _.sortBy( splitWorkOrders, function( workOrderInList ) {
                return workOrderInList.webId;
            });
        }
        return splitWorkOrders;
    }

    /**
     * Get the number of work orders for the specified customer ID
     * @param workOrderArray - Array of work orders, if null or undefined, getObjectsByDataTYpe is used to get work orders
     * @param customerId
     * @returns Number of work orders for the customer
     */
    function getWorkOrderCountForCustomer( workOrderArray, customerId ) {
        if ( !workOrderArray || workOrderArray.length === 0 ) {
            workOrderArray = JSONData.getObjectsByDataType( "workOrders" );
        }
        if ( _.isNull( customerId ) || _.isUndefined( customerId ) ) {
            throw "WorkOrder.getWorkOrderCountForCustomer: Required parameter customerId is null or undefined";
        }

        var workOrderCount = _.filter( workOrderArray, function( workOrderFromList ) {
            return workOrderFromList.customerId == customerId &&
                workOrderFromList.workOrderSegments[0].webStatus != WorkOrder.WORK_ORDER_STATUS_REJECTED &&
                workOrderFromList.workOrderSegments[0].webStatus != WorkOrder.WORK_ORDER_STATUS_COMPLETED;
        }).length;
        debug && console.log( "WorkOrder.getWorkOrderCountForCustomer: Work order count for customer ID " + customerId + " = " + workOrderCount );
        return workOrderCount;
    }

    /**
     * Get the number of work orders for the specified equipment ID
     * @param workOrderArray - Array of work orders, if null or undefined, getObjectsByDataTYpe is used to get work orders
     * @param equipmentId
     * @returns Number of work orders for the equipment
     */
    function getWorkOrderCountForEquipment( workOrderArray, equipmentId ) {
        if ( !workOrderArray || workOrderArray.length === 0 ) {
            workOrderArray = JSONData.getObjectsByDataType( "workOrders" );
        }
        if ( _.isNull( equipmentId ) || _.isUndefined( equipmentId ) ) {
            throw "WorkOrder.getWorkOrderCountForEquipment: Required parameter equipmentId is null or undefined";
        }
        var workOrderCount = _.filter( workOrderArray, function( workOrderFromList ) {
            return workOrderFromList.workOrderSegments[0].equipmentId == equipmentId &&
                workOrderFromList.workOrderSegments[0].webStatus != WorkOrder.WORK_ORDER_STATUS_REJECTED &&
                workOrderFromList.workOrderSegments[0].webStatus != WorkOrder.WORK_ORDER_STATUS_COMPLETED;
        }).length;
        debug && console.log( "WorkOrder.getWorkOrderCountForEquipment: Work order count for equipment ID " + equipmentId + " = " + workOrderCount );
        return workOrderCount;
    }

    /**
     * Get the number of segments in the specified work order
     * @param workOrder
     */
    function getWorkOrderSegmentCount( workOrder ) {
        var segmentCount = 1;
        if ( SEGMENT_COUNT in workOrder ) {
            segmentCount = workOrder[SEGMENT_COUNT];
        }
        debug && console.log( "WorkOrder.getWorkOrderSegmentCount: Work order " + workOrder.documentNumber +
                              " has " + segmentCount + " segments" );
        return segmentCount;
    }

    /**
     * Get the list of locally saved work orders that require a post to the middle tier
     * @returns Array of work orders that need to be posted to the middle tier
     */
    function getWorkOrdersRequiringPostToMiddleTier() {
        var workOrders = _.filter( JSONData.getObjectsByDataType( "workOrders" ), function( workOrderInList ) {
            return workOrderInList.postToMiddleTierRequired;
        });
        if ( workOrders && workOrders.length > 0 ) {
            workOrders = _.sortBy( workOrders, function( workOrderInList ) {
                return workOrderInList.documentNumber;
            });
        }
        debug && console.log( "WorkOrder.getWorkOrdersRequiringPostToMiddleTier: " + workOrders.length +
                              " work orders need to be posted to the middle tier" );
        return workOrders;
    }

    /**
     * Get the work order status
     */
    function getWorkOrderStatus( workOrder ) {
        return workOrder.workOrderSegments[0].webStatus;
    }

    /**
     * Get the status icon for the work order
     * @param workOrder
     */
    function getWorkOrderStatusIcon( workOrder ) {
        var workOrderStatusObj = getWorkOrderStatusObject( workOrder );
        debug && console.log( "WorkOrder.getWorkOrderStatusIcon: Work order status icon = " + workOrderStatusObj.icon );
        return UIFrame.getImagePath() + workOrderStatusObj.icon;
    }

    /**
     * Get the work order status object for the specified work order.
     * This object contains
     */
    function getWorkOrderStatusObject( workOrder ) {
        if ( !workOrder ) {
            throw "WorkOrder.getWorkOrderStatusObject: Required parameter workOrder is undefined";
        }
        var workOrderStatus = WorkOrder.getWorkOrderStatus( workOrder );
        var workOrderStatusObj = _.find( WorkOrder.VALID_WORK_ORDER_STATUSES, function( currentWorkOrderStatus ) {
            return currentWorkOrderStatus.webStatus == workOrderStatus;
        });
        if ( !workOrderStatusObj ) {
            throw "WorkOrder.getWorkOrderStatusObject: Work order webStatus value " + workOrderStatus + " is invalid";
        }
        return workOrderStatusObj;
    }

    /**
     * Get the status text for the work order
     * @param workOrder
     */
    function getWorkOrderStatusText( workOrder ) {
        var workOrderStatusObj = getWorkOrderStatusObject( workOrder );
        var statusText = Localization.getText( workOrderStatusObj.id );
        debug && console.log( "WorkOrder.getWorkOrderStatusText: Work order status text = " + statusText );
        return statusText;
    }

    /**
     * Is manage work order writable?
     * @returns Boolean indicating if manage work order is writable
     */
    function isManageWorkOrderWritable() {
        var writable = ( window.localStorage.getItem( LS_MANAGE_WORK_ORDER_WRITABLE ) == "true" );
        debug && console.log( "WorkOrder.isManageWorkOrderWritable: " + writable );
        return writable;
    }

    /**
     * Is the specified work order new?
     * @param workOrder - Work order to check
     */
    function isNewWorkOrder( workOrder ) {
        return WorkOrder.getWorkOrderStatus( workOrder ) == WorkOrder.WORK_ORDER_STATUS_DISPATCHED;
    }

    /**
     * Are parts on order for the specified work order?
     * @param workOrder
     */
    function isPartOnOrder( workOrder ) {
        if ( !workOrder ) {
            throw "WorkOrder.isPartOnOrder: Required parameter workOrder is undefined";
        }
        var linesWithOrderedParts = _.filter( workOrder.workOrderSegments[0].workOrderLines, function( currentLine ) {
            return currentLine.qtyBackOrder > 0;
        });
        var partsOnOrder = linesWithOrderedParts.length > 0;
        if ( partsOnOrder ) {
            debug && console.log( "WorkOrder.isPartOnOrder: Work order ID " + workOrder.webId + " has parts on order" );
        } else {
            debug && console.log( "WorkOrder.isPartOnOrder: Work order ID " + workOrder.webId + " has no parts on order" );
        }
        return partsOnOrder;
    }

    /**
     * Is the work order a PM work order?
     * @param workOrder - Work order to check
     */
    function isPMWorkOrder( workOrder ) {
        //noinspection JSUnresolvedVariable
        return ( ( workOrder.workOrderSegments[0].standardJobCode &&
                   workOrder.workOrderSegments[0].standardJobCode.standardJobCodeManufacturerId === 1 ) ||
                 workOrder.workOrderSegments[0].folderId === WorkOrder.FMPM_FOLDER_ID ||
                 workOrder.workOrderSegments[0].folderId === WorkOrder.PLANNED_MAINTENANCE_FOLDER_ID ||
                 workOrder.documentNumber.indexOf( "PM" ) == 0 );
    }

    /**
     * Compare the specified work order with the locally stored work order.
     * If any of the properties in the work order that are editable by the mobile app are changed
     * in the specified work order, return true.  Otherwise, return false.
     * @param updatedWorkOrder
     * @returns Boolean
     */
    function isWorkOrderChanged( updatedWorkOrder ) {
        var changed = false;
        var changedProperty;
        var currentProp;
        var lineIndex;
        var propIndex;
        var localWorkOrder;
        var localPartLines;
        var updatedPartLines;
        var headerPropertiesToCheck = [
            // SFAM-189 - Do not check header properties
//            "contactName",
//            "contactNumber",
//            "documentReference"
        ];
        var segmentPropertiesToCheck = [
            // SFAM-189 - Do not check segment properties
//            "notesTop",
//            "notesBottom",
//            "folderId",
//            "webStatus",
//            "equipmentId",
//            "standardJobCodeId",
//            "hourMeter",
//            "technicianSignature",
//            "customerSignature"
        ];
        var linePropertiesToCheck = [
            "qtyOrdered",
            "inventoryId",
            "userId"
        ];
        if ( _.isUndefined( updatedWorkOrder ) || _.isNull( updatedWorkOrder ) || !_.isObject( updatedWorkOrder ) ) {
            throw "WorkOrder.isWorkOrderChanged: Required parameter workOrder is missing or invalid";
        }
        // Use the clientReference to find the locally stored work order that corresponds to the updated work order
        localWorkOrder = JSONData.getObjectById( "workOrders", updatedWorkOrder.clientReference, "clientReference" );
        if ( !localWorkOrder ) {
            debug && console.log( "WorkOrder.isWorkOrderChanged: Locally stored work order with clientReference " +
                                  updatedWorkOrder.clientReference + " does not exist" );
            // If the clientReference did not find the locally stored work order, try using the webId
            localWorkOrder = JSONData.getObjectById( "workOrders", updatedWorkOrder.webId, null );
            if ( !localWorkOrder ) {
                debug && console.log( "WorkOrder.isWorkOrderChanged: Locally stored work order with webId " +
                                          updatedWorkOrder.webId + " does not exist" );
            }
        }
        if ( localWorkOrder ) {
            // Compare the header properties
            for ( propIndex = 0; propIndex < headerPropertiesToCheck.length && !changed; propIndex++ ) {
                currentProp = headerPropertiesToCheck[propIndex];
                changed = ( localWorkOrder[currentProp] != updatedWorkOrder[currentProp] );
                if ( changed ) {
                    changedProperty = "Header " + currentProp +
                                      ": Old value = '" + localWorkOrder[currentProp] + "'" +
                                      " New value = '" + updatedWorkOrder[currentProp] + "'";
                }
            }
            // Compare the segment properties
            if ( !changed ) {
                for ( propIndex = 0; propIndex < segmentPropertiesToCheck.length && !changed; propIndex++ ) {
                    currentProp = segmentPropertiesToCheck[propIndex];
                    changed = ( localWorkOrder.workOrderSegments[0][currentProp] !=
                                updatedWorkOrder.workOrderSegments[0][currentProp] );
                    if ( changed ) {
                        changedProperty = "Segment " + currentProp +
                                          ": Old value = '" + localWorkOrder.workOrderSegments[0][currentProp] + "'" +
                                          " New value = '" + updatedWorkOrder.workOrderSegments[0][currentProp] + "'";
                    }
                }
            }
            // Compare the work order part lines
            if ( !changed ) {
                localPartLines = _.filter( localWorkOrder.workOrderSegments[0].workOrderLines, function( lineInList ) {
                    return ( lineInList.type == WORK_ORDER_LINE_PART_TYPE &&
                             ( _.isUndefined( lineInList.deleted ) || !lineInList.deleted ) );
                });
                if ( localPartLines ) {
                    localPartLines = _.sortBy( localPartLines, function( lineInList ) {
                        return ( lineInList.product.productCode + lineInList.inventoryId + lineInList.webId );
                    });
                } else {
                    localPartLines = [];
                }
                updatedPartLines = _.filter( updatedWorkOrder.workOrderSegments[0].workOrderLines, function( lineInList ) {
                    return ( lineInList.type == WORK_ORDER_LINE_PART_TYPE &&
                             ( _.isUndefined( lineInList.deleted ) || !lineInList.deleted ) );
                });
                if ( updatedPartLines ) {
                    updatedPartLines = _.sortBy( updatedPartLines, function( lineInList ) {
                        return ( lineInList.product.productCode + lineInList.inventoryId + lineInList.webId );
                    });
                } else {
                    updatedPartLines = [];
                }
                if ( localPartLines.length === updatedPartLines.length ) {
                    for ( lineIndex = 0; lineIndex < localPartLines.length && !changed; lineIndex++ ) {
                        if ( localPartLines[lineIndex].product.productCode == updatedPartLines[lineIndex].product.productCode ) {
                            for ( propIndex = 0; propIndex < linePropertiesToCheck.length && !changed; propIndex++ ) {
                                currentProp = linePropertiesToCheck[propIndex];
                                changed = ( localPartLines[lineIndex][currentProp] != updatedPartLines[lineIndex][currentProp] );
                                if ( changed ) {
                                    changedProperty = "Part " + localPartLines[lineIndex].product.productCode + " " + currentProp +
                                                      ": Old value = '" + localPartLines[lineIndex][currentProp] + "'" +
                                                      " New value = '" + updatedPartLines[lineIndex][currentProp]+ "'";
                                }
                            }
                        } else {
                            changed = true;
                            changedProperty = "Local part " + localPartLines[lineIndex].product.productCode +
                                              " does not match updated part " +
                                              updatedPartLines[lineIndex].product.productCode;
                        }
                    }
                } else {
                    changed = true;
                    changedProperty = "Part line count" +
                                      ": Old value = " + localPartLines.length +
                                      " New value = " + updatedPartLines.length;
                }
            }
        }
        if ( changed ) {
            debug && console.log( "WorkOrder.isWorkOrderChanged: Updated work order " + updatedWorkOrder.webId +
                                  " will change the locally stored work order property: " + changedProperty );
        } else {
            debug && console.log( "WorkOrder.isWorkOrderChanged: Updated work order " + updatedWorkOrder.webId +
                                  " will not change the locally stored work order" );
        }
        return changed;
    }

    /**
     * Is the specified work order a parts only work order?
     * @param workOrder
     * @return {boolean}
     */
    function isPartsOnlyWorkOrder( workOrder ) {
        var partsOnly = false;
        if ( workOrder && workOrder.workOrderSegments[0] ) {
            partsOnly = ( workOrder.workOrderSegments[0].partsOnly ||
                          workOrder.workOrderSegments[0].notesTop == Localization.getText( "partsOnlyWorkOrder" ) );
        }
        debug && console.log( "WorkOrder.isPartsOnlyWorkOrder: Work order is parts only: " + partsOnly );
        return partsOnly;
    }

    /**
     * Is the specified work order signed by the customer?
     * @param workOrder
     * @return Boolean - true if work order is signed by the customer, false otherwise
     */
    function isWorkOrderSignedByCustomer( workOrder ) {
        var signed = false;
        if ( workOrder ) {
            signed = ( workOrder.workOrderSegments[0].customerSignature &&
                       _.isObject( workOrder.workOrderSegments[0].customerSignature ) );
        }
        return signed;
    }

    /**
     * Is the specified work order signed by the technician?
     * @param workOrder
     * @return Boolean - true if work order is signed by the technician, false otherwise
     */
    function isWorkOrderSignedByTechnician( workOrder ) {
        var signed = false;
        if ( workOrder ) {
            signed = ( workOrder.workOrderSegments[0].technicianSignature &&
                       _.isObject( workOrder.workOrderSegments[0].technicianSignature ) );
        }
        return signed;
    }

    /**
     * Merge split work orders, each containing one work order segment, into
     * a single work order suitable for posting to the middle tier
     * @param workOrder
     * @returns Object containing merged work order
     */
    function mergeSplitWorkOrders( workOrder ) {
        var mergedWorkOrder = null;
        debug && console.log( "WorkOrder.mergeSplitWorkOrders: Merging split work orders for each segment into one work order" );

        // Get all of the split work orders whose web ID matches the work order passed in
        var splitWorkOrders = getSplitWorkOrders( workOrder );

        // Create the header for the merged work order, stripping off the segment suffix
        mergedWorkOrder = Util.clone( workOrder );
        mergedWorkOrder.webId = Util.removeSuffixFromId( mergedWorkOrder.webId );
        mergedWorkOrder.documentNumber = Util.removeSuffixFromId( mergedWorkOrder.documentNumber );
        delete mergedWorkOrder.workOrderSegments;

        // Put all of the segments into the merged work order
        mergedWorkOrder.workOrderSegments = [];
        _.each( splitWorkOrders, function( workOrderInList ) {
            mergedWorkOrder.workOrderSegments.push( workOrderInList.workOrderSegments[0] );
        });

        return mergedWorkOrder;
    }

    /**
     * Remove the current work order ID from local storage
     */
    function removeCurrentWorkOrderId() {
        debug && console.log( "WorkOrder.removeCurrentWorkOrderId: Removing the current work order ID" );
        window.localStorage.removeItem( LS_CURRENT_WORK_ORDER_ID );
    }

    /**
     * Remove the current work order ID from local storage
     */
    function removeManageWorkOrderId() {
        debug && console.log( "WorkOrder.removeManageWorkOrderId: Removing the manage work order ID" );
        window.localStorage.removeItem( LS_MANAGE_WORK_ORDER_ID );
    }

    /**
     * Reset the index used to create local work order numbers
     */
    function resetLocalWorkOrderNumberIndex() {
        var configuration = Config.getConfig();
        configuration.localWorkOrderIndex = 0;
        Config.saveConfiguration( configuration );
    }

    /**
     * Post a work order to the middle tier
     * @param workOrder - Work order to post to the middle tier
     * @param displayProgressDialog - Display the progress dialog while posting the work order
     * @param reloadPageAfterPost - Reload the current page after a successful post
     * @param successCallback - This is called when the post is successful.
     *                          The updated work order from the middle tier is passed
     *                          as the only parameter to this callback.
     * @param errorCallback - This is called when the post fails
     */
    function postWorkOrder( workOrder, displayProgressDialog, reloadPageAfterPost, successCallback, errorCallback ) {
        if ( !workOrder ) {
            throw "WorkOrder.postWorkOrder: Required parameter workOrder is undefined or null";
        }
        // Must be online to post a work order
        if ( Util.isOnline( false ) ) {

            // Pull together the work order data and the clocking data
            var workOrderAndClockingData = {};

            // Get the technician clocking's associated with the work order
            workOrderAndClockingData.technicianClocking = [];
            var technicianClockings = _.filter( JSONData.getObjectsByDataType( "technicianClocking" ), function( clockingInList ) {
                return ( ( ( clockingInList.workOrderHeaderId == workOrder.webId &&
                             clockingInList.workOrderSegmentId == workOrder.workOrderSegments[0].webId ) ||
                           ( clockingInList.workOrderSegmentClientReference &&
                             clockingInList.workOrderSegmentClientReference == workOrder.workOrderSegments[0].clientReference ) ) &&
                         !_.isNull( clockingInList.timeEnd ) &&
                         clockingInList.postToMiddleTierRequired
                       );
            });
            if ( technicianClockings.length > 0 ) {
                // Clone the technician clockings for the work order so that we can null out their webIds.
                _.each( technicianClockings, function( clockingInList ) {
                    workOrderAndClockingData.technicianClocking.push( Util.clone( clockingInList ) );
                });
                _.each( workOrderAndClockingData.technicianClocking, function( clockingInList ) {
                    clockingInList.webId = null;
                });
            }

            // Posting the current work order or the work order displayed in a manage
            // work order page requires additional updates when the post is complete
            var postedWorkOrderId = workOrder.webId;
            var postingManageWorkOrder =  ( WorkOrder.getManageWorkOrderId() == workOrder.webId );
            var postingCurrentWorkOrder = ( WorkOrder.getCurrentWorkOrderId() == workOrder.webId );
            debug && console.log( "WorkOrder.postWorkOrder: Posting manage work order: " + postingManageWorkOrder +
                                  " Posting current work order: " + postingCurrentWorkOrder );

            // Clone the work order being posted before making any changes to it.
            // This allows us to resave the original work order if a failure occurs
            workOrderAndClockingData.workOrder = Util.clone( workOrder );

            // Blank out the webId if this is a new work order and remove the property
            // marking it as new
            var postingNewWorkOrder = false;
            if ( workOrder.newWorkOrder ) {
                postingNewWorkOrder = true;
                workOrderAndClockingData.workOrder.webId = null;
            }

            var workOrderData = JSON.stringify( workOrderAndClockingData );
            debug && console.log( "WorkOrder.postWorkOrder: JSON data: " + workOrderData );

            // Display please wait while the post takes place
            if ( displayProgressDialog ) {
                var pleaseWaitText = Localization.getText( "postingWorkOrderText" ).replace( "workOrder", workOrder.documentNumber );
                Dialog.showPleaseWait( Localization.getText( "postingWorkOrderTitle" ), pleaseWaitText, "400px" );
            }

            //noinspection JSUnresolvedVariable
            debug && console.log( "WorkOrder.postWorkOrder: App is online. Post of work order " +
                                  workOrder.documentNumber + " to middle tier will be attempted. Post attempt will timeout in " +
                                  Config.getConfig().workOrderUpdateTimeout + " seconds." );

            // Set up the error call back used internally by this method. It will
            // call errorCallback if it's defined
            var internalErrorCallbackFn = function( errorCode ) {
                JSONData.handleClockingPostError( technicianClockings, errorCode );
                if ( displayProgressDialog ) {
                    Dialog.closeDialog( false );
                }
                // Add post required flag onto the work order
                debug && console.log( "WorkOrder.postWorkOrder.internalErrorCallbackFn: Post failed. Setting postToMiddleTierRequired on work order " +
                                      workOrder.documentNumber );
                workOrder.postToMiddleTierRequired = true;
                JSONData.saveJSON( "workOrders", workOrder, true );

                // Call the error callback if its defined
                if ( errorCallback && _.isFunction( errorCallback ) ) {
                    errorCallback();
                }
            };

            // Save the merged equipment and standardJobCode before posting so
            // that they can be quickly restored after a successful post
            var mergedEquipment = workOrder.workOrderSegments[0].equipment;
            var mergedStandardJobCode = workOrder.workOrderSegments[0].standardJobCode;

            // Save properties currently not supported by the middle tier so
            // that they can be restored after a post
            // FIXME: Remove dateTimeETA when middle tier supports it
            var dateTimeETA = null;
            if ( workOrder.workOrderSegments[0].dateTimeETA ) {
                dateTimeETA = workOrder.workOrderSegments[0].dateTimeETA;
            }

            //noinspection JSUnresolvedVariable
            JSONData.postDataToMiddleTier( Config.getConfig().workOrderUpdateUrl, workOrderData,
                                           Config.getConfig().workOrderUpdateTimeout,
                // Success callback
                function( updatedWorkOrder ) {
                    // If we posted a new work order but the webId comes back as null, the post did not work
                    if ( postingNewWorkOrder && _.isNull( updatedWorkOrder.workOrder.webId ) ) {
                        // Mark work order as still being new
                        workOrder.newWorkOrder = true;
                        console.error( "WorkOrder.postWorkOrder: Updated work order " + updatedWorkOrder.documentNumber +
                                       " has a null webId" );
                        internalErrorCallbackFn();
                        return;
                    }

                    // Get the customer object for the updated work order because some of the updates
                    // below require customer information
                    var customerForUpdatedWorkOrder = JSONData.getObjectById( "customers", updatedWorkOrder.workOrder.customerId, null );
                    if ( !customerForUpdatedWorkOrder ) {
                        console.error( "WorkOrder.postWorkOrder: Customer ID " + updatedWorkOrder.workOrder.customerId +
                                       " for updated work order " + updatedWorkOrder.documentNumber + " is missing." );
                        internalErrorCallbackFn();
                        return;
                    }

                    // Save updated work order and call the specified success callback if available.
                    debug && console.log( "WorkOrder.postWorkOrder: Post of work order " +
                                          updatedWorkOrder.workOrder.documentNumber + " successful. Returned JSON data: " +
                                          JSON.stringify( updatedWorkOrder ) );
                    if ( updatedWorkOrder.workOrder.postToMiddleTierRequired ) {
                        delete updatedWorkOrder.workOrder.postToMiddleTierRequired;
                    }
                    // Restore the merged work order info and save the updated work order data
                    if ( mergedEquipment ) {
                        updatedWorkOrder.workOrder.workOrderSegments[0].equipment = mergedEquipment;
                    }
                    if ( mergedStandardJobCode ) {
                        updatedWorkOrder.workOrder.workOrderSegments[0].standardJobCode = mergedStandardJobCode;
                    }

                    // Restore properties currently not supported by the middle tier
                    // FIXME: Remove dateTimeETA below when middle tier supports it
                    if ( dateTimeETA ) {
                        workOrder.workOrderSegments[0].dateTimeETA = dateTimeETA;
                    }

                    // SFAM-178: If the updated work order changes what's stored locally,
                    // add the changed property to the work order.  This allows the tech
                    // to be alerted about this.
                    if ( WorkOrder.isWorkOrderChanged( updatedWorkOrder.workOrder ) ) {
                        updatedWorkOrder.workOrder.changed = true;
                    }
                    JSONData.saveJSON( "workOrders", updatedWorkOrder.workOrder, true );

                    // Replace the locally stored technician clocking data with the updated data from the middle tier
                    if ( updatedWorkOrder.technicianClocking && updatedWorkOrder.technicianClocking.length > 0 ) {
                        debug && console.log( "WorkOrder.postWorkOrder: Replacing " + updatedWorkOrder.technicianClocking.length +
                                              " technician clockings" );

                        _.each( technicianClockings, function( clockingInList ) {
                            JSONData.deleteJSON( "technicianClocking", clockingInList.webId );
                        });
                        _.each( updatedWorkOrder.technicianClocking, function( clockingInList ) {
                            if ( clockingInList.postToMiddleTierRequired ) {
                                delete clockingInList.postToMiddleTierRequired;
                            }
                            JSONData.saveJSON( "technicianClocking", clockingInList, true );
                        });
                    }

                    // Update all technician clocking records associated with old work order ID
                    debug && console.log( "WorkOrder.postWorkOrder: Updating clockings after successful post of new work order" );
                    var clockingsToUpdate = _.filter( JSONData.getObjectsByDataType( "technicianClocking" ), function( clockingInList ) {
                        return clockingInList.workOrderHeaderId == postedWorkOrderId;
                    });
                    _.each( clockingsToUpdate, function( clockingInList ) {
                        clockingInList.workOrderHeaderId = updatedWorkOrder.workOrder.webId;
                        clockingInList.workOrderSegmentId = updatedWorkOrder.workOrder.workOrderSegments[0].webId;
                        clockingInList.workOrderDocumentNumber = updatedWorkOrder.workOrder.documentNumber;
                        clockingInList.workOrderCustomerName = customerForUpdatedWorkOrder.name;
                        JSONData.saveJSON( "technicianClocking", clockingInList, true );
                    });

                    // Update locally stored data using after successful post of a new work order
                    if ( postingNewWorkOrder ) {
                        // Delete locally stored copy of new work order because its webId is no longer valid
                        JSONData.deleteJSON( "workOrders", postedWorkOrderId );
                        if ( postingCurrentWorkOrder ) {
                            WorkOrder.removeCurrentWorkOrderId();
                        }
                        // SFAM-170: Update the webId used by the initial work order list filter
                        var initialWorkOrderListFilter = window.localStorage.getItem( JSONData.LS_INITIAL_WORK_ORDER_LIST_FILTER );
                        if ( initialWorkOrderListFilter && initialWorkOrderListFilter == postedWorkOrderId ) {
                            window.localStorage.setItem( JSONData.LS_INITIAL_WORK_ORDER_LIST_FILTER, updatedWorkOrder.workOrder.webId );
                        }
                    }

                    // If the webId changed, update the manage work order ID
                    // and the current work order ID
                    if ( updatedWorkOrder.workOrder.webId != postedWorkOrderId ) {
                        debug && console.log( "WorkOrder.postWorkOrder: webId changed." );
                        if ( postingManageWorkOrder ) {
                            debug && console.log( "WorkOrder.postWorkOrder: Updating manage work order ID" );
                            setManageWorkOrderId( updatedWorkOrder.workOrder.webId );
                        }
                        if ( postingCurrentWorkOrder ) {
                            debug && console.log( "WorkOrder.postWorkOrder: Updating current work order ID" );
                            var currentWorkOrder = setCurrentWorkOrderId( updatedWorkOrder.workOrder.webId )[0];
                            // Post not required after updating current work order due to webId change
                            if ( currentWorkOrder.postToMiddleTierRequired ) {
                                debug && console.log( "WorkOrder.postWorkOrder: Deleting postToMiddleTierRequired flag from current work order" );
                                delete currentWorkOrder.postToMiddleTierRequired;
                                JSONData.saveJSON( "workOrders", currentWorkOrder, true );
                            }
                        }
                    }

                    if ( displayProgressDialog ) {
                        Dialog.closeDialog( false );
                    }

                    // Update the current work order status in the footer to cover the case
                    // where a post of an existing work order updates the documentNumber property
                    UIFrame.updateCurrentWorkOrderStatus();

                    // Reload the current page
                    if ( reloadPageAfterPost ) {
                        UIFrame.reloadCurrentPage();
                    }

                    // Call the success callback if it's defined
                    if ( successCallback && _.isFunction( successCallback ) ) {
                        successCallback( updatedWorkOrder.workOrder );
                    }
                },
                // Error callback
                function( errorCode ) {
                    internalErrorCallbackFn( errorCode );
                }
            );
        } else {
            console.warn( "WorkOrder.postWorkOrder: App is offline. Post will not occur" );
        }
    }

    /**
     * Post an array of work orders to the middle tier
     * @param workOrders - Array of work orders to post
     * @param completeCallback - Callback function called when all posts are complete, optional
     *                           This is called after successful and failed posts.
     */
    function postWorkOrders( workOrders, completeCallback ) {
        if ( !workOrders || !_.isArray( workOrders ) || workOrders.length == 0 ) {
            throw "WorkOrder.postWorkOrders: Required parameter workOrders is missing or is invalid";
        }
        if ( Util.isOnline( false ) ) {
            var workOrderNumbers = Util.getWorkOrderDocumentNumbersAsString( workOrders );

            debug && console.log( "WorkOrder.postWorkOrders: Posting " + workOrders.length +
                                  " work orders to the middle tier" );
            // Set up a complete function that is executed once after all of the work orders are posted.
            var completeFn = _.after( workOrders.length,
                function() {
                    debug && console.log( "WorkOrder.postWorkOrders: " + workOrders.length +
                                          " work orders posted to the middle tier" );
                    // Close the progress dialog
                    Dialog.closeDialog( false );

                    // Call the complete callback if it's defined
                    if ( completeCallback && _.isFunction( completeCallback ) ) {
                        completeCallback();
                    }
                } );

            Dialog.showPleaseWait( Localization.getText( "postingWorkOrdersTitle" ),
                                   Localization.getText( "postingWorkOrdersText" ).replace( "workOrders", workOrderNumbers ), "400px" );
            // Post all of the work orders
            _.each( workOrders, function( workOrderInList ) {
                debug && console.log( "WorkOrder.postWorkOrders: Posting work order " + workOrderInList.documentNumber );
                WorkOrder.postWorkOrder( workOrderInList, false, false, completeFn, completeFn );
            } );
        } else {
            debug && console.log( "WorkOrder.postWorkOrders: Post skipped because app is offline" );
            if ( Config.getConfig().readOnlyMode && _.isFunction( completeCallback ) ) {
                completeCallback();
            }
        }
    }

    /**
     * Remove deleted lines from the specified work order
     * @param workOrder
     */
    function removeDeletedLinesFromWorkOrder( workOrder ) {
        // SFAM-178: Remove work order lines whose deleted property = true from work orders
        // that don't require a post to the middle tier
        var workOrderLines;
        if ( _.isUndefined( workOrder.postToMiddleTierRequired ) || !workOrder.postToMiddleTierRequired ) {
            debug && console.log( "WorkOrder.removeDeletedLinesFromWorkOrder: Work order line count before removing deleted lines: " +
                                  workOrder.workOrderSegments[0].workOrderLines.length );
            workOrderLines = _.filter( workOrder.workOrderSegments[0].workOrderLines, function( lineInList ) {
                return ( _.isUndefined( lineInList.deleted ) || !lineInList.deleted );
            });
            workOrder.workOrderSegments[0].workOrderLines = workOrderLines;
            debug && console.log( "WorkOrder.removeDeletedLinesFromWorkOrder: Work order line count after removing deleted lines: " +
                                  workOrder.workOrderSegments[0].workOrderLines.length );
        }
    }

    /**
     * Set the current work order to on hold
     */
    function setCurrentWorkOrderOnHold() {
        var currentWorkOrderId = WorkOrder.getCurrentWorkOrderId();
        var currentWorkOrder = null;
        if ( currentWorkOrderId ) {
            debug && console.log( "WorkOrder.setCurrentWorkOrderOnHold: Setting current work order ID " +
                                  currentWorkOrderId + " to on hold" );
            // Set current work order status to "on hold"
            currentWorkOrder = JSONData.getObjectById( "workOrders", currentWorkOrderId, null );
            currentWorkOrder.workOrderSegments[0].webStatus = WORK_ORDER_STATUS_WAITING_ON_HOLD;
            currentWorkOrder.postToMiddleTierRequired = true;
            JSONData.saveJSON( "workOrders", currentWorkOrder, true );

            // Clear the current work order local storage location
            WorkOrder.removeCurrentWorkOrderId();
            // Update the work order status area in the footer
            if ( UIFrame ) {
                UIFrame.updateCurrentWorkOrderStatus();
            }
        } else {
            console.warn( "WorkOrder.setCurrentWorkOrderOnHold: Current work order ID does not exist" );
        }
        return currentWorkOrder;
    }

    /**
     * Set the current work order ID.  This sets the work order to the "in progress"
     * status, changes the current work order (if there is one) to the "on hold" status and
     * stores the current work order ID in local storage.
     * @param workOrderId
     * @returns Array containing work orders changed by setting a new current work order ID
     */
    function setCurrentWorkOrderId( workOrderId ) {
        if ( !workOrderId ) {
            throw "WorkOrder.setCurrentWorkOrderId: Required parameter workOrderId is undefined";
        }

        var workOrdersChanged = [];

        // Set the current work order on hold
        var workOrderOnHold = setCurrentWorkOrderOnHold();
        if ( workOrderOnHold ) {
            workOrdersChanged.push( workOrderOnHold );
        }

        // Save the new current work order ID to local storage
        debug && console.log( "WorkOrder.setCurrentWorkOrderId: Setting current work order ID in local storage to " + workOrderId );
        window.localStorage.setItem( LS_CURRENT_WORK_ORDER_ID, workOrderId );
        if ( UIFrame ) {
            UIFrame.updateCurrentWorkOrderStatus();
        }

        var workOrder = JSONData.getObjectById( "workOrders", workOrderId, null );

        // If the work order is going from "not started" to "in progress", set the
        // date started property inside the segment
        if ( workOrder.workOrderSegments[0].webStatus == WORK_ORDER_STATUS_NOT_STARTED ) {
            workOrder.workOrderSegments[0].dateStarted = Util.getISOCurrentTime();
            debug && console.log( "WorkOrder.setCurrentWorkOrderId: Setting work order " +
                                  workOrder.documentNumber + " date started to " + workOrder.workOrderSegments[0].dateStarted );
        }

        // Change the status of the work order to "in progress"
        debug && console.log( "WorkOrder.setCurrentWorkOrderId: Change work order " + workOrder.documentNumber + " to in progress" );
        workOrder.workOrderSegments[0].webStatus = WORK_ORDER_STATUS_IN_PROGRESS;

        workOrder.postToMiddleTierRequired = true;
        JSONData.saveJSON( "workOrders", workOrder, true );

        workOrdersChanged.push( workOrder );
        return workOrdersChanged;
    }

    /**
     * Store the work order ID in local storage that will be viewable inside
     * the manage work order pages.
     * @param workOrderId
     */
    function setManageWorkOrderId( workOrderId ) {
        if ( !workOrderId ) {
            throw "WorkOrder.setManageWorkOrderId: Required parameter workOrderId is undefined";
        }
        debug && console.log( "WorkOrder.setManageWorkOrderId: Setting manage work order ID to " + workOrderId );
        window.localStorage.setItem( LS_MANAGE_WORK_ORDER_ID, workOrderId );
    }

    /**
     * Set writable flag in local storage for manage work order
     * @param writable - Writable flag value, defaults to false
     */
    function setManageWorkOrderWritable( writable ) {
        if ( _.isUndefined( writable ) ) {
            writable = false;
        }
        debug && console.log( "WorkOrder.setManageWorkOrderWritable: Setting manage work order writable to " + writable );
        window.localStorage.setItem( LS_MANAGE_WORK_ORDER_WRITABLE, writable );
    }

    /**
     * Set the manage work order activity.  Must be edit, open or view
     * @param activity String containing edit, open or view
     */
    function setManageWorkOrderActivity( activity ) {
        if ( _.indexOf( VALID_MANAGE_WORK_ORDER_ACTIVITIES, activity ) != -1 ) {
            debug && console.log( "WorkOrder.setWorkOrderActivity: Setting activity to " + activity );
            window.localStorage.setItem( LS_MANAGE_WORK_ORDER_ACTIVITY, activity );
        }
    }

    /**
     * Get the current manage work order activity
     * @returns String containing the current activity
     */
    function getManageWorkOrderActivity() {
        var activity = window.localStorage.getItem( LS_MANAGE_WORK_ORDER_ACTIVITY );
        debug && console.log( "WorkOrder.getManageWorkOrderActivity: Current activity = " + activity );
        return activity;
    }

    /**
     * Remove the current manage work order activity from local storage
     */
    function removeManageWorkOrderActivity() {
        window.localStorage.removeItem( LS_MANAGE_WORK_ORDER_ACTIVITY );
        debug && console.log( "WorkOrder.removeManageWorkOrderActivity: Removing current activity" );
    }

    /**
     * Display the new work order dialog.  This dialog allows the tech
     * to create a new work order
     * @param dialogType - Number, see NEW_WORK_ORDER_DIALOG_TYPES
     * @param saveClickHandlerFn
     * @param cancelClickHandlerFn
     */
    function displayNewWorkOrderDialog( dialogType, saveClickHandlerFn, cancelClickHandlerFn ) {
        if ( dialogType &&
             _.indexOf( _.values( NEW_WORK_ORDER_DIALOG_TYPES ), dialogType ) != -1 &&
             _.isFunction( saveClickHandlerFn) && _.isFunction( cancelClickHandlerFn ) ) {
            var newWorkOrderPopup = new EJS({url: 'templates/newworkorderdialog'}).render({
                dialogType : dialogType
            });
            Dialog.showDialog({
                mode: 'blank',
                width: '600px',
                blankContent : newWorkOrderPopup
            });

            // Set up dialog button click handlers
            $("#btnSave").click( function() {
                debug && console.log( "WorkOrder.displayNewWorkOrderDialog: Calling saveClickHandlerFn" );
                saveClickHandlerFn();
            });

            $("#cancelButton").click( function() {
                debug && console.log( "WorkOrder.displayNewWorkOrderDialog: Calling cancelClickHandlerFn" );
                cancelClickHandlerFn();
            });

            $("#orderType").change( function() {
                var selectedWorkOrderType = parseInt( $(this).val() );
                debug && console.log( "WorkOrder.displayNewWorkOrderDialog: Assigning selectedWorkOrderType to " + selectedWorkOrderType );
                if ( selectedWorkOrderType == NEW_WORK_ORDER_FMPM || selectedWorkOrderType == NEW_WORK_ORDER_PM ) {
                    $( '#segmentTitleDiv' ).hide();
                    $( '#workOrderDescriptionSection' ).hide();
                    $( "#partsOnlyDiv" ).hide();
                } else {
                    $( '#segmentTitleDiv' ).show();
                    if ( !$( "#partsOnly" ).is( ':checked' ) ) {
                        $( '#workOrderDescriptionSection' ).show();
                    }
                    $( "#partsOnlyDiv" ).show();
                }
            });

            $("#partsOnly").change( function() {
                var partsOnlyCheckbox = $(this);
                var selectedWorkOrderType = parseInt( $("#orderType").val() );
                var workOrderDescription = $("#workOrderDescriptionSection");
                // Turning on parts only sets the description automatically
                if ( partsOnlyCheckbox.is(':checked') ) {
                    workOrderDescription.hide();
                } else {
                    if ( selectedWorkOrderType != NEW_WORK_ORDER_FMPM && selectedWorkOrderType != NEW_WORK_ORDER_PM ) {
                        workOrderDescription.show();
                    }
                }
            });

        } else {
            console.error( "WorkOrder.displayNewWorkOrderDialog: One or more required parameters " +
                           "(dialogType, saveClickHandlerFn, cancelClickHandlerFn) are missing or invalid" );
        }
    }

    /**
     * Get the new work order description.  Used in conjuction with displayNewWorkOrderDialog to
     * create and save a new work order
     * @param newWorkOrder - Object containing new work order to popuplate
     */
    function populateNewWorkOrderFromDialog( newWorkOrder ) {
        var description = $('#txtDescription').val();
        var partsOnly = $("#partsOnly").is(':checked');
        var segmentTitle;
        var segmentTitleType = parseInt( $('#segmentTitle').val(), 10 );
        var selectedWorkOrderType = parseInt( $("#orderType").val(), 10 );

        switch ( segmentTitleType ) {
            case NEW_WORK_ORDER_RUNNING :
                segmentTitle = Localization.getText( "optionRunning" );
                break;
            case NEW_WORK_ORDER_DOWN :
                segmentTitle = Localization.getText( "optionDown" );
                break;
        }

        switch( selectedWorkOrderType ) {
            case NEW_WORK_ORDER_FW: // Factory Warranty
                newWorkOrder.documentNumber = "FW" + getNewLocalWorkOrderNumber();
                newWorkOrder.workOrderSegments[0].segmentName = segmentTitle;
                newWorkOrder.workOrderSegments[0].folderId = FW_FOLDER_ID;
                newWorkOrder.workOrderSegments[0].notesTop = description;
                break;
            case NEW_WORK_ORDER_FMPM: // FMPM work order
                newWorkOrder.documentNumber = "PM" + getNewLocalWorkOrderNumber();
                newWorkOrder.workOrderSegments[0].folderId = FMPM_FOLDER_ID;
                newWorkOrder.workOrderSegments[0].standardJobCodeId = Config.getConfig().FMStandardJobCodeWebId;
                newWorkOrder.workOrderSegments[0].notesTop = Localization.getText( "fullMaintenancePM" );
                // FMPM work order cannot be parts only
                partsOnly = false;
                break;
            case NEW_WORK_ORDER_PM: // Planned Maintenance option
                newWorkOrder.documentNumber = "PM" + getNewLocalWorkOrderNumber();
                newWorkOrder.workOrderSegments[0].folderId = PLANNED_MAINTENANCE_FOLDER_ID;
                newWorkOrder.workOrderSegments[0].standardJobCodeId = Config.getConfig().PMStandardJobCodeWebId;
                newWorkOrder.workOrderSegments[0].notesTop = Localization.getText( "plannedMaintenance" );
                // PM work order cannot be parts only
                partsOnly = false;
                break;
            case NEW_WORK_ORDER_EMPTY: // Work order with no equipment
                newWorkOrder.documentNumber = "W" + getNewLocalWorkOrderNumber();
                newWorkOrder.workOrderSegments[0].segmentName = segmentTitle;
                newWorkOrder.workOrderSegments[0].folderId = CUST_PAY_FOLDER_ID;
                newWorkOrder.workOrderSegments[0].notesTop = description;
                break;
            default: // Work Order option
                newWorkOrder.documentNumber = "W" + getNewLocalWorkOrderNumber();
                newWorkOrder.workOrderSegments[0].segmentName = segmentTitle;
                newWorkOrder.workOrderSegments[0].folderId = CUST_PAY_FOLDER_ID;
                newWorkOrder.workOrderSegments[0].notesTop = description;
                break;
        }
        // All parts only work orders get the same parts only work order description and
        // have their status set to in progress
        if ( partsOnly ) {
            newWorkOrder.workOrderSegments[0].notesTop = Localization.getText( "partsOnlyWorkOrder" );
            newWorkOrder.workOrderSegments[0].partsOnly = true;
            newWorkOrder.workOrderSegments[0].webStatus = WORK_ORDER_STATUS_IN_PROGRESS;
        } else {
            newWorkOrder.workOrderSegments[0].partsOnly = false;
            newWorkOrder.workOrderSegments[0].webStatus = WORK_ORDER_STATUS_NOT_STARTED;
        }
        debug && console.log( "WorkOrder.populateNewWorkOrderFromDialog: New work order details: " +
                              JSON.stringify( newWorkOrder ) );
    }

    /**
     * Set the billing folder verified flag value in local storage
     * @param newValue - Boolean
     */
    function setBillingFolderVerified( newValue ) {
        if ( _.isBoolean( newValue) ) {
            debug && console.log( "WorkOrder.setBillingFolderVerified: Setting to " + newValue );
            window.localStorage.setItem( LS_BILLING_FOLDER_VERIFIED, newValue );
        }
    }

    /**
     * Is the billing folder verified?  Returns value of billing folder flag value
     * from local storage
     * @returns Boolean
     */
    function isBillingFolderVerified() {
        var verified = ( window.localStorage.getItem( LS_BILLING_FOLDER_VERIFIED ) == "true" );
        debug && console.log( "WorkOrder.isBillingFolderVerified: Verified = " + verified );
        return verified;
    }

    /**
     * Mark a locally stored work order for deletion during a JSON feed update.
     * The following conditions will add a deleteWorkOrder property
     * to the work order's header
     *    deleted property in header is set to true
     *    deleted property in segment is set to true
     *    webStatus in segment is set to completed or rejected
     * @param workOrder - Object containing a work order from the currently running JSON feed update
     * @returns Boolean - true if work order is marked for deletion, false otherwise
     */
    function checkAndMarkWorkOrderForDeletion( workOrder ) {
        var deleteWorkOrder = false;
        var workOrderToDelete;
        if ( JSONData.isPeriodicJSONFeedUpdateRunning() && workOrder && _.isObject( workOrder ) ) {
            if ( workOrder.deleted || workOrder.workOrderSegments[0].deleted ) {
                debug && console.log( "WorkOrder.checkAndMarkWorkOrderForDeletion: Marking work order " +
                                      workOrder.documentNumber + " for deletion because header or segment deleted property is true" );
                deleteWorkOrder = true;
            } else if ( workOrder.workOrderSegments[0].webStatus == WorkOrder.WORK_ORDER_STATUS_COMPLETED ) {
                debug && console.log( "WorkOrder.checkAndMarkWorkOrderForDeletion: Marking work order " +
                                      workOrder.documentNumber + " for deletion because webStatus = completed" );
                deleteWorkOrder = true;
            } else if ( workOrder.workOrderSegments[0].webStatus == WorkOrder.WORK_ORDER_STATUS_REJECTED ) {
                debug && console.log( "WorkOrder.checkAndMarkWorkOrderForDeletion: Marking work order " +
                                      workOrder.documentNumber + " for deletion because webStatus = rejected" );
                deleteWorkOrder = true;
            }
            // Update locally stored work order with deleteWorkOrder flag
            if ( deleteWorkOrder ) {
                workOrderToDelete = JSONData.getObjectById( "workOrders", workOrder.webId, null );
                if ( workOrderToDelete ) {
                    debug && console.log( "WorkOrder.checkAndMarkWorkOrderForDeletion: Marking locally stored work order " +
                                          workOrderToDelete.documentNumber + " for deletion" );
                    workOrderToDelete.deleteWorkOrder = true;
                    window.localStorage.setItem( "workOrders." + workOrderToDelete.webId, JSON.stringify( workOrderToDelete ) );
                } else {
                    debug && console.log( "WorkOrder.checkAndMarkWorkOrderForDeletion: Work order " +
                                          workOrder.documentNumber + " does not exist in local storage" );
                }
            } else {
                debug && console.log( "WorkOrder.checkAndMarkWorkOrderForDeletion: Work order " +
                                      workOrder.documentNumber + " will not be deleted" );
            }
        }
        return deleteWorkOrder;
    }

    /**
     * Delete all work orders that are marked for deletion by the last JSON feed update.
     * Work orders with the deleteWorkOrder property set are deleted.
     *
     * If the current work order or the manage work order gets deleted by this method, this method
     * will return true to indicate that the mobile app should go to the work order list page.
     *
     * @returns Boolean - See above
     */
    function deleteWorkOrdersAfterJSONFeedUpdate() {
        var navigateToWorkOrderListAfterRefresh = false;
        var workOrders = JSONData.getObjectsByDataType( "workOrders" );
        _.each( workOrders, function( workOrderInList ) {
            if ( workOrderInList.deleteWorkOrder ) {
                debug && console.log( "WorkOrder.deleteWorkOrdersAfterJSONFeedUpdate: Work order " + workOrderInList.documentNumber +
                                      " marked for deletion" );
                // Clear manage work order ID if current one matches work order being deleted
                if ( workOrderInList.webId == WorkOrder.getManageWorkOrderId() ) {
                    WorkOrder.removeManageWorkOrderId();
                    // If the current page is one of the manage work order pages,
                    // automatically navigate to the work order list page when the refresh is complete
                    if ( UIFrame.getCurrentPageId().indexOf( "manageWorkOrder") === 0 ) {
                        navigateToWorkOrderListAfterRefresh = true;
                    }
                }
                // Clear the current work order ID and end productive clocking if
                // the current work order matches the one being deleted
                if ( workOrderInList.webId == WorkOrder.getCurrentWorkOrderId() ) {
                    WorkOrder.removeCurrentWorkOrderId();
                    JSONData.saveClockingStatus( "technicianStatusLoggedIn", Util.getISOCurrentTime() );
                    window.localStorage.setItem( JSONData.LS_CURRENT_WORK_ORDER_DELETED, workOrderInList.documentNumber );
                    navigateToWorkOrderListAfterRefresh = true;
                }
                debug && console.log( "WorkOrder.deleteWorkOrdersAfterJSONFeedUpdate: Deleting work order " +
                                      workOrderInList.documentNumber );
                JSONData.deleteJSON( "workOrders", workOrderInList.webId );
            }
        });
        return navigateToWorkOrderListAfterRefresh;
    }

    /**
     * Add the specified xcode to the specified work order
     * @param workOrder - Object containing the work order
     * @param xcode - Object containing the xcode
     */
    function addXcodeToWorkOrder( workOrder, xcode ) {
        var xcodeLine;
        if ( workOrder && _.isObject( workOrder ) &&
             xcode && _.isObject( xcode ) ) {
            // Change an existing xcode line if it exists and it's not marked for deletion
            xcodeLine = getXcodeLineFromWorkOrder( workOrder );
            if ( xcodeLine && !xcodeLine.deleted ) {
                debug && console.log( "WorkOrder.addXcodeToWorkOrder: Changing X code in work order " +
                                      workOrder.documentNumber + " to: " + JSON.stringify( xcode ) );
                xcodeLine.description = xcode.description;
                xcodeLine.note = xcode.notes;
                xcodeLine.product = null;
                xcodeLine.standardJobCodeId = xcode.webId;
                xcodeLine.type = WORK_ORDER_LINE_NOTE_TYPE;
            } else {
                debug && console.log( "WorkOrder.addXcodeToWorkOrder: Added the following X code to work order " +
                                      workOrder.documentNumber + ": " + JSON.stringify( xcode ) );
                xcodeLine = createNewWorkOrderLine();
                xcodeLine.description = xcode.description;
                xcodeLine.note = xcode.notes;
                xcodeLine.product = null;
                xcodeLine.standardJobCodeId = xcode.webId;
                xcodeLine.type = WORK_ORDER_LINE_NOTE_TYPE;
                workOrder.workOrderSegments[0].workOrderLines.push( xcodeLine );
            }
        }
    }

    /**
     * Get the X code work order line from the work order if it exists
     * @param workOrder
     * @returns Object containing the
     */
    function getXcodeLineFromWorkOrder( workOrder ) {
        var xcodes;
        var xcode = null;
        if ( workOrder && _.isObject( workOrder) ) {
            xcodes = JSONData.getObjectsByDataType( "xcodes" );
            if ( xcodes.length > 0 && workOrder.workOrderSegments[0] &&
                 workOrder.workOrderSegments[0].workOrderLines &&
                 workOrder.workOrderSegments[0].workOrderLines.length > 0 ) {
                xcode = _.find( workOrder.workOrderSegments[0].workOrderLines, function( lineInList ) {
                    var xcodeForLine;
                    // Only look at note lines that are not marked for deletion
                    if ( lineInList.type == WORK_ORDER_LINE_NOTE_TYPE && !lineInList.deleted ) {
                        // Find xcode for the note line
                        xcodeForLine = _.find( xcodes, function( xcodeInList ) {
                            return ( xcodeInList.webId == lineInList.standardJobCodeId );
                        });
                        // If found, add xcode to line
                        if ( xcodeForLine ) {
                            lineInList.xcode = xcodeForLine;
                            return true;
                        } else {
                            return false;
                        }
                    } else {
                        return false;
                    }
                });
                if ( !xcode ) {
                    xcode = null;
                }
            }
        }
        return xcode;
    }

    /**
     * Remove X code from the work order
     * @param workOrder
     */
    function removeXcodeFromWorkOrder( workOrder ) {
        var xcodeLine;
        if ( workOrder && _.isObject( workOrder ) ) {
            xcodeLine = getXcodeLineFromWorkOrder( workOrder );
            if ( xcodeLine ) {
                // Remove the X code line from the work order's line array by marking the line with deleted = true
                debug && console.log( "WorkOrder.removeXcodeFromWorkOrder: Removing the following X code line from work order " +
                                      workOrder.documentNumber + ": " + JSON.stringify( xcodeLine ) );
                xcodeLine.deleted = true;
            } else {
                debug && console.log( "WorkOrder.removeXcodeFromWorkOrder: Work order " + workOrder.documentNumber +
                                      " does not have an X code line" );
            }
        }
    }

    return {
        'CUST_PAY_FOLDER_ID'                        : CUST_PAY_FOLDER_ID,
        'FMPM_FOLDER_ID'                            : FMPM_FOLDER_ID,
        'FW_FOLDER_ID'                              : FW_FOLDER_ID,
        'MANAGE_WORK_ORDER_EDIT'                    : MANAGE_WORK_ORDER_EDIT,
        'MANAGE_WORK_ORDER_OPEN'                    : MANAGE_WORK_ORDER_OPEN,
        'MANAGE_WORK_ORDER_OPEN_NOCLOCKING'         : MANAGE_WORK_ORDER_OPEN_NOCLOCKING,
        'MANAGE_WORK_ORDER_VIEW'                    : MANAGE_WORK_ORDER_VIEW,
        'NEW_WORK_ORDER_DIALOG_TYPES'               : NEW_WORK_ORDER_DIALOG_TYPES,
        'OUTSIDE_PART_PURCHASE_MFG'                 : OUTSIDE_PART_PURCHASE_MFG,
        'OUTSIDE_PART_PURCHASE_PRODUCE_CODE'        : OUTSIDE_PART_PURCHASE_PRODUCE_CODE,
        'OUTSIDE_PART_PURCHASE_WEBID'               : OUTSIDE_PART_PURCHASE_WEBID,
        'PLANNED_MAINTENANCE_FOLDER_ID'             : PLANNED_MAINTENANCE_FOLDER_ID,
        'SEGMENT_COUNT'                             : SEGMENT_COUNT,
        'VALID_WORK_ORDER_STATUSES'                 : VALID_WORK_ORDER_STATUSES,
        'WORK_ORDER_LINE_LABOR_TYPE'                : WORK_ORDER_LINE_LABOR_TYPE,
        'WORK_ORDER_LINE_MFG_LABOR'                 : WORK_ORDER_LINE_MFG_LABOR,
        'WORK_ORDER_LINE_NOTE_TYPE'                 : WORK_ORDER_LINE_NOTE_TYPE,
        'WORK_ORDER_LINE_PART_TYPE'                 : WORK_ORDER_LINE_PART_TYPE,
        'WORK_ORDER_LINE_PTR'                       : WORK_ORDER_LINE_PTR,
        'WORK_ORDER_LINE_TTR'                       : WORK_ORDER_LINE_TTR,
        'WORK_ORDER_STATUS_NOT_STARTED'             : WORK_ORDER_STATUS_NOT_STARTED,
        'WORK_ORDER_STATUS_DISPATCHED'              : WORK_ORDER_STATUS_DISPATCHED,
        'WORK_ORDER_STATUS_REJECTED'                : WORK_ORDER_STATUS_REJECTED,
        'WORK_ORDER_STATUS_IN_PROGRESS'             : WORK_ORDER_STATUS_IN_PROGRESS,
        'WORK_ORDER_STATUS_WAITING_ON_HOLD'         : WORK_ORDER_STATUS_WAITING_ON_HOLD,
        'WORK_ORDER_STATUS_COMPLETED'               : WORK_ORDER_STATUS_COMPLETED,
        'addChangedFlagToWorkOrder'                 : addChangedFlagToWorkOrder,
        'addLineToWorkOrder'                        : addLineToWorkOrder,
        'addXcodeToWorkOrder'                       : addXcodeToWorkOrder,
        'checkAndMarkWorkOrderForDeletion'          : checkAndMarkWorkOrderForDeletion,
        'createNewWorkOrder'                        : createNewWorkOrder,
        'createNewWorkOrderLine'                    : createNewWorkOrderLine,
        'createNewWorkOrderSegment'                 : createNewWorkOrderSegment,
        'deleteWorkOrdersAfterJSONFeedUpdate'       : deleteWorkOrdersAfterJSONFeedUpdate,
        'displayNewWorkOrderDialog'                 : displayNewWorkOrderDialog,
        'displayWorkOrderChangedAlert'              : displayWorkOrderChangedAlert,
        'getCurrentWorkOrder'                       : getCurrentWorkOrder,
        'getCurrentWorkOrderId'                     : getCurrentWorkOrderId,
        'getManageWorkOrder'                        : getManageWorkOrder,
        'getManageWorkOrderId'                      : getManageWorkOrderId,
        'getManageWorkOrderActivity'                : getManageWorkOrderActivity,
        'getNewLocalWorkOrderNumber'                : getNewLocalWorkOrderNumber,
        'getNewWorkOrderCount'                      : getNewWorkOrderCount,
        'getSplitWorkOrders'                        : getSplitWorkOrders,
        'getWorkOrderCountForCustomer'              : getWorkOrderCountForCustomer,
        'getWorkOrderCountForEquipment'             : getWorkOrderCountForEquipment,
        'getWorkOrdersRequiringPostToMiddleTier'    : getWorkOrdersRequiringPostToMiddleTier,
        'getWorkOrderSegmentCount'                  : getWorkOrderSegmentCount,
        'getWorkOrderStatus'                        : getWorkOrderStatus,
        'getWorkOrderStatusIcon'                    : getWorkOrderStatusIcon,
        'getWorkOrderStatusText'                    : getWorkOrderStatusText,
        'getXcodeLineFromWorkOrder'                 : getXcodeLineFromWorkOrder,
        'isBillingFolderVerified'                   : isBillingFolderVerified,
        'isManageWorkOrderWritable'                 : isManageWorkOrderWritable,
        'isNewWorkOrder'                            : isNewWorkOrder,
        'isPartOnOrder'                             : isPartOnOrder,
        'isPartsOnlyWorkOrder'                      : isPartsOnlyWorkOrder,
        'isPMWorkOrder'                             : isPMWorkOrder,
        'isWorkOrderChanged'                        : isWorkOrderChanged,
        'isWorkOrderSignedByCustomer'               : isWorkOrderSignedByCustomer,
        'isWorkOrderSignedByTechnician'             : isWorkOrderSignedByTechnician,
        'populateNewWorkOrderFromDialog'            : populateNewWorkOrderFromDialog,
        'postWorkOrder'                             : postWorkOrder,
        'postWorkOrders'                            : postWorkOrders,
        'removeCurrentWorkOrderId'                  : removeCurrentWorkOrderId,
        'removeManageWorkOrderActivity'             : removeManageWorkOrderActivity,
        'removeManageWorkOrderId'                   : removeManageWorkOrderId,
        'resetLocalWorkOrderNumberIndex'            : resetLocalWorkOrderNumberIndex,
        'removeDeletedLinesFromWorkOrder'           : removeDeletedLinesFromWorkOrder,
        'removeXcodeFromWorkOrder'                  : removeXcodeFromWorkOrder,
        'setBillingFolderVerified'                  : setBillingFolderVerified,
        'setCurrentWorkOrderOnHold'                 : setCurrentWorkOrderOnHold,
        'setCurrentWorkOrderId'                     : setCurrentWorkOrderId,
        'setManageWorkOrderActivity'                : setManageWorkOrderActivity,
        'setManageWorkOrderId'                      : setManageWorkOrderId,
        'setManageWorkOrderWritable'                : setManageWorkOrderWritable
    };
}();
