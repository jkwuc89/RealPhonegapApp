/**
 * config.js
 */

"use strict";

/**
 * Config
 * Encapsulate mobile app's configuration
 */
var Config = function() {

    // Configuration JSON URL
    var configurationUrl = "json/configuration.json";

    /**
     * Get the current application configuration
     * @returns The config JSON objects
     */
    function getConfig() {
        var config;
        try {
            config = JSON.parse( window.localStorage.getItem( "configuration.1" ) );
        } catch ( exc ) {
            console.warn( "Config.getConfig: App configuration JSON not available in local storage yet" );
            config = null;
        }
        return config;
    }

    /**
     * Is the app running in training mode?
     * @returns Boolean true or false based on trainingMode property in app's configuration
     */
    function isTrainingMode() {
        var trainingMode = false;
        var config = Config.getConfig();
        if ( config && config.trainingMode ) {
            trainingMode = config.trainingMode;
        }
        debug && console.debug( "Config.isTrainingMode: Training mode = " + trainingMode );
        return trainingMode;
    }

    /**
     * Load the application's configuration data
     * @param loadCallback - Option callback function, called when configuration data is saved
     */
    function loadConfiguration( loadCallback ) {
        debug && console.log( "Config.loadConfiguration: Loading configuration data from " + configurationUrl );
        JSONData.loadJSON( configurationUrl,
            // Save the configuration data inside the local store
            function( configData ) {
                saveConfiguration( configData["configuration"][0] );
                loadCallback();
            },
            // Failure to load the configuration JSON throws an exception
            function() {
                throw "Config.loadConfiguration: Unable to load the configuration JSON " + configurationUrl;
            }
        );
    }

    /**
     * Save the updated configuration into local storage
     */
    function saveConfiguration( updatedConfig ) {
        debug && console.log( "Config.saveConfiguration: Saving updated configuration" );
        JSONData.saveJSON( "configuration", updatedConfig, true );
    }

    /**
     * Set the configuration URL
     * If this is not called, the default configuration URL defined above
     * will be used.
     */
    function setConfigurationUrl( newConfigUrl ) {
        debug && console.log( "Config.setConfigurationUrl: Setting URL to " + newConfigUrl );
        configurationUrl = newConfigUrl;
    }

    /**
     * Get the JSON feed configuration
     * @param feedName - String
     * @param config - Object containing already loaded configuration, can be null
     * @returns feedConfig - Object containing the JSON feed configuration
     */
    function getJSONFeedConfig( feedName, config ) {
        if ( !config ) {
            config = getConfig();
        }
        var feedConfig = null;
        if ( feedName ) {
            feedConfig = _.find( config.jsonDatabaseFeeds, function( feedInList ) {
                return feedInList.name == feedName;
            });
            if ( !feedConfig ) {
                feedConfig = _.find( config.jsonLocalStoreFeeds, function( feedInList ) {
                    return feedInList.name == feedName;
                });
            }
        }
        if ( feedConfig ) {
            debug && console.log( "Config.getJSONFeedConfig: " + feedConfig + " configuration: " + JSON.stringify( feedConfig ) );
        } else {
            console.error( "Config.getJSONFeedConfig: " + feedConfig + " configuration does not exist" );
            feedConfig = null;
        }
        return feedConfig;
    }

    /**
     * Does the specified JSON feed support update?
     * @param feedName - String
     * @returns Boolean
     */
    function doesJSONFeedSupportUpdate( feedName ) {
        var feedConfig = false;
        var updateSupported = false;
        if ( feedName ) {
            feedConfig = getJSONFeedConfig( feedName, null );
            if ( feedConfig ) {
                updateSupported = feedConfig.updateSupported;
            }
            debug && console.log( "Config.getJSONFeedConfig.doesJSONFeedSupportUpdates: " + feedName +
                                  ".updateSupported = " + updateSupported );
        }
        return updateSupported;
    }

    /**
     * Set the updateSupported property for a JSON feed
     * @param feedName - String
     * @param newValue - Boolean
     */
    function setUpdateSupportedForJSONFeed( feedName, newValue ) {
        var config = getConfig();
        var feedConfig;
        if ( feedName && _.isBoolean( newValue ) ) {
            feedConfig = getJSONFeedConfig( feedName, config );
            if ( feedConfig ) {
                feedConfig.updateSupported = newValue;
                debug && console.log( "Config.setUpdateSupportedForJSONFeed: Setting " +
                                      feedName + ".updateSupported to " + newValue );
                Config.saveConfiguration( config );
            }
        } else {
            console.error( "Config.getJSONFeedConfig.setUpdateSupportedForJSONFeed: Required parameters feedName and/or newValue " +
                           " are missing or invalid" );
        }
    }

    return {
        'doesJSONFeedSupportUpdate'         : doesJSONFeedSupportUpdate,
        'getConfig'                         : getConfig,
        'getJSONFeedConfig'                 : getJSONFeedConfig,
        'isTrainingMode'                    : isTrainingMode,
        'loadConfiguration'                 : loadConfiguration,
        'saveConfiguration'                 : saveConfiguration,
        'setConfigurationUrl'               : setConfigurationUrl,
        'setUpdateSupportedForJSONFeed'     : setUpdateSupportedForJSONFeed
    };
}();
