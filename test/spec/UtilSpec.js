/**
 * Test spec for util.js
 */
describe( "Util", function() {

    /**
     * clone tests
     */
    it( "clone tests", function () {
        // Use a work order to test clone
        var workOrder = WorkOrder.createNewWorkOrder();
        var clonedWorkOrder = Util.clone( workOrder );
        expect( _.isEqual( workOrder, clonedWorkOrder ) ).toBeTruthy();
        expect( workOrder == clonedWorkOrder ).toBeFalsy();
        // Changing one should have no impact on the other
        clonedWorkOrder.webId = Util.getUniqueId();
        expect( _.isEqual( workOrder, clonedWorkOrder ) ).toBeFalsy();
    } );

    /**
     * convert12HourTimeToISODateTimeStamp tests
     */
    it( "convert12HourTimeToISODateTimeStamp(): Exception with undefined parameter", function() {
        expect( function() {
            Util.convert12HourTimeToISODateTimeStamp();
        }).toThrow( "Util.convert12HourTimeToISODateTimeStamp: Required parameter time is undefined" );
    });
    it( "convert12HourTimeToISODateTimeStamp(): Conversion returns valid ISO formatted date/time stamp", function() {
        var testPattern = new RegExp( "(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2}):(0{2}).(0{3})Z" );
        var isoDateTimeStamp = Util.convert12HourTimeToISODateTimeStamp( "4:38 PM" );
        var matches = testPattern.exec( isoDateTimeStamp );
        expect( matches.length ).toEqual( 8 );
    });

    /**
     * convertDateToISODateTimeStamp tests
     */
    it( "convertDateToISODateTimeStamp(): Exception with undefined parameter", function() {
        expect( function() {
            Util.convertDateToISODateTimeStamp();
        }).toThrow( "Util.convertDateToISODateTimeStamp: Required parameter date is undefined" );
    });
    it( "convertDateToISODateTimeStamp(): Exception with invalid date parameter format", function() {
        expect( function() {
            Util.convertDateToISODateTimeStamp( "BogusDate");
        }).toThrow( "Util.convertDateToISODateTimeStamp: 'BogusDate' does not match expected pattern: YYYY-MM-DD" );
    });
    it( "convertDateToISODateTimeStamp(): Conversion returns valid ISO formatted date/time stamp", function() {
        var testPattern = new RegExp( "(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2}):(0{2}).(0{3})Z" );
        var isoDateTimeStamp = Util.convertDateToISODateTimeStamp( "2012-05-21" );
        var matches = testPattern.exec( isoDateTimeStamp );
        expect( matches.length ).toEqual( 8 );
        expect( isoDateTimeStamp.indexOf( "2012-05-21T" ) ).toEqual( 0 );
    });

    /**
     * Do start and end times cross midnight tests
     * NOTE: These tests assume that they are being run in the U.S. Eastern timezone
     */
    it( "Do start and end times cross midnight tests", function () {
        var startTime = "2013-01-01T12:00:00.000Z";
        var endTime = startTime;
        // The dates below come before daylight savings time so use an offset of 5
        var offset = 5;
        var startHour;
        var endHour;
        var startDay;
        var endDay;
        var startMinutes;
        var endMinutes;

        // Start and end times that match don't cross midnight
        expect( Util.doStartAndEndTimesCrossMidnight( startTime, endTime) ).toBeFalsy();
        // End time one hour later than start time on same day
        endTime = "2013-01-01T13:00:00.000Z";
        expect( Util.doStartAndEndTimesCrossMidnight( startTime, endTime) ).toBeFalsy();
        // End time one day later than start time
        endTime = "2013-01-02T13:00:00.000Z";
        expect( Util.doStartAndEndTimesCrossMidnight( startTime, endTime) ).toBeTruthy();

        // Start = 11:50 PM local time, end = 12:15 AM local time, crosses should be true
        startHour = offset - 1;
        endHour = startHour + 1;
        startDay = 15;
        endDay = startDay;
        if ( endHour < startHour ) {
            endDay++;
        }
        startMinutes = 50;
        endMinutes = 15;
        if ( startHour < 10 ) {
            startTime = "2013-02-" + startDay + "T0" + startHour + ":" + startMinutes + ":00.000Z";
        } else {
            startTime = "2013-02-" + startDay + "T" + startHour + ":" + startMinutes + ":00.000Z";
        }
        if ( endHour < 10 ) {
            endTime = "2013-02-" + endDay + "T0" + endHour + ":" + endMinutes + ":00.000Z";
        } else {
            endTime = "2013-02-" + endDay + "T" + endHour + ":" + endMinutes + ":00.000Z";
        }
        expect( Util.doStartAndEndTimesCrossMidnight( startTime, endTime ) ).toBeTruthy();

        // Start = midnight local time, end = midnight + 1 minute, crosses should be false
        startHour = offset;
        endHour = startHour;
        startDay = 15;
        endDay = startDay;
        if ( endHour < startHour ) {
            endDay++;
        }
        startMinutes = 0;
        endMinutes = 1;
        if ( startHour < 10 ) {
            startTime = "2013-02-" + startDay + "T0" + startHour + ":" + startMinutes + ":00.000Z";
        } else {
            startTime = "2013-02-" + startDay + "T" + startHour + ":" + startMinutes + ":00.000Z";
        }
        if ( endHour < 10 ) {
            endTime = "2013-02-" + endDay + "T0" + endHour + ":" + endMinutes + ":00.000Z";
        } else {
            endTime = "2013-02-" + endDay + "T" + endHour + ":" + endMinutes + ":00.000Z";
        }
        expect( Util.doStartAndEndTimesCrossMidnight( startTime, endTime ) ).toBeFalsy();

        // Start = 11:58 PM local time, end = 11:59 PM local time, crosses should be false
        startHour = offset;
        endHour = startHour;
        startDay = 15;
        endDay = startDay;
        if ( endHour < startHour ) {
            endDay++;
        }
        startMinutes = 58;
        endMinutes = 59;
        if ( startHour < 10 ) {
            startTime = "2013-02-" + startDay + "T0" + startHour + ":" + startMinutes + ":00.000Z";
        } else {
            startTime = "2013-02-" + startDay + "T" + startHour + ":" + startMinutes + ":00.000Z";
        }
        if ( endHour < 10 ) {
            endTime = "2013-02-" + endDay + "T0" + endHour + ":" + endMinutes + ":00.000Z";
        } else {
            endTime = "2013-02-" + endDay + "T" + endHour + ":" + endMinutes + ":00.000Z";
        }
        expect( Util.doStartAndEndTimesCrossMidnight( startTime, endTime ) ).toBeFalsy();

        // Start = 11:59 PM local time, end = midnight, crosses = true
        startHour = offset - 1;
        endHour = offset;
        startDay = 15;
        endDay = startDay;
        if ( endHour < startHour ) {
            endDay++;
        }
        startMinutes = 59;
        if ( startHour < 10 ) {
            startTime = "2013-02-" + startDay + "T0" + startHour + ":" + startMinutes + ":00.000Z";
        } else {
            startTime = "2013-02-" + startDay + "T" + startHour + ":" + startMinutes + ":00.000Z";
        }
        if ( endHour < 10 ) {
            endTime = "2013-02-" + endDay + "T0" + endHour + ":00:00.000Z";
        } else {
            endTime = "2013-02-" + endDay + "T" + endHour + ":00:00.000Z";
        }
        expect( Util.doStartAndEndTimesCrossMidnight( startTime, endTime ) ).toBeTruthy();
    } );

    /**
     * Get current date tests
     */
    it( "Get current date tests", function () {
        // Get current date returns today's date with the time components zeroed out
        var currentDate = Util.getCurrentDate();
        expect( currentDate.getHours() == 0 ).toBeTruthy();
        expect( currentDate.getMinutes() == 0 ).toBeTruthy();
        expect( currentDate.getSeconds() == 0 ).toBeTruthy();
        expect( currentDate.getMilliseconds() == 0 ).toBeTruthy();
    } );

    /**
     * Get ID suffix number tests
     */
    it( "Get ID suffix number tests", function () {
        var idWithSuffix = "W12345-1";
        var idWithoutSuffix = "W54321";
        expect( Util.getIdSuffixNumber( idWithSuffix ) ).toBe( "1" );
        expect( Util.getIdSuffixNumber( idWithoutSuffix ) ).toBe( "" );
    } );

    /**
     * Get ISO currrent time tests
     */
    it( "Get ISO currrent time tests", function () {
        var currentISOTime = Util.getISOCurrentTime();
        var dateFromISOTime = new Date( currentISOTime );
        expect( currentISOTime == dateFromISOTime.toISOString() ).toBeTruthy();
    } );

    /**
     * getObjectFromArray tests
     */
    it( "getObjectFromArray(): Return null with invalid/missing parameters", function() {
        expect( Util.getObjectFromArray( null, null, null ) ).toEqual( null );
    });
    
    it( "getObjectFromArray(): Return found objects from array", function() {
        var testArray = [ 
            {
                key1 : 'obj1Value1',
                key2 : 'obj1Value2',
                key3 : 'obj1Value3'
            },
            {
                key1 : 'obj2Value1',
                key2 : 'obj2Value2',
                key3 : 'obj2Value3'
            }
        ];
        var returnedObj = null;
        for ( var i = 1; i <= 3; i++ ) {
            returnedObj = Util.getObjectFromArray( testArray, "key" + i, "obj1Value" + i );
            expect( returnedObj.key1 ).toEqual( "obj1Value1" );
            expect( returnedObj.key2 ).toEqual( "obj1Value2" );
            expect( returnedObj.key3 ).toEqual( "obj1Value3" );
        }
        for ( var i = 1; i <= 3; i++ ) {
            returnedObj = Util.getObjectFromArray( testArray, "key" + i, "obj2Value" + i );
            expect( returnedObj.key1 ).toEqual( "obj2Value1" );
            expect( returnedObj.key2 ).toEqual( "obj2Value2" );
            expect( returnedObj.key3 ).toEqual( "obj2Value3" );
        } 
    });
    
    /**
     * getUniqueId tests
     */
    it( "getUniqueId(): Return different IDs after each call", function() {
        var id1 = Util.getUniqueId();
        var id2 = 0;
        _.delay( function() {
            id2 = Util.getUniqueId();
        }, 10 );
        expect( id1 == id2 ).toBeFalsy();
    });

    /**
     * Get work order document numbers as string tests
     */
    it( "Get work order document numbers as string tests", function () {
        var index;
        var workOrder;
        var workOrders = [];

        // Missing / invalid parameter throws exception
        expect( function() {
            Util.getWorkOrderDocumentNumbersAsString();
        } ).toThrow( "Util.getWorkOrderDocumentNumbersAsString: Required parameter workOrders is missing or is invalid" );
        expect( function() {
            Util.getWorkOrderDocumentNumbersAsString( "INVALID" );
        } ).toThrow( "Util.getWorkOrderDocumentNumbersAsString: Required parameter workOrders is missing or is invalid" );

        for ( index = 0; index < 5; index++ ) {
            workOrder = WorkOrder.createNewWorkOrder();
            workOrder.documentNumber = "WO" + index;
            workOrders.push( workOrder );
        }
        expect( Util.getWorkOrderDocumentNumbersAsString( workOrders) ).toBe( "WO0 WO1 WO2 WO3 WO4")
    } );

    /**
     * Is online tests
     */
    it( "Is online tests", function () {
        var config = Config.getConfig();
        // Running inside desktop browser always returns true
        expect( Util.isOnline( true ) ).toBeTruthy();
        expect( Util.isOnline( false ) ).toBeTruthy();
        // Check support for read only mode
        config.readOnlyMode = true;
        Config.saveConfiguration( config );
        expect( Util.isOnline( false ) ).toBeFalsy();
        expect( Util.isOnline( true ) ).toBeTruthy();
        config.readOnlyMode = false;
        Config.saveConfiguration( config );
        expect( Util.isOnline( false ) ).toBeTruthy();
        expect( Util.isOnline( true ) ).toBeTruthy();
    } );

    /**
     * Is running on Android tests
     */
    it( "Is running on Android tests", function () {
        // Running inside desktop browser always returns false
        expect( Util.isRunningOnAndroid() ).toBeFalsy();
    } );

    /**
     * Is running on Chrome desktop tests
     */
    it( "Is running on Chrome desktop tests", function () {
        expect( Util.isRunningOnChromeDesktop() ).toBeTruthy();
    } );

    /**
     * Is valid ISO formatted date/time stamp tests
     */
    it( "Is valid ISO formatted date/time stamp tests", function () {
        var dateToCheck = Util.getISOCurrentTime();
        expect( Util.isValidISODateTimeStamp( dateToCheck ) ).toBeTruthy();
        var dateToCheck = new Date().toISOString();
        expect( Util.isValidISODateTimeStamp( dateToCheck ) ).toBeTruthy();
        dateToCheck = "Fri Feb 01 2013 13:39:32 GMT-0500 (EST)";
        expect( Util.isValidISODateTimeStamp( dateToCheck ) ).toBeFalsy();
    } );

    /**
     * Remove suffix from ID tests
     */
    it( "Remove suffix from ID tests", function () {
        var idWithSuffix = "W12345-1";
        var idWithoutSuffix = "W54321";
        expect( Util.removeSuffixFromId( idWithSuffix ) ).toBe( "W12345" );
        expect( Util.removeSuffixFromId( idWithoutSuffix ) ).toBe( "W54321" );
    } );

    /**
     * setSecondsAndMillisecondsToZero tests
     */
    it( "setSecondsAndMillisecondsToZero(): Exceptions with undefined parameter and invalid parameter", function() {
        expect( function() {
            Util.setSecondsAndMillisecondsToZero();
        }).toThrow( "Util.setSecondsAndMillisecondsToZero: Required parameter dateTimeStamp is undefined" );
        expect( function() {
            Util.setSecondsAndMillisecondsToZero( "BogusDateTimeStamp" );
        }).toThrow( "Util.setSecondsAndMillisecondsToZero: 'BogusDateTimeStamp' is not an ISO formated date/time stamp" );
    });
    it( "setSecondsAndMillisecondsToZero(): Returns date/time stamp with seconds and milliseconds set to 0", function() {
        var testDateTimeStamp = Util.setSecondsAndMillisecondsToZero( "2012-04-20T06:50:35.123Z" );
        var testDateTime = new Date( testDateTimeStamp );
        expect( testDateTime.getSeconds() ).toEqual( 0 );
        expect( testDateTime.getMilliseconds() ).toEqual( 0 );
    });
} );
