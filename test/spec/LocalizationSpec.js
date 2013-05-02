/**
 * Test spec for localization.js
 * FIXME: Tests that require a language change are currently commented out
 */
describe( "Localization", function() {

    /**
     * Before test set up
     */
    beforeEach( function() {
        Localization.setLanguage( "en-US", false );
        Localization.loadLanguage( function() {
            debug && console.log( "LocalizationSpec: loadLanguage() complete" );
        });

    });

    /**
     * After test clean up
     */
    afterEach( function() {
        // Set language back to en-US
//        Localization.setLanguage( "en-US", false );
    });
    
    /**
     * formatDateTime tests
     */
    it( "formatDateTime(): Exception with missing parameters", function() {
        expect( function() {
            Localization.formatDateTime();
        }).toThrow( "Localization.formatDateTime: One or more required parameters (dateTime, format) are undefined" );
        expect( function() {
            Localization.formatDateTime( "2012-04-20T06:50:00Z" );
        }).toThrow( "Localization.formatDateTime: One or more required parameters (dateTime, format) are undefined" );
    });
    it( "formatDateTime(): Exception with unsupported dateTime parameter", function() {
        expect( function() {
            Localization.formatDateTime( "BogusDateTime", "d" );
        }).toThrow( "Util.convertDateToISODateTimeStamp: 'BogusDateTime' does not match expected pattern: YYYY-MM-DD" );
    });
    it( "formatDateTime(): Return properly formatted dates and times", function() {
        Localization.setLanguage( "en-US", false );
        expect( Localization.formatDateTime( "2012-05-21", "d" ) ).toEqual( "5/21/2012" );
        expect( Localization.formatDateTime( "2012-04-20T06:50:00Z", "d" ) ).toEqual( "4/20/2012" );
        expect( Localization.formatDateTime( "2012-04-20T06:50:00.00Z", "d" ) ).toEqual( "4/20/2012" );
        expect( Localization.formatDateTime( "2012-04-20T06:50:00.000Z", "d" ) ).toEqual( "4/20/2012" );
        expect( Localization.formatDateTime( "2012-04-20T06:05:05.000Z", "mm:ss" ) ).toEqual( "05:05" );
//        Localization.setLanguage( "de", false );
//        expect( Localization.formatDateTime( "2012-05-21", "d" ) ).toEqual( "21.05.2012" );
//        expect( Localization.formatDateTime( "2012-04-20T06:50:00.000Z", "d" ) ).toEqual( "20.04.2012" );
    });
    
    /**
     * formatNumber tests
     */
    it( "formatNumber(): Exception with missing and invalid parameter", function() {
        expect( function() {
            Localization.formatNumber();
        }).toThrow( "Localization.format: One or more required parameters (number, format) are undefined" );
        expect( function() {
            Localization.formatNumber( 123 );
        }).toThrow( "Localization.format: One or more required parameters (number, format) are undefined" );
        expect( function() {
            Localization.formatNumber( "123", "n2" );
        }).toThrow( "Localization.format: number parameter is not a number" );
    });
    it( "formatNumber(): Return properly formatted numbers", function() {
        Localization.setLanguage( "en-US", false );
        expect( Localization.formatNumber( 1000, "n1" ) ).toEqual( "1,000.0" );
        expect( Localization.formatNumber( 1000, "n2" ) ).toEqual( "1,000.00" );
        expect( Localization.formatNumber( 1000, "c" ) ).toEqual( "$1,000.00" );
//        Localization.setLanguage( "de", false );
//        expect( Localization.formatNumber( 1000, "n1" ) ).toEqual( "1.000,0" );
//        expect( Localization.formatNumber( 1000, "n2" ) ).toEqual( "1.000,00" );
    });

    /**
     * Get text tests
     */
    it( "Get text tests", function() {
        expect( Localization.getText( "homePage" ) === "Home" ).toBeTruthy();
        Localization.setLanguage( "de", false );
        Localization.loadLanguage( function() {
            debug && console.log( "LocalizationSpec: Language changed to de" );
        } );
        var text1 = Localization.getText( "loginPage" );
        Localization.setLanguage( "en-US", false );
        Localization.loadLanguage( function() {
            debug && console.log( "LocalizationSpec: Language changed to en-US" );
        } );
        var text2 = Localization.getText( "loginPage" );
        expect( text1 == text2 ).toBeFalsy();
    });
    
    /**
     * Language change tests
     */
//    it( "setLanguage(): getLanguage returns language that was set", function() {
//        Localization.setLanguage( "de", false );
//        expect( Localization.getLanguage() ).toEqual( "de" );
//        expect( Globalize.culture().name ).toEqual( "de" );
//    });
} );

