/**
 * jsondata.js
 */

"use strict";

/**
 * JSONData
 */
var JSONData = function() {

    /**
     * Logon JSON datatype and its webId
     */
    var JSON_DATATYPE_LOGON = "logon";
    var LOGON_WEBID         = 1;

    /**
     * Training mode constants
     */
    var TRAINING_USERNAME = "demo";
    var TRAINING_PASSWORD = "password";
    var TRAINING_WEBUSER_ID = 999999999;
    var TRAINING_LOGON_JSON = {
        success: true,
        authToken: "SGRUSEVNdklieEJQcm9TVmVkVnlSZz09OjE4aXZOUjJibHd6M3ZxYVJJc2tKb0E9PQ",
        tokenExpiration: Util.getISOCurrentTime(),
        webUserId: TRAINING_WEBUSER_ID,
        webId: 1,
        username: TRAINING_USERNAME,
        password: "password"
    };
    var TRAINING_WORKORDER_STARTING_NUMBER = 50000;
    var LS_TRAINING_WORKORDER_NUMBER = "trainingWorkOrderNumber";

    /**
     * Debug mode constants
     */
    var DEBUG_USERNAME = "debug";
    var DEBUG_PASSWORD = "password";
    var DEBUG_URL      = "debug.html";

    /**
     * Post debug information
     */
    var POST_DEBUG_PROPERTY_NAME = "postDebugInformation";
    var POST_DEBUG_INFO = {
        mobileAppVersion : "",
        postDateTime : "",
        technicianName : "",
        technicianUserId : ""
    };

    // Holds list of available standard job codes.  This is used by
    // saveJSONFeedDataIntoLocalStore to merge standard job code information
    // into all work orders saved to local storage
    var standardJobCodeArray = [];

    // In memory copy of the equipment that is used to
    // merge equipment information into work orders and PM schedules
    var equipmentArray = [];

    // Interval returned by setInterval for idle time logoff function
    var idleLogoffInterval = null;

    // Navigate to the work order list page after a JSON refresh?
    // This is done when the current work order is deleted.
    var navigateToWorkOrderListAfterRefresh = false;

    // Page to load after daily update completes, defaults to home page
    var pageToLoadAfterDailyUpdate = "home.html";

    // Interval returned by setInterval for periodic update function
    var periodicUpdateInterval = null;

    // Was products updated during last JSON feed update?
    var productsUpdated = false;

    /**
     * Constants
     */
    var COMM_DETAIL_TYPE_CELL                   = "CELL";
    var COMM_DETAIL_TYPE_EMAIL                  = "EMAIL";
    var COMM_DETAIL_TYPE_FAX                    = "FAX";
    var COMM_DETAIL_TYPE_PHONE                  = "PHONE";
    var DEFAULT_LUNCH_LENGTH_IN_MINS            = 30;
    var INVALID_CLOCKING_INTERVAL_ERRORCODE     = "200-102";
    var XCODE_STANDARD_JOB_CODE_PREFIX          = "X0";
    var INVALID_STANDARD_JOB_CODES              = [ "S1", XCODE_STANDARD_JOB_CODE_PREFIX ];
    var LABOR_CODE_ID_DP_TRAINING               = 23;
    var LABOR_CODE_ID_NOPAY                     = 24;
    var LABOR_CODE_ID_LUNCH                     = 25;
    var LABOR_CODE_ID_PAPERWORK                 = 14;
    var LABOR_CODE_ID_PARTS_RUN                 = 30;
    var LABOR_CODE_ID_PARTS_STAFF               = 21;
    var LABOR_CODE_ID_SERVICE_SUPERVISION       = 20;
    var LABOR_CODE_ID_TRAINING                  = 17;
    var LABOR_CODE_ID_TTRNC                     = 7;
    var LABOR_CODE_ID_VEHICLE_MAINTENANCE       = 19;
    var MESSAGE_TYPE_GENERAL                    = 0;
    var MESSAGE_TYPE_WO_REJECTED                = 1;
    var MESSAGE_TYPE_PART_REQUEST               = 2;
    var MESSAGE_TYPE_WO_REVIEW                  = 3;
    var MESSAGE_TYPE_CUSTOMER_CONTACT_UPDATE    = 4;
    var PM_SCHEDULE_CUTOFF_DATE                 = new Date("01/01/2000 12:00 AM" ).getTime();
    var PRODUCT_TYPE_PART                       = 1;
    var PRODUCT_TYPE_EQUIPMENT                  = 2;
    var PRODUCT_TYPE_LABOR                      = 3;
    var WORK_FROM_PM_FOLDER_ID                  = 355;
    var PM_CODES_MFG_ID                         = 1;
    var BATTERY_CODES_MFG_ID                    = 3;
    var DOCK_AND_DOOR_CODES_MFG_ID              = 4;
    var REPAIR_CODES_MFG_ID                     = 5;
    var SIGNATURE_FORMAT                        = "image/png;base64";
    var STANDARD_JOB_CODE_FM_COMPLETEJOBCODE    = "PMF";
    var STANDARD_JOB_CODE_PM_COMPLETEJOBCODE    = "PM";
    var STOCK_AREA_TYPE_VAN                     = 2;
    var VALID_STANDARD_JOB_CODE_MFGS            = [ PM_CODES_MFG_ID, REPAIR_CODES_MFG_ID,
                                                    BATTERY_CODES_MFG_ID, DOCK_AND_DOOR_CODES_MFG_ID ];
    var XCODE_DATATYPE                          = "xcodes";
    var WORK_ORDER_PRIMARY_ROLE_NAME            = "Work Order Primary";
    var WORK_ORDER_SECONDARY_ROLE_NAME          = "Work Order Secondary";

    /**
     * Local storage location for work order ID associated with
     * a clocking change to traveling or productive
     */
    var LS_WORK_ORDER_ID_FOR_CLOCKING_CHANGE = "workOrderIdForClockingChange";

    /**
     * Local storage location for indicating to close out day
     * that a logoff is in progress
     */
    var LS_LOGOFF_IN_PROGRESS = "loggingOff";

    /**
     * Local storage location for indicating the date for close out day
     */
    var LS_CLOSE_OUT_DATE = "closeOutDate";

    /**
     * Local storage location for indicating a close out day attempt
     */
    var LS_CLOSE_OUT_DAY_ATTEMPT = "closeOutDayAttempt";

    /**
     * Was periodic JSON feed update manually started?
     */
    var LS_JSON_FEED_UPDATE_MANUALLY_STARTED = "periodicJSONFeedUpdateManuallyStarted";

    /**
     * JSON feed request date / time
     */
    var LS_JSON_FEED_REQUEST_DATE_TIME = "jsonFeedReqestDateTime";

    /**
     * Periodic JSON feed update running flag
     */
    var LS_PERIODIC_JSON_FEED_UPDATE_RUNNING = "periodicJSONFeedUpdateRunning";

    /**
     * Post locally saved data running flags
     */
    var LS_POST_SAVED_TECHNICIANCLOCKING_RUNNING = "postSavedTechnicianClockingsRunning";
    var LS_POST_SAVE_WORKORDERS_RUNNING = "postSavedWorkOrdersRunning";

    /**
     * Customer equipment page being used for work order equipment selection
     */
    var LS_WORK_ORDER_EQUIPMENT_SELECTION = "workOrderEquipmentSelection";

    /**
     * Work order equipment ID selected from customer equipment page
     */
    var LS_WORK_ORDER_SELECTED_EQUIPMENT_ID = "workOrderSelectedEquipmentId";

    /**
     * Initial work order list filter which is used to initialize
     * the work order list page to display a new work order by itself
     */
    var LS_INITIAL_WORK_ORDER_LIST_FILTER = "workOrderFilter";

    /**
     * Current work order deleted during JSON refresh.  This lets
     * the work order list page display an alert that this occurred.
     */
    var LS_CURRENT_WORK_ORDER_DELETED = "currentWorkOrderDeleted";

    /**
     * Application paused and resumed flags.  This allows auto-logoff to be skipped
     * after power to the tablet is restored.
     */
    var LS_APP_PAUSED  = "applicationPaused";
    var LS_APP_RESUMED = "applicationResumed";

    /**
     * Data for last post to MT is written to this location
     */
    var LS_LAST_POST_DATA = "lastPostData";

    /**
     * Last post error data is written to local storage instead of being
     * displayed as an alert to the technician.
     */
    var LS_LAST_POST_ERROR = "lastPostError";

    /**
     * Skip the periodic JSON feed update after a page loads?
     */
    var LS_SKIP_PERIODIC_JSON_FEED_UPDATE = "skipPeriodicJSONFeedUpdate";

    /**
     * Did idle time logoff occur?
     */
    var LS_IDLE_TIME_LOGOFF_OCCURRED = "idleTimeLogoff";

    /**
     * ID for current customer, used to populate the customer equipment page
     * with equipment for the selected customer
     */
    var LS_CURRENT_CUSTOMER_ID = "currentCustomerId";

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
            key : "technicianStatusDPTraining",
            technicianStatus : TECHNICIAN_STATUS_NON_PRODUCTIVE,
            unproductiveTimeReason : 46,
            laborCodeId : LABOR_CODE_ID_DP_TRAINING
        },
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
            laborCodeId : LABOR_CODE_ID_LUNCH
        },
        {
            key : "technicianStatusNoPay",
            technicianStatus : TECHNICIAN_STATUS_NON_PRODUCTIVE,
            unproductiveTimeReason : 99,
            laborCodeId : LABOR_CODE_ID_NOPAY
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
            laborCodeId : LABOR_CODE_ID_PAPERWORK
        },
        {
            key : "technicianStatusPartsRun",
            technicianStatus : TECHNICIAN_STATUS_TRAVELING,
            unproductiveTimeReason : null,
            laborCodeId : LABOR_CODE_ID_PARTS_RUN
        },
        {
            key : "technicianStatusPartsStaff",
            technicianStatus : TECHNICIAN_STATUS_NON_PRODUCTIVE,
            unproductiveTimeReason : 21,
            laborCodeId : LABOR_CODE_ID_PARTS_STAFF
        },
        {
            key : "technicianStatusProductive",
            technicianStatus : TECHNICIAN_STATUS_PRODUCTIVE,
            unproductiveTimeReason : null,
            laborCodeId : 3
        },
        {
            key : "technicianStatusProductiveOrderApproval",
            technicianStatus : TECHNICIAN_STATUS_PRODUCTIVE,
            unproductiveTimeReason : null,
            laborCodeId : 29
        },
        {
            key : "technicianStatusServiceSupervision",
            technicianStatus : TECHNICIAN_STATUS_NON_PRODUCTIVE,
            unproductiveTimeReason : 20,
            laborCodeId : LABOR_CODE_ID_SERVICE_SUPERVISION
        },
        {
            key : "technicianStatusTraining",
            technicianStatus : TECHNICIAN_STATUS_NON_PRODUCTIVE,
            unproductiveTimeReason : 15,
            laborCodeId : LABOR_CODE_ID_TRAINING
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
            laborCodeId : LABOR_CODE_ID_VEHICLE_MAINTENANCE
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
     * After the PhoneGap deviceready event fires, run postLoadFn()
     */
    document.addEventListener( "deviceready", onDeviceReady, false );
    function onDeviceReady() {
        debug && console.log( "JSONData.onDeviceReady: Running postLoadFn" );
        postLoadFn();
    }

    /**
     * After this page loads on Chrome Desktop, run postLoadFn()
     */
    $(window).load( function() {
        if ( Util.isRunningOnChromeDesktop() ) {
            debug && console.log( "JSONData.window.load: Running postLoadFn" );
            postLoadFn();
        } else {
            debug && console.log( "JSONData.window.load: App running on tablet. postLoadFn skipped." );
        }
    });

    /**
     * Enable the interval functions.  Currently these are used
     * to perform periodic JSON feed updates and to perform an idle time logoff
     */
    function enableIntervalFunctions() {
        var config = Config.getConfig();
        if ( UIFrame.getCurrentPageId() != "loginPage" ) {
            // Turn on polling loop for pulling JSON feed updates for every page except logon
            if ( !periodicUpdateInterval ) {
                debug && console.log( "JSONData.enableIntervalFunctions: Periodic JSON feed update will run every " +
                                      config.periodicUpdateFrequency + " minutes" );
                periodicUpdateInterval = setInterval( function() {
                    debug && console.log( "JSONData.enableIntervalFunctions: Starting periodic JSON feed update at " +
                                          new Date() );
                    getPeriodicJSONFeedUpdates();
                }, config.periodicUpdateFrequency * 60 * 1000 );
            }

            // Turn on polling loop for automatically logging off.
            if ( !idleLogoffInterval ) {
                debug && console.log( "JSONData.enableIntervalFunctions: Mobile app will automatically logoff after " +
                                      config.idleTimeout + " minutes" );
                idleLogoffInterval = setInterval( function() {
                    debug && console.log( "JSONData.enableIntervalFunctions: Starting idle timeout logoff" );
                    logoff( true );
                }, config.idleTimeout * 60 * 1000 );
            }
        } else {
            debug && console.log( "JSONData.enableIntervalFunctions: Interval functions disabled on login page" );
        }
    }

    /**
     * Disable the interval functions
     */
    function disableIntervalFunctions() {
        if ( periodicUpdateInterval ) {
            debug && console.log( "JSONData.disableIntervalFunctions: Clearing interval for periodic JSON feed updates" );
            clearInterval( periodicUpdateInterval );
            periodicUpdateInterval = null;
        }
    }

    /**
     * Handle the pause event.
     */
    function onPause() {
        debug && console.log( "JSONData.onPause: App paused at " + new Date() );
        disableIntervalFunctions();
        window.localStorage.setItem( LS_APP_PAUSED, true );
        window.localStorage.removeItem( LS_APP_RESUMED );
    }

    /**
     * Handle the resume event.
     */
    function onResume() {
        debug && console.log( "JSONData.onResume: App resumed at " + new Date() );
        enableIntervalFunctions();
        // SFAM-206: Set app resumed flag so auto logoff can be skipped
        window.localStorage.setItem( LS_APP_RESUMED, true );
        window.localStorage.removeItem( LS_APP_PAUSED );

        // If the ManageWorkOrderParts object is still valid, we can safely call into
        // it to complete PSRT integration
        if ( typeof ManageWorkOrderParts !== 'undefined' ) {
            ManageWorkOrderParts.addPSRTPartsToPartList();
        }
    }

    /**
     * This function is executed after the page loads on Chrome Desktop
     * or when the onDeviceReady event fires on the tablet.
     * Use this function to determine if a periodic JSON feed update
     * is needed.  This allows PhoneGap to finish loading which makes
     * the LoadURL plugin available.  This fixes SFAM-173.
     */
    function postLoadFn() {
        var config = Config.getConfig();
        var currentPage;
        var lastPeriodicUpdate;
        var now;
        var periodicJSONUpdateNeeded = false;
        var skipUpdate = skipJSONFeedUpdate();

        try {
            currentPage = UIFrame.getCurrentPage();
        } catch ( exc ) {
            currentPage = null;
        }

        // Bind handlers for pause and resume events
        document.addEventListener( "pause", onPause, false );
        document.addEventListener( "resume", onResume, false );

        enableIntervalFunctions();

        // Remove periodic JSON feed running flag when new page loads
        window.localStorage.removeItem( LS_PERIODIC_JSON_FEED_UPDATE_RUNNING );
        if ( Util.isOnline( true ) && currentPage &&
             currentPage.id != "loginPage" &&
             currentPage.id != "debugPage" &&
             currentPage.id != "closeOutDayPage" ) {
            // Check the date/time stamp for the last periodic update.
            // If it's been longer than periodicUpdateFrequency
            // since the last update, run the update now.
            debug && console.log( "JSONData.postLoadFn: Checking last time periodic JSON feed update executed" );
            if ( config.dateTimePeriodicUpdate ) {
                now = new Date().getTime();
                lastPeriodicUpdate = new Date( config.dateTimePeriodicUpdate ).getTime();
                if ( ( now - lastPeriodicUpdate ) > config.periodicUpdateFrequency * 60 * 1000 ) {
                    periodicJSONUpdateNeeded = true;
                }
            } else {
                periodicJSONUpdateNeeded = true;
            }
            if ( periodicJSONUpdateNeeded && !skipUpdate ) {
                debug && console.log( "JSONData.postLoadFn: Running periodic JSON feed update" );
                JSONData.getPeriodicJSONFeedUpdates();
            } else {
                if ( skipUpdate ) {
                    debug && console.log( "JSONData.postLoadFn: Periodic JSON feed update skipped" );
                } else {
                    debug && console.log( "JSONData.postLoadFn: Periodic JSON feed update not needed" );
                }
            }
        }
    }

    /**
     * Handle window onload event
     */
    $(window).load( function() {
        var currentPageId;
        try {
            currentPageId = UIFrame.getCurrentPage().id;
        } catch ( exc ) {
            currentPageId = null;
        }

        // After a page loads, remove the flags indicating that post saved work orders is running
        // and post saved clockings is running
        debug && console.log( "JSONData.window.load: Removing post saved running flags" );
        window.localStorage.removeItem( LS_POST_SAVE_WORKORDERS_RUNNING );
        window.localStorage.removeItem( LS_POST_SAVED_TECHNICIANCLOCKING_RUNNING );

        // Populate the standard job codes array from the DB
        if ( currentPageId == "manageWorkOrderOverviewPage" ) {
            loadStandardJobCodesFromDatabase( function() {
                debug && console.log( "JSONData.window.load: Standard job codes loaded from the DB" );
            });
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

        // Call the init complete callback fn if it is defined
        if ( initCompleteCallback && _.isFunction( initCompleteCallback ) ) {
            initCompleteCallback();
        }
    });

    /**
     * Get the JSON feed configuration for the specified dataType
     * @param dataType
     * @param appConfig - app configuration, if null, Config.getConfig() is called to load it
     * @returns JSON feed configuration from the configuration JSON
     */
    function getJSONFeedConfig( dataType, appConfig ) {
        if ( !dataType ) {
            throw "JSONData.getJSONFeedConfig: Required parameters dataType is null or undefined";
        }
        if ( !appConfig ) {
            appConfig = Config.getConfig();
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
        if ( _.isNull( debugOutput ) || _.isUndefined( debugOutput ) || dataType == "technicianClocking" ) {
            debugOutput = true;
        }

        // Create the key for saving the json.  It includes the datatype.
        var key = null;
        if ( data.hasOwnProperty( "webId" ) ) {
            key = dataType + "." + data.webId;
        } else {
            key = dataType;
        }

        // If saving a work order, merge in supporting information if it's missing
        if ( dataType == "workOrders" ) {
            mergeAndSaveWorkOrderJSON( data );
        } else {
            if ( debugOutput ) {
                debug && console.log( "JSONData.saveJSON: Saving '" + JSON.stringify( data ) + "' using key '" + key + "'" );
            }
            // Save the JSON into local storage
            window.localStorage.setItem( key, JSON.stringify( data ) );
        }
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
     * Delete all locally stored JSON objects of the specified data type from local storage
     * @param dataType - String containing data type to delete
     */
    function deleteDataType( dataType ) {
        if ( dataType ) {
            debug && console.log( "JSONData.deleteDataType: Deleting all " + dataType + " objects" );
            _.each( getObjectsByDataType( dataType ), function( objectInList ) {
                if ( objectInList.webId ) {
                    deleteJSON( dataType, objectInList.webId );
                }
            });
        }
    }

    /**
     * Reset local storage by removing all local storage items except for the following
     * which are required to be present after this reset completes:
     * Configuration, Logon
     */
    function resetLocalStorage() {
        debug && console.log( "JSONData.resetLocalStorage: Resetting local storage" );
        // UI settings saved to local storage must be preserved during a reset
        var configuration = Config.getConfig();
        var logon = getObjectById( JSON_DATATYPE_LOGON, LOGON_WEBID, null );
        var resetReason = window.localStorage.getItem( "resetRequiredReason" );
        window.localStorage.clear();
        if ( logon ) {
            saveJSON( JSON_DATATYPE_LOGON, logon, true );
        }
        window.localStorage.setItem( "configuration.1", JSON.stringify( configuration ) );
        window.localStorage.setItem( "resetRequiredReason", resetReason );
    }

    /**
     * Update and save the date/time stamp when
     * the JSON feeds were last requested
     * @param configToUpdate - Configuration JSON
     * @param updateType - JSON data update type, member of JSON_DATA_UPDATE_TYPE,
     *                     defaults to FULL
     */
    function updateAllJSONFeedsLastUpdated( configToUpdate, updateType ) {
        var completeDateTimeStamp;
        if ( !configToUpdate ) {
            configToUpdate = Config.getConfig();
        }
        if ( Config.isTrainingMode() ) {
            completeDateTimeStamp = Util.getISOCurrentTime();
        } else {
            completeDateTimeStamp = window.localStorage.getItem( LS_JSON_FEED_REQUEST_DATE_TIME );
        }
        debug && console.log( "JSONData.updateAllJSONFeedsLastUpdated: Changing last updated for all feeds to " + completeDateTimeStamp );

        // All update types change the daily update date/time and the periodic date/time
        configToUpdate.dateTimeDailyUpdate = completeDateTimeStamp;
        configToUpdate.dateTimePeriodicUpdate = completeDateTimeStamp;

        // Update last full sync date/time stamp
        if ( updateType == JSON_FEED_UPDATE_TYPE.FULL ) {
            configToUpdate.dateTimeFullSync = completeDateTimeStamp;
        }

        // Add the reset date/time stamp as the update date/time for all JSON feeds
        _.each( configToUpdate.jsonDatabaseFeeds, function( feedInList ) {
            if ( ( feedInList.name === "products" && productsUpdated ) ||
                 feedInList.name !== "products" ) {
                feedInList.dateTimeUpdated = completeDateTimeStamp;
            }
        });
        _.each( configToUpdate.jsonLocalStoreFeeds, function( feedInList ) {
            feedInList.dateTimeUpdated = completeDateTimeStamp;
        });

        productsUpdated = false;
        Config.saveConfiguration( configToUpdate );
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
     * Load all of the equipmentfrom the database into a local array.
     * @param loadCallback - If specified, this function is called after the load is complete
     */
    function loadEquipmentFromDatabase( loadCallback ) {
        if ( equipmentArray.length == 0 ) {
            debug && console.log( "JSONData.loadEquipmentFromDatabase: Loading equipment from database into local array" );
            JSONData.getObjectsFromDatabase( "equipment", function( results ) {
                equipmentArray = results;
                if ( _.isFunction( loadCallback ) ) {
                    loadCallback();
                }
            });
        } else {
            debug && console.log( "JSONData.loadEquipmentFromDatabase: Database load skipped because equipment local array already loaded." );
            if ( _.isFunction( loadCallback ) ) {
                loadCallback();
            }
        }
    }

    /**
     * Returns the equipment array
     */
    function getEquipment() {
        return equipmentArray;
    }

    /**
     * Get equipment from the database for the specified customer ID
     * @param customerId
     * @param loadCallback
     */
    function getEquipmentFromDatabaseForCustomer( customerId, loadCallback ) {
        if ( !customerId || !loadCallback || !_.isFunction( loadCallback ) ) {
            throw "JSONData.getEquipmentFromDatabaseForCustomer: One or more required parameters (customerId, loadCallback) are missing or invalid";
        }
        var sqlParms = [];
        if ( _.isString( customerId ) ) {
            customerId = parseInt( customerId, 10 );
        }
        sqlParms.push( customerId );
        sqlParms.push( customerId );
        MobileDb.selectData( MobileDb.SQL_SELECT_EQUIPMENT_BY_CUSTOMER_ID, sqlParms, function( equipment ) {
            loadCallback( equipment );
        });
    }

    /**
     * Load all of the standard job codes from the database into a local array.
     * @param loadCallback - If specified, this function is called after the load is complete
     */
    function loadStandardJobCodesFromDatabase( loadCallback ) {
        if ( standardJobCodeArray.length == 0 ) {
            debug && console.log( "JSONData.loadStandardJobCodesFromDatabase: Loading standardJobCodes from database into local array" );
            JSONData.getObjectsFromDatabase( "standardJobCodes", function( results ) {
                standardJobCodeArray = results;
                if ( _.isFunction( loadCallback ) ) {
                    loadCallback();
                }
            });
        } else {
            debug && console.log( "JSONData.loadStandardJobCodesFromDatabase: Database load skipped because standardJobCodes local array already loaded." );
            if ( _.isFunction( loadCallback ) ) {
                loadCallback();
            }
        }
    }

    /**
     * Return the standard job codes array
     */
    function getStandardJobCodes() {
        return standardJobCodeArray;
    }

    /**
     * Flatten sub-object properties inside equipment object
     */
    function flattenEquipmentObject( equipment ) {
        if ( !equipment ) {
            throw "JSONData.flattenEquipmentObject: Required parameter equipment is null or undefined";
        }
        // debug && console.log( "JSONData.flattenEquipmentObject: Flattening " + JSON.stringify( equipment ) );
        equipment.lattitude = null;
        equipment.longitude = null;
        if ( _.isObject( equipment.location ) ) {
            equipment.lattitude = equipment.location.lattitude;
            equipment.longitude = equipment.location.longitude;
            delete equipment.location;
        }
        equipment.productId = null;
        equipment.manufacturer = null;
        equipment.productCode = null;
        if ( _.isObject( equipment.product ) ) {
            equipment.productId = equipment.product.webId;
            equipment.manufacturer = equipment.product.manufacturer;
            equipment.productCode = equipment.product.productCode;
            delete equipment.product;
        }
        equipment.warrantyId = null;
        equipment.warrantyStart = null;
        equipment.warrantyExpirationDate = null;
        equipment.warrantyDescription = null;
        if ( _.isObject( equipment.warranty ) ) {
            equipment.warrantyId = equipment.warranty.warrantyId;
            equipment.warrantyStart = equipment.warranty.warrantyStart;
            equipment.warrantyExpirationDate = equipment.warranty.expirationDate;
            equipment.warrantyDescription = equipment.warranty.description;
            delete equipment.warranty;
        }
    }

    /**
     * To improve performance, supporting data is merged into the PM schedule.
     * Currently, this method supports merging equipment and standardJobCode information.
     * @param pmSchedule
     */
    function mergeAndSavePMScheduleJSON( pmSchedule ) {
        if ( !pmSchedule ) {
            throw "JSONData.mergeAndSavePMScheduleJSON: Required parameter pmSchedule is undefined";
        }
        var saveMergedObjToLocalStorage = true;

        // Set up a merge complete function that is executed after
        // equipment and standard job code information merging is complete
        // within this method
        var mergeCompleteFn = _.after( 2, function() {
            debug && console.log( "JSONData.mergeAndPMScheduleJSON: Checking required supporting information for PM schedule ID " +
                                  pmSchedule.webId );
            // Make sure that equipment referred to by PM schedule exists.  If it does not,
            // do not save the work order to local storage
            if ( _.isObject( pmSchedule.equipment ) && pmSchedule.equipment.webId == pmSchedule.equipmentId ) {
                debug && console.log( "JSONData.mergeAndSavePMScheduleJSON: Merged following equipment into PM schedule: " +
                                      JSON.stringify( pmSchedule.equipment ) );
            } else {
                console.error ( "JSONData.mergeAndSavePMScheduleJSON: Equipment ID " + pmSchedule.equipmentId +
                                " does not exist. PM schedule " + pmSchedule.webId + " will not be saved" );
                saveMergedObjToLocalStorage = false;
            }
            // Make sure that standard job code referred to by PM schedule exists.  If it does not,
            // do not save the work order to local storage
            if ( saveMergedObjToLocalStorage ) {
                if ( _.isObject( pmSchedule.standardJobCode ) &&
                     pmSchedule.standardJobCode.webId == pmSchedule.standardJobCodeId ) {
                    debug && console.log( "JSONData.mergeAndSavePMScheduleJSON: Merged following standardJobCode into PM schedule: " +
                                          JSON.stringify( pmSchedule.standardJobCode ) );
                } else {
                    console.error ( "JSONData.mergeAndSavePMScheduleJSON: Standard job code ID " + pmSchedule.standardJobCodeId +
                                    " does not exist. PM schedule " + pmSchedule.webId + " will not be saved." );
                    saveMergedObjToLocalStorage = false
                }
            }
            // Make sure that customer referred to by work order exists.  If it does not,
            // do not save the work order to local storage
            if ( saveMergedObjToLocalStorage ) {
                if ( getObjectById( "customers", pmSchedule.customerId, null ) ) {
                    debug && console.log( "JSONData.mergeAndPMScheduleJSON: Customer webId: " + pmSchedule.customerId + " exists" );
                } else {
                    console.error( "JSONData.mergeAndSavePMScheduleJSON: Customer webId " + pmSchedule.customerId +
                                   " does not exist. PM schedule " + pmSchedule.webId + " will not be saved." );
                    saveMergedObjToLocalStorage = false;
                }
            }

            if ( saveMergedObjToLocalStorage ) {
                // SFAM-154: Don't save PM schedules whose schedule date comes
                // before 1/1/2000 @ 12:00 AM
                var pmScheduleDate = new Date( pmSchedule.dateSchedule ).getTime();
                if ( pmScheduleDate >= PM_SCHEDULE_CUTOFF_DATE ) {
                    window.localStorage.setItem( "pmSchedules." + pmSchedule.webId, JSON.stringify( pmSchedule ) );
                } else {
                    debug && console.log( "JSONData.mergeAndSavePMScheduleJSON: PM schedule " + pmSchedule.webId +
                                          " not saved because its dateSchedule " + pmSchedule.dateSchedule +
                                          " comes before the cutoff date" );
                }
            }

            // Always call the complete function
            if ( _.isFunction( mergeAndSavePMSchedulesCompleteFn ) ) {
                mergeAndSavePMSchedulesCompleteFn();
            }
        });

        // Get the merge information
        if ( pmSchedule.equipmentId && !pmSchedule.equipment ) {
            if ( equipmentArray.length > 0 ) {
                try {
                    pmSchedule.equipment =
                        getObjectFromArrayById( equipmentArray, pmSchedule.equipmentId );
                    mergeCompleteFn();
                } catch ( exc ) {
                    // If array lookup fails, fall back to using the DB
                    pmSchedule.equipment = null;
                }
            }
            if ( !pmSchedule.equipment ) {
                debug && console.log( "JSONData.mergeAndSavePMScheduleJSON: Getting equipment from database" );
                getObjectFromDatabaseById( "equipment", pmSchedule.equipmentId,
                    function( equipmentFromDb ) {
                        pmSchedule.equipment = equipmentFromDb;
                        mergeCompleteFn();
                    }
                );
            }
        } else {
            debug && console.log( "JSONData.mergeAndSavePMScheduleJSON: equipment merge not needed" );
            mergeCompleteFn();
        }
        if ( pmSchedule.standardJobCodeId && !pmSchedule.standardJobCode ) {
            if ( standardJobCodeArray.length > 0 ) {
                try {
                    pmSchedule.standardJobCode =
                        getObjectFromArrayById( standardJobCodeArray, pmSchedule.standardJobCodeId );
                    mergeCompleteFn();
                } catch ( exc ) {
                    // If array lookup fails, fall back to using the DB
                    pmSchedule.standardJobCode = null;
                }
            }
            if ( !pmSchedule.standardJobCode ) {
                debug && console.log( "JSONData.mergeAndSavePMScheduleJSON: Getting standardJobCode from database" );
                getObjectFromDatabaseById( "standardJobCodes", pmSchedule.standardJobCodeId,
                    function( standardJobCodeFromDb ) {
                        pmSchedule.standardJobCode = standardJobCodeFromDb;
                        mergeCompleteFn();
                    }
                );
            }
        } else {
            debug && console.log( "JSONData.mergeAndSavePMScheduleJSON: standardJobCode merge not needed" );
            mergeCompleteFn();
        }
    }

    /**
     * To improve performance, supporting data is merged into the specified json object.
     * Currently, this method supports merging equipment and standardJobCode information
     * into work orders and PM schedules.
     * @param workOrder
     */
    function mergeAndSaveWorkOrderJSON( workOrder ) {
        if ( !workOrder ) {
            throw "JSONData.mergeAndSaveWorkOrderJSON: Required parameter jsonObject is undefined";
        }

        var mergeLocation = workOrder.workOrderSegments[0];
        var object;
        var saveMergedObjToLocalStorage = true;
        var workOrderLines;

        // Set up a merge complete function that is executed after
        // equipment and standard job code information merging is complete
        // within this method
        var mergeCompleteFn = _.after( 2, function() {
            if ( !WorkOrder.checkAndMarkWorkOrderForDeletion( workOrder ) ) {
                debug && console.log( "JSONData.mergeAndSaveWorkOrderJSON: Checking required supporting information for work order " +
                                      workOrder.documentNumber );
                // Make sure that equipment referred to by work order exists.  If it does not,
                // do not save the work order to local storage
                if ( mergeLocation.equipmentId ) {
                    if ( _.isObject( mergeLocation.equipment ) &&
                         mergeLocation.equipment.webId == mergeLocation.equipmentId ) {
                        debug && console.log( "JSONData.mergeAndSaveWorkOrderJSON: Merged following equipment: " +
                                              JSON.stringify( mergeLocation.equipment ) );
                    } else {
                        console.error( "JSONData.mergeAndSaveWorkOrderJSON: Equipment ID " + mergeLocation.equipmentId +
                                       " does not exist. Work order " + workOrder.documentNumber + " will not be saved." );
                        saveMergedObjToLocalStorage = false;
                    }
                } else {
                    debug && console.log( "mergeAndSaveWorkOrderJSON: Work order does not have equipment assigned." );
                }
                // Make sure that standardJobCode referred to by work order exists.  If it does not,
                // do not save the work order to local storage
                if ( mergeLocation.standardJobCodeId ) {
                    if ( saveMergedObjToLocalStorage ) {
                        if ( _.isObject( mergeLocation.standardJobCode ) &&
                             mergeLocation.standardJobCodeId && mergeLocation.standardJobCode.webId ) {
                            debug && console.log( "JSONData.mergeAndSaveWorkOrderJSON: Merged following standardJobCode: " +
                                                  JSON.stringify( mergeLocation.standardJobCode ) );
                        } else {
                            console.error( "JSONData.mergeAndSaveWorkOrderJSON: Standard job code webId " + mergeLocation.standardJobCodeId +
                                           " does not exist. Work order " + workOrder.documentNumber + " will not be saved." );
                            saveMergedObjToLocalStorage = false;
                        }
                    }
                } else {
                    debug && console.log( "mergeAndSaveWorkOrderJSON: Work order does not a standard job code assigned." );
                }
                // Make sure that customer referred to by work order exists.  If it does not,
                // do not save the work order to local storage
                if ( saveMergedObjToLocalStorage ) {
                    if ( getObjectById( "customers", workOrder.customerId, null ) ) {
                        debug && console.log( "JSONData.mergeAndSaveWorkOrderJSON: Customer webId: " + workOrder.customerId + " exists" );
                    } else {
                        console.error( "JSONData.mergeAndSaveWorkOrderJSON: Customer webId " + workOrder.customerId +
                                       " does not exist. Work order will " + workOrder.documentNumber + " not be saved." );
                        saveMergedObjToLocalStorage = false;
                    }
                }

                if ( saveMergedObjToLocalStorage ) {
                    // SFAM-178: Remove work order lines whose deleted property = true from work orders
                    // that don't require a post to the middle tier
                    if ( _.isUndefined( workOrder.postToMiddleTierRequired ) || !workOrder.postToMiddleTierRequired ) {
                        debug && console.log( "JSONData.mergeAndSaveWorkOrderJSON: Work order line count before removing deleted lines: " +
                                              workOrder.workOrderSegments[0].workOrderLines.length );
                        workOrderLines = _.filter( workOrder.workOrderSegments[0].workOrderLines, function( lineInList ) {
                            return ( _.isUndefined( lineInList.deleted ) || !lineInList.deleted );
                        });
                        workOrder.workOrderSegments[0].workOrderLines = workOrderLines;
                        debug && console.log( "JSONData.mergeAndSaveWorkOrderJSON: Work order line count after removing deleted lines: " +
                                              workOrder.workOrderSegments[0].workOrderLines.length );
                    }
                }

                // SFAM-178: Will updated work order change a locally stored version of that same work order?
                if ( saveMergedObjToLocalStorage ) {
                    if ( WorkOrder.isWorkOrderChanged( workOrder ) ) {
                        // If a periodic JSON feed changed the work order, add a changed flag to the work order
                        if ( isPeriodicJSONFeedUpdateRunning() ) {
                            workOrder.changed = true;
                        }
                    }
                }

                // Save the merged data to local storage
                if ( saveMergedObjToLocalStorage ) {
                    // SFAM-253 - If object being saved matches another via clientReference, remove locally saved
                    //            object before saving new / updated object
                    if ( workOrder.clientReference ) {
                        object = getObjectById( "workOrders", workOrder.clientReference, "clientReference" );
                        if ( object ) {
                            debug && console.log( "JSONData.mergeAndSaveWorkOrderJSON: Deleting workOrder." + object.webId +
                                                  " via clientReference " + workOrder.clientReference + " before saving updated version" );
                            deleteJSON( "workOrders", object.webId );
                        } else {
                            debug && console.log( "JSONData.mergeAndSaveWorkOrderJSON: Work order object with clientReference " +
                                                  workOrder.clientReference + " does not exist" );
                        }
                    }
                    window.localStorage.setItem( "workOrders." + workOrder.webId, JSON.stringify( workOrder ) );
                }
            }

            // Call the appropriate merge and save complete fn
            if ( _.isFunction( mergeAndSaveWorkOrdersCompleteFn ) ) {
                mergeAndSaveWorkOrdersCompleteFn();
            }
        });

        // Get the equipment information and the standard job code information for the
        // specified work order.
        if ( mergeLocation.equipmentId && !mergeLocation.equipment ) {
            if ( equipmentArray.length > 0 ) {
                mergeLocation.equipment =
                    getObjectFromArrayById( equipmentArray, mergeLocation.equipmentId );
                mergeCompleteFn();
            } else {
                debug && console.log( "JSONData.mergeAndSaveWorkOrderJSON: Getting equipment from database" );
                getObjectFromDatabaseById( "equipment", mergeLocation.equipmentId,
                    function( equipmentFromDb ) {
                        mergeLocation.equipment = equipmentFromDb;
                        mergeCompleteFn();
                    }
                );
            }
        } else {
            debug && console.log( "JSONData.mergeAndSaveWorkOrderJSON: equipment merge not needed" );
            mergeCompleteFn();
        }
        if ( mergeLocation.standardJobCodeId && !mergeLocation.standardJobCode ) {
            if ( standardJobCodeArray.length > 0 ) {
                mergeLocation.standardJobCode =
                    getObjectFromArrayById( standardJobCodeArray, mergeLocation.standardJobCodeId );
                mergeCompleteFn();
            } else {
                debug && console.log( "JSONData.mergeAndSaveWorkOrderJSON: Getting standardJobCode from database" );
                getObjectFromDatabaseById( "standardJobCodes", mergeLocation.standardJobCodeId,
                    function( standardJobCodeFromDb ) {
                        mergeLocation.standardJobCode = standardJobCodeFromDb;
                        mergeCompleteFn();
                    }
                );
            }
        } else {
            debug && console.log( "JSONData.mergeAndSaveWorkOrderJSON: standardJobCode merge not needed" );
            mergeCompleteFn();
        }
    }

    /**
     * Merge and save complete function for work orders
     */
    var mergeAndSaveWorkOrdersCompleteFn = null;
    function mergeAndSaveWorkOrdersComplete() {
        debug && console.log( "JSONData.mergeAndSaveWorkOrdersComplete: Merge and save work orders during periodic JSON feed update complete" );
        var currentPageId;
        try {
            currentPageId = UIFrame.getCurrentPageId();
        } catch ( exc ) {
            currentPageId = null;
        }
        // Clear the periodic JSON feed update flag
        window.localStorage.removeItem( LS_PERIODIC_JSON_FEED_UPDATE_RUNNING );
        if ( numWorkOrdersSavedDuringLastUpdate > 0 && currentPageId !== "loginPage" ) {
            // If the new work order count increases, play a beep and vibrate the tablet
            if ( WorkOrder.getNewWorkOrderCount( null ) > numDispatchedWorkOrders ) {
                if ( navigator.notification ) {
                    debug && console.log( "JSONData.mergeAndSaveWorkOrdersComplete: Alert technician about newly arrived dispatched work orders" );
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
            debug && console.log( "JSONData.mergeAndSaveWorkOrdersComplete: No work orders saved during last update" );
        }

        // Delete locally stored work orders not in middle tier and not marked as new in the mobile app
        navigateToWorkOrderListAfterRefresh = WorkOrder.deleteWorkOrdersAfterJSONFeedUpdate();

        if ( navigateToWorkOrderListAfterRefresh ) {
            navigateToWorkOrderListAfterRefresh = false;
            if ( UIFrame.getCurrentPageId() === "workOrderListPage" ) {
                UIFrame.reloadCurrentPage();
            } else {
                UIFrame.navigateToPage( "workorderlist.html" );
            }
        } else if ( _.isFunction( pageSpecificPeriodicUpdateCompleteFn ) ) {
            pageSpecificPeriodicUpdateCompleteFn( "workOrders" );
        }
    }

    /**
     * Merge and save complete function for PM schedules
     */
    var mergeAndSavePMSchedulesCompleteFn = null;
    function mergeAndSavePMSchedulesComplete() {
        debug && console.log( "JSONData.mergeAndSavePMSchedulesComplete: Merge and save PM schedules during periodic JSON feed update complete" );
        if ( _.isFunction( pageSpecificPeriodicUpdateCompleteFn ) ) {
            pageSpecificPeriodicUpdateCompleteFn( "pmSchedules" );
        }
    }

    /**
     * Save JSON feed data with 0 to n objects inside of it
     * to the local store
     * @param jsonFeedData - JSON feed data
     * @returns Number of objects saved to local storage
     */
    function saveJSONFeedDataIntoLocalStore( jsonFeedData ) {
        var dataType;
        if ( !jsonFeedData ) {
            throw "JSONData.saveJSONFeedDataIntoLocalStore: Required parameters jsonFeedData is undefined";
        }
        var count = jsonFeedData['total'];
        var currentItem = null;
        if ( count > 0 ) {
            dataType = JSONData.getDataTypeFromJSONFeedData( jsonFeedData );
            if ( dataType == "workOrders" ) {
                numWorkOrdersSavedDuringLastUpdate = count;
            } else if ( dataType == "pmSchedules" ) {
                numPMSchedulesSavedDuringLastUpdate = count;
            }
            debug && console.log( "JSONData.saveJSONFeedDataIntoLocalStore: Saving " + count +
                                  " " + dataType  + " objects into local JSON store" );

            // If feed is read only, we store the data as a single item inside local storage
            var isReadOnly = getJSONFeedConfig( dataType, null ).readOnly;
            if ( isReadOnly ) {
                // Only save webUser information for the currently logged on technician
                if ( dataType == "webUsers") {
                    var webUserInfo = _.find( jsonFeedData[dataType], function( webUserInList ) {
                        return webUserInList.webId == technicianWebUserId;
                    });
                    if ( webUserInfo ) {
                        // Save single web user for current technician as an array so that the
                        // methods that get JSON objects will work properly.
                        var webUsers = [];
                        webUsers.push( webUserInfo );
                        window.localStorage.setItem( dataType, JSON.stringify( webUsers ) );
                    }
                } else {
                    window.localStorage.setItem( dataType, JSON.stringify(jsonFeedData[dataType]) );
                }
            } else {
                // Set up merge and save complete functions for work orders and PM schedules.
                // This allows us to update current page properly when the merge and saves are complete.
                if ( dataType === "workOrders" && count > 0 ) {
                    mergeAndSaveWorkOrdersCompleteFn = _.after( count, mergeAndSaveWorkOrdersComplete );
                } else if ( dataType === "pmSchedules" && count > 0 ) {
                    mergeAndSavePMSchedulesCompleteFn = _.after( count, mergeAndSavePMSchedulesComplete );
                }
                for ( var i = 0; i < count; i++ ) {
                    currentItem = jsonFeedData[dataType][i];
                    // Certain data types will include properties from other
                    // data types before being saved to local storage.  This improves
                    // page loading performance
                    switch ( dataType ) {
                        case "workOrders":
                            mergeAndSaveWorkOrderJSON( currentItem );
                            break;
                        case "pmSchedules":
                            mergeAndSavePMScheduleJSON( currentItem );
                            break;
                        default:
                            saveJSON( dataType, currentItem, false );
                            break;
                    }
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

        if ( Util.isOnline( true ) && jsonFeed.url != "" && !Config.getConfig().loadLocalJSONFilesOnly ) {
            // Set the feed URL
            jsonUrl = Config.getConfig().middleTierBaseUrl + Config.getConfig().middleTierVersion + "/" + jsonFeed.url;

            // Update only supported when mobile app is online and is not
            // loading local files only
            if ( updateType == JSON_FEED_UPDATE_TYPE.DAILY || updateType == JSON_FEED_UPDATE_TYPE.PERIODIC ) {
                // Perform update for those JSON feeds that support update.  Otherwise, skip the load
                if ( jsonFeed.updateSupported ) {
                    // SFAM-153: PM schedule update uses full PM schedule feed
                    // Daily update uses full work order feed
                    if ( jsonFeed.name == "pmSchedules" ||
                         ( updateType == JSON_FEED_UPDATE_TYPE.DAILY && jsonFeed.name == "workOrders" ) ) {
                        debug && console.log( "JSONData.loadJSONDataType: Using full feed for " + jsonFeed.name + " update" );
                    } else {
                        // Add date/time stamp to the feed URL when performing an update
                        jsonUrl += ( Config.getConfig().jsonFeedUpdateUrlParameter + jsonFeed.dateTimeUpdated );
                    }
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
            loadJSON( jsonUrl,
                function( data ) {
                    debug && console.log( "JSONData.loadJSONDataType: LoadJSON successful" );

                    // Update type and data type dictate what happens to existing data
                    // before saving new data
                    switch ( updateType ) {
                        case JSON_FEED_UPDATE_TYPE.DAILY :
                            // Existing PM schedules and work orders get deleted during a daily update
                            if ( jsonFeed.name == "pmSchedules" || jsonFeed.name == "workOrders" ) {
                                deleteDataType( jsonFeed.name );
                            }
                            break;
                        case JSON_FEED_UPDATE_TYPE.PERIODIC :
                            // Existing PM schedules get deleted during periodic update
                            if ( jsonFeed.name == "pmSchedules" ) {
                                deleteDataType( jsonFeed.name );
                            }
                            break;
                        case JSON_FEED_UPDATE_TYPE.FULL :
                            debug && console.log( "JSONData.loadJSONDataType: No processing of existing data required" );
                            break;
                    }

                    // Set request date/time to the middle tier request date from the first feed
                    // that returns data.  If this property does not exist, use the current date/time.
                    if ( !window.localStorage.getItem( LS_JSON_FEED_REQUEST_DATE_TIME ) ) {
                        if ( typeof data["requestDate"] === "undefined" ) {
                            window.localStorage.setItem( LS_JSON_FEED_REQUEST_DATE_TIME, Util.getISOCurrentTime() );
                        } else {
                            window.localStorage.setItem( LS_JSON_FEED_REQUEST_DATE_TIME, data["requestDate"] )
                        }
                    }

                    successCallback( data );
                }, errorCallback );
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
        // Clear the periodic JSON feed update running flag only if the merge work order complete fn is missing
        if ( !mergeAndSaveWorkOrdersCompleteFn || !_.isFunction( mergeAndSaveWorkOrdersCompleteFn ) ) {
            window.localStorage.removeItem( LS_PERIODIC_JSON_FEED_UPDATE_RUNNING );
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
        var skipUpdate = false;
        if ( _.isUndefined( manuallyStarted ) ) {
            manuallyStarted = false;
        }

        // Reset the merge and save complete fn's
        mergeAndSavePMSchedulesCompleteFn = null;
        mergeAndSaveWorkOrdersCompleteFn = null;

        // Is this JSON feed update being skipped?
        skipUpdate = ( skipJSONFeedUpdate() ||
                       ( !manuallyStarted && Dialog.isDialogDisplayed() ) ||
                       isPostLocallySavedDataRunning() );

        // Don't start the periodic update if a dialog is displayed or if
        // the app is busy posting locally saved data
        if ( skipUpdate ) {
            debug && console.log( "JSONData.getPeriodicJSONFeedUpdates: Periodic update skipped" );
        } else {
            debug && console.log( "JSONData.getPeriodicJSONFeedUpdates: Periodic update started at " +
                                  new Date() );

            // Clear the JSON feed request date / time
            window.localStorage.removeItem( LS_JSON_FEED_REQUEST_DATE_TIME );

            // Set up the complete function that is called when the periodic update completes
            if ( pageSpecificPeriodicUpdateCompleteFn && _.isFunction( pageSpecificPeriodicUpdateCompleteFn ) ) {
                periodicUpdateCompleteFn = _.wrap( pageSpecificPeriodicUpdateCompleteFn, periodicJSONUpdateComplete );
            } else {
                periodicUpdateCompleteFn = periodicJSONUpdateComplete;
            }
            debug && console.log( "JSONData.getPeriodicJSONFeedUpdates: JSON feed polling function executing" );
            if ( Util.isOnline( true ) ) {
                window.localStorage.setItem( LS_PERIODIC_JSON_FEED_UPDATE_RUNNING, true );
                if ( manuallyStarted ) {
                    window.localStorage.setItem( LS_JSON_FEED_UPDATE_MANUALLY_STARTED, true );
                } else {
                    window.localStorage.removeItem( LS_JSON_FEED_UPDATE_MANUALLY_STARTED );
                }
                loadJSONDataIntoDatabase( JSON_FEED_UPDATE_TYPE.PERIODIC );
            } else {
                Dialog.closeDialog( false );
                debug && console.log( "JSONData.getPeriodicJSONFeedUpdates: Skipped because app is offline" );
            }
        }
        return true;
    }

    /**
     * Is the periodic JSON feed update running?
     * @returns true if it's running, false otherwise
     */
    function isPeriodicJSONFeedUpdateRunning() {
        return window.localStorage.getItem( LS_PERIODIC_JSON_FEED_UPDATE_RUNNING );
    }

    /**
     * Is a product feed updated needed?  The product JSON feed configuration
     * indicates how often the update should be done.
     * @returns Boolean indicating if an update is needed
     */
    function isProductUpdateNeeded() {
        var config = Config.getConfig();
        var lastUpdate;
        var now = new Date().getTime();
        var updateFrequency;
        var updateNeeded;
        //noinspection JSUnresolvedVariable
        var productFeed = _.find( config.jsonDatabaseFeeds, function( feedInList ) {
            return feedInList.name === "products";
        });
        //noinspection JSUnresolvedVariable
        updateFrequency = productFeed.updateFrequencyInDays * 24 * 60 * 60 * 1000;
        if ( productFeed.dateTimeUpdated ) {
            lastUpdate = new Date( productFeed.dateTimeUpdated ).getTime();
        } else {
            // Update has not been done so use full reset date/time to determine
            // if an update is needed
            lastUpdate = new Date( config.dateTimeFullSync ).getTime();
        }
        updateNeeded = ( ( now - lastUpdate ) >= updateFrequency );
        debug && console.log( "JSONData.isProductUpdateNeeded: Product update needed = " + updateNeeded );
        return updateNeeded;
    }

    /**
     * Load JSON feeds into the database
     * @param updateType - JSON data update type, member of JSON_DATA_UPDATE_TYPE,
     *                     defaults to FULL
     */
    var loadJSONDataIntoDatabaseComplete = null;
    var loadJSONDataErrorOccurred = false;
    function loadJSONDataIntoDatabase( updateType ) {
        var count;
        var currentJSONFeed;
        var dataType;
        var i;

        // Check the update type, default to FULL
        if ( _.isUndefined( updateType ) ) {
            updateType = JSON_FEED_UPDATE_TYPE.FULL;
        }
        debug && console.log( "JSONData.loadJSONDataIntoDatabase: Update type = " + updateType );

        // Reset update counters
        numPMSchedulesSavedDuringLastUpdate = 0;
        numWorkOrdersSavedDuringLastUpdate = 0;

        // Get current number of dispatched work orders.  This allows us to alert the technician
        // about newly arrived dispatched work orders after the JSON feed update is complete
        numDispatchedWorkOrders = WorkOrder.getNewWorkOrderCount( null );
        debug && console.log( "JSONData.loadJSONDataIntoDatabase: Current number of dispatched work orders = " + numDispatchedWorkOrders );

        if ( !config ) {
            config = Config.getConfig();
        }

        // Clear error flag
        loadJSONDataErrorOccurred = false;

        // Set up the complete function that is executed once after all of the
        // database based JSON feeds have completed their load.  This complete function
        // calls loadJSONDataIntoLocalStore to load the JSON feeds that are stored in local storage
        loadJSONDataIntoDatabaseComplete = _.after( Config.getConfig().jsonDatabaseFeeds.length, function() {
            debug && console.log( "JSONData.loadJSONDataIntoDatabaseComplete: Executed once after all JSON is loaded into the DB" );
            loadJSONDataIntoLocalStore( updateType );
        });

        // Load all of the database feeds
        for ( i = 0; i < Config.getConfig().jsonDatabaseFeeds.length; i++ ) {
            currentJSONFeed = Config.getConfig().jsonDatabaseFeeds[i];
            // Products skipped during a full load
            if ( updateType == JSON_FEED_UPDATE_TYPE.FULL && currentJSONFeed.name === "products" ) {
                debug && console.log( "JSONData.loadJSONDataIntoDatabase: Skipping " + currentJSONFeed.name +
                                      " feed during full update" );
                // This causes the dateTimeUpdated property on the products feed to match
                // the date/time of the full reset
                productsUpdated = true;
                loadJSONDataIntoDatabaseComplete();
            } else {
                if ( currentJSONFeed.name === "products" &&
                     ( updateType == JSON_FEED_UPDATE_TYPE.PERIODIC || !isProductUpdateNeeded() ) ) {
                    debug && console.log( "JSONData.loadJSONDataIntoDatabase: Skipping " + currentJSONFeed.name +
                                          " feed because update is not needed" );
                    productsUpdated = false;
                    loadJSONDataIntoDatabaseComplete();
                } else {
                    if ( currentJSONFeed.name === "products" ) {
                        productsUpdated = true;
                    }
                    debug && console.log( "JSONData.loadJSONFilesIntoDatabase: Loading JSON datatype '" +
                                          currentJSONFeed.name + "' into the DB" );
                    loadJSONDataType( currentJSONFeed, updateType,
                        // Success call back stores the JSON data into the database
                        function( data ) {
                            dataType = JSONData.getDataTypeFromJSONFeedData( data );

                            // Customer data is actually stored in local storage.  It is pulled during the database feed
                            // because customer data needs to be available before work orders and PM schedules
                            // are merged and stored.
                            if ( dataType == "customers" ) {
                                debug && console.log( "JSONData.loadJSONDataIntoDatabase: Saving customer data into local storage" );
                                saveJSONFeedDataIntoLocalStore( data );
                                loadJSONDataIntoDatabaseComplete();
                            } else {
                                debug && console.log( "JSONData.loadJSONDataIntoDatabase: Storing " + dataType + " into DB" );
                                if ( updateType == JSON_FEED_UPDATE_TYPE.DAILY || updateType == JSON_FEED_UPDATE_TYPE.PERIODIC ) {
                                    count = data['total'];
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
                                    // During a full sync, tables are created and populated.
                                    MobileDb.createAndPopulateTable( data, function() {
                                        debug && console.log( "JSONData.loadJSONDataIntoDatabase: " + dataType + " table created and populated" );
                                        // Load equipment and standard job codes into memory
                                        // to support merging this information into PM schedules and work orders later
                                        if ( data.hasOwnProperty( "equipment" ) ) {
                                            equipmentArray = data["equipment"];
                                            _.each( equipmentArray, function( equipmentInList ) {
                                                flattenEquipmentObject( equipmentInList );
                                            });
                                        } else if ( data.hasOwnProperty( "standardJobCodes" ) ) {
                                            standardJobCodeArray = data["standardJobCodes"];
                                        }
                                        loadJSONDataIntoDatabaseComplete();
                                    }, null );
                                }
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

        // UNDERSCORE _.after REALPHONEGAP DEMO
        // Set up an _.after function that executes once when all JSON data is loaded into
        // the local store
        loadJSONDataIntoLocalStoreComplete = _.after( Config.getConfig().jsonLocalStoreFeeds.length, function() {
            debug && console.log( "JSONData.loadJSONDataIntoLocalStoreComplete: Executed once after all JSON is loaded into local storage" );
            // Close the please wait dialog if periodic update was manually started
            // or if a daily or full update is being done
            if ( ( updateType != JSON_FEED_UPDATE_TYPE.PERIODIC ) ||
                 updateType == JSON_FEED_UPDATE_TYPE.PERIODIC &&
                 window.localStorage.getItem( LS_JSON_FEED_UPDATE_MANUALLY_STARTED ) ) {
                Dialog.closeDialog( false );
            }

            var loadTime = ( new Date().getTime() - loadJSONDataIntoLocalStoreStartTime ) / 1000;
            debug && console.log( "JSONData.loadJSONDataIntoLocalStoreComplete: JSON data loading is complete.  Load time = " + loadTime + " seconds" );

            switch ( updateType ) {
                case JSON_FEED_UPDATE_TYPE.DAILY :
                    // When daily update is complete, navigate to the home page
                    Dialog.showAlert( Localization.getText( "updateApplicationTitle" ),
                                      Localization.getText( "updateApplicationComplete" ),
                        function() {
                            // Set pmSchedules update supported back to false after daily update completes
                            Config.setUpdateSupportedForJSONFeed( "pmSchedules", false );
                            updateAllJSONFeedsLastUpdated( Config.getConfig(), updateType );
                            if ( UIFrame ) {
                                UIFrame.navigateToPage( pageToLoadAfterDailyUpdate, true, null );
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
                                var logonInfo = getObjectById( JSON_DATATYPE_LOGON, LOGON_WEBID, null );
                                updateAllJSONFeedsLastUpdated( Config.getConfig(), updateType );
                                // Reset complete...start login again using saved logon information
                                logon( logonInfo.username, logonInfo.password, false );
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
        for ( var i = 0; i < Config.getConfig().jsonLocalStoreFeeds.length; i++ ) {
            debug && console.log( "JSONData.loadJSONFilesIntoLocalStore: Loading JSON datatype '" +
                                  Config.getConfig().jsonLocalStoreFeeds[i].name + "' into local store" );
            loadJSONDataType( Config.getConfig().jsonLocalStoreFeeds[i], updateType,
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
     * Is a full reset of all JSON / local storage data required?
     * @returns Boolean - true if reset required, false otherwise
     */
    function isResetRequired() {
        var config = Config.getConfig();
        var now = new Date();
//        var resetDate;
        var resetRequired = false;

        if ( config.dateTimeFullSync ) {
            // If last full sync was done yesterday or earlier, full reset is required
//            resetDate = new Date( config.dateTimeFullSync );
//            resetDate.setHours( 0, 0, 0, 0 );
//            now.setHours( 0, 0, 0, 0 );
//            resetRequired = ( now.getTime() - resetDate.getTime() >= ( 1000 * 60 * 60 * 24 ) );
        } else {
            // Absence of date/time stamp for last full sync causes a reset to be done
            resetRequired = true;
        }
        debug && console.log( "JSONData.isResetRequired: Full reset required = " + resetRequired );
        if ( resetRequired ) {
            window.localStorage.setItem( "resetRequiredReason", "JSONData.isResetRequired is returning true" );
        }
        return resetRequired;
    }

    /**
     * Is the technician current traveling?
     * @returns Boolean - true if traveling, false if not.
     */
    function isTechnicianTraveling() {
        return ( ( getCurrentClockingStatus( null ) === "technicianStatusTraveling" ) ||
                 ( getCurrentClockingStatus( null ) === "technicianStatusPartsRun" ) );
    }

    /**
     * Log onto the mobile app
     * @param username
     * @param password
     * @param automaticLogon - Boolean, is automatic logon being done?
     */
    function logon( username, password, automaticLogon ) {
        debug && console.log( "JSONData.logon: Logging onto mobile app" );

        // Trim leading / trailing white space from the user name
        username = $.trim( username );

        // Debug mode redirects to a page that will dump all of the contents of local storage
        if ( username.toLowerCase() === DEBUG_USERNAME &&
             password === DEBUG_PASSWORD ) {
            UIFrame.loadUrl( DEBUG_URL );
            return;
        }

        // Training mode bypasses authentication logic below.
        if ( username.toLowerCase() === TRAINING_USERNAME &&
             password === TRAINING_PASSWORD ) {
            logonSuccessful( TRAINING_LOGON_JSON, automaticLogon );
        } else if ( Util.isOnline( true ) ) {
            debug && console.log( "JSONData.logon: App is online. Logon with middle tier will be attempted" );

            // Post the request to logon
            $.ajax( {
                url : Config.getConfig().middleTierBaseUrl + Config.getConfig().logonUrl,
                type : "POST",
                timeout : (Config.getConfig().logonTimeout * 1000),
                beforeSend : function( xhr ) {
                    // Logon requires this additional header
                    xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
                },
                data : {
                    j_username : Config.getConfig().enterpriseId + ";" + username,
                    j_password : password
                },
                dataType : 'json',
                success : function( data ) {
                    Dialog.closeDialog( false );
                    if ( data && ( data.success || data.processed ) ) {
                        // Add username and password to returned logon response and complete
                        // successful logon
                        data.webId = LOGON_WEBID;
                        data.username = username;
                        data.password = password;
                        debug && console.log( "JSONData.logon.success: Authentication with middle tier successful" );
                        logonSuccessful( data, automaticLogon );
                    } else {
                        debug && console.log( "JSONData.logon: JSON data result indicates failed logon" );
                        logonFailed();
                    }
                },
                error : function( jqXHR, textStatus ) {
                    debug && console.log( "JSONData.logon: ajax error" );
                    Dialog.closeDialog( false );
                    if ( textStatus && textStatus.length > 0 ) {
                        debug && console.log( "JSONData.logon: error status text = " + textStatus );
                    }
                    logonFailed();
                }
            });
        } else {
            debug && console.log( "JSONData.logon: App is offline. Disconnected logon will be attempted" );
            var logon = getObjectById( JSON_DATATYPE_LOGON, LOGON_WEBID, null );
            if ( logon ) {
                var now = new Date();
                var logonDate = new Date( logon.tokenExpiration );
                if ( now < logonDate ) {
                    if ( username == logon.username &&
                         password == logon.password ) {
                        debug && console.log( "JSONData.logon: Disconnected logon successful" );
                        Dialog.closeDialog( false );
                        logonSuccessful( logon, automaticLogon );
                    } else {
                        debug && console.log( "JSONData.logon: Disconnected logon failed because of username / password" );
                        logonFailed();
                    }
                } else {
                    debug && console.log( "JSONData.logon: Disconnected logon failed because logon JSON is expired" );
                    logonFailed();
                }
            } else {
                debug && console.log( "JSONData.logon: Disconnected logon failed because local logon JSON is missing" );
                logonFailed();
            }
        }
    }

    /**
     * Used by logon above when logging on is successful
     * @param data - Data returned from ajax logon request
     * @param automaticLogon - Boolean, is automatic logon being done?
     */
    function logonSuccessful( data, automaticLogon ) {
        var closeOutDayRequired = isCloseOutDayRequired( true );
        var config = Config.getConfig();
        var currentClockingStatus;
        var currentPage;
        var previousLogonInfo;
        var resetNeeded = false;
        var startDailyUpdateFn;

        // Add the current date/time to the logon data
        data.logonDateTime = Util.getISOCurrentTime();

        debug && console.log( "JSONData.logonSuccessful: Logon successful. JSON data returned: " + JSON.stringify( data ) );
        Dialog.closeDialog( false );

        // Verify that all items in local storage are present
        checkLocalStorageItems();

        // Clear the unsaved changes flag
        setUnsavedChanges( false, null );

        // Switching usernames requires that a full reset be done
        previousLogonInfo = getObjectById( JSON_DATATYPE_LOGON, LOGON_WEBID, null );
        if ( previousLogonInfo ) {
            if ( previousLogonInfo.username.toLowerCase() != data.username.toLowerCase() ) {
                debug && console.log( "JSONData.logonSuccessful: username changed from " +
                                      previousLogonInfo.username + " to " + data.username );
                window.localStorage.setItem( "resetRequiredReason", "Username changed from " +
                                             previousLogonInfo.username + " to " + data.username );
                resetNeeded = true;
            }
        } else {
            // SFAM-246: Absence of logon JSON is treated as username change
            debug && console.log( "JSONData.logonSuccessful: logon JSON object is missing" );
            window.localStorage.setItem( "resetRequiredReason", "logon JSON object is missing" );
            resetNeeded = true;
        }

        // If in training mode, set loadLocalJSONFilesOnly to true and add trainingMode property
        if ( data.username.toLowerCase() === TRAINING_USERNAME ) {
            config.loadLocalJSONFilesOnly = true;
            config.trainingMode = true;
            if ( !window.localStorage.getItem( LS_TRAINING_WORKORDER_NUMBER ) ) {
                window.localStorage.setItem( LS_TRAINING_WORKORDER_NUMBER, TRAINING_WORKORDER_STARTING_NUMBER );
            }
        } else {
            config.loadLocalJSONFilesOnly = false;
            config.trainingMode = false;
        }
        Config.saveConfiguration( config );

        // Check for other conditions that require a full reset to be done
        if ( !resetNeeded && !closeOutDayRequired ) {
            resetNeeded = isResetRequired();
        }

        // Reset is not done when automatically logging on
        if ( resetNeeded && !automaticLogon ) {
            debug && console.log( "JSONData.logonSuccessful: Reset reason: " + window.localStorage.getItem( "resetRequiredReason" ) );
            Dialog.showConfirmYesNo( Localization.getText( "resetTitle" ), Localization.getText( "resetPrompt" ),
                function() {
                    Dialog.closeDialog( false );
                    technicianWebUserId = data.webUserId;
                    // Reset needs the logon information to re-logon when the reset completes
                    saveJSON( JSON_DATATYPE_LOGON, data, true );
                    reset();
                },
                function() {
                    Dialog.closeDialog( false );
                    Dialog.showAlert( Localization.getText( "resetTitle" ),
                                      Localization.getText( "resetRequired" ), null,
                                      "350px" );
                }, "350px" );
        } else {
            // Save the authentication information if an online authentication was performed
            if ( ( Util.isOnline( true ) && data.username && data.password ) ||
                 ( data.username.toLowerCase() === TRAINING_USERNAME ) ) {
                data.webId = LOGON_WEBID;
                saveJSON( JSON_DATATYPE_LOGON, data, true );
            }

            // Change the clocking status
            currentClockingStatus = getCurrentClockingStatus( null );
            if ( !currentClockingStatus || currentClockingStatus == "technicianStatusLoggedOut" ) {
                changeClockingStatus( "technicianStatusLoggedIn", null, null );
            }

            startDailyUpdateFn = function() {
                // Start the daily JSON feed update
                if ( isDailyUpdateNeeded() && !automaticLogon ) {
                    // Set pmSchedules update supported to true before starting daily update
                    Config.setUpdateSupportedForJSONFeed( "pmSchedules", true );
                    Dialog.showPleaseWait( Localization.getText( "updateApplicationTitle" ),
                                           Localization.getText( "updatingApplicationData" ), null );
                    loadJSONDataIntoDatabase( JSON_FEED_UPDATE_TYPE.DAILY );
                } else {
                    // Logon complete, navigate to the home page
                    if ( UIFrame ) {
                        // If automatically logging on, navigate to last current page
                        if ( automaticLogon ) {
                            currentPage = window.localStorage.getItem( UIFrame.LS_CURRENT_PAGE );
                            if ( !currentPage ) {
                                currentPage = "home.html";
                            }
                            debug && console.log( "JSONData.loginSuccess: Automatic logon complete. Navigating to " +
                                                  currentPage );
                            UIFrame.navigateToPage( currentPage, true, null );
                        } else {
                            UIFrame.navigateToPage( pageToLoadAfterDailyUpdate, true, null );
                        }
                    }
                }
            };

            // Prompt technician to go to close out previous days if there are any
            // unclosed time entries
            if ( closeOutDayRequired ) {
                Dialog.showConfirmYesNo( Localization.getText( "login" ),
                                         Localization.getText( "closeOutDayPromptAfterLogin" ),
                    function() {
                        // If closing out days are required, go to timesheet page
                        Dialog.closeDialog( false );
                        UIFrame.navigateToPage( "timesheet.html", false, null );
                    },
                    function() {
                        Dialog.closeDialog( false );
                        pageToLoadAfterDailyUpdate = "home.html";
                        startDailyUpdateFn();
                    }, "400px"
                );
            } else {
                pageToLoadAfterDailyUpdate = "home.html";
                startDailyUpdateFn();
            }
        }
    }

    /**
     * Handle a logon failure
     */
    function logonFailed() {
        debug && console.log( "JSONData.logonSuccessful: Logon failed" );
        Dialog.closeDialog();
        Dialog.showAlert( Localization.getText( "loginFailedTitle" ), Localization.getText( "loginFailedPrompt" ), null, "300px" );
    }

    /**
     * Logoff the mobile app
     * @param idleTimeoutLogoff - Is logoff being done due to an idle timeout, defaults to false
     */
    function logoff( idleTimeoutLogoff ) {
        if ( _.isNull( idleTimeoutLogoff ) || _.isUndefined( idleTimeoutLogoff ) ) {
            idleTimeoutLogoff = false;
        }
        // SFAM-206: Skip idle timeout logoff if app was recently resumed
        if ( idleTimeoutLogoff && window.localStorage.getItem( LS_APP_RESUMED ) ) {
            window.localStorage.removeItem( LS_APP_RESUMED );
            debug && console.log( "JSONData.logoff: Idle timeout logoff canceled because app was resumed" );
        }

        var completeLogoffFn = function() {
            debug && console.log( "JSONData.logoff: Logging off the mobile app" );
            changeClockingStatus( "technicianStatusLoggedOut", null, null );

            // Logoff complete, navigate to the login page
            if ( UIFrame ) {
                UIFrame.navigateToPage( "login.html" );
            }
        };

        if ( idleTimeoutLogoff ) {
            window.localStorage.setItem( LS_IDLE_TIME_LOGOFF_OCCURRED, "true" );
            completeLogoffFn();
        } else {
            Dialog.showConfirmYesNo( Localization.getText( "logoffConfirmTitle" ),
                                     Localization.getText( "logoffConfirmPrompt" ),
            function() {
                Dialog.closeDialog( false );
                window.localStorage.removeItem( LS_IDLE_TIME_LOGOFF_OCCURRED );
                debug && console.log( "JSONData.logoff: Prompting technician to close out the day" );
                if ( isCloseOutDayRequired( false ) ) {
                    window.localStorage.setItem( LS_LOGOFF_IN_PROGRESS, true );
                    window.localStorage.setItem( LS_CLOSE_OUT_DATE, new Date().setHours( 0, 0, 0, 0 ) );
                    closeOutDayAttempt();
                } else {
                    completeLogoffFn();
                }
            }, null, '400px' );
            UIFrame.resetTasksMenuSelection();
        }
    }

    /**
     * Display the error information from a failed post to the middle tier
     * @param jsonErrorData - JSON response data containing the error response from the middle tier
     * @param jqXHR
     * @param textStatus
     * @param errorThrown
     * @param errorCallbackFn - Function called after error information is processed by this method
     */
    function displayPostErrorInfo( jsonErrorData, jqXHR, textStatus, errorThrown, errorCallbackFn ) {
        var errorCode = null;
        var errorDataFromMiddleTier = null;
        var errorMessage = Localization.getText( "postDataUnknownErrorMessage" );
        var jsonErrorMsg;
        var lastPostError = {};
        if ( textStatus && textStatus === "timeout" ) {
            errorMessage = Localization.getText( "postDataTimeoutErrorMessage" );
        } else if ( jqXHR && jqXHR.status && errorThrown ) {
            // Handle HTTP errors here by reporting the status code and the error thrown
            errorMessage = jqXHR.status + " - " + errorThrown;
        } else if ( jsonErrorData ) {
            // DIS JIRA issue 884: errors array now comes back as responseCodes array
            if ( jsonErrorData.responseCodes && _.isArray( jsonErrorData.responseCodes ) ) {
                errorDataFromMiddleTier = jsonErrorData.responseCodes;
            } else if ( jsonErrorData.errors && _.isArray( jsonErrorData.errors ) ) {
                errorDataFromMiddleTier = jsonErrorData.errors;
            } else {
                errorDataFromMiddleTier = [];
            }
            // If JSON error data is provided, get the error code / message from it
            if ( errorDataFromMiddleTier.length > 0 ) {
                // Build error message using code and message inside JSON error data
                errorCode = errorDataFromMiddleTier[0].code;
                jsonErrorMsg = errorDataFromMiddleTier[0].message;
                errorMessage = errorCode + " - " + jsonErrorMsg;
            }
        }

        // Save last post error to local storage
        lastPostError.dateTime = Util.getISOCurrentTime();
        if ( errorMessage ) {
            lastPostError.errorMessage = errorMessage;
        }
        if ( errorDataFromMiddleTier ) {
            lastPostError.errorDataFromMiddleTier = errorDataFromMiddleTier;
        }
        window.localStorage.setItem( LS_LAST_POST_ERROR, JSON.stringify( lastPostError ) );
        console.error( "JSONData.displayPostErrorInfo: Last post error = " + JSON.stringify( lastPostError ) );

        // Call the error call back, passing it the error code
        if ( errorCallbackFn && _.isFunction( errorCallbackFn ) ) {
            errorCallbackFn( errorCode );
        }
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
        var config = Config.getConfig();
        var postData = JSON.parse( data );
        var postDebugInfo = Util.clone( POST_DEBUG_INFO );
        var postUrl;

        if ( !url || !data || !timeout ) {
            throw "JSONData.postDataToMiddleTier: One or more required parameters (url, data, timeout) are missing or invalid";
        }

        // Construct the post URL
        postUrl = Config.getConfig().middleTierBaseUrl + Config.getConfig().middleTierVersion + "/" + url;

        // Adding post debug information to the data
        postDebugInfo.mobileAppVersion = config.version;
        postDebugInfo.postDateTime = Util.getISOCurrentTime();
        postDebugInfo.technicianName = getTechnicianName();
        postDebugInfo.technicianUserId = getTechnicianUserId();
        if ( _.isArray( postData ) ) {
            postData[0][POST_DEBUG_PROPERTY_NAME] = postDebugInfo;
        } else {
            postData[POST_DEBUG_PROPERTY_NAME] = postDebugInfo;
        }
        data = JSON.stringify( postData );

        debug && console.log( "JSONData.postDataToMiddleTier: Posting the following data to " + postUrl + ": " + data );

        // If app is in training mode, simulate a post to the middle tier by
        // sending the post data back to the caller after waiting 5 seconds
        if ( Config.isTrainingMode() ) {
            debug && console.log( "JSONData.postDataToMiddleTier: App running in training mode. Simulating post to middle tier." );
            _.delay( function() {
                var responseData = JSON.parse( data );
                if ( !_.isUndefined( responseData.workOrder ) ) {
                    // Simulate change of work order number when posting a new work order
                    var newWorkOrderNumber = "";
                    if ( responseData.workOrder.documentNumber.length >= 9 ) {
                        if ( responseData.workOrder.documentNumber.charAt(0) === 'W' ) {
                            newWorkOrderNumber += "W";
                        } else {
                            newWorkOrderNumber += ( responseData.workOrder.documentNumber.substr( 0, 2 ) );
                        }
                        var trainingWONumber = parseInt( window.localStorage.getItem( LS_TRAINING_WORKORDER_NUMBER ), 10 ) + 1;
                        newWorkOrderNumber += trainingWONumber;
                        window.localStorage.setItem( LS_TRAINING_WORKORDER_NUMBER, trainingWONumber );
                        responseData.workOrder.documentNumber = newWorkOrderNumber;
                        responseData.workOrder.webId = Util.getUniqueId();
                    }
                    // Clear the new WO and post required flags
                    if ( !_.isUndefined( responseData.workOrder.newWorkOrder ) ) {
                        delete responseData.workOrder.newWorkOrder;
                    }
                    if ( !_.isUndefined( responseData.workOrder.postToMiddleTierRequired ) ) {
                        delete responseData.workOrder.postToMiddleTierRequired;
                    }
                    // Remove the deleted parts
                    var updatedWOLines = [];
                    _.each( responseData.workOrder.workOrderSegments[0].workOrderLines, function( lineInList ) {
                        if ( lineInList.type === WorkOrder.WORK_ORDER_LINE_PART_TYPE ) {
                            if ( _.isUndefined( lineInList.deleted ) || lineInList.deleted == false ) {
                                updatedWOLines.push( lineInList );
                            }
                        } else {
                            updatedWOLines.push( lineInList );
                        }
                    });
                    responseData.workOrder.workOrderSegments[0].workOrderLines = updatedWOLines;
                }
                // Handle unproductive clockings by moving clockings to the technicianClocking array
                if ( _.isArray( responseData ) ) {
                    responseData.technicianClocking = [];
                    responseData.total = responseData.length;
                    _.each( responseData, function( clockingInList ) {
                        responseData.technicianClocking.push( clockingInList );
                    });
                }
                // Handle clocking data array
                if ( !_.isUndefined( responseData.technicianClocking ) && _.isArray( responseData.technicianClocking ) ) {
                    _.each( responseData.technicianClocking, function( clockingInList ) {
                        if ( _.isNull( clockingInList.webId ) ) {
                            clockingInList.webId = Util.getUniqueId();
                        }
                    });
                }
                // Handle timecard
                if ( !_.isUndefined( responseData.timeCard )) {
                    responseData.timeCard.webId = Util.getUniqueId();
                    _.each( responseData.timeCard.timeCardLines, function( timeCardLine) {
                        deleteJSON( "technicianClocking", timeCardLine.webId );
                    });
                }
                successCallback( responseData );
            }, Config.getConfig().trainingModePostDelay * 1000 );
        } else {
            // Write data for most recent post to local storage
            window.localStorage.setItem( LS_LAST_POST_DATA, data );

            // Do the ajax post
            $.ajax( {
                url : postUrl,
                type : "POST",
                data : data,
                contentType : "application/json; charset=utf-8",
                dataType : 'json',
                timeout : timeout * 1000,
                // Post successful
                success : function( updatedData ) {
                    debug && console.log( "JSONData.postDataToMiddleTier: ajax request to " + postUrl + " successful" );
                    // DIS JIRA issue 884: success property is now processed
                    if ( updatedData.processed || updatedData.success ) {
                        debug && console.log( "JSONData.postDataToMiddleTier: Returned JSON data indicates successful processing" );
                        if ( successCallback && _.isFunction( successCallback ) ) {
                            successCallback( updatedData );
                        }
                    } else {
                        displayPostErrorInfo( updatedData, null, null, null, errorCallback );
                    }
                },
                // Post failed
                error : function( jqXHR, textStatus, errorThrown ) {
                    displayPostErrorInfo( null, jqXHR, textStatus, errorThrown, errorCallback );
                }
            });
        }
    }

    /**
     * Handle a clocking post error.  Currently, the only error it concerns
     * itself with is the invalid clocking interval error.  If this error occurs,
     * all clockings in the specified array are marked as no longer needing a post to the
     * middle tier because there is nothing the technician can do to recover from this error.
     * @param clockingsPosted
     * @param errorCode
     */
    function handleClockingPostError( clockingsPosted, errorCode ) {
        if ( clockingsPosted && _.isArray( clockingsPosted ) && clockingsPosted.length > 0 &&
             errorCode && errorCode == INVALID_CLOCKING_INTERVAL_ERRORCODE ) {
            console.warn( "JSONData.handleClockingPostError: Invalid clocking interval error occursed. " +
                          "Marking clockings as not needing a post to the middle tier.");
            _.each( clockingsPosted, function( clockingInList ) {
                if ( clockingInList.postToMiddleTierRequired ) {
                    delete clockingInList.postToMiddleTierRequired;
                }
                saveJSON( "technicianClocking", clockingInList, true );
            });
        } else {
            debug && console.log( "JSONData.handleClockingPostError: Error requires no change to posted clockings" );
        }
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
        if ( Util.isOnline( false ) ) {

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
                Dialog.closeDialog();
                Dialog.showPleaseWait( Localization.getText( "postingTechnicianClockingsTitle" ),
                                       Localization.getText( "postingTechnicianClockingsText" ), "400px" );
            }
            debug && console.log( "JSONData.postTechnicianClockings: App is online. Post of " +
                                  technicianClockings.length + " object(s) to middle tier will be attempted. Post attempt will timeout in " +
                                  Config.getConfig().technicianClockingUpdateTimeout + " seconds." );

            postDataToMiddleTier( Config.getConfig().technicianClockingUpdateUrl, technicianClockingData,
                                  Config.getConfig().technicianClockingUpdateTimeout,
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
                        Dialog.closeDialog();
                    }

                    // Reload the current page
                    if ( reloadPageAfterPost || UIFrame.getCurrentPage().id === "timeSheetPage" ) {
                        UIFrame.reloadCurrentPage();
                    }

                    // Call the success callback if it's defined
                    if ( successCallback && _.isFunction( successCallback ) ) {
                        successCallback( updatedTechnicianClockings );
                    }
                },
                // Error callback
                function( errorCode ) {
                    handleClockingPostError( technicianClockings, errorCode );
                    if ( displayProgressDialog ) {
                        Dialog.closeDialog( false );
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
     * Post a time card to the middle tier
     * @param timeCard - Time card to post to the middle tier
     * @param successCallback - This is called when the post is successful.
     *                          The updated work order from the middle tier is passed
     *                          as the only parameter to this callback.
     * @param errorCallback - This is called when the post fails
     */
    function postTimeCard( timeCard, successCallback, errorCallback ) {
        var config = Config.getConfig();
        var timeCardData;
        if ( !timeCard ) {
            throw "JSONData.postTimeCard: Required parameter timeCard is undefined or null";
        }
        // Must be online to post a work order
        if ( Util.isOnline( false ) ) {
            timeCardData = JSON.stringify( timeCard );

            //noinspection JSUnresolvedVariable
            postDataToMiddleTier( config.timeCardUpdateUrl, timeCardData, config.timeCardUpdateTimeout,
                // Success callback
                function( updatedTimeCard ) {
                    // If we posted a time card but the webId comes back as null or unchanged, the post did not work
                    if ( _.isNull( updatedTimeCard.timeCard.webId ) || updatedTimeCard.timeCard.webId == timeCard.timeCard.webId) {
                        errorCallback();
                    } else {
                        debug && console.log( "CloseOutDay.postTimeCard: Post of time card " +
                                               updatedTimeCard.timeCard.webId + " successful.");
                        successCallback();
                    }
                },
                errorCallback
            );
        } else {
            debug && console.log( "JSONData.postTimeCard: Post skipped because app is offline" );
        }
    }

    /**
     * Is locally saved data being posted to the middle tier right now?
     * @returns true or false
     */
    function isPostLocallySavedDataRunning() {
        var running = ( window.localStorage.getItem( LS_POST_SAVED_TECHNICIANCLOCKING_RUNNING ) ||
                        window.localStorage.getItem( LS_POST_SAVE_WORKORDERS_RUNNING ));
        debug && console.log( "JSONData.isPostLocallySavedDataRunning: Running = " + running );
        return running;
    }

    /**
     * Post all locally saved data to the middle tier.  This includes work orders
     * and non-productive technician clockings
     * @param skipWait - Skip the 3 second wait before starting post. 3 second
     *                   wait is required when switching between offline and online because
     *                   on tablets with wi-fi and 4G, the online event that calls this method
     *                   happens twice.
     * @param completeCallbackFn - Optional, complete callback function. If specified, this callback
     *                             is called when the posts are complete
     */
    function postLocallySavedData( skipWait, completeCallbackFn ) {
        if ( !isPeriodicJSONFeedUpdateRunning() ) {
            if ( _.isUndefined( skipWait ) ) {
                skipWait = false;
            }
            // Use a local storage item to prevent this from running multiple times at the same time
            if ( Util.isOnline() && !window.localStorage.getItem( LS_POST_SAVE_WORKORDERS_RUNNING ) ) {
                window.localStorage.setItem( LS_POST_SAVE_WORKORDERS_RUNNING, true );

                // The delay below prevents the duplicate online event from starting this logic twice in quick succession
                var waitTime = 0;
                if ( !skipWait ) {
                    debug && console.log( "ManageWorkOrderReview.postLocallySavedData: Waiting 3 seconds before starting" );
                    waitTime = 3000;
                }
                _.delay( function() {
                    var workOrders = WorkOrder.getWorkOrdersRequiringPostToMiddleTier();
                    if ( workOrders.length > 0 ) {
                        // Post the locally saved work orders
                        WorkOrder.postWorkOrders( workOrders, function() {
                            // When post is complete, clear running flag
                            window.localStorage.removeItem( LS_POST_SAVE_WORKORDERS_RUNNING );
                            postSavedTechnicianClockings( function() {
                                if ( _.isFunction( completeCallbackFn ) ) {
                                    debug && console.log( "JSONData.postLocallySavedData: postSavedTechnicianClockings complete. Calling completeCallbackFn." );
                                    completeCallbackFn();
                                } else {
                                    debug && console.log( "JSONData.postLocallySavedData: postSavedTechnicianClockings complete. Reloading current page." );
                                    UIFrame.reloadCurrentPage();
                                }
                            });
                        });
                    } else {
                        debug && console.log( "JSONData.postLocallySavedData: No work orders need posting to the middle tier" );
                        window.localStorage.removeItem( LS_POST_SAVE_WORKORDERS_RUNNING );
                        postSavedTechnicianClockings( function() {
                            if ( _.isFunction( completeCallbackFn ) ) {
                                debug && console.log( "JSONData.postLocallySavedData: postSavedTechnicianClockings complete. Calling completeCallbackFn." );
                                completeCallbackFn();
                            } else {
                                debug && console.log( "JSONData.postLocallySavedData: postSavedTechnicianClockings complete." );
                            }
                        });
                    }
                }, waitTime );
            } else {
                debug && console.log( "JSONData.postLocallySavedData: Posting locally saved data skipped because it is already running or app is offline" );
            }
        } else {
            debug && console.log( "JSONData.postLocallySavedData: Posting locally saved data skipped periodic JSON feed update is running" );
        }
    }

    /**
     * Get the list of locally saved technician clockings that require a post to the middle tier
     * @param includeProductiveClockings - Boolean
     * @returns Array of technician clockings that need to be posted
     */
    function getTechnicianClockingsRequiringPostToMiddleTier( includeProductiveClockings ) {
        var technicianClockings = _.filter( getObjectsByDataType( "technicianClocking" ), function( clockingInList ) {
            if ( includeProductiveClockings ) {
                return ( clockingInList.postToMiddleTierRequired &&
                         clockingInList.technicianStatus != TECHNICIAN_STATUS_LOGGED_IN_OUT &&
                         clockingInList.timeEnd != null );

            } else {
                return ( clockingInList.postToMiddleTierRequired &&
                         clockingInList.technicianStatus === TECHNICIAN_STATUS_NON_PRODUCTIVE &&
                         clockingInList.timeEnd != null );
            }
        });
        debug && console.log( "JSONData.getTechnicianClockingsRequiringPostToMiddleTier: " + technicianClockings.length +
                              " technician clockings need to be posted to the middle tier" );
        return technicianClockings;
    }

    /**
     * Post all locally saved work non-productive technician clockings to the middle tier
     * @param completeCallbackFn - Callback function called when post completes.
     */
    function postSavedTechnicianClockings( completeCallbackFn ) {
        var technicianClockings;
        if ( !_.isFunction( completeCallbackFn ) ) {
            throw "JSONData.postSavedTechnicianClockings: Required parameter completeCallbackFn is not a function";
        }

        // Use a local storage item to prevent this from running multiple times at the same time
        if ( Util.isOnline( false ) && !window.localStorage.getItem( LS_POST_SAVED_TECHNICIANCLOCKING_RUNNING ) ) {
            window.localStorage.setItem( LS_POST_SAVED_TECHNICIANCLOCKING_RUNNING, true );
            technicianClockings = getTechnicianClockingsRequiringPostToMiddleTier( true );
            if ( technicianClockings.length > 0 ) {
                // Post the locally saved technician clockings
                postTechnicianClockings( technicianClockings, true, false,
                    function() {
                        debug && console.log( "JSONData.postSavedTechnicianClockings: Post succeeded" );
                        // When post is complete, clear running flag and call the complete callback
                        window.localStorage.removeItem( LS_POST_SAVED_TECHNICIANCLOCKING_RUNNING );
                        completeCallbackFn();
                    },
                    function() {
                        debug && console.log( "JSONData.postSavedTechnicianClockings: Post failed" );
                        // When post is complete, clear running flag and call the complete callback
                        window.localStorage.removeItem( LS_POST_SAVED_TECHNICIANCLOCKING_RUNNING );
                        completeCallbackFn();
                    }
                );
            } else {
                // No clockings require a post. Remove running flag and call complete callback immediately
                debug && console.log( "JSONData.postSavedTechnicianClockings: No technician clockings need posting to the middle tier" );
                window.localStorage.removeItem( LS_POST_SAVED_TECHNICIANCLOCKING_RUNNING );
                completeCallbackFn();
            }
        } else {
            debug && console.log( "JSONData.postSavedTechnicianClockings: Posting locally saved technician clockings skipped because it is already running or app is offline" );
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
     * @param idPropertyName - ID property name, defaults to "webId"
     * @returns Object with specified data type and ID or null if not found
     */
    function getObjectById( dataType, id, idPropertyName ) {
        var jsonObj = null;
        var objects;

        if ( !dataType ) {
            throw "JSONData.getObjectById: Required parameter dataType is undefined";
        }
        if ( !idPropertyName ) {
            idPropertyName = "webId";
        }

        // Passing a null ID returns null
        if ( _.isNull( id ) ) {
            debug && console.log( "JSONData.getObjectById: Returning null when id parameter is null" );
            return null;
        }
        debug && console.log( "JSONData.getObjectById: Getting " + dataType + " JSON object whose " +
                              idPropertyName + " = " + id );

        // Get all of the objects of the specified type and find the one whose webId matches
        // the id passed in.
        objects = getObjectsByDataType( dataType );
        if ( objects.length > 0 ) {
            jsonObj = _.find( objects, function( objInList ) {
                return objInList[idPropertyName] == id;
            });
        }
        // Not finding the object is an error
        if ( !jsonObj ) {
            console.warn( "JSONData.getObjectById: " + dataType + " JSON object whose " + idPropertyName + " = " + id + " not found" );
            jsonObj = null;
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
            if ( _.isString( id ) ) {
                id = parseInt( id, 10 );
            }
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
        if ( !jsonObj ) {
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
     * Get filtered object list.
     * @param dataType - Datatype to filter
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
     * @param dataType - Datatype to filter
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
     * @returns Boolean - true if it is, false otherwise
     */
    function isEquipmentUnderWarranty( equipment ) {
        var underWarranty = false;
        if ( !equipment ) {
            throw "JSONData.isEquipmentUnderWarranty: Required parameter equipment is undefined";
        }
        if ( equipment.warrantyExpirationDate ) {
            var warrantyEndDate = new Date( Util.convertDateToISODateTimeStamp( equipment.warrantyExpirationDate ) );
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
     * @returns String containing main communication details
     */
    function getMainCommunicationDetails( commDetails ) {
        if ( !commDetails || commDetails.length == 0 ) {
            throw "JSONData.getMainCommunicationDetails: Required parameter commDetails is undefined or empty";
        }

        // Initialize to null in case a valid value cannot be found for this address
        var mainCommunicationDetail = _.find( commDetails, function ( currentCommDetails ) {
            return currentCommDetails.main && currentCommDetails.type == COMM_DETAIL_TYPE_PHONE;
        });

        return ( mainCommunicationDetail == undefined ) ? "" : mainCommunicationDetail;
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
     * Get the contact list for the specified customer
     * @param customer - Customer object
     * @returns Array containing the contact list, empty array if customer has no valid contacts.
     *          Each entry in the array will be an objet with two properties: name and number
     */
    function getContactListForCustomer( customer ) {
        if ( _.isNull( customer ) || _.isUndefined( customer ) ) {
            throw "JSONData.getContactListForCustomer: Required parameter customer is null or undefined";
        }
        var contactList = [];

        if ( customer.contacts && customer.contacts.length > 0 ) {
            _.each( customer.contacts, function( contactInList ) {
                var contact = {};
                var phoneCommDetail = null;
                contact.name = "";
                contact.number = "";
                // Get the contact's name
                if ( contactInList.firstName ) {
                    contact.name += contactInList.firstName;
                }
                if ( contactInList.lastName ) {
                    if ( contact.name ) {
                        contact.name += " ";
                    }
                    contact.name += contactInList.lastName;
                }
                if ( contactInList.address &&
                     contactInList.address.communicationDetails && contactInList.address.communicationDetails.length > 0 ) {
                    phoneCommDetail = _.find( contactInList.address.communicationDetails, function( commDetailInList ) {
                        return commDetailInList.type == COMM_DETAIL_TYPE_PHONE;
                    });
                    if ( phoneCommDetail ) {
                        contact.number = phoneCommDetail.information;
                        if ( phoneCommDetail.extension ) {
                            contact.number += ( " " + Localization.getText( "phoneExtension" ) +
                                                " " + phoneCommDetail.extension );
                        }
                    }
                }

                // If the contact's name and address are now set, add the
                // contact to the list to be returned
                if ( contact.name && contact.number ) {
                    debug && console.log( "JSONData.getContactListForCustomer: Adding " +
                                          JSON.stringify( contact ) + " to contact list for customer " +
                                          customer.name );
                    contactList.push( contact );
                }
            });
        }
        return contactList;
    }

    /**
     * Get the contact email list for the specified customer by returning customers with the WorkOrderPrimary and
     *  WorkOrderSecondary Roles
     * @param customer - Customer object
     * @returns Array containing the email contact list, empty array if customer has no valid contacts.
     *          Each entry in the array will be an object with two properties: name and email
     */
    function getOrderEmailListForCustomer( customer ) {
        if ( _.isNull( customer ) || _.isUndefined( customer ) ) {
            throw "JSONData.getOrderEmailListForCustomer: Required parameter customer is null or undefined";
        }
        var contactList = [];

        var primaryRoleId = _.find( JSONData.getObjectsByDataType( "roles" ), function( role ) {
            return ( role.name == WORK_ORDER_PRIMARY_ROLE_NAME );
        }).webId;

        var secondaryRoleId = _.find( JSONData.getObjectsByDataType( "roles" ), function( role ) {
            return ( role.name == WORK_ORDER_SECONDARY_ROLE_NAME );
        }).webId;

        var contact;
        var emailCommDetail;
        var primaryOrSecondaryContact;

        if ( customer.contacts && customer.contacts.length > 0 ) {
            _.each( customer.contacts, function( contactInList ) {
                contact = {};
                contact.name = "";
                contact.email = "";
                contact.roles = [];
                emailCommDetail = null;
                primaryOrSecondaryContact = false;

                // Check the contact roles for Primary or Secondary Roles
                _.each( contactInList.roles, function( role ) {
                    if( role.webId == primaryRoleId || role.webId == secondaryRoleId ) {
                          primaryOrSecondaryContact = true;
                    }

                    contact.roles.push( role.webId );
                });

                if( primaryOrSecondaryContact ) {
                    if ( contactInList.address ) {
                        contact.name = contactInList.address.name;

                         if( contactInList.address.communicationDetails && contactInList.address.communicationDetails.length > 0 ) {
                            emailCommDetail = _.find( contactInList.address.communicationDetails, function( commDetailInList ) {
                                return commDetailInList.type == COMM_DETAIL_TYPE_EMAIL;
                            });

                            if ( emailCommDetail ) {
                                contact.email = emailCommDetail.information;
                            }
                        }
                    }

                    // If the contact's name and email are now set, add the contact to the list to be returned
                    if ( contact.name && contact.email ) {
                        debug && console.log( "JSONData.getContactListForCustomer: Adding " +
                            JSON.stringify( contact ) + " to contact list for customer " + customer.name );
                        contactList.push( contact );
                    }
                }
            });
        }

        return contactList;
    }

    /**
     * Get the PM cutoff date
     */
    function getPMCutoffDate() {
        var now = new Date();
        return new Date( now.getFullYear(), now.getMonth() + 1, 0 ).getTime();
    }

    /**
     * Get the number of PMs for the specified customer ID
     * @param pmArray - Array of PMs, if null or undefined, getObjectsByDataType is used to get PMs
     * @param customerId
     * @param usePMCutoffDate - Use PM cutoff date when filtering PMs, defaults to false
     * @returns Number of PMs for the customer
     */
    function getPMCountForCustomer( pmArray, customerId, usePMCutoffDate ) {
        if ( !pmArray || pmArray.length === 0 ) {
            pmArray = getObjectsByDataType( "pmSchedules" );
        }
        if ( !customerId ) {
            throw "JSONData.getPMCountForCustomer: Required parameter customerId is null or undefined";
        }
        var pmCount = 0;
        if ( usePMCutoffDate ) {
            pmCount = _.filter( pmArray, function ( pmScheduleInList ) {
                return ( isPMBeforeCutoffDate( pmScheduleInList ) ) && pmScheduleInList.customerId == customerId;
            }).length;
        } else {
            pmCount = _.filter( pmArray, function ( pmScheduleInList ) {
                return pmScheduleInList.customerId == customerId;
            }).length;
        }
        debug && console.log( "JSONData.getPMCountForCustomer: PM count for customer ID " + customerId + " = " + pmCount );
        return pmCount;
    }

    /**
     * Get the number of PMs for the specified equipment ID
     * @param pmArray - Array of PMs, if null or undefined, getObjectsByDataType is used to get PMs
     * @param equipmentId
     * @param usePMCutoffDate - Use PM cutoff date when filtering PMs, defaults to false
     * @returns Number of PMs for the equipment
     */
    function getPMCountForEquipment( pmArray, equipmentId, usePMCutoffDate ) {
        if ( !pmArray || pmArray.length === 0 ) {
            pmArray = getObjectsByDataType( "pmSchedules" );
        }
        if ( !equipmentId ) {
            throw "JSONData.getPMCountForEquipment: Required parameter equipmentId is null or undefined";
        }
        var pmCount = 0;
        if ( usePMCutoffDate ) {
            pmCount = _.filter( pmArray, function ( pmScheduleInList ) {
                return ( JSONData.isPMBeforeCutoffDate( pmScheduleInList ) ) && pmScheduleInList.equipmentId == equipmentId;
            }).length;
        } else {
            pmCount = _.filter( pmArray, function ( pmScheduleInList ) {
                return pmScheduleInList.equipmentId == equipmentId;
            }).length;
        }
        debug && console.log( "JSONData.getPMCountForEquipment: PM count for equipment ID " + equipmentId + " = " + pmCount );
        return pmCount;
    }

    /**
     * Does the specified schedule come before the PM cutoff date?
     * @param pmSchedule
     * @return {boolean}
     */
    function isPMBeforeCutoffDate( pmSchedule ) {
        var pmCutoffDate;
        var pmDateToCheck;
        if ( !pmSchedule ) {
            throw "JSONData.isPMBeforeCutoffDate: Required parameter pmSchedule is null or undefined";
        }
        pmCutoffDate = getPMCutoffDate();
        // SFAM-257: Use PM schedule override date if present. Otherwise, use PM schedule date.
        if ( pmSchedule.dateOverride ) {
            pmDateToCheck = pmSchedule.dateOverride;
        } else {
            pmDateToCheck = pmSchedule.dateSchedule;
        }
        return ( new Date( pmDateToCheck ).getTime() <= pmCutoffDate );
    }

    /**
     * Get the primary work order contact email for a customer
     * @param customer
     * @returns contact array where role is Work Order Primary for the customer parameter
     */
    function getWorkOrderPrimaryEmailForCustomer( customer ) {
        if ( _.isNull( customer ) || _.isUndefined( customer ) ) {
                    throw "JSONData.getOrderEmailListForCustomer: Required parameter customer is null or undefined";
        } else if( customer.contacts.length > 0 ) {
            debug && console.log( "JSONData.getCustomerWorkOrderPrimaryContact: Getting customer contact with Work Order Primary role" );

            var emailContacts = getOrderEmailListForCustomer( customer );
            var primaryRoleId = _.find( JSONData.getObjectsByDataType( "roles" ), function( role ) {
                return ( role.name == WORK_ORDER_PRIMARY_ROLE_NAME );
            }).webId;

            var contacts = _.filter( emailContacts, function( contact ) {
                // Return if the WorkOrderPrimary role is a role for this contacts
                return contact.roles.indexOf( primaryRoleId ) != -1;
            });

            return ( contacts && contacts.length > 0 ) ? contacts[0].email : null;
        }

        // If the customer has no contacts, return null
        return null;
    }

    /**
     * Get the secondary work order contact email for a customer
     * @param customer
     * @returns contact array where role is Work Order Secondary for the customer parameter
     */
    function getWorkOrderSecondaryEmailForCustomer( customer ) {
        if ( _.isNull( customer ) || _.isUndefined( customer ) ) {
                    throw "JSONData.getOrderEmailListForCustomer: Required parameter customer is null or undefined";
        } else if( customer.contacts.length > 0 ) {
            debug && console.log( "JSONData.getWorkOrderSecondaryEmailForCustomer: Getting customer contact with Work Order Secondary role" );

            var emailContacts = getOrderEmailListForCustomer( customer );
            var secondaryRoleId = _.find( JSONData.getObjectsByDataType( "roles" ), function( role ) {
                return ( role.name == WORK_ORDER_SECONDARY_ROLE_NAME );
            }).webId;

            var contacts = _.filter( emailContacts, function( contact ) {
                // Return if the WorkOrderSecondary role is a role for this contacts
                return contact.roles.indexOf( secondaryRoleId ) != -1;
            });

            return ( contacts && contacts.length > 0 ) ? contacts[0].email : null;
        }

        // If the customer has no contacts, return null
        return null;
    }

    /**
     * Store the work order ID associated with a clocking change.  This allows
     * Clocking.recordTime() to create a work order line for the clocking change when necessary
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
     * Handle a data missing error.  Currently, this will display an alert to the tech
     * and the mobile app will navigate to the home page
     * @param dataType
     * @param webId
     */
    function handleDataMissingError( dataType, webId ) {
        console.error( "JSONData.handleDataMissingError: " + dataType + "." + webId + " is missing" );
        var errorMsg = Localization.getText( "dataMissingError" ).replace( "dataType", dataType ).replace( "webId", webId );
        Dialog.closeDialog( false );
        alert( errorMsg );
        UIFrame.navigateToPage( "home.html", false, null );
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
            inventoryLocation = getInventoryLocationStringFromObj( inventoryObj );
        }
        return inventoryLocation;
    }

    /**
     * Get the inventory location string from the specified inventory object.
     * The stock area for the inventory object will be used as part of the inventory
     * location string if it's available.
     * @param inventoryObj
     */
    function getInventoryLocationStringFromObj( inventoryObj ) {
        var inventoryLocation = Localization.getText( "partsRequest" );
        if ( inventoryObj ) {
            var stockArea = getObjectById( "stockAreas", inventoryObj.stockAreaId );
            if ( stockArea && stockArea.name != inventoryObj.binName ) {
                inventoryLocation = stockArea.name + " - " + inventoryObj.binName;
            } else {
                inventoryLocation = inventoryObj.binName;
            }
        }
        return inventoryLocation;
    }

    /**
     * Return an array containing all of the nonproductive clocking statuses
     */
    function getNonProductiveClockingStatuses() {
        var nonProductiveClockingStatuses = [];
        _.each( VALID_CLOCKING_STATUSES, function( statusObj ){
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
                        closeOpenTimeEntry( null );
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
            case "technicianStatusServiceSupervision":
            case "technicianStatusDPTraining" :
            case "technicianStatusLunch" :
            case "technicianStatusNoPay" :
            case "technicianStatusPaperwork" :
            case "technicianStatusPartsStaff" :
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
            case "technicianStatusProductiveOrderApproval" :
                // Switching from productive to productive means that the technician
                // is opening a different work order.  Display the start time dialog.
                if ( newClockingStatus == "technicianStatusProductive" ) {
                    UIFrame.displayStartTimeDialog( newClockingStatus, changeClockingCompleteCallback,
                                                    changeClockingStatusCompleteCallbackArgs );
                } else if ( newClockingStatus != "technicianStatusLoggedOut" ) {
                    var currentWorkOrder = WorkOrder.getCurrentWorkOrder();
                    if ( currentStatus === "technicianStatusProductive" ) {
                        var promptText = Localization.getText( "partsRunPrompt" ).replace( "workOrder",
                                                                                           currentWorkOrder.documentNumber );
                        Dialog.showConfirmYesNo( Localization.getText( "partsRunTitle"), promptText,
                            // Tapping yes in response to the parts run prompt changes the technician
                            // status to parts run
                            function() {
                                Dialog.closeDialog();
                                debug && console.log( "JSONData.changeClockingStatus: Changing technician status to parts run" );
                                setWorkOrderIdForClockingChange( currentWorkOrder.webId );
                                JSONData.saveClockingStatus( "technicianStatusPartsRun", Util.getISOCurrentTime() );
                                if ( UIFrame.getCurrentPageId() == "manageWorkOrderRepairDetailsPage" && ManageWorkOrderRepairDetails ) {
                                    ManageWorkOrderRepairDetails.populateLaborHoursList();
                                }
                            },
                            // Tapping no in response to parts run prompt displays the terminate clocking prompt
                            function() {
                                Dialog.closeDialog();
                                UIFrame.displayTerminateClockingDialog( "terminateClockingTitle", "terminateClockingPrompt" );
                            }, "400px"
                        );
                    } else {
                        // SFAM-197: If current status is POA, do not prompt tech for parts run
                        UIFrame.displayTerminateClockingDialog( "terminateClockingTitle", "terminateClockingPrompt" );
                    }
                }
                break;

            case "technicianStatusTraveling" :
            case "technicianStatusPartsRun" :
                if ( newClockingStatus === "technicianStatusLoggedIn" ) {
                    UIFrame.displayTerminateClockingDialog( "terminateTravelingTitle", "terminateTravelingPrompt" );
                } else if ( newClockingStatus != "technicianStatusLoggedIn" &&
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
                        setWorkOrderIdForClockingChange( WorkOrder.getCurrentWorkOrderId() );
                        UIFrame.displayTechnicianArrivedDialog();
                    }
                }
                break;

            case "technicianStatusViewOnly" :
                break;

            case "technicianStatusLoggedOut" :
                Clocking.recordTime( "technicianStatusLoggedIn", Util.getISOCurrentTime() );
                break;

            default :
                console.error( "JSONData.changeClockingStatus: default case hit" );
                break;
        }
    }

    /**
     * Save the clocking status.  This can be called by the clocking pop-up
     * dialogs to save a new clocking status.
     *
     * IMPORTANT NOTE:
     * If the navigateToPage below is executed, control is not returned
     * to the method that called saveClockingStatus
     *
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
        Clocking.recordTime( newClockingStatus, startDateTimeStamp );

        // This is block is used to support a logoff / close out day attempt.
        // If the navigateToPage below is executed, control is not returned
        // to the method that called saveClockingStatus
        if ( window.localStorage.getItem( LS_LOGOFF_IN_PROGRESS ) ||
             window.localStorage.getItem( LS_CLOSE_OUT_DAY_ATTEMPT )) {
            // Confirm that the TechnicianClocking entries are valid against the work orders that may have been updated in this post
            if ( validateClockingForCloseOutDay() ) {
                debug && console.log( "JSONData.saveClockingStatus: Navigating to the close out day page" );
                UIFrame.navigateToPage( "closeoutday.html", false, null );
            } else {
                if( window.localStorage.getItem( LS_LOGOFF_IN_PROGRESS )) {
                    window.localStorage.removeItem( LS_LOGOFF_IN_PROGRESS );
                }
                if( window.localStorage.getItem( LS_CLOSE_OUT_DAY_ATTEMPT )) {
                    window.localStorage.removeItem( LS_CLOSE_OUT_DAY_ATTEMPT );
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
     * Get the start time for a new technician clocking. If the current status
     * is "logged in", use the logged in clocking start time as the new clocking start time.
     * Otherwise, use the current time
     * @returns Start time for new clocking
     */
    function getNewClockingStartTime() {
        // Start time inside dialog depends upon current clocking status
        var currentClockingStatus = JSONData.getCurrentClockingStatus( null );
        var startTime = null;
        if ( currentClockingStatus === "technicianStatusLoggedIn" ) {
            startTime = JSONData.getCurrentClockingStartTime( null );
        } else {
            startTime = Util.getISOCurrentTime();
        }
        debug && console.log( "JSONData.getNewClockingStartTime: New clocking start time = " + startTime );
        return startTime;
    }

    /**
     * Get the technician's current clocking status
     * @param currentTimeEntry - time entry to use. If undefined, getOpenTimeEntry()
     *                           will be used to get the time entry
     * @returns String containing one of the clocking status keys inside VALID_CLOCKING_STATUSES
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
                         validStatus.unproductiveTimeReason == currentTimeEntry.unproductiveTimeReason &&
                         validStatus.laborCodeId == currentTimeEntry.laborCodeId );
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
     * Get the latest closed technician clocking whose status is either
     * productive or non-productive.  Logged in clockings are ignored.
     * @returns technicianClocking for the latest time entry or null If there are no
     *          technician clocking objects available
     */
    function getLatestTimeEntry() {
        var latestTimeEntry = null;
        var timeEntries = _.filter( getObjectsByDataType( "technicianClocking" ), function( entryInList ) {
            return ( ( entryInList.technicianStatus === TECHNICIAN_STATUS_PRODUCTIVE ||
                       entryInList.technicianStatus === TECHNICIAN_STATUS_NON_PRODUCTIVE ) &&
                     entryInList.timeEnd !== null && entryInList.timeEnd !== "" );
        });
        if ( timeEntries.length > 0 ) {
            timeEntries = _.sortBy( timeEntries, function( entryInList ) {
                return ( new Date( entryInList.timeEnd ).getTime() );
            });
            latestTimeEntry = _.last( timeEntries );
            debug && console.log( "JSONData.getLatestTimeEntry: Latest time entry = " + JSON.stringify( latestTimeEntry ) );
        }
        return latestTimeEntry;
    }

    /**
     * Helper function for posting a single non-productive technician clocking to the middle tier
     * @param technicianClocking - Clocking to post
     * @param displayProgressDlg
     * @param reloadPageAfterPost
     */
    function postNonProductiveTechnicianClockingToMiddleTier( technicianClocking, displayProgressDlg, reloadPageAfterPost ) {
        if ( _.isUndefined( displayProgressDlg ) ) {
            displayProgressDlg = false;
        }
        if ( _.isUndefined( reloadPageAfterPost ) ) {
            reloadPageAfterPost = false;
        }
        // If the new entry is non-productive, then post the new entry to the middle tier
        if ( technicianClocking.technicianStatus == TECHNICIAN_STATUS_NON_PRODUCTIVE &&
             !_.isNull( technicianClocking.timeEnd ) &&
             technicianClocking.postToMiddleTierRequired ) {
            var technicianClockings = [];
            technicianClockings.push( technicianClocking );
            postTechnicianClockings( technicianClockings, displayProgressDlg, reloadPageAfterPost, function() {
                debug && console.log( "JSONData.postNonProductiveTechnicianClockingToMiddleTier: Non-productive clocking successfully posted to middle tier" );
            }, null );
        } else {
            debug && console.log( "JSONData.postNonProductiveTechnicianClockingToMiddleTier: Post to middle tier skipped" );
        }
    }

    /**
     * Find previously started time entry and close it out by adding a stop time
     * @param stopTime - Stop time, if undefined, the current time will be used
     * @returns Boolean - true if a time entry was closed, false otherwise
     */
    function closeOpenTimeEntry( stopTime ) {
        var endTimeInMs;
        var openTimeEntry;
        var startTimeInMs;
        var timeEntryClosed = false;
        if ( !stopTime ) {
            stopTime = Util.getISOCurrentTime();
        }
        openTimeEntry = getOpenTimeEntry();

        if ( openTimeEntry ) {
            // Stop time must be greater than the end time
            startTimeInMs = new Date( openTimeEntry.timeStart ).getTime();
            endTimeInMs   = new Date( stopTime ).getTime();
            debug && console.log( "JSONData.closeOpenTimeEntry: Start time in ms: " + startTimeInMs +
                                  ", end time in ms: " + endTimeInMs );
            if ( startTimeInMs >= endTimeInMs ) {
                debug && console.log( "JSONData.closeOpenTimeEntry: Deleting open time entry " +
                                      JSON.stringify( openTimeEntry ) + " because end time is not later than start time" );
                deleteJSON( "technicianClocking", openTimeEntry.webId );
                return true;
            }

            var technicianClockings = [];
            // If the time entry crosses midnight, split the time entry into
            // two entries because Quipware cannot handle time entries that span multiple days.
            // The split entry will end at 11:59 PM and the open time entry's start will
            // be set to midnight.
            var splitTimeEntry = null;
            if ( Util.doStartAndEndTimesCrossMidnight( openTimeEntry.timeStart, stopTime ) ) {
                debug && console.log( "JSONData.closeOpenTimeEntry: Splitting time entry because it crosses midnight" );
                splitTimeEntry = Util.clone( openTimeEntry );
                splitTimeEntry.webId = Util.getUniqueId();
                splitTimeEntry.postToMiddleTierRequired = true;
                var splitTimeEnd = new Date( openTimeEntry.timeStart );
                splitTimeEnd.setHours( 23, 59, 0, 0 );
                splitTimeEntry.timeEnd = splitTimeEnd.toISOString();
                debug && console.log( "JSONData.closeOpenTimeEntry: Split time entry = " + JSON.stringify( splitTimeEntry ) );
                saveJSON( "technicianClocking", splitTimeEntry, true );
                technicianClockings.push( splitTimeEntry );
                var newTimeStart = new Date( stopTime );
                newTimeStart.setHours( 0, 0, 0, 0 );
                openTimeEntry.timeStart = newTimeStart.toISOString();
            }
            debug && console.log( "JSONData.closeOpenTimeEntry: Setting stop time to '" + stopTime +
                                  "' inside time entry '" + openTimeEntry.webId + '"' );
            openTimeEntry.timeEnd = stopTime;
            technicianClockings.push( openTimeEntry );
            saveJSON( "technicianClocking", openTimeEntry, true );
            timeEntryClosed = true;
        } else {
            console.warn( "JSONData.closeOpenTimeEntry: An open time entry does not exist" );
        }
        return timeEntryClosed;
    }

    /**
     * Validate the clocking entries before a close out day attempt can be completed.
     * @returns Boolean indicating validation success
     */
    function validateClockingForCloseOutDay() {
        debug && console.log( "validateClockingForCloseOutDay" );
        var closeOutDate = window.localStorage.getItem( LS_CLOSE_OUT_DATE );
        var segments;
        var validClocking = true;
        var workOrders = JSONData.getObjectsByDataType( "workOrders" );
        var timeCardRelatedWorkOrders = [];
        var timeCardClocking = _.filter( JSONData.getObjectsByDataType( "technicianClocking" ), function( clockingTime ) {
            return clockingTime.technicianStatus != 900 && new Date( clockingTime.timeStart ).setHours(0,0,0,0) == closeOutDate;
        });

        debug && console.log( "validateClockingForCloseOutDay: validating " + timeCardClocking.length + " clocking entries against " + workOrders.length + " work orders." );
        // Scan all of the clocking items relevant to our day selection
        for ( var clocking in timeCardClocking ) {
            // If this clocking is related to a work order and not non-productive
            if ( timeCardClocking[clocking].workOrderSegmentId ) {
                // validate the workOrderSegmentId to a segment webId
                for ( var order in workOrders ) {
                    segments = workOrders[order].workOrderSegments;

                    // Scan each order segment
                    for ( var segment in segments ) {
                        // Update any segmentIds that relate to an updated webId (clientReference field)
                        if( segments[segment].clientReference != segments[segment].webId && timeCardClocking[clocking].workOrderSegmentId == segments[segment].clientReference ) {
                            debug && console.log( "validateClockingForCloseOutDay: Update required for workOrderSegmentId " + timeCardClocking[clocking].workOrderSegmentId );
                            timeCardClocking[clocking].workOrderSegmentId = segments[segment].webId;
                        }
                    }
                }

                // Something failed to update properly
                if ( timeCardClocking[clocking].workOrderSegmentId == null ) {
                    debug && console.log( "validateClockingForCloseOutDay: null workOrderSegmentId found after update attempt" );
                    validClocking = false;
                    break;
                }
            }
        }

        debug && console.log( "validateClockingForCloseOutDay: Valid clocking status is " + validClocking );

        // If the clocking was invalid, try posting
        if( !validClocking ) {
            Dialog.showConfirmYesNo( Localization.getText( "timeCardPost"), Localization.getText( "timeCardUpdateWorkOrders"), function() {
                Dialog.closeDialog();
                WorkOrder.postWorkOrders( timeCardRelatedWorkOrders, function() {
                    Dialog.closeDialog();
                    // See if any dirty work orders remain
                    if( WorkOrder.getWorkOrdersRequiringPostToMiddleTier().length > 0 ) {
                        Dialog.showAlert( Localization.getText( "timeCardPost" ), Localization.getText( "workOrderPostFailed" ), function() {
                            UIFrame.reloadCurrentPage();
                        }, "350px" );
                    } else {
                        Dialog.showAlert( Localization.getText( "timeCardPost"), Localization.getText( "timeCardWorkOrdersUpdated" ), function() {
                            UIFrame.reloadCurrentPage();
                        }, "350px" );
                    }
                });
            }, null, "400px" );
        }

        return validClocking;
    }

    /**
     * Close any open time entry items and navigate to the close out day page
     */
    function closeOutDayAttempt() {
        debug && console.log( "TimeSheet.closeOutDay: User selected to close out day" );
        var currentStatus = JSONData.getCurrentClockingStatus( null );
        var clockingStatusObj = _.find( VALID_CLOCKING_STATUSES, function( statusObjInList ) {
            return statusObjInList.key == currentStatus;
        });

        // Allow the user to close out previous clocking regardless of the current clocking status
        if ( window.localStorage.getItem( LS_CLOSE_OUT_DATE ) < new Date().setHours( 0, 0, 0, 0 ) &&
            window.localStorage.getItem( LS_CLOSE_OUT_DAY_ATTEMPT ) ) {
            if( JSONData.validateClockingForCloseOutDay() ) {
                UIFrame.navigateToPage( "closeoutday.html", false, null );
            }
        // If this is an attempt to close out today's clocking
        } else if ( JSONData.getNonProductiveClockingStatuses().indexOf( currentStatus ) != -1 ) {
            window.localStorage.setItem( LS_CLOSE_OUT_DAY_ATTEMPT, true );
            UIFrame.displayEndNonProductiveClockingDialog( "technicianStatusLoggedIn" );
        } else if ( clockingStatusObj.technicianStatus == TECHNICIAN_STATUS_TRAVELING )  {
            window.localStorage.setItem( LS_CLOSE_OUT_DAY_ATTEMPT, true );
            JSONData.setWorkOrderIdForClockingChange( WorkOrder.getCurrentWorkOrderId() );
            UIFrame.displayTerminateClockingDialog( "terminateTravelingTitle", "terminateTravelingPrompt" );
        } else if ( clockingStatusObj.technicianStatus == TECHNICIAN_STATUS_PRODUCTIVE ) {
            window.localStorage.setItem( LS_CLOSE_OUT_DAY_ATTEMPT, true );
            UIFrame.displayTerminateClockingDialog( "terminateClockingTitle", "terminateClockingPrompt" );
        // Closing today's clocking and there is no current clocking status that may interfere
        } else if ( JSONData.validateClockingForCloseOutDay() ) {
            window.localStorage.setItem( LS_CLOSE_OUT_DAY_ATTEMPT, true );
            UIFrame.navigateToPage( "closeoutday.html", false, null );
        }
    }

    /**
     * Is the specified clocking considered paid hours for the technician?
     * @param clocking
     * @returns Boolean - true if paid, false otherwise
     */
    function isClockingPaid( clocking ) {
        var paid = false;
        if ( clocking && clocking.technicianStatus ) {
            paid = ( clocking.technicianStatus == JSONData.TECHNICIAN_STATUS_PRODUCTIVE ||
                     clocking.technicianStatus == JSONData.TECHNICIAN_STATUS_TRAVELING ||
                     clocking.laborCodeId == LABOR_CODE_ID_DP_TRAINING ||
                     clocking.laborCodeId == LABOR_CODE_ID_PAPERWORK ||
                     clocking.laborCodeId == LABOR_CODE_ID_PARTS_STAFF ||
                     clocking.laborCodeId == LABOR_CODE_ID_SERVICE_SUPERVISION ||
                     clocking.laborCodeId == LABOR_CODE_ID_TRAINING ||
                     clocking.laborCodeId == LABOR_CODE_ID_VEHICLE_MAINTENANCE );
        }
        return paid;
    }

    /**
     * Is the specified clocking considered unpaid hours for the technician?
     * @param clocking
     * @returns Boolean - true if unpaid, false otherwise
     */
    function isClockingUnpaid( clocking ) {
        var unpaid = false;
        if ( clocking && clocking.laborCodeId ) {
            unpaid = ( clocking.laborCodeId == LABOR_CODE_ID_LUNCH ||
                       clocking.laborCodeId == LABOR_CODE_ID_NOPAY );
        }
        return unpaid;
    }

    /**
     * Does the technician need to close out a day?
     * The presence of at least one technicianClocking record without closed
     * property indicates that close out day is required.
     * @param checkPreviousDaysOnly - If true, check previous days only,
     *                                if false, check current day only
     * @returns True if close out day is required, false otherwise
     */
    function isCloseOutDayRequired( checkPreviousDaysOnly ) {
        var closeoutDayRequired = _.any( getObjectsByDataType( "technicianClocking"), function( clockingInList ) {
            var closeoutRequired = false;
            var today = new Date().setHours( 0, 0, 0, 0 );
            var clockingDate = new Date( clockingInList.timeStart ).setHours( 0, 0, 0, 0 );
            if ( checkPreviousDaysOnly ) {
                closeoutRequired = ( !clockingInList.closed &&
                                     clockingDate != today &&
                                     ( clockingInList.technicianStatus == TECHNICIAN_STATUS_PRODUCTIVE ||
                                       clockingInList.technicianStatus == TECHNICIAN_STATUS_NON_PRODUCTIVE ||
                                       clockingInList.technicianStatus == TECHNICIAN_STATUS_TRAVELING ) );
            } else {
                closeoutRequired = ( !clockingInList.closed &&
                                     clockingDate == today &&
                                     ( clockingInList.technicianStatus == TECHNICIAN_STATUS_PRODUCTIVE ||
                                       clockingInList.technicianStatus == TECHNICIAN_STATUS_NON_PRODUCTIVE ||
                                       clockingInList.technicianStatus == TECHNICIAN_STATUS_TRAVELING ) );
            }
            return closeoutRequired;
        });
        debug && console.log( "JSONData.isCloseOutDayRequired: Close out day required = " + closeoutDayRequired );
        return closeoutDayRequired;
    }

    /**
     * Is a daily JSON feed update needed?
     * @returns Boolean indicating if a daily update is needed
     */
    function isDailyUpdateNeeded() {
        // Do we need to pull the daily JSON update?
        var dailyJSONUpdateNeeded = false;
        var lastDailyUpdate;
        var now;
        if ( Config.getConfig().dateTimeDailyUpdate ) {
            now = new Date().setHours( 0, 0, 0, 0 );
            lastDailyUpdate = new Date( Config.getConfig().dateTimeDailyUpdate ).setHours( 0, 0, 0, 0 );
            if ( ( now - lastDailyUpdate ) >= Config.getConfig().dailyUpdateFrequencyInHours * 60 * 60 * 1000 ) {
                dailyJSONUpdateNeeded = true;
            }
        } else {
            dailyJSONUpdateNeeded = true;
        }
        debug && console.log( "JSONData.isDailyUpdateNeeded: Daily update needed = " + dailyJSONUpdateNeeded );
        return dailyJSONUpdateNeeded;
    }

    /**
     * Is the clocking being created going to be the first clocking of the day?
     */
    function isFirstClockingOfTheDay() {
        var isFirst = false;
        var today = new Date( Util.getCurrentDate() ).getTime();
        var todaysClockings = _.filter( getObjectsByDataType( "technicianClocking" ), function( clockingInList ) {
            var clockingDate = new Date( clockingInList.timeStart ).setHours( 0, 0, 0, 0 );
            return ( clockingDate === today && clockingInList.technicianStatus != TECHNICIAN_STATUS_LOGGED_IN_OUT );
        });
        if ( todaysClockings && todaysClockings.length === 0 ) {
            isFirst = true;
        }
        debug && console.log( "JSONData.isFirstClockingOfTheDay: First clocking of the day = " + isFirst );
        return isFirst;
    }

    /**
     * Is the specified inventory valid?
     * @param inventory
     * @return {boolean}
     */
    function isInventoryValid( inventory ) {
        // Ignore inventory locations whose quantity, minimum and maximum are all 0
        return ( !( inventory.quantity == 0 && inventory.minimum == 0 && inventory.maximum == 0 ) );
    }

    /**
     * Is the specified standard job code valid?
     * @param standardJobCode - Object containing the standard job code to check
     * @return {boolean}
     */
    function isStandardJobCodeValid( standardJobCode ) {
        var valid = false;
        if ( standardJobCode && _.isObject( standardJobCode ) ) {
            // Must be a valid mfg
            if ( _.contains( VALID_STANDARD_JOB_CODE_MFGS, standardJobCode.standardJobCodeManufacturerId ) ) {
                // description and notes properties cannot be null
                if ( !_.isNull( standardJobCode.description ) && !_.isNull( standardJobCode.notes ) ) {
                    // Start of complete job code is not contained inside invalid job codes array
                    if ( !_.contains( INVALID_STANDARD_JOB_CODES, standardJobCode.completeJobCode.substr( 0, 2 ) ) ) {
                        valid = true;
                    }
                }
            }
        }
        return valid;
    }

    /**
     * Create a new technician clocking
     * @returns Object containing new technician clocking
     */
    function createNewTechnicianClocking( startTime ) {
        return {
            webId: Util.getUniqueId(),
            clientReference: Util.getUniqueId(),
            internalId: null,
            laborCodeId: null,
            laborTimeTypeId: null,
            technicianStatus: null,
            timeStart: startTime,
            timeEnd: null,
            unproductiveTimeReason: null,
            workOrderHeaderId: null,
            workOrderSegmentId: null,
            workOrderLineId: null,
            workOrderDocumentNumber: null,
            workOrderCustomerName: null,
            postToMiddleTierRequired: true
        };
    }

    /**
     * Create a new signature object.  The dateCaptured property will
     * be set to the current date/time and the format will be set to image/png;base64
     * @returns Object containing the new signature
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
     * @returns Object containing the new message
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
     * Get the technician's branch ID
     * @returns branch ID for technician or null if missing
     */
    function getTechnicianBranchId() {
        var webUser = getObjectById( "webUsers", getTechnicianUserId() );
        var branchId = null;
        if ( !_.isNull( webUser.branchId ) && ( !_.isUndefined( webUser.branchId ) ) ) {
            branchId = webUser.branchId;
        }
        debug && console.log( "JSONData.getTechnicianBranchId: Technician's branch ID = " + branchId );
        return branchId;
    }

    /**
     * Return the technician's user ID
     * @returns String containing the technician's user ID
     */
    function getTechnicianUserId() {
        var userId = getObjectById( JSON_DATATYPE_LOGON, LOGON_WEBID, null ).webUserId;
        debug && console.log( "JSONData.getTechnicianUserId: Technician's user ID = " + userId );
        return userId;
    }

    /**
     * Return the technician's name
     * @returns String containing the technician's name
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
     * Return the technician's van
     * @returns JSON object from the serviceTruck feed for technician's van
     */
    function getTechnicianVan() {
        var userId = getTechnicianUserId();
        var technicianVan = null;
        if ( userId != "" ) {
            technicianVan = _.find( getObjectsByDataType( "serviceTrucks" ), function( truckInList ) {
                return truckInList.webUserId == userId;
            });
            if ( technicianVan ) {
                debug && console.log( "JSONData.getTechnicianVan: Technician's van = " + JSON.stringify( technicianVan ) );
            } else {
                console.warn( "JSONData.getTechnicianVan: Technician's van not found" );
            }
        }
        return technicianVan;
    }

    /**
     * Is the specified stock area on the technician's van?
     * @param stockAreaId - Stock area ID to check
     * @returns Boolean - true if it is, false otherwise
     */
    function isStockAreaOnVan( stockAreaId ) {
        var onVan = false;
        // Get the technician's van
        var stockArea = getObjectById( "stockAreas", stockAreaId, null );
        var van = getTechnicianVan();
        if ( van && stockArea ) {
            onVan = ( van.name == stockArea.name );
        }
        return onVan;
    }

    /**
     * Reset the app by reloading all JSON data
     */
    function reset() {
        // Show please wait while reset takes place
        Dialog.showPleaseWait( Localization.getText( "resetTitle"),
                               Localization.getText( "resettingMobileApp" ), "350px" );
        resetLocalStorage();
        debug && console.log( "JSONData.reloadJSONData: JSON data being loaded into an empty local store" );
        // Clear the JSON feed request date / time
        window.localStorage.removeItem( LS_JSON_FEED_REQUEST_DATE_TIME );
        window.localStorage.setItem( LS_PERIODIC_JSON_FEED_UPDATE_RUNNING, true );
        loadJSONDataIntoDatabase( JSON_FEED_UPDATE_TYPE.FULL );
    }

    /**
     * Set or remove the unsaved changes local storage item.  If
     * unsavedChanges is true, the save button on the page is shown.
     * If unsavedChanges is false, the save button is hidden
     * @param unsavedChanges
     * @param saveButtonId
     */
    function setUnsavedChanges( unsavedChanges, saveButtonId ) {
        var currentUnsavedValue = window.localStorage.getItem( UIFrame.LS_UNSAVED_CHANGES );
        var saveButton;
        if ( unsavedChanges != currentUnsavedValue ) {
            debug && console.log( "ManageWorkOrder.setUnsavedChanges: Setting unsaved changes to " + unsavedChanges );
            saveButton = $( "#" + saveButtonId );
            if ( unsavedChanges ) {
                window.localStorage.setItem( UIFrame.LS_UNSAVED_CHANGES, true );
                if ( saveButton ) {
                    saveButton.show();
                }
            } else {
                window.localStorage.removeItem( UIFrame.LS_UNSAVED_CHANGES );
                if ( saveButton ) {
                    saveButton.hide();
                }
            }
        }
    }

    /**
     * Set flag in local storage to skip the JSON feed update
     * @param skipUpdate - Boolean, set flag if true, remove flag if false
     */
    function setSkipJSONFeedUpdate( skipUpdate ) {
        if ( skipUpdate ) {
            debug && console.log( "JSONData.setSkipJSONFeedUpdate: Setting skip JSON feed update flag" );
            window.localStorage.setItem( LS_SKIP_PERIODIC_JSON_FEED_UPDATE, true );
        } else {
            debug && console.log( "JSONData.setSkipJSONFeedUpdate: Clearing skip JSON feed update flag" );
            window.localStorage.removeItem( LS_SKIP_PERIODIC_JSON_FEED_UPDATE );
        }
    }

    /**
     * Is the JSON feed being skipped?
     * @returns Boolean
     */
    function skipJSONFeedUpdate() {
        return window.localStorage.getItem( LS_SKIP_PERIODIC_JSON_FEED_UPDATE );
    }

    /**
     * Get the data type from the JSON feed data
     * @param jsonFeedData
     * @returns String containing the datatype
     */
    function getDataTypeFromJSONFeedData( jsonFeedData ) {
        var dataType = null;
        if ( jsonFeedData && _.isObject( jsonFeedData ) ) {
            // The data type is the key for the first array inside the JSON feed data
            dataType = _.find( _.keys( jsonFeedData ), function( keyInList ) {
                return _.isArray( jsonFeedData[keyInList] );
            });
        }
        return dataType;
    }

    return {
        'BATTERY_CODES_MFG_ID'                      : BATTERY_CODES_MFG_ID,
        'COMM_DETAIL_TYPE_CELL'                     : COMM_DETAIL_TYPE_CELL,
        'COMM_DETAIL_TYPE_EMAIL'                    : COMM_DETAIL_TYPE_EMAIL,
        'COMM_DETAIL_TYPE_FAX'                      : COMM_DETAIL_TYPE_FAX,
        'COMM_DETAIL_TYPE_PHONE'                    : COMM_DETAIL_TYPE_PHONE,
        'DOCK_AND_DOOR_CODES_MFG_ID'                : DOCK_AND_DOOR_CODES_MFG_ID,
        'JSON_DATATYPE_LOGON'                       : JSON_DATATYPE_LOGON,
        'LABOR_CODE_ID_LUNCH'                       : LABOR_CODE_ID_LUNCH,
        'LABOR_CODE_ID_NOPAY'                       : LABOR_CODE_ID_NOPAY,
        'LABOR_CODE_ID_PAPERWORK'                   : LABOR_CODE_ID_PAPERWORK,
        'LABOR_CODE_ID_PARTS_RUN'                   : LABOR_CODE_ID_PARTS_RUN,
        'LABOR_CODE_ID_TRAINING'                    : LABOR_CODE_ID_TRAINING,
        'LABOR_CODE_ID_TTRNC'                       : LABOR_CODE_ID_TTRNC,
        'LOGON_WEBID'                               : LOGON_WEBID,
        'LS_APP_PAUSED'                             : LS_APP_PAUSED,
        'LS_APP_RESUMED'                            : LS_APP_RESUMED,
        'LS_CLOSE_OUT_DATE'							: LS_CLOSE_OUT_DATE,
        'LS_CLOSE_OUT_DAY_ATTEMPT'					: LS_CLOSE_OUT_DAY_ATTEMPT,
        'LS_CURRENT_CUSTOMER_ID'                    : LS_CURRENT_CUSTOMER_ID,
        'LS_CURRENT_WORK_ORDER_DELETED'             : LS_CURRENT_WORK_ORDER_DELETED,
        'LS_IDLE_TIME_LOGOFF_OCCURRED'              : LS_IDLE_TIME_LOGOFF_OCCURRED,
        'LS_INITIAL_WORK_ORDER_LIST_FILTER'         : LS_INITIAL_WORK_ORDER_LIST_FILTER,
        'LS_JSON_FEED_UPDATE_MANUALLY_STARTED'      : LS_JSON_FEED_UPDATE_MANUALLY_STARTED,
        'LS_LOGOFF_IN_PROGRESS'                     : LS_LOGOFF_IN_PROGRESS,
        'LS_PERIODIC_JSON_FEED_UPDATE_RUNNING'      : LS_PERIODIC_JSON_FEED_UPDATE_RUNNING,
        'LS_WORK_ORDER_EQUIPMENT_SELECTION'         : LS_WORK_ORDER_EQUIPMENT_SELECTION,
        'LS_WORK_ORDER_ID_FOR_CLOCKING_CHANGE'      : LS_WORK_ORDER_ID_FOR_CLOCKING_CHANGE,
        'LS_WORK_ORDER_SELECTED_EQUIPMENT_ID'       : LS_WORK_ORDER_SELECTED_EQUIPMENT_ID,
        'MESSAGE_TYPE_GENERAL'                      : MESSAGE_TYPE_GENERAL,
        'MESSAGE_TYPE_WO_REJECTED'                  : MESSAGE_TYPE_WO_REJECTED,
        'MESSAGE_TYPE_PART_REQUEST'                 : MESSAGE_TYPE_PART_REQUEST,
        'MESSAGE_TYPE_WO_REVIEW'                    : MESSAGE_TYPE_WO_REVIEW,
        'MESSAGE_TYPE_CUSTOMER_CONTACT_UPDATE'      : MESSAGE_TYPE_CUSTOMER_CONTACT_UPDATE,
        'PM_CODES_MFG_ID'                           : PM_CODES_MFG_ID,
        'PRODUCT_TYPE_PART'                         : PRODUCT_TYPE_PART,
        'PRODUCT_TYPE_EQUIPMENT'                    : PRODUCT_TYPE_EQUIPMENT,
        'PRODUCT_TYPE_LABOR'                        : PRODUCT_TYPE_LABOR,
        'REPAIR_CODES_MFG_ID'                       : REPAIR_CODES_MFG_ID,
        'SIGNATURE_FORMAT'                          : SIGNATURE_FORMAT,
        'STANDARD_JOB_CODE_FM_COMPLETEJOBCODE'      : STANDARD_JOB_CODE_FM_COMPLETEJOBCODE,
        'STANDARD_JOB_CODE_PM_COMPLETEJOBCODE'      : STANDARD_JOB_CODE_PM_COMPLETEJOBCODE,
        'STOCK_AREA_TYPE_VAN'                       : STOCK_AREA_TYPE_VAN,
        'TECHNICIAN_STATUS_LOGGED_IN_OUT'           : TECHNICIAN_STATUS_LOGGED_IN_OUT,
        'TECHNICIAN_STATUS_NON_PRODUCTIVE'          : TECHNICIAN_STATUS_NON_PRODUCTIVE,
        'TECHNICIAN_STATUS_PRODUCTIVE'              : TECHNICIAN_STATUS_PRODUCTIVE,
        'TECHNICIAN_STATUS_TRAVELING'               : TECHNICIAN_STATUS_TRAVELING,
        'VALID_CLOCKING_STATUSES'                   : VALID_CLOCKING_STATUSES,
        'VALID_STANDARD_JOB_CODE_MFGS'              : VALID_STANDARD_JOB_CODE_MFGS,
        'WORK_FROM_PM_FOLDER_ID'                    : WORK_FROM_PM_FOLDER_ID,
        'XCODE_DATATYPE'                            : XCODE_DATATYPE,
        'XCODE_STANDARD_JOB_CODE_PREFIX'            : XCODE_STANDARD_JOB_CODE_PREFIX,
        'changeClockingStatus'                      : changeClockingStatus,
        'closeOpenTimeEntry'                        : closeOpenTimeEntry,
        'closeOutDayAttempt'						: closeOutDayAttempt,
        'createNewMessage'                          : createNewMessage,
        'createNewSignature'                        : createNewSignature,
        'createNewTechnicianClocking'               : createNewTechnicianClocking,
        'deleteDataType'                            : deleteDataType,
        'deleteJSON'                                : deleteJSON,
        'getContactListForCustomer'                 : getContactListForCustomer,
        'getCurrentClockingStartTime'               : getCurrentClockingStartTime,
        'getCurrentClockingStatus'                  : getCurrentClockingStatus,
        'getEquipment'                              : getEquipment,
        'getEquipmentFromDatabaseForCustomer'       : getEquipmentFromDatabaseForCustomer,
        'getFilteredObjectCount'                    : getFilteredObjectCount,
        'getFilteredObjectList'                     : getFilteredObjectList,
        'getJSONFeedConfig'                         : getJSONFeedConfig,
        'getDataTypeFromJSONFeedData'               : getDataTypeFromJSONFeedData,
        'getInventoryLocationString'                : getInventoryLocationString,
        'getInventoryLocationStringFromObj'         : getInventoryLocationStringFromObj,
        'getLatestTimeEntry'                        : getLatestTimeEntry,
        'getMainCommunicationDetails'               : getMainCommunicationDetails,
        'getNewClockingStartTime'                   : getNewClockingStartTime,
        'getNewMessageCount'                        : getNewMessageCount,
        'getNonProductiveClockingStatuses'          : getNonProductiveClockingStatuses,
        'getNumWorkOrdersSavedDuringLastUpdate'     : getNumWorkOrdersSavedDuringLastUpdate,
        'getNumPMSchedulesSavedDuringLastUpdate'    : getNumPMSchedulesSavedDuringLastUpdate,
        'getObjectById'                             : getObjectById,
        'getObjectFromArrayById'                    : getObjectFromArrayById,
        'getObjectFromDatabaseById'                 : getObjectFromDatabaseById,
        'getObjectsByDataType'                      : getObjectsByDataType,
        'getObjectsFromDatabase'                    : getObjectsFromDatabase,
        'getOpenTimeEntry'                          : getOpenTimeEntry,
        'getOrderEmailListForCustomer'              : getOrderEmailListForCustomer,
        'getPartLocation'                           : getPartLocation,
        'getPeriodicJSONFeedUpdates'                : getPeriodicJSONFeedUpdates,
        'getPMCountForCustomer'                     : getPMCountForCustomer,
        'getPMCountForEquipment'                    : getPMCountForEquipment,
        'getPMCutoffDate'                           : getPMCutoffDate,
        'getProducts'                               : getProducts,
        'getStandardJobCodes'                       : getStandardJobCodes,
        'getTechnicianBranchId'                     : getTechnicianBranchId,
        'getTechnicianClockingsRequiringPostToMiddleTier' : getTechnicianClockingsRequiringPostToMiddleTier,
        'getTechnicianName'                         : getTechnicianName,
        'getTechnicianVan'                          : getTechnicianVan,
        'getTechnicianUserId'                       : getTechnicianUserId,
        'getWorkOrderIdForClockingChange'           : getWorkOrderIdForClockingChange,
        'getWorkOrderPrimaryEmailForCustomer'       : getWorkOrderPrimaryEmailForCustomer,
        'getWorkOrderSecondaryEmailForCustomer'     : getWorkOrderSecondaryEmailForCustomer,
        'handleClockingPostError'                   : handleClockingPostError,
        'handleDataMissingError'                    : handleDataMissingError,
        'init'                                      : init,
        'isClockingPaid'                            : isClockingPaid,
        'isClockingUnpaid'                          : isClockingUnpaid,
        'isCloseOutDayRequired'                     : isCloseOutDayRequired,
        'isDailyUpdateNeeded'                       : isDailyUpdateNeeded,
        'isEquipmentUnderWarranty'                  : isEquipmentUnderWarranty,
        'isFirstClockingOfTheDay'                   : isFirstClockingOfTheDay,
        'isInventoryValid'                          : isInventoryValid,
        'isLunchBreakShort'                         : isLunchBreakShort,
        'isPeriodicJSONFeedUpdateRunning'           : isPeriodicJSONFeedUpdateRunning,
        'isPMBeforeCutoffDate'                      : isPMBeforeCutoffDate,
        'isPostLocallySavedDataRunning'             : isPostLocallySavedDataRunning,
        'isStandardJobCodeValid'                    : isStandardJobCodeValid,
        'isStockAreaOnVan'                          : isStockAreaOnVan,
        'isTechnicianTraveling'                     : isTechnicianTraveling,
        'loadEquipmentFromDatabase'                 : loadEquipmentFromDatabase,
        'loadJSON'                                  : loadJSON,
        'loadJSONDataIntoDatabase'                  : loadJSONDataIntoDatabase,
        'loadJSONDataIntoLocalStore'                : loadJSONDataIntoLocalStore,
        'loadJSONDataType'                          : loadJSONDataType,
        'loadStandardJobCodesFromDatabase'          : loadStandardJobCodesFromDatabase,
        'logException'                              : logException,
        'logon'                                     : logon,
        'logoff'                                    : logoff,
        'postDataToMiddleTier'                      : postDataToMiddleTier,
        'postLocallySavedData'                      : postLocallySavedData,
        'postSavedTechnicianClockings'              : postSavedTechnicianClockings,
        'postTimeCard'                              : postTimeCard,
        'reset'                                     : reset,
        'resetLocalStorage'                         : resetLocalStorage,
        'saveClockingStatus'                        : saveClockingStatus,
        'saveInventoryQuantityChanges'              : saveInventoryQuantityChanges,
        'saveJSON'                                  : saveJSON,
        'saveJSONFeedDataIntoLocalStore'            : saveJSONFeedDataIntoLocalStore,
        'setPageSpecificPeriodicUpdateCompleteFn'   : setPageSpecificPeriodicUpdateCompleteFn,
        'setSkipJSONFeedUpdate'                     : setSkipJSONFeedUpdate,
        'setUnsavedChanges'                         : setUnsavedChanges,
        'setWorkOrderIdForClockingChange'           : setWorkOrderIdForClockingChange,
        'skipJSONFeedUpdate'                        : skipJSONFeedUpdate,
        'validateClockingForCloseOutDay'			: validateClockingForCloseOutDay
    };
}();
