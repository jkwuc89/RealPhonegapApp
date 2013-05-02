/**
 * workorder.js
 * Work order support script for JMeter tests
 */

// Constants
var FMPM_FOLDER_ID = 377;
var PM_FOLDER_ID = 359;
var WORK_FROM_PM_FOLDER_ID = 355;
var ACCEPTED = 100;
var REJECTED = 200;
var IN_PROGRESS = 500;
var CLOSED = 700;
var WORK_ORDER_LINE_PART_TYPE = 0;
var TECHNICIAN_STATUS_TRAVELING      = 300;
var TECHNICIAN_STATUS_PRODUCTIVE     = 500;
var TECHNICIAN_STATUS_NON_PRODUCTIVE = 600;
var PTR_ID = 3;
var TTR_ID = 6;

var signatureImage =
    "iVBORw0KGgoAAAANSUhEUgAABEwAAAD6CAYAAAC73dLBAAAgAElEQVR4Xu3dC7hVVb0o8CGwQTHQk2gFCkovdfvqHJWOVEpaJ7V8HE1QE8" +
    "Pj27x1yzS/HkrHMk09nUrAZ4rHBHxrqffeCnuo+eqSitm5KYphhlYqiby5cyxY281is/Zee8+11pxr/mYfH5przjnGb/zX67/G+I+NVidH" +
    "cBAgQIAAAQIECBAgQIAAAQIECHQIbCRhIhoIECBAgAABAgQIECBAgAABAusKSJiICAIECBAgQIAAAQIECBAgQIBAhYCEiZAgQIAAAQIECB" +
    "AgQIAAAQIECEiYiAECBAgQIECAAAECBAgQIECAQHUBM0xECAECBAgQIECAAAECBAgQIECgQkDCREgQIECAAAECBAgQIECAAAECBCRMxAAB" +
    "AgQIECBAgAABAgQIECBAoLqAGSYihAABAgQIECBAgAABAgQIECBQISBhIiQIECBAgAABAgQIECBAgAABAhImYoAAAQIECBAgQIAAAQIECB" +
    "AgUF3ADBMRQoAAAQIECBAgQIAAAQIECBCoEJAwERIECBAgQIAAAQIECBAgQIAAAQkTMUCAAAECBAgQIECAAAECBAgQqC5ghokIIUCAAAEC" +
    "BAgQIECAAAECBAhUCEiYCAkCBAgQIECAAAECBAgQIECAgISJGCBAgAABAgQIECBAgAABAgQIVBcww0SEECBAgAABAgQIECBAgAABAgQqBC" +
    "RMhAQBAgQIECBAgAABAgQIECBAQMJEDBAgQIAAAQIECBAgQIAAAQIEqguYYSJCCBAgQIAAAQIECBAgQIAAAQIVAhImQoIAAQIECBAgQIAA" +
    "AQIECBAgIGEiBggQIECAAAECBAgQIECAAAEC1QXMMBEhBAgQIECAAAECBAgQIECAAIEKAQkTIUGAAAECBAgQIECAAAECBAgQkDARAwQIEC" +
    "BAgAABAgQIECBAgACB6gJmmIgQAgQIECBAgAABAgQIECBAgECFgISJkCBAgAABAgQIECBAgAABAgQISJiIAQIECBAgQIAAAQIECBAgQIBA" +
    "dQEzTEQIAQIECBAgQIAAAQIECBAgQKBCQMJESBAgQIAAAQIECBAgQIAAAQIEJEzEAAECBAgQIECAAAECBAgQIECguoAZJiKEAAECBAgQIE" +
    "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" +
    "IECBAgQIAAAQkTMUCAAAECBAgQIECAAAECBAgQqC5ghokIIUCAAAECBAgQIECAAAECBAhUCEiYCAkCBAgQIECAAAECBAgQIECAgISJGCBA" +
    "gAABAgQIECBAgAABAgQIVBcww0SEECBAgAABAgQIECBAgAABAgQqBCRMhAQBAgQIECBAgAABAgQIECBAQMJEDBAgQIAAAQIECBAgQIAAAQ" +
    "IEqguYYSJCCBAgQIAAAQIECBAgQIAAAQIVAhImQoIAAQIECBAgQIAAAQIECBAgIGEiBggQIECAAAECBAgQIECAAAEC1QXMMBEhBAgQIECA" +
    "AAECBAgQIECAAIEKAQkTIUGAAAECBAgQIECAAAECBAgQkDARAwQIECBAgAABAgQIECBAgACB6gJmmIgQAgQIECBAgAABAgQIECBAgECFgI" +
    "SJkCBAgAABAgQIECBAgAABAgQISJiIAQIECBAgQIAAAQIECBAgQIBAdQEzTEQIAQIECBAgQIAAAQIECBAgQKBCQMJESBAgQIAAAQIECBAg" +
    "QIAAAQIEJEzEAAECBAgQIECAAAECBAgQIECguoAZJiKEAAECBAgQIECAAAECBAgQIFAhIGEiJAgQIECAAAECBAgQIECAAAECEiZigAABAg" +
    "QIECBAgAABAgQIECBQXcAMExFCgAABAgQIECBAgAABAgQIEKgQkDAREgQIECBAgAABAgQIECBAgAABCRMxQIAAAQIECBAgQIAAAQIECBCo" +
    "LmCGiQghQIAAAQIECBAgQIAAAQIECFQISJgICQIECBAgQIAAAQIECBAgQICAhIkYIECAAAECBAgQIECAAAECBAhUFzDDRIQQIECAAAECBA" +
    "gQIECAAAECBCoEJEyEBAECBAgQIECAAAECBAgQIEBAwkQMECBAgAABAgQIECBAgAABAgSqC5hhIkIIECBAgAABAgQIECBAgAABAhUCEiZC" +
    "ggABAgQIECBAgAABAgQIECAgYSIGCBAgQIAAAQIECBAgQIAAAQLVBcwwESEECBAgQIAAAQIECBAgQIAAgQoBCRMhQYAAAQIECBAgQIAAAQ" +
    "IECBCQMBEDBAgQIECAAAECBAgQIECAAIHqAmaYiBACBAgQIECAAAECBAgQIECAQIWAhImQIECAAAECBAgQIECAAAECBAhImIgBAgQIECBA" +
    "gAABAgQIECBAgEB1ATNMRAgBAgQIECBAgAABAgQIECBAoEJAwkRIECBAgAABAgQIECBAgAABAgQkTMQAAQIECBAgQIAAAQIECBAgQKC6gB" +
    "kmIoQAAQIECBAgQIAAAQIECBAgUCEgYSIkCBAgQIAAAQIECBAgQIAAAQISJmKAAAECBAgQIECAAAECBAgQIFBdwAwTEUKAAAECBAgQIECA" +
    "AAECBAgQqBCQMBESBAgQIECAAAECBAgQIECAAAEJEzFAgAABAgQIECBAgAABAgQIEKguYIaJCCFAgAABAgQIECBAgAABAgQIVAhImAgJAg" +
    "QIECBAgAABAgQIECBAgICEiRggQIAAAQIECBAgQIAAAQIECFQXMMNEhBAgQIAAAQIECBAgQIAAAQIEKgQkTIQEAQIECBAgQIAAAQIECBAg" +
    "QEDCRAwQIECAAAECBAgQIECAAAECBKoLmGEiQggQIECAAAECBAgQIECAAAECFQISJkKCAAECBAgQIECAAAECBAgQICBhIgYIECBAgAABAg" +
    "QIECBAgAABAtUFzDARIQQIECBAgAABAgQIECBAgACBCgEJEyFBgAABAgQIECBAgAABAgQIEJAwEQMECBAgQIAAAQIECBAgQIAAgeoCZpiI" +
    "EAIECBAgQIAAAQIECBAgQIBAhYCEiZAgQIAAAQIECBAgQIAAAQIECEiYiAECBAgQIECAAAECBAgQIECAQHUBM0xECAECBAgQIECAAAECBA" +
    "gQIECgQkDCREgQIECAAAECBAgQIECAAAECBCRMxAABAgQIECBAgAABAgQIECBAoLqAGSYihAABAgQIECBAgAABAgQIECBQISBhIiQIECBA" +
    "gAABAgQIECBAgAABAhImYoAAAQIECBAgQIAAAQIECBAgUF3ADBMRQoAAAQIECBAgQIAAAQIECBCoEJAwERIECBAgQIAAAQIECBAgQIAAAQ" +
    "kTMUCAAAECBAgQIECAAAECBAgQqC5ghokIIUCAAAECBAgQIECAAAECBAhUCEiYCAkCBAgQIECAAAECBAgQIECAgISJGCBAgAABAgQIECBA" +
    "gAABAgQIVBcww0SEECBAgAABAgQIECBAgAABAgQqBCRMhAQBAgQIECBAgAABAgQIECBAQMJEDBAgQIAAAQIECBAgQIAAAQIEqguYYSJCCB" +
    "AgQIAAAQIECBAgQIAAAQIVAhImQoIAAQIECBAgQIAAAQIECBAgIGEiBggQIECAAAECBAgQIECAAAEC1QXMMBEhBAgQIECAAAECBAgQIECA" +
    "AIEKgf8P+CNSXS8ubt4AAAAASUVORK5CYII=";

/**
 * Valid combinations of customer, address and equipment IDs
 */
var VALID_CUSTOMER_EQUIPMENT_ADDRESS_IDS = [
    { customerId : 1678120, addressId : 443545, equipmentIds : [ 1950818, 1958341, 1955856, 1963080, 1970737, 1965404 ] },
    { customerId : 1675097, addressId : 1672903, equipmentIds : [ 1949288, 1948696, 1959684, 1966283, 1968460, 1959143 ] },
    { customerId : 1673150, addressId : 1673132, equipmentIds : [ 1966562, 1959819, 1947417, 1960800, 1947385, 1967067 ] },
    { customerId : 402087, addressId : 402111, equipmentIds : [ 1955668, 1950408, 1961853, 1960874, 1949660, 1955668 ] },
];
function getRandomCustomerEquipmentAddressIDs() {
    return VALID_CUSTOMER_EQUIPMENT_ADDRESS_IDS[ Math.floor( ( Math.random() * VALID_CUSTOMER_EQUIPMENT_ADDRESS_IDS.length ) ) ];
}

/**
 * Valid folder IDs for work orders
 */
var VALID_FOLDER_IDS = [
    355, 356, 357, 358, 360, 361, 363, 364, 365, 368, 370, 373, 374, 376, 380, 381
];
function getRandomFolderId() {
    return VALID_FOLDER_IDS[ Math.floor( ( Math.random() * VALID_FOLDER_IDS.length ) ) ];
}
var VALID_PM_FOLDER_IDS = [
    WORK_FROM_PM_FOLDER_ID, PM_FOLDER_ID, FMPM_FOLDER_ID
];
function getRandomPMFolderId() {
    return VALID_PM_FOLDER_IDS[ Math.floor( ( Math.random() * VALID_PM_FOLDER_IDS.length ) ) ];
}

/**
 * Valid products for work orders
 */
var VALID_PRODUCTS = [
    { webId : 711846, productCode : "060000-024" },
    { webId : 712206, productCode : "060009-002" },
    { webId : 719507, productCode : "064019-102" },
    { webId : 726162, productCode : "065081-025" },
    { webId : 726442, productCode : "065148" },
    { webId : 754604, productCode : "094362-001" },
    { webId : 773362, productCode : "104651" },
    { webId : 800040, productCode : "118620-001" },
    { webId : 819562, productCode : "127198" },
    { webId : 942025, productCode : "300227-014" },
    { webId : 975120, productCode : "363500-001" },
    { webId : 754607, productCode : "094362-004" },
    { webId : 975405, productCode : "364100-001" },
    { webId : 799420, productCode : "118322" },
    { webId : 975201, productCode : "363507-001" },
    { webId : 975240, productCode : "363514-001" },
    { webId : 811720, productCode : "123437" },
    { webId : 784948, productCode : "110581" },
    { webId : 773082, productCode : "104483" },
    { webId : 735500, productCode : "076914" },
    { webId : 982467, productCode : "380014-008-02" }
];
function getRandomProduct() {
    return VALID_PRODUCTS[ Math.floor( ( Math.random() * VALID_PRODUCTS.length ) ) ];
}

/**
 * Valid standard job codes for work orders
 */
var VALID_STANDARD_JOB_CODE_IDS = [
    1987165, 1989801, 1991728, 1984320, 1989088, 1990308, 1993603, 1991540, 1996209, 1990325, 1997581
];
function getRandomStandardJobCodeId() {
    return VALID_STANDARD_JOB_CODE_IDS[ Math.floor( ( Math.random() * VALID_STANDARD_JOB_CODE_IDS.length ) ) ];
}

/**
 * Valid PM standard job codes for work orders
 */
var VALID_PM_STANDARD_JOB_CODE_IDS = [
    1974171, 1974279, 1974290, 1974411, 1974590, 1975315, 1975969, 1977804
];
function getRandomPMStandardJobCodeId() {
    return VALID_PM_STANDARD_JOB_CODE_IDS[ Math.floor( ( Math.random() * VALID_PM_STANDARD_JOB_CODE_IDS.length ) ) ];
}

/**
 * Get the current time as an ISO string
 */
function getISOCurrentTime() {
    return new Date().toISOString();
}

/**
 * Get a unique ID via a random number generator
 */
function getUniqueId() {
    return Math.floor( ( Math.random() * 10000000 ) + 1 );
}

/**
 * Quickly clone an object
 */
function clone( obj ) {
    var target = {};
    for ( var i in obj ) {
        if ( obj.hasOwnProperty( i ) ) {
            target[i] = obj[i];
        }
    }
    return target;
}

/**
 * Add a new clocking to the work order
 * @param workOrder
 * @param laborCodeId - Must be PTR_ID or TTR_ID
 * @param startTime - Start time in milliseconds
 * @param endTime - End time in milliseconds
 */
function addNewClockingToWorkOrder( workOrder, laborCodeId, startTime, endTime ) {
    var technicianStatus = 0;
    switch ( laborCodeId ) {
        case PTR_ID :
            technicianStatus = TECHNICIAN_STATUS_PRODUCTIVE;
            break;
        case TTR_ID :
            technicianStatus = TECHNICIAN_STATUS_TRAVELING;
            break;
    }
    var newClocking = {
        webId: null,
        internalId: null,
        laborCodeId: laborCodeId,
        laborTimeTypeId: 1,
        technicianStatus: technicianStatus,
        timeStart: new Date( startTime ).toISOString(),
        timeEnd: new Date( endTime ).toISOString(),
        unproductiveTimeReason: null,
        workOrderHeaderId: workOrder.workOrder.webId,
        workOrderSegmentId: workOrder.workOrder.workOrderSegments[0].webId,
        workOrderLineId: null
    };
    workOrder.technicianClocking.push( newClocking );
}

/**
 * Add a random number of clockings to the work order.  The
 * range is 0 to 5
 * @param workOrder
 */
function addRandomClockingsToWorkOrder( workOrder ) {
    // How many clockings are we going to add?
    // var numClockings = Math.floor( ( Math.random() * 6 ) );
    var numClockings = 2;

    log.info( "addRandomClockingsToWorkOrder: Adding " + numClockings + " clockings to work order " + workOrder.workOrder.documentNumber );

    // Initialize start and end times for the clockings being created
    var now = new Date().getTime();
    var clockingInterval = 1000 * 60 * 60;
    var startTime = now - ( numClockings * clockingInterval );
    var endTime = startTime + clockingInterval;

    var laborCodeId = 0;
    for ( var i = 0; i < numClockings; i++ ) {
        // Alternate between PTR and TTR
        if ( ( i % 2 ) === 0 ) {
            laborCodeId = PTR_ID;
        } else {
            laborCodeId = TTR_ID;
        }
        addNewClockingToWorkOrder( workOrder, laborCodeId, startTime, endTime );
        startTime -= clockingInterval;
        endTime -= clockingInterval;
    }
}

/**
 * Create a new work order line
 */
function createNewWorkOrderLine() {
    var createDate = getISOCurrentTime();
    var workOrderLine = {};
    workOrderLine.webId             = getUniqueId();
    workOrderLine.allocated         = 0;
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
    workOrderLine.status            = 0;
    workOrderLine.userId            = null;
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
 * Create a new work order segment
 * @param createDate
 */
function createNewWorkOrderSegment( createDate ) {
    var workOrderSegment = {};
    workOrderSegment.webId               = getUniqueId();
    workOrderSegment.branchId            = 16;
    workOrderSegment.chargeCode          = null;
    workOrderSegment.currencyCode        = null;
    workOrderSegment.customerSignature   = null;
    workOrderSegment.dateClosed          = null;
    workOrderSegment.dateCompleted       = null;
    workOrderSegment.dateOpened          = createDate;
    workOrderSegment.dateStarted         = null;
    workOrderSegment.dateUpdated         = createDate;
    workOrderSegment.departmentId        = null;
    workOrderSegment.discountCode        = null;
    workOrderSegment.hourMeter           = Math.floor( ( Math.random() * 1000 ) + 1 );
    workOrderSegment.equipmentId         = null;
    workOrderSegment.odometer            = 0;
    workOrderSegment.folderId            = getRandomFolderId();
    workOrderSegment.internalId          = null;
    workOrderSegment.notesBottom         = "";
    workOrderSegment.noteInstructions    = null;
    workOrderSegment.notesTop            = "";
    workOrderSegment.pmScheduleId        = null;
    workOrderSegment.priceCode           = null;
    workOrderSegment.segmentAction       = "000008";
    workOrderSegment.segmentName         = "";
    workOrderSegment.segmentType         = 0;
    workOrderSegment.serviceTruckId      = null;
    workOrderSegment.shipToAddressId     = null;
    workOrderSegment.shipToCustomerId    = null;
    workOrderSegment.standardJobCodeId   = null;
    workOrderSegment.status              = null;
    workOrderSegment.taxCodeId           = null;
    workOrderSegment.technicianSignature = null;
    workOrderSegment.webStatus           = ( Math.random() < 0.5 ? 0 : 100 );
    workOrderSegment.workOrderLines      = [];
    return workOrderSegment;
}

/**
 * Create a new work order
 * @param numSegments - Number of work order segments to add to
 *                      the work order
 */
function createNewWorkOrder( numSegments ) {
    var workOrder = {};
    var createDate = getISOCurrentTime();
    workOrder.technicianClocking = [];
    workOrder.workOrder = {};
    workOrder.workOrder.webId             = null;
    workOrder.workOrder.clientReference   = getUniqueId();
    workOrder.workOrder.addressId         = null;
    workOrder.workOrder.companyId         = null;
    workOrder.workOrder.contactName       = "JMeter New WO Contact Name";
    workOrder.workOrder.contactNumber     = "614-555-1212 Ext: 2112";
    workOrder.workOrder.customerId        = null;
    workOrder.workOrder.dateOpened        = createDate;
    workOrder.workOrder.documentNumber    = ( "JMeter" + Math.floor( ( Math.random() * 1000000 ) + 1 ) );
    workOrder.workOrder.documentReference = ( "JMeterPO" + Math.floor( ( Math.random() * 1000 ) + 1 ) );
    workOrder.workOrder.internalId        = null;
    workOrder.workOrder.note              = null;
    workOrder.workOrder.newWorkOrder      = true;
    workOrder.workOrder.workOrderSegments = [];
    for ( var i = 0; i < numSegments; i++ ) {
        workOrder.workOrder.workOrderSegments.push( createNewWorkOrderSegment( createDate ) );
    }
    return workOrder;
}

/**
 * Add a part line to the specified work order segment
 * @param workOrderSegment
 * @param productWebId
 * @param productCode
 * @param quantity
 */
function addPartToWorkOrder( workOrderSegment, productWebId, productCode, quantity ) {
    var newPartLine = createNewWorkOrderLine();
    newPartLine.type = WORK_ORDER_LINE_PART_TYPE;
    newPartLine.product.webId = productWebId;
    newPartLine.product.productCode = productCode;
    newPartLine.product.manufacturer = "CRW";
    newPartLine.qtyOrdered = quantity;
    workOrderSegment.workOrderLines.push( newPartLine );
}

/**
 * Add a random number of parts to the specified work order segment
 * @param workOrderSegment
 */
function addRandomPartsToWorkOrder( workOrderSegment ) {
    var numPartsToAdd = Math.floor( ( Math.random() * 10 ) );
    log.info( "addRandomPartsToWorkOrder: Adding " + numPartsToAdd + " parts to work order" );
    var product = null;
    for ( var i = 0; i < numPartsToAdd; i++ ) {
        product = getRandomProduct();
        addPartToWorkOrder( workOrderSegment, product.webId, product.productCode, Math.floor( ( Math.random() * 10 ) + 1 ) );
    }
}

/**
 * Change the property values inside the specified work order segment
 * @param workOrder
 * @param equipmentIds
 */
function changeWorkOrderSegmentProperties( workOrder, equipmentIds ) {
    var workOrderSegment = workOrder.workOrderSegments[0];
    workOrderSegment.notesTop = "JMeter - Changing work order segment properties on " + new Date().toISOString();
    workOrderSegment.segmentName = "JMeter WO Segment for " + workOrder.documentNumber;

    // Randomly assign the equipment ID
    workOrderSegment.equipmentId = equipmentIds[ Math.floor( ( Math.random() * equipmentIds.length ) ) ];

    // Add a random number of parts to the work order
    addRandomPartsToWorkOrder( workOrderSegment );

    // Set a random standard job code ID
    workOrderSegment.standardJobCodeId = getRandomStandardJobCodeId();
}

/**
 * Create a new work order from equipment and store the work order
 * inside the JMeter var newWorkOrder
 * @param args - JMeter args, args[1] specifies status for new work order
 */
function createNewWorkOrderFromEquipment( args ) {
    var numSegments = 1;
    var workOrder = createNewWorkOrder( numSegments );
    workOrder.workOrder.documentNumber = "WO" + workOrder.workOrder.documentNumber;

    // Set the customer, address and equipment IDs
    var customerEquipmentAddressIDs = getRandomCustomerEquipmentAddressIDs();
    workOrder.workOrder.customerId = customerEquipmentAddressIDs.customerId;
    workOrder.workOrder.addressId = customerEquipmentAddressIDs.addressId;

    changeWorkOrderSegmentProperties( workOrder.workOrder, customerEquipmentAddressIDs.equipmentIds );

    if ( args.length === 2 ) {
        workOrder.workOrder.workOrderSegments[0].webStatus = parseInt( args[1], 10 );
    }

    // Add random number of clockings to the work order
    // addRandomClockingsToWorkOrder( workOrder );

    vars.put( "newWorkOrder", JSON.stringify( workOrder ) );
}

/**
 * Create a work order without equipment
 */
function createNewWorkOrderWithoutEquipment() {
    var numSegments = 1;
    var workOrder = createNewWorkOrder( numSegments );
    workOrder.workOrder.documentNumber = "WO" + workOrder.workOrder.documentNumber;

    // Set the customer, address and equipment IDs
    var customerEquipmentAddressIDs = getRandomCustomerEquipmentAddressIDs();
    workOrder.workOrder.customerId = customerEquipmentAddressIDs.customerId;
    workOrder.workOrder.addressId = customerEquipmentAddressIDs.addressId;

    vars.put( "newWorkOrder", JSON.stringify( workOrder ) );
}

/**
 * Create a new work order using one of the PM billing folder types.
 * This work order is not given a specific PM schedule ID, making this method more
 * suitable for JMeter testing.
 */
function createNewPMWorkOrder( args ) {
    var workOrder = createNewWorkOrder(1);
    workOrder.workOrder.documentNumber = "PM" + workOrder.workOrder.documentNumber;

    // Set the customer, address and equipment IDs
    var customerEquipmentAddressIDs = getRandomCustomerEquipmentAddressIDs();
    workOrder.workOrder.customerId = customerEquipmentAddressIDs.customerId;
    workOrder.workOrder.addressId = customerEquipmentAddressIDs.addressId;
    workOrder.workOrder.workOrderSegments[0].equipmentId =
        customerEquipmentAddressIDs.equipmentIds[ Math.floor( ( Math.random() * customerEquipmentAddressIDs.equipmentIds.length ) ) ];

    workOrder.workOrder.workOrderSegments[0].notesTop = "JMeter New PM WO - " + new Date().toISOString();
    workOrder.workOrder.workOrderSegments[0].notesBottom = "JMeter New PM WO - Notes Bottom for " + workOrder.workOrder.documentNumber;
    workOrder.workOrder.workOrderSegments[0].standardJobCodeId = getRandomPMStandardJobCodeId();

    // Set the folder to one of the PM folders
    workOrder.workOrder.workOrderSegments[0].folderId = getRandomPMFolderId();

    // Add a random number of parts to the work order
    addRandomPartsToWorkOrder( workOrder.workOrder.workOrderSegments[0] );

    if ( args.length === 2 ) {
        workOrder.workOrder.workOrderSegments[0].webStatus = parseInt( args[1], 10 );
    }

    // Add random number of clockings to the work order
    // addRandomClockingsToWorkOrder( workOrder );

    vars.put( "newWorkOrder", JSON.stringify( workOrder ) );
}

/**
 * Create a new work order from a PM schedule using
 * a random PM schedule available via JMeter var used to store all PM schedules
 * pulled via JSON feed.  New work order is stored inside the JMeter var newWorkOrder.
 */
function createNewWorkOrderFromPM() {
    var workOrder = createNewWorkOrder(1);
    workOrder.workOrder.documentNumber = "PM" + workOrder.workOrder.documentNumber;

    // Use random PM from list of available PMs
    var numPMSchedules = parseInt( vars.get( "numPMSchedules" ) );
    var pmIndex = Math.floor( ( Math.random() * numPMSchedules ) + 1 );
    var pmSchedule = JSON.parse( vars.get( "pmSchedule_" + pmIndex ) );
    log.info( "createNewWorkOrderFromPM: Creating work order from PM schedule: " + JSON.stringify( pmSchedule ) );

    // Set work order values using data from the PM schedule
    workOrder.workOrder.workOrderSegments[0].pmScheduleId = pmSchedule.webId;
    workOrder.workOrder.customerId = pmSchedule.customerId;
    workOrder.workOrder.workOrderSegments[0].equipmentId = pmSchedule.equipmentId;
    workOrder.workOrder.workOrderSegments[0].notesTop = "JMeter New WO from PM ID " + pmSchedule.webId;
    if ( pmSchedule.note ) {
        workOrder.workOrder.workOrderSegments[0].notesBottom = pmSchedule.note;
    }
    if ( pmSchedule.standardJobCodeId ) {
        workOrder.workOrder.workOrderSegments[0].standardJobCodeId = pmSchedule.standardJobCodeId;
    } else {
        workOrder.workOrder.workOrderSegments[0].standardJobCodeId = getRandomPMStandardJobCodeId();
    }
    workOrder.workOrder.workOrderSegments[0].hourMeter = pmSchedule.hourmeter + 1000;

    // Set the folder to the PM folder
    workOrder.workOrder.workOrderSegments[0].folderId = PM_FOLDER_ID;

    // Add a random number of parts to the work order
    addRandomPartsToWorkOrder( workOrder.workOrder.workOrderSegments[0] );

    // Add random number of clockings to the work order
    // addRandomClockingsToWorkOrder( workOrder );

    // Store created work order in JMeter var
    vars.put( "newWorkOrder", JSON.stringify( workOrder ) );
}

/**
 * Is work order line writable?
 */
function isWorkOrderLineWritable( workOrderLine ) {
    return ( ( typeof workOrderLine.writable === "undefined" ) || workOrderLine.writable );
}

/**
 * Make changes to a work order
 */
function changeWorkOrder( workOrder ) {
    // Delete at most two parts
    var currentWorkOrderLines = [];
    for ( var index = 0; index < workOrder.workOrderSegments[0].workOrderLines.length; index++ ) {
        currentWorkOrderLines.push( workOrder.workOrderSegments[0].workOrderLines[index] );
    }
    workOrder.workOrderSegments[0].workOrderLines = [];
    var numPartsDeleted = 0;
    for ( var index = 0; index < currentWorkOrderLines.length; index++ ) {
        if ( currentWorkOrderLines[index].type == WORK_ORDER_LINE_PART_TYPE &&
             isWorkOrderLineWritable( currentWorkOrderLines[index] ) &&
             numPartsDeleted < 2 ) {
            numPartsDeleted++;
        } else {
            workOrder.workOrderSegments[0].workOrderLines.push( currentWorkOrderLines[index] );
        }
    }

    // Change quantity for remaining parts to 5
    for ( var index = 0; index < workOrder.workOrderSegments[0].workOrderLines.length; index++ ) {
        if ( workOrder.workOrderSegments[0].workOrderLines[index].type == WORK_ORDER_LINE_PART_TYPE &&
             isWorkOrderLineWritable( workOrder.workOrderSegments[0].workOrderLines[index] ) ) {
            workOrder.workOrderSegments[0].workOrderLines[index].qtyOrdered = 5;
        }
    }

    // Add random number of new parts
    addRandomPartsToWorkOrder( workOrder.workOrderSegments[0] );

    // Change the standard job code ID
    workOrder.workOrderSegments[0].standardJobCodeId = getRandomStandardJobCodeId();

    // Change the folder ID
    workOrder.workOrderSegments[0].folderId = getRandomFolderId();

    // Add a repair note
    workOrder.workOrderSegments[0].notesBottom = "JMeter repair noted changed on " + getISOCurrentTime();

    // Change the PO number
    workOrder.documentReference = ( "JMeterPOUPD" + Math.floor( ( Math.random() * 1000 ) + 1 ) );

    // Add 100 to the hour meter
    workOrder.workOrderSegments[0].hourMeter += 100;

    // Add random number of clockings to the work order
    // addRandomClockingsToWorkOrder( workOrder );
}

/**
 * Change an existing work order.  The updated work order gets
 * stored as a string inside the JMeter var updatedWorkOrder.
 */
function changeExistingWorkOrder() {
    var currentWorkOrder = JSON.parse( vars.get( "currentWorkOrder" ) );

    // Create JSON object for the updated work order
    var updatedWorkOrder = {
        technicianClocking : [],
        workOrder : currentWorkOrder
    };

    changeWorkOrder( updatedWorkOrder.workOrder );

    // Save the updated work order as a JMeter variable
    vars.put( "updatedWorkOrder", JSON.stringify( updatedWorkOrder ) );
}

/**
 * Change the status of an existing work order using the specified status value
 * @param args from JMeter, args[1] contains new status value
 */
function changeWorkOrderStatus( args ) {
    var newStatus = parseInt( args[1], 10 );
    var currentWorkOrder = JSON.parse( vars.get( "currentWorkOrder" ) );
    log.info( "reassignWorkOrder: Changing status of work order " + currentWorkOrder.documentNumber + " to " + newStatus );

    // Create JSON object for the updated work order
    var updatedWorkOrder = {
        technicianClocking : [],
        workOrder : currentWorkOrder
    };

    // Set the webStatus to specified status value
    updatedWorkOrder.workOrder.workOrderSegments[0].webStatus = newStatus;
    if ( newStatus === IN_PROGRESS ) {
        updatedWorkOrder.workOrder.workOrderSegments[0].dateStarted = getISOCurrentTime();
    }

    vars.put( "updatedWorkOrder", JSON.stringify( updatedWorkOrder ) );
}

/**
 * Delete an existing work order by setting it's header deleted property to true
 */
function deleteExistingWorkOrder() {
    var currentWorkOrder = JSON.parse( vars.get( "currentWorkOrder" ) );

    // Create JSON object for the updated work order
    var updatedWorkOrder = {
        technicianClocking : [],
        workOrder : currentWorkOrder
    };

    // Set the deleted property on the header and the segment
    updatedWorkOrder.workOrder.deleted = true;
    updatedWorkOrder.workOrder.workOrderSegments[0].deleted = true;

    // Save the updated work order as a JMeter variable
    vars.put( "updatedWorkOrder", JSON.stringify( updatedWorkOrder ) );
}

/**
 * Sign and close a work order by setting the signature properties and
 * setting the webStatus to CLOSED (700)
 */
function signAndCloseWorkOrder() {
    var currentWorkOrder = JSON.parse( vars.get( "currentWorkOrder" ) );
    log.info( "signAndCloseWorkOrder: Signing and closing work order " + currentWorkOrder.documentNumber );

    // Create JSON object for the updated work order
    var updatedWorkOrder = {
        technicianClocking : [],
        workOrder : currentWorkOrder
    };

    var closeDate = getISOCurrentTime();

    // Set the webStatus to closed
    updatedWorkOrder.workOrder.workOrderSegments[0].webStatus = CLOSED;
    updatedWorkOrder.workOrder.workOrderSegments[0].dateCompleted = closeDate;

    // Set the signatures on the work order
    var signature = {
        webId : null,
        dateCaptured : closeDate,
        format : "image/png;base64",
        value : signatureImage
    };
    updatedWorkOrder.workOrder.workOrderSegments[0].customerSignature = signature;
    updatedWorkOrder.workOrder.workOrderSegments[0].technicianSignature = signature;

    vars.put( "updatedWorkOrder", JSON.stringify( updatedWorkOrder ) );
}

/**
 * Create a new work order using the middle tier response data
 * from the previous post.  The response data is in the JMeter test var newWorkOrderResponse
 * @param args - JMeter args, optional, if args[1] is true, change the work order
 */
function createNewWorkOrderFromResponse( args ) {
    log.info( "createNewWorkOrderFromResponse: Creating new WO from previous WO post response" );
    var originalNewWorkOrderPost = JSON.parse( vars.get( "newWorkOrder" ) );
    var newWorkOrder = JSON.parse( vars.get( "newWorkOrderResponse" ) );

    // Reuse the pmScheduleId if it's available as a JMeter var
    var pmScheduleId = originalNewWorkOrderPost.workOrder.workOrderSegments[0].pmScheduleId;
    if ( pmScheduleId ) {
        newWorkOrder.workOrder.workOrderSegments[0].pmScheduleId = pmScheduleId;
        log.info( "createNewWorkOrderFromResponse: Using pmScheduleId " +
                  newWorkOrder.workOrder.workOrderSegments[0].pmScheduleId );
    }

    // Null out the web ID and the internal ID
    newWorkOrder.workOrder.webId = null;
    newWorkOrder.workOrder.internalId = null;

    // Set the documentNumber to the one from the original new work order post
    newWorkOrder.workOrder.documentNumber = originalNewWorkOrderPost.workOrder.documentNumber;

    if ( args[1] == "true" ) {
        log.info( "createNewWorkOrderFromResponse: Changing new work order" );
        changeWorkOrder( newWorkOrder.workOrder );
    } else {
        log.info( "createNewWorkOrderFromResponse: Not changing new work order" );
    }

    // Save duplicated new work order inside JMeter var
    vars.put( "duplicateNewWorkOrder", JSON.stringify( newWorkOrder ) );
}

/**
 * Valid actions for this script.  JMeter passes
 * the action into this script via args[0]
 */
var VALID_ACTIONS = {
    "createNewPMWorkOrder" : createNewPMWorkOrder,
    "createNewWorkOrderFromEquipment" : createNewWorkOrderFromEquipment,
    "createNewWorkOrderFromPM" : createNewWorkOrderFromPM,
    "createNewWorkOrderFromResponse": createNewWorkOrderFromResponse,
    "createNewWorkOrderWithoutEquipment" : createNewWorkOrderWithoutEquipment,
    "changeExistingWorkOrder" : changeExistingWorkOrder,
    "changeWorkOrderStatus" : changeWorkOrderStatus,
    "deleteExistingWorkOrder" : deleteExistingWorkOrder,
    "signAndCloseWorkOrder" : signAndCloseWorkOrder
};

// The args array passed into this script from JMeter controls
// what this script will do.
// args[0] = action
// args[1..n] = optional parameters for action
var action = args[0];
VALID_ACTIONS[action]( args );

