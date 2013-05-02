/**
 * Test spec for util.js
 */
describe( "WorkOrder", function() {

    var numTestWorkOrders = 5;
    var testWorkOrders = [];
    var testWorkOrderIds = [];

    // Clear local storage before running any tests
    window.localStorage.clear();

    // Test customer
    var TEST_CUSTOMER = {
        webId:1,
        internalId:"1",
        name:"Test Customer",
        active:true,
        damageWaiver:true,
        language:"en",
        branchId:32,
        companyId:10,
        poNumberRequired:false,
        billToCustomerId:null,
        billToAddressId:39099,
        shipToCustomerId:1686905,
        shipToAddressId:1686897,
        paymentCustomerId:39120,
        paymentAddressId:39099,
        mainAddressId:1686897,
        mainContactId:null,
        chargeCode:288,
        priceCode:329,
        solvencyCode:10,
        discountCode:null,
        paymentProfile:null,
        invoiceGroup:0,
        currencyCode:"USD",
        contacts:
            [
            ],
        addresses:
            [
            ]
    };

    var TEST_EQUIPMENT = {
        webId: 1,
        internalId: "1",
        companyId: 10,
        branchId: 32,
        departmentId: 68,
        product: {
            webId: 872009,
            manufacturer: "TEST",
            productCode: "TEST EQUIPMENT"
        },
        equipmentGroup: null,
        description: "Test Equipment",
        serialNumber: "5489DA",
        addressId: 1673105,
        location: {
            lattitude: null,
            longitude: null
        },
        ownerId: 1,
        customerEquipmentId: null,
        equipmentStatus: 10,
        customerOwned: true,
        dealerEquipmentId: "999383135",
        hourMeter: 0,
        odometer: 0,
        modelYear: "2011",
        plateNumber: null,
        serviceInstructions: null,
        notes: null,
        metadata: {
        },
        warranty: null,
        nextPMStandardJobCodeId: null,
        nextPMDate: null,
        rentalCustomerId: null,
        rentalAddress: null
    };

    var TEST_XCODES = [
        {
            "webId": 1975862,
            "standardJobCodeManufacturerId": 5,
            "jobCode": "01",
            "completeJobCode": "X001",
            "timeFrequency": null,
            "timeFrequencyType": 0,
            "active": true,
            "counter": null,
            "counterFrequency": null,
            "counterType": 0,
            "description": "MISC",
            "notes": "See Detailed Description",
            "parentId": 1972844
        },
        {
            "webId": 1978353,
            "standardJobCodeManufacturerId": 5,
            "jobCode": "02",
            "completeJobCode": "X002",
            "timeFrequency": null,
            "timeFrequencyType": 0,
            "active": true,
            "counter": null,
            "counterFrequency": null,
            "counterType": 0,
            "description": "OPERATOR ERROR",
            "notes": "Operator Error",
            "parentId": 1972844
        },
        {
            "webId": 1976826,
            "standardJobCodeManufacturerId": 5,
            "jobCode": "03",
            "completeJobCode": "X003",
            "timeFrequency": null,
            "timeFrequencyType": 0,
            "active": true,
            "counter": null,
            "counterFrequency": null,
            "counterType": 0,
            "description": "SCHEDULED MAINTENANCE",
            "notes": "Scheduled Maintenance",
            "parentId": 1972844
        }
    ];

    beforeEach( function() {
        // Set up test work orders and save them into local storage
        var index;
        var newWorkOrder;
        JSONData.saveJSON( "customers", TEST_CUSTOMER, null );
        for ( index = 0; index < numTestWorkOrders; index++ ) {
            newWorkOrder = WorkOrder.createNewWorkOrder();
            newWorkOrder.documentNumber = "Test" + index;
            newWorkOrder.customerId = TEST_CUSTOMER.webId;
            testWorkOrders.push( newWorkOrder );
            testWorkOrderIds.push( newWorkOrder.webId );
            JSONData.saveJSON( "workOrders", newWorkOrder, true );
        }

        // Save test xcodes into local storage
        _.each( TEST_XCODES, function( xcodeInList ) {
            JSONData.saveJSON( "xcodes", xcodeInList, true );
        });

        // Create test logon
        TestUtil.createTestLogon();
    });

    afterEach( function() {
        TestUtil.removeTestData();
        testWorkOrders = [];
        testWorkOrderIds = [];
    });

    /**
     * Add changed flag to work order tests
     */
    it( "Add changed flag to work order tests", function () {
        var changedWorkOrder = Util.clone( testWorkOrders[0] );
        var workOrderLine;
        WorkOrder.addChangedFlagToWorkOrder( changedWorkOrder );
        expect( changedWorkOrder.changed ).toBeFalsy();
        // Flag not added if periodic update is not running
        workOrderLine = WorkOrder.createNewWorkOrderLine();
        workOrderLine.type = WorkOrder.WORK_ORDER_LINE_PART_TYPE;
        changedWorkOrder.workOrderSegments[0].workOrderLines.push( workOrderLine );
        WorkOrder.addChangedFlagToWorkOrder( changedWorkOrder );
        expect( changedWorkOrder.changed ).toBeFalsy();
        // Flag added if work order changed and periodic update is running
        window.localStorage.setItem( "periodicJSONFeedUpdateRunning", true );
        WorkOrder.addChangedFlagToWorkOrder( changedWorkOrder );
        expect( changedWorkOrder.changed ).toBeTruthy();
        window.localStorage.removeItem( "periodicJSONFeedUpdateRunning" );
        delete changedWorkOrder.changed;
        WorkOrder.addChangedFlagToWorkOrder( changedWorkOrder );
        expect( changedWorkOrder.changed ).toBeFalsy();
    } );

    /**
     * Add / get / remove xcode tests
     */
    it( "Add / get / remove xcode tests", function () {
        var lineCount;
        var workOrder;
        var xcodeBeingAdded;
        var xcodeInWorkOrder;

        // Missing / invalid parameters do nothing
        workOrder = Util.clone( testWorkOrders[1] );
        WorkOrder.addXcodeToWorkOrder();
        expect( WorkOrder.getXcodeLineFromWorkOrder() ).toBeNull();
        WorkOrder.addXcodeToWorkOrder( workOrder );
        expect( WorkOrder.getXcodeLineFromWorkOrder( workOrder ) ).toBeNull();
        WorkOrder.addXcodeToWorkOrder( workOrder, "INVALID" );
        expect( WorkOrder.getXcodeLineFromWorkOrder( workOrder ) ).toBeNull();

        // New work orders do not have an xcode
        expect( WorkOrder.getXcodeLineFromWorkOrder( workOrder ) ).toBeNull();

        // Add an xcode to a work order and verify
        xcodeBeingAdded = JSONData.getObjectById( "xcodes", 1978353, null );
        lineCount = workOrder.workOrderSegments[0].workOrderLines.length;
        WorkOrder.addXcodeToWorkOrder( workOrder, xcodeBeingAdded );
        xcodeInWorkOrder = WorkOrder.getXcodeLineFromWorkOrder( workOrder );
        expect( workOrder.workOrderSegments[0].workOrderLines.length ).toBe( lineCount + 1 );
        expect( xcodeInWorkOrder.description ).toBe( xcodeBeingAdded.description );
        expect( xcodeInWorkOrder.product ).toBeNull();
        expect( xcodeInWorkOrder.standardJobCodeId ).toBe( xcodeBeingAdded.webId );
        expect( xcodeInWorkOrder.type ).toBe( WorkOrder.WORK_ORDER_LINE_NOTE_TYPE );
        expect( _.isEqual( xcodeInWorkOrder.xcode, xcodeBeingAdded ) ).toBeTruthy();

        // Change an xcode in a work order and verify
        xcodeBeingAdded = JSONData.getObjectById( "xcodes", 1975862, null );
        lineCount = workOrder.workOrderSegments[0].workOrderLines.length;
        WorkOrder.addXcodeToWorkOrder( workOrder, xcodeBeingAdded );
        xcodeInWorkOrder = WorkOrder.getXcodeLineFromWorkOrder( workOrder );
        expect( workOrder.workOrderSegments[0].workOrderLines.length ).toBe( lineCount );
        expect( xcodeInWorkOrder.description ).toBe( xcodeBeingAdded.description );
        expect( xcodeInWorkOrder.product ).toBeNull();
        expect( xcodeInWorkOrder.standardJobCodeId ).toBe( xcodeBeingAdded.webId );
        expect( xcodeInWorkOrder.type ).toBe( WorkOrder.WORK_ORDER_LINE_NOTE_TYPE );
        expect( _.isEqual( xcodeInWorkOrder.xcode, xcodeBeingAdded ) ).toBeTruthy();

        // Remove the xcode from the work order
        WorkOrder.removeXcodeFromWorkOrder( workOrder );
        expect( workOrder.workOrderSegments[0].workOrderLines.length ).toBe( lineCount );
        expect( WorkOrder.getXcodeLineFromWorkOrder( workOrder ) ).toBeNull();

        // Adding an X code after a deletion should add a new line and not change the deleted line
        xcodeBeingAdded = JSONData.getObjectById( "xcodes", 1976826, null );
        lineCount = workOrder.workOrderSegments[0].workOrderLines.length;
        WorkOrder.addXcodeToWorkOrder( workOrder, xcodeBeingAdded );
        xcodeInWorkOrder = WorkOrder.getXcodeLineFromWorkOrder( workOrder );
        expect( workOrder.workOrderSegments[0].workOrderLines.length ).toBe( lineCount + 1 );
        expect( xcodeInWorkOrder.description ).toBe( xcodeBeingAdded.description );
        expect( xcodeInWorkOrder.product ).toBeNull();
        expect( xcodeInWorkOrder.standardJobCodeId ).toBe( xcodeBeingAdded.webId );
        expect( xcodeInWorkOrder.type ).toBe( WorkOrder.WORK_ORDER_LINE_NOTE_TYPE );
        expect( _.isEqual( xcodeInWorkOrder.xcode, xcodeBeingAdded ) ).toBeTruthy();
    });

    /**
     * Create new work order tests
     */
    it( "Create New Work Order Tests", function() {
        var index;
        var newWorkOrder = WorkOrder.createNewWorkOrder();
        // Verify header
        expect( _.isNumber( newWorkOrder.webId ) ).toBeTruthy();
        expect( _.isNumber( newWorkOrder.clientReference ) ).toBeTruthy();
        expect( newWorkOrder.internalId ).toBeNull();
        // Verify segment
        expect( newWorkOrder.workOrderSegments.length ).toBe( 1 );
        expect( _.isNumber( newWorkOrder.workOrderSegments[0].webId ) ).toBeTruthy();
        expect( _.isNumber( newWorkOrder.workOrderSegments[0].clientReference ) ).toBeTruthy();
        expect( newWorkOrder.workOrderSegments[0].internalId ).toBeNull();
        expect( newWorkOrder.workOrderSegments[0].partsOnly ).toBeFalsy();
        expect( newWorkOrder.workOrderSegments[0].workOrderLines.length ).toBe( 0 );
        // Add a line and verify it contents
        WorkOrder.addLineToWorkOrder( newWorkOrder, WorkOrder.createNewWorkOrderLine() );
        expect( newWorkOrder.workOrderSegments[0].workOrderLines.length ).toBe( 1 );
        expect( _.isNumber( newWorkOrder.workOrderSegments[0].workOrderLines[0].webId ) ).toBeTruthy();
        expect( _.isNumber( newWorkOrder.workOrderSegments[0].workOrderLines[0].clientReference ) ).toBeTruthy();
        expect( newWorkOrder.workOrderSegments[0].workOrderLines[0].internalId ).toBeNull();
        // Add 9 more lines to the work order segment and check its length
        for ( index = 0; index < 9; index++ ) {
            WorkOrder.addLineToWorkOrder( newWorkOrder, WorkOrder.createNewWorkOrderLine() );
        }
        expect( newWorkOrder.workOrderSegments[0].workOrderLines.length ).toBe( 10 );
    });

    /**
     * Display work order changed alert tests
     */
    it( "Display work order changed alert tests", function () {
        var complete1 = false;
        var complete2 = false;
        var complete3 = false;
        var complete4 = false;
        var workOrder = JSONData.getObjectById( "workOrders", testWorkOrderIds[1], null );

        // Invalid / missing parameters do nothing
        runs( function () {
            WorkOrder.displayWorkOrderChangedAlert( null, function() {
                complete1 = true;
            });
        } );
        waitsFor( function () {
            return complete1;
        }, "", 1000 );
        runs( function () {
            // Check async test result here
            expect( complete1 ).toBeTruthy();
        } );
        runs( function () {
            WorkOrder.displayWorkOrderChangedAlert( "INVALID", function() {
                complete2 = true;
            });
        } );
        waitsFor( function () {
            return complete2;
        }, "", 1000 );
        runs( function () {
            // Check async test result here
            expect( complete2 ).toBeTruthy();
        } );

        // Work order without changed flag does nothing
        runs( function () {
            WorkOrder.displayWorkOrderChangedAlert( workOrder, function() {
                complete3 = true;
            });
        } );
        waitsFor( function () {
            return complete3;
        }, "", 1000 );
        runs( function () {
            // Check async test result here
            expect( complete3 ).toBeTruthy();
        } );

        // Work order with changed flag set to false does nothing
        workOrder.changed = false;
        runs( function () {
            WorkOrder.displayWorkOrderChangedAlert( workOrder, function() {
                complete4 = true;
            });
        } );
        waitsFor( function () {
            return complete4;
        }, "", 1000 );
        runs( function () {
            // Check async test result here
            expect( complete4 ).toBeTruthy();
        } );

    } );

    /**
     * Set current work order tests
     */
    it( "Set / Remove Current Work Order Tests", function() {
        var currentWorkOrder;
        var expectedCurrentWorkOrderText;

        // Missing parameter throws exception
        expect( function() {
            WorkOrder.setCurrentWorkOrderId();
        }).toThrow( "WorkOrder.setCurrentWorkOrderId: Required parameter workOrderId is undefined" );
        // Set and verify the current work order
        expect( testWorkOrderIds[0] !== testWorkOrderIds[1] ).toBeTruthy();
        WorkOrder.setCurrentWorkOrderId( testWorkOrderIds[0] );
        expect( parseInt( WorkOrder.getCurrentWorkOrderId(), 10 ) ).toBe( testWorkOrderIds[0] );
        currentWorkOrder = WorkOrder.getCurrentWorkOrder();
        expect( currentWorkOrder.webId ).toBe( testWorkOrderIds[0] );
        expectedCurrentWorkOrderText = Localization.getText( "currentWorkOrder" ) + " " +
                                       TEST_CUSTOMER.name + " - " + currentWorkOrder.documentNumber;
        expect( window.localStorage.getItem( "currentWorkOrderStatus" ) ).toBe( expectedCurrentWorkOrderText );

        // Change and verify the current work order
        WorkOrder.setCurrentWorkOrderId( testWorkOrderIds[1] );
        expect( parseInt( WorkOrder.getCurrentWorkOrderId(), 10 ) ).toBe( testWorkOrderIds[1] );
        currentWorkOrder = WorkOrder.getCurrentWorkOrder();
        expect( currentWorkOrder.webId ).toBe( testWorkOrderIds[1] );
        expectedCurrentWorkOrderText = Localization.getText( "currentWorkOrder" ) + " " +
                                       TEST_CUSTOMER.name + " - " + currentWorkOrder.documentNumber;
        expect( window.localStorage.getItem( "currentWorkOrderStatus" ) ).toBe( expectedCurrentWorkOrderText );

        // Remove current work order and verify that it's gone
        WorkOrder.removeCurrentWorkOrderId();
        expect( WorkOrder.getCurrentWorkOrder() ).toBeNull();
        expect( WorkOrder.getCurrentWorkOrderId() ).toBeNull();
    });

    /**
     * Set manage work order activity tests
     */
    it( "Set / Remove Manage Work Order Activity Tests", function() {
        // Missing parameter does nothing
        WorkOrder.setManageWorkOrderActivity();
        expect( WorkOrder.getManageWorkOrderActivity() ).toBeFalsy();
        // Invalid activity does nothing
        WorkOrder.setManageWorkOrderActivity( "INVALID" );
        expect( WorkOrder.getManageWorkOrderActivity() ).toBeFalsy();
        // Set and verify the valid activities
        WorkOrder.setManageWorkOrderActivity( WorkOrder.MANAGE_WORK_ORDER_EDIT );
        expect( WorkOrder.getManageWorkOrderActivity() ).toBe( WorkOrder.MANAGE_WORK_ORDER_EDIT );
        WorkOrder.setManageWorkOrderActivity( WorkOrder.MANAGE_WORK_ORDER_OPEN );
        expect( WorkOrder.getManageWorkOrderActivity() ).toBe( WorkOrder.MANAGE_WORK_ORDER_OPEN );
        WorkOrder.setManageWorkOrderActivity( WorkOrder.MANAGE_WORK_ORDER_OPEN_NOCLOCKING );
        expect( WorkOrder.getManageWorkOrderActivity() ).toBe( WorkOrder.MANAGE_WORK_ORDER_OPEN_NOCLOCKING );
        WorkOrder.setManageWorkOrderActivity( WorkOrder.MANAGE_WORK_ORDER_VIEW );
        expect( WorkOrder.getManageWorkOrderActivity() ).toBe( WorkOrder.MANAGE_WORK_ORDER_VIEW );
        // Remove activity and verify that it's gone
        WorkOrder.removeManageWorkOrderActivity();
        expect( WorkOrder.getManageWorkOrderActivity() ).toBeFalsy();
    });

    /**
     * Set manage work order tests
     */
    it( "Set / Remove Manage Work Order Tests", function() {
        var workOrder;
        // Missing parameter throws exception
        expect( function() {
            WorkOrder.setManageWorkOrderId()
        }).toThrow( "WorkOrder.setManageWorkOrderId: Required parameter workOrderId is undefined" );
        // Get manage work order returns null if it's not set
        expect( WorkOrder.getManageWorkOrderId() ).toBeNull();
        expect( WorkOrder.getManageWorkOrder() ).toBeNull();
        // Set and verify the manage work order
        expect( testWorkOrderIds[0] !== testWorkOrderIds[1] ).toBeTruthy();
        WorkOrder.setManageWorkOrderId( testWorkOrderIds[0] );
        expect( parseInt( WorkOrder.getManageWorkOrderId(), 10 ) ).toBe( testWorkOrderIds[0] );
        workOrder = WorkOrder.getManageWorkOrder();
        expect( parseInt( workOrder.webId, 10 ) ).toBe( testWorkOrderIds[0] );
        // Change and verify the manage work order
        WorkOrder.setManageWorkOrderId( testWorkOrderIds[1] );
        expect( parseInt( WorkOrder.getManageWorkOrderId(), 10 ) ).toBe( testWorkOrderIds[1] );
        workOrder = WorkOrder.getManageWorkOrder();
        expect( parseInt( workOrder.webId, 10 ) ).toBe( testWorkOrderIds[1] );
        // Set and verify manage work order as writable
        expect( WorkOrder.isManageWorkOrderWritable() ).toBeFalsy();
        WorkOrder.setManageWorkOrderWritable( true );
        expect( WorkOrder.isManageWorkOrderWritable() ).toBeTruthy();
        WorkOrder.setManageWorkOrderWritable( false );
        expect( WorkOrder.isManageWorkOrderWritable() ).toBeFalsy();
        // Remove manage work order and verify that it's gone
        WorkOrder.removeManageWorkOrderId();
        expect( WorkOrder.getManageWorkOrderId() ).toBeNull();
        expect( WorkOrder.getManageWorkOrder() ).toBeNull();
    });

    /**
     * Set current work order on hold tests
     */
    it( "Set current work order on hold tests", function () {
        var workOrder;
        // Set the current work order first
        WorkOrder.setCurrentWorkOrderId( testWorkOrders[0].webId );
        // Set the current work order on hold and verfy the change
        WorkOrder.setCurrentWorkOrderOnHold();
        expect( WorkOrder.getCurrentWorkOrder() ).toBeNull();
        expect( WorkOrder.getCurrentWorkOrderId() ).toBeNull();
        workOrder = JSONData.getObjectById( "workOrders", testWorkOrders[0].webId );
        expect( WorkOrder.getWorkOrderStatus( workOrder ) ).toBe( WorkOrder.WORK_ORDER_STATUS_WAITING_ON_HOLD );
    } );

    /**
     * Get new local work order number tests
     */
    it( "Get New Local Work Order Number Tests", function() {
        // Create the expected date portion of the local work order number
        var today = new Date();
        var currentDate = today.getDate();
        var currentMonth = today.getMonth() + 1;
        var currentYear = String(today.getFullYear()).substring(2);
        var dateStr = ( currentDate < 10 ? "0" + currentDate : currentDate );
        var monthStr = ( currentMonth < 10 ? "0" + currentMonth : currentMonth );
        var datePortion = currentYear + monthStr + dateStr;

        // Local work order number should start at 1 and increment by 1 after each call
        expect( WorkOrder.getNewLocalWorkOrderNumber() ).toBe( datePortion + "001" );
        expect( WorkOrder.getNewLocalWorkOrderNumber() ).toBe( datePortion + "002" );
        expect( WorkOrder.getNewLocalWorkOrderNumber() ).toBe( datePortion + "003" );

        // Reseting should restart local work order number index back to 1
        WorkOrder.resetLocalWorkOrderNumberIndex();
        expect( WorkOrder.getNewLocalWorkOrderNumber() ).toBe( datePortion + "001" );
    });

    /**
     * Get new work order count tests
     */
    it( "Get new work order count tests", function () {
        // getNewWorkOrderCount can check work order array
        expect( WorkOrder.getNewWorkOrderCount( testWorkOrders ) ).toBe( testWorkOrders.length );
        // With parameter, getNewWorkOrderCount checks work orders in local storage
        expect( WorkOrder.getNewWorkOrderCount() ).toBe( numTestWorkOrders );
        // Change status of all work orders and verify new work order count
        _.each( testWorkOrders, function( workOrderInList ) {
            workOrderInList.workOrderSegments[0].webStatus = WorkOrder.WORK_ORDER_STATUS_IN_PROGRESS;
            JSONData.saveJSON( "workOrders", workOrderInList, true );
        });
        expect( WorkOrder.getNewWorkOrderCount() ).toBe( 0 );
    } );

    /**
     * Get split work orders tests
     * TODO: Modify this test when multiple work order segment support is merged into master
     */
    it( "Get split work orders tests", function () {
        var splitWorkOrder = Util.clone( testWorkOrders[0] );
        var splitWorkOrders;
        // Single segment work orders are not split
        splitWorkOrders = WorkOrder.getSplitWorkOrders( testWorkOrders[0] );
        expect( splitWorkOrders.length ).toBe( 0 );
        // Split work orders share the same webID without the suffix
        testWorkOrders[0].webId += "-1";
        JSONData.saveJSON( "workOrders", testWorkOrders[0], true );
        splitWorkOrder.webId += "-2";
        JSONData.saveJSON( "workOrders", splitWorkOrder, true );
        splitWorkOrders = WorkOrder.getSplitWorkOrders( testWorkOrders[0] );
        expect( splitWorkOrders.length ).toBe( 1 );
    } );

    /**
     * Get work order count for customer tests
     */
    it( "Get work order count for customer tests", function () {
        // getWorkOrderCountForCustomer can check a work order array
        expect( WorkOrder.getWorkOrderCountForCustomer( testWorkOrders, 0 ) ).toBe( 0 );
        expect( WorkOrder.getWorkOrderCountForCustomer( testWorkOrders, TEST_CUSTOMER.webId ) ).toBe( 5 );
        testWorkOrders[testWorkOrders.length - 1].customerId = 999999999;
        expect( WorkOrder.getWorkOrderCountForCustomer( testWorkOrders, TEST_CUSTOMER.webId ) ).toBe( 4 );
        // With array parm, getWorkOrderCountForCustomer checks local storage
        expect( WorkOrder.getWorkOrderCountForCustomer( null, TEST_CUSTOMER.webId ) ).toBe( 5 );
        expect( WorkOrder.getWorkOrderCountForCustomer( null, 999999999 ) ).toBe( 0 );
        // Completed and rejected work orders are not counted
        _.each( testWorkOrders, function( workOrderInList ) {
            if ( workOrderInList.customerId % 2 === 0 ) {
                workOrderInList.workOrderSegments[0].webStatus = WorkOrder.WORK_ORDER_STATUS_COMPLETED;
            } else {
                workOrderInList.workOrderSegments[0].webStatus = WorkOrder.WORK_ORDER_STATUS_REJECTED;
            }
        });
        _.each( testWorkOrders, function( workOrderInList ) {
            expect( WorkOrder.getWorkOrderCountForCustomer( testWorkOrders, workOrderInList.customerId ) ).toBe( 0 );
        });
    } );

    /**
     * Get work order count for equipment tests
     */
    it( "Get work order count for equipment tests", function () {
        // Set equipment IDs for each of the test work orders
        var index = 1;
        _.each( testWorkOrders, function( workOrderInList ) {
            workOrderInList.workOrderSegments[0].equipmentId = TEST_EQUIPMENT.webId;
            // Setting equipment to non null skips merging of equipment info from database
            workOrderInList.workOrderSegments[0].equipment = TEST_EQUIPMENT;
            JSONData.saveJSON( "workOrders", workOrderInList, true );
            index++;
        });
        // getWorkOrderCountForEquipment can check a work order array
        expect( WorkOrder.getWorkOrderCountForEquipment( testWorkOrders, 0 ) ).toBe( 0 );
        expect( WorkOrder.getWorkOrderCountForEquipment( testWorkOrders, TEST_EQUIPMENT.webId ) ).toBe( 5 );
        testWorkOrders[testWorkOrders.length - 1].workOrderSegments[0].equipmentId = 999999999;
        expect( WorkOrder.getWorkOrderCountForEquipment( testWorkOrders, TEST_EQUIPMENT.webId ) ).toBe( 4 );
        // With array parm, getWorkOrderCountForEquipment checks local storage
        expect( WorkOrder.getWorkOrderCountForEquipment( null, TEST_EQUIPMENT.webId ) ).toBe( 5 );
        expect( WorkOrder.getWorkOrderCountForEquipment( null, 999999999 ) ).toBe( 0 );
        // Completed and rejected work orders are not counted
        _.each( testWorkOrders, function( workOrderInList ) {
            if ( workOrderInList.equipmentId % 2 === 0 ) {
                workOrderInList.workOrderSegments[0].webStatus = WorkOrder.WORK_ORDER_STATUS_COMPLETED;
            } else {
                workOrderInList.workOrderSegments[0].webStatus = WorkOrder.WORK_ORDER_STATUS_REJECTED;
            }
        });
        _.each( testWorkOrders, function( workOrderInList ) {
            expect( WorkOrder.getWorkOrderCountForEquipment( testWorkOrders,
                                                             workOrderInList.workOrderSegments[0].equipmentId ) ).toBe( 0 );
        });
    } );

    /**
     * Get work orders requiring post to middle tier tests
     */
    it( "Get work orders requiring post to middle tier tests", function () {
        var index = 0;
        var numWorkOrdersNotNeedingPost = 0;
        // All new work orders require a post to the middle tier
        expect( WorkOrder.getWorkOrdersRequiringPostToMiddleTier().length ).toBe( testWorkOrders.length );
        // Change some work orders to not require a post and verify
        _.each( testWorkOrders, function( workOrderInList ) {
            if ( index % 2 === 0 ) {
                workOrderInList.postToMiddleTierRequired = false;
                JSONData.saveJSON( "workOrders", workOrderInList, true );
                numWorkOrdersNotNeedingPost++;
            }
            index++;
        });
        expect( WorkOrder.getWorkOrdersRequiringPostToMiddleTier().length ).toBe( testWorkOrders.length - numWorkOrdersNotNeedingPost );
    } );

    /**
     * Get work order segment count tests
     */
    it( "Get work order segment count tests", function () {
        expect( WorkOrder.getWorkOrderSegmentCount( testWorkOrders[0] ) ).toBe( 1 );
        testWorkOrders[0].workOrderSegments.push( WorkOrder.createNewWorkOrderSegment() );
        // Get segment count looks at header SEGMENT_COUNT property and not size of segments array
        expect( WorkOrder.getWorkOrderSegmentCount( testWorkOrders[0] ) ).toBe( 1 );
        testWorkOrders[0][WorkOrder.SEGMENT_COUNT] = 2;
        expect( WorkOrder.getWorkOrderSegmentCount( testWorkOrders[0] ) ).toBe( 2 );
    } );

    /**
     * Get work order status tests
     */
    it( "Get work order status tests", function () {
        // New work orders always use dispatched status
        _.each( testWorkOrders, function( workOrderInList ) {
            expect( WorkOrder.getWorkOrderStatus( workOrderInList ) ).toBe( WorkOrder.WORK_ORDER_STATUS_DISPATCHED );
        });
        // Change the status of a work order and verify
        testWorkOrders[0].workOrderSegments[0].webStatus = WorkOrder.WORK_ORDER_STATUS_IN_PROGRESS;
        expect( WorkOrder.getWorkOrderStatus( testWorkOrders[0] ) ).toBe( WorkOrder.WORK_ORDER_STATUS_IN_PROGRESS );
    } );

    /**
     * Get work order status icon tests
     */
    it( "Get work order status icon tests", function () {
        // New work orders always use dispatched status icon
        _.each( testWorkOrders, function( workOrderInList ) {
            var icon = WorkOrder.getWorkOrderStatusIcon( workOrderInList );
            expect( icon.indexOf( "dispatchedstatusicon.png") ).toBeGreaterThan( 0 );
        });
        // Change the status of a work order and verify
        testWorkOrders[0].workOrderSegments[0].webStatus = WorkOrder.WORK_ORDER_STATUS_IN_PROGRESS;
        expect( WorkOrder.getWorkOrderStatusIcon( testWorkOrders[0] ).indexOf( "inprogressstatusicon.png" ) ).toBeGreaterThan( 0 );
    } );

    /**
     * Get work order status text tests
     */
    it( "Get work order status text tests", function () {
        var expectedText = Localization.getText( "dispatchedStatus" );
        // New work orders always use dispatched status text
        _.each( testWorkOrders, function( workOrderInList ) {
            expect( WorkOrder.getWorkOrderStatusText( workOrderInList ) ).toBe( expectedText );
        });
        // Change the status of a work order and verify
        expectedText = Localization.getText( "waitingOnHoldStatus" );
        testWorkOrders[0].workOrderSegments[0].webStatus = WorkOrder.WORK_ORDER_STATUS_WAITING_ON_HOLD;
        expect( WorkOrder.getWorkOrderStatusText( testWorkOrders[0] ) ).toBe( expectedText );
    } );

    /**
     * Is billing folder verified tests
     */
    it( "Is billing folder verified tests", function () {
        // Default value is false
        expect( WorkOrder.isBillingFolderVerified() ).toBeFalsy();
        // Setting with non-boolean param leaves flag unchanged
        WorkOrder.setBillingFolderVerified( "TRUE" );
        expect( WorkOrder.isBillingFolderVerified() ).toBeFalsy();
        // Set to true and verify
        WorkOrder.setBillingFolderVerified( true );
        expect( WorkOrder.isBillingFolderVerified() ).toBeTruthy();
        // Set to true and verify
        WorkOrder.setBillingFolderVerified( false );
        expect( WorkOrder.isBillingFolderVerified() ).toBeFalsy();
    });

    /**
     * Is new work order tests
     */
    it( "Is new work order tests", function () {
        // All test work orders are initially new
        _.each( testWorkOrders, function( workOrderInList ) {
            expect( WorkOrder.isNewWorkOrder( workOrderInList ) ).toBeTruthy();
        });
        // Change the status of a work order and verify
        testWorkOrders[0].workOrderSegments[0].webStatus = WorkOrder.WORK_ORDER_STATUS_NOT_STARTED;
        expect( WorkOrder.isNewWorkOrder( testWorkOrders[0] ) ).toBeFalsy();
    } );

    /**
     * Is part on order tests
     */
    it( "Is part on order tests", function () {
        var partLine = WorkOrder.createNewWorkOrderLine();

        // Test invalid parameter handling
        expect( function() {
            WorkOrder.isPartOnOrder();
        }).toThrow( "WorkOrder.isPartOnOrder: Required parameter workOrder is undefined" );

        // Work order with no lines returns false
        expect( WorkOrder.isPartOnOrder( testWorkOrders[0] ) ).toBeFalsy();

        // Work order with part line whose qtyBackOrder = 0 returns false
        testWorkOrders[0].workOrderSegments[0].workOrderLines.push( partLine );
        expect( WorkOrder.isPartOnOrder( testWorkOrders[0] ) ).toBeFalsy();

        // Work order with part line whose qtyBackOrder > 0 returns false
        partLine.qtyBackOrder = 1;
        testWorkOrders[0].workOrderSegments[0].workOrderLines.push( partLine );
        expect( WorkOrder.isPartOnOrder( testWorkOrders[0] ) ).toBeTruthy();
    } );

    /**
     * Is PM work order tests
     */
    it( "Is PM work order tests", function () {
        // Make sure we have enough test work orders to run this test
        expect( numTestWorkOrders ).toBeGreaterThan( 2 );
        // All test work orders are initially not PM work orders
        _.each( testWorkOrders, function( workOrderInList ) {
            expect( WorkOrder.isPMWorkOrder( workOrderInList ) ).toBeFalsy();
        });

        // Test all 3 conditions that mark work order as a PM work order
        testWorkOrders[0].workOrderSegments[0].standardJobCode = {};
        testWorkOrders[0].workOrderSegments[0].standardJobCode.standardJobCodeManufacturerId = 1;
        expect( WorkOrder.isPMWorkOrder( testWorkOrders[0] ) ).toBeTruthy();
        testWorkOrders[1].workOrderSegments[0].folderId = WorkOrder.FMPM_FOLDER_ID;
        expect( WorkOrder.isPMWorkOrder( testWorkOrders[1] ) ).toBeTruthy();
        testWorkOrders[2].workOrderSegments[0].folderId = WorkOrder.PLANNED_MAINTENANCE_FOLDER_ID;
        expect( WorkOrder.isPMWorkOrder( testWorkOrders[2] ) ).toBeTruthy();
        testWorkOrders[3].workOrderSegments[0].folderId = WorkOrder.CUST_PAY_FOLDER_ID;
        testWorkOrders[3].documentNumber = "PM12345";
        expect( WorkOrder.isPMWorkOrder( testWorkOrders[2] ) ).toBeTruthy();
    } );

    /**
     * Is work order changed tests
     */
    it( "Is work order changed tests", function () {
        var changedWorkOrder = Util.clone( testWorkOrders[0] );
        var workOrderLine;
        expect( WorkOrder.isWorkOrderChanged( changedWorkOrder ) ).toBeFalsy();
        // Header changes don't trigger work order changed
        changedWorkOrder.contactName = "ContactNameChanged";
        changedWorkOrder.contactNumber = "614-555-1212";
        changedWorkOrder.documentReference = "PO_CHANGED";
        expect( WorkOrder.isWorkOrderChanged( changedWorkOrder ) ).toBeFalsy();
        // Segment changes don't trigger work order changed
        changedWorkOrder.workOrderSegments[0].notesTop             = "CHANGED";
        changedWorkOrder.workOrderSegments[0].notesBottom          = "CHANGED";
        changedWorkOrder.workOrderSegments[0].folderId             = WorkOrder.CUST_PAY_FOLDER_ID;
        changedWorkOrder.workOrderSegments[0].webStatus            = WorkOrder.WORK_ORDER_STATUS_WAITING_ON_HOLD;
        changedWorkOrder.workOrderSegments[0].equipmentId          = null;
        changedWorkOrder.workOrderSegments[0].standardJobCodeId    = null;
        changedWorkOrder.workOrderSegments[0].hourMeter            = 1234;
        changedWorkOrder.workOrderSegments[0].technicianSignature  = { webId : 123456789 };
        changedWorkOrder.workOrderSegments[0].customerSignature    = { webId : 123456789 };
        expect( WorkOrder.isWorkOrderChanged( changedWorkOrder ) ).toBeFalsy();
        // Part line count triggers work order changed
        workOrderLine = WorkOrder.createNewWorkOrderLine();
        workOrderLine.type = WorkOrder.WORK_ORDER_LINE_PART_TYPE;
        changedWorkOrder.workOrderSegments[0].workOrderLines.push( workOrderLine );
        expect( WorkOrder.isWorkOrderChanged( changedWorkOrder ) ).toBeTruthy();
        // Changing part line properties triggers work order changed
        changedWorkOrder = Util.clone( testWorkOrders[0] );
        changedWorkOrder.workOrderSegments[0].workOrderLines.push( workOrderLine );
        changedWorkOrder.workOrderSegments[0].equipmentId = TEST_EQUIPMENT.webId;
        changedWorkOrder.workOrderSegments[0].equipment = TEST_EQUIPMENT;
        JSONData.saveJSON( "workOrders", changedWorkOrder, true );
        expect( WorkOrder.isWorkOrderChanged( changedWorkOrder ) ).toBeFalsy();
        changedWorkOrder.workOrderSegments[0].workOrderLines[0].qtyOrdered = 10;
        expect( WorkOrder.isWorkOrderChanged( changedWorkOrder ) ).toBeTruthy();
        JSONData.saveJSON( "workOrders", changedWorkOrder, true );
        expect( WorkOrder.isWorkOrderChanged( changedWorkOrder ) ).toBeFalsy();
        changedWorkOrder.workOrderSegments[0].workOrderLines[0].inventoryId = 123456789;
        expect( WorkOrder.isWorkOrderChanged( changedWorkOrder ) ).toBeTruthy();
        JSONData.saveJSON( "workOrders", changedWorkOrder, true );
        expect( WorkOrder.isWorkOrderChanged( changedWorkOrder ) ).toBeFalsy();
        changedWorkOrder.workOrderSegments[0].workOrderLines[0].userId = 123456789;
        expect( WorkOrder.isWorkOrderChanged( changedWorkOrder ) ).toBeTruthy();
    } );

    /**
     * Is parts only work order tests
     */
    it( "Is parts only work order tests", function () {
        var workOrder = Util.clone( testWorkOrders[0] );
        // New work orders by default are not parts only
        expect( WorkOrder.isPartsOnlyWorkOrder( workOrder ) ).toBeFalsy();
        // Setting parts only property returns true
        workOrder.workOrderSegments[0].partsOnly = true;
        expect( WorkOrder.isPartsOnlyWorkOrder( workOrder ) ).toBeTruthy();
        // Absence of parts only property returns false
        delete workOrder.workOrderSegments[0].partsOnly;
        expect( WorkOrder.isPartsOnlyWorkOrder( workOrder ) ).toBeFalsy();
        // Setting notesTop to parts only work order returns true
        workOrder.workOrderSegments[0].notesTop = Localization.getText( "partsOnlyWorkOrder" );
        expect( WorkOrder.isPartsOnlyWorkOrder( workOrder ) ).toBeTruthy();
    });

    /**
     * Is work order signed by a customer tests
     */
    it( "Is work order signed by a customer tests", function () {
        // All test work orders are initially not signed
        _.each( testWorkOrders, function( workOrderInList ) {
            expect( WorkOrder.isWorkOrderSignedByCustomer( workOrderInList ) ).toBeFalsy();
        });
        // Adding a technicianSignature object to the work order marks it as signed
        testWorkOrders[0].workOrderSegments[0].customerSignature = {};
        expect( WorkOrder.isWorkOrderSignedByCustomer( testWorkOrders[0] ) ).toBeTruthy();
    } );

    /**
     * Is work order signed by a technician tests
     */
    it( "Is work order signed by a technician tests", function () {
        // All test work orders are initially not signed
        _.each( testWorkOrders, function( workOrderInList ) {
            expect( WorkOrder.isWorkOrderSignedByTechnician( workOrderInList ) ).toBeFalsy();
        });
        // Adding a technicianSignature object to the work order marks it as signed
        testWorkOrders[0].workOrderSegments[0].technicianSignature = {};
        expect( WorkOrder.isWorkOrderSignedByTechnician( testWorkOrders[0] ) ).toBeTruthy();
    } );

    /**
     * Populate new work order using dialog tests
     */
    it( "Populate new work order using dialog tests", function () {
        var newWorkOrder;
        var partsOnlyDescription = Localization.getText( "partsOnlyWorkOrder" );

        // Put a test version of the new work order dialog into the DOM
        var newWorkOrderDialog = new EJS({url: 'spec/testnewworkorderdialog'}).render({
        });
        $( "body" ).append( newWorkOrderDialog );

        // New work order - running from equipment
        $( "#orderType" ).val( '0' );
        $( "#segmentTitle" ).val( '0' );
        $( "#txtDescription" ).val( "New WO from Equipment" );
        $( "#partsOnly" ).prop( 'checked', false );
        newWorkOrder = WorkOrder.createNewWorkOrder();
        WorkOrder.populateNewWorkOrderFromDialog( newWorkOrder );
        expect( newWorkOrder.documentNumber.indexOf( "W" ) ).toBe( 0 );
        expect( newWorkOrder.workOrderSegments[0].segmentName ).toBe( Localization.getText( "optionRunning" ) );
        expect( newWorkOrder.workOrderSegments[0].folderId ).toBe( WorkOrder.CUST_PAY_FOLDER_ID );
        expect( newWorkOrder.workOrderSegments[0].notesTop ).toBe( "New WO from Equipment" );
        expect( newWorkOrder.workOrderSegments[0].partsOnly ).toBeFalsy();
        expect( newWorkOrder.workOrderSegments[0].webStatus ).toBe( WorkOrder.WORK_ORDER_STATUS_NOT_STARTED );

        // New parts only work order - running from equipment
        $( "#partsOnly" ).prop( 'checked', true );
        newWorkOrder = WorkOrder.createNewWorkOrder();
        WorkOrder.populateNewWorkOrderFromDialog( newWorkOrder );
        expect( newWorkOrder.documentNumber.indexOf( "W" ) ).toBe( 0 );
        expect( newWorkOrder.workOrderSegments[0].segmentName ).toBe( Localization.getText( "optionRunning" ) );
        expect( newWorkOrder.workOrderSegments[0].folderId ).toBe( WorkOrder.CUST_PAY_FOLDER_ID );
        expect( newWorkOrder.workOrderSegments[0].notesTop ).toBe( partsOnlyDescription );
        expect( newWorkOrder.workOrderSegments[0].partsOnly ).toBeTruthy();
        expect( newWorkOrder.workOrderSegments[0].webStatus ).toBe( WorkOrder.WORK_ORDER_STATUS_IN_PROGRESS );

        // New work order - down from equipment
        $( "#segmentTitle" ).val( '1' );
        $( "#partsOnly" ).prop( 'checked', false );
        $( "#txtDescription" ).val( "New WO from Equipment" );
        newWorkOrder = WorkOrder.createNewWorkOrder();
        WorkOrder.populateNewWorkOrderFromDialog( newWorkOrder );
        expect( newWorkOrder.documentNumber.indexOf( "W" ) ).toBe( 0 );
        expect( newWorkOrder.workOrderSegments[0].segmentName ).toBe( Localization.getText( "optionDown" ) );
        expect( newWorkOrder.workOrderSegments[0].folderId ).toBe( WorkOrder.CUST_PAY_FOLDER_ID );
        expect( newWorkOrder.workOrderSegments[0].notesTop ).toBe( "New WO from Equipment" );
        expect( newWorkOrder.workOrderSegments[0].partsOnly ).toBeFalsy();
        expect( newWorkOrder.workOrderSegments[0].webStatus ).toBe( WorkOrder.WORK_ORDER_STATUS_NOT_STARTED );

        // New parts only work order - down from equipment
        $( "#partsOnly" ).prop( 'checked', true );
        newWorkOrder = WorkOrder.createNewWorkOrder();
        WorkOrder.populateNewWorkOrderFromDialog( newWorkOrder );
        expect( newWorkOrder.documentNumber.indexOf( "W" ) ).toBe( 0 );
        expect( newWorkOrder.workOrderSegments[0].segmentName ).toBe( Localization.getText( "optionDown" ) );
        expect( newWorkOrder.workOrderSegments[0].folderId ).toBe( WorkOrder.CUST_PAY_FOLDER_ID );
        expect( newWorkOrder.workOrderSegments[0].notesTop ).toBe( partsOnlyDescription );
        expect( newWorkOrder.workOrderSegments[0].partsOnly ).toBeTruthy();
        expect( newWorkOrder.workOrderSegments[0].webStatus ).toBe( WorkOrder.WORK_ORDER_STATUS_IN_PROGRESS );

        // New PM work order
        $( "#orderType" ).val( '1' );
        $( "#partsOnly" ).prop( 'checked', false );
        newWorkOrder = WorkOrder.createNewWorkOrder();
        WorkOrder.populateNewWorkOrderFromDialog( newWorkOrder );
        expect( newWorkOrder.documentNumber.indexOf( "PM" ) ).toBe( 0 );
        expect( newWorkOrder.workOrderSegments[0].segmentName ).toBe( "" );
        expect( newWorkOrder.workOrderSegments[0].folderId ).toBe( WorkOrder.PLANNED_MAINTENANCE_FOLDER_ID );
        expect( newWorkOrder.workOrderSegments[0].notesTop ).toBe( Localization.getText( "plannedMaintenance" ) );
        expect( newWorkOrder.workOrderSegments[0].partsOnly ).toBeFalsy();
        expect( newWorkOrder.workOrderSegments[0].webStatus ).toBe( WorkOrder.WORK_ORDER_STATUS_NOT_STARTED );

        // New parts only PM work order - PM work order cannot be parts only, check box is ignored
        $( "#partsOnly" ).prop( 'checked', true );
        newWorkOrder = WorkOrder.createNewWorkOrder();
        WorkOrder.populateNewWorkOrderFromDialog( newWorkOrder );
        expect( newWorkOrder.documentNumber.indexOf( "PM" ) ).toBe( 0 );
        expect( newWorkOrder.workOrderSegments[0].segmentName ).toBe( "" );
        expect( newWorkOrder.workOrderSegments[0].folderId ).toBe( WorkOrder.PLANNED_MAINTENANCE_FOLDER_ID );
        expect( newWorkOrder.workOrderSegments[0].notesTop ).toBe( Localization.getText( "plannedMaintenance" ) );
        expect( newWorkOrder.workOrderSegments[0].partsOnly ).toBeFalsy();
        expect( newWorkOrder.workOrderSegments[0].webStatus ).toBe( WorkOrder.WORK_ORDER_STATUS_NOT_STARTED );

        // New FMPM work order
        $( "#orderType" ).val( '2' );
        $( "#partsOnly" ).prop( 'checked', false );
        newWorkOrder = WorkOrder.createNewWorkOrder();
        WorkOrder.populateNewWorkOrderFromDialog( newWorkOrder );
        expect( newWorkOrder.documentNumber.indexOf( "PM" ) ).toBe( 0 );
        expect( newWorkOrder.workOrderSegments[0].segmentName ).toBe( "" );
        expect( newWorkOrder.workOrderSegments[0].folderId ).toBe( WorkOrder.FMPM_FOLDER_ID );
        expect( newWorkOrder.workOrderSegments[0].notesTop ).toBe( Localization.getText( "fullMaintenancePM" ) );
        expect( newWorkOrder.workOrderSegments[0].partsOnly ).toBeFalsy();
        expect( newWorkOrder.workOrderSegments[0].webStatus ).toBe( WorkOrder.WORK_ORDER_STATUS_NOT_STARTED );

        // New parts only FMPM work order - FMPM work order cannot be parts only, check box is ignored
        $( "#partsOnly" ).prop( 'checked', true );
        newWorkOrder = WorkOrder.createNewWorkOrder();
        WorkOrder.populateNewWorkOrderFromDialog( newWorkOrder );
        expect( newWorkOrder.documentNumber.indexOf( "PM" ) ).toBe( 0 );
        expect( newWorkOrder.workOrderSegments[0].segmentName ).toBe( "" );
        expect( newWorkOrder.workOrderSegments[0].folderId ).toBe( WorkOrder.FMPM_FOLDER_ID );
        expect( newWorkOrder.workOrderSegments[0].notesTop ).toBe( Localization.getText( "fullMaintenancePM" ) );
        expect( newWorkOrder.workOrderSegments[0].partsOnly ).toBeFalsy();
        expect( newWorkOrder.workOrderSegments[0].webStatus ).toBe( WorkOrder.WORK_ORDER_STATUS_NOT_STARTED );

        // New FW running work order
        $( "#orderType" ).val( '3' );
        $( "#segmentTitle" ).val( '0' );
        $( "#txtDescription" ).val( "New FW from Equipment" );
        $( "#partsOnly" ).prop( 'checked', false );
        newWorkOrder = WorkOrder.createNewWorkOrder();
        WorkOrder.populateNewWorkOrderFromDialog( newWorkOrder );
        expect( newWorkOrder.documentNumber.indexOf( "FW" ) ).toBe( 0 );
        expect( newWorkOrder.workOrderSegments[0].segmentName ).toBe( Localization.getText( "optionRunning" ) );
        expect( newWorkOrder.workOrderSegments[0].folderId ).toBe( WorkOrder.FW_FOLDER_ID );
        expect( newWorkOrder.workOrderSegments[0].notesTop ).toBe( "New FW from Equipment" );
        expect( newWorkOrder.workOrderSegments[0].partsOnly ).toBeFalsy();
        expect( newWorkOrder.workOrderSegments[0].webStatus ).toBe( WorkOrder.WORK_ORDER_STATUS_NOT_STARTED );

        // New parts only FW running work order
        $( "#partsOnly" ).prop( 'checked', true );
        newWorkOrder = WorkOrder.createNewWorkOrder();
        WorkOrder.populateNewWorkOrderFromDialog( newWorkOrder );
        expect( newWorkOrder.documentNumber.indexOf( "FW" ) ).toBe( 0 );
        expect( newWorkOrder.workOrderSegments[0].segmentName ).toBe( Localization.getText( "optionRunning" ) );
        expect( newWorkOrder.workOrderSegments[0].folderId ).toBe( WorkOrder.FW_FOLDER_ID );
        expect( newWorkOrder.workOrderSegments[0].notesTop ).toBe( partsOnlyDescription );
        expect( newWorkOrder.workOrderSegments[0].partsOnly ).toBeTruthy();
        expect( newWorkOrder.workOrderSegments[0].webStatus ).toBe( WorkOrder.WORK_ORDER_STATUS_IN_PROGRESS );

        // New FW down work order
        $( "#segmentTitle" ).val( '1' );
        $( "#partsOnly" ).prop( 'checked', false );
        newWorkOrder = WorkOrder.createNewWorkOrder();
        WorkOrder.populateNewWorkOrderFromDialog( newWorkOrder );
        expect( newWorkOrder.documentNumber.indexOf( "FW" ) ).toBe( 0 );
        expect( newWorkOrder.workOrderSegments[0].segmentName ).toBe( Localization.getText( "optionDown" ) );
        expect( newWorkOrder.workOrderSegments[0].folderId ).toBe( WorkOrder.FW_FOLDER_ID );
        expect( newWorkOrder.workOrderSegments[0].notesTop ).toBe( "New FW from Equipment" );
        expect( newWorkOrder.workOrderSegments[0].partsOnly ).toBeFalsy();
        expect( newWorkOrder.workOrderSegments[0].webStatus ).toBe( WorkOrder.WORK_ORDER_STATUS_NOT_STARTED );

        // New parts only FW down work order
        $( "#partsOnly" ).prop( 'checked', true );
        newWorkOrder = WorkOrder.createNewWorkOrder();
        WorkOrder.populateNewWorkOrderFromDialog( newWorkOrder );
        expect( newWorkOrder.documentNumber.indexOf( "FW" ) ).toBe( 0 );
        expect( newWorkOrder.workOrderSegments[0].segmentName ).toBe( Localization.getText( "optionDown" ) );
        expect( newWorkOrder.workOrderSegments[0].folderId ).toBe( WorkOrder.FW_FOLDER_ID );
        expect( newWorkOrder.workOrderSegments[0].notesTop ).toBe( partsOnlyDescription );
        expect( newWorkOrder.workOrderSegments[0].partsOnly ).toBeTruthy();
        expect( newWorkOrder.workOrderSegments[0].webStatus ).toBe( WorkOrder.WORK_ORDER_STATUS_IN_PROGRESS );

        // New empty work order - running
        $( "#orderType" ).val( '4' );
        $( "#segmentTitle" ).val( '0' );
        $( "#txtDescription" ).val( "New Empty WO" );
        $( "#partsOnly" ).prop( 'checked', false );
        newWorkOrder = WorkOrder.createNewWorkOrder();
        WorkOrder.populateNewWorkOrderFromDialog( newWorkOrder );
        expect( newWorkOrder.documentNumber.indexOf( "W" ) ).toBe( 0 );
        expect( newWorkOrder.workOrderSegments[0].segmentName ).toBe( Localization.getText( "optionRunning" ) );
        expect( newWorkOrder.workOrderSegments[0].folderId ).toBe( WorkOrder.CUST_PAY_FOLDER_ID );
        expect( newWorkOrder.workOrderSegments[0].notesTop ).toBe( "New Empty WO" );
        expect( newWorkOrder.workOrderSegments[0].partsOnly ).toBeFalsy();
        expect( newWorkOrder.workOrderSegments[0].webStatus ).toBe( WorkOrder.WORK_ORDER_STATUS_NOT_STARTED );

        // New parts only empty work order - running
        $( "#partsOnly" ).prop( 'checked', true );
        newWorkOrder = WorkOrder.createNewWorkOrder();
        WorkOrder.populateNewWorkOrderFromDialog( newWorkOrder );
        expect( newWorkOrder.documentNumber.indexOf( "W" ) ).toBe( 0 );
        expect( newWorkOrder.workOrderSegments[0].segmentName ).toBe( Localization.getText( "optionRunning" ) );
        expect( newWorkOrder.workOrderSegments[0].folderId ).toBe( WorkOrder.CUST_PAY_FOLDER_ID );
        expect( newWorkOrder.workOrderSegments[0].notesTop ).toBe( partsOnlyDescription );
        expect( newWorkOrder.workOrderSegments[0].partsOnly ).toBeTruthy();
        expect( newWorkOrder.workOrderSegments[0].webStatus ).toBe( WorkOrder.WORK_ORDER_STATUS_IN_PROGRESS );

        // New empty work order - down
        $( "#segmentTitle" ).val( '1' );
        $( "#partsOnly" ).prop( 'checked', false );
        $( "#txtDescription" ).val( "New Empty WO" );
        newWorkOrder = WorkOrder.createNewWorkOrder();
        WorkOrder.populateNewWorkOrderFromDialog( newWorkOrder );
        expect( newWorkOrder.documentNumber.indexOf( "W" ) ).toBe( 0 );
        expect( newWorkOrder.workOrderSegments[0].segmentName ).toBe( Localization.getText( "optionDown" ) );
        expect( newWorkOrder.workOrderSegments[0].folderId ).toBe( WorkOrder.CUST_PAY_FOLDER_ID );
        expect( newWorkOrder.workOrderSegments[0].notesTop ).toBe( "New Empty WO" );
        expect( newWorkOrder.workOrderSegments[0].partsOnly ).toBeFalsy();
        expect( newWorkOrder.workOrderSegments[0].webStatus ).toBe( WorkOrder.WORK_ORDER_STATUS_NOT_STARTED );

        // New parts only empty work order - down
        $( "#partsOnly" ).prop( 'checked', true );
        newWorkOrder = WorkOrder.createNewWorkOrder();
        WorkOrder.populateNewWorkOrderFromDialog( newWorkOrder );
        expect( newWorkOrder.documentNumber.indexOf( "W" ) ).toBe( 0 );
        expect( newWorkOrder.workOrderSegments[0].segmentName ).toBe( Localization.getText( "optionDown" ) );
        expect( newWorkOrder.workOrderSegments[0].folderId ).toBe( WorkOrder.CUST_PAY_FOLDER_ID );
        expect( newWorkOrder.workOrderSegments[0].notesTop ).toBe( partsOnlyDescription );
        expect( newWorkOrder.workOrderSegments[0].partsOnly ).toBeTruthy();
        expect( newWorkOrder.workOrderSegments[0].webStatus ).toBe( WorkOrder.WORK_ORDER_STATUS_IN_PROGRESS );

        $( "#testNewWorkOrderDialog" ).remove();
    });
    
    /**
     * Remove deleted lines from work order tests
     */
    it( "Remove deleted lines from work order tests", function () {
        var index;
        var numLinesMarkedForDeletion = 0;
        var numTestLines = 10;
        var testLines = [];
        for ( index = 0; index < numTestLines; index++ ) {
            testLines.push( WorkOrder.createNewWorkOrderLine() );
        }
        // Work order with no lines marked for deletion does not change
        testWorkOrders[0].workOrderSegments[0].workOrderLines = testLines;
        WorkOrder.removeDeletedLinesFromWorkOrder( testWorkOrders[0] );
        expect( testWorkOrders[0].workOrderSegments[0].workOrderLines.length ).toBe( numTestLines );
        // Lines are not removed if work order requires post to the middle tier
        for ( index = 0; index < numTestLines; index++ ) {
            if ( index % 2 === 0 ) {
                testWorkOrders[0].workOrderSegments[0].workOrderLines[index].deleted = true;
                numLinesMarkedForDeletion++;
            }
        }
        testWorkOrders[0].postToMiddleTierRequired = true;
        WorkOrder.removeDeletedLinesFromWorkOrder( testWorkOrders[0] );
        expect( testWorkOrders[0].workOrderSegments[0].workOrderLines.length ).toBe( numTestLines );
        // Lines are removed if post to middle tier is not required
        testWorkOrders[0].postToMiddleTierRequired = false;
        WorkOrder.removeDeletedLinesFromWorkOrder( testWorkOrders[0] );
        expect( testWorkOrders[0].workOrderSegments[0].workOrderLines.length ).toBe( numTestLines - numLinesMarkedForDeletion );
    } );

    /**
     * Delete work orders after JSON feed update tests
     * NOTE: This test must run last to avoid interference with other tests
     */
    it( "Delete work orders after JSON feed update tests", function () {
        var clocking;
        var delayComplete = false;
        var startTime;
        var webId;
        var workOrder;
        var workOrderCount = JSONData.getObjectsByDataType( "workOrders" ).length;

        // Give other tests impacted by isPeriodicJSONFeedUpdateRunning() a chance
        // to finish before running these tests.
        runs( function () {
            setTimeout( function() {
                delayComplete = true;
            }, 1000 );
        } );
        waitsFor( function () {
            return delayComplete;
        }, "", 2000 );
        runs( function () {
            // Check supporting function first
            webId = testWorkOrderIds[0];
            expect( WorkOrder.checkAndMarkWorkOrderForDeletion() ).toBeFalsy();
            expect( WorkOrder.checkAndMarkWorkOrderForDeletion( "INVALID" ) ).toBeFalsy();
            workOrder = JSONData.getObjectById( "workOrders", webId, null );
            expect( WorkOrder.checkAndMarkWorkOrderForDeletion( workOrder ) ).toBeFalsy();
            workOrder = JSONData.getObjectById( "workOrders", webId, null );
            expect( workOrder.deleteWorkOrder ).toBeFalsy();

            // All new work orders remain and navigation to work order list page is not required.
            expect( WorkOrder.deleteWorkOrdersAfterJSONFeedUpdate() ).toBeFalsy();
            expect( JSONData.getObjectsByDataType( "workOrders" ).length ).toBe( workOrderCount );

            // Work order with deleted property is not deleted if period JSON feed update is not running.
            webId = testWorkOrderIds[0];
            workOrder = JSONData.getObjectById( "workOrders", webId, null );
            workOrder.deleted = true;
            window.localStorage.setItem( "workOrders." + webId, JSON.stringify( workOrder ) );
            window.localStorage.removeItem( JSONData.LS_PERIODIC_JSON_FEED_UPDATE_RUNNING );
            expect( WorkOrder.checkAndMarkWorkOrderForDeletion( workOrder ) ).toBeFalsy();
            expect( WorkOrder.deleteWorkOrdersAfterJSONFeedUpdate() ).toBeFalsy();
            expect( JSONData.getObjectsByDataType( "workOrders" ).length ).toBe( workOrderCount );

            // Work order with deleted property is deleted.  Navigation
            // to work order list page not required
            webId = testWorkOrderIds[0];
            window.localStorage.setItem( JSONData.LS_PERIODIC_JSON_FEED_UPDATE_RUNNING, true );
            workOrder = JSONData.getObjectById( "workOrders", webId, null );
            workOrder.deleted = true;
            window.localStorage.setItem( "workOrders." + webId, JSON.stringify( workOrder ) );
            expect( WorkOrder.checkAndMarkWorkOrderForDeletion( workOrder ) ).toBeTruthy();
            expect( WorkOrder.deleteWorkOrdersAfterJSONFeedUpdate() ).toBeFalsy();
            expect( JSONData.getObjectsByDataType( "workOrders" ).length ).toBe( workOrderCount - 1 );

            // Work order with deleted property inside its segment is deleted.  Navigation
            // to work order list page not required because current page is not a manage work order page
            webId = testWorkOrderIds[1];
            window.localStorage.setItem( JSONData.LS_PERIODIC_JSON_FEED_UPDATE_RUNNING, true );
            $( "body" ).append( "<div id='specRunnerPage' data-role='page' style='display:none;'></div>" );
            workOrderCount = JSONData.getObjectsByDataType( "workOrders" ).length;
            WorkOrder.setManageWorkOrderId( webId );
            workOrder = JSONData.getObjectById( "workOrders", webId, null );
            workOrder.workOrderSegments[0].deleted = true;
            window.localStorage.setItem( "workOrders." + webId, JSON.stringify( workOrder ) );
            expect( WorkOrder.checkAndMarkWorkOrderForDeletion( workOrder ) ).toBeTruthy();
            expect( WorkOrder.deleteWorkOrdersAfterJSONFeedUpdate() ).toBeFalsy();
            expect( JSONData.getObjectsByDataType( "workOrders" ).length ).toBe( workOrderCount - 1 );

            // Work order with completed web status is deleted.  Navigation to
            // work order list page is requred because deleted work order is also the manage work order
            webId = testWorkOrderIds[2];
            window.localStorage.setItem( JSONData.LS_PERIODIC_JSON_FEED_UPDATE_RUNNING, true );
            $("div[data-role='page']" ).attr( "id", "manageWorkOrderOverview" );
            workOrderCount = JSONData.getObjectsByDataType( "workOrders" ).length;
            WorkOrder.setManageWorkOrderId( webId );
            workOrder = JSONData.getObjectById( "workOrders", webId, null );
            workOrder.workOrderSegments[0].webStatus = WorkOrder.WORK_ORDER_STATUS_COMPLETED;
            window.localStorage.setItem( "workOrders." + webId, JSON.stringify( workOrder ) );
            expect( WorkOrder.checkAndMarkWorkOrderForDeletion( workOrder ) ).toBeTruthy();
            expect( WorkOrder.deleteWorkOrdersAfterJSONFeedUpdate() ).toBeTruthy();
            expect( JSONData.getObjectsByDataType( "workOrders" ).length ).toBe( workOrderCount - 1 );
            expect( WorkOrder.getManageWorkOrder() ).toBeFalsy();

            // Work order with rejected / reassigned web status is deleted.  Navigation to
            // work order list page is required because deleted work order is the current work order
            webId = testWorkOrderIds[3];
            workOrderCount = JSONData.getObjectsByDataType( "workOrders" ).length;
            JSONData.setWorkOrderIdForClockingChange( webId );
            // Move productive clocking start time 5 minutes back from current time to ensure
            // that it gets saved (clockings < 1 minute long are discarded)
            startTime = new Date( new Date().getTime() - 300000 );
            Clocking.recordTime( "technicianStatusProductive", startTime.toISOString() );
            WorkOrder.setCurrentWorkOrderId( webId );
            workOrder = JSONData.getObjectById( "workOrders", webId, null );
            workOrder.workOrderSegments[0].webStatus = WorkOrder.WORK_ORDER_STATUS_REJECTED;
            window.localStorage.setItem( "workOrders." + webId, JSON.stringify( workOrder ) );
            window.localStorage.setItem( JSONData.LS_PERIODIC_JSON_FEED_UPDATE_RUNNING, true );
            expect( WorkOrder.checkAndMarkWorkOrderForDeletion( workOrder ) ).toBeTruthy();
            expect( WorkOrder.deleteWorkOrdersAfterJSONFeedUpdate() ).toBeTruthy();
            expect( JSONData.getObjectsByDataType( "workOrders" ).length ).toBe( workOrderCount - 1 );
            expect( WorkOrder.getCurrentWorkOrderId() ).toBeFalsy();
            clocking = JSONData.getOpenTimeEntry();
            expect( clocking.technicianStatus ).toBe( JSONData.TECHNICIAN_STATUS_LOGGED_IN_OUT );
            clocking = _.find( JSONData.getObjectsByDataType( "technicianClocking" ), function( clockingInList ) {
                return clockingInList.technicianStatus == JSONData.TECHNICIAN_STATUS_PRODUCTIVE &&
                    clockingInList.timeEnd;
            });
            expect( _.isObject( clocking ) ).toBeTruthy();
            expect( clocking.workOrderHeaderId ).toBe( webId );
            expect( window.localStorage.getItem( "currentWorkOrderDeleted" ) ).toBe( "Test3" );

            // Remove the test div with the page ID
            $( "div#manageWorkOrderOverview" ).remove();

            // Remove the JSON feed running flag
            window.localStorage.removeItem( JSONData.LS_PERIODIC_JSON_FEED_UPDATE_RUNNING );
        } );
    } );
} );

