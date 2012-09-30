/**
 * jsondata.js
 */

"use strict";

/**
 * JSONData
 * Encapsulate local file system functionality that is provided by PhoneGap
 */
var JSONData = function() {

    /**
     * Handle window onload event
     */
    $(window).load( function( event ) {
    });
    
    // Configuration JSON URL
    var CONFIGURATION_JSON_URL = "json/configuration.json";
        
    /**
     * Constants
     */
    var PRODUCT_TYPE_PART                       = 1;
    var PRODUCT_TYPE_EQUIPMENT                  = 2;
    var PRODUCT_TYPE_LABOR                      = 3;
    var SIGNATURE_FORMAT                        = "image/png;base64";

    /**
     * JSON based configuration for this application
     */
    var config = null;
    
    /**
     * Valid JSON feed update types
     */
    var JSON_FEED_UPDATE_TYPE = {
        FULL : 0,
        DAILY : 1,
        PERIODIC : 2
    };
    
    /**
     * Log exception information
     */
    function logException( exc ) {
        console.error( "JSONData: exc is: " + exc );
        console.error( "JSONData: exc.number is: " + (exc.number & 0xFFFF) );
        console.error( "JSONData: exc.description is: " + exc.description );
        console.error( "JSONData: exc.name is: " + exc.name );
        console.error( "JSONData: exc.message is: " + exc.message );
    }

    /**
     * This method is being used to detect disappearing local storage items
     */
    function checkLocalStorageItems() {
        console.log( "JSONData.checkLocalStorageItems: Number of items in local storage: " + window.localStorage.length );
        var missingLSItemFound = false;
        for ( var key in window.localStorage ) {
            var itemValue = window.localStorage.getItem( key ); 
            if ( _.isNull( itemValue ) ) {
                console.error( "JSONData.checkLocalStorageItems: Local Storage Error - item " + key + " is missing" );
                missingLSItemFound = true;
            }
        }
        if ( missingLSItemFound ) {
            Dialog.showAlert( "Local Storage Error",
                              "One or more local storage items are missing.  Please check the console log for additional details." );
        } else {
            console.log( "JSONData.checkLocalStorageItems: All local storage items are present" );
        }
    }
    
    /**
     * Load the application's configuration data
     * @param loadCallback - Option callback function, called when configuration data is saved
     */
    function loadConfiguration( loadCallback ) {
        debug && console.log( "JSONData.loadConfiguration: Loading configuration data from " + CONFIGURATION_JSON_URL ); 
        loadJSON( CONFIGURATION_JSON_URL,
            // Save the configuration data inside the local store
            function( configData ) {
                saveJSON( "configuration", configData["configuration"][0] );
                loadCallback();
            },
            // Failure to load the configuration JSON throws an exception
            function() {
                throw "JSONData.loadConfiguration: Unable to load the configuration JSON " + CONFIGURATION_JSON_URL;
            }
        );
    }
    
    /**
     * Get the current application configuration
     * @returns The config JSON objects
     */
    function getConfig() {
        if ( !config ) {
            try {
                config = JSON.parse( window.localStorage.getItem( "configuration.1" ) );
            } catch ( exc ) {
                console.warn( "JSONData.getConfig: App configuration JSON not available in local storage yet" );
                config = null;
            }
        }
        return config;
    }

    /**
     * Initialize the JSONData object.  This method should be called
     * by each page's pageinit event handler.  _.once is used to ensure
     * that init is only called once.
     * @param pageId - Current page ID
     * @param initCompleteCallback - Init complete callback
     */
    var init = _.once( function( pageId, initCompleteCallback ) {
        debug && console.log( "JSONData.init: Initializing..." );
        
        // Open the database
        debug && console.log( "JSONData.init: Calling MobileDb.openDB() to open the database" );
        MobileDb.openDB();
        
        // Turn on polling loop for pulling JSON feed updates for every page except logon
        if ( pageId != "indexPage" ) {
            var periodicUpdateFrequency = JSONData.getConfig().periodicUpdateFrequency;
            debug && console.log( "JSONData.init: Periodic JSON feed update will run every " + 
                                  periodicUpdateFrequency + " minutes" );
            $.doTimeout( 'JSONFeedUpdates', periodicUpdateFrequency * 60 * 1000, getPeriodicJSONFeedUpdates );
        } else {
            debug && console.log( "JSONData.init: Periodic JSON feed update disabled for pageId: " + pageId );
        }
        
        // Call the init complete callback fn if it is defined
        if ( initCompleteCallback && _.isFunction( initCompleteCallback ) ) {
            initCompleteCallback();
        }
    });

    /**
     * Get the JSON feed configuration for the specified dataType
     * @param appConfig - app configuration
     * @param dataType
     * @returns JSON feed configuration from the configuration JSON
     */
    function getJSONFeedConfig( appConfig, dataType ) {
        if ( !appConfig ) {
            appConfig = getConfig();
        }
        if ( !dataType ) {
            throw "JSONData.getJSONFeedConfig: Required parameters dataType is null or undefined";
        }
        var jsonFeedConfig = _.find( appConfig.jsonDatabaseFeeds, function( feedInList ) {
            return feedInList.name === dataType;
        });
        if ( !jsonFeedConfig ) {
            jsonFeedConfig = _.find( appConfig.jsonLocalStoreFeeds, function( feedInList ) {
                return feedInList.name === dataType;
            });
        }
        return jsonFeedConfig;
    }
    
    /**
     * Change a JSON feed's dateTimeUpdated to the current time 
     */
    function updateJSONFeedLastUpdated( dataType ) {
        var config = getConfig();
        var jsonFeedConfig = getJSONFeedConfig( config, dataType );
        jsonFeedConfig.dateTimeUpdated = Util.getISOCurrentTime();
        debug && console.log( "JSONData.updateJSONFeedLastUpdated: Changing " + dataType +
                              " dateTimeUpdated to " + jsonFeedConfig.dateTimeUpdated );
        saveJSON( "configuration", config );
    }
    
    /**
     * Save a JSON into local storage.  The key used inside the JSON store is a combination
     * of the dataType value and the webId value inside data.  If the JSON already exists,
     * it is updated.
     * @param dataType - JSON data type.  Examples: customers, workorders
     * @param data - JSON data
     * @param debugOutput - Log debug messages to console, defaults to true
     */
    function saveJSON( dataType, data, debugOutput ) {
        if ( _.isNull( dataType ) || _.isUndefined( dataType ) ||
             _.isNull( data ) || _.isUndefined( data ) ) {
            throw "JSONData.saveJSON: One or more required parameters (dataType, data) are null or undefined";
        }
        if ( _.isNull( debugOutput ) || _.isUndefined( debugOutput ) ) {
            debugOutput = true;
        }
        
        // Create the key for saving the json.  It includes the datatype.
        var key = null;
        if ( data.hasOwnProperty( "webId" ) ) {
            key = dataType + "." + data.webId;
        } else {
            key = dataType;
        }
        if ( debugOutput ) {
            debug && console.log( "JSONData.saveJSON: Saving '" + JSON.stringify(data) + "' using key '" + key + "'" );
        }
        
        // Save the JSON into local storage
        window.localStorage.setItem( key, JSON.stringify( data ) );
    }

    /**
     * Delete a JSON from the local store.  This is a DESTRUCTIVE delete and there
     * is no way to recover the deleted JSON data.
     * @param dataType - JSON data type.  Examples: customers, workorders
     * @param id - JSON id to delete (the JSON's webId value)
     */
    function deleteJSON( dataType, id ) {
        if ( !dataType || _.isNull( id ) || _.isUndefined( id ) ) {
            throw "JSONData.deleteJSON: One or more required parameters (dataType, id) are null or undefined";
        }
        // Create the key for deleting the json.  It includes the datatype.
        var key = dataType + "." + id;
        
        debug && console.log( "JSONData.deleteJSON: Deleting '" + key + "' from local JSON store" );
        window.localStorage.removeItem( key );
    }
    
    /**
     * Remove all of the mobile app's local storage items.  This is used to reset
     * the mobile app back to clean state and should be used in conjunction with
     * deleteAllJSONData().
     */
    function removeAllLocalStorageItems() {
        debug && console.log( "JSONData.removeAllLocalStorageItems: Removing all local storage items" );
        window.localStorage.clear();
    }
    
    /**
     * Update and save the date/time stamp when 
     * the JSON feeds were last updated
     * @param configToUpdate - Configuration JSON
     * @param updateType - JSON data update type, member of JSON_DATA_UPDATE_TYPE,
     *                     defaults to FULL
     */
    function updateAllJSONFeedsLastUpdated( configToUpdate, updateType ) {
        if ( !configToUpdate ) {
            configToUpdate = getConfig();
        }
        var completeDateTimeStamp = Util.getISOCurrentTime();
        debug && console.log( "JSONData.updateAllJSONFeedsLastUpdated: Changing last updated for all feeds to " + completeDateTimeStamp );
        
        // Full sync and daily update changes the last daily update date/time stamp
        configToUpdate.dateTimeDailyUpdate = completeDateTimeStamp;

        // Update last full sync date/time stamp
        if ( updateType == JSON_FEED_UPDATE_TYPE.FULL ) {
            getConfig().dateTimeFullSync = completeDateTimeStamp; 
        } else if ( updateType == JSON_FEED_UPDATE_TYPE.PERIODIC ) {
            getConfig().dateTimePeriodicUpdate = completeDateTimeStamp;
        }

        // Add the reset date/time stamp as the update date/time for all JSON feeds
        _.each( configToUpdate.jsonDatabaseFeeds, function( feedInList ) {
            feedInList.dateTimeUpdated = completeDateTimeStamp;
        });
        _.each( configToUpdate.jsonLocalStoreFeeds, function( feedInList ) {
            feedInList.dateTimeUpdated = completeDateTimeStamp;
        });
        
        saveJSON( "configuration", config );
    }

    /**
     * Save JSON feed data with 0 to n objects inside of it
     * to the local store
     * @param jsonFeedData - JSON feed data
     * @returns Number of objects saved to local storage
     */
    function saveJSONFeedDataIntoLocalStore( jsonFeedData ) {
        if ( !jsonFeedData ) {
            throw "JSONData.saveJSONFeedDataIntoLocalStore: Required parameters jsonFeedData is undefined";
        }
        var count = jsonFeedData['total'];
        var currentItem = null;
        if ( count > 0 ) {
            var dataType = Object.keys(jsonFeedData)[2];
            debug && console.log( "JSONData.saveJSONFeedDataIntoLocalStore: Saving " + count +
                                  " " + dataType  + " objects into local JSON store" );
            
            // If feed is read only, we store the data as a single item inside local storage
            var isReadOnly = getJSONFeedConfig( null, dataType ).readOnly;
            if ( isReadOnly ) {
                window.localStorage.setItem( dataType, JSON.stringify(jsonFeedData[dataType]) );
            } else {
                for ( var i = 0; i < count; i++ ) {
                    currentItem = jsonFeedData[dataType][i];
                    saveJSON( dataType, currentItem, false );
                }
            }
        }
        return count;
    }

    /**
     * Get JSON data using jQuery's ajax method.
     * @param url - URL containing the json data.
     * @param successCallback - The signature must be function( data, status, jqHXR )
     * @param errorCallback - The signature must be function( jqXHR, status, error )
     */
    function loadJSON( url, successCallback, errorCallback ) {
        if ( !url ) {
            throw "JSONData.loadJSONFile: Required parameters url is null or undefined";
        }

        // Use default success callback if one is not specified
        if ( !successCallback ) {
            successCallback = function( data ) {
                console.warn( "JSONData.laodJSON: Default success callback called.  Returned data will not be processed." );
            };
        }

        // Use default error callback if one is not defined
        if ( _.isNull( errorCallback ) || _.isUndefined( errorCallback ) ) {
            errorCallback = loadJSONDataErrorCallback;
        }

        // Use an Ajax request to load the JSON data.  This works
        // for local files and for remote URLs
        try {
            $.ajax( {
                url : url,
                dataType : 'json',
                success : successCallback,
                error : errorCallback
            });
        } catch ( exc ) {
            logException( exc );
        }
    }

    /**
     * Load JSON data using the specified dataType object.
     * @param jsonFeed - JSON feed to load, from configuration.json
     * @param updateType - JSON data update type, member of JSON_DATA_UPDATE_TYPE,
     *                     defaults to FULL
     * @param successCallback
     * @param errorCallback
     */
    function loadJSONDataType( jsonFeed, updateType, successCallback, errorCallback ) {
        var jsonUrl = null;
        var doLoad = true;
        
        // Check the update type, default to FULL
        if ( _.isUndefined( updateType ) ) {
            updateType = JSON_FEED_UPDATE_TYPE.FULL;
        }
        debug && console.log( "JSONData.loadJSONDataType: Update type = " + updateType );
        
        if ( Util.isOnline() && jsonFeed.url != "" && !getConfig().loadLocalJSONFilesOnly ) {
            // Set the feed URL
            jsonUrl = getConfig().serverBaseUrl + "/" + jsonFeed.url;
            
            // Update only supported when mobile app is online and is not
            // loading local files only
            if ( updateType == JSON_FEED_UPDATE_TYPE.DAILY || updateType == JSON_FEED_UPDATE_TYPE.PERIODIC ) {
                // Perform update for those JSON feeds that support update.  Otherwise, skip the load
                if ( jsonFeed.updateSupported ) {
                    // Add date/time stamp to the feed URL when performing an update
                    jsonUrl += ( getConfig().jsonFeedUpdateUrlParameter + jsonFeed.dateTimeUpdated );
                } else {
                    doLoad = false;
                }
            }
        } else {
            if ( updateType == JSON_FEED_UPDATE_TYPE.DAILY || updateType == JSON_FEED_UPDATE_TYPE.PERIODIC ) {
                // For testing purposes, an update using local files only uses
                // JSON files with _update in their filename
                if ( jsonFeed.updateSupported ) {
                    jsonUrl = "json/" + jsonFeed.name + "_update.json";
                } else {
                    doLoad = false;
                }
            } else {
                jsonUrl = "json/" + jsonFeed.name + ".json";
            }
        }
        if ( doLoad ) {
            debug && console.log( "JSONData.loadJSONDataType: Loading JSON datatype '" +
                                  jsonFeed.name + "' via '" + jsonUrl + "'" );
            loadJSON( jsonUrl, successCallback, errorCallback );
        } else {
            // Feeds that are skipped will result in success callback being called
            // immediately with an empty data object
            debug && console.log( "JSONData.loadJSONDataType: Update of JSON feed " + jsonFeed.name +
            " skipped because it does not support updates" );
            var emptyUpdateData = {
                success : true,
                total : 0
            };
            emptyUpdateData[jsonFeed.name] = [];
            successCallback( emptyUpdateData );
        }
    }
    
    /**
     * Load JSON feeds into the database
     * @param updateType - JSON data update type, member of JSON_DATA_UPDATE_TYPE,
     *                     defaults to FULL
     */
    var loadJSONDataIntoDatabaseComplete = null;
    var loadJSONDataErrorOccurred = false;
    function loadJSONDataIntoDatabase( updateType ) {

        // Check the update type, default to FULL
        if ( _.isUndefined( updateType ) ) {
            updateType = JSON_FEED_UPDATE_TYPE.FULL;
        }
        debug && console.log( "JSONData.loadJSONDataIntoDatabase: Update type = " + updateType );
        
        if ( !config ) {
            config = getConfig();
        }
        
        // Clear error flag
        loadJSONDataErrorOccurred = false;
        
        // Set up the complete function that is executed once after all of the
        // database based JSON feeds have completed their load.  This complete function
        // calls loadJSONDataIntoLocalStore to load the JSON feeds that are stored in local storage
        loadJSONDataIntoDatabaseComplete = _.after( getConfig().jsonDatabaseFeeds.length, function() {
            debug && console.log( "JSONData.loadJSONDataIntoDatabaseComplete: Executed once after all JSON is loaded into the DB" );
            loadJSONDataIntoLocalStore( updateType );
        });
        
        // Load all of the database feeds
        for ( var i = 0; i < getConfig().jsonDatabaseFeeds.length; i++ ) {
            var currentJSONFeed = getConfig().jsonDatabaseFeeds[i];
            debug && console.log( "JSONData.loadJSONFilesIntoDatabase: Loading JSON datatype '" +
                                  currentJSONFeed.name + "' into the DB" );
            loadJSONDataType( currentJSONFeed, updateType,
                // Success call back stores the JSON data into the database 
                function( data, textStatus, jqXHR ) {
                    var dataType = _.keys(data)[2];
                    debug && console.log( "JSONData.loadJSONDataIntoDatabase: Storing " + dataType + " into DB" );
                    if ( updateType == JSON_FEED_UPDATE_TYPE.DAILY || updateType == JSON_FEED_UPDATE_TYPE.PERIODIC ) {
                        var count = data['total'];
                        debug && console.log( "JSONData.loadJSONDataIntoDatabase: Update pull of " + dataType + " returned " + count + " items." );
                        if ( count > 0 ) {
                            // Update the DB tables
                            MobileDb.updateTable( data, function() {
                                debug && console.log( "JSONData.loadJSONDataIntoDatabase: " + dataType + " table updated" );
                                loadJSONDataIntoDatabaseComplete();
                            });
                        } else {
                            loadJSONDataIntoDatabaseComplete();
                        }
                    } else {
                        // During a full sync, tables are created and populated
                        MobileDb.createAndPopulateTable( data, function() {
                            debug && console.log( "JSONData.loadJSONDataIntoDatabase: " + dataType + " table created and populated" );
                            loadJSONDataIntoDatabaseComplete();
                        });
                    }
                },
                // Error call back logs an error but still calls the complete function
                // so that the load will continue to run
                function( jqXHR, status, error ) {
                    console.error( "JSONData.loadJSONDataIntoDatabase: Load JSON data failed.  " +
                                   "jqXHR Status Text = " + jqXHR.statusText +
                                   ", Status = " + status + "', Error = '" + error + "'" );
                    loadJSONDataErrorOccurred = true;
                    loadJSONDataIntoDatabaseComplete();
                }
            );
        }
    }

    /**
     * Local JSON feeds into local storage
     * @param updateType - JSON data update type, member of JSON_DATA_UPDATE_TYPE,
     *                     defaults to FULL
     */
    var loadJSONDataIntoLocalStoreStartTime = null;
    var loadJSONDataIntoLocalStoreComplete = null;
    function loadJSONDataIntoLocalStore( updateType ) {
        
        // Check the update type, default to FULL
        if ( _.isUndefined( updateType ) ) {
            updateType = JSON_FEED_UPDATE_TYPE.FULL;
        }
        debug && console.log( "JSONData.loadJSONDataIntoLocalStore: Update type = " + updateType );

        // Set up an _.after function that executes once when all JSON data is loaded into
        // the local store
        loadJSONDataIntoLocalStoreComplete = _.after( getConfig().jsonLocalStoreFeeds.length, function() {
            debug && console.log( "JSONData.loadJSONDataIntoLocalStoreComplete: Executed once after all JSON is loaded into local storage" );
            // Close the please wait dialog 
            UIFrame.closeActiveDialog();
            
            var loadTime = ( new Date().getTime() - loadJSONDataIntoLocalStoreStartTime ) / 1000; 
            debug && console.log( "JSONData.loadJSONDataIntoLocalStoreComplete: JSON data loading is complete.  Load time = " + loadTime + " seconds" );

            switch ( updateType ) {
                case JSON_FEED_UPDATE_TYPE.FULL :
                    if ( loadJSONDataErrorOccurred ) {
                        // Reset failure leaves user on the logon page
                        Dialog.showAlert( Localization.getText( "resetTitle" ),
                                          Localization.getText( "resetError" ), null, "350px" );
                    } else {
                        // When full sync is complete and successful, reload / save the configuration and
                        // reload the login page.
                        Dialog.showAlert( Localization.getText( "resetTitle" ),
                                          Localization.getText( "resetComplete" ),
                            function() {
                                debug && console.log( "JSONData.loadJSONDataIntoLocalStoreComplete: JSON reload is complete")
                                UIFrame.closeActiveDialog();
                                loadConfiguration( function() {
                                    updateAllJSONFeedsLastUpdated( config, updateType );
                                });
                            }, "350px"
                        );
                    }
                    break;
                case JSON_FEED_UPDATE_TYPE.PERIODIC :
                    debug && console.log( "JSONData.loadJSONDataIntoLocalStoreComplete: Periodic JSON feed update complete" );
                    updateAllJSONFeedsLastUpdated( config, updateType );
                    if ( periodicUpdateCompleteFn && _.isFunction( periodicUpdateCompleteFn ) ) {
                        periodicUpdateCompleteFn();
                    }
                    break;
            }
        });
        
        loadJSONDataIntoLocalStoreStartTime = new Date().getTime();
        for ( var i = 0; i < getConfig().jsonLocalStoreFeeds.length; i++ ) {
            debug && console.log( "JSONData.loadJSONFilesIntoLocalStore: Loading JSON datatype '" +
                                  getConfig().jsonLocalStoreFeeds[i].name + "' into local store" );
            loadJSONDataType( getConfig().jsonLocalStoreFeeds[i], updateType,
                              loadJSONDataIntoLocalStoreSuccessCallback, 
                              loadJSONDataIntoLocalStoreErrorCallback );
        }
    }

    /**
     * Success callback for loading all JSON data into local storage
     */
    function loadJSONDataIntoLocalStoreSuccessCallback( data ) {
        debug && console.log( "JSONData.loadJSONDataIntoLocalStoreSuccessCallback: JSON data loaded." );
        saveJSONFeedDataIntoLocalStore( data );
        loadJSONDataIntoLocalStoreComplete();
    }

    /**
     * Error callback for loading all JSON data into local storage
     */
    function loadJSONDataIntoLocalStoreErrorCallback( jqXHR, status, error ) {
        console.error( "JSONData.loadJSONDataIntoLocalStoreErrorCallback: Load JSON file(s) failed.  " +
                "jxHXR Status Text = " + jqXHR.statusText +
                ", Status = " + status + "', Error = '" + error + "'" );
        loadJSONDataErrorOccurred = true;
        // Call the complete function.
        loadJSONDataIntoLocalStoreComplete();
    }

    /**
     * Generic error callback for loading JSON data
     */
    function loadJSONDataErrorCallback( jqXHR, status, error ) {
        console.error( "JSONData.loadJSONDataErrorCallback: Load JSON file(s) failed.  " +
                       "jxHXR Status Text = " + jqXHR.statusText +
                       ", Status = " + status + "', Error = '" + error + "'" );
    }
    
    /**
     * Is the specified datatype stored in the database?
     * @param dataType
     * @returns true or false
     */
    function isDatabase( dataType ) {
        var found = _.find( getConfig().jsonDatabaseFeeds, function( currentDataType ) {
            return currentDataType.name == dataType;
        });
        return ( found ? true : false );
    }
    
    /**
     * Display the error information from a failed post to the middle tier
     */
    function displayPostErrorInfo( errorMsg, jqXHR, textStatus, errorThrown ) {
        if ( textStatus && textStatus.length > 0 ) {
            errorMsg += ( " Error status text = " + textStatus );
        }
        errorMsg += ( " jqXHR.status: " + jqXHR.status + " jqXHR.statusText: " + jqXHR.statusText );
        console.error( errorMsg );
        alert( errorMsg );
    }
    
    /**
     * Post data to the middle tier
     * @param url - Post destination
     * @param data - Data to post
     * @param timeout - Post timeout in seconds
     * @param successCallback - Success callback
     * @param errorCallback - Error callback
     */
    function postDataToMiddleTier( url, data, timeout, successCallback, errorCallback ) {
        if ( !url || !data || !timeout ) {
            throw "JSONData.postDataToMiddleTier: One or more required parameters (url, data, timeout) are missing or invalid";
        }
        
        // Construct the post URL
        var postUrl = getConfig().serverBaseUrl + "/" + url; 

        debug && console.log( "JSONData.postDataToMiddleTier: Posting the following data to " + postUrl + ": " + data );
        // Do the ajax post
        $.ajax( {
            url : postUrl,
            type : "POST",
            data : data,
            contentType : "application/json; charset=utf-8",
            dataType : 'json',
            timeout : timeout * 1000,
            // Post successful
            success : function( updatedData, textStatus, jqXHR ) {
                debug && console.log( "JSONData.postDataToMiddleTier: ajax request to " + postUrl + " successful" );
                if ( updatedData.success ) {
                    debug && console.log( "JSONData.postDataToMiddleTier: Returned JSON data indicates successful processing" );
                    if ( successCallback && _.isFunction( successCallback ) ) {
                        successCallback( updatedData );
                    }
                } else {
                    console.error( "JSONData.postDataToMiddleTier: Returned JSON data indicates unsuccessful processing" );
                    if ( errorCallback && _.isFunction( errorCallback ) ) {
                        errorCallback();
                    }
                }
            },
            // Post failed
            error : function( jqXHR, textStatus, errorThrown ) {
                debug && displayPostErrorInfo( "JSONData.postDataToMiddleTier: ajax request to " + postUrl + " failed",
                                               jqXHR, textStatus, errorThrown );
                if ( errorCallback && _.isFunction( errorCallback ) ) {
                    errorCallback();
                }
            }
        });
    }
    
    /**
     * Get an object from the JSON data
     * IMPORTANT NOTE: Do not use this method inside a loop because it calls getObjectsByDataType().
     * Instead, call getObjectsByDataType and then, use getObjectFromArrayById inside your loop, passing
     * in the array returned from getObjectsByDataType.
     *                  
     * @param dataType - JSON data type
     * @param id - ID of the object, a null ID returns null
     * @returns Object with specified data type and ID or null if not found
     */
    function getObjectById( dataType, id ) {
        if ( !dataType ) {
            throw "JSONData.getObjectById: Required parameter dataType is undefined";
        }
        // Passing a null ID returns null
        if ( _.isNull( id ) ) {
            debug && console.log( "JSONData.getObjectById: Returning null when id parameter is null" );
            return null;
        }
        debug && console.log( "JSONData.getObjectById: Getting " + dataType + " JSON object whose ID = " + id );
        var jsonObj = null;
        
        // Get all of the objects of the specified type and find the one whose webId matches
        // the id passed in.
        var objects = getObjectsByDataType( dataType );
        if ( objects.length > 0 ) {
            jsonObj = _.find( objects, function( objInList ) {
                return objInList.webId == id;
            });
        }
        // Not finding the object is an error
        if ( !jsonObj ) {
            throw "JSONData.getObjectById: " + dataType + " JSON object whose ID = " + id + " not found";
        }
        return jsonObj;
    }
    
    /**
     * Get an object from the database via its ID
     * @param dataType - JSON data type which matches the DB table name
     * @param id - ID of the object, a null ID calls the resultCallback with null as the result
     * @param resultCallback - This function is called with the object or null if the object does not exist
     */
    function getObjectFromDatabaseById( dataType, id, resultCallback ) {
        if ( !dataType || !resultCallback || !_.isFunction( resultCallback ) ) {
            throw "JSONData.getObjectFromDatabaseById: One or more required parameters (dataType, resultCallback) are undefined or invalid";
        }
        if ( id != null ) {
            var sqlParms = [];
            sqlParms.push( id );
            MobileDb.selectData( MobileDb.SQL_SELECT_ONE_FROM_TABLE.replace( "tableName", dataType ), sqlParms, function( result ) {
                if ( result.length == 0 ) {
                    debug && console.log( "JSONData.getObjectFromDatabaseById: " + dataType + " object with ID " + id + " not found" );
                    resultCallback( null );
                } else {
                    debug && console.log( "JSONData.getObjectFromDatabaseById: Calling resultCallback with " + JSON.stringify( result ) );
                    resultCallback( result[0] );
                }
            }, null ); 
        } else {
            debug && console.log( "JSONData.getObjectFromDatabaseById: id is null, calling resultCallback with null result" );
            resultCallback( null );
        }
    }
    
    /**
     * Get an object from the specified JSON object array
     * @param jsonObjArray - JSON object array
     * @param webId - webId used to locate the desired object
     * @returns Object whose webId matches the webId passed in or null if
     *          an object is not found
     */
    function getObjectFromArrayById( jsonObjArray, webId ) {
        if ( !jsonObjArray || jsonObjArray.length == 0 ||
             _.isNull( webId ) || _.isUndefined( webId ) ) {
            throw "JSONData.getObjectFromArrayById: One or more required parameters (jsonObjArray, webId) are undefined or invalid";
        }
        var jsonObj = _.find( jsonObjArray, function( objInList ) {
            return ( !_.isUndefined( objInList.webId ) && objInList.webId == webId );
        });
        if ( _.isUndefined( jsonObj ) ) {
            jsonObj = null;
        }
        return jsonObj;
    }

    /**
     * Get all objects from the JSON data for the specified data type
     * @param dataType - JSON data type
     * @returns Array containing the matching JSON objects
     */
    function getObjectsByDataType( dataType ) {
        debug && console.log( "JSONData.getObjectsByDataType: Getting all " + dataType + " JSON objects" );
        var jsonObjs = [];

        // Attempt to get data as a single local storage item
        var item = window.localStorage.getItem( dataType );
        if ( item ) {
            jsonObjs = JSON.parse( item );
        } else {
            // Datatype stored as separate items in local storage
            for ( var key in window.localStorage ) {
                if ( key.indexOf( dataType ) == 0 ) {
                    jsonObjs.push( JSON.parse( window.localStorage.getItem( key ) ) );
                }
            }
        }

        if ( jsonObjs.length == 0 ) {
            console.warn( "JSONData.getObjectsByDataType: " + dataType + " JSON objects not found" );
        }
        return jsonObjs;
    }
    
    /**
     * Get objects from the database by datatype
     * @param dataType - JSON data type
     * @param resultCallback - Called with array of objects from database
     * @param whereClause, optional
     */
    function getObjectsFromDatabase( dataType, resultCallback, whereClause ) {
        if ( !dataType || !resultCallback || !_.isFunction( resultCallback ) ) {
            throw "JSONData.getObjectsFromDatabase: One or more required parameters (dataType, resultCallback) are undefined or invalid";
        }
        MobileDb.selectData( MobileDb.SQL_SELECT_ALL_FROM_TABLE.replace( "tableName", dataType ), null, resultCallback, null );
    }
    
    /**
     * Create a new work order line object with all values except webId, dateAdded and dateUpdated
     * initialized to 0/null.
     * @returns workOrderLine
     */
    function createNewWorkOrderLine() {
        var createDate = Util.getISOCurrentTime();
        var workOrderLine = {};
        workOrderLine.webId             = Util.getUniqueId();
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
        workOrderLine.userId            = getTechnicianUserId();
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
     * Create a new work order segment object with all propertied nulled out except
     * for the webId, dateOpened and dateCreated.
     * @returns workOrderSegment
     */
    function createNewWorkOrderSegment() {
        var createDate = Util.getISOCurrentTime();
    	var workOrderSegment = {};
    		workOrderSegment.webId               = Util.getUniqueId();
            workOrderSegment.branchId            = null;
            workOrderSegment.chargeCode          = null;
            workOrderSegment.currencyCode        = null;
            workOrderSegment.customerSignature   = null;
            workOrderSegment.dateClosed          = null;
            workOrderSegment.dateOpened          = createDate;
            workOrderSegment.dateUpdated         = createDate;
            workOrderSegment.departmentId        = null;
            workOrderSegment.discountCode        = null;
            workOrderSegment.hourMeter           = 0;
            workOrderSegment.equipmentId         = null;
            workOrderSegment.odometer            = 0;
            workOrderSegment.folderId            = 0;
            workOrderSegment.internalId          = null;
            workOrderSegment.notesBottom         = "";
            workOrderSegment.noteInstructions    = null;
            workOrderSegment.notesTop            = "";
            workOrderSegment.pmScheduleId        = null;
            workOrderSegment.priceCode           = null;
            workOrderSegment.segmentName         = "";
            workOrderSegment.segmentType         = 0;
            workOrderSegment.serviceTruckId      = null;
            workOrderSegment.shipToAddressId     = null;
            workOrderSegment.shipToCustomerId    = null;
            workOrderSegment.standardJobCodeId   = null;
            workOrderSegment.status              = null;
            workOrderSegment.taxCodeId           = null;
            workOrderSegment.technicianSignature = null;
            workOrderSegment.webStatus           = 0;
            workOrderSegment.workOrderLines      = [];
    	return workOrderSegment;
    }

    /**
     * Create a new work order with all values nulled out except for the webId.
     * @returns newWorkOrder
     */
    function createNewWorkOrder() {
    	var newWorkOrder = {};
    	    // Prefix the webId with "NEW" to mark it as a new work order
    		newWorkOrder.webId             = Util.getUniqueId();
    		newWorkOrder.addressId         = null;
    		newWorkOrder.companyId         = null;
    		newWorkOrder.customerId        = null;
    		newWorkOrder.dateOpened        = null;
    		newWorkOrder.documentNumber    = null;
    		newWorkOrder.internalId        = null;
    		// This marks the new work order as newly created by the mobile app
    		newWorkOrder.newWorkOrder      = true;
    		newWorkOrder.note              = null;
    		newWorkOrder.postToMiddleTierRequired = true;
    		newWorkOrder.workOrderSegments = [];
    		newWorkOrder.workOrderSegments.push( createNewWorkOrderSegment() );
		return newWorkOrder;
    }

    /**
     * Save the inventory quantity changes to the database
     * @param inventoryChanges - Array of inventory objects that contain quantity changes
     * @param saveCallback - This function is called when the save is complete.
     */
    function saveInventoryQuantityChanges( inventoryChanges, saveCallback ) {
        if ( !inventoryChanges || !saveCallback ) {
            throw "JSONData.saveInventoryQuantityChanges: One or more required parameters (inventoryChanges, saveCallback) are undefined";
        }
        
        if ( inventoryChanges.length > 0 ) {
            var updateStatements = [];
            _.each( inventoryChanges, function( changeInList ) {
                var updateStatement = MobileDb.SQL_UPDATE_INVENTORY_QUANTITY.replace( "quantityValue", changeInList.quantity ).replace( "webIdValue", changeInList.webId );
                changeInList.changed = false;
                updateStatements.push( updateStatement );
            });
            
            debug && console.log( "JSONData.saveInventoryQuantityChanges: Saving " + updateStatements.length + " quantity change(s)" );
            MobileDb.executeSqlBatch( updateStatements, saveCallback, null );
        } else {
            debug && console.log( "JSONData.saveInventoryQuantityChanges: inventoryChanges array is empty.  No changes saved." );
            saveCallback();
        }
    }
    
    /**
     * Get products from the products JSON.  This can return multiple products
     * if the product code matches multiple manufacturers.
     * 
     * @param type - the product type
     * @param code - the product code
     * @param resultCallback - Called with array containing product objects or an
     *                         empty array if no products were found
     */
    function getProducts( type, code, resultCallback ) {
        if ( !type || !code || !resultCallback ) {
            throw "JSONData.getProducts: One or more required parameters (type, code, resultCallback) are undefined";
        }
        var sqlParms = [];
        sqlParms.push( type );
        sqlParms.push( code );
        MobileDb.selectData( MobileDb.SQL_SELECT_PRODUCTS_BY_TYPE_AND_CODE, sqlParms, function( productRows ) {
            var products = [];
            _.each( productRows, function( productInList ) {
                debug && console.log( "JSONData.getProducts: Returned product: " + JSON.stringify( productInList ) );
                // FIXME: Products with a null manufacturer are ignored
                if ( productInList.manufacturer ) {
                    products.push( productInList );
                }
            });
            resultCallback( products );
        }, null );
    }
    
    /**
     * Get a product from the products JSON.  This should never return more than 1 product.
     * @param type - the product type
     * @param code - the product code
     * @param manufacturer - the product manufacturer
     * @param resultCallback - Called with the product object or an
     *                         null if the product is not found
     */
    function getProduct( type, code, manufacturer, resultCallback ) {
        if ( !type || !code || !manufacturer || !resultCallback ) {
            throw "JSONData.getProduct: One or more required parameters (type, code, manufacturer, resultCallback) are undefined";
        }
        var sqlParms = [];
        sqlParms.push( type );
        sqlParms.push( code );
        sqlParms.push( manufacturer );
        MobileDb.selectData( MobileDb.SQL_SELECT_PRODUCTS_BY_TYPE_CODE_AND_MFG, sqlParms, function( productRows ) {
            if ( productRows.length > 1 ) {
                console.warn( "JSONData.getProduct: More than 1 product returned from the database. 1st one returned." );
            }
            var product = null;
            if ( productRows.length > 0 ) {
                product = productRows[0];
                debug && console.debug( "JSONData.getProduct: Returning product: " + JSON.stringify( product ) ); 
            }
            resultCallback( product );
        }, null ); 
    }

    /**
     * Reset the app by reloading all JSON data
     */
    function reset() {
        // Show please wait while reset takes place
        Dialog.showPleaseWait( Localization.getText( "resetTitle"), 
                               Localization.getText( "resettingMobileApp" ), "350px" );
        removeAllLocalStorageItems();
        debug && console.log( "JSONData.reloadJSONData: JSON data being loaded into an empty local store" );
        loadJSONDataIntoDatabase( JSON_FEED_UPDATE_TYPE.FULL );
    }
    
    return {
        'PRODUCT_TYPE_PART'                         : PRODUCT_TYPE_PART,
        'PRODUCT_TYPE_EQUIPMENT'                    : PRODUCT_TYPE_EQUIPMENT,
        'PRODUCT_TYPE_LABOR'                        : PRODUCT_TYPE_LABOR,
        'SIGNATURE_FORMAT'                          : SIGNATURE_FORMAT,
        'createNewWorkOrder'                        : createNewWorkOrder,
        'createNewWorkOrderLine'                    : createNewWorkOrderLine,
        'deleteJSON'                                : deleteJSON,
        'getConfig'                                 : getConfig,
        'getJSONFeedConfig'                         : getJSONFeedConfig,
        'getObjectById'                             : getObjectById,
        'getObjectFromArrayById'                    : getObjectFromArrayById,
        'getObjectFromDatabaseById'                 : getObjectFromDatabaseById,
        'getObjectsByDataType'                      : getObjectsByDataType,
        'getObjectsFromDatabase'                    : getObjectsFromDatabase,
        'getProduct'                                : getProduct,
        'getProducts'                               : getProducts,
        'init'                                      : init,
        'loadConfiguration'                         : loadConfiguration,
        'loadJSON'                                  : loadJSON,
        'loadJSONDataIntoDatabase'                  : loadJSONDataIntoDatabase,
        'loadJSONDataIntoLocalStore'                : loadJSONDataIntoLocalStore,
        'loadJSONDataType'                          : loadJSONDataType,
        'logException'                              : logException,
        'removeAllLocalStorageItems'                : removeAllLocalStorageItems,
        'reset'                                     : reset,
        'saveInventoryQuantityChanges'              : saveInventoryQuantityChanges,
        'saveJSON'                                  : saveJSON,
        'saveJSONFeedDataIntoLocalStore'            : saveJSONFeedDataIntoLocalStore,
        'updateJSONFeedLastUpdated'                 : updateJSONFeedLastUpdated
    };
}();
