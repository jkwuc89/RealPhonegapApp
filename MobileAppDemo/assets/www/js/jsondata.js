/**
 * jsondata.js
 */

"use strict";

/**
 * JSONData
 * Encapsulate local file system functionality that is provided by PhoneGap
 */
var JSONData = function() {

    // Configuration JSON URL
    var CONFIGURATION_JSON_URL = "json/configuration.json";
        
    /**
     * Constants
     */
    var SIGNATURE_FORMAT = "image/png;base64";

    /**
     * JSON based configuration for this application
     */
    var config = null;
    
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
        
        if ( pageId != "indexPage" ) {
            // FIXME: Add a function to run every 5 minutes
            // $.doTimeout( 'JSONFeedUpdates', periodicUpdateFrequency * 60 * 1000, getPeriodicJSONFeedUpdates );
        } else {
            debug && console.log( "JSONData.init: Periodic JSON feed update disabled for pageId: " + pageId );
        }
        
        // Call the init complete callback fn if it is defined
        if ( initCompleteCallback && _.isFunction( initCompleteCallback ) ) {
            initCompleteCallback();
        }
    });

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
                config = JSON.parse( window.localStorage.getItem( "configuration" ) );
            } catch ( exc ) {
                console.warn( "JSONData.getConfig: App configuration JSON not available in local storage yet" );
                config = null;
            }
        }
        return config;
    }

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
        if ( !_.isUndefined( data.id ) ) {
            key = dataType + "." + data.id;
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
     * Save JSON feed data with 0 to n objects inside of it
     * to the local store
     * @param jsonFeedData - JSON feed data
     * @returns Number of objects saved to local storage
     */
    function saveJSONFeedDataIntoLocalStore( jsonFeedData ) {
        if ( !jsonFeedData ) {
            throw "JSONData.saveJSONFeedDataIntoLocalStore: Required parameters jsonFeedData is undefined";
        }
        var count = jsonFeedData['count'];
        var currentItem = null;
        if ( count > 0 ) {
            var dataType = Object.keys(jsonFeedData)[1];
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
     * @param successCallback
     * @param errorCallback
     */
    function loadJSONDataType( jsonFeed, successCallback, errorCallback ) {
        var jsonUrl = null;
        jsonUrl = getConfig().serverBaseUrl + "/" + jsonFeed.url;
        if ( Util.isOnline() && jsonFeed.url != "" ) {
            debug && console.log( "JSONData.loadJSONDataType: Loading JSON datatype '" +
                                  jsonFeed.name + "' via '" + jsonUrl + "'" );
            loadJSON( jsonUrl, successCallback, errorCallback );
        } else {
            // Feeds that are skipped will result in success callback being called
            // immediately with an empty data object
            debug && console.log( "JSONData.loadJSONDataType: Update of JSON feed " + jsonFeed.name +
                                  " skipped because it does not support updates" );
            var emptyUpdateData = {
                count : 0
            };
            emptyUpdateData[jsonFeed.name] = [];
            successCallback( emptyUpdateData );
        }
    }
    
    /**
     * Load JSON feeds into the database
     */
    var loadJSONDataIntoDatabaseComplete = null;
    var loadJSONDataErrorOccurred = false;
    function loadJSONDataIntoDatabase() {

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
            loadJSONDataIntoLocalStore();
        });
        
        // Load all of the database feeds
        for ( var i = 0; i < getConfig().jsonDatabaseFeeds.length; i++ ) {
            var currentJSONFeed = getConfig().jsonDatabaseFeeds[i];
            debug && console.log( "JSONData.loadJSONFilesIntoDatabase: Loading JSON datatype '" +
                                  currentJSONFeed.name + "' into the DB" );
            loadJSONDataType( currentJSONFeed, 
                // Success call back stores the JSON data into the database 
                function( data, textStatus, jqXHR ) {
                    var dataType = _.keys(data)[1];
                    debug && console.log( "JSONData.loadJSONDataIntoDatabase: Storing " + dataType + " into DB" );
                    // During a full sync, tables are created and populated
                    MobileDb.populateTable( data, function() {
                        debug && console.log( "JSONData.loadJSONDataIntoDatabase: " + dataType + " table created and populated" );
                        loadJSONDataIntoDatabaseComplete();
                    });
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
     */
    var loadJSONDataIntoLocalStoreStartTime = null;
    var loadJSONDataIntoLocalStoreComplete = null;
    function loadJSONDataIntoLocalStore() {
        // Set up an _.after function that executes once when all JSON data is loaded into
        // the local store
        loadJSONDataIntoLocalStoreComplete = _.after( getConfig().jsonLocalStoreFeeds.length, function() {
            debug && console.log( "JSONData.loadJSONDataIntoLocalStoreComplete: Executed once after all JSON is loaded into local storage" );
            // Close the please wait dialog 
            UIFrame.closeActiveDialog();
            
            var loadTime = ( new Date().getTime() - loadJSONDataIntoLocalStoreStartTime ) / 1000; 
            debug && console.log( "JSONData.loadJSONDataIntoLocalStoreComplete: JSON data loading is complete.  Load time = " + loadTime + " seconds" );

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
                        debug && console.log( "JSONData.loadJSONDataIntoLocalStoreComplete: JSON reload is complete" );
                        UIFrame.closeActiveDialog();
                        loadConfiguration( function() {
                            debug && console.log( "JSONData.loadJSONDataIntoLocalStoreComplete: Configuration reloaded" );
                        });
                    }, "350px"
                );
            }
        });
        
        loadJSONDataIntoLocalStoreStartTime = new Date().getTime();
        for ( var i = 0; i < getConfig().jsonLocalStoreFeeds.length; i++ ) {
            debug && console.log( "JSONData.loadJSONFilesIntoLocalStore: Loading JSON datatype '" +
                                  getConfig().jsonLocalStoreFeeds[i].name + "' into local store" );
            loadJSONDataType( getConfig().jsonLocalStoreFeeds[i], 
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
     */
    function getObjectsFromDatabase( dataType, resultCallback ) {
        if ( !dataType || !resultCallback || !_.isFunction( resultCallback ) ) {
            throw "JSONData.getObjectsFromDatabase: One or more required parameters (dataType, resultCallback) are undefined or invalid";
        }
        MobileDb.selectData( MobileDb.SQL_SELECT_ALL_FROM_TABLE.replace( "tableName", dataType ), null, resultCallback, null );
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
        loadJSONDataIntoDatabase();
    }
    
    return {
        'SIGNATURE_FORMAT'                          : SIGNATURE_FORMAT,
        'deleteJSON'                                : deleteJSON,
        'getConfig'                                 : getConfig,
        'getJSONFeedConfig'                         : getJSONFeedConfig,
        'getObjectById'                             : getObjectById,
        'getObjectFromArrayById'                    : getObjectFromArrayById,
        'getObjectsByDataType'                      : getObjectsByDataType,
        'getObjectsFromDatabase'                    : getObjectsFromDatabase,
        'init'                                      : init,
        'loadConfiguration'                         : loadConfiguration,
        'loadJSON'                                  : loadJSON,
        'loadJSONDataIntoDatabase'                  : loadJSONDataIntoDatabase,
        'loadJSONDataIntoLocalStore'                : loadJSONDataIntoLocalStore,
        'loadJSONDataType'                          : loadJSONDataType,
        'logException'                              : logException,
        'removeAllLocalStorageItems'                : removeAllLocalStorageItems,
        'reset'                                     : reset,
        'saveJSON'                                  : saveJSON,
        'saveJSONFeedDataIntoLocalStore'            : saveJSONFeedDataIntoLocalStore
    };
}();
