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
    
    /**
     * Logon JSON datatype and its webId
     */
    var JSON_DATATYPE_LOGON = "logon";
    var LOGON_WEBID         = 1;
    
    // Configuration JSON URL
    var CONFIGURATION_JSON_URL = "json/configuration.json";
        
    // Holds list of available standard job codes.  This is used by 
    // saveJSONFeedDataIntoLocalStore to merge standard job code information
    // into all work orders saved to local storage
    var standardJobCodes = [];
    
    /**
     * Constants
     */
    var BILLING_FOLDER_CUSTOMER_PAY             = "Cust Pay";
    var COMM_DETAIL_TYPE_EMAIL                  = "EMAIL";
    var DEFAULT_LUNCH_LENGTH_IN_MINS            = 30;
    var MESSAGE_TYPE_GENERAL                    = 0;
    var MESSAGE_TYPE_WO_REJECTED                = 1;
    var MESSAGE_TYPE_PART_REQUEST               = 2;
    var MESSAGE_TYPE_WO_REVIEW                  = 3;
    var MESSAGE_TYPE_CUSTOMER_CONTACT_UPDATE    = 4;
    var OUTSIDE_PART_PURCHASE_PRODUCE_CODE      = "MISC";
    var PRODUCT_TYPE_PART                       = 1;
    var PRODUCT_TYPE_EQUIPMENT                  = 2;
    var PRODUCT_TYPE_LABOR                      = 3;
    var SIGNATURE_FORMAT                        = "image/png;base64";
    var STOCK_AREA_TYPE_VAN                     = 2;
    var WORK_ORDER_LINE_PART_TYPE               = 0;
    var WORK_ORDER_LINE_LABOR_TYPE              = 8;
    var WORK_ORDER_LINE_MFG_LABOR               = "LABR";
    var WORK_ORDER_LINE_PTR                     = "PTR";
    var WORK_ORDER_LINE_TTR                     = "TTR";

    /**
     * Local storage location for the currently open work order ID
     */
    var LS_CURRENT_WORK_ORDER_ID = "currentWorkOrderId";
    
    /**
     * Local storage location for work order ID being viewed inside 
     * the manage work order pages 
     */
    var LS_MANAGE_WORK_ORDER_ID = "manageWorkOrderId";
    
    /**
     * Local storage location for making manage work order writable
     */
    var LS_MANAGE_WORK_ORDER_WRITABLE = "manageWorkOrderWritable";
    
    /**
     * Local storage location for work order ID associated with 
     * a clocking change to traveling or productive
     */
    var LS_WORK_ORDER_ID_FOR_CLOCKING_CHANGE = "workOrderIdForClockingChange";
    
    /**
     * JSON based configuration for this application
     */
    var config = null;
    
    /**
     * Login input
     */
    var usernameInput = null;
    var passwordInput = null;
    
    /**
     * Valid JSON feed update types
     */
    var JSON_FEED_UPDATE_TYPE = {
        FULL : 0,
        DAILY : 1,
        PERIODIC : 2
    };
    
    /**
     * Technician's web user ID
     */
    var technicianWebUserId = null;

    /**
     * Valid clocking statuses.  One of these will always be passed
     * into recordTime().  Please keep this array sorted to improve
     * search performance.
     * 
     * 5 is used as the technician status and 200 and 201 are used as
     * the unproductiveTimeReason values for logged in and logged out
     * 
     * Using 900 internally as the logged in/out technician status
     */
    var TECHNICIAN_STATUS_TRAVELING      = 300;
    var TECHNICIAN_STATUS_PRODUCTIVE     = 500;
    var TECHNICIAN_STATUS_NON_PRODUCTIVE = 600;
    var TECHNICIAN_STATUS_LOGGED_IN_OUT  = 900;
    var VALID_CLOCKING_STATUSES = [
        {
            key : "technicianStatusLoggedIn",
            technicianStatus : TECHNICIAN_STATUS_LOGGED_IN_OUT,
            unproductiveTimeReason : 200,
            laborCodeId : 28
        },
        {
            key : "technicianStatusLunch",
            technicianStatus : TECHNICIAN_STATUS_NON_PRODUCTIVE,
            unproductiveTimeReason : 100,
            laborCodeId : 25
        },
        {
            key : "technicianStatusNoPay",
            technicianStatus : TECHNICIAN_STATUS_NON_PRODUCTIVE,
            unproductiveTimeReason : 99,
            laborCodeId : 24
        },
        {
            key : "technicianStatusNonProductive",
            technicianStatus : -1,
            unproductiveTimeReason : null,
            laborCodeId : 28
        },
        {
            key : "technicianStatusPaperwork",
            technicianStatus : TECHNICIAN_STATUS_NON_PRODUCTIVE,
            unproductiveTimeReason : 10,
            laborCodeId : 14
        },
        {
            key : "technicianStatusProductive",
            technicianStatus : TECHNICIAN_STATUS_PRODUCTIVE,
            unproductiveTimeReason : null,
            laborCodeId : 3
        },
        {
            key : "technicianStatusTraining",
            technicianStatus : TECHNICIAN_STATUS_NON_PRODUCTIVE,
            unproductiveTimeReason : 15,
            laborCodeId : 17
        },
        {
            key : "technicianStatusTraveling",
            technicianStatus : TECHNICIAN_STATUS_TRAVELING,
            unproductiveTimeReason : null,
            laborCodeId : 6
        },
        {
            key : "technicianStatusVehicleMaintenance",
            technicianStatus : TECHNICIAN_STATUS_NON_PRODUCTIVE,
            unproductiveTimeReason : 18,
            laborCodeId : 19
        },
        {
            key : "technicianStatusViewOnly",
            technicianStatus : TECHNICIAN_STATUS_LOGGED_IN_OUT,
            unproductiveTimeReason : null,
            laborCodeId : 28 
        },
        {
            key : "technicianStatusLoggedOut",
            technicianStatus : TECHNICIAN_STATUS_LOGGED_IN_OUT,
            unproductiveTimeReason : 201,
            laborCodeId : 28
        }
    ];
    
    /**
     * Valid work order statuses
     */
    var WORK_ORDER_STATUS_DISPATCHED        = 0;
    var WORK_ORDER_STATUS_NOT_STARTED       = 100;
    var WORK_ORDER_STATUS_REJECTED          = 200;
    var WORK_ORDER_STATUS_IN_PROGRESS       = 500;
    var WORK_ORDER_STATUS_WAITING_ON_HOLD   = 600;
    var WORK_ORDER_STATUS_COMPLETED         = 700;
    var VALID_WORK_ORDER_STATUSES = [
        {
            id : "dispatchedStatus",
            webStatus : WORK_ORDER_STATUS_DISPATCHED,
            icon : "dispatchedstatusicon.png"
        },
        {
            id : "rejectedStatus",
            webStatus : WORK_ORDER_STATUS_REJECTED,
            icon : "dispatchedstatusicon.png"
        },
        {
            id : "notStartedStatus",
            webStatus : WORK_ORDER_STATUS_NOT_STARTED,
            icon : "notstartedstatusicon.png"
        },
        {
            id : "inProgressStatus",
            webStatus : WORK_ORDER_STATUS_IN_PROGRESS,
            icon : "inprogressstatusicon.png"
        },
        {
            id : "waitingOnHoldStatus",
            webStatus : WORK_ORDER_STATUS_WAITING_ON_HOLD,
            icon : "waitingonholdstatusicon.png"
        },
        {
            id : "completedStatus",
            webStatus : WORK_ORDER_STATUS_COMPLETED,
            icon : "completedstatusicon.png"
        }
    ];

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
        if ( pageId != "loginPage" ) {
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
        
        // If saving a work order, merge in supporting information if it's missing
        if ( dataType == "workOrders" ) {
            mergeSupportingDataIntoWorkOrder( data, null );
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
     * Return the number of work orders saved during the last JSON feed update
     */
    var numWorkOrdersSavedDuringLastUpdate = 0;
    function getNumWorkOrdersSavedDuringLastUpdate() {
        return numWorkOrdersSavedDuringLastUpdate;
    }

    /**
     * Return the number of PM schedules saved during the last JSON feed update
     */
    var numPMSchedulesSavedDuringLastUpdate = 0;
    function getNumPMSchedulesSavedDuringLastUpdate() {
        return numPMSchedulesSavedDuringLastUpdate;
    }
    
    /**
     * Set up an after function to create a dependency between
     * the equipment feed and the work order feed.
     */
    var workOrderJSONData = null;
    var saveWorkOrderJSONFeedDataAfterFn = null;
    function saveWorkOrderJSONFeedDataIntoLocalStore() {
        debug && console.log( "JSONData.saveWorkOrderJSONFeedDataIntoLocalStore: Saving work order JSON data" );
        if ( !workOrderJSONData ) {
            throw "JSONData.saveWorkOrderJSONFeedDataIntoLocalStore: workOrderJSONData is null";
        }
        if ( standardJobCodes.length == 0 ) {
            JSONData.getObjectsFromDatabase( "standardJobCodes", function( results ) { 
                standardJobCodes = results;
                numWorkOrdersSavedDuringLastUpdate = saveJSONFeedDataIntoLocalStore( workOrderJSONData );
                workOrderJSONData = null;
                loadJSONDataIntoLocalStoreComplete();
            });
        } else {
            numWorkOrdersSavedDuringLastUpdate = saveJSONFeedDataIntoLocalStore( workOrderJSONData );
            workOrderJSONData = null;
            loadJSONDataIntoLocalStoreComplete();
        }
    }

    /**
     * Set up an after function to create a dependency between
     * the equipment feed and the pmschedule feed.
     */
    var pmScheduleJSONData = null;
    var savePMScheduleJSONFeedDataAfterFn = null;
    function savePMScheduleJSONFeedDataIntoLocalStore() {
        debug && console.log( "JSONData.savePMScheduleJSONFeedDataIntoLocalStore: Saving pm schedule JSON data" );
        if ( !pmScheduleJSONData ) {
            throw "JSONData.savePMScheduleJSONFeedDataIntoLocalStore: pmScheduleJSONData is null";
        }
        if ( standardJobCodes.length == 0 ) {
            JSONData.getObjectsFromDatabase( "standardJobCodes", function( results ) { 
                standardJobCodes = results;
                numPMSchedulesSavedDuringLastUpdate = saveJSONFeedDataIntoLocalStore( pmScheduleJSONData );
                pmScheduleJSONData = null;
                loadJSONDataIntoLocalStoreComplete();
            });
        } else {
            numPMSchedulesSavedDuringLastUpdate = saveJSONFeedDataIntoLocalStore( pmScheduleJSONData );
            pmScheduleJSONData = null;
            loadJSONDataIntoLocalStoreComplete();
        }
    }
    
    /**
     * To improve performance, supporting data is merged into the work order.
     * This eliminates costly lookups of other JSON data.
     * @param workOrder
     * @param equipmentArray
     */
    function mergeSupportingDataIntoWorkOrder( workOrder, equipmentArray ) {
        if ( !workOrder ) {
            throw "JSONData.mergeSupportingDataIntoWorkOrder: Required parameter workOrder is undefined";
        }
        if ( ( !workOrder.workOrderSegments[0].equipment && workOrder.workOrderSegments[0].equipmentId ) ||
             ( !workOrder.workOrderSegments[0].standardJobCode && workOrder.workOrderSegments[0].standardJobCodeId ) ) {
            debug && console.log( "JSONData.mergeSupportingDataIntoWorkOrder: Merging supporting information into work order " +
                                  workOrder.documentNumber );
            if ( !equipmentArray ) {
                equipmentArray = getObjectsByDataType( "equipment" );
            }
            if ( workOrder.workOrderSegments[0].standardJobCodeId && standardJobCodes && standardJobCodes.length > 0 ) {
                var standardJobCode = getObjectFromArrayById( standardJobCodes,
                                                              workOrder.workOrderSegments[0].standardJobCodeId );
                workOrder.workOrderSegments[0].standardJobCode = standardJobCode;
            }
            if ( workOrder.workOrderSegments[0].equipmentId ) {
                var equipment = getObjectFromArrayById( equipmentArray, workOrder.workOrderSegments[0].equipmentId );
                workOrder.workOrderSegments[0].equipment = equipment;
            }
        } else {
            debug && console.log( "JSONData.mergeSupportingDataIntoWorkOrder: Merge of supporting information into work order " +
                                  workOrder.documentNumber + " not needed" );
        }
    }
    
    /**
     * To improve performance, supporting data is merged into the PM schedule
     * This eliminates costly lookups of other JSON data.
     * @param pmSchedule
     * @param equipmentArray
     */
    function mergeSupportingDataIntoPMSchedule( pmSchedule, equipmentArray ) {
        if ( !pmSchedule || !equipmentArray ) {
            throw "JSONData.mergeSupportingDataIntoPMSchedule: One or more required parameters (pmSchedule, equipmentArray) is undefined";
        }
        if ( pmSchedule.standardJobCodeId ) {
            var standardJobCode = getObjectFromArrayById( standardJobCodes,
                                                          pmSchedule.standardJobCodeId );
            pmSchedule.standardJobCode = standardJobCode;
        }
        if ( pmSchedule.equipmentId ) {
            var equipment = getObjectFromArrayById( equipmentArray, pmSchedule.equipmentId );
            pmSchedule.equipment = equipment;
        }
    }
    
    /**
     * Save JSON feed data with 0 to n objects inside of it
     * to the local store
     * @param jsonFeedData - JSON feed data
     * @returns Number of objects saved to local storage
     */
    var equipmentArrayForSavingJSONFeedData = [];
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
                
                // Only save webUser information for the currently logged on technician
                if ( dataType == "webUsers") {
                    var webUserInfo = _.find( jsonFeedData[dataType], function( webUserInList ) {
                        return webUserInList.webId == technicianWebUserId;
                    });
                    if ( webUserInfo ) {
                        // Save single web user for current technician as an array so that the
                        // methods the get JSON objects will work properly.
                        var webUsers = [];
                        webUsers.push( webUserInfo );
                        window.localStorage.setItem( dataType, JSON.stringify( webUsers ) );
                    }
                } else {
                    window.localStorage.setItem( dataType, JSON.stringify(jsonFeedData[dataType]) );
                }
            } else {
                if ( dataType == "workOrders" || dataType == "pmSchedules" ) {
                    if ( equipmentArrayForSavingJSONFeedData.length == 0 ) {
                        equipmentArrayForSavingJSONFeedData = getObjectsByDataType( "equipment" );
                    }
                }
                for ( var i = 0; i < count; i++ ) {
                    currentItem = jsonFeedData[dataType][i];
                    // Certain data types will include properties from other
                    // data types before being saved to local storage.  This improves
                    // page loading performance
                    switch ( dataType ) {
                        case "workOrders" :
                            // Skip work orders whose status is rejected or completed
                            if ( currentItem.workOrderSegments[0].webStatus == JSONData.WORK_ORDER_STATUS_COMPLETED ||
                                 currentItem.workOrderSegments[0].webStatus == JSONData.WORK_ORDER_STATUS_REJECTED ) {
                                continue;
                            }
                            mergeSupportingDataIntoWorkOrder( currentItem, equipmentArrayForSavingJSONFeedData );
                            break;
                        case "pmSchedules" :
                            mergeSupportingDataIntoPMSchedule( currentItem, equipmentArrayForSavingJSONFeedData );
                            break;
                    }
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
            jsonUrl = getConfig().middleTierBaseUrl + getConfig().middleTierVersion + "/" + jsonFeed.url;
            
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
     * Common periodic JSON feed update complete function.  This is called after
     * every periodic JSON feed update.  It will call the page specific update complete function
     * if it's defined.
     */
    var numDispatchedWorkOrders = 0;
    function periodicJSONUpdateComplete( pageSpecificUpdateCompleteFn ) {
        debug && console.log( "JSONData.periodicJSONUpdateComplete: Periodic JSON feed update is complete" );
        
        if ( numWorkOrdersSavedDuringLastUpdate > 0 ) {
            // If the new work order count increases, play a beep and vibrate the tablet
            if ( getNewWorkOrderCount() > numDispatchedWorkOrders ) {
                if ( navigator.notification ) {
                    debug && console.log( "JSONData.periodicJSONUpdateComplete: Alert technician about newly arrived dispatched work orders" );
                    if ( navigator.notification.beep ) {
                        navigator.notification.beep(1);
                    }
                    if ( navigator.notification.vibrate ) {
                        navigator.notification.vibrate( 500 );
                    }
                }
            }
            // Update the toolbox icon with the updated number of dispatched work orders
            UIFrame.updateToolboxCountBadge();
        } else {
            debug && console.log( "JSONData.periodicJSONUpdateComplete: No work orders saved during last update" );
        }
        
        if ( pageSpecificUpdateCompleteFn && _.isFunction( pageSpecificUpdateCompleteFn ) ) {
            debug && console.log( "JSONData.periodicJSONUpdateComplete: Calling page specific complete function" );
            pageSpecificUpdateCompleteFn();
        }
    }
    
    /**
     * Set the page specific JSON feed update complete function.  This is optionally
     * used by any page that wishes to execute some page specific functionality
     * when a periodic JSON feed update completes
     * @param updateCompleteFn - Page specific update complete function
     */
    var pageSpecificPeriodicUpdateCompleteFn = null;
    function setPageSpecificPeriodicUpdateCompleteFn( updateCompleteFn ) {
        if ( updateCompleteFn && _.isFunction( updateCompleteFn ) ) {
            pageSpecificPeriodicUpdateCompleteFn = updateCompleteFn;
        }
    }
    
    /**
     * Polling loop function for pulling JSON feed updates
     * @param manuallyStarted - Was the refresh manually started? If so, skip 
     *                          the check for an active dialog because a manual refresh
     *                          displays a progress dialog.
     */
    var periodicUpdateCompleteFn = null;
    function getPeriodicJSONFeedUpdates( manuallyStarted ) {
        if ( _.isUndefined( manuallyStarted ) ) {
            manuallyStarted = false;
        }
        // Don't start the periodic update if a dialog is displayed
        if ( !manuallyStarted && UIFrame.isDialogDisplayed() ) {
            debug && console.log( "JSONData.getPeriodicJSONFeedUpdates: Periodic update skipped because a dialog is displayed" );
        } else {
            // Set up the complete function that is called when the periodic update completes
            if ( pageSpecificPeriodicUpdateCompleteFn && _.isFunction( pageSpecificPeriodicUpdateCompleteFn ) ) {
                periodicUpdateCompleteFn = _.wrap( pageSpecificPeriodicUpdateCompleteFn, periodicJSONUpdateComplete );
            } else {
                periodicUpdateCompleteFn = periodicJSONUpdateComplete;
            }
            debug && console.log( "JSONData.getPeriodicJSONFeedUpdates: JSON feed polling function executing" );
            if ( Util.isOnline() ) {
                loadJSONDataIntoDatabase( JSON_FEED_UPDATE_TYPE.PERIODIC );
            } else {
                debug && console.log( "JSONData.getPeriodicJSONFeedUpdates: Skipped because app is offline" );
            }
        }
        return true;
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
        
        // Set up the after functions that are called when feed requests come back from the middle tier
        // This allows us to control dependencies between the feeds
        savePMScheduleJSONFeedDataAfterFn = _.after( 2, savePMScheduleJSONFeedDataIntoLocalStore );
        saveWorkOrderJSONFeedDataAfterFn = _.after( 2, saveWorkOrderJSONFeedDataIntoLocalStore );
        
        // Reset update counters 
        numPMSchedulesSavedDuringLastUpdate = 0;
        numWorkOrdersSavedDuringLastUpdate = 0;
        
        // Get current number of dispatched work orders.  This allows us to alert the technician
        // about newly arrived dispatched work orders after the JSON feed update is complete
        numDispatchedWorkOrders = getNewWorkOrderCount();
        debug && console.log( "JSONData.loadJSONDataIntoDatabase: Current number of dispatched work orders = " + numDispatchedWorkOrders );
        
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
                case JSON_FEED_UPDATE_TYPE.DAILY :
                    // When daily update is complete, navigate to the home page
                    Dialog.showAlert( Localization.getText( "updateApplicationTitle" ),
                                      Localization.getText( "updateApplicationComplete" ),
                        function() {
                            updateAllJSONFeedsLastUpdated( getConfig(), updateType );
                            if ( UIFrame ) {
                                UIFrame.navigateToPage( "home.html" );
                            }
                    }, "350px"
                    );
                    break;
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
                                loadConfiguration( function() {
                                    updateAllJSONFeedsLastUpdated( config, updateType );
                                    // Reset complete...start login again using previously
                                    // entered username and password
                                    logon( usernameInput, passwordInput );
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
        
        // Save the JSON feed data
        var dataType = Object.keys(data)[2];

        // Equipment feed must be available before the work orders or pmschedules can be saved.
        // The switch below in combination with the _.after functions above
        // enforce this.
        switch ( dataType ) {
            case "equipment" :
                saveJSONFeedDataIntoLocalStore( data );
                saveWorkOrderJSONFeedDataAfterFn();
                savePMScheduleJSONFeedDataAfterFn();
                loadJSONDataIntoLocalStoreComplete();
                break;
            case "pmSchedules" :
                pmScheduleJSONData = data;
                savePMScheduleJSONFeedDataAfterFn();
                break;
            case "workOrders" :
                workOrderJSONData = data;
                saveWorkOrderJSONFeedDataAfterFn();
                break;
            default: 
                saveJSONFeedDataIntoLocalStore( data );
                loadJSONDataIntoLocalStoreComplete();
        }
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
     * Log onto the mobile app
     * @param username
     * @param password
     */
    function logon( username, password ) {
        debug && console.log( "JSONData.logon: Logging onto mobile app" );
        
        usernameInput = username;
        passwordInput = password;
        
        if ( Util.isOnline() ) {
            debug && console.log( "JSONData.logon: App is online. Logon with middle tier will be attempted" );
            
            // Post the request to logon
            $.ajax( {
                url : getConfig().middleTierBaseUrl + getConfig().logonUrl,
                type : "POST",
                timeout : (getConfig().logonTimeout * 1000),
                beforeSend : function( xhr ) {
                    // Logon requires this additional header
                    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                },
                data : {
                    j_username : getConfig().enterpriseId + ";" + username,
                    j_password : password
                },
                dataType : 'json',
                success : function( data, textStatus, jqXHR ) {
                	UIFrame.closeActiveDialog();
                    logonSuccessful( data, textStatus, jqXHR );
                },
                error : function( jqXHR, textStatus, errorThrown ) {
                    debug && console.log( "JSONData.logon: ajax error" );
                    UIFrame.closeActiveDialog();
                    if ( textStatus && textStatus.length > 0 ) {
                        debug && console.log( "JSONData.logon: error status text = " + textStatus );
                    }
                    logonFailed();
                }
            });
        } else {
            debug && console.log( "JSONData.logon: App is offline. Disconnected logon will be attempted" );
            try {
                var logon = getObjectById( JSON_DATATYPE_LOGON, LOGON_WEBID );
                var now = new Date();
                var logonDate = new Date( logon.tokenExpiration );
                if ( now < logonDate ) {
                    if ( usernameInput == logon.username && 
                         passwordInput == logon.password ) {
                        debug && console.log( "JSONData.logon: Disconnected logon successful" );
                        logonSuccessful( logon, null, null );
                    } else {
                        debug && console.log( "JSONData.logon: Disconnected logon failed because of username / password" );
                        logonFailed();
                    }
                } else {
                    debug && console.log( "JSONData.logon: Disconnected logon failed because logon JSON is expired" );
                    logonFailed();
                }
            } catch ( exc ) {
                debug && console.log( "JSONData.logon: Disconnected logon failed because local logon JSON is missing" );
                logonFailed();
            }
        }
    }
    
    /**
     * Used by logon above when logging on is successful
     * @param data - Data returned from ajax logon request
     * @param textStatus - Text status returned from ajax logon request
     * @param jqXHR - Response object returned from ajax logon request 
     */
    function logonSuccessful( data, textStatus, jqXHR ) {
        debug && console.log( "JSONData.logonSuccessful: Logon successful" );
        
        // Does application need to be reset?
        if ( !getConfig().dateTimeFullSync ) {
            Dialog.showConfirmYesNo( Localization.getText( "resetTitle" ), Localization.getText( "resetPrompt" ),
                function() {
                    UIFrame.closeActiveDialog();
                    technicianWebUserId = data.webUserId;
                    reset();
                },
                function() {
                    UIFrame.closeActiveDialog();
                    Dialog.showAlert( Localization.getText( "resetTitle" ), 
                                      Localization.getText( "resetRequired" ), null,
                                      "350px" );
                }, "350px" );
        } else {
            // Verify that all items in local storage are present
            checkLocalStorageItems();
            
            // Save the authentication information if an online authentication was performed
            if ( Util.isOnline() && usernameInput && passwordInput ) {
                data.webId = LOGON_WEBID;
                data.username = usernameInput;
                data.password = passwordInput;
                saveJSON( JSON_DATATYPE_LOGON, data );
                usernameInput = null;
                passwordInput = null;
            }
            
            // Change the clocking status
            var currentClockingStatus = getCurrentClockingStatus();
            if ( !currentClockingStatus || currentClockingStatus == "technicianStatusLoggedOut" ) { 
                changeClockingStatus( "technicianStatusLoggedIn", null, null );
            }

            // Do we need to pull the daily JSON update?
            var dailyJSONUpdateNeeded = false;
            if ( getConfig().dateTimeDailyUpdate ) {
                var now = new Date().getTime();
                var lastDailyUpdate = new Date( getConfig().dateTimeDailyUpdate ).getTime();
                if ( ( now - lastDailyUpdate ) > getConfig().dailyUpdateFrequency * 60 * 1000 ) {
                    dailyJSONUpdateNeeded = true;
                }
            } else {
                dailyJSONUpdateNeeded = true;
            }
            debug && console.log( "JSONData.logonSuccessful: Daily JSON update needed = " + dailyJSONUpdateNeeded );
            
            // Start the daily JSON feed update
            if ( dailyJSONUpdateNeeded ) {
                Dialog.showPleaseWait( Localization.getText( "updateApplicationTitle" ), 
                                       Localization.getText( "updatingApplicationData" ) );
                loadJSONDataIntoDatabase( JSON_FEED_UPDATE_TYPE.DAILY );
            } else {
                // Logon complete, navigate to the home page
                if ( UIFrame ) {
                    UIFrame.navigateToPage( "home.html" );
                }
            }
        }
    }
    
    /**
     * Handle a logon failure
     */
    function logonFailed() {
        debug && console.log( "JSONData.logonSuccessful: Logon failed" );
        UIFrame.closeActiveDialog();
        Dialog.showAlert( Localization.getText( "loginFailedTitle" ), Localization.getText( "loginFailedPrompt" ), null, "300px" );
    }

    /**
     * Logoff the mobile app
     */
    function logoff() {
        debug && console.log( "JSONData.logoff: Logging off the mobile app" );
        changeClockingStatus( "technicianStatusLoggedOut", null, null );
        // Logoff complete, navigate to the login page
        if ( UIFrame ) {
            UIFrame.navigateToPage( "index.html" );
        }
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
        var postUrl = getConfig().middleTierBaseUrl + getConfig().middleTierVersion + "/" + url; 

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
     * Post technician clockings to the middle tier
     * @param technicianClockings - Array of technician clockings to post
     * @param displayProgressDialog - Display the progress dialog while posting
     * @param reloadPageAfterPost - Reload the current page after a successful post
     * @param successCallback - This is called when the post is successful.  
     * @param errorCallback - This is called when the post fails
     */
    function postTechnicianClockings( technicianClockings, displayProgressDialog, reloadPageAfterPost, successCallback, errorCallback ) {
        if ( !technicianClockings || !_.isArray(technicianClockings) || technicianClockings.length == 0 ) {
            throw "JSONData.postTechnicianClockings: Required parameter technicianClockings is undefined or invalid";
        }
        // Must be online to post a work order
        if ( Util.isOnline() ) {
            
            // Remove the temporary web IDs from the clocking data
            var technicianClockingsForMiddleTier = [];
            _.each( technicianClockings, function( clockingInList ) {
                var newClocking = Util.clone( clockingInList );
                newClocking.webId = null;
                technicianClockingsForMiddleTier.push( newClocking );
            });
            
            var technicianClockingData = JSON.stringify( technicianClockingsForMiddleTier );
            debug && console.log( "JSONData.postTechnicianClockings: JSON data: " + technicianClockingData );
            // Display please wait while the post takes place
            if ( displayProgressDialog ) {
                Dialog.showPleaseWait( Localization.getText( "postingTechnicianClockingsTitle" ),
                                       Localization.getText( "postingTechnicianClockingsText" ), "400px" );
            }
            debug && console.log( "JSONData.postTechnicianClockings: App is online. Post of " +
                                  technicianClockings.length + " object(s) to middle tier will be attempted. Post attempt will timeout in " +
                                  getConfig().technicianClockingUpdateTimeout + " seconds." );
            
            postDataToMiddleTier( getConfig().technicianClockingUpdateUrl, technicianClockingData, 
                                  getConfig().technicianClockingUpdateTimeout,
                // Success callback                  
                function( updatedTechnicianClockings ) {
                    // JSON data indicates successful post.  Save updated
                    // technician clockings and call the specified success callback if available.
                    debug && console.log( "JSONData.postTechnicianClockings: Post of " + 
                                          updatedTechnicianClockings.total + " technician clockings successful" );
                    _.each( technicianClockings, function( clockingInList ) {
                        deleteJSON( "technicianClocking", clockingInList.webId );
                    });
                    _.each( updatedTechnicianClockings.technicianClocking, function( clockingInList ) {
                        // Clear the post required flag if it's still present
                        if ( clockingInList.postToMiddleTierRequired ) {
                            delete clockingInList.postToMiddleTierRequired;
                        }
                        saveJSON( "technicianClocking", clockingInList );
                    });

                    if ( displayProgressDialog ) {
                        UIFrame.closeActiveDialog();
                    }
                    
                    // Reload the current page
                    if ( reloadPageAfterPost ) {
                        UIFrame.reloadCurrentPage();
                    } 
                    
                    // Call the success callback if it's defined
                    if ( successCallback && _.isFunction( successCallback ) ) {
                        successCallback( updatedTechnicianClockings );
                    }
                },
                // Error callback
                function() {
                    if ( displayProgressDialog ) {
                        UIFrame.closeActiveDialog();
                    }
                    if ( errorCallback && _.isFunction( errorCallback ) ) {
                        errorCallback();
                    }
                }
            );
        } else {
            console.warn( "JSONData.postTechnicianClockings: App is offline. Post will not occur." );
        }
    }    

    /**
     * Get the list of locally saved work orders that require a post to the middle tier
     * @returns Array of work orders that need to be posted to the middle tier
     */
    function getWorkOrdersRequiringPostToMiddleTier() {
        var workOrders = _.filter( getObjectsByDataType( "workOrders" ), function( workOrderInList ) {
            return workOrderInList.postToMiddleTierRequired;
        });
        if ( workOrders && workOrders.length > 0 ) {
            workOrders = _.sortBy( workOrders, function( workOrderInList ) {
                return workOrderInList.documentNumber;
            });
        }
        debug && console.log( "JSONData.getWorkOrdersRequiringPostToMiddleTier: " + workOrders.length +
                              " work orders need to be posted to the middle tier" );
        return workOrders;
    }

    /**
     * Post an array of work orders to the middle tier
     * @param workOrders - Array of work orders to post
     * @param completeCallback - Callback function called when all posts are complete, optional
     */
    function postWorkOrders( workOrders, completeCallback ) {
        if ( !workOrders || !_.isArray( workOrders ) || workOrders.length == 0 ) {
            throw "JSONData.postWorkOrders: Required parameter workOrders is missing or is invalid";
        }
        if ( Util.isOnline() ) {
            var workOrderNumbers = Util.getWorkOrderDocumentNumbersAsString( workOrders );

            debug && console.log( "JSONData.postWorkOrders: Posting " + workOrders.length +
                                  " work orders to the middle tier" );
            // Set up a complete function that is executed once after all of the work orders are posted.
            var completeFn = _.after( workOrders.length,
                function() {
                    debug && console.log( "JSONData.postWorkOrders: " + workOrders.length +
                                          " work orders posted to the middle tier" );
                    // Close the progress dialog
                    UIFrame.closeActiveDialog();
                    
                    // Call the complete callback if it's defined
                    if ( completeCallback && _.isFunction( completeCallback ) ) {
                        completeCallback();
                    }
                } );

            Dialog.showPleaseWait( Localization.getText( "postingWorkOrdersTitle" ),
                                   Localization.getText( "postingWorkOrdersText" ).replace( "workOrders", workOrderNumbers ) );
            // Post all of the work orders 
            _.each( workOrders, function( workOrderInList ) {
                debug && console.log( "JSONData.postWorkOrders: Posting work order " + workOrderInList.documentNumber );
                JSONData.postWorkOrder( workOrderInList, false, false, completeFn, completeFn );
            } );
        } else {
            debug && console.log( "JSONData.postWorkOrders: Post skipped because app is offline" );
        }
    }
    
    /**
     * Post all locally saved work orders to the middle tier
     * @param skipWait - Skip the 3 second wait before starting post. 3 second
     *                   wait is required when switching between offline and online because
     *                   on tablets with wi-fi and 4G, the online event that calls this method
     *                   happens twice.
     */
    function postSavedWorkOrders( skipWait ) {
        if ( _.isUndefined( skipWait ) ) {
            skipWait = false;
        }
        // Use a local storage item to prevent this from running multiple times at the same time
        if ( Util.isOnline() && !window.localStorage.getItem( "postSavedWorkOrdersRunning" ) ) { 
            window.localStorage.setItem( "postSavedWorkOrdersRunning", true );

            // The delay below prevents the duplicate online event from starting this logic twice in quick succession
            var waitTime = 0;
            if ( !skipWait ) {
                debug && console.log( "ManageWorkOrderReview.postSavedWorkOrders: Waiting 3 seconds before starting" );
                waitTime = 3000;
            }
            _.delay( function() {
                var workOrders = getWorkOrdersRequiringPostToMiddleTier();
                if ( workOrders.length > 0 ) {
                    // Ask technician to post saved work orders
                    var workOrderNumbers = Util.getWorkOrderDocumentNumbersAsString( workOrders );
                    Dialog.showConfirmYesNo( Localization.getText( "postingWorkOrdersTitle" ),
                                             Localization.getText( "postSavedWorkOrdersPrompt" ).replace( "workOrders", workOrderNumbers ),
                        function() {
                            UIFrame.closeActiveDialog();
                            postWorkOrders( workOrders, function() {
                                // When post is complete, clear running flag and reload the current page
                                window.localStorage.removeItem( "postSavedWorkOrdersRunning" );
                                UIFrame.reloadCurrentPage();
                            });
                        },
                        function() {
                            debug && console.log( "JSONData.postSavedWorkOrders: Post skipped by technician" );
                            window.localStorage.removeItem( "postSavedWorkOrdersRunning" );
                            UIFrame.closeActiveDialog();
                        }, "400px"
                    );
                } else {
                    debug && console.log( "JSONData.postSavedWorkOrders: No work orders need posting to the middle tier" );
                    window.localStorage.removeItem( "postSavedWorkOrdersRunning" );
                }
            }, waitTime );
                    
        } else {
            debug && console.log( "JSONData.postSavedWorkOrders: Posting locally saved work orders skipped because it is already running or app is offline" );
        }
    }

    /**
     * Get the list of locally saved non-productive technician clockings that require a post to the middle tier
     * @returns Array of technician clockings that need to be posted
     */
    function getTechnicianClockingsRequiringPostToMiddleTier() {
        var technicianClockings = _.filter( getObjectsByDataType( "technicianClockings" ), function( clockingInList ) {
            return ( clockingInList.postToMiddleTierRequired && 
                     clockingInList.technicianStatus === TECHNICIAN_STATUS_NON_PRODUCTIVE ); 
        });
        debug && console.log( "JSONData.getTechnicianClockingsRequiringPostToMiddleTier: " + technicianClockings.length +
                              " technician clockings need to be posted to the middle tier" );
        return technicianClockings;
    }
    
    /**
     * Post all locally saved work non-productive technician clockings to the middle tier
     */
    function postSavedTechnicianClockings() {
        // Use a local storage item to prevent this from running multiple times at the same time
        if ( Util.isOnline() && !window.localStorage.getItem( "postSavedTechnicianClockingsRunning" ) ) { 
            window.localStorage.setItem( "postSavedTechnicianClockingsRunning", true );

            var technicianClockings = getTechnicianClockingsRequiringPostToMiddleTier();
            if ( technicianClockings.length > 0 ) {
                // Ask technician to post saved technician clockings
                Dialog.showConfirmYesNo( Localization.getText( "postingTechnicianClockingsTitle" ),
                                         Localization.getText( "postSavedTechnicianClockingsPrompt" ),
                    function() {
                        UIFrame.closeActiveDialog();
                        postTechnicianClockings( technicianClockings, function() {
                            // When post is complete, clear running flag
                            window.localStorage.removeItem( "postSavedTechnicianClockingsRunning" );
                        });
                    },
                    function() {
                        debug && console.log( "JSONData.postSavedTechnicianClockings: Post skipped by technician" );
                        window.localStorage.removeItem( "postSavedTechnicianClockingsRunning" );
                        UIFrame.closeActiveDialog();
                    }, "400px"
                );
            } else {
                debug && console.log( "JSONData.postSavedTechnicianClockings: No technician clockings need posting to the middle tier" );
                window.localStorage.removeItem( "postSavedTechnicianClockingsRunning" );
            }
                    
        } else {
            debug && console.log( "JSONData.postSavedTechnicianClockings: Posting locally saved technician clockings skipped because it is already running or app is offline" );
        }
    }
    
    
    /**
     * Post a work order to the middle tier
     * @param workOrder - Work order to post to the middle tier
     * @param displayProgressDialog - Display the progress dialog while posting the work order
     * @param reloadPageAfterPost - Reload the current page after a successful post
     * @param successCallback - This is called when the post is successful.  
     *                          The updated work order from the middle tier is passed
     *                          as the only parameter to this callback.
     * @param errorCallback - This is called when the post fails
     */
    function postWorkOrder( workOrder, displayProgressDialog, reloadPageAfterPost, successCallback, errorCallback ) {
        if ( !workOrder ) {
            throw "JSONData.postWorkOrder: Required parameter workOrder is undefined or null";
        }
        // Must be online to post a work order
        if ( Util.isOnline() ) {

            // Pull together the work order data and the clocking data
            var workOrderAndClockingData = {};

            // Get the technician clocking's associated with the work order
            workOrderAndClockingData.technicianClocking = [];
            var technicianClockings = _.filter( getObjectsByDataType( "technicianClocking" ), function( clockingInList ) {
                return ( clockingInList.workOrderHeaderId == workOrder.webId &&
                         clockingInList.workOrderSegmentId == workOrder.workOrderSegments[0].webId &&
                         !_.isNull( clockingInList.timeEnd ) &&
                         clockingInList.postToMiddleTierRequired );
            });
            if ( technicianClockings.length > 0 ) {
                // Clone the technician clockings for the work order so that we can null out their webIds.
                _.each( technicianClockings, function( clockingInList ) {
                    workOrderAndClockingData.technicianClocking.push( Util.clone( clockingInList ) );
                });
                _.each( workOrderAndClockingData.technicianClocking, function( clockingInList ) {
                    clockingInList.webId = null;
                });
            }
            
            // Posting the current work order or the work order displayed in a manage
            // work order page requires additional updates when the post is complete
            var postingManageWorkOrder =  ( getManageWorkOrderId() == workOrder.webId );
            var postingCurrentWorkOrder = ( getCurrentWorkOrderId() == workOrder.webId );
            debug && console.log( "JSONData.postWorkOrder: Posting manage work order: " + postingManageWorkOrder + 
                                  " Posting current work order: " + postingCurrentWorkOrder );

            // Clone the work order being posted before making any changes to it.
            // This allows us to resave the original work order if a failure occurs
            workOrderAndClockingData.workOrder = Util.clone( workOrder );
            
            // Blank out the webId if this is a new work order and remove the property
            // marking it as new
            var postingNewWorkOrder = false;
            var currentWorkOrderId = null;
            if ( workOrder.newWorkOrder ) {
                postingNewWorkOrder = true;
                currentWorkOrderId = workOrder.webId; 
                workOrderAndClockingData.workOrder.webId = null;
            }
            
            var workOrderData = JSON.stringify( workOrderAndClockingData );
            debug && console.log( "JSONData.postWorkOrder: JSON data: " + workOrderData );

            // Display please wait while the post takes place
            if ( displayProgressDialog ) {
                var pleaseWaitText = Localization.getText( "postingWorkOrderText" ).replace( "workOrder", workOrder.documentNumber );
                Dialog.showPleaseWait( Localization.getText( "postingWorkOrderTitle" ), pleaseWaitText, "400px" );
            }
            
            debug && console.log( "JSONData.postWorkOrder: App is online. Post of work order " + 
                                  workOrder.documentNumber + " to middle tier will be attempted. Post attempt will timeout in " +
                                  getConfig().workOrderUpdateTimeout + " seconds." );
            
            // Set up the error call back used internally by this method. It will
            // call errorCallback if it's defined
            var internalErrorCallbackFn = function() {
                if ( displayProgressDialog ) {
                    UIFrame.closeActiveDialog();
                }
                // Add post required flag onto the work order
                debug && console.log( "JSONData.postWorkOrder.internalErrorCallbackFn: Post failed. Setting postToMiddleTierRequired on work order " +
                                      workOrder.documentNumber );
                workOrder.postToMiddleTierRequired = true;
                saveJSON( "workOrders", workOrder );
                
                // Call the error callback if its defined
                if ( errorCallback && _.isFunction( errorCallback ) ) {
                    errorCallback();
                }
            };

            postDataToMiddleTier( getConfig().workOrderUpdateUrl, workOrderData, 
                                  getConfig().workOrderUpdateTimeout,
                // Success callback                  
                function( updatedWorkOrder ) {
                    // If we posted a new work order but the webId comes back as null, the post did not work
                    if ( postingNewWorkOrder ) {
                        if ( _.isNull( updatedWorkOrder.workOrder.webId ) ) { 
                            // FIXME: This alert needs to be removed before going to production
                            debug && alert( "Posting new work order " + workOrder.documentNumber + " returned updated work order " + 
                                            " with null webId" );
                            // Mark work order as still being new
                            workOrder.newWorkOrder = true;
                            internalErrorCallbackFn();
                            return;
                        }
                    }
                    
                    // Save updated work order and call the specified success callback if available.
                    debug && console.log( "JSONData.postWorkOrder: Post of work order " + 
                                          updatedWorkOrder.workOrder.documentNumber + " successful. Returned JSON data: " +
                                          JSON.stringify( updatedWorkOrder ) );
                    if ( updatedWorkOrder.workOrder.postToMiddleTierRequired ) {
                        delete updatedWorkOrder.workOrder.postToMiddleTierRequired;
                    }
                    // Save the updated work order data
                    saveJSON( "workOrders", updatedWorkOrder.workOrder );

                    // Replace the locally stored technician clocking data with the updated data from the middle tier
                    if ( updatedWorkOrder.technicianClocking && updatedWorkOrder.technicianClocking.length > 0 ) {
                        debug && console.log( "JSONData.postWorkOrder: Replacing " + updatedWorkOrder.technicianClocking.length + 
                                              " technician clockings" );
                    
                        _.each( technicianClockings, function( clockingInList ) {
                            deleteJSON( "technicianClocking", clockingInList.webId );
                        });
                        _.each( updatedWorkOrder.technicianClocking, function( clockingInList ) {
//                            if ( !_.isUndefined( updatedWorkOrder.technicianClocking ) ) {
//                                delete updatedWorkOrder.technicianClocking;
//                            }
                            saveJSON( "technicianClocking", clockingInList );
                        });
                    }

                    // Update locally stored data using after successful post of a new work order 
                    if ( postingNewWorkOrder ) {
                        debug && console.log( "JSONData.postWorkOrder: Updating clockings after successful post of new work order" );
                        // Update all technician clocking records associated with old work order ID
                        var clockingsToUpdate = _.filter( getObjectsByDataType( "technicianClocking" ), function( clockingInList ) {
                            return clockingInList.workOrderHeaderId == currentWorkOrderId;
                        });
                        _.each( clockingsToUpdate, function( clockingInList ) {
                            clockingInList.workOrderHeaderId = updatedWorkOrder.workOrder.webId;
                            clockingInList.workOrderSegmentId = updatedWorkOrder.workOrder.workOrderSegments[0].webId;
                            saveJSON( "technicianClocking", clockingInList );
                        });
                        // Delete locally stored copy of new work order because its webId is no longer valid
                        deleteJSON( "workOrders", currentWorkOrderId );
                        if ( postingCurrentWorkOrder ) {
                            removeCurrentWorkOrderId();
                        }
                    } 
                    // If the webId changed, update the manage work order ID
                    // and the current work order ID
                    if ( updatedWorkOrder.workOrder.webId != currentWorkOrderId ) {
                        debug && console.log( "JSONData.postWorkOrder: webId changed." ); 
                        if ( postingManageWorkOrder ) {
                            debug && console.log( "JSONData.postWorkOrder: Updating manage work order ID" );
                            setManageWorkOrderId( updatedWorkOrder.workOrder.webId );
                        }
                        if ( postingCurrentWorkOrder ) {
                            debug && console.log( "JSONData.postWorkOrder: Updating current work order ID" );
                            var currentWorkOrder = setCurrentWorkOrderId( updatedWorkOrder.workOrder.webId )[0];
                            // Post not required after updating current work order due to webId change
                            if ( currentWorkOrder.postToMiddleTierRequired ) {
                                debug && console.log( "JSONData.postWorkOrder: Deleting postToMiddleTierRequired flag from current work order" );
                                delete currentWorkOrder.postToMiddleTierRequired;
                                saveJSON( "workOrders", currentWorkOrder );
                            }
                        }
                    }
                    
                    if ( displayProgressDialog ) {
                        UIFrame.closeActiveDialog();
                    }
                    
                    // Reload the current page
                    if ( reloadPageAfterPost ) {
                        UIFrame.reloadCurrentPage();
                    } 
                    
                    // Call the success callback if it's defined
                    if ( successCallback && _.isFunction( successCallback ) ) {
                        successCallback( updatedWorkOrder.workOrder );
                    }
                },
                // Error callback
                internalErrorCallbackFn 
            );
        } else {
            console.warn( "JSONData.postWorkOrder: App is offline. Post will not occur" );
        }
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
     * Get filtered object list.
     * @param datatype - Datatype to filter
     * @param filterFunction - Function used to filter the list.
     *                         A JSON object will be passed to this function.
     * @returns Array of filtered objects or null if filter returns nothing
     */
    function getFilteredObjectList( dataType, filterFunction ) {
        if ( !dataType || !_.isString( dataType ) ) {
            throw "JSONData.getFilteredObjectList: Required parameter dataType is undefined or is not a string";
        }
        if ( !filterFunction || !_.isFunction( filterFunction ) ) {
            throw "JSONData.getFilteredObjectList: Required parameter filterFunction is undefined or is not a function";
        }
        var filteredList = _.filter( getObjectsByDataType( dataType ), filterFunction );
        if ( filteredList && filteredList.length > 0 ) {
            debug && console.log( "JSONData.getFilteredObjectList: filterFunction found " +
                                      filteredList.length + " objects" );
        } else {
            console.warn( "JSONData.getFilteredObjectList: filterFunction found no objects" );
            filteredList = null;
        }
        return filteredList;
    }
    
    /**
     * Get the filtered object count.  
     * @param datatype - Datatype to filter
     * @param filterFunction - Function used to filter the list.
     *                         A JSON object will be passed to this function.
     * @returns Number of objects in the filtered list, can be 0.
     */
    function getFilteredObjectCount( dataType, filterFunction ) {
        var filteredList = getFilteredObjectList( dataType, filterFunction );
        return ( filteredList ? filteredList.length : 0 );
    }
    
    /**
     * Is the specified equipment under warranty?
     * @param equipment
     * @returns true if it is, false otherwise
     */
    function isEquipmentUnderWarranty( equipment ) {
        var underWarranty = false;
        if ( !equipment ) {
            throw "JSONData.isEquipmentUnderWarranty: Required parameter equipment is undefined";
        }
        if ( equipment.warranty && equipment.warranty.expirationDate ) {
            var warrantyEndDate = new Date( Util.convertDateToISODateTimeStamp( equipment.warranty.expirationDate ) );
            var currentDate = new Date();
            underWarranty = currentDate <= warrantyEndDate;
        }
        return underWarranty;
    }

    /**
     * Get the main communications detail from the specific communication details array.
     * According to DIS, the main comm detail object has its main property set to true
     * and its type set to PHONE
     * @param commDetails - Communication details array
     * @returns Main communication details object
     */
    function getMainCommunicationDetails( commDetails ) {
        if ( !commDetails || commDetails.length == 0 ) {
            throw "JSONData.getMainCommunicationDetails: Required parameter commDetails is undefined or empty";
        }
        return _.find( commDetails, function ( currentCommDetails ) {
            return currentCommDetails.main && currentCommDetails.type == "PHONE";
        } );
    }

    /**
     * Return the number of new messages
     */
    function getNewMessageCount() {
        debug && console.log( "JSONData.getNewMessageCount: Getting new message count" );
        // TODO: Implement when message functionality is available
        return 0;
    }

    /**
     * Get the work order status
     */
    function getWorkOrderStatus( workOrder ) {
        return workOrder.workOrderSegments[0].webStatus;
    }

    /**
     * Is the specified work order new?
     * @param workOrder - Work order to check
     */
    function isNewWorkOrder( workOrder ) {
        return getWorkOrderStatus( workOrder ) == WORK_ORDER_STATUS_DISPATCHED;
    }

    /**
     * Return the number of new work orders
     * @param workOrderArray - Array of work order objects
     *                         If null or undefined, getObjectsByDataType is used
     */
    function getNewWorkOrderCount( workOrderArray ) {
        debug && console.log( "JSONData.getNewWorkOrderCount: Getting new work order count" );
        
        if ( !workOrderArray ) {
            workOrderArray = getObjectsByDataType( "workOrders" );
        }
        var newWorkOrders = _.filter( workOrderArray, function( currentWorkOrder ) {
            return isNewWorkOrder( currentWorkOrder );
        });
        return ( newWorkOrders ? newWorkOrders.length : 0 );
    }
    
    /**
     * Set the current work order to on hold
     * @param postToMiddleTier - Post work order to middle tier after putting it on hold,
     *                           optional, defaults to false.
     * @returns workOrder - Work order that was put on hold
     */
    function setCurrentWorkOrderOnHold() {
        var currentWorkOrderId = getCurrentWorkOrderId();
        var currentWorkOrder = null;
        if ( currentWorkOrderId ) {
            debug && console.log( "JSONData.setCurrentWorkOrderOnHold: Setting current work order ID " +
                                  currentWorkOrderId + " to on hold" );
            // Set current work order status to "on hold"
            currentWorkOrder = getObjectById( "workOrders", currentWorkOrderId );
            currentWorkOrder.workOrderSegments[0].webStatus = WORK_ORDER_STATUS_WAITING_ON_HOLD;
            currentWorkOrder.postToMiddleTierRequired = true;
            saveJSON( "workOrders", currentWorkOrder );
            
            // Clear the current work order local storage location
            removeCurrentWorkOrderId();
            // Update the work order status area in the footer
            if ( UIFrame ) {
                UIFrame.updateCurrentWorkOrderStatus();
            }
        } else {
            console.warn( "JSONData.setCurrentWorkOrderOnHold: Current work order ID does not exist" );
        }
        return currentWorkOrder;
    }

    /**
     * Set the current work order ID.  This sets the work order to the "in progress"
     * status, changes the current work order (if there is one) to the "on hold" status and
     * stores the current work order ID in local storage.
     * @param workOrderId
     * @returns workOrdersChanged - Array containing the work orders whose status was changed
     */
    function setCurrentWorkOrderId( workOrderId ) {
        if ( !workOrderId ) {
            throw "JSONData.setCurrentWorkOrderId: Required parameter workOrderId is undefined";
        }

        var workOrdersChanged = [];
        
        // Set the current work order on hold
        var workOrderOnHold = setCurrentWorkOrderOnHold();
        if ( workOrderOnHold ) {
            workOrdersChanged.push( workOrderOnHold );
        }
        
        // Save the new current work order ID to local storage
        debug && console.log( "JSONData.setCurrentWorkOrderId: Setting current work order ID in local storage to " + workOrderId );
        window.localStorage.setItem( LS_CURRENT_WORK_ORDER_ID, workOrderId );
        if ( UIFrame ) {
            UIFrame.updateCurrentWorkOrderStatus();
        }
        
        // Change the status of the work order to "in progress"
        debug && console.log( "JSONData.setCurrentWorkOrderId: Change work order " + workOrderId + " to in progress" );
        var workOrder = getObjectById( "workOrders", workOrderId );
        workOrder.workOrderSegments[0].webStatus = WORK_ORDER_STATUS_IN_PROGRESS;
        workOrder.postToMiddleTierRequired = true;
        saveJSON( "workOrders", workOrder );
        
        workOrdersChanged.push( workOrder );
        return workOrdersChanged;
    }

    /**
     * Get the current work order ID
     * @returns current work order ID from local storage or null if it does not exist
     */
    function getCurrentWorkOrderId() {
        debug && console.log( "JSONData.getCurrentWorkOrderId: Getting current work order ID" );
        return window.localStorage.getItem( LS_CURRENT_WORK_ORDER_ID );
    }

    /**
     * Store the work order ID in local storage that will be viewable inside 
     * the manage work order pages.  
     * @param workOrderId
     */
    function setManageWorkOrderId( workOrderId ) {
        if ( !workOrderId ) {
            throw "JSONData.setManageWorkOrderId: Required parameter workOrderId is undefined";
        }
        debug && console.log( "JSONData.setManageWorkOrderId: Setting manage work order ID to " + workOrderId );
        window.localStorage.setItem( LS_MANAGE_WORK_ORDER_ID, workOrderId );
    }

    /**
     * Is manage work order writable?
     * @returns true or false
     */
    function isManageWorkOrderWritable() {
        var writable = ( window.localStorage.getItem( LS_MANAGE_WORK_ORDER_WRITABLE ) == "true" );
        debug && console.log( "JSONData.isManageWorkOrderWritable: " + writable );
        return writable;
    }
    
    /**
     * Set writable flag in local storage for manage work order
     * @param writable - Writable flag value, defaults to false
     */
    function setManageWorkOrderWritable( writable ) {
        if ( _.isUndefined( writable ) ) {
            writable = false;
        }
        debug && console.log( "JSONData.setManageWorkOrderWritable: Setting manage work order writable to " + writable );
        window.localStorage.setItem( LS_MANAGE_WORK_ORDER_WRITABLE, writable );
    } 

    /**
     * Get the work order ID from local storage that will be viewable inside 
     * the manage work order pages.
     * @returns Work order ID from local storage or null if it does not exist
     */
    function getManageWorkOrderId() {
        debug && console.log( "JSONData.getManageWorkOrderId: Getting manage work order ID" );
        return window.localStorage.getItem( LS_MANAGE_WORK_ORDER_ID );
    }
    
    /**
     * Remove the current work order ID from local storage
     */
    function removeCurrentWorkOrderId() {
        debug && console.log( "JSONData.removeCurrentWorkOrderId: Removing the current work order ID" );
        window.localStorage.removeItem( LS_CURRENT_WORK_ORDER_ID );
    }
    
    /**
     * Store the work order ID associated with a clocking change.  This allows
     * recordTime() to create a work order line for the clocking change when necessary
     * @param workOrderId
     */
    function setWorkOrderIdForClockingChange( workOrderId ) {
        if ( _.isUndefined( workOrderId ) ) {
            throw "JSONData.setWorkOrderIdForClockingChange: Required parameter workOrderId is undefined";
        }
        debug && console.log( "JSONData.setWorkOrderIdForClockingChange: Setting work order ID to '" + workOrderId + "'" );
        window.localStorage.setItem( LS_WORK_ORDER_ID_FOR_CLOCKING_CHANGE, workOrderId );
    }

    /**
     * Get the work order ID from local storage that is associated with a clocking change
     * @returns Work order ID from local storage or null if it does not exist
     */
    function getWorkOrderIdForClockingChange() {
        debug && console.log( "JSONData.getWorkOrderIdForClockingChange: Getting work order ID" );
        return window.localStorage.getItem( LS_WORK_ORDER_ID_FOR_CLOCKING_CHANGE );
    }
    
    /**
     * Get the current work order
     * @returns The current work order or null if a current work order is not set
     */
    function getCurrentWorkOrder() {
        debug && console.log( "JSONData.getCurrentWorkOrder: Getting the current work order" );
        var currentWorkOrderId = getCurrentWorkOrderId();
        return ( currentWorkOrderId ? getObjectById( "workOrders", currentWorkOrderId ) : null );
    }
    
    /**
     * Get the work order status object for the specified work order.
     * This object contains 
     */
    function getWorkOrderStatusObject( workOrder ) {
        if ( !workOrder ) {
            throw "JSONData.getWorkOrderStatusObject: Required parameter workOrder is undefined";
        }
        var workOrderStatus = getWorkOrderStatus( workOrder );
        var workOrderStatusObj = _.find( JSONData.VALID_WORK_ORDER_STATUSES, function( currentWorkOrderStatus ) {
            return currentWorkOrderStatus.webStatus == workOrderStatus;
        });
        if ( !workOrderStatusObj ) {
            throw "JSONData.getWorkOrderStatusObject: Work order webStatus value " + workOrderStatus + " is invalid";
        }
        return workOrderStatusObj;
    }
    
    /**
     * Get the status icon for the work order
     * @param workOrder
     */
    function getWorkOrderStatusIcon( workOrder ) {
        var workOrderStatusObj = getWorkOrderStatusObject( workOrder );
        debug && console.log( "JSONData.getWorkOrderStatusIcon: Work order status icon = " + workOrderStatusObj.icon );
        return UIFrame.getImagePath() + workOrderStatusObj.icon;
    }

    /**
     * Get the status text for the work order
     * @param workOrder
     */
    function getWorkOrderStatusText( workOrder ) {
        var workOrderStatusObj = getWorkOrderStatusObject( workOrder );
        var statusText = Localization.getText( workOrderStatusObj.id );
        debug && console.log( "JSONData.getWorkOrderStatusText: Work order status text = " + statusText );
        return statusText; 
    }
    
    /**
     * Are parts on order for the specified work order?
     * @param workOrder
     */
    function isPartOnOrder( workOrder ) {
        if ( !workOrder ) {
            throw "JSONData.isPartOnOrder: Required parameter workOrder is undefined";
        }
        var linesWithOrderedParts = _.filter( workOrder.workOrderSegments[0].workOrderLines, function( currentLine ) {
            return currentLine.qtyBackOrder > 0;
        });
        var partsOnOrder = linesWithOrderedParts.length > 0;
        if ( partsOnOrder ) {
            debug && console.log( "JSONData.isPartOnOrder: Work order ID " + workOrder.webId + " has parts on order" );
        } else {
            debug && console.log( "JSONData.isPartOnOrder: Work order ID " + workOrder.webId + " has no parts on order" );
        }
        return partsOnOrder;
    }
    
    /**
     * Get a part's location
     * @param partNumber - Use product.productCode property
     */
    function getPartLocation( partNumber ) {
        if ( !partNumber ) {
            throw "JSONData.getPartLocation: Required parameter partNumber is undefined";
        }
        // Default unknown part locations to parts request
        var partLocation = Localization.getText( "partsRequest" );
        var partInventory = _.find( getObjectsByDataType( "inventory" ), function( inventoryInList ) {
            return inventoryInList.product.productCode == partNumber;
        });
        if ( partInventory ) {
            // Get stock area for inventory
            var stockArea = _.find( getObjectsByDataType( "stockAreas" ), function( stockAreaInList ) {
                return stockAreaInList.webId == partInventory.stockAreaId;
            });
            if ( stockArea ) {
                partLocation = stockArea.name + " - " + partInventory.binName;
            } else {
                console.warn( "JSONData.getPartLocation: stockArea does not exist for part number " + partNumber );
                partLocation = partInventory.binName;
            }
        }
        return partLocation;
    }
    
    /**
     * Get the location string for the specified inventory ID
     * @param inventoryId - Inventory object ID
     * @param inventoryData - Inventory array, optional.  If not specified, 
     *                        getObjectsByDataType() is used to get the inventory array
     * @returns Inventory location string using format: stockArea.name - inventory.binName
     *          or "PARTS REQUEST" if inventory ID is null.        
     */
    function getInventoryLocationString( inventoryId, inventoryData ) {
        var inventoryLocation = Localization.getText( "partsRequest" );
        if ( inventoryId ) {
            // Get the inventory object
            var inventoryObj = null;
            if ( inventoryData ) {
                inventoryObj = _.find( inventoryData, function( inventoryObjInList ) {
                    return inventoryObjInList.webId == inventoryId;
                });
            } else {
                inventoryObj = getObjectById( "inventory", inventoryId );
            }
            if ( inventoryObj ) {
                // Get the stock area
                var stockArea = getObjectById( "stockAreas", inventoryObj.stockAreaId );
                if ( stockArea && stockArea.name != inventoryObj.binName ) {
                    inventoryLocation = stockArea.name + " - " + inventoryObj.binName;
                } else {
                    inventoryLocation = inventoryObj.binName;
                }
            } 
        }
        return inventoryLocation;
    }

    /**
     * Return an array containing all of the nonproductive clocking statuses
     */
    function getNonProductiveClockingStatuses() {
        var nonProductiveClockingStatuses = [];
        _.each( VALID_CLOCKING_STATUSES, function( statusObj, statusKey ){
            if ( statusObj.technicianStatus == TECHNICIAN_STATUS_NON_PRODUCTIVE && 
                 !_.isNull( statusObj.unproductiveTimeReason ) ) {
                nonProductiveClockingStatuses.push( statusObj.key );
            }
        });
        debug && console.log( "JSONData.getNonProductiveClockingStatuses: Returning " +
                                  nonProductiveClockingStatuses.length + " statuses" );
        return nonProductiveClockingStatuses;
    }
    
    /**
     * Change the clocking status.  The appropriate clocking
     * dialog will be displayed when necessary.
     * @param newClockingStatus - New clocking status.  If set to "", current clocking
     *                            status determined the new clocking status
     * @param changeClockingCompleteCallback - When clocking change is complete, call this function if
     *                                         it is defined
     * @param changeClockingStatusCompleteCallbackArgs - Argument array passed to the callback function
     */
    function changeClockingStatus( newClockingStatus, changeClockingCompleteCallback,
                                   changeClockingStatusCompleteCallbackArgs ) {
        if ( _.isUndefined( newClockingStatus ) ) {
            throw "JSONData.changeClockingStatus: Required parameter newClockingStatus is undefined";
        }

        // Get the current clocking status...this determines what we do next
        var currentStatus = JSONData.getCurrentClockingStatus( null );
        switch ( currentStatus ) {

            // If technician is logged in, close the open login entry
            case "technicianStatusLoggedIn" :
                switch ( newClockingStatus ) {
                    case "technicianStatusLoggedOut" :
                        JSONData.closeOpenTimeEntry( null );
                        break;
                    case "technicianStatusProductive" :
                        if ( UIFrame ) {
                            UIFrame.displayStartTimeDialog( newClockingStatus, changeClockingCompleteCallback,
                                                            changeClockingStatusCompleteCallbackArgs );
                        }
                        break;
                    default:
                        if ( UIFrame ) {
                            UIFrame.displayNonProductiveClockingDialog();
                        }
                        break;
                }
                break;
                
            case "technicianStatusLunch" :
            case "technicianStatusNoPay" :
            case "technicianStatusPaperwork" :
            case "technicianStatusTraining" :
            case "technicianStatusVehicleMaintenance" :
                if ( newClockingStatus == "technicianStatusProductive" ) {
                    UIFrame.displayStartTimeDialog( newClockingStatus, changeClockingCompleteCallback,
                                                    changeClockingStatusCompleteCallbackArgs );
                } else if ( newClockingStatus != "technicianStatusLoggedIn" &&
                            newClockingStatus != "technicianStatusLoggedOut" ) {
                    UIFrame.displayEndNonProductiveClockingDialog( newClockingStatus );
                }
                break;

            case "technicianStatusNonProductive" :
                if ( newClockingStatus == "technicianStatusProductive" ) {
                    saveClockingStatus( newClockingStatus, Util.getISOCurrentTime() );
                    changeClockingCompleteCallback( changeClockingStatusCompleteCallbackArgs );
                } else if ( newClockingStatus != "technicianStatusLoggedIn" &&
                            newClockingStatus != "technicianStatusLoggedOut" ) {
                    UIFrame.displayNonProductiveClockingDialog();
                }
                break;

            case "technicianStatusProductive" :
                // Switching from productive to productive means that the technician
                // is opening a different work order.  Display the start time dialog.
                if ( newClockingStatus == "technicianStatusProductive" ) {
                    UIFrame.displayStartTimeDialog( newClockingStatus, changeClockingCompleteCallback,
                                                    changeClockingStatusCompleteCallbackArgs );
                } else if ( newClockingStatus != "technicianStatusLoggedOut" ) {
                    UIFrame.displayTerminateClockingDialog();
                }
                break;

            case "technicianStatusTraveling" :
                if ( newClockingStatus != "technicianStatusLoggedIn" &&
                     newClockingStatus != "technicianStatusLoggedOut" ) {
                    // Display the start time dialog if the technician opens a different
                    // work order and the current status is traveling
                    if ( ( newClockingStatus == "technicianStatusProductive" ) &&
                         ( _.isFunction( changeClockingCompleteCallback) &&
                           changeClockingCompleteCallback === WorkOrderList.openManageWorkOrder )) {
                        UIFrame.displayStartTimeDialog( newClockingStatus, changeClockingCompleteCallback,
                                                        changeClockingStatusCompleteCallbackArgs );
                    } else {
                        // Switching from traveling to productive requires
                        // the current work order ID
                        setWorkOrderIdForClockingChange( getCurrentWorkOrderId() );
                        UIFrame.displayTechnicianArrivedDialog();
                    }
                }
                break;

            case "technicianStatusViewOnly" :
                break;

            case "technicianStatusLoggedOut" :
                JSONData.recordTime( "technicianStatusLoggedIn", null );
                break;
                
            default :
                console.error( "JSONData.changeClockingStatus: default case hit" );
                break;
        }
    }

    /**
     * Save the clocking status.  This can be called by the clocking pop-up
     * dialogs to save a new clocking status
     * @param newClockingStatus
     * @param startTime
     */
    function saveClockingStatus( newClockingStatus, startTime ) {
        if ( !newClockingStatus || newClockingStatus.length == 0 || !startTime ) {
            throw "JSONData.saveClockingStatus: One or more required parameters (newClockingStatus, startTime) are undefined or empty";
        }
        debug && console.log( "UIFrame.saveClockStatus: Saving clocking status '" +
                                  newClockingStatus + "' with start time = " + startTime );

        // Handle different start time formats
        var startDateTimeStamp = null;
        if ( Util.isValidISODateTimeStamp( startTime ) ) {
            startDateTimeStamp = startTime;
        } else {
            startDateTimeStamp = Util.convert12HourTimeToISODateTimeStamp( startTime );
        }

        // Record the new clocking status
        recordTime( newClockingStatus, startDateTimeStamp );
        
        // If we are on the time sheet page, reload the clocking list view
        if( window.location.href.indexOf("timesheet") != -1) {

        	TimeSheet.populateListViews( undefined, true );
        	var mostRecent = TimeSheet.selectMostRecentOpenEntry();
        	if( mostRecent ) {
        		var mostRecentDate = mostRecent.substring( 5 );
        		
            	if( new Date().setHours(0,0,0,0) > mostRecentDate ) {
            		UIFrame.navigateToPage( "timesheet.html" );
            	}	
        	}
        }
    }

    /**
     * Get the technician's current clocking start time
     * @param currentTimeEntry - time entry to use. If undefined, getOpenTimeEntry()
     *                           will be used to get the time entry
     */
    function getCurrentClockingStartTime( currentTimeEntry ) {
        if ( !currentTimeEntry ) {
            currentTimeEntry = getOpenTimeEntry();
        }
        var startTime = ( currentTimeEntry ? currentTimeEntry.timeStart : Util.getISOCurrentTime() );
        debug && console.log( "JSONData.getCurrentClockingStartTime: Current clocking start time = " + startTime );
        return startTime;
    }

    /**
     * Get the technician's current clocking status
     * @param currentTimeEntry - time entry to use. If undefined, getOpenTimeEntry()
     *                           will be used to get the time entry
     * @returns One of the clocking status keys inside VALID_CLOCKING_STATUSES                          
     */
    function getCurrentClockingStatus( currentTimeEntry ) {
        // Use open time entry if currentTimeEntry is undefined
        if ( !currentTimeEntry ) {
            currentTimeEntry = getOpenTimeEntry();
        }
        // Use logged out as the default status when current time entry is unavailable
        var currentClockingStatus = null;
        if ( currentTimeEntry ) {
            var clockingStatusObj = _.find( VALID_CLOCKING_STATUSES, function( validStatus ) {
                return ( validStatus.technicianStatus == currentTimeEntry.technicianStatus &&
                         validStatus.unproductiveTimeReason == currentTimeEntry.unproductiveTimeReason );
            });
            currentClockingStatus = clockingStatusObj.key;
        } else {
            currentClockingStatus = "technicianStatusLoggedOut";
        }
        debug && console.log( "JSONData.getCurrentClockingStatus: Current clocking status = " + currentClockingStatus );
        return currentClockingStatus; 
    }

    /**
     * Get the open time entry.  An open time entry is one without a stop time.
     */
    function getOpenTimeEntry() {
        var timeEntries = getObjectsByDataType( "technicianClocking" );
        var openTimeEntry = null;
        for ( var i = 0; i < timeEntries.length; i++ ) {
            if ( _.isNull( timeEntries[i].timeEnd ) ) {
                openTimeEntry = timeEntries[i];
                break;
            }
        }
        return openTimeEntry;
    }

    /**
     * Helper function for posting a single non-productive technician clocking to the middle tier
     * @param technicianClocking - Clocking to post
     */
    function postNonProductiveTechnicianClockingToMiddleTier( technicianClocking ) {
        // If the new entry is non-productive, then post the new entry to the middle tier
        if ( technicianClocking.technicianStatus == TECHNICIAN_STATUS_NON_PRODUCTIVE &&
             !_.isNull( technicianClocking.timeEnd ) &&
             technicianClocking.postToMiddleTierRequired ) {
            var technicianClockings = [];
            technicianClockings.push( technicianClocking );
            postTechnicianClockings( technicianClockings, true, false, function( updatedClockings ) {
                debug && console.log( "JSONData.postNonProductiveTechnicianClockingToMiddleTier: Non-productive clocking successfully posted to middle tier" );
            });
        } else {
            debug && console.log( "JSONData.postNonProductiveTechnicianClockingToMiddleTier: Post to middle tier skipped" );
        }
    }
    
    /**
     * Find previously started time entry and close it out by adding a stop time
     * @param stopTime - Stop time, if undefined, the current time will be used
     * @returns true if a time entry was closed, false otherwise
     */
    function closeOpenTimeEntry( stopTime ) {
        var timeEntryClosed = false;
        if ( !stopTime ) {
            stopTime = Util.getISOCurrentTime();
        }
        var openTimeEntry = getOpenTimeEntry();
        if ( openTimeEntry ) {
            debug && console.log( "JSONData.closeOpenTimeEntry: Setting stop time to '" + stopTime +
                                  "' inside time entry '" + openTimeEntry.webId + '"' );
            openTimeEntry.timeEnd = stopTime;
            saveJSON( "technicianClocking", openTimeEntry );
            postNonProductiveTechnicianClockingToMiddleTier( openTimeEntry ); 
            timeEntryClosed = true;
        } else {
            console.warn( "JSONData.closeOpenTimeEntry: An open time entry does not exist" );
        }
        return timeEntryClosed;
    }

    /**
     * Record time for the technician by opening a new time record
     * and closing the previous one.  The rules for closing and opening
     * time records is defined by the Crown document, Clocking Rules.doc.
     * @param clockingStatus - One of the keys for VALID_CLOCKING_STATUSES
     * @param startTime - Start time.  If undefined, current time is used.
     *                    Use Util.getISOCurrentTime() to pass in this value.
     */
    function recordTime( clockingStatus, startTime ) {
        if ( !clockingStatus ) {
            throw "JSONData.recordTime: Required parameter clockingStatus is undefined";
        }
        var clockingStatusObj = _.find( VALID_CLOCKING_STATUSES, function( validStatus ) {
            return validStatus.key == clockingStatus;
        });
        if ( !clockingStatusObj ) {
            throw "JSONData.recordTime: Required parameter clockingStatus is invalid";
        }
        if ( startTime && !Util.isValidISODateTimeStamp( startTime ) ) {
            throw "JSONData.recordTime: startTime is not a valid ISO formatted date/time string";
        }
        // Changing the clocking status to traveling or productive requires
        // that the related work order ID be set inside local storage
        var workOrderIdForClockingStatus = null,
        	laborCodeId = null,
        	laborTimeTypeId = null;
        if ( clockingStatusObj.technicianStatus == TECHNICIAN_STATUS_PRODUCTIVE || 
             clockingStatusObj.technicianStatus == TECHNICIAN_STATUS_TRAVELING ) {
            workOrderIdForClockingStatus = getWorkOrderIdForClockingChange();
            if ( !workOrderIdForClockingStatus ) {
                throw "JSONData.recordTime: Work order ID for clocking change required when changing to traveling or productive";
            }
        }

        // Do nothing if the specified status matches the current status
        if ( clockingStatus == getCurrentClockingStatus( null ) &&
             // Duplicate productive and traveling clockings with different start times are allowed
             !( ( clockingStatus == "technicianStatusProductive" || clockingStatus == "technicianStatusTraveling" ) &&
                  startTime != getCurrentClockingStartTime( null ) ) ) {
            debug && console.log( "JSONData.recordTime: No time entry created because new status equals current status" );
        } else {
            // Use current time if start time is not specified
            if ( !startTime ) {
                startTime = Util.getISOCurrentTime();
            }
            startTime = Util.setSecondsAndMillisecondsToZero( startTime );
            debug && console.log( "JSONData.recordTime: Creating new '" + clockingStatus + "' time entry with start time = " + startTime );

            // Find previously started time entry and close it out by adding a stop time
            closeOpenTimeEntry( startTime );

            // Set laborCode and timeType by technicianStatus
            if( _.isNull( laborCodeId ) ) {
            	laborCodeId = "";
            }
            
            // Default laborTimeTypeId to 1 unless nonproductive 
            if ( _.isNull( clockingStatusObj.unproductiveTimeReason ) ) {
            	laborTimeTypeId = 1;
            }
            
            // Create new time entry.  Seconds and milliseconds are not part of the start time.
            var newTimeEntry = {
                webId: Util.getUniqueId(),
                internalId: null,
                laborCodeId: clockingStatusObj.laborCodeId,
                laborTimeTypeId: laborTimeTypeId,
                technicianStatus: clockingStatusObj.technicianStatus,
                timeStart: startTime,
                timeEnd: null,
                unproductiveTimeReason: clockingStatusObj.unproductiveTimeReason,
                workOrderHeaderId: null,
                workOrderSegmentId: null,
                workOrderLineId: null,
                postToMiddleTierRequired: true
            };
            
            // Associate the work order to technician clocking if the status is productive
            // or traveling
            if ( clockingStatusObj.technicianStatus == TECHNICIAN_STATUS_PRODUCTIVE || 
                 clockingStatusObj.technicianStatus == TECHNICIAN_STATUS_TRAVELING ) {
                
                // Unproductive reason must be null for productive clocking
                newTimeEntry.unproductiveTimeReason = null;
                
                var workOrder = getObjectById( "workOrders", workOrderIdForClockingStatus );
                
                // Associate the work order with the new time entry
                debug && console.log( "JSONData.recordTime: Associating new time entry with work order " + 
                                      workOrder.documentNumber );
                
                newTimeEntry.workOrderHeaderId = workOrder.webId;
                newTimeEntry.workOrderSegmentId = workOrder.workOrderSegments[0].webId;
                
                // Does a labor line exist inside the work order?
                var laborLineExists = _.any( workOrder.workOrderSegments[0].workOrderLines, function( lineInList ) {
                    return ( lineInList.type == WORK_ORDER_LINE_LABOR_TYPE &&
                             lineInList.product.manufacturer == WORK_ORDER_LINE_MFG_LABOR &&
                             lineInList.product.productCode == ( clockingStatusObj.technicianStatus == TECHNICIAN_STATUS_PRODUCTIVE ?
                                                                 WORK_ORDER_LINE_PTR : WORK_ORDER_LINE_TTR ) );
                });

                if ( !laborLineExists ) {
                    // If this is the 1st productive clocking today and the customer's billing folder
                    // is customer pay, then add a TTR service charge work order line to the work order
                    var billingFolder = getObjectById( "folders", workOrder.workOrderSegments[0].folderId );
                    if ( billingFolder.description == BILLING_FOLDER_CUSTOMER_PAY ) {
                        var productiveTimeExists = _.any( getObjectsByDataType( "technicianClocking" ), function( clockingInList ) {
                            return clockingInList.technicianStatus == TECHNICIAN_STATUS_PRODUCTIVE; 
                        });
                        if ( !productiveTimeExists ) {
                            debug && console.log( "JSONData.recordTime: Adding TTR service charge line to work order " + 
                                                  workOrder.documentNumber );
                            var serviceChargeLine = createNewTravelWorkOrderLine();
                            serviceChargeLine.qtyOrdered = 0.1;
                            addLineToWorkOrder( workOrder, serviceChargeLine );
                        }
                    }
                }
                
                // Set the labor code and the labor time type to match the technician status
                var laborCode = null;
                if ( clockingStatusObj.technicianStatus == TECHNICIAN_STATUS_PRODUCTIVE ) {
                    laborCode = _.find( getObjectsByDataType( "laborCodes" ), function( codeInList ) {
                        return codeInList.internalId == WORK_ORDER_LINE_PTR;
                    });
                } else {
                    laborCode = _.find( getObjectsByDataType( "laborCodes" ), function( codeInList ) {
                        return codeInList.internalId == WORK_ORDER_LINE_TTR;
                    });
                }
                newTimeEntry.laborCodeId = laborCode.webId;
                newTimeEntry.laborTimeTypeId = 0;

                // Clear out work order ID for clocking change
                setWorkOrderIdForClockingChange( "" );
            } 
            
            // Save time entry and update the technician status
            debug && console.log( "JSONData.recordTime: Saving new '" + clockingStatus + "' time entry with start time = " + startTime );
            saveJSON( "technicianClocking", newTimeEntry );
            
            if ( UIFrame ) {
                UIFrame.updateCurrentTechnicianStatus( newTimeEntry );
            }
        }
    }
    
    /**
     * Add a new line to the work order.
     */
    function addLineToWorkOrder( workOrder, workOrderLine ) {
        if ( !workOrder || !_.isObject( workOrder ) ) {
            throw "JSONData.addLineToWorkOrder: Required parameter workOrder is undefined or is not an object";
        }
        if ( !workOrderLine || !_.isObject( workOrderLine ) ) {
            throw "JSONData.addLineToWorkOrder: Required parameter workOrderLine is undefined or is not an object";
        }
        workOrder.workOrderSegments[0].workOrderLines.push( workOrderLine );
        workOrder.postToMiddleTierRequired = true;
        saveJSON( "workOrders", workOrder );
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
     * Create a new work order line for travel
     * @returns workOrderLine
     */
    function createNewTravelWorkOrderLine() {
        var workOrderLine = createNewWorkOrderLine();
        workOrderLine.type                 = WORK_ORDER_LINE_LABOR_TYPE;
        workOrderLine.qtyOrdered           = 1;
        workOrderLine.product.webId        = 16223083;
        workOrderLine.product.manufacturer = WORK_ORDER_LINE_MFG_LABOR;
        workOrderLine.product.productCode  = WORK_ORDER_LINE_TTR;
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
     * Is the specified work order signed by the technician?
     * @param workOrder
     * @return true if work order is signed by the technician, false otherwise
     */
    function isWorkOrderSignedByTechnician( workOrder ) {
        var signed = false;
        if ( workOrder ) {
            signed = ( workOrder.workOrderSegments[0].technicianSignature &&
                       _.isObject( workOrder.workOrderSegments[0].technicianSignature ) );
        }
        return signed;
    }
    
    /**
     * Create a new signature object.  The dateCaptured property will
     * be set to the current date/time and the format will be set to image/png;base64
     * @returns signature
     */
    function createNewSignature() {
        var signature = {};
        signature.webId = Util.getUniqueId();
        signature.dateCaptured = Util.getISOCurrentTime();
        signature.format = "image/png;base64";
        signature.value = "";
        return signature;
    }
    
    /**
     * Create a new message object
     * @returns message
     */
    function createNewMessage() {
        var message = {};
        message.webId = Util.getUniqueId();
        message.dateUpdate = Util.getISOCurrentTime();
        message.dateSent = "";
        message.value = "";
        message.type = 0;
        message.entityType = "";
        message.entityId = null;
        message.to = [];
        // FIXME: This should be initialized with the technician's ID
        message.from = "";
        return message;
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
     * Is the lunch break short?  According to the clocking rules,
     * a short lunch break is one that is less than 30 minutes long
     */
    function isLunchBreakShort() {
        var isShort = false;
        var currentTime = new Date();
        var currentOpenTimeEntry = getOpenTimeEntry();
        if ( getCurrentClockingStatus( null ) == "technicianStatusLunch" ) {
            var lunchStartTime = new Date( currentOpenTimeEntry.timeStart );
            var lunchLength = (currentTime.getTime() - lunchStartTime.getTime()) / 1000 / 60;
            if ( lunchLength < DEFAULT_LUNCH_LENGTH_IN_MINS ) {
                isShort = true;
            }
        } else {
            throw "JSONData.isLunchBreakShort: Current clocking status is not technicianStatusLunch";
        }
        return isShort;
    }
    
    /**
     * Return the technician's user ID
     * @returns Technician's user ID
     */
    function getTechnicianUserId() {
        var userId = getObjectById( JSON_DATATYPE_LOGON, LOGON_WEBID ).webUserId;
        debug && console.log( "JSONData.getTechnicianUserId: Technician's user ID = " + userId );
        return userId;
    }
    
    /**
     * Return the technician's name
     * @returns Technician's name
     */
    function getTechnicianName() {
        var userId = getTechnicianUserId();
        var technicianName = "";
        if ( userId != "" ) {
            var webUser = _.find( getObjectsByDataType( "webUsers" ), function( userInList ) {
                return userInList.webId == userId; 
            });
            if ( webUser && webUser.address ) {
                technicianName = webUser.address.name;
                debug && console.log( "JSONData.getTechnicianName: Technician's name = " + technicianName );
            } else {
                console.warn( "JSONData.getTechnicianName: Technician's name not found" );
            } 
        }
        return technicianName;
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
        'COMM_DETAIL_TYPE_EMAIL'                    : COMM_DETAIL_TYPE_EMAIL,
        'JSON_DATATYPE_LOGON'                       : JSON_DATATYPE_LOGON,
        'LOGON_WEBID'                               : LOGON_WEBID,
        'MESSAGE_TYPE_GENERAL'                      : MESSAGE_TYPE_GENERAL, 
        'MESSAGE_TYPE_WO_REJECTED'                  : MESSAGE_TYPE_WO_REJECTED,
        'MESSAGE_TYPE_PART_REQUEST'                 : MESSAGE_TYPE_PART_REQUEST,
        'MESSAGE_TYPE_WO_REVIEW'                    : MESSAGE_TYPE_WO_REVIEW,
        'MESSAGE_TYPE_CUSTOMER_CONTACT_UPDATE'      : MESSAGE_TYPE_CUSTOMER_CONTACT_UPDATE,
        'OUTSIDE_PART_PURCHASE_PRODUCE_CODE'        : OUTSIDE_PART_PURCHASE_PRODUCE_CODE,
        'PRODUCT_TYPE_PART'                         : PRODUCT_TYPE_PART,
        'PRODUCT_TYPE_EQUIPMENT'                    : PRODUCT_TYPE_EQUIPMENT,
        'PRODUCT_TYPE_LABOR'                        : PRODUCT_TYPE_LABOR,
        'SIGNATURE_FORMAT'                          : SIGNATURE_FORMAT,
        'STOCK_AREA_TYPE_VAN'                       : STOCK_AREA_TYPE_VAN,
        'TECHNICIAN_STATUS_LOGGED_IN_OUT'           : TECHNICIAN_STATUS_LOGGED_IN_OUT,
        'TECHNICIAN_STATUS_NON_PRODUCTIVE'          : TECHNICIAN_STATUS_NON_PRODUCTIVE,
        'TECHNICIAN_STATUS_PRODUCTIVE'              : TECHNICIAN_STATUS_PRODUCTIVE,
        'TECHNICIAN_STATUS_TRAVELING'               : TECHNICIAN_STATUS_TRAVELING,
        'VALID_CLOCKING_STATUSES'                   : VALID_CLOCKING_STATUSES,
        'VALID_WORK_ORDER_STATUSES'                 : VALID_WORK_ORDER_STATUSES,
        'WORK_ORDER_LINE_LABOR_TYPE'                : WORK_ORDER_LINE_LABOR_TYPE,
        'WORK_ORDER_LINE_MFG_LABOR'                 : WORK_ORDER_LINE_MFG_LABOR,
        'WORK_ORDER_LINE_PART_TYPE'                 : WORK_ORDER_LINE_PART_TYPE,
        'WORK_ORDER_LINE_PTR'                       : WORK_ORDER_LINE_PTR,
        'WORK_ORDER_LINE_TTR'                       : WORK_ORDER_LINE_TTR,
        'WORK_ORDER_STATUS_NOT_STARTED'             : WORK_ORDER_STATUS_NOT_STARTED,
        'WORK_ORDER_STATUS_DISPATCHED'              : WORK_ORDER_STATUS_DISPATCHED,
        'WORK_ORDER_STATUS_REJECTED'                : WORK_ORDER_STATUS_REJECTED,
        'WORK_ORDER_STATUS_IN_PROGRESS'             : WORK_ORDER_STATUS_IN_PROGRESS,
        'WORK_ORDER_STATUS_WAITING_ON_HOLD'         : WORK_ORDER_STATUS_WAITING_ON_HOLD,
        'WORK_ORDER_STATUS_COMPLETED'               : WORK_ORDER_STATUS_COMPLETED,
        'addLineToWorkOrder'                        : addLineToWorkOrder,
        'changeClockingStatus'                      : changeClockingStatus,
        'closeOpenTimeEntry'                        : closeOpenTimeEntry,
        'createNewMessage'                          : createNewMessage,
        'createNewSignature'                        : createNewSignature,
        'createNewWorkOrder'                        : createNewWorkOrder,
        'createNewWorkOrderLine'                    : createNewWorkOrderLine,
        'deleteJSON'                                : deleteJSON,
        'getConfig'                                 : getConfig,
        'getCurrentClockingStartTime'               : getCurrentClockingStartTime,
        'getCurrentClockingStatus'                  : getCurrentClockingStatus,
        'getCurrentWorkOrder'                       : getCurrentWorkOrder,
        'getCurrentWorkOrderId'                     : getCurrentWorkOrderId,
        'getFilteredObjectCount'                    : getFilteredObjectCount,
        'getFilteredObjectList'                     : getFilteredObjectList,
        'getJSONFeedConfig'                         : getJSONFeedConfig,
        'getInventoryLocationString'                : getInventoryLocationString,
        'getMainCommunicationDetails'               : getMainCommunicationDetails,
        'getManageWorkOrderId'                      : getManageWorkOrderId,
        'getNonProductiveClockingStatuses'          : getNonProductiveClockingStatuses,
        'getObjectById'                             : getObjectById,
        'getObjectFromArrayById'                    : getObjectFromArrayById,
        'getObjectFromDatabaseById'                 : getObjectFromDatabaseById,
        'getObjectsByDataType'                      : getObjectsByDataType,
        'getObjectsFromDatabase'                    : getObjectsFromDatabase,
        'getOpenTimeEntry'                          : getOpenTimeEntry,
        'getNewMessageCount'                        : getNewMessageCount,
        'getNewWorkOrderCount'                      : getNewWorkOrderCount,
        'getNumWorkOrdersSavedDuringLastUpdate'     : getNumWorkOrdersSavedDuringLastUpdate,
        'getNumPMSchedulesSavedDuringLastUpdate'    : getNumPMSchedulesSavedDuringLastUpdate,
        'getPartLocation'                           : getPartLocation,
        'getPeriodicJSONFeedUpdates'                : getPeriodicJSONFeedUpdates,
        'getProduct'                                : getProduct,
        'getProducts'                               : getProducts,
        'getTechnicianName'                         : getTechnicianName,
        'getTechnicianUserId'                       : getTechnicianUserId,
        'getWorkOrderIdForClockingChange'           : getWorkOrderIdForClockingChange,
        'getWorkOrdersRequiringPostToMiddleTier'    : getWorkOrdersRequiringPostToMiddleTier,
        'getWorkOrderStatus'                        : getWorkOrderStatus,
        'getWorkOrderStatusIcon'                    : getWorkOrderStatusIcon,
        'getWorkOrderStatusText'                    : getWorkOrderStatusText,
        'init'                                      : init,
        'isEquipmentUnderWarranty'                  : isEquipmentUnderWarranty, 
        'isLunchBreakShort'                         : isLunchBreakShort,
        'isManageWorkOrderWritable'                 : isManageWorkOrderWritable,
        'isNewWorkOrder'                            : isNewWorkOrder,
        'isPartOnOrder'                             : isPartOnOrder,
        'isWorkOrderSignedByTechnician'             : isWorkOrderSignedByTechnician,
        'loadConfiguration'                         : loadConfiguration,
        'loadJSON'                                  : loadJSON,
        'loadJSONDataIntoDatabase'                  : loadJSONDataIntoDatabase,
        'loadJSONDataIntoLocalStore'                : loadJSONDataIntoLocalStore,
        'loadJSONDataType'                          : loadJSONDataType,
        'logException'                              : logException,
        'logon'                                     : logon,
        'logoff'                                    : logoff,
        'postSavedTechnicianClockings'              : postSavedTechnicianClockings,
        'postSavedWorkOrders'                       : postSavedWorkOrders,
        'postWorkOrder'                             : postWorkOrder,
        'postWorkOrders'                            : postWorkOrders,
        'recordTime'                                : recordTime,
        'removeAllLocalStorageItems'                : removeAllLocalStorageItems,
        'removeCurrentWorkOrderId'                  : removeCurrentWorkOrderId,
        'reset'                                     : reset,
        'saveClockingStatus'                        : saveClockingStatus,
        'saveInventoryQuantityChanges'              : saveInventoryQuantityChanges,
        'saveJSON'                                  : saveJSON,
        'saveJSONFeedDataIntoLocalStore'            : saveJSONFeedDataIntoLocalStore,
        'setCurrentWorkOrderId'                     : setCurrentWorkOrderId,
        'setCurrentWorkOrderOnHold'                 : setCurrentWorkOrderOnHold,
        'setManageWorkOrderId'                      : setManageWorkOrderId,
        'setManageWorkOrderWritable'                : setManageWorkOrderWritable,
        'setPageSpecificPeriodicUpdateCompleteFn'   : setPageSpecificPeriodicUpdateCompleteFn,
        'setWorkOrderIdForClockingChange'           : setWorkOrderIdForClockingChange,
        'standardJobCodes'                          : standardJobCodes,
        'updateJSONFeedLastUpdated'                 : updateJSONFeedLastUpdated
    };
}();
