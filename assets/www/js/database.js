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
    var PARTS_TABLE             = "parts";
    
    // SQL queries
    var SQL_INSERT_INTO         = "INSERT INTO ";
    var SQL_SELECT_ALL_FROM_TABLE = "SELECT * FROM tableName LIMIT 100";
    
    var SQL_DELETE_JSON_FROM_PARTS = "DELETE FROM " + PARTS_TABLE + " WHERE name LIKE 'JSON %'";
    var SQL_INSERT_INTO_PARTS = 
        SQL_INSERT_INTO + PARTS_TABLE + ' VALUES( ';
    
    /**
     * Open the mobile app's local database
     */
    function openDB() {
        debug && console.log( "MobileDb.openDB: Opening DB" );
        if ( db == null ) {
            try {
                db = window.openDatabase( "LeadingEDJE", "1.0", "LeadingEDJE", 1024000000 );
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
            db.transaction( function( txParm ) {
                txParm.executeSql( sql, parameters, successCallbackFn, errorCallbackFn );
            });
        } else {
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
            case "parts" :
                var part = jsonData;
                insertSql = SQL_INSERT_INTO_PARTS + 
                            part.partnum + ', ' +
                            '"' + part.name + '", ' +
                            '"' + part.description + '", ' +
                            part.quantity + ', ' +
                            part.price + ')';
                break;
        }
        return insertSql;
    }
    
    /**
     * Populate a table using the specified json data.
     * @param jsonData - JSON data used to populate the table
     * @param successCallback - Success callback function
     * @param errorCallback - Error callback function
     */
    function populateTable( jsonData, successCallback, errorCallback ) {
        debug && console.log( "MobileDb.populateTable: Validating parameters" );
        if ( !jsonData ) {
            console.error( "MobileDb.populateTable: Required parameter jsonData is null or undefined" );
            throw "MobileDb.populateTable: Required parameter jsonData is null or undefined";
        }
        if ( !db ) {
            throw "MobileDb.populateTable: Database instance is not open.  Call openDB() before calling this method.";
        }
        
        // Datatype specific init
        var dataType = _.keys( jsonData )[1];
        debug && console.log( "MobileDb.populateTable: JSON datatype = " + dataType );
        
        // Use default callbacks if callback params are undefined
        if ( !successCallback ) {
            successCallback = function() {
                debug && console.log( "MobileDb.populateTable: " + dataType + " table creation and population successful" );
            };
        }
        if ( !errorCallback ) {
            errorCallback = defaultErrorCallbackFn;
        }
        
        // Create SQL batch for populating the table
        debug && console.log( "MobileDb.populateTable: Creating SQL batch for " + dataType );
        var sqlBatch = [];
        sqlBatch.push( SQL_DELETE_JSON_FROM_PARTS );
        _.each( jsonData[dataType], function( jsonInList ) {
            var insertSql = getInsertSql( dataType, jsonInList );
            if ( insertSql ) {
                sqlBatch.push( insertSql );
            }
        });
        
        debug && console.log( "MobileDb.populateTable: Executing SQL batch for " + dataType );
        executeSqlBatch( sqlBatch, successCallback, errorCallback );
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

        // NOTE: Results returned from query are read only.  To make them writable
        //       we clone the results and return the clone
        //
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
     * @param tableName
     */
    function deleteAllRows( tx, tableName  ) {
        debug && console.log( "MobileDb.deleteAllRows: Deleting all rows from table: " + tableName );
        executeSql( 'DELETE FROM ' + tableName, [], tx );
    }
    
    /**
     * Drop the specified table.
     * @param tx
     * @param tableName
     */
    function dropTable( tx, tableName ) {
        debug && console.log( "MobileDb.dropTable: Dropping table: " + tableName );
        deleteAllRows( tx, tableName );
        executeSql( 'DROP TABLE ' + tableName, [], tx );
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
        'SQL_SELECT_ALL_FROM_TABLE'                         : SQL_SELECT_ALL_FROM_TABLE,
        'populateTable'                                     : populateTable,
        'executeSql'                                        : executeSql,
        'executeSqlBatch'                                   : executeSqlBatch,
        'openDB'                                            : openDB,
        'selectData'                                        : selectData,
        'updateData'                                        : updateData
    };
}();
