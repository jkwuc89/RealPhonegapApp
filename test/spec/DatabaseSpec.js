/**
 * Test spec for Database module
 */
describe( "Database", function () {
    /**
     * Create and populate equipment table tests
     */
    it( "Create and populate equipment table tests", function () {
        var createAndPopulateTableComplete = false;
        var equipmentData;
        var loadJSONDataComplete = false;
        var rowCount = 0;
        var selectCountComplete = false;

        // Get the data to load into the table
        runs( function () {
            JSONData.loadJSON( "../assets/www/json/equipment.json", function( data ) {
                equipmentData = data;
                loadJSONDataComplete = true;
            }, null );
        } );
        waitsFor( function () {
            return loadJSONDataComplete;
        }, "", 5000 );
        runs( function () {
            // Check async test result here
            expect( loadJSONDataComplete ).toBeTruthy();
        } );

        // Create and load the table
        runs( function () {
            MobileDb.createAndPopulateTable( equipmentData, function() {
                createAndPopulateTableComplete = true;
            }, null );
        } );
        waitsFor( function () {
            return createAndPopulateTableComplete;
        }, "", 5000 );
        runs( function () {
            // Check async test result here
            expect( createAndPopulateTableComplete ).toBeTruthy();
        } );

        runs( function () {
            MobileDb.selectData( "SELECT COUNT(*) FROM equipment", null, function( results ) {
                rowCount = results[0]["COUNT(*)"];
                selectCountComplete = true;
            });
        } );
        waitsFor( function () {
            return selectCountComplete;
        }, "", 5000 );
        runs( function () {
            // Check async test result here
            expect( selectCountComplete ).toBeTruthy();
            expect( rowCount ).toBe( equipmentData.total );
        } );
    } );

    /**
     * Create and populate inventory table tests
     */
    it( "Create and populate inventory table tests", function () {
        var createAndPopulateTableComplete = false;
        var inventoryData;
        var inventoryObjects;
        var loadJSONDataComplete = false;
        var rowCount = 0;
        var selectCountComplete = false;

        // Get the data to load into the table
        runs( function () {
            JSONData.loadJSON( "../assets/www/json/inventory.json", function( data ) {
                inventoryData = data;
                loadJSONDataComplete = true;
            }, null );
        } );
        waitsFor( function () {
            return loadJSONDataComplete;
        }, "", 5000 );
        runs( function () {
            // Check async test result here
            expect( loadJSONDataComplete ).toBeTruthy();
        } );

        // Create and load the table
        runs( function () {
            MobileDb.createAndPopulateTable( inventoryData, function() {
                createAndPopulateTableComplete = true;
            }, null );
        } );
        waitsFor( function () {
            return createAndPopulateTableComplete;
        }, "", 5000 );
        runs( function () {
            // Check async test result here
            expect( createAndPopulateTableComplete ).toBeTruthy();
        } );

        runs( function () {
            MobileDb.selectData( "SELECT COUNT(*) FROM inventory", null, function( results ) {
                rowCount = results[0]["COUNT(*)"];
                selectCountComplete = true;
            });
        } );
        waitsFor( function () {
            return selectCountComplete;
        }, "", 5000 );
        runs( function () {
            // Check async test result here
            expect( selectCountComplete ).toBeTruthy();
            // Filter inventory JSON data to match filter used when
            // its table is created and then, compare the counts
            inventoryObjects = _.filter( inventoryData.inventory, function( inventoryInList ) {
                return ( JSONData.isInventoryValid( inventoryInList ) );
            });
            expect( rowCount ).toBe( inventoryObjects.length );
        } );
    } );

    /**
     * Create and populate standardJobCodes table tests
     */
    it( "Create and populate standardJobCodes table tests", function () {
        var createAndPopulateTableComplete = false;
        var standardJobCodesData;
        var standardJobCodeObjects;
        var loadJSONDataComplete = false;
        var rowCount = 0;
        var selectCountComplete = false;

        // Get the data to load into the table
        runs( function () {
            JSONData.loadJSON( "../assets/www/json/standardJobCodes.json", function( data ) {
                standardJobCodesData = data;
                loadJSONDataComplete = true;
            }, null );
        } );
        waitsFor( function () {
            return loadJSONDataComplete;
        }, "", 5000 );
        runs( function () {
            // Check async test result here
            expect( loadJSONDataComplete ).toBeTruthy();
        } );

        // Create and load the table
        runs( function () {
            MobileDb.createAndPopulateTable( standardJobCodesData, function() {
                createAndPopulateTableComplete = true;
            }, null );
        } );
        waitsFor( function () {
            return createAndPopulateTableComplete;
        }, "", 5000 );
        runs( function () {
            // Check async test result here
            expect( createAndPopulateTableComplete ).toBeTruthy();
        } );

        runs( function () {
            MobileDb.selectData( "SELECT COUNT(*) FROM standardJobCodes", null, function( results ) {
                rowCount = results[0]["COUNT(*)"];
                selectCountComplete = true;
            });
        } );
        waitsFor( function () {
            return selectCountComplete;
        }, "", 5000 );
        runs( function () {
            var xcodesInFeed;
            var xcodesInLocalStorage;

            // Check async test result here
            expect( selectCountComplete ).toBeTruthy();
            // Filter standardJobCode JSON data to match filter used when
            // its table is created and then, compare the counts
            standardJobCodeObjects = _.filter( standardJobCodesData.standardJobCodes, function( codeInList ) {
                return ( JSONData.isStandardJobCodeValid( codeInList ) );
            });
            expect( rowCount ).toBe( standardJobCodeObjects.length );

            // Verify that X codes got into local storage
            xcodesInFeed = _.filter( standardJobCodesData.standardJobCodes, function( codeInList ) {
                return ( codeInList.completeJobCode.indexOf( JSONData.XCODE_STANDARD_JOB_CODE_PREFIX ) == 0 &&
                         codeInList.standardJobCodeManufacturerId == JSONData.REPAIR_CODES_MFG_ID && codeInList.active );
            });
            xcodesInLocalStorage = JSONData.getObjectsByDataType( JSONData.XCODE_DATATYPE );
            expect( xcodesInFeed.length - 1 ).toBe( xcodesInLocalStorage.length );
        } );
    } );

    /**
     * Create and populate stockAreas table tests
     */
    it( "Create and populate stockAreas table tests", function () {
        var createAndPopulateTableComplete = false;
        var stockAreasData;
        var loadJSONDataComplete = false;
        var rowCount = 0;
        var selectCountComplete = false;

        // Get the data to load into the table
        runs( function () {
            JSONData.loadJSON( "../assets/www/json/stockAreas.json", function( data ) {
                stockAreasData = data;
                loadJSONDataComplete = true;
            }, null );
        } );
        waitsFor( function () {
            return loadJSONDataComplete;
        }, "", 5000 );
        runs( function () {
            // Check async test result here
            expect( loadJSONDataComplete ).toBeTruthy();
        } );

        // Create and load the table
        runs( function () {
            MobileDb.createAndPopulateTable( stockAreasData, function() {
                createAndPopulateTableComplete = true;
            }, null );
        } );
        waitsFor( function () {
            return createAndPopulateTableComplete;
        }, "", 5000 );
        runs( function () {
            // Check async test result here
            expect( createAndPopulateTableComplete ).toBeTruthy();
        } );

        runs( function () {
            MobileDb.selectData( "SELECT COUNT(*) FROM stockAreas", null, function( results ) {
                rowCount = results[0]["COUNT(*)"];
                selectCountComplete = true;
            });
        } );
        waitsFor( function () {
            return selectCountComplete;
        }, "", 5000 );
        runs( function () {
            // Check async test result here
            expect( selectCountComplete ).toBeTruthy();
            expect( rowCount ).toBe( stockAreasData.total );
        } );
    } );

    /**
     * Update product table tests
     */
    it( "Update product table tests", function () {
        var loadJSONDataComplete = false;
        var productUpdateData;
        var selectNewComplete = false;
        var selectResults;
        var selectUpdatedComplete = false;
        var updateTableComplete = false;

        // Get the data to load into the table
        runs( function () {
            JSONData.loadJSON( "../assets/www/json/products_update.json", function( data ) {
                productUpdateData = data;
                loadJSONDataComplete = true;
            }, null );
        } );
        waitsFor( function () {
            return loadJSONDataComplete;
        }, "", 5000 );
        runs( function () {
            // Check async test result here
            expect( loadJSONDataComplete ).toBeTruthy();
        } );

        // Update the products table
        runs( function () {
            MobileDb.updateTable( productUpdateData, function() {
                updateTableComplete = true;
            });
        } );
        waitsFor( function () {
            return updateTableComplete;
        }, "", 5000 );
        runs( function () {
            // Check async test result here
            expect( updateTableComplete ).toBeTruthy();
        } );

        // Select updated part from the DB and verify that the result contains the updated part
        runs( function() {
            var sqlParms = [];
            sqlParms.push( JSONData.PRODUCT_TYPE_PART );
            sqlParms.push( "000675" );
            MobileDb.selectData( MobileDb.SQL_SELECT_PRODUCTS_BY_TYPE_AND_CODE, sqlParms, function( productRows ) {
                selectResults = productRows;
                // Setting complete to true signals waitsFor below to continue onto runs below it.
                selectUpdatedComplete = true;
            });
        });

        // Wait for selectData to finish
        waitsFor( function() {
            return selectUpdatedComplete;
        }, "", 5000 );

        // Check the results
        runs( function() {
            expect( selectResults.length ).toBe( 1 );
            expect( selectResults[0].productCode ).toBe( "000675" );
            expect( selectResults[0].description ).toBe( "BOTTOM BAR END BLOCK - UPDATED" );
        });

        // Select new part from the DB and verify that the result contains the updated part
        runs( function() {
            var sqlParms = [];
            sqlParms.push( JSONData.PRODUCT_TYPE_PART );
            sqlParms.push( "99999-99999-99" );
            MobileDb.selectData( MobileDb.SQL_SELECT_PRODUCTS_BY_TYPE_AND_CODE, sqlParms, function( productRows ) {
                selectResults = productRows;
                // Setting complete to true signals waitsFor below to continue onto runs below it.
                selectNewComplete = true;
            });
        });

        // Wait for selectData to finish
        waitsFor( function() {
            return selectNewComplete;
        }, "", 5000 );

        // Check the row count
        runs( function() {
            expect( selectResults.length ).toBe( 1 );
            expect( selectResults[0].productCode ).toBe( "99999-99999-99" );
            expect( selectResults[0].description ).toBe( "NEW PART" );
        });
    } );

    /**
     * Select data tests
     */
    it( "Select data tests", function () {
        var validProductComplete = false;
        var invalidProductComplete = false;
        var selectResults;
        // Select valid part from DB and verify that result contains product data
        runs( function() {
            var sqlParms = [];
            sqlParms.push( JSONData.PRODUCT_TYPE_PART );
            sqlParms.push( "050000-010" );
            MobileDb.selectData( MobileDb.SQL_SELECT_PRODUCTS_BY_TYPE_AND_CODE, sqlParms, function( productRows ) {
                selectResults = productRows;
                // Setting complete to true signals waitsFor below to continue onto runs below it.
                validProductComplete = true;
            });
        });

        // Wait for selectData to finish
        waitsFor( function() {
            return validProductComplete;
        }, "The row count returned should be greater than 0", 5000 );

        // Check the row count
        runs( function() {
            expect( selectResults.length ).toBeGreaterThan( 0 );
            expect( selectResults[0].productCode ).toBe( "050000-010" );
        });

        // Select invalid part from DB and verify that result contains 0 rows
        runs( function() {
            var sqlParms = [];
            sqlParms.push( JSONData.PRODUCT_TYPE_PART );
            sqlParms.push( "BogusPartNumber" );
            MobileDb.selectData( MobileDb.SQL_SELECT_PRODUCTS_BY_TYPE_AND_CODE, sqlParms, function( productRows ) {
                selectResults = productRows;
                // Setting complete to true signals waitsFor below to continue onto runs below it.
                invalidProductComplete = true;
            });
        });

        // Wait for selectData to finish
        waitsFor( function() {
            return invalidProductComplete;
        }, "The row count returned should be 0", 5000 );

        // Check the row count
        runs( function() {
            expect( selectResults.length ).toBe( 0 );
        });
    } );

    /**
     * Get equipment from database for customer tests
     */
    it( "Get equipment from database for customer tests", function () {
        var testQuery1Complete = false;
        var query1Result = null;
        var testQuery2Complete = false;
        var query2Result = null;
        var testQuery3Complete = false;
        var query3Result = null;
        var testQuery4Complete = false;
        var query4Result = null;

        // Invalid / missing parameters result in exception
        expect( function() {
            JSONData.getEquipmentFromDatabaseForCustomer();
        } ).toThrow( "JSONData.getEquipmentFromDatabaseForCustomer: One or more required parameters (customerId, loadCallback) are missing or invalid" );
        expect( function() {
            JSONData.getEquipmentFromDatabaseForCustomer( 16264339 );
        } ).toThrow( "JSONData.getEquipmentFromDatabaseForCustomer: One or more required parameters (customerId, loadCallback) are missing or invalid" );
        expect( function() {
            JSONData.getEquipmentFromDatabaseForCustomer( 16264339, "NOTAFUNCTION" );
        } ).toThrow( "JSONData.getEquipmentFromDatabaseForCustomer: One or more required parameters (customerId, loadCallback) are missing or invalid" );

        // Valid query returns 123 equipment for customer ID 16264339
        runs( function () {
            JSONData.getEquipmentFromDatabaseForCustomer( 16264339, function( equipment ) {
                query1Result = equipment;
                testQuery1Complete = true;
            });
        } );
        waitsFor( function () {
            return testQuery1Complete;
        }, "", 1000 );
        runs( function () {
            expect( testQuery1Complete ).toBeTruthy();
            expect( query1Result.length ).toBe( 123 );
        } );

        // Valid query using string ID returns 1014 equipment for customer ID 17091636
        // because one of the equipment also has a valid rental customer ID
        runs( function () {
            JSONData.getEquipmentFromDatabaseForCustomer( "17091636", function( equipment ) {
                query2Result = equipment;
                testQuery2Complete = true;
            });
        } );
        waitsFor( function () {
            return testQuery2Complete;
        }, "", 1000 );
        runs( function () {
            expect( testQuery2Complete ).toBeTruthy();
            expect( query2Result.length ).toBe( 1014 );
        } );

        // Valid query using string ID returns 2 equipment for rental customer ID 99999999
        runs( function () {
            JSONData.getEquipmentFromDatabaseForCustomer( 99999999, function( equipment ) {
                query3Result = equipment;
                testQuery3Complete = true;
            });
        } );
        waitsFor( function () {
            return testQuery3Complete;
        }, "", 1000 );
        runs( function () {
            expect( testQuery3Complete ).toBeTruthy();
            expect( query3Result.length ).toBe( 2 );
        } );

        // Valid query using ID with no equipment
        runs( function () {
            JSONData.getEquipmentFromDatabaseForCustomer( 1, function( equipment ) {
                query4Result = equipment;
                testQuery4Complete = true;
            });
        } );
        waitsFor( function () {
            return testQuery4Complete;
        }, "", 1000 );
        runs( function () {
            expect( testQuery4Complete ).toBeTruthy();
            expect( query4Result.length ).toBe( 0 );
        } );
    } );
} );
