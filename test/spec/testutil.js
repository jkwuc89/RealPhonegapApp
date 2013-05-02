/**
 * testutil.js
 */

"use strict";

/**
 * TestUtil
 * Test utility functions
 */
var TestUtil = function() {

    // Create the logon JSON data required by the WorkOrder module
    var TEST_LOGON_JSON = {
        success: true,
        authToken: "SGRUSEVNdklieEJQcm9TVmVkVnlSZz09OjE4aXZOUjJibHd6M3ZxYVJJc2tKb0E9PQ",
        tokenExpiration: Util.getISOCurrentTime(),
        webUserId: 1,
        webId: 1,
        username: "workordertests@crown.com",
        password: "password"
    };

    /**
     * Create / save test logon
     */
    function createTestLogon() {
        // Create test logon
        JSONData.saveJSON( JSONData.JSON_DATATYPE_LOGON, TEST_LOGON_JSON, true );
    }

    /**
     * Remove all clockings
     */
    function removeAllClockings() {
        JSONData.deleteDataType( "technicianClocking" );
    }

    /**
     * Remove test data
     */
    function removeTestData() {
        JSONData.deleteDataType( "customers" );
        JSONData.deleteDataType( "pmSchedules" );
        JSONData.deleteDataType( "workOrders" );
        JSONData.deleteDataType( "testObjects" );
        JSONData.deleteDataType( "xcodes" );
        window.localStorage.removeItem( "stockAreas" );
        JSONData.deleteJSON( JSONData.JSON_DATATYPE_LOGON, 1 );
        window.localStorage.removeItem( "webUsers" );
        window.localStorage.removeItem( "serviceTrucks" );
        removeAllClockings();
    }

    return {
        "createTestLogon"               : createTestLogon,
        "removeAllClockings"            : removeAllClockings,
        "removeTestData"                : removeTestData
    }

}();
