/**
 * uiframe.js
 * 
 * Set up the mobile app's UI frame
 */

"use strict";

/**
 * UIFrame 
 * Using the Revealing Module JavaScript pattern to encapsulate
 * the UI frame functionality into an object
 */
var UIFrame = function() {

    /**
     * UI constants
     */
    var IMAGE_PATH              = "images/";
    var USE_NATIVE_SELECT       = "true";
    
    /**
     * Pages contained in this app
     */
    var Pages = { 
        'indexPage' : {
            url : 'index.html'
        },
        'knockoutDemo' : {
            url : 'knockoutdemo.html'
        }
    };

    /**
     * Navigate to the page specified by url
     * @param url
     * @param skipAddToHistory
     * @param reviewPageId - Used to navigate to the manage work order review pages
     */
    function navigateToPage( url, skipAddToHistory, reviewPageId ) {

        // Prevent reloading the current page
        var currentPage = getCurrentPage();
        var skipNavigation = false;
        if ( url == currentPage.url ) {
            skipNavigation = true;
        }

        if ( !skipNavigation ) {
            $.mobile.showPageLoadingMsg( "a", Localization.getText( "loadingPage" ) + " " + url, true );
            document.location.href = url;
        } else {
            debug && console.log( "UIFrame.navigateToPage: Navigation skipped because page is already loaded" );
        }
    }
    
    /**
     * Return the currently loaded page
     * @returns Page object that contains the page ID and the page URL
     */
    function getCurrentPage() {
        var currentPageId = getCurrentPageId();
        
        // The review pages share the same HTML file with returns the same ID.
        // Use local storage to get the specific review page ID.
        if ( currentPageId == "manageWorkOrderReviewPage" ) {
            currentPageId = window.localStorage.getItem( ManageWorkOrder.LS_REVIEW_PAGE_ID );
        }
        
        var currentPage = Pages[ currentPageId ];
        currentPage.id = currentPageId;
        debug && console.log( "UIFrame.getCurrentPage: ID = " + currentPage.id + 
                              " URL = " + currentPage.url );
        return currentPage;
    }
    
    /**
     * Reload the current page
     */
    function reloadCurrentPage() {
        var currentPage = getCurrentPage();
        debug && console.log( "UIFrame.reloadCurrentPage: Reloading " + currentPage.url );
        document.location.href = currentPage.url; 
    }

    /**
     * Build the page header.
     */
    function buildPageHeaderAndFooter( pageId ) {
        // Common header and footer are built here
        debug && console.log( "UIFrame.buildPageHeaderAndFooter: Building header for page ID: " + pageId );

        // Insert the header and footer HTML and trigger the pagecreate event to 
        // update the DOM (from http://forum.jquery.com/topic/page-level-refresh)
        var currentPage = $( "#" + pageId );
        debug && console.log( "UIFrame.buildPageHeaderAndFooter: Rendering header HTML for : " + pageId );
        var renderedHtml = new EJS( {url: "templates/header"} ).render( {
            pageId : pageId,
        });
        debug && console.log( "UIFrame.buildPageHeaderAndFooter: Prepending header HTML to : " + pageId );
        $(renderedHtml).prependTo( currentPage );
        debug && console.log( "UIFrame.buildPageHeaderAndFooter: Rendering and appending footer HTML to : " + pageId );
        renderedHtml = new EJS( {url: 'templates/footer'} ).render();
        $(renderedHtml).appendTo( currentPage );
        $(currentPage).trigger( 'pagecreate' );
    }

    /**
     * Return the current page ID
     * @returns Current page ID which can serve as a key into Pages 
     */
    function getCurrentPageId() {
        return $("div:jqmData(role='page')")[0].id;
    }

    /**
     * All pages must be part of the Pages object array
     */
    function validatePageId( pageId ) {
        if ( Pages[pageId] == undefined ) {
            throw "UIFrame.validatePageId: Page ID '" + pageId + "' is not part of the Pages array";
        }
    }
    
    /**
     * Get the image path
     */
    function getImagePath() {
        return IMAGE_PATH;
    }

    /**
     * Allow valid numeric characters only
     */
    function allowNumericInputOnly( event ) {
        return (/[0123456789]/.test( String.fromCharCode( event.which ) ) );
    }
    
    /**
     * Allow valid cost input characters only
     */
    function allowCostInputOnly( event ) {
        return (/[\.,0123456789]/.test( String.fromCharCode( event.which ) ) );
    }
    
    /**
     * Bind keypress handlers to the input elements based on the element's class
     */
    function bindKeypressToInputElements() {
        debug && console.log( "UIFrame.bindKeypressToInputElements: Binding keypress handlers" );
        $(".numeric-input").keypress( allowNumericInputOnly );
        $(".cost-input").keypress( allowCostInputOnly );
    }
    
    /**
     * Handle the resume event.
     */
    function onResume() {
        debug && console.log( "UIFrame.onResume: App resumed" );
    }
    
    /**
     * This init method handles UI initialization for all pages in the app.
     * It takes care of the following in this order:
     * - Initializing the JSONData object for use by the UI
     * - Loading the language file for translation purposes
     * - Building common UI elements
     * - Calling the page specific init function if defined
     * - Translating all on screen text
     * 
     * @param pageId - ID of page being initialized
     * @param pageInitFunction - Page specific init function (optional)
     */
    var init = _.once( function( pageId, pageInitFunction ) {
        if ( !pageId ) {
            throw "UIFrame.init: Required parameter pageId is undefined";
        }
        UIFrame.validatePageId( pageId );
        debug && console.log( "UIFrame.init: Initializing UI for page ID: " + pageId );
        
        // Set defaults for dialog boxes
        $.mobile.simpledialog2.prototype.options.animate = false;
        $.mobile.simpledialog2.prototype.options.forceInput = true;
        $.mobile.simpledialog2.prototype.options.transition = "none";
        
        // Initialize the JSON data.  The rest of UIFrame.init is executed
        // when JSONData.init completes.
        JSONData.init( pageId, function() {
            Localization.loadLanguage( function() {
                debug && console.log( "UIFrame.init: Language successfully loaded" );
                
                // Build the common UI parts
                buildPageHeaderAndFooter( pageId );
                
                // Call the page specific init function if defined
                if ( pageInitFunction ) {
                    debug && console.log( "UIFrame.init: Calling page specific init function" );
                    pageInitFunction( pageId );
                } else {
                    debug && console.log( "UIFrame.init: Page specific init function is undefined" );
                }
                
                // Restrict allowed keypresses inside certain input elements
                bindKeypressToInputElements();
                
                // Bind a handler to the resume event
                document.addEventListener( "resume", onResume, false );                
                
                // Translate everything
                Localization.translate();
            });
        });
    });
    
    /**
     * Is a dialog currently being displayed?
     */
    function isDialogDisplayed() {
        return $(".ui-simpledialog-container").length == 1;
    }
    
    /**
     * Close an open dialog.  Any post-close UI updates are handled by this method.
     */
    function closeActiveDialog() {
        if ( isDialogDisplayed() ) {
            debug && console.log( "UIFrame.closeActiveDialog: Closing currently displayed dialog" );
            $.mobile.sdCurrentDialog.close();
        } else {
            debug && console.log( "UIFrame.closeActiveDialog: Close skipped because no dialog is currently displayed" );
        }
    }
    
    /**
     * After each page finishes with its page specific initialization,
     * this method is called to perform all common post page specific initialization
     * @param pageId - ID of page being initialized
     */
    function postPageSpecificInit( pageId ) {
        debug && console.log( "UIFrame.postPageSpecificInit: Performing common post page specific initialization for page id: " + pageId );
        // Fix for JIRA issue SFAM-15 - Set style for header to fixed when a list divider is clicked  
        $(".ui-li-divider").click( function( event ) {
            debug && console.log( "UIFrame.ui-li-divider.click: Setting header position back to fixed");
            $("#header").css( "position", "fixed" );
        });
        
        // Prevent taps from turning off fixed headers and footers
        $("[data-role=header]").fixedtoolbar({ tapToggle: false });
        $("[data-role=footer]").fixedtoolbar({ tapToggle: false });

        debug && console.log( "UIFrame.postPageSpecificInit: Finished" );
    }
    
    
    
    // Public accessible methods are exposed here
    return {
        'USE_NATIVE_SELECT'                         : USE_NATIVE_SELECT,
        'allowCostInputOnly'                        : allowCostInputOnly,
        'allowNumericInputOnly'                     : allowNumericInputOnly,
        'bindKeypressToInputElements'               : bindKeypressToInputElements,               
        'buildPageHeaderAndFooter'                  : buildPageHeaderAndFooter,
        'closeActiveDialog'                         : closeActiveDialog,
        'getCurrentPage'                            : getCurrentPage,
        'getCurrentPageId'                          : getCurrentPageId,
        'getImagePath'                              : getImagePath,
        'init'                                      : init,
        'isDialogDisplayed'                         : isDialogDisplayed,
        'navigateToPage'                            : navigateToPage,
        'postPageSpecificInit'                      : postPageSpecificInit,
        'reloadCurrentPage'                         : reloadCurrentPage,
        'validatePageId'                            : validatePageId
    };
}();
