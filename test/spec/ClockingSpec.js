/**
 * Test spec for Clocking
 */
describe( "Clocking", function () {
    var numTestWorkOrders = 5;
    var testWorkOrders = [];
    var testWorkOrderIds = [];

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

    /**
     * Test prep
     */
    beforeEach( function() {
        // Set up test work orders and save them into local storage
        var index;
        var newWorkOrder;
        JSONData.saveJSON( "customers", TEST_CUSTOMER, null );
        for ( index = 0; index < numTestWorkOrders; index++ ) {
            newWorkOrder = WorkOrder.createNewWorkOrder();
            newWorkOrder.customerId = TEST_CUSTOMER.webId;
            testWorkOrders.push( newWorkOrder );
            testWorkOrderIds.push( newWorkOrder.webId );
            JSONData.saveJSON( "workOrders", newWorkOrder, true );
        }
        TestUtil.createTestLogon();
    });

    /**
     * After test clean up
     */
    afterEach( function() {
        TestUtil.removeTestData();
        testWorkOrders = [];
        testWorkOrderIds = [];
    });

    /**
     * Get latest closed clocking tests
     */
    it( "Get latest closed clocking tests", function () {
        var closedClocking;
        var startTime1 = "2013-04-25T08:00:00.000Z";
        var startTime2 = "2013-04-25T08:05:00.000Z";
        var startTime3 = "2013-04-25T08:10:00.000Z";
        var startTime4 = "2013-04-25T08:15:00.000Z";

        // No clockings returns null
        expect( Clocking.getLatestClosedClocking() ).toBeNull();

        // No closed clockings returns null
        Clocking.recordTime( "technicianStatusPaperwork", startTime1 );
        expect( Clocking.getLatestClosedClocking() ).toBeNull();

        // Closed non productive is returned
        Clocking.recordTime( "technicianStatusNoPay", startTime2 );
        closedClocking = Clocking.getLatestClosedClocking();
        expect( _.isObject( closedClocking ) ).toBeTruthy();
        expect( closedClocking.timeStart ).toBe( startTime1 );
        expect( closedClocking.timeEnd ).toBe( startTime2 );
        expect( closedClocking.technicianStatus ).toBe( JSONData.TECHNICIAN_STATUS_NON_PRODUCTIVE );
        expect( closedClocking.laborCodeId ).toBe( JSONData.LABOR_CODE_ID_PAPERWORK );

        // Add two clockings, productive is latest closed one
        JSONData.setWorkOrderIdForClockingChange( testWorkOrderIds[0] );
        Clocking.recordTime( "technicianStatusProductive", startTime3 );
        JSONData.setWorkOrderIdForClockingChange( testWorkOrderIds[1] );
        Clocking.recordTime( "technicianStatusTraveling", startTime4 );
        closedClocking = Clocking.getLatestClosedClocking();
        expect( _.isObject( closedClocking ) ).toBeTruthy();
        expect( closedClocking.timeStart ).toBe( startTime3 );
        expect( closedClocking.timeEnd ).toBe( startTime4 );
        expect( closedClocking.technicianStatus ).toBe( JSONData.TECHNICIAN_STATUS_PRODUCTIVE );
        expect( closedClocking.laborCodeId ).toBe( 3 );
    } );

    /**
     * Record time tests
     */
    it( "Record time tests", function () {
        var clockings;
        var endTime;
        var expectedCurrentTechStatusText;
        var latestClosedClocking;
        var lunchStartTime;
        var openTimeEntry;
        var startTime = Util.setSecondsAndMillisecondsToZero( new Date().toISOString() );

        var startTime1 = new Date( new Date().getTime() - ( 30 * 60 * 1000 ) ).toISOString();
        var startTime2 = new Date( new Date().getTime() - ( 25 * 60 * 1000 ) ).toISOString();

        // Test handling of invalid parameters
        expect( function() {
            Clocking.recordTime();
        }).toThrow( "Clocking.recordTime: Required parameter clockingStatus is undefined" );
        expect( function() {
            Clocking.recordTime( "bogusClockingStatus" );
        }).toThrow( "Clocking.recordTime: Required parameter clockingStatus is invalid" );

        // Record valid unproductive clockings and verify
        Clocking.recordTime( "technicianStatusNoPay", null );
        expect( JSONData.getCurrentClockingStatus( null ) ).toBe( "technicianStatusNoPay" );
        expectedCurrentTechStatusText = JSONData.getTechnicianName() + " - " +
            Localization.getText( "technicianStatusNoPay" ) + " - " +
            Localization.formatDateTime( JSONData.getOpenTimeEntry().timeStart, "f" );
        expect( window.localStorage.getItem( "currentTechnicianStatus" ) ).toBe( expectedCurrentTechStatusText );

        TestUtil.removeAllClockings();
        Clocking.recordTime( "technicianStatusPaperwork", startTime );
        expect( JSONData.getCurrentClockingStatus( null ) ).toBe( "technicianStatusPaperwork" );
        expect( JSONData.getCurrentClockingStartTime( null ) ).toBe( startTime );
        expectedCurrentTechStatusText = JSONData.getTechnicianName() + " - " +
            Localization.getText( "technicianStatusPaperwork" ) + " - " +
            Localization.formatDateTime( JSONData.getOpenTimeEntry().timeStart, "f" );
        expect( window.localStorage.getItem( "currentTechnicianStatus" ) ).toBe( expectedCurrentTechStatusText );

        // Verify that productive clocking contains work order information
        TestUtil.removeAllClockings();
        JSONData.setWorkOrderIdForClockingChange( testWorkOrders[1].webId );
        Clocking.recordTime( "technicianStatusProductive", startTime );
        expect( JSONData.getCurrentClockingStatus( null ) ).toBe( "technicianStatusProductive" );
        expect( JSONData.getCurrentClockingStartTime( null ) ).toBe( startTime );
        expectedCurrentTechStatusText = JSONData.getTechnicianName() + " - " +
            Localization.getText( "technicianStatusProductive" ) + " - " +
            Localization.formatDateTime( JSONData.getOpenTimeEntry().timeStart, "f" );
        expect( window.localStorage.getItem( "currentTechnicianStatus" ) ).toBe( expectedCurrentTechStatusText );
        openTimeEntry = JSONData.getOpenTimeEntry();
        expect( openTimeEntry.workOrderHeaderId ).toBe( testWorkOrders[1].webId );
        expect( openTimeEntry.workOrderSegmentId ).toBe( testWorkOrders[1].workOrderSegments[0].webId );
        expect( openTimeEntry.workOrderSegmentClientReference ).toBe( testWorkOrders[1].workOrderSegments[0].clientReference );

        // Verify that starting lunch fills gap correctly
        TestUtil.removeAllClockings();
        Clocking.recordTime( "technicianStatusTraining", startTime1 );
        JSONData.closeOpenTimeEntry( startTime2 );
        lunchStartTime = new Date( new Date().getTime() - ( 5 * 60 * 1000 ) ).toISOString();
        Clocking.recordTime( "technicianStatusLunch", lunchStartTime );
        openTimeEntry = JSONData.getOpenTimeEntry();
        latestClosedClocking = Clocking.getLatestClosedClocking();
        expect( _.isObject( latestClosedClocking ) ).toBeTruthy();
        expect( latestClosedClocking.timeStart ).toBe( startTime2 );
        expect( latestClosedClocking.timeEnd ).toBe( openTimeEntry.timeStart );
        expect( latestClosedClocking.technicianStatus ).toBe( JSONData.TECHNICIAN_STATUS_NON_PRODUCTIVE );
        expect( latestClosedClocking.laborCodeId ).toBe( JSONData.LABOR_CODE_ID_TRAINING );

        TestUtil.removeAllClockings();
        JSONData.setWorkOrderIdForClockingChange( testWorkOrderIds[0] );
        Clocking.recordTime( "technicianStatusTraveling", startTime1 );
        JSONData.closeOpenTimeEntry( startTime2 );
        lunchStartTime = new Date( new Date().getTime() - ( 5 * 60 * 1000 ) ).toISOString();
        Clocking.recordTime( "technicianStatusLunch", lunchStartTime );
        openTimeEntry = JSONData.getOpenTimeEntry();
        latestClosedClocking = Clocking.getLatestClosedClocking();
        expect( _.isObject( latestClosedClocking ) ).toBeTruthy();
        expect( latestClosedClocking.timeStart ).toBe( startTime2 );
        expect( latestClosedClocking.timeEnd ).toBe( openTimeEntry.timeStart );
        expect( latestClosedClocking.technicianStatus ).toBe( JSONData.TECHNICIAN_STATUS_PRODUCTIVE );
        expect( latestClosedClocking.laborCodeId ).toBe( JSONData.LABOR_CODE_ID_TTRNC );

        // Verify that recordTime splits one clocking into two clockings when the
        // start and end times cross midnight
        TestUtil.removeAllClockings();
        startTime = "2013-03-02T12:00:00.000Z";
        endTime = "2013-03-03T12:00:00.000Z";
        Clocking.recordTime( "technicianStatusPaperwork", startTime );
        Clocking.recordTime( "technicianStatusTraining", endTime );
        clockings = JSONData.getObjectsByDataType( "technicianClocking" );
        expect( clockings.length ).toBe( 3 );
        clockings = _.filter( clockings, function( clockingInList ) {
            return clockingInList.laborCodeId == 14;
        });
        clockings = _.sortBy( clockings, function( clockingInList ) {
            return new Date( clockingInList.timeStart ).getTime();
        });
        expect( clockings.length ).toBe( 2 );
        endTime = new Date( clockings[0].timeEnd ).getTime();
        startTime = new Date( clockings[1].timeStart ).getTime();
        expect( startTime - endTime ).toBe( 1000 * 60 );
        expectedCurrentTechStatusText = JSONData.getTechnicianName() + " - " +
            Localization.getText( "technicianStatusTraining" ) + " - " +
            Localization.formatDateTime( JSONData.getOpenTimeEntry().timeStart, "f" );
        expect( window.localStorage.getItem( "currentTechnicianStatus" ) ).toBe( expectedCurrentTechStatusText );

        TestUtil.removeAllClockings();
        startTime = "2013-03-03T12:00:00.000Z";
        endTime = "2013-03-04T12:00:00.000Z";
        JSONData.setWorkOrderIdForClockingChange( testWorkOrders[2].webId );
        Clocking.recordTime( "technicianStatusProductive", startTime );
        JSONData.setWorkOrderIdForClockingChange( testWorkOrders[2].webId );
        Clocking.recordTime( "technicianStatusProductiveOrderApproval", endTime );
        clockings = JSONData.getObjectsByDataType( "technicianClocking" );
        expect( clockings.length ).toBe( 3 );
        clockings = _.filter( clockings, function( clockingInList ) {
            return clockingInList.laborCodeId == 3;
        });
        clockings = _.sortBy( clockings, function( clockingInList ) {
            return new Date( clockingInList.timeStart ).getTime();
        });
        expect( clockings.length ).toBe( 2 );
        endTime = new Date( clockings[0].timeEnd ).getTime();
        startTime = new Date( clockings[1].timeStart ).getTime();
        expect( startTime - endTime ).toBe( 1000 * 60 );
        expectedCurrentTechStatusText = JSONData.getTechnicianName() + " - " +
            Localization.getText( "technicianStatusProductiveOrderApproval" ) + " - " +
            Localization.formatDateTime( JSONData.getOpenTimeEntry().timeStart, "f" );
        expect( window.localStorage.getItem( "currentTechnicianStatus" ) ).toBe( expectedCurrentTechStatusText );

        TestUtil.removeAllClockings();
        startTime = "2013-03-04T12:00:00.000Z";
        endTime = "2013-03-05T12:00:00.000Z";
        JSONData.setWorkOrderIdForClockingChange( testWorkOrders[3].webId );
        Clocking.recordTime( "technicianStatusTraveling", startTime );
        JSONData.setWorkOrderIdForClockingChange( testWorkOrders[3].webId );
        Clocking.recordTime( "technicianStatusProductive", endTime );
        clockings = JSONData.getObjectsByDataType( "technicianClocking" );
        expect( clockings.length ).toBe( 3 );
        clockings = _.filter( clockings, function( clockingInList ) {
            return clockingInList.laborCodeId == 6;
        });
        clockings = _.sortBy( clockings, function( clockingInList ) {
            return new Date( clockingInList.timeStart ).getTime();
        });
        expect( clockings.length ).toBe( 2 );
        endTime = new Date( clockings[0].timeEnd ).getTime();
        startTime = new Date( clockings[1].timeStart ).getTime();
        expect( startTime - endTime ).toBe( 1000 * 60 );

        // Tests done...remove all clocking data
        TestUtil.removeAllClockings();
    } );

    /**
     * Switch travel to productive tests
     */
    it( "Switch travel to productive tests", function () {
        var startTime = "2013-01-02T08:00:00.000Z";

        JSONData.changeClockingStatus( "technicianStatusLoggedIn", null, null );
        // Function does nothing if current status is not traveling
        Clocking.switchTravelToProductive();
        expect( JSONData.getCurrentClockingStatus() ).toBe( "technicianStatusLoggedIn" );

        // Function does nothing if the current work order ID is not set
        TestUtil.removeAllClockings();
        JSONData.setWorkOrderIdForClockingChange( testWorkOrderIds[0] );
        Clocking.recordTime( "technicianStatusTraveling", startTime );
        window.localStorage.removeItem( JSONData.LS_WORK_ORDER_ID_FOR_CLOCKING_CHANGE );
        Clocking.switchTravelToProductive();
        expect( JSONData.getCurrentClockingStatus( null ) ).toBe( "technicianStatusTraveling" );

        TestUtil.removeAllClockings();
        JSONData.setWorkOrderIdForClockingChange( testWorkOrderIds[0] );
        Clocking.recordTime( "technicianStatusPartsRun", startTime );
        window.localStorage.removeItem( JSONData.LS_WORK_ORDER_ID_FOR_CLOCKING_CHANGE );
        Clocking.switchTravelToProductive();
        expect( JSONData.getCurrentClockingStatus( null ) ).toBe( "technicianStatusPartsRun" );

        // Switch to productive occurs if current status is traveling and current work order ID is set
        TestUtil.removeAllClockings();
        JSONData.setWorkOrderIdForClockingChange( testWorkOrderIds[0] );
        Clocking.recordTime( "technicianStatusTraveling", startTime );
        expect( JSONData.getCurrentClockingStatus( null ) ).toBe( "technicianStatusTraveling" );
        WorkOrder.setCurrentWorkOrderId( testWorkOrderIds[0] );
        Clocking.switchTravelToProductive();
        expect( JSONData.getCurrentClockingStatus( null ) ).toBe( "technicianStatusProductive" );

        TestUtil.removeAllClockings();
        JSONData.setWorkOrderIdForClockingChange( testWorkOrderIds[1] );
        Clocking.recordTime( "technicianStatusPartsRun", startTime );
        expect( JSONData.getCurrentClockingStatus( null ) ).toBe( "technicianStatusPartsRun" );
        WorkOrder.setCurrentWorkOrderId( testWorkOrderIds[1] );
        Clocking.switchTravelToProductive();
        expect( JSONData.getCurrentClockingStatus( null ) ).toBe( "technicianStatusProductive" );
    });
});