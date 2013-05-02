/**
 * Test spec for Config
 */
describe( "Config", function () {
    /**
     * Is training mode tests
     */
    it( "Is training mode tests", function () {
        var config = Config.getConfig();
        // False by default
        expect( Config.isTrainingMode() ).toBeFalsy();
        // Set training mode and verify
        config.trainingMode = true;
        Config.saveConfiguration( config );
        expect( Config.isTrainingMode() ).toBeTruthy();
        config.trainingMode = false;
        Config.saveConfiguration( config );
        expect( Config.isTrainingMode() ).toBeFalsy();
    } );

    /**
     * Get configuration tests
     */
    it( "Get configuration tests", function () {
        var config = Config.getConfig();
        expect( _.isObject( config ) ).toBeTruthy();
        expect( config.webId ).toBe( 1 );
        expect( _.isArray( config.middleTierUrls ) );
        expect( _.isArray( config.ignoredPostErrorCodes ) );
        expect( _.isArray( config.jsonDatabaseFeeds ) );
        expect( _.isArray( config.jsonLocalStoreFeeds ) );
    } );

    /**
     * Get JSON feed config tests
     */
    it( "Get JSON feed config tests", function () {
        var feedConfig;

        // Missing parameter returns null
        expect( Config.getJSONFeedConfig() ).toBeNull();

        // Invalid feed name returns null
        expect( Config.getJSONFeedConfig( "INVALID", null ) ).toBeNull();

        // Get a valid database feed
        feedConfig = Config.getJSONFeedConfig( "inventory", null );
        expect( _.isObject( feedConfig ) ).toBeTruthy();
        expect( feedConfig.name ).toBe( "inventory" );
        expect( feedConfig.url ).toBe( "inventory/listFull" );
        expect( feedConfig.readOnly ).toBeFalsy();

        // Get a valid localStorage feed
        feedConfig = Config.getJSONFeedConfig( "laborCodes", null  );
        expect( _.isObject( feedConfig ) ).toBeTruthy();
        expect( feedConfig.name ).toBe( "laborCodes" );
        expect( feedConfig.url ).toBe( "laborCode/list" );
        expect( feedConfig.readOnly ).toBeTruthy();
    });

    /**
     * Does JSON feed support update tests
     */
    it( "Does JSON feed support update tests", function () {
        var config = Config.getConfig();

        // Missing parameter returns false
        expect( Config.doesJSONFeedSupportUpdate() ).toBeFalsy();

        // Invalid parameter returns false
        expect( Config.doesJSONFeedSupportUpdate( "INVALID") ).toBeFalsy();

        // Check each of the database feeds
        _.each( config.jsonDatabaseFeeds, function( configInList ) {
            var updateSupported = Config.doesJSONFeedSupportUpdate( configInList.name );
            expect( updateSupported ).toBe( configInList.updateSupported );
        });

        // Check each of the local storage feeds
        _.each( config.jsonLocalStoreFeeds, function( configInList ) {
            var updateSupported = Config.doesJSONFeedSupportUpdate( configInList.name );
            expect( updateSupported ).toBe( configInList.updateSupported );
        });
    });

    /**
     * Set update supported for JSON feed tests
     */
    it( "Set update supported for JSON feed tests", function () {
        var originalConfig = Config.getConfig();

        // Missing / invalid parameters do nothing
        Config.setUpdateSupportedForJSONFeed( "INVALID", true );
        expect( Config.doesJSONFeedSupportUpdate( "INVALID" ) ).toBeFalsy();
        Config.setUpdateSupportedForJSONFeed( "workOrders" );
        expect( Config.doesJSONFeedSupportUpdate( "workOrders" ) ).toBeTruthy();
        Config.setUpdateSupportedForJSONFeed( "workOrders", "INVALID" );
        expect( Config.doesJSONFeedSupportUpdate( "workOrders" ) ).toBeTruthy();

        // Verify that update property changed
        Config.setUpdateSupportedForJSONFeed( "workOrders", false );
        expect( Config.doesJSONFeedSupportUpdate( "workOrders" ) ).toBeFalsy();
        Config.setUpdateSupportedForJSONFeed( "pmSchedules", true );
        expect( Config.doesJSONFeedSupportUpdate( "pmSchedules" ) ).toBeTruthy();

        Config.saveConfiguration( originalConfig );
    } );
} );
