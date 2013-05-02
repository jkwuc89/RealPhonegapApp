/**
 * database.js
 */

"use strict";

/**
 * MobileDb
 * Using the Revealing Module JavaScript pattern to encapsulate
 * the mobile database functionality into an object
 */
var MobileDb = function() {

    var db = null;
    var EQUIPMENT_TABLE         = "equipment";
    var INVENTORY_TABLE         = "inventory";
    var PRODUCTS_TABLE          = "products";
    var STANDARDJOBCODES_TABLE  = "standardJobCodes";
    var STOCKAREAS_TABLE        = "stockAreas";

    // SQL queries
    var SQL_CREATE_TABLE        = "CREATE TABLE IF NOT EXISTS ";
    var SQL_DELETE_ALL_ROWS     = "DELETE FROM ";
    var SQL_DELETE_ROW_BY_WEBID = "DELETE FROM tableName WHERE webId = ";
    var SQL_INSERT_INTO         = "INSERT INTO ";
    var SQL_SELECT_ALL_FROM_TABLE = "SELECT * FROM tableName";
    var SQL_SELECT_ONE_FROM_TABLE = "SELECT * FROM tableName WHERE webId = ? LIMIT 1";

    var SQL_CREATE_PRODUCTS =
        SQL_CREATE_TABLE + PRODUCTS_TABLE + ' (webId PRIMARY KEY, manufacturer, productCode, description, productType, commodityCode, returnable)';
    var SQL_SELECT_PRODUCTS_BY_TYPE_AND_CODE =
        'SELECT * FROM ' + PRODUCTS_TABLE + ' WHERE productType = ? AND productCode = ?';
    var SQL_SELECT_PRODUCTS_BY_TYPE_CODE_AND_MFG =
        'SELECT * FROM ' + PRODUCTS_TABLE + ' WHERE productType = ? AND productCode = ? AND manufacturer = ?';

    var SQL_CREATE_INVENTORY =
        SQL_CREATE_TABLE + INVENTORY_TABLE + ' (webId PRIMARY KEY, productId, manufacturer, productCode, stockAreaId, binName, mainBin, quantity, minimum, maximum)';
    var SQL_INSERT_INTO_INVENTORY =
        SQL_INSERT_INTO + INVENTORY_TABLE + ' VALUES( ';
    var SQL_SELECT_INVENTORY =
        'SELECT * FROM ' + INVENTORY_TABLE;
    var SQL_UPDATE_INVENTORY_QUANTITY =
        'UPDATE ' + INVENTORY_TABLE + ' SET quantity=quantityValue where webId=webIdValue';
    var SQL_SELECT_INVENTORY_PRODUCTS_STOCKAREAS =
        'select i.*, p.description, s.webId as stockAreaId, s.name as stockAreaName, s.type as stockAreaType ' +
        'from ' + PRODUCTS_TABLE + ' as p, ' + INVENTORY_TABLE + ' as i, ' + STOCKAREAS_TABLE + ' as s ' +
        'where p.webId = i.productId and i.stockAreaId = s.webId';
    var SQL_SELECT_INVENTORY_PRODUCTS_STOCKAREAS_AVAILABLE =
        'select i.*, p.description, s.webId as stockAreaId, s.name as stockAreaName, s.type as stockAreaType ' +
        'from ' + PRODUCTS_TABLE + ' as p, ' + INVENTORY_TABLE + ' as i, ' + STOCKAREAS_TABLE + ' as s ' +
        'where p.webId = i.productId and p.productType = 1 and i.stockAreaId = s.webId and s.branchId = technicianBranchId and i.webId in (' +
        'select webId from ' + INVENTORY_TABLE + ' where quantity > 0 or minimum > 0 or maximum > 0) order by p.productCode asc';

    var SQL_CREATE_STANDARDJOBCODES =
        SQL_CREATE_TABLE + STANDARDJOBCODES_TABLE + ' (webId PRIMARY KEY, standardJobCodeManufacturerId, completeJobCode, description, jobCode, notes)';
    var SQL_INSERT_INTO_STANDARDJOBCODES =
        SQL_INSERT_INTO + STANDARDJOBCODES_TABLE + ' VALUES( ';

    var SQL_CREATE_STOCKAREAS =
        SQL_CREATE_TABLE + STOCKAREAS_TABLE + ' (webId PRIMARY KEY, type, branchId, departmentId, name )';
    var SQL_INSERT_INTO_STOCKAREAS =
        SQL_INSERT_INTO + STOCKAREAS_TABLE + ' VALUES( ';

    // SQL constants for the EQUIPMENT table
    var SQL_CREATE_EQUIPMENT =
        SQL_CREATE_TABLE + EQUIPMENT_TABLE + ' (webId PRIMARY KEY, internalId, companyId, branchId, departmentId, productId, manufacturer,' +
                                             ' productCode, equipmentGroup, description, serialNumber, addressId, lattitude, longitude, ownerId,' +
                                             ' customerEquipmentId, equipmentStatus, customerOwned, dealerEquipmentId, hourMeter, odometer,' +
                                             ' modelYear, plateNumber, serviceInstructions, notes, warrantyId, warrantyStart, warrantyExpirationDate,' +
                                             ' warrantyDescription, nextPMStandardJobCodeId, nextPMDate, rentalCustomerId, rentalAddress )';
    var SQL_INSERT_INTO_EQUIPMENT =
        SQL_INSERT_INTO + EQUIPMENT_TABLE + ' VALUES( ';
    var SQL_SELECT_EQUIPMENT_BY_CUSTOMER_ID = 'select * from ' + EQUIPMENT_TABLE + ' where (ownerId = ? and rentalCustomerId IS NULL ) OR ' +
                                              ' rentalCustomerId = ?';

    // SQL constants for the PRODUCTS table
    var SQL_INSERT_INTO_PRODUCTS =
        SQL_INSERT_INTO + PRODUCTS_TABLE + ' VALUES( ';

    /**
     * Open the mobile app's local database
     */
    function openDB() {
        debug && console.log( "MobileDb.openDB: Opening DB" );
        if ( db == null ) {
            try {
                db = window.openDatabase( "CrownSFA", "1.0", "CrownSFA", 1024000000 );
                debug && console.log( "MobileDb.openDB: Database opened" );
            } catch ( e ) {
                console.error( "MobileDb.openDB: e is: " + e );
                console.error( "MobileDb.openDB: e.number is: " + (e.number & 0xFFFF) );
                console.error( "MobileDb.openDB: e.description is: " + e.description );
                console.error( "MobileDb.openDB: e.name is: " + e.name );
                console.error( "MobileDb.openDB: e.message is: " + e.message );
            }
        } else {
            debug && console.log( "MobileDb.openDB: DB is already open" );
        }
    }

    /**
     * Execute a SQL statement
     * @param sql
     * @param parameters
     * @param tx
     * @param successCallbackFn
     * @param errorCallbackFn
     */
    function executeSql( sql, parameters, tx, successCallbackFn, errorCallbackFn ) {
        if ( !db ) {
            throw "MobileDb.executeSql: executeSql cannot be called because the database instance is not open. " +
                  "Call openDB() before calling executeSql().";
        }

        // debug && console.log( "MobileDb.executeSql: Executing SQL: " + sql );
        if ( parameters === undefined || parameters == null ) {
            parameters = [];
        }
        if ( successCallbackFn === undefined || successCallbackFn == null ) {
            successCallbackFn = defaultSuccessCallbackFn;
        }
        if ( errorCallbackFn === undefined || errorCallbackFn == null ) {
            errorCallbackFn = defaultErrorCallbackFn;
        }
        // Attempt to use existing transaction if available
        if ( tx === undefined || tx == null ) {
            // debug && console.log( "MobileDb.executeSql: Using new transaction for query" );
            db.transaction( function( txParm ) {
                txParm.executeSql( sql, parameters, successCallbackFn, errorCallbackFn );
            });
        } else {
            // debug && console.log( "MobileDb.executeSql: Using existing transaction for query" );
            tx.executeSql( sql, parameters, successCallbackFn, errorCallbackFn );
        }
    }

    /**
     * Execute all of the SQL statements inside sqlStatements as a batch.  This is typically
     * used to perform multiple create / insert / update / delete operations as one operation.
     * @param sqlStatements - SQL statements to execute
     * @param resultCallback - Result callback function
     * @param errorCallback - Error callback function
     */
    function executeSqlBatch( sqlStatements, resultCallback, errorCallback ) {
        if ( !sqlStatements || sqlStatements.length == 0 ) {
            throw "MobileDb.executeSqlBatch: Required parameter sqlStatements is undefined or empty";
        }
        if ( !db ) {
            throw "MobileDb.executeSqlBatch: Database instance is not open.  Call openDB() before calling this method.";
        }

        // Set up default callbacks
        if ( !resultCallback ) {
            resultCallback = defaultSuccessCallbackFn;
        }
        if ( !errorCallback ) {
            errorCallback = defaultErrorCallbackFn;
        }

        debug && console.log( "MobileDb.executeSqlBatch: Executing " + sqlStatements.length + " statement(s)" );
        db.transaction( function( tx ) {
            _.each( sqlStatements, function( statementInList ) {
                tx.executeSql( statementInList );
            });
        }, errorCallback, resultCallback );
    }

    /**
     * Get the SQL for the specified value
     * @param value
     * @returns String containing SQL snippet suitable for making this value part of an INSERT or an UPDATE
     */
    function getSqlForValue( value ) {
        var sqlSnippet = "";
        //noinspection JSUnresolvedFunction
        if ( _.isString( value ) ) {
            sqlSnippet += ( "'" + value.replace( /\r?\n/g, "&#10;" ).replace( /'/g, "&#39;" ).replace( /\\/g, "" ).replace( /"/g, "&quot;" ) + "'," );
        } else if ( _.isBoolean( value ) ) {
            if ( value ) {
                sqlSnippet += ( 1 + "," );
            } else {
                sqlSnippet += ( 0 + "," );
            }
        } else if ( _.isNull( value ) ) {
            sqlSnippet += "NULL,";
        } else {
            sqlSnippet += ( value + "," );
        }
        return sqlSnippet;
    }

    /**
     * Get the INSERT SQL necessary to insert a row into
     * a table
     * @param dataType
     * @param jsonData
     */
    function getInsertSql( dataType, jsonData ) {
        var insertSql = null;
        var config = Config.getConfig();
        switch ( dataType ) {
            case "inventory" :
                if ( JSONData.isInventoryValid( jsonData ) ) {
                    insertSql = SQL_INSERT_INTO_INVENTORY +
                                jsonData.webId + ', ' +
                                jsonData.product.webId + ', ' +
                                '"' + jsonData.product.manufacturer + '", ' +
                                '"' + jsonData.product.productCode.replace( /\\/g, "" ).replace( /"/g, "&quot;" ) + '", ' +
                                jsonData.stockAreaId + ', ' +
                                '"' + jsonData.binName + '", ' +
                                (jsonData.mainBin ? 1 : 0) + ', ' +
                                jsonData.quantity + ', ' +
                                jsonData.minimum + ', ' +
                                jsonData.maximum + ')';
                }
                break;

            case "standardJobCodes" :
                var description = null;
                // Put standard job X codes into local storage
                if ( ( jsonData.completeJobCode.indexOf( JSONData.XCODE_STANDARD_JOB_CODE_PREFIX ) == 0 ) &&
                     jsonData.completeJobCode.length >= 4 &&
                     jsonData.standardJobCodeManufacturerId == JSONData.REPAIR_CODES_MFG_ID && jsonData.active ) {
                    JSONData.saveJSON( JSONData.XCODE_DATATYPE, jsonData, true );
                } else {
                    // Omit "invalid" standard job codes from the database table
                    if ( JSONData.isStandardJobCodeValid( jsonData ) ) {
                        if ( jsonData.description ) {
                            description = jsonData.description.replace( /\\/g, "" ).replace( /"/g, "&quot;" );
                        } else {
                            description = jsonData.description;
                        }
                        //noinspection JSUnresolvedVariable
                        insertSql = SQL_INSERT_INTO_STANDARDJOBCODES +
                                    jsonData.webId + ', ' +
                                    jsonData.standardJobCodeManufacturerId + ', ' +
                                    '"' + jsonData.completeJobCode + '", ' +
                                    '"' + description + '", ' +
                                    '"' + jsonData.jobCode + '", ';
                        if ( jsonData.notes && jsonData.notes.length > 0 ) {
                            insertSql += '"' + jsonData.notes.replace( /\\/g, "" ).replace( /"/g, "&quot;" ) + '")';
                        } else {
                            insertSql += '"' + jsonData.notes + '")';
                        }

                        // Save generic FM and PM job code webIds into configuration
                        //noinspection JSUnresolvedVariable
                        if ( jsonData.completeJobCode === JSONData.STANDARD_JOB_CODE_FM_COMPLETEJOBCODE ) {
                            config.FMStandardJobCodeWebId = jsonData.webId;
                            Config.saveConfiguration( config );
                        }
                        //noinspection JSUnresolvedVariable
                        if ( jsonData.completeJobCode === JSONData.STANDARD_JOB_CODE_PM_COMPLETEJOBCODE ) {
                            config.PMStandardJobCodeWebId = jsonData.webId;
                            Config.saveConfiguration( config );
                        }
                    }
                }
                break;

            case "stockAreas" :
                insertSql = SQL_INSERT_INTO_STOCKAREAS +
                            jsonData.webId + ', ' +
                            jsonData.type + ', ' +
                            jsonData.branchId + ', ' +
                            jsonData.departmentId + ', ' +
                            '"' + jsonData.name + '")';
                break;

            case "equipment" :
                // Fill in any null objects within the current equipment object
                if ( _.isNull( jsonData.warranty ) ) {
                    jsonData.warranty = {
                        warrantyId : null,
                        warrantyStart : null,
                        expirationDate : null,
                        description : null
                    };
                }
                if ( _.isNull( jsonData.location ) ) {
                    jsonData.location = {
                        lattitude : null,
                        longitude : null
                    };
                }
                if ( _.isNull( jsonData.product ) ) {
                    jsonData.product = {
                        webId : null,
                        manufacturer : null,
                        productCode : null
                    };
                }
                var equipmentValues = _.values( jsonData );
                insertSql = SQL_INSERT_INTO_EQUIPMENT;
                _.each( equipmentValues, function( valueInList ) {
                    if ( _.isObject( valueInList ) ) {
                        _.each( _.values( valueInList ), function( subValueInList ) {
                            insertSql += getSqlForValue( subValueInList );
                        });
                    } else {
                        insertSql += getSqlForValue( valueInList );
                    }
                });
                // Get rid of extra trailing comma and terminate statement with close paren
                insertSql = insertSql.replace( /,$/, "" );
                insertSql += ")";
                break;

            case "products" :
                insertSql = SQL_INSERT_INTO_PRODUCTS +
                    getSqlForValue( jsonData.webId ) +
                    getSqlForValue( jsonData.manufacturer ) +
                    getSqlForValue( jsonData.productCode ) +
                    getSqlForValue( jsonData.description ) +
                    getSqlForValue( jsonData.productType ) +
                    getSqlForValue( jsonData.commodityCode ) +
                    getSqlForValue( jsonData.active );
                // Get rid of extra trailing comma and terminate statement with close paren
                insertSql = insertSql.replace( /,$/, "" );
                insertSql += ")";
                break;
        }
        return insertSql;
    }

    /**
     * Create and populate a table using the specified json data.
     * @param jsonData - JSON data used to populate the table
     * @param successCallback - Success callback function
     * @param errorCallback - Error callback function
     */
    function createAndPopulateTable( jsonData, successCallback, errorCallback ) {
        var dataType;
        debug && console.log( "MobileDb.createAndPopulateTable: Validating parameters" );
        if ( !jsonData ) {
            console.error( "MobileDb.createAndPopulateTable: Required parameter jsonData is null or undefined" );
            throw "MobileDb.createAndPopulateTable: Required parameter jsonData is null or undefined";
        }
        if ( !db ) {
            throw "MobileDb.createAndPopulateTable: Database instance is not open.  Call openDB() before calling this method.";
        }

        // Datatype specific init
        dataType = JSONData.getDataTypeFromJSONFeedData( jsonData );
        debug && console.log( "MobileDb.createAndPopulateTable: JSON datatype = " + dataType );
        var createTableSql = null;
        switch ( dataType ) {
            case "equipment" :
                createTableSql = SQL_CREATE_EQUIPMENT;
                break;

            case "inventory" :
                createTableSql = SQL_CREATE_INVENTORY;
                break;

            case "standardJobCodes" :
                createTableSql = SQL_CREATE_STANDARDJOBCODES;
                break;

            case "stockAreas" :
                createTableSql = SQL_CREATE_STOCKAREAS;
                break;

            default:
                throw "MobileDb.createAndPopulateTable: Table creation/population not supported for JSON datatype " + dataType;
        }

        // Use default callbacks if callback params are undefined
        if ( !successCallback ) {
            successCallback = function() {
                debug && console.log( "MobileDb.createAndPopulateTable: " + dataType + " table creation and population successful" );
            };
        }
        if ( !errorCallback ) {
            errorCallback = defaultErrorCallbackFn;
        }

        // Create SQL batch for creating and populating the table
        debug && console.log( "MobileDb.createAndPopulateTable: Creating SQL batch for " + dataType );
        var sqlBatch = [];
        sqlBatch.push( createTableSql );
        sqlBatch.push( SQL_DELETE_ALL_ROWS + dataType );
        _.each( jsonData[dataType], function( jsonInList ) {
            var insertSql = getInsertSql( dataType, jsonInList );
            if ( insertSql ) {
                sqlBatch.push( insertSql );
            }
        });

        debug && console.log( "MobileDb.createAndPopulateTable: Executing SQL batch for " + dataType );
        executeSqlBatch( sqlBatch, successCallback, errorCallback );
    }

    /**
     * Update a DB table with the specified JSON data.  The update is done by deleting
     * all existing objects and then, inserting the updated objects.
     * @param jsonData - JSON data used to update the table
     * @param successCallback
     */
    function updateTable( jsonData, successCallback ) {
        var dataType;
        if ( !jsonData ) {
            throw "MobileDb.updateTable: Required parameter jsonData is null or undefined";
        }
        if ( !db ) {
            throw "MobileDb.updateTable: Database instance is not open.  Call openDB() before calling this method.";
        }

        var count = jsonData['total'];
        dataType = JSONData.getDataTypeFromJSONFeedData( jsonData );
        debug && console.log( "MobileDb.updateTable: JSON datatype = " + dataType + ", update count = " + count );

        // Use default callbacks if callback params are undefined
        if ( !successCallback ) {
            successCallback = function() {
                debug && console.log( "MobileDb.updateTable: " + dataType + " table update successful" );
            };
        }
        var index = 0;
        var insertSql = "";
        var sqlUpdateBatch = [];
        if ( count > 0 ) {
            // Add DELETE statements for each object inside the jsonData
            debug && console.log( "MobileDb.updateTable: Adding DELETE statements to SQL batch" );
            for ( index = 0; index < count; index++ ) {
                sqlUpdateBatch.push( SQL_DELETE_ROW_BY_WEBID.replace( "tableName", dataType ) +
                                     jsonData[dataType][index].webId );
            }
            // Add INSERT statements for each object inside the jsonData
            debug && console.log( "MobileDb.updateTable: Adding INSERT statements to SQL batch" );
            _.each( jsonData[dataType], function( jsonInList ) {
                insertSql = getInsertSql( dataType, jsonInList );
                if ( insertSql ) {
                    sqlUpdateBatch.push( insertSql );
                }
            });
            // Execute the SQL batch
            debug && console.log( "MobileDb.updateTable: Executing batch to update table " + dataType );
            executeSqlBatch( sqlUpdateBatch,
                // Success callback
                function() {
                    debug && console.log( "MobileDb.updateTable: SQL update batch successful" );
                    // Update complete, call the success callback
                    successCallback();
                },
                // Error callback
                function( err1, err2 ) {
                    console.error( "MobileDb.updateTable: SQL update batch failed" );
                    defaultErrorCallbackFn( err1, err2 );
                    // Update complete, call the success callback
                    successCallback();
                }
            );
        } else {
            // Call success callback immediately if there is nothing to update
            successCallback();
        }
    }

    /**
     * Is the number of parameters in the parms array valid for
     * the SQL statement?
     * @param sqlStatement - SQL statement to check
     * @param parms - Parms array to check
     * @returns Boolean - true if parms length matches number of ?'s in sqlStatement, false otherwise
     */
    function isParmArrayValidForStatement( sqlStatement, parms ) {
        var valid = false;
        var replaceableParms = sqlStatement.match( /\?/g );
        if ( replaceableParms && replaceableParms.length > 0 ) {
            if ( parms ) {
                valid = ( parms.length == replaceableParms.length );
            }
        } else {
            valid = ( parms == null || parms.length == 0 );
        }
        return valid;
    }

    /**
     * Select and return data from a database table
     * @param selectStatement - SELECT statement to execute
     * @param selectParms - Parameter array for the SELECT statement, can be null
     * @param resultCallback - This function is called with an array containing the SELECT results
     */
    function selectData( selectStatement, selectParms, resultCallback ) {
        if ( !selectStatement || !resultCallback ) {
            throw "MobileDb.selectData: One or more required parameters (selectStatement, resultCallback) are undefined";
        }
        if ( !db ) {
            throw "MobileDb.selectData: Database instance is not open.  Call openDB() before calling this method.";
        }
        // Make sure number of parms matches number of ? inside select statement
        if ( !isParmArrayValidForStatement( selectStatement, selectParms ) ) {
            throw "MobileDb.selectData: Number of parms in selectParms does not match number of replaceable parameters in " + selectStatement;
        }

        debug && console.log( "MobileDb.selectData: Selecting data using statement: " + selectStatement );
        if ( selectParms ) {
            debug && console.log( "MobileDb.selectData: Selecting data using parms: " + selectParms );
        }

        var startTime = new Date().getTime();

        // This internal function allows us to batch the cloning of the result set into
        // an object array.  By using setTimeout, we give the browser an opportunitity
        // to be responsive while this is happening
        var batchSize = 1000;
        var cloneResultSetCompleteFn = null;
        var cloneResultSetFn = function( resultSet, currentBatch, objectArray ) {
            setTimeout( function() {
                debug && console.log( "MobileDb.selectData: Cloning result set batch " + ( currentBatch + 1 ) + " into object array" );
                for ( var indexInBatch = 0; indexInBatch < batchSize; indexInBatch++ ) {
                    var objectIndex = indexInBatch + ( currentBatch * batchSize );
                    if ( objectIndex < resultSet.rows.length ) {
                        objectArray[ objectIndex ] = Util.clone( resultSet.rows.item( objectIndex ) );
                    } else {
                        break;
                    }
                }
                if ( _.isFunction( cloneResultSetCompleteFn ) ) {
                    cloneResultSetCompleteFn();
                }
            }, 0 );
        };

        executeSql( selectStatement, selectParms, null, function( tx, results ) {
            var sqlExecutionEndTime = new Date().getTime();
            debug && console.log( "MobileDb.selectData: Returned " + results.rows.length + " rows. " +
                                  "SQL execution time in seconds: " + ( ( sqlExecutionEndTime - startTime ) / 1000 ) );
            var objects = new Array( results.rows.length );
            debug && console.log( "MobileDb.selectData: Cloning result set to make it writable" );
            if ( results.rows.length > 15000 ) {
                var numBatches = Math.round( results.rows.length / batchSize );
                if ( results.rows.length % batchSize ) {
                    numBatches++;
                }
                // Set up a complete function for cloning the result set using batches.
                // It will be used to return the cloned result set.
                cloneResultSetCompleteFn = _.after( numBatches, function() {
                    debug && console.log( "MobileDb.selectData: Clone result set complete. Returning cloned results via resultCallback." );
                    var executionTime = ( new Date().getTime() - startTime ) / 1000;
                    debug && console.log( "MobileDb.selectData: Total execution time in seconds: " + executionTime );
                    resultCallback( objects );
                });
                debug && console.log( "MobileDb.selectData: Cloning result set using " + numBatches + " batches" );
                for ( var batch = 0; batch < numBatches; batch++ ) {
                    cloneResultSetFn( results, batch, objects );
                }
            } else {
                // For smaller result sets, we'll clone the results without using setTimeout
                for ( var i = 0; i < results.rows.length; i++ ) {
                    objects[i] = Util.clone( results.rows.item(i) );
                }
                resultCallback( objects );
            }
        }, null );
    }

    /**
     * Delete all rows from a table
     * @param tx
     * @param tableName
     */
    function deleteAllRows( tx, tableName  ) {
        debug && console.log( "MobileDb.deleteAllRows: Deleting all rows from table: " + tableName );
        executeSql( 'DELETE FROM ' + tableName, [], tx, null, null );
    }

    /**
     * Simple database error callback
     */
    function defaultErrorCallbackFn( err1, err2 ) {
        var errorInfo = null;
        if ( err2 ) {
            errorInfo = err2;
        } else {
            errorInfo = err1;
        }
        if ( errorInfo.code && errorInfo.message ) {
            console.error( "MobileDb.defaultErrorCallbackFn: Error processing SQL: Code = " + errorInfo.code + ", Message = " + errorInfo.message );
        } else {
            console.error( "MobileDb.defaultErrorCallbackFn: Error processing SQL" );
        }
    }

    /**
     * Simple database success callback
     */
    function defaultSuccessCallbackFn() {
        debug && console.log( "MobileDb.defaultSuccessCallbackFn: Query successful" );
    }

    // Public accessible methods are exposed here
    return {
        'SQL_SELECT_EQUIPMENT_BY_CUSTOMER_ID'               : SQL_SELECT_EQUIPMENT_BY_CUSTOMER_ID,
        'SQL_SELECT_INVENTORY'                              : SQL_SELECT_INVENTORY,
        'SQL_SELECT_INVENTORY_PRODUCTS_STOCKAREAS'          : SQL_SELECT_INVENTORY_PRODUCTS_STOCKAREAS,
        'SQL_SELECT_INVENTORY_PRODUCTS_STOCKAREAS_AVAILABLE': SQL_SELECT_INVENTORY_PRODUCTS_STOCKAREAS_AVAILABLE,
        'SQL_SELECT_ALL_FROM_TABLE'                         : SQL_SELECT_ALL_FROM_TABLE,
        'SQL_SELECT_ONE_FROM_TABLE'                         : SQL_SELECT_ONE_FROM_TABLE,
        'SQL_SELECT_PRODUCTS_BY_TYPE_AND_CODE'              : SQL_SELECT_PRODUCTS_BY_TYPE_AND_CODE,
        'SQL_SELECT_PRODUCTS_BY_TYPE_CODE_AND_MFG'          : SQL_SELECT_PRODUCTS_BY_TYPE_CODE_AND_MFG,
        'SQL_UPDATE_INVENTORY_QUANTITY'                     : SQL_UPDATE_INVENTORY_QUANTITY,
        'createAndPopulateTable'                            : createAndPopulateTable,
        'executeSql'                                        : executeSql,
        'executeSqlBatch'                                   : executeSqlBatch,
        'openDB'                                            : openDB,
        'selectData'                                        : selectData,
        'updateTable'                                       : updateTable
    };
}();
