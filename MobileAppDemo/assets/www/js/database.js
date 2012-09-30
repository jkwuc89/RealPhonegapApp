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
    var SQL_WHERE_WEBID = " WHERE webId = ";
    var SQL_OR_WEBID    = " OR webId = ";
    
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
    var SQL_SELECT_INVENTORY_PRODUCTS_STOCKAREAS_AVAILABLE = // FIXME waiting on DIS feedback
    	'select i.*, p.description, s.webId as stockAreaId, s.name as stockAreaName, s.type as stockAreaType ' + 
        'from ' + PRODUCTS_TABLE + ' as p, ' + INVENTORY_TABLE + ' as i, ' + STOCKAREAS_TABLE + ' as s ' +
        'where p.webId = i.productId and p.productType = 1 and i.stockAreaId = s.webId and s.departmentId = 15801457 and i.webId in (' +
        'select webId from ' + INVENTORY_TABLE + ' where quantity > 0 or minimum > 0 or maximum > 0)';
    
    var SQL_CREATE_STANDARDJOBCODES = 
        SQL_CREATE_TABLE + STANDARDJOBCODES_TABLE + ' (webId PRIMARY KEY, completeJobCode, description, jobCode, notes)';
    var SQL_INSERT_INTO_STANDARDJOBCODES = 
        SQL_INSERT_INTO + STANDARDJOBCODES_TABLE + ' VALUES( ';
    
    var SQL_CREATE_STOCKAREAS = 
        SQL_CREATE_TABLE + STOCKAREAS_TABLE + ' (webId PRIMARY KEY, type, branchId, departmentId, name )'; 
    var SQL_INSERT_INTO_STOCKAREAS = 
        SQL_INSERT_INTO + STOCKAREAS_TABLE + ' VALUES( ';
    
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
     * Get the INSERT SQL necessary to insert a row into
     * a table
     * @param dataType
     * @param jsonData
     */
    function getInsertSql( dataType, jsonData ) {
        var insertSql = null;
        switch ( dataType ) {
            case "inventory" :
                var inventory = jsonData;
                insertSql = SQL_INSERT_INTO_INVENTORY + 
                            inventory.webId + ', ' +
                            inventory.product.webId + ', ' +
                            '"' + inventory.product.manufacturer + '", ' +
                            '"' + inventory.product.productCode.replace( /\\/g, "" ).replace( /"/g, "&quot;" ) + '", ' +
                            inventory.stockAreaId + ', ' +
                            '"' + inventory.binName + '", ' +
                            (inventory.mainBin ? 1 : 0) + ', ' +
                            inventory.quantity + ', ' +
                            inventory.minimum + ', ' +
                            inventory.maximum + ')';
                break;
                
            case "standardJobCodes" :
                var standardJobCode = jsonData;
                // Only consider standard job codes whose description and notes are not null
                if ( !( standardJobCode.description == null && 
                        standardJobCode.notes == null ) ) {
                    insertSql = SQL_INSERT_INTO_STANDARDJOBCODES +
                                standardJobCode.webId + ', ' + 
                                '"' + standardJobCode.completeJobCode + '", ' +
                                '"' + standardJobCode.description + '", ' +
                                '"' + standardJobCode.jobCode + '", ' +
                                '"' + standardJobCode.notes + '")';
                }
                break;
                
            case "stockAreas" :
                var stockArea = jsonData;
                insertSql = SQL_INSERT_INTO_STOCKAREAS + 
                            stockArea.webId + ', ' +
                            stockArea.type + ', ' +
                            stockArea.branchId + ', ' +
                            stockArea.departmentId + ', ' +
                            '"' + stockArea.name + '")';
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
        debug && console.log( "MobileDb.createAndPopulateTable: Validating parameters" );
        if ( !jsonData ) {
            console.error( "MobileDb.createAndPopulateTable: Required parameter jsonData is null or undefined" );
            throw "MobileDb.createAndPopulateTable: Required parameter jsonData is null or undefined";
        }
        if ( !db ) {
            throw "MobileDb.createAndPopulateTable: Database instance is not open.  Call openDB() before calling this method.";
        }
        
        // Datatype specific init
        var dataType = _.keys( jsonData )[2];
        debug && console.log( "MobileDb.createAndPopulateTable: JSON datatype = " + dataType );
        var createTableSql = null;
        switch ( dataType ) {
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
     * Update a DB table with the specified JSON data
     * @param jsonData - JSON data used to update the table
     * @param successCallback - 
     */
    function updateTable( jsonData, successCallback, errorCallback ) {
        if ( !jsonData ) {
            throw "MobileDb.updateTable: Required parameter jsonData is null or undefined";
        }
        if ( !db ) {
            throw "MobileDb.updateTable: Database instance is not open.  Call openDB() before calling this method.";
        }
        
        var count    = jsonData['total'];
        var dataType = _.keys( jsonData )[2];
        debug && console.log( "MobileDb.updateTable: JSON datatype = " + dataType + ", update count = " + count );
        
        // Use default callbacks if callback params are undefined
        if ( !successCallback ) {
            successCallback = function() {
                debug && console.log( "MobileDb.updateTable: " + dataType + " table update successful" );
            };
        }
        if ( !errorCallback ) {
            errorCallback = defaultErrorCallbackFn;
        }
        
        if ( count > 0 ) {
            debug && console.log( "MobileDb.updateTable: Building SELECT query to get existing objects" ); 
            // Build the SELECT query to get all existing JSON objects
            // whose webId's match those inside jsonData
            var selectSql = SQL_SELECT_ALL_FROM_TABLE.replace( "tableName", dataType );
            for ( var i = 0; i < count; i++ ) {
                var currentWebId = jsonData[dataType][i].webId;
                if ( i == 0 ) {
                    selectSql += SQL_WHERE_WEBID + currentWebId;
                } else {
                    selectSql += SQL_OR_WEBID + currentWebId;
                }
            };
            
            var sqlUpdateBatch = [];
            selectData( selectSql, null, function( objectsToUpdate ) {
                debug && console.log( "MobileDb.updateTable: SELECT returned " + objectsToUpdate.length +
                                      " existing objects. Building SQL batch to update objects." ); 
                _.each( objectsToUpdate, function( objectInList ) {
                    // Add delete each object returned from the SELECT
                    sqlUpdateBatch.push( SQL_DELETE_ROW_BY_WEBID.replace( "tableName", dataType ) + objectInList.webId );
                    // Add insert for each object returned from SELECT and
                    // mark object inside jsonData as updated
                    var jsonUpdateObject = _.find( jsonData[dataType], function( jsonInList ) {
                        return jsonInList.webId == objectInList.webId;
                    });
                    sqlUpdateBatch.push( getInsertSql( dataType, jsonUpdateObject ) );
                    jsonUpdateObject.updated = true;
                });
                
                // Add insert statements for those objects not found during SELECT
                _.each( jsonData[dataType], function( jsonInList ) {
                    if ( !jsonInList.updated ) {
                        sqlUpdateBatch.push( getInsertSql( dataType, jsonInList ) );
                    }
                });
                
                // Execute the SQL batch
                debug && console.log( "MobileDb.updateTable: Executing batch to update objects" );
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
            }, function( err1, err2 ) {
                console.error( "MobileDb.updateTable: SQL SELECT to get existing objects failed" );
                defaultErrorCallbackFn( err1, err2 );
                successCallback();
            });
        } else {
            // Call success callback immediately if there is nothing to update
            successCallback();
        }
    }
    
    /**
     * Create a test version of the products table
     * @param numRows - number of rows to put into the table
     */
    function createProductsTable( numRows ) {
        openDB();
        if ( db ) {
            debug && console.log( "MobileDb.createProductsTable: Dropping table: " + PRODUCTS_TABLE );
            dropTable( null, PRODUCTS_TABLE );
            
            debug && console.log( "MobileDb.createProductsTable: Creating table: " + PRODUCTS_TABLE );
            executeSql( SQL_CREATE_PRODUCTS, null, null, function() {
                debug && console.log( "MobileDb.createProductsTable: Populating table: " + PRODUCTS_TABLE );
                populateProductsTable( numRows );
            }, function() {
                throw "MobileDb.createProductsTable: Failed to create " + PRODUCTS_TABLE;
            } );
        } else {
            throw "MobileDb.createProductsTable: openDB failed to open the database";
        }
    }
    
    /**
     * Popluate the products table with test data
     * @param numRows - Number of rows being inserted
     */
    function populateProductsTable( numRows ) {
        var createProductsTableComplete = _.after( numRows, function() {
            debug && console.log( "MobileDb.createProductsTableComplete: Products table created and populated" );
        });
        var executeSqlCallback = function( arg ) {
            createProductsTableComplete();
        };
        
        debug && console.log( "MobileDb.populateProductsTable: Inserting " + numRows + " rows" );
        var sql = "";
        var webId = "";
        var productCode = "";
        var description = "";
        for ( var i = 0; i < numRows - 2; i++ ) {
            // Populate the sql parms array with the product's 
            // webId, productCode and description
            webId       = i + 1;
            productCode = webId;
            description = "This is the product description for productCode" + webId;
            sql = 'INSERT INTO PRODUCTS VALUES( ' + webId + ', "CRW", ' + 
                                                              '"' + productCode + '", "' + description + '", 1, "", "false" )';
            executeSql( sql, null, null, executeSqlCallback, null );
        }
        
        // Add rows for PTR and TTR
        sql = SQL_INSERT_INTO + PRODUCTS_TABLE + ' VALUES( ' + numRows + 1 + ', "' + JSONData.WORK_ORDER_LINE_MFG_LABOR + '", ' + 
                                            '"' + JSONData.WORK_ORDER_LINE_PTR + '", "' + JSONData.WORK_ORDER_LINE_PTR + '", 3, "", "false" )';
        executeSql( sql, null, null, executeSqlCallback, null );
        sql = SQL_INSERT_INTO + PRODUCTS_TABLE + ' VALUES( ' + numRows + 2 + ', "' + JSONData.WORK_ORDER_LINE_MFG_LABOR + '", ' + 
                                            '"' + JSONData.WORK_ORDER_LINE_TTR + '", "' + JSONData.WORK_ORDER_LINE_TTR + '", 3, "", "false" )';
        executeSql( sql, null, null, executeSqlCallback, null );
    }
    
    /**
     * Is the number of parameters in the parms array valid for 
     * the SQL statement?
     * @param sqlStatement - SQL statement to check
     * @param parms - Parms array to check
     * @returns true if parms length matches number of ?'s in sqlStatement, false otherwise
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
     * @param errorCallback - Error callback function
     */
    function selectData( selectStatement, selectParms, resultCallback, errorCallback ) {
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
        
        // Use default if errorCallback is undefined
        if ( !errorCallback ) {
            errorCallback = defaultErrorCallbackFn; 
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
        var cloneResultSet = function( resultSet, currentBatch, objectArray ) {
            setTimeout( function() {
                debug && console.log( "MobileDb.selectData: Cloning result set batch " + currentBatch + " into object array" );
                for ( var indexInBatch = 0; indexInBatch < batchSize; indexInBatch++ ) {
                    var objectIndex = indexInBatch + ( currentBatch * batchSize );
                    if ( objectIndex < resultSet.rows.length ) {
                        objectArray[ objectIndex ] = Util.clone( resultSet.rows.item( objectIndex ) );
                    } else {
                        break;
                    }
                }
            }, 0 );
        };
        
        executeSql( selectStatement, selectParms, null, function( tx, results ) {
            var sqlExecutionEndTime = new Date().getTime();
            debug && console.log( "MobileDb.selectData: Returned " + results.rows.length + " rows. " +
                                  "SQL execution time in seconds: " + ( ( sqlExecutionEndTime - startTime ) / 1000 ) );
            var objects = new Array( results.rows.length );
            if ( results.rows.length > 15000 ) {
                for ( var batch = 0; batch < ( results.rows.length / batchSize ); batch++ ) {
                    cloneResultSet( results, batch, objects );
                }
            } else {
                // For smaller result sets, we'll clone the results without using setTimeout
                for ( var i = 0; i < results.rows.length; i++ ) {
                    objects[i] = Util.clone( results.rows.item(i) );
                }
            }
            resultCallback( objects );
            
            var executionTime = ( new Date().getTime() - startTime ) / 1000;
            debug && console.log( "MobileDb.selectData: Total execution time in seconds: " + executionTime );
        }, null );
    }

    /**
     * Update data inside a database table
     * @param updateStatement - UPDATE statement to execute
     * @param updateParms - Parameter array for the UPDATE statement, can be null
     * @param updateCallback - This function is called when the update completes successfully
     * @param errorCallback - Error callback function
     */
    function updateData( updateStatement, updateParms, resultCallback, errorCallback ) {
        if ( !updateStatement || !updateCallback ) {
            throw "MobileDb.updateData: One or more required parameters (updateStatement, updateCallback) are undefined";
        }
        if ( !db ) {
            throw "MobileDb.updateData: Database instance is not open.  Call openDB() before calling this method.";
        }
        // Make sure number of parms matches number of ? inside update statement
        if ( !isParmArrayValidForStatement( updateStatement, updateParms ) ) {
            throw "MobileDb.updateData: Number of parms in updateParms does not match number of replaceable parameters in " + updateStatement;
        }
        
        // Use default if errorCallback is undefined
        if ( !errorCallback ) {
            errorCallback = defaultErrorCallbackFn; 
        }

        debug && console.log( "MobileDb.updateData: Updating data using statement: " + updateStatement );
        if ( updateParms ) {
            debug && console.log( "MobileDb.updateData: Updating data using parms: " + updateParms );
        }
        executeSql( updateStatement, updateParms, null, function( tx, results ) {
            debug && console.log( "MobileDb.updateData: " + results.rowsAffected + " rows updated" );
            resultCallback( results.rowsAffected );
        }, null );
    }
    
    /**
     * Delete all rows from a table
     * @param tx
     */
    function deleteAllRows( tx, tableName  ) {
        debug && console.log( "MobileDb.deleteAllRows: Deleting all rows from table: " + tableName );
        executeSql( 'DELETE FROM ' + tableName, [], tx );
    }
    
    /**
     * Drop the specified table.
     * @param tableName
     */
    function dropTable( tx, tableName ) {
        debug && console.log( "MobileDb.dropTable: Dropping table: " + tableName );
        deleteAllRows( tx, tableName );
        executeSql( 'DROP TABLE ' + tableName, [], tx );
    }
    
    /**
     * Drop all tables
     * @param tx
     */
    function dropAllTables() {
        db.transaction( function( tx ) {
            dropTable( tx, PRODUCTS_TABLE );
        });
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
    
    /**
     * Simple database update success callback 
     * @param tx
     * @param results
     */
    function dbUpdateSuccess( tx, results ) {
        debug && console.log( "Rows Affected = " + results.rowAffected );
    }

    // Public accessible methods are exposed here
    return {
        'SQL_SELECT_INVENTORY'                              : SQL_SELECT_INVENTORY,
        'SQL_SELECT_INVENTORY_PRODUCTS_STOCKAREAS'          : SQL_SELECT_INVENTORY_PRODUCTS_STOCKAREAS,
        'SQL_SELECT_INVENTORY_PRODUCTS_STOCKAREAS_AVAILABLE': SQL_SELECT_INVENTORY_PRODUCTS_STOCKAREAS_AVAILABLE,
        'SQL_SELECT_ALL_FROM_TABLE'                         : SQL_SELECT_ALL_FROM_TABLE,
        'SQL_SELECT_ONE_FROM_TABLE'                         : SQL_SELECT_ONE_FROM_TABLE,
        'SQL_SELECT_PRODUCTS_BY_TYPE_AND_CODE'              : SQL_SELECT_PRODUCTS_BY_TYPE_AND_CODE,
        'SQL_SELECT_PRODUCTS_BY_TYPE_CODE_AND_MFG'          : SQL_SELECT_PRODUCTS_BY_TYPE_CODE_AND_MFG,
        'SQL_UPDATE_INVENTORY_QUANTITY'                     : SQL_UPDATE_INVENTORY_QUANTITY,
        'createAndPopulateTable'                            : createAndPopulateTable,
        'createProductsTable'                               : createProductsTable,
        'dropAllTables'                                     : dropAllTables,
        'executeSql'                                        : executeSql,
        'executeSqlBatch'                                   : executeSqlBatch,
        'openDB'                                            : openDB,
        'populateProductsTable'                             : populateProductsTable,
        'selectData'                                        : selectData,
        'updateData'                                        : updateData,
        'updateTable'                                       : updateTable
    };
}();
