/**
 * Test spec for jsondata.js
 */
describe( "JsonData", function() {

    var numTestObjects = 10;
    var testObjects = [];

    var testStockAreas = '[{"webId":1,"branchId":32,"departmentId":68,"name":"Warehouse","type":0},{"webId":2,"branchId":32,"departmentId":70,"name":"TEST TRUCK","type":0}]';

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

    var TEST_STANDARD_JOB_CODE = {
        webId: 1,
        standardJobCodeManufacturerId: 5,
        jobCode: "17",
        completeJobCode: "2017",
        timeFrequency: null,
        timeFrequencyType: 0,
        active: true,
        counter: null,
        counterFrequency: null,
        counterType: 0,
        description: "TEST STANDARD JOB CODE",
        notes: "Test standard job code",
        parentId: 2540
    };

    var TEST_SERVICETRUCKS = [
        {
            webId: 1,
            internalId: "X-SHOP4",
            name: "TEST TRUCK",
            webUserId: 1
        }
    ];

    var TEST_WEBUSERS = [
        {
            webId: 1,
            internalId: "020920",
            address: {
                webId: 2008,
                internalId: "214030",
                active: false,
                name: "Test Webuser",
                name2: null,
                street: "",
                street2: null,
                county: null,
                city: "Dayton",
                state: "OH",
                country: "USA",
                postalCode: "45377",
                location: null,
                startDate: "2008-11-04T05:00:00Z",
                endDate: "2008-11-04T05:00:00Z",
                billTo: false,
                shipTo: false,
                payTo: null,
                main: null,
                taxCodeId: null,
                mailTo: false,
                communicationDetails:
                    [
                    ]
            },
            roleId: null,
            branchId: 32,
            departmentId: 67
        }
    ];

    // Clear local storage before running any tests
    window.localStorage.clear();

    /**
     * Test prep
     */
    beforeEach( function() {
        // Set up test work orders and save them into local storage
        var index;
        var newWorkOrder;
        var testObject;
        JSONData.saveJSON( "customers", TEST_CUSTOMER, null );
        for ( index = 0; index < numTestWorkOrders; index++ ) {
            newWorkOrder = WorkOrder.createNewWorkOrder();
            newWorkOrder.customerId = TEST_CUSTOMER.webId;
            testWorkOrders.push( newWorkOrder );
            testWorkOrderIds.push( newWorkOrder.webId );
            JSONData.saveJSON( "workOrders", newWorkOrder, true );
        }
        // Create test objects
        for ( index = 1; index <= numTestObjects; index++ ) {
            testObject = {
                webId : index,
                name : "testObject" + index
            };
            testObjects.push( testObject );
            JSONData.saveJSON( "testObjects", testObject, true );
        }
        // Create test stock areas
        window.localStorage.setItem( "stockAreas", testStockAreas );

        // Create test logon
        TestUtil.createTestLogon();

        // Create test web users
        window.localStorage.setItem( "webUsers", JSON.stringify( TEST_WEBUSERS ) );

        // Create test service trucks
        window.localStorage.setItem( "serviceTrucks", JSON.stringify( TEST_SERVICETRUCKS ) );

        TestUtil.removeAllClockings();
    });
    
    /**
     * After test clean up
     */
    afterEach( function() {
        TestUtil.removeTestData();
        testWorkOrders = [];
        testWorkOrderIds = [];
        testObjects = [];
    });

    /**
     * Close open time entry tests
     */
    it( "Close open time entry tests", function () {
        var clockings;
        var startTime = "2013-01-01T08:00:00.000Z";
        var stopTime = "2013-01-01T09:00:00.000Z";
        Clocking.recordTime( "technicianStatusServiceSupervision", startTime );
        JSONData.closeOpenTimeEntry( stopTime );
        clockings = JSONData.getObjectsByDataType( "technicianClocking" );
        expect( clockings.length ).toBe( 1 );
        expect( clockings[0].timeStart ).toBe( startTime );
        expect( clockings[0].timeEnd ).toBe( stopTime );
    });

    /**
     * createNewMessage tests
     */
    it( "createNewMessage(): Return initialized message object", function() {
        var message = JSONData.createNewMessage();
        expect( _.isObject( message) ).toBeTruthy();
        expect( message.to.length ).toBe( 0 );
        expect( message.dateSent ).toBe( "" );
        expect( message.entityType ).toBe( "" );
        expect( message.entityId ).toBeNull();
        expect( message.value ).toBe( "" );
    });

    /**
     * createNewSignature tests
     */
    it( "createNewSignature(): Return initialized signature object", function() {
        var signature = JSONData.createNewSignature();
        expect( _.isObject( signature) ).toBeTruthy();
        expect( signature.dateCaptured ).toNotEqual( "" );
        expect( signature.format ).toBe( JSONData.SIGNATURE_FORMAT );
        expect( signature.value ).toBe( "" );
    });

    /**
     * Delete data type tests
     */
    it( "Delete data type tests", function () {
        var testObject = {
            webId: 1
        };
        // Delete a saved object and verify that it's gone
        JSONData.saveJSON( "testObjects", testObject, true );
        JSONData.deleteDataType( "testObjects" );
        expect( JSONData.getObjectsByDataType( "testObjects" ).length ).toBe( 0 );
        JSONData.deleteDataType( "workOrders" );
        expect( JSONData.getObjectsByDataType( "workOrders" ).length ).toBe( 0 );
    });

    /**
     * Delete JSON tests
     */
    it( "Delete JSON tests", function() {
        var savedTestObject;
        var testObject = {
            webId: 1
        };
        expect( function() {
            JSONData.deleteJSON();
        }).toThrow( "JSONData.deleteJSON: One or more required parameters (dataType, id) are null or undefined" );
        expect( function() {
            JSONData.deleteJSON( "testObjects" );
        }).toThrow( "JSONData.deleteJSON: One or more required parameters (dataType, id) are null or undefined" );
        // Delete a saved object and verify that it's gone
        JSONData.saveJSON( "testObjects", testObject, true );
        savedTestObject = JSONData.getObjectById( "testObjects", 1 );
        expect( savedTestObject.webId ).toBe( 1 );
        JSONData.deleteJSON( "testObjects", 1 );
        expect( JSONData.getObjectById( "testObjects", 1 ) ).toBeNull();
    });

    /**
     * Get current clocking status tests
     * NOTE: recordTime tests provide adequate coverage of getCurrentClockingStatus
     */
    it( "Get current clocking status tests", function () {
        // Initial clocking status is logged out
        expect( JSONData.getCurrentClockingStatus() ).toBe( "technicianStatusLoggedOut" );
    } );

    /**
     * Get data type from JSON feed data tests
     */
    it( "Get data type from JSON feed data tests", function () {
        var jsonFeedData;

        // Missing / invalid parameter returns null
        expect( JSONData.getDataTypeFromJSONFeedData() ).toBeNull();
        expect( JSONData.getDataTypeFromJSONFeedData( "INVALID" ) ).toBeNull();

        // Test JSON feed data prior to addition of requestDate property
        jsonFeedData = {
            "success": true,
            "total": 4,
            "workOrders": []
        };
        expect( JSONData.getDataTypeFromJSONFeedData( jsonFeedData ) ).toBe( "workOrders" );

        // Test JSON feed data with addition of requestDate property
        jsonFeedData = {
            "success": true,
            "total": 4,
            "requestDate": "2013-04-11T10:16:12Z",
            "workOrders": []
        };
        expect( JSONData.getDataTypeFromJSONFeedData( jsonFeedData ) ).toBe( "workOrders" );
    } );

    /**
     * Get filtered object tests
     */
    it( "Get filtered object tests", function () {
        var filteredObjectCount;
        var filteredObjects;
        // Check exceptions for invalid parameters
        expect( function() {
            JSONData.getFilteredObjectList();
        }).toThrow( "JSONData.getFilteredObjectList: Required parameter dataType is undefined or is not a string" );
        expect( function() {
            JSONData.getFilteredObjectList( "workOrders" );
        }).toThrow( "JSONData.getFilteredObjectList: Required parameter filterFunction is undefined or is not a function" );
        expect( function() {
            JSONData.getFilteredObjectList( "workOrders", "BogusFunction" );
        }).toThrow( "JSONData.getFilteredObjectList: Required parameter filterFunction is undefined or is not a function" );

        // Filter the test work orders and verify results
        filteredObjectCount = JSONData.getFilteredObjectCount( "testObjects", function( testObjectInList ) {
            return testObjectInList.name === "testObject3";
        });
        expect( filteredObjectCount ).toBe( 1 );
        filteredObjectCount = JSONData.getFilteredObjectCount( "testObjects", function( testObjectInList ) {
            return testObjectInList.name === "NotFound";
        });
        expect( filteredObjectCount ).toBe( 0 );
        filteredObjects = JSONData.getFilteredObjectList( "testObjects", function( testObjectInList ) {
            return testObjectInList.name === "testObject5";
        });
        expect( filteredObjects.length ).toBe( 1 );
        expect( filteredObjects[0].webId ).toBe( 5 );
        filteredObjects = JSONData.getFilteredObjectList( "testObjects", function( testObjectInList ) {
            return testObjectInList.name === "NotFound";
        });
        expect( filteredObjects ).toBeNull();
    } );

    /**
     * getNewMessageCount test
     */
    it( "getNewMessageCount(): Return expected number of new messages", function() {
        expect( JSONData.getNewMessageCount() ).toBe( 0 );
    });

    /**
     * Get objects by datatype tests
     */
    it( "Get objects by datatype tests", function () {
        expect( JSONData.getObjectsByDataType( "testObjects" ).length ).toBe( numTestObjects );
        expect( JSONData.getObjectsByDataType( "missingObjects" ).length ).toBe( 0 );
    });

    /**
     * Get object by ID tests
     */
    it( "Get object by ID tests", function () {
        var idPropertyValue;
        var object;
        // Test invalid parameter handling
        expect( function() {
            JSONData.getObjectById();
        }).toThrow( "JSONData.getObjectById: Required parameter dataType is undefined" );
        object = JSONData.getObjectById( "workOrders", null );
        expect( object ).toBeNull();
        // Test object not found
        expect( JSONData.getObjectById( "workOrders", -1 ) ).toBeNull();
        // Test object found
        object = JSONData.getObjectById( "testObjects", 5 );
        expect( object.webId ).toBe( 5 );
        expect( object.name ).toBe( "testObject5" );
        // Test using different ID property names
        idPropertyValue = testWorkOrders[3].clientReference;
        object = JSONData.getObjectById( "workOrders", idPropertyValue, "clientReference" );
        expect( object.clientReference ).toBe( idPropertyValue );
        idPropertyValue = 70;
        object = JSONData.getObjectById( "stockAreas", idPropertyValue, "departmentId" );
        expect( object.departmentId ).toBe( idPropertyValue );
        expect( object.name ).toBe( "TEST TRUCK" );
    } );

    /**
     * Get object from array by ID tests
     */
    it( "Get object from array by ID tests", function () {
        var testObject;
        expect( function() {
            JSONData.getObjectFromArrayById();
        }).toThrow( "JSONData.getObjectFromArrayById: One or more required parameters (jsonObjArray, webId) are undefined or invalid" );
        expect( function() {
            JSONData.getObjectFromArrayById( [], 1 );
        }).toThrow( "JSONData.getObjectFromArrayById: One or more required parameters (jsonObjArray, webId) are undefined or invalid" );
        expect( function() {
            JSONData.getObjectFromArrayById( testWorkOrders );
        }).toThrow( "JSONData.getObjectFromArrayById: One or more required parameters (jsonObjArray, webId) are undefined or invalid" );
        testObject = JSONData.getObjectFromArrayById( testObjects, 7 );
        expect( testObject.webId ).toBe( 7 );
        expect( testObject.name ).toBe( "testObject7" );
    } );

    /**
     * Get work order ID for clocking change tests
     */
    it( "Get work order ID for clocking change tests", function () {
        var uniqueId = Util.getUniqueId();
        expect( function() {
            JSONData.setWorkOrderIdForClockingChange();
        }).toThrow( "JSONData.setWorkOrderIdForClockingChange: Required parameter workOrderId is undefined" );
        JSONData.setWorkOrderIdForClockingChange( uniqueId );
        expect( JSONData.getWorkOrderIdForClockingChange() ).toBe( uniqueId.toString() );
    } );

    /**
     * Get inventory location string tests
     */
    it( "Get inventory location string tests", function () {
        var inventoryLocation = JSONData.getInventoryLocationString();
        expect( inventoryLocation ).toBe( "partsRequest" );
        inventoryLocation = JSONData.getInventoryLocationString( null );
        expect( inventoryLocation ).toBe( "partsRequest" );
        var inventoryData = [
            {
                webId: 1,
                binName: "TRUCK",
                mainBin: false,
                maximum: 0,
                minimum: 0,
                quantity: 0,
                product: {
                    webId: 2,
                    manufacturer: "CRW",
                    productCode: "044496"
                },
                stockAreaId: 1
            }
        ];
        inventoryLocation = JSONData.getInventoryLocationString( 1, inventoryData );
        expect( inventoryLocation ).toBe( "Warehouse - TRUCK" );
    } );

    /**
     * Get JSON feed config tests
     */
    it( "Get JSON feed config tests", function () {
        var feedConfig;

        // Test invalid parameter handling
        expect( function() {
            JSONData.getJSONFeedConfig();
        } ).toThrow( "JSONData.getJSONFeedConfig: Required parameters dataType is null or undefined" );

        feedConfig = JSONData.getJSONFeedConfig( "standardJobCodes", Config.getConfig() );
        expect( feedConfig.name ).toBe( "standardJobCodes" );
        expect( feedConfig.updateSupported ).toBeFalsy();
        expect( feedConfig.readOnly ).toBeTruthy();

        feedConfig = JSONData.getJSONFeedConfig( "workOrders", Config.getConfig() );
        expect( feedConfig.name ).toBe( "workOrders" );
        expect( feedConfig.updateSupported ).toBeTruthy();
        expect( feedConfig.readOnly ).toBeFalsy();
    } );

    /**
     * Get latest time entry tests
     */
    it( "Get latest time entry tests", function () {
        var clocking;
        var startTime = "2013-01-02T08:00:00.000Z";
        var stopTime = "2013-01-02T09:00:00.000Z";

        // This test needs a customer object
        var customer = {
            webId : 1,
            name : "TestCustomer"
        };
        JSONData.saveJSON( "customers", customer, true );
        testWorkOrders[0].customerId = 1;
        JSONData.saveJSON( "workOrders", testWorkOrders[0], true );

        // Test with productive clocking
        JSONData.setWorkOrderIdForClockingChange( testWorkOrderIds[0] );
        Clocking.recordTime( "technicianStatusProductive", startTime );
        expect( JSONData.getLatestTimeEntry() ).toBeNull();
        JSONData.closeOpenTimeEntry( stopTime );
        clocking = JSONData.getLatestTimeEntry();
        expect( clocking.timeStart ).toBe( startTime );
        expect( clocking.timeEnd ).toBe( stopTime );
        expect( clocking.technicianStatus ).toBe( JSONData.TECHNICIAN_STATUS_PRODUCTIVE );

        // Test with unproductive clocking
        TestUtil.removeAllClockings();
        JSONData.setWorkOrderIdForClockingChange( testWorkOrderIds[0] );
        Clocking.recordTime( "technicianStatusTraining", startTime );
        expect( JSONData.getLatestTimeEntry() ).toBeNull();
        JSONData.closeOpenTimeEntry( stopTime );
        clocking = JSONData.getLatestTimeEntry();
        expect( clocking.timeStart ).toBe( startTime );
        expect( clocking.timeEnd ).toBe( stopTime );
        expect( clocking.technicianStatus ).toBe( JSONData.TECHNICIAN_STATUS_NON_PRODUCTIVE );

        // Clean up test customer
        JSONData.deleteJSON( "customers", 1 );
    } );

    /**
     * Get main communication details tests
     */
    it( "Get main communication details tests", function () {
        var testCommDetails = [
            {
                webId: 1,
                main: true,
                information: "614-555-1111",
                extension: null,
                type: "FAX"
            },
            {
                webId: 2,
                main: true,
                information: "614-555-2222",
                extension: null,
                type: "PHONE"
            },
            {
                webId: 3,
                main: false,
                information: "614-555-3333",
                extension: null,
                type: "PHONE"
            }
        ];
        var mainCommDetails;

        // Check handling of invalid parameters
        expect( function() {
            JSONData.getMainCommunicationDetails();
        }).toThrow( "JSONData.getMainCommunicationDetails: Required parameter commDetails is undefined or empty" );
        expect( function() {
            var emptyArray = [];
            JSONData.getMainCommunicationDetails( emptyArray );
        }).toThrow( "JSONData.getMainCommunicationDetails: Required parameter commDetails is undefined or empty" );

        // Get main comm details and verify
        mainCommDetails = JSONData.getMainCommunicationDetails( testCommDetails );
        expect( mainCommDetails.webId ).toBe( 2 );
        expect( mainCommDetails.information ).toBe( "614-555-2222" );
        expect( mainCommDetails.type ).toBe( "PHONE" );
    } );

    /**
     * Get new clocking start time
     */
    it( "Get new clocking start time", function () {
        var newTime;
        var today = new Date();
        var startTime = "2013-01-03T08:00:00.000Z";
        var stopTime = "2013-01-03T09:00:00.000Z";

        // Returns current time if status is not logged in
        newTime = new Date( JSONData.getNewClockingStartTime() );
        expect( newTime.getYear() ).toBe( today.getYear() );
        expect( newTime.getMonth() ).toBe( today.getMonth() );
        expect( newTime.getDay() ).toBe( today.getDay() );
        expect( newTime.getHours() ).toBe( today.getHours() );
        expect( newTime.getMinutes() ).toBe( today.getMinutes() );

        // Returns start time if current status is logged in
        Clocking.recordTime( "technicianStatusLoggedIn", startTime );
        expect( JSONData.getNewClockingStartTime() ).toBe( startTime );
    } );

    /**
     * Get non productive clocking statuses tests
     */
    it( "Get non productive clocking statuses tests", function () {
        var statuses = JSONData.getNonProductiveClockingStatuses();
        expect( statuses.length ).toBeGreaterThan( 1 );
        _.each( statuses, function( statusInList ) {
            expect( _.isString( statusInList ) ).toBeTruthy();
        });
    } );

    /**
     * Get object from database by ID tests
     */
    it( "Get object from database by ID tests", function () {
        var foundComplete = false;
        var missingIdComplete = false;
        var productFromDb;

        // Test invalid parameter handling
        expect( function() {
            JSONData.getObjectFromDatabaseById();
        }).toThrow( "JSONData.getObjectFromDatabaseById: One or more required parameters (dataType, resultCallback) are undefined or invalid" );
        expect( function() {
            JSONData.getObjectFromDatabaseById( "products" );
        }).toThrow( "JSONData.getObjectFromDatabaseById: One or more required parameters (dataType, resultCallback) are undefined or invalid" );
        expect( function() {
            JSONData.getObjectFromDatabaseById( "products", 1 );
        }).toThrow( "JSONData.getObjectFromDatabaseById: One or more required parameters (dataType, resultCallback) are undefined or invalid" );
        expect( function() {
            JSONData.getObjectFromDatabaseById( "products", 1, "BogusFunction" );
        }).toThrow( "JSONData.getObjectFromDatabaseById: One or more required parameters (dataType, resultCallback) are undefined or invalid" );

        // Test look up of ID that's not found in the database
        runs( function() {
            JSONData.getObjectFromDatabaseById( "products", -1, function( product ) {
                productFromDb = product;
                missingIdComplete = true;
            });
        });
        waitsFor( function() {
            return missingIdComplete;
        }, "", 5000 );
        runs( function() {
            expect( productFromDb ).toBeNull();
        });

        // Test look up of ID that's found
        runs( function() {
            JSONData.getObjectFromDatabaseById( "products", 707965, function( product ) {
                productFromDb = product;
                foundComplete = true;
            });
        });
        waitsFor( function() {
            return foundComplete;
        }, "", 5000 );
        runs( function() {
            expect( _.isObject( productFromDb ) ).toBeTruthy();
            expect( productFromDb.productCode ).toBe( "050000-010" );
        });
    } );

    /**
     * Get objects from database tests
     */
    it( "Get objects from database tests", function () {
        // Test handling of invalid parameters
        expect( function() {
            JSONData.getObjectsFromDatabase();
        }).toThrow( "JSONData.getObjectsFromDatabase: One or more required parameters (dataType, resultCallback) are undefined or invalid" );
        expect( function() {
            JSONData.getObjectsFromDatabase( "products" );
        }).toThrow( "JSONData.getObjectsFromDatabase: One or more required parameters (dataType, resultCallback) are undefined or invalid" );
        expect( function() {
            JSONData.getObjectsFromDatabase( "products", "BogusFunction" );
        }).toThrow( "JSONData.getObjectsFromDatabase: One or more required parameters (dataType, resultCallback) are undefined or invalid" );
        // FIXME: This test requires another DB table...don't use products because it contains nearly 500,000 objects
    } );

    /**
     * Get open time entry tests
     */
    it( "Get open time entry tests", function () {
        var openTimeEntry;
        var startTime = "2013-01-04T08:00:00.000Z";
        var stopTime = "2013-01-04T09:00:00.000Z";

        // No open time entry if no clockings exist
        expect( JSONData.getOpenTimeEntry() ).toBeNull();

        // Open time entry returns valid time entry if one is open
        Clocking.recordTime( "technicianStatusNoPay", startTime );
        openTimeEntry = JSONData.getOpenTimeEntry();
        expect( openTimeEntry.timeStart ).toBe( startTime );
        expect( openTimeEntry.technicianStatus ).toBe( JSONData.TECHNICIAN_STATUS_NON_PRODUCTIVE );

        // Open time entry does not return closed entry
        JSONData.closeOpenTimeEntry( stopTime );
        expect( JSONData.getOpenTimeEntry() ).toBeNull();
    } );

    /**
     * Get PM cutoff date tests
     */
    it( "Get PM cutoff date tests", function () {
        var now = new Date();
        var expectedPMCutoffDate = new Date( now.getFullYear(), now.getMonth() + 1, 0 ).getTime();
        expect( JSONData.getPMCutoffDate() ).toBe( expectedPMCutoffDate );
    } );

    /**
     * Get products tests
     */
    it( "Get products tests", function () {
        var foundComplete = false;
        var missingComplete = false;
        var productsFromDb;

        // Test handling of invalid parameters
        expect( function() {
            JSONData.getProducts();
        }).toThrow( "JSONData.getProducts: One or more required parameters (type, code, resultCallback) are undefined" );
        expect( function() {
            JSONData.getProducts( 3 );
        }).toThrow( "JSONData.getProducts: One or more required parameters (type, code, resultCallback) are undefined" );
        expect( function() {
            JSONData.getProducts( 3, "1" );
        }).toThrow( "JSONData.getProducts: One or more required parameters (type, code, resultCallback) are undefined" );

        // Get missing product and verify
        runs( function() {
            JSONData.getProducts( JSONData.PRODUCT_TYPE_PART, "BogusProductCode", function( product ) {
                productsFromDb = product;
                missingComplete = true;
            });
        });
        waitsFor( function() {
            return missingComplete;
        }, "", 5000 );
        runs( function() {
            expect( productsFromDb.length ).toBe( 0 );
        });

        // Get valid product and verify
        runs( function() {
            JSONData.getProducts( JSONData.PRODUCT_TYPE_PART, "050000-010", function( product ) {
                productsFromDb = product;
                foundComplete = true;
            });
        });
        waitsFor( function() {
            return foundComplete;
        }, "", 5000 );
        runs( function() {
            expect( productsFromDb.length ).toBe( 1 );
            expect( productsFromDb[0].productCode ).toBe( "050000-010" );
        });
    } );

    /**
     * Get technician branch ID tests
     */
    it( "Get technician branch ID tests", function () {
        expect( JSONData.getTechnicianBranchId() ).toBe( TEST_WEBUSERS[0].branchId );
    } );

    /**
     * Get technician clockings requiring post to the MT tests
     */
    it( "Get technician clockings requiring post to the MT tests", function () {
        var clockings;
        var startTime = "2013-01-03T08:00:00.000Z";
        var stopTime = "2013-01-03T09:00:00.000Z";
        var stopTime2 = "2013-01-03T10:00:00.000Z";

        // No clockings created so no clockings require a post
        expect( JSONData.getObjectsByDataType( "technicianClocking" ).length ).toBe( 0 );
        clockings = JSONData.getTechnicianClockingsRequiringPostToMiddleTier( true );
        expect( clockings.length ).toBe( 0 );
        clockings = JSONData.getTechnicianClockingsRequiringPostToMiddleTier( false );
        expect( clockings.length ).toBe( 0 );

        // Logged in clocking only returns 0
        Clocking.recordTime( "technicianStatusLoggedIn", startTime );
        JSONData.closeOpenTimeEntry( stopTime );
        expect( JSONData.getObjectsByDataType( "technicianClocking" ).length ).toBe( 1 );
        clockings = JSONData.getTechnicianClockingsRequiringPostToMiddleTier( true );
        expect( clockings.length ).toBe( 0 );
        clockings = JSONData.getTechnicianClockingsRequiringPostToMiddleTier( false );
        expect( clockings.length ).toBe( 0 );
        TestUtil.removeAllClockings();

        // One unproductive clocking with no end time returns 0
        Clocking.recordTime( "technicianStatusPaperwork", startTime );
        expect( JSONData.getObjectsByDataType( "technicianClocking" ).length ).toBe( 1 );
        clockings = JSONData.getTechnicianClockingsRequiringPostToMiddleTier( true );
        expect( clockings.length ).toBe( 0 );
        clockings = JSONData.getTechnicianClockingsRequiringPostToMiddleTier( false );
        expect( clockings.length ).toBe( 0 );
        TestUtil.removeAllClockings();

        // One productive clocking with no end time returns 0
        JSONData.setWorkOrderIdForClockingChange( testWorkOrderIds[0] );
        Clocking.recordTime( "technicianStatusTraveling", startTime );
        expect( JSONData.getObjectsByDataType( "technicianClocking" ).length ).toBe( 1 );
        clockings = JSONData.getTechnicianClockingsRequiringPostToMiddleTier( true );
        expect( clockings.length ).toBe( 0 );
        clockings = JSONData.getTechnicianClockingsRequiringPostToMiddleTier( false );
        expect( clockings.length ).toBe( 0 );
        TestUtil.removeAllClockings();

        // Create one unproductive clocking and verify
        Clocking.recordTime( "technicianStatusLoggedIn", startTime );
        Clocking.recordTime( "technicianStatusNoPay", stopTime );
        JSONData.closeOpenTimeEntry( stopTime2 );
        expect( JSONData.getObjectsByDataType( "technicianClocking" ).length ).toBe( 2 );
        clockings = JSONData.getTechnicianClockingsRequiringPostToMiddleTier( true );
        expect( clockings.length ).toBe( 1 );
        clockings = JSONData.getTechnicianClockingsRequiringPostToMiddleTier( false );
        expect( clockings.length ).toBe( 1 );
        TestUtil.removeAllClockings();

        // Create one productive clocking and verify
        Clocking.recordTime( "technicianStatusLoggedIn", startTime );
        JSONData.setWorkOrderIdForClockingChange( testWorkOrderIds[0] );
        Clocking.recordTime( "technicianStatusProductive", stopTime );
        JSONData.closeOpenTimeEntry( stopTime2 );
        expect( JSONData.getObjectsByDataType( "technicianClocking" ).length ).toBe( 2 );
        clockings = JSONData.getTechnicianClockingsRequiringPostToMiddleTier( true );
        expect( clockings.length ).toBe( 1 );
        clockings = JSONData.getTechnicianClockingsRequiringPostToMiddleTier( false );
        expect( clockings.length ).toBe( 0 );
        TestUtil.removeAllClockings();

        // Create one logged in, one productive and one non-productive clocking and verify
        JSONData.setWorkOrderIdForClockingChange( testWorkOrderIds[0] );
        Clocking.recordTime( "technicianStatusProductive", startTime );
        Clocking.recordTime( "technicianStatusNoPay", stopTime );
        JSONData.closeOpenTimeEntry( stopTime2 );
        expect( JSONData.getObjectsByDataType( "technicianClocking" ).length ).toBe( 2 );
        clockings = JSONData.getTechnicianClockingsRequiringPostToMiddleTier( true );
        expect( clockings.length ).toBe( 2 );
        clockings = JSONData.getTechnicianClockingsRequiringPostToMiddleTier( false );
        expect( clockings.length ).toBe( 1 );
        TestUtil.removeAllClockings();
    });

    /**
     * Get technician user ID tests
     */
    it( "Get technician user ID tests", function () {
        expect( JSONData.getTechnicianUserId() ).toBe( 1 );
    } );

    /**
     * Get technician name tests
     */
    it( "Get technician name tests", function () {
        expect( JSONData.getTechnicianName() ).toBe( TEST_WEBUSERS[0].address.name );
    } );

    /**
     * Get technician van tests
     */
    it( "Get technician van tests", function () {
        var van = JSONData.getTechnicianVan();
        expect( van.webId ).toBe( 1 );
        expect( van.name ).toBe( "TEST TRUCK" );
    } );

    /**
     * Handle clocking post error tests
     */
    it( "Handle clocking post error tests", function () {
        var clockings = [];
        var openTimeEntry;
        Clocking.recordTime( "technicianStatusDPTraining", null );
        openTimeEntry = JSONData.getOpenTimeEntry();
        JSONData.handleClockingPostError( clockings, "" );
        expect( openTimeEntry.postToMiddleTierRequired ).toBeTruthy();
        JSONData.handleClockingPostError( clockings, "200-102" );
        expect( openTimeEntry.postToMiddleTierRequired ).toBeTruthy();
        clockings.push( openTimeEntry );
        JSONData.handleClockingPostError( clockings, "" );
        expect( openTimeEntry.postToMiddleTierRequired ).toBeTruthy();
        JSONData.handleClockingPostError( clockings, "200-102" );
        expect( openTimeEntry.postToMiddleTierRequired ).toBeFalsy();

        TestUtil.removeAllClockings();
        clockings = [];
        Clocking.recordTime( "technicianStatusDPTraining", null );
        clockings.push( JSONData.getOpenTimeEntry() );
        Clocking.recordTime( "technicianStatusNoPay", null );
        clockings.push( JSONData.getOpenTimeEntry() );
        JSONData.handleClockingPostError( clockings, "" );
        _.each( clockings, function( clockingInList ) {
            expect( clockingInList.postToMiddleTierRequired ).toBeTruthy();
        });
        JSONData.handleClockingPostError( clockings, "200-102" );
        _.each( clockings, function( clockingInList ) {
            expect( clockingInList.postToMiddleTierRequired ).toBeFalsy();
        });
    });

    /**
     * Is clocking paid / unpaid tests
     */
    it( "Is clocking paid / unpaid tests", function () {
        var clocking;
        Clocking.recordTime( "technicianStatusDPTraining", null );
        clocking = JSONData.getOpenTimeEntry();
        expect( JSONData.isClockingPaid( clocking ) ).toBeTruthy();
        expect( JSONData.isClockingUnpaid( clocking ) ).toBeFalsy();
        Clocking.recordTime( "technicianStatusLunch", null );
        clocking = JSONData.getOpenTimeEntry();
        expect( JSONData.isClockingPaid( clocking ) ).toBeFalsy();
        expect( JSONData.isClockingUnpaid( clocking ) ).toBeTruthy();
        Clocking.recordTime( "technicianStatusNoPay", null );
        clocking = JSONData.getOpenTimeEntry();
        expect( JSONData.isClockingPaid( clocking ) ).toBeFalsy();
        expect( JSONData.isClockingUnpaid( clocking ) ).toBeTruthy();
        Clocking.recordTime( "technicianStatusPaperwork", null );
        clocking = JSONData.getOpenTimeEntry();
        expect( JSONData.isClockingPaid( clocking ) ).toBeTruthy();
        expect( JSONData.isClockingUnpaid( clocking ) ).toBeFalsy();
        JSONData.setWorkOrderIdForClockingChange( testWorkOrderIds[0] );
        Clocking.recordTime( "technicianStatusPartsRun", null );
        clocking = JSONData.getOpenTimeEntry();
        expect( JSONData.isClockingPaid( clocking ) ).toBeTruthy();
        expect( JSONData.isClockingUnpaid( clocking ) ).toBeFalsy();
        Clocking.recordTime( "technicianStatusPartsStaff", null );
        clocking = JSONData.getOpenTimeEntry();
        expect( JSONData.isClockingPaid( clocking ) ).toBeTruthy();
        expect( JSONData.isClockingUnpaid( clocking ) ).toBeFalsy();
        JSONData.setWorkOrderIdForClockingChange( testWorkOrderIds[0] );
        Clocking.recordTime( "technicianStatusProductive", null );
        clocking = JSONData.getOpenTimeEntry();
        expect( JSONData.isClockingPaid( clocking ) ).toBeTruthy();
        expect( JSONData.isClockingUnpaid( clocking ) ).toBeFalsy();
        JSONData.setWorkOrderIdForClockingChange( testWorkOrderIds[0] );
        Clocking.recordTime( "technicianStatusProductiveOrderApproval", null );
        clocking = JSONData.getOpenTimeEntry();
        expect( JSONData.isClockingPaid( clocking ) ).toBeTruthy();
        expect( JSONData.isClockingUnpaid( clocking ) ).toBeFalsy();
        Clocking.recordTime( "technicianStatusServiceSupervision", null );
        clocking = JSONData.getOpenTimeEntry();
        expect( JSONData.isClockingPaid( clocking ) ).toBeTruthy();
        expect( JSONData.isClockingUnpaid( clocking ) ).toBeFalsy();
        Clocking.recordTime( "technicianStatusTraining", null );
        clocking = JSONData.getOpenTimeEntry();
        expect( JSONData.isClockingPaid( clocking ) ).toBeTruthy();
        expect( JSONData.isClockingUnpaid( clocking ) ).toBeFalsy();
        JSONData.setWorkOrderIdForClockingChange( testWorkOrderIds[0] );
        Clocking.recordTime( "technicianStatusTraveling", null );
        clocking = JSONData.getOpenTimeEntry();
        expect( JSONData.isClockingPaid( clocking ) ).toBeTruthy();
        expect( JSONData.isClockingUnpaid( clocking ) ).toBeFalsy();
        Clocking.recordTime( "technicianStatusVehicleMaintenance", null );
        clocking = JSONData.getOpenTimeEntry();
        expect( JSONData.isClockingPaid( clocking ) ).toBeTruthy();
        expect( JSONData.isClockingUnpaid( clocking ) ).toBeFalsy();
    });

    /**
     * Is close out day required tests
     */
    it( "Is close out day required tests", function () {
        var startTime = "2013-01-05T08:00:00.000Z";

        // Verify when there are no unclosed clockings
        expect( JSONData.isCloseOutDayRequired( true ) ).toBeFalsy();
        expect( JSONData.isCloseOutDayRequired( false ) ).toBeFalsy();

        // Verify when there is an unclosed clocking from previous day
        Clocking.recordTime( "technicianStatusPartsStaff", startTime );
        expect( JSONData.isCloseOutDayRequired( true ) ).toBeTruthy();
        expect( JSONData.isCloseOutDayRequired( false ) ).toBeFalsy();

        // Verify when unclosed clocking from current day exists
        TestUtil.removeAllClockings();
        Clocking.recordTime( "technicianStatusPaperwork", null );
        expect( JSONData.isCloseOutDayRequired( true ) ).toBeFalsy();
        expect( JSONData.isCloseOutDayRequired( false ) ).toBeTruthy();

        // Logged in clocking returns false
        TestUtil.removeAllClockings();
        Clocking.recordTime( "technicianStatusLoggedIn", null );
        expect( JSONData.isCloseOutDayRequired( true ) ).toBeFalsy();
        expect( JSONData.isCloseOutDayRequired( false ) ).toBeFalsy();
    } );

    /**
     * Is daily update needed tests
     */
    it( "Is daily update needed tests", function () {
        var originalConfig = Config.getConfig();
        var testConfig = Util.clone( originalConfig );
        var dailyUpdateDate;

        // Daily update needed if last daily update property is missing
        expect( JSONData.isDailyUpdateNeeded() ).toBeTruthy();

        // Daily update not needed if last daily update was today
        testConfig.dateTimeDailyUpdate = Util.getISOCurrentTime();
        Config.saveConfiguration( testConfig );
        expect( JSONData.isDailyUpdateNeeded() ).toBeFalsy();

        // Daily update needed if last update was yesterday;
        dailyUpdateDate = new Date( ( new Date( new Date().setHours( 0, 0, 0, 0 ) ) ) - ( 24 * 60 * 60 * 1000 ) );
        testConfig.dateTimeDailyUpdate = dailyUpdateDate.toISOString();
        Config.saveConfiguration( testConfig );
        expect( JSONData.isDailyUpdateNeeded() ).toBeTruthy();

        // Restore original configuration when these tests are done
        Config.saveConfiguration( originalConfig );
    } );

    /**
     * Is equipment under warranty tests
     */
    it( "Is equipment under warranty tests", function () {
        var testEquipment = {
            warrantyExpirationDate: null
        };
        // Test handling of invalid parameters
        expect( function() {
            JSONData.isEquipmentUnderWarranty();
        }).toThrow( "JSONData.isEquipmentUnderWarranty: Required parameter equipment is undefined" );

        // Check missing expiration date
        expect( JSONData.isEquipmentUnderWarranty( testEquipment ) ).toBeFalsy();

        // Check expired warranty date
        testEquipment.warrantyExpirationDate = "2010-02-07T13:00:56.877Z";
        expect( JSONData.isEquipmentUnderWarranty( testEquipment ) ).toBeFalsy();

        // Check unexpired warranty date
        testEquipment.warrantyExpirationDate = "2030-02-07T13:00:56.877Z";
        expect( JSONData.isEquipmentUnderWarranty( testEquipment ) ).toBeTruthy();
    } );

    /**
     * Is first clocking of the day tests
     */
    it( "Is first clocking of the day tests", function () {
        var startTime = "2013-01-06T08:00:00.000Z";

        // No clockings returns true
        expect( JSONData.isFirstClockingOfTheDay() ).toBeTruthy();

        // Logged in status only returns true
        Clocking.recordTime( "technicianStatusLoggedIn", null );
        expect( JSONData.isFirstClockingOfTheDay() ).toBeTruthy();

        // Presence of clocking from previous day only returns true
        TestUtil.removeAllClockings();
        Clocking.recordTime( "technicianStatusNoPay", startTime );
        expect( JSONData.isFirstClockingOfTheDay() ).toBeTruthy();

        // Presence of clocking from current day returns false
        TestUtil.removeAllClockings();
        Clocking.recordTime( "technicianStatusVehicleMaintenance", null );
        expect( JSONData.isFirstClockingOfTheDay() ).toBeFalsy();
    } );

    /**
     * Is lunch break short tests
     */
    it( "Is lunch break short tests", function () {
        var startTime = new Date();
        // Exception thrown if current status is not lunch
        expect( function() {
            JSONData.isLunchBreakShort();
        } ).toThrow( "JSONData.isLunchBreakShort: Current clocking status is not technicianStatusLunch" );

        // Lunch starting now will always be short
        Clocking.recordTime( "technicianStatusLunch", null );
        expect( JSONData.isLunchBreakShort() ).toBeTruthy();

        // Lunch starting 2 hours ago is not short
        TestUtil.removeAllClockings();
        startTime.setHours( startTime.getHours() - 2 );
        Clocking.recordTime( "technicianStatusLunch", startTime.toISOString() );
        expect( JSONData.isLunchBreakShort() ).toBeFalsy();
    } );

    /**
     * Is periodic JSON feed running tests
     */
    it( "Is periodic JSON feed running tests", function () {
        expect( JSONData.isPeriodicJSONFeedUpdateRunning() ).toBeFalsy();
    } );

    /**
     * Is PM before cutoff date tests?
     */
    it( "Is PM before cutoff date tests?", function () {
        var now = new Date();
        var dueDate;
        var pmSchedule = {
            webId: 5640424,
            dateSchedule: now.toISOString(),
            dateOverride: null,
            counter: 0,
            hourmeter: 5930,
            standardJobCodeId: 1974290,
            customerId: 599871,
            equipmentId: 1948574,
            attention: "",
            note: "Test PM Schedule"
        }

        // Test invalid parameter handling
        expect( function() {
            JSONData.isPMBeforeCutoffDate();
        } ).toThrow( "JSONData.isPMBeforeCutoffDate: Required parameter pmSchedule is null or undefined" );
        expect( function() {
            JSONData.isPMBeforeCutoffDate( null );
        } ).toThrow( "JSONData.isPMBeforeCutoffDate: Required parameter pmSchedule is null or undefined" );

        // PM schedule date is today and override date is null
        dueDate = new Date( pmSchedule.dateSchedule );
        dueDate.setHours( 0, 0, 0, 0 );
        if ( dueDate.getTime() == JSONData.getPMCutoffDate() ) {
            expect( JSONData.isPMBeforeCutoffDate( pmSchedule ) ).toBeFalsy();
        } else {
            expect( JSONData.isPMBeforeCutoffDate( pmSchedule ) ).toBeTruthy();
        }

        // PM schedule date comes after cutoff date and override date is null
        pmSchedule.dateSchedule = new Date( now.getFullYear(), now.getMonth() + 2, 0 ).toISOString();
        expect( JSONData.isPMBeforeCutoffDate( pmSchedule ) ).toBeFalsy();

        // PM override date is today and schedule date comes after cutoff date
        pmSchedule.dateOverride = now.toISOString();
        dueDate = new Date( pmSchedule.dateOverride );
        dueDate.setHours( 0, 0, 0, 0 );
        if ( dueDate.getTime() == JSONData.getPMCutoffDate() ) {
            expect( JSONData.isPMBeforeCutoffDate( pmSchedule ) ).toBeFalsy();
        } else {
            expect( JSONData.isPMBeforeCutoffDate( pmSchedule ) ).toBeTruthy();
        }

        // PM override date comes after cutoff date and schedule date comes before cutoff date
        pmSchedule.dateOverride = new Date( now.getFullYear(), now.getMonth() + 2, 0 ).toISOString();
        pmSchedule.dateSchedule = now.toISOString();
        expect( JSONData.isPMBeforeCutoffDate( pmSchedule ) ).toBeFalsy();
        // PM override date comes after cutoff date and schedule date comes after cutoff date
        pmSchedule.dateOverride = new Date( now.getFullYear(), now.getMonth() + 2, 0 ).toISOString();
        pmSchedule.dateSchedule = new Date( now.getFullYear(), now.getMonth() + 2, 0 ).toISOString();
        expect( JSONData.isPMBeforeCutoffDate( pmSchedule ) ).toBeFalsy();
    } );
    
    /**
     * Is post locally saved data running tests
     */
    it( "Is post locally saved data running tests", function () {
        expect( JSONData.isPostLocallySavedDataRunning() ).toBeFalsy();
    } );

    /**
     * Is standard job code valid tests
     */
    it( "Is standard job code valid tests", function () {
        var validPMCode = {
            "webId": 1972842,
            "standardJobCodeManufacturerId": 5,
            "jobCode": "PM",
            "completeJobCode": "PM",
            "timeFrequency": null,
            "timeFrequencyType": 0,
            "active": true,
            "counter": null,
            "counterFrequency": null,
            "counterType": 0,
            "description": "PLANNED MAINTEN",
            "notes": "Planned Maintenance",
            "parentId": null
        };
        var validRepairCode = {
            "webId": 1984469,
            "standardJobCodeManufacturerId": 5,
            "jobCode": "A",
            "completeJobCode": "7107A",
            "timeFrequency": null,
            "timeFrequencyType": 0,
            "active": true,
            "counter": null,
            "counterFrequency": null,
            "counterType": 0,
            "description": "ADJUSTED",
            "notes": "Adjusted Drive Tires",
            "parentId": 1978250
        };
        var xcode = {
            "webId": 7876604,
            "standardJobCodeManufacturerId": 5,
            "jobCode": "04",
            "completeJobCode": "X004",
            "timeFrequency": null,
            "timeFrequencyType": 0,
            "active": true,
            "counter": null,
            "counterFrequency": null,
            "counterType": 0,
            "description": "CM WHL_TIRE",
            "notes": "CM WHL_TIRE",
            "parentId": 1972844
        };
        var invalidMfgCode = {
            "webId": 17338540,
            "standardJobCodeManufacturerId": 6,
            "jobCode": "A013",
            "completeJobCode": "A013",
            "timeFrequency": null,
            "timeFrequencyType": 0,
            "active": false,
            "counter": null,
            "counterFrequency": null,
            "counterType": 0,
            "description": " ARM MOUNT SHAFT",
            "notes": "",
            "parentId": null
        };

        // Missing / invalid parameter returns false
        expect( JSONData.isStandardJobCodeValid() ).toBeFalsy();
        expect( JSONData.isStandardJobCodeValid( "INVALID" ) ).toBeFalsy();

        // Valid codes return true
        expect( JSONData.isStandardJobCodeValid( validPMCode ) ).toBeTruthy();
        expect( JSONData.isStandardJobCodeValid( validRepairCode ) ).toBeTruthy();

        // Invalid codes return false
        expect( JSONData.isStandardJobCodeValid( xcode ) ).toBeFalsy();
        expect( JSONData.isStandardJobCodeValid( invalidMfgCode ) ).toBeFalsy();
    } );

    /**
     * Is stock area on van tests
     */
    it( "Is stock area on van tests", function () {
        // Invalid stock area ID returns false
        expect( JSONData.isStockAreaOnVan( 10 ) ).toBeFalsy();
        // Test valid stock area IDs
        expect( JSONData.isStockAreaOnVan( 1 ) ).toBeFalsy();
        expect( JSONData.isStockAreaOnVan( 2 ) ).toBeTruthy();
    } );

    /**
     * Is technician traveling tests
     */
    it( "Is technician traveling tests", function () {
        // This test needs a customer object with a name property
        var customer = {
            webId : 1,
            name : "TestCustomer"
        };
        JSONData.saveJSON( "customers", customer, true );
        testWorkOrders[0].customerId = 1;
        JSONData.saveJSON( "workOrders", testWorkOrders[0], true );

        // Default state is not traveling
        expect( JSONData.isTechnicianTraveling() ).toBeFalsy();
        // Setting tech status to traveling = traveling
        JSONData.setWorkOrderIdForClockingChange( testWorkOrderIds[0] );
        Clocking.recordTime( "technicianStatusTraveling", null );
        expect( JSONData.isTechnicianTraveling() ).toBeTruthy();
        // Setting tech status to parts run = traveling
        TestUtil.removeAllClockings();
        JSONData.setWorkOrderIdForClockingChange( testWorkOrderIds[0] );
        Clocking.recordTime( "technicianStatusPartsRun", null );
        expect( JSONData.isTechnicianTraveling() ).toBeTruthy();
        // Changing clocking status to productive = not traveling
        JSONData.setWorkOrderIdForClockingChange( testWorkOrderIds[0] );
        Clocking.recordTime( "technicianStatusProductive", null );
        expect( JSONData.isTechnicianTraveling() ).toBeFalsy();

        JSONData.deleteJSON( "customers", 1 );
    } );

    /**
     * Load JSON tests
     */
    it( "Load JSON tests", function () {
        var loadedData = null;
        var loadInvalidUrlComplete = false;
        var loadValidUrlComplete = false;
        var url = "../assets/www/json/workOrders.json";

        // Test handling of invalid parameters
        expect( function() {
            JSONData.loadJSON( null, null, null );
        } ).toThrow( "JSONData.loadJSONFile: Required parameters url is null or undefined" );

        // Testing handling of invalid URL
        runs( function() {
            JSONData.loadJSON( "../invalidUrl/invalid.json", null, function() {
                loadInvalidUrlComplete = true;
            });
        });
        waitsFor( function() {
            return loadInvalidUrlComplete;
        }, "", 5000 );
        runs( function() {
            expect( loadInvalidUrlComplete ).toBeTruthy();
        });

        // Test loading of valid URL
        runs( function() {
            JSONData.loadJSON( url, function( data ) {
                loadedData = data;
                loadValidUrlComplete = true;
            }, null );
        });
        waitsFor( function() {
            return loadValidUrlComplete;
        }, "", 5000 );
        runs( function() {
            expect( loadValidUrlComplete ).toBeTruthy();
            expect( _.isObject( loadedData ) ).toBeTruthy();
            expect( loadedData.success ).toBeTruthy();
            expect( loadedData.total ).toBeGreaterThan( 0 );
            expect( _.isArray( loadedData.workOrders ) ).toBeTruthy();
            expect( loadedData.workOrders.length ).toBeGreaterThan( 0 );
            expect( loadedData.workOrders.length ).toBe( loadedData.total );
        });
    } );

    /**
     * Load JSON data into local store tests
     */
    it( "Load JSON data into local store tests", function () {
        // Save the current configuration for restore later
        var jsonFeedUpdateComplete = false;
        var oldConfig = Config.getConfig();
        var testConfig = Util.clone( oldConfig );

        // There are 2 feeds being tested.  When both complete, this
        // function will be executed.
        var updateCompleteFn = _.after( 2, function() {
            jsonFeedUpdateComplete = true;
            // Restore the previously saved configuration
            Config.saveConfiguration( oldConfig );
        });

        // Create test config with JSON feed URLs that point to the test JSONs
        testConfig.middleTierBaseUrl = "./LoadJSONDataIntoLocalStoreTest";
        testConfig.middleTierVersion = "";
        testConfig.jsonFeedUpdateUrlParameter = "";
        testConfig.jsonDatabaseFeeds = [];
        testConfig.jsonLocalStoreFeeds = [
            {
                name: "pmSchedules",
                url: "pmSchedule.json",
                updateSupported: true,
                readOnly: false,
                dateTimeUpdated: ""
            },
            {
                name: "workOrders",
                url: "workOrder.json",
                updateSupported: true,
                readOnly: false,
                dateTimeUpdated: ""
            }
        ];
        Config.saveConfiguration( testConfig );

        JSONData.setPageSpecificPeriodicUpdateCompleteFn( function( dataType ) {
            if ( dataType ) {
                debug && console.log( "LoadJSONDataIntoLocalStoreTest: " + dataType + " test feed completed" );
                updateCompleteFn();
            }
        });

        runs( function () {
            JSONData.getPeriodicJSONFeedUpdates( false );
        } );
        waitsFor( function() {
            return jsonFeedUpdateComplete;
        }, "", 5000 );
        runs( function () {
            var pmSchedule;
            var workOrder;

            // Check async test result here
            expect( jsonFeedUpdateComplete ).toBeTruthy();
            // Number of work orders in local storage will include 5 created above in beforeEach
            // plus valid work orders inside test workOrder.json data.
            expect( JSONData.getObjectsByDataType( "workOrders" ).length ).toBe( 8 );
            expect( JSONData.getObjectsByDataType( "pmSchedules" ).length ).toBe( 1 );

            // Verify that work order ID 50000 with all supporting information was saved
            workOrder = JSONData.getObjectById( "workOrders", 500000, null );
            expect( _.isObject( workOrder ) ).toBeTruthy();

            // Verify that saved work order ID 800000 with deleted lines does not include deleted lines
            workOrder = JSONData.getObjectById( "workOrders", 800000, null );
            expect( _.isObject( workOrder ) ).toBeTruthy();
            expect( workOrder.workOrderSegments[0].workOrderLines.length ).toBe( 2 );
            expect( workOrder.workOrderSegments[0].workOrderLines[0].webId ).toBe( 800001 );
            expect( workOrder.workOrderSegments[0].workOrderLines[1].webId ).toBe( 800003 );

            // Verify that work order ID 900000 with null equipment ID and null standard job code ID was saved
            workOrder = JSONData.getObjectById( "workOrders", 900000, null );
            expect( _.isObject( workOrder ) ).toBeTruthy();
            expect( workOrder.workOrderSegments[0].equipmentId ).toBeNull();
            expect( workOrder.workOrderSegments[0].standardJobCodeId ).toBeNull();

            // Verify that PM schedule ID 50000 with all supporting information was saved
            pmSchedule = JSONData.getObjectById( "pmSchedules", 500000, null );
            expect( _.isObject( pmSchedule ) ).toBeTruthy();
        } );
    });

    /**
     * Save clocking status tests
     */
    it( "Save clocking status tests", function () {
        var clocking;
        var startTime = "2013-01-07T08:00:00.000Z";

        // Test handling of invalid parameters
        expect( function() {
            JSONData.saveClockingStatus();
        } ).toThrow( "JSONData.saveClockingStatus: One or more required parameters (newClockingStatus, startTime) are undefined or empty" );
        expect( function() {
            JSONData.saveClockingStatus( "technicianStatusDPTraining" );
        } ).toThrow( "JSONData.saveClockingStatus: One or more required parameters (newClockingStatus, startTime) are undefined or empty" );
        expect( function() {
            JSONData.saveClockingStatus( null, startTime );
        } ).toThrow( "JSONData.saveClockingStatus: One or more required parameters (newClockingStatus, startTime) are undefined or empty" );

        JSONData.saveClockingStatus( "technicianStatusDPTraining", startTime );
        clocking = JSONData.getOpenTimeEntry();
        expect( clocking.timeStart ).toBe( startTime );
        expect( clocking.technicianStatus ).toBe( JSONData.TECHNICIAN_STATUS_NON_PRODUCTIVE );
    } );

    /**
     * Set unsaved changes tests
     */
    it( "Set unsaved changes tests", function () {
        expect( window.localStorage.getItem( UIFrame.LS_UNSAVED_CHANGES ) ).toBeFalsy();
        JSONData.setUnsavedChanges( true, null );
        expect( window.localStorage.getItem( UIFrame.LS_UNSAVED_CHANGES ) ).toBeTruthy();
        JSONData.setUnsavedChanges( false, null );
        expect( window.localStorage.getItem( UIFrame.LS_UNSAVED_CHANGES ) ).toBeFalsy();
    } );

    /**
     * Set skip JSON feed update tests
     */
    it( "Set skip JSON feed update tests", function () {
        // By default, skipping is false
        expect( JSONData.skipJSONFeedUpdate() ).toBeFalsy();
        // Setting skip tests
        JSONData.setSkipJSONFeedUpdate( true );
        expect( JSONData.skipJSONFeedUpdate() ).toBeTruthy();
        JSONData.setSkipJSONFeedUpdate( false );
        expect( JSONData.skipJSONFeedUpdate() ).toBeFalsy();
    } );

    /**
     * Reset local storage tests
     * NOTE: This test MUST be last inside this spec
     */
    it( "Reset local storage tests", function () {
        JSONData.resetLocalStorage();
        // Three items should be present inside local storage after a reset
        expect( window.localStorage.length ).toBe( 3 );
        expect( _.isObject( Config.getConfig() ) ).toBeTruthy();
    } );
});
