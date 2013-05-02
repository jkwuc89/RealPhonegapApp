/**
 * Test spec for UIFrame module
 */
describe( "UIFrame", function () {

    // Add test HTML elements
    beforeEach( function() {
        $( "body" ).append( "<div id='testDiv' style='display:none;'></div>" );
    });

    // Remove test HTML elements
    afterEach( function() {
        $( "#testDiv" ).remove();
    });

    /**
     * Add to and clear page history tests
     */
    it( "Add to and clear page history tests", function () {
        var pageHistory;

        // Page history is initially empty
        expect( window.localStorage.getItem( "pageHistory") ).toBeNull();

        // Add a test div with a valid page ID, add the page to the history and verify
        $( "body" ).append( "<div id='equipmentDetailPage' data-role='page'></div>" );
        UIFrame.addCurrentPageToHistory();
        pageHistory = JSON.parse( window.localStorage.getItem( "pageHistory" ) );
        expect( pageHistory.pages.length ).toBe( 1 );
        expect( _.isObject( pageHistory.pages[0] ) ).toBeTruthy();
        expect( pageHistory.pages[0].id ).toBe( "equipmentDetailPage" );
        expect( pageHistory.pages[0].url ).toBe( "equipmentdetail.html" );
        expect( _.isBoolean( pageHistory.pages[0].onTasksMenu ) ).toBeTruthy();
        expect( _.isBoolean( pageHistory.pages[0].additionalHeader ) ).toBeTruthy();

        // Login page is not added to the page history
        $( "#equipmentDetailPage" ).remove();
        $( "body" ).append( "<div id='loginPage' data-role='page'></div>" );
        UIFrame.addCurrentPageToHistory();
        pageHistory = JSON.parse( window.localStorage.getItem( "pageHistory" ) );
        expect( pageHistory.pages.length ).toBe( 1 );
        expect( pageHistory.pages[0].id ).toBe( "equipmentDetailPage" );
        $( "#loginPage" ).remove();

        // Add a test div with a valid page ID, add the page to the history and verify
        $( "body" ).append( "<div id='pmsDuePage' data-role='page'></div>" );
        UIFrame.addCurrentPageToHistory();
        pageHistory = JSON.parse( window.localStorage.getItem( "pageHistory" ) );
        expect( pageHistory.pages.length ).toBe( 2 );
        expect( _.isObject( pageHistory.pages[0] ) ).toBeTruthy();
        expect( pageHistory.pages[0].id ).toBe( "equipmentDetailPage" );
        expect( pageHistory.pages[0].url ).toBe( "equipmentdetail.html" );
        expect( _.isBoolean( pageHistory.pages[0].onTasksMenu ) ).toBeTruthy();
        expect( _.isBoolean( pageHistory.pages[0].additionalHeader ) ).toBeTruthy();
        expect( _.isObject( pageHistory.pages[1] ) ).toBeTruthy();
        expect( pageHistory.pages[1].id ).toBe( "pmsDuePage" );
        expect( pageHistory.pages[1].url ).toBe( "pmsdue.html" );
        expect( _.isBoolean( pageHistory.pages[1].onTasksMenu ) ).toBeTruthy();
        expect( _.isBoolean( pageHistory.pages[1].additionalHeader ) ).toBeTruthy();
        $( "#pmsDuePage" ).remove();

        // Clear page history and verify that it's gone.
        UIFrame.clearPageHistory();
        expect( window.localStorage.getItem( "pageHistory") ).toBeNull();
    } );

    /**
     * Get current page tests
     */
    it( "Get current page tests", function () {
        var page = null;

        // Initially, there is no current page to get
        expect( UIFrame.getCurrentPage() ).toBeNull();

        // Add a test div with a valid page ID and get / verify the page object
        $( "body" ).append( "<div id='manageWorkOrderOverviewPage' data-role='page'></div>" );
        page = UIFrame.getCurrentPage();
        expect( _.isObject( page ) ).toBeTruthy();
        expect( page.id ).toBe( "manageWorkOrderOverviewPage" );
        expect( page.url ).toBe( "manageworkorderoverview.html" );
        expect( _.isBoolean( page.onTasksMenu ) ).toBeTruthy();
        expect( _.isBoolean( page.additionalHeader ) ).toBeTruthy();

        // Remove the test div and verify that get current page returns null
        $( "#manageWorkOrderOverviewPage" ).remove();
        expect( UIFrame.getCurrentPage() ).toBeNull();
    } );

    /**
     * Get current page ID tests
     */
    it( "Get current page ID tests", function () {
        // Initially, there is no current page ID to get
        expect( UIFrame.getCurrentPageId() ).toBeNull();

        // Add a test div with a page ID and get / verify the ID
        $( "body" ).append( "<div id='testPage' data-role='page'></div>" );
        expect( UIFrame.getCurrentPageId() ).toBe( "testPage" );

        // Remove the test div and verify that get current page ID returns null
        $( "#testPage" ).remove();
        expect( UIFrame.getCurrentPageId() ).toBeNull();
    } );

    /**
     * Get image path tests
     */
    it( "Get image path tests", function () {
        expect( UIFrame.getImagePath() ).toBe( "images/" );
    } );

    /**
     * Get page tests
     */
    it( "Get page tests", function () {
        var page = null;

        // Missing / invalid parameter returns null
        expect( UIFrame.getPage() ).toBeNull();
        expect( UIFrame.getPage( "INVALID" ) ).toBeNull();

        // Valid page IDs return page object
        page = UIFrame.getPage( "closeOutDayPage" );
        expect( _.isObject( page ) ).toBeTruthy();
        expect( page.url ).toBe( "closeoutday.html" );
        expect( _.isBoolean( page.onTasksMenu ) ).toBeTruthy();
        expect( _.isBoolean( page.additionalHeader ) ).toBeTruthy();

        page = UIFrame.getPage( "loginPage" );
        expect( _.isObject( page ) ).toBeTruthy();
        expect( page.url ).toBe( "login.html" );
        expect( _.isBoolean( page.onTasksMenu ) ).toBeTruthy();
        expect( _.isBoolean( page.additionalHeader ) ).toBeTruthy();
    } );

    /**
     * Hide and show element tests
     */
    it( "Hide and show element tests", function () {
        // testDiv is hidden by default
        expect( $( "div#testDiv" )[0].style.display ).toBe( "none" );

        // Show element with missing parameters or with selector that finds nothing does nothing
        UIFrame.showElement();
        expect( $( "div#testDiv" )[0].style.display ).toBe( "none" );
        UIFrame.showElement( "div#testDiv" );
        expect( $( "div#testDiv" )[0].style.display ).toBe( "none" );
        UIFrame.showElement( "div#testDiv2", "block" );
        expect( $( "div#testDiv" )[0].style.display ).toBe( "none" );

        // Show and hide testDiv and verify changes
        UIFrame.showElement( "div#testDiv", "inline-block" );
        expect( $( "div#testDiv" )[0].style.display ).toBe( "inline-block" );
        UIFrame.hideElement( "div#testDiv" );
        expect( $( "div#testDiv" )[0].style.display ).toBe( "none" );
        UIFrame.showElement( "div#testDiv", "block" );
        expect( $( "div#testDiv" )[0].style.display ).toBe( "block" );
        UIFrame.hideElement( "div#testDiv" );
        expect( $( "div#testDiv" )[0].style.display ).toBe( "none" );

        // Hide element with missing parameter or with selector that finds nothing does nothing
        UIFrame.showElement( "div#testDiv", "block" );
        expect( $( "div#testDiv" )[0].style.display ).toBe( "block" );
        UIFrame.hideElement();
        expect( $( "div#testDiv" )[0].style.display ).toBe( "block" );
        UIFrame.hideElement( "div#testDiv2" );
        expect( $( "div#testDiv" )[0].style.display ).toBe( "block" );
    } );

    /**
     * Validate page ID tests
     */
    it( "Validate page ID tests", function () {
        // Missing / invalid page ID throws an exception
        expect( function() {
            UIFrame.validatePageId();
        }).toThrow( "UIFrame.validatePageId: Page ID 'undefined' is not part of the Pages array" );
        expect( function() {
            UIFrame.validatePageId( "INVALID" );
        }).toThrow( "UIFrame.validatePageId: Page ID 'INVALID' is not part of the Pages array" );
        // Valid page IDs returns true
        expect( UIFrame.validatePageId( "debugPage" ) ).toBeTruthy();
        expect( UIFrame.validatePageId( "homePage" ) ).toBeTruthy();
        expect( UIFrame.validatePageId( "workOrderListPage" ) ).toBeTruthy();
    } );


} );
