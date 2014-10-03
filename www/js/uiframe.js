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
    var navigateToPageSaveChangesFn = null;

    /**
     * UI constants
     */
    var GUIDED_SEARCH_ITEM                = ".guided-search-item";
    var GUIDED_SEARCH_ITEM_DEFAULT_CLASS  = "ui-btn-up-c";
    var GUIDED_SEARCH_ITEM_SELECTED_CLASS = "ui-btn-up-e";
    var IMAGE_PATH                        = "images/";
    var USE_NATIVE_SELECT                 = "true";
    var USE_NATIVE_TASKS_MENU             = "useNativeTasksMenu";
    var USE_PHONEGAP_LOADURL_PLUGIN       = "usePhonegapPluginForPageNavigation";
    var USE_SCROLLABLE_DIVS               = "useScrollableDivs";

    /**
     * Local storage locations
     */
    var LS_CURRENT_PAGE                   = "currentPage";
    var LS_CURRENT_TECHNICIAN_STATUS      = "currentTechnicianStatus";
    var LS_CURRENT_WORK_ORDER_STATUS      = "currentWorkOrderStatus";
    var LS_PAGE_HISTORY                   = "pageHistory";
    var LS_PAGE_AFTER_SAVE_COMPLETES      = "pageAfterSaveCompletes";
    var LS_REVIEW_PAGE_ID               = "reviewPageId";

    // Apply Dispatched filter when work order list page loads?
    var LS_APPLY_DISPATCHED_WORKORDER_FILTER = "applyDispatchedFilter";

    /**
     * Local storage flag indicating if there are unsaved changes on the current page
     */
    var LS_UNSAVED_CHANGES = "unsavedChanges";

    /**
     * Initial page load list filtering constants
     */
    var INIT_FILTERS = [
        "plannedMaintenanceFilter",
        JSONData.LS_INITIAL_WORK_ORDER_LIST_FILTER
    ];

    /**
     * Default start time picker options
     */
    var defaultDateTimePickerOptions = {
        display: 'inline',
        maxDate: new Date(),
        mode: 'scroller',
        preset: 'time',
        showLabel: false,
        theme: 'jqm'
    };

    /**
     * Associative array containing the HTML generation information for each page
     * inside the mobile app.  The key is the HTML ID for the page and must match
     * the id inside the page's <div data-role="page"> element.
     */
    var Pages = {
        'closeOutDayPage' : {
            url : 'closeoutday.html',
            onTasksMenu : false,
            additionalHeader : false
        },
        'customersPage' : {
            url : 'customers.html',
            onTasksMenu : true,
            additionalHeader : true
        },
        'customerEquipmentPage' : {
            url : 'customerequipment.html',
            onTasksMenu : false,
            additionalHeader : true
        },
        'debugPage' : {
            url : 'debug.html',
            onTasksMenu : false,
            additionalHeader : false
        },
        'equipmentDetailPage' : {
            url : 'equipmentdetail.html',
            onTasksMenu : false,
            additionalHeader : true
        },
        'homePage' : {
            url : 'home.html',
            onTasksMenu : false,
            additionalHeader : false
        },
        'manageWorkOrderCustomerReviewPage' : {
            url : 'manageworkorderreview.html',
            onTasksMenu : false,
            additionalHeader : true
        },
        'manageWorkOrderDiagnosticsPage' : {
            url : 'manageworkorderdiagnostics.html',
            onTasksMenu : false,
            additionalHeader : true
        },
        'manageWorkOrderOverviewPage' : {
            url : 'manageworkorderoverview.html',
            onTasksMenu : false,
            additionalHeader : true
        },
        'manageWorkOrderPartsPage' : {
            url : 'manageworkorderparts.html',
            onTasksMenu : false,
            additionalHeader : true
        },
        'manageWorkOrderRepairDetailsPage' : {
            url : 'manageworkorderrepairdetails.html',
            onTasksMenu : false,
            additionalHeader : true
        },
        'manageWorkOrderReviewPage' : {
            url : 'manageworkorderreview.html',
            onTasksMenu : false,
            additionalHeader : true
        },
        'manageWorkOrderTechnicianReviewPage' : {
            url : 'manageworkorderreview.html',
            onTasksMenu : false,
            additionalHeader : true
        },
        'mapPage' : {
            url : 'map.html',
            onTasksMenu : false,
            additionalHeader : false
        },
        'messagesPage' : {
            url : 'messages.html',
            onTasksMenu : false,
            additionalHeader : false
        },
        'pmsDuePage' : {
            url : 'pmsdue.html',
            onTasksMenu : true,
            additionalHeader : true
        },
        'serviceQuotesPage' : {
            url : 'servicequotes.html',
            onTasksMenu : false,
            additionalHeader : false
        },
        'timeSheetPage' : {
            url : 'timesheet.html',
            onTasksMenu : true,
            additionalHeader : true
        },
        'vanInventoryPage' : {
            url : 'vaninventory.html',
            onTasksMenu : true,
            additionalHeader : true
        },
        'vanInventoryAddPage' : {
            url : 'vaninventoryadd.html',
            onTasksMenu : false,
            additionalHeader : true
        },
        'workOrderListPage' : {
            url : 'workorderlist.html',
            onTasksMenu : true,
            additionalHeader : true
        },
        'workOrderDetailsPage' : {
            url : 'workorderlist.html',
            onTasksMenu : false,
            additionalHeader : false
        },
        'workOrderHistoryReviewPage' : {
            url : 'workorderhistoryreview.html',
            onTasksMenu : false,
            additionalHeader : true
        },
        'loginPage' : {
            url : 'login.html',
            navigateFunction : JSONData.logoff,
            onTasksMenu : true,
            additionalHeader : false
        }
    };
    var pagesWithoutCommonHeaderAndFooter = [ "closeOutDayPage", "customerEquipmentPage", "equipmentDetailPage", "loginPage", "pmsDueListFrame",
                                              "vanInventoryPage", "vanInventoryAddPage", "workOrderHistoryReviewPage", "workOrderListFrame" ];

    // Preload commonly used EJS templates
    var guidedSearchTemplate;
    var guidedSearchWithIconTemplate;
    try {
        //noinspection JSUnresolvedVariable
        guidedSearchTemplate         = new EJS({url: 'templates/guidedsearchitem'});
        //noinspection JSUnresolvedVariable
        guidedSearchWithIconTemplate = new EJS({url: 'templates/guidedsearchitemwithicon'});
    } catch ( exc ) {
        console.warn( "UIFrame: Ignoring EJS preload exception" );
    }

    /**
     * Handle window onload to process UI changes that can only occur
     * after the document is loaded.
     */
    $(window).load( function() {
        adjustListViewBorders();
    });

    /**
     * Adjust the borders on the list views so that the longer list always
     * gets the middle border drawn
     */
    function adjustListViewBorders() {
        // Fix the borders on pages that have guided search on the left and another list on the right
        var guidedSearchLists = $("div.guided-search-block-div").children("ul");
        var contentLists = $("div.list-block-div").children("ul");
        if ( guidedSearchLists.length > 0 && contentLists.length > 0 &&
             guidedSearchLists.length == contentLists.length ) {
            debug && console.log( "UIFrame.adjustListViewBorders: Fixing borders on list views" );

            // Include the height of the list search area when calculating the
            // height of the content list
            var listSearchForm = $("form.ui-listview-filter");
            if ( listSearchForm.length == 0 ) {
                listSearchForm = $("#inventorySearchDiv");
            }
            var listSearchHeight = 0;
            if ( listSearchForm.length == 1 ) {
                listSearchHeight = listSearchForm.height();
            }
            // Turn off the border for all list items inside the shorter list
            for ( var index = 0; index < guidedSearchLists.length; index++ ) {
                if ( $( guidedSearchLists[index] ).height() >= ( $( contentLists[index] ).height() + listSearchHeight ) ) {
                    debug && console.log( "UIFrame.adjustListViewBorders: Using guided search border" );
                    listSearchForm.css( "border-left", "none" );
                    $( guidedSearchLists[index] ).children( "li" ).css( "border-right", "solid 1px black" );
                    $( contentLists[index] ).children( "li" ).css( "border-left", "none" );
                } else {
                    debug && console.log( "UIFrame.adjustListViewBorders: Using list content border" );
                    listSearchForm.css( "border-left", "solid 1px black" );
                    $( guidedSearchLists[index] ).children( "li" ).css( "border-right", "none" );
                    $( contentLists[index] ).children( "li" ).css( "border-left", "solid 1px black" );
                }
                // Add a bottom border to the last list item in each of the lists
                $(guidedSearchLists[index]).children('li').last().css( "border-bottom", "solid 1px black" );
                $(contentLists[index]).children('li').last().css( "border-bottom", "solid 1px black" );
            }
        }
    }

    /**
     * Add the current page to the page history.  The login page is not added to the history.
     */
    function addCurrentPageToHistory() {
        var currentPage = getCurrentPage();
        if ( currentPage.id != "loginPage" ) {
            debug && console.log( "UIFrame.addCurrentPageToHistory: Adding current page '" +
                                  currentPage.id + "' to page history in local storage" );
            var pageHistory = window.localStorage.getItem( LS_PAGE_HISTORY );
            if ( pageHistory == null ) {
                debug && console.log( "UIFrame.addCurrentPageToHistory: page history being created because it does not exist" );
                pageHistory = {};
                pageHistory.pages = [];
            } else {
                pageHistory = JSON.parse( pageHistory );
            }
            pageHistory.pages.push( currentPage );
            window.localStorage.setItem( LS_PAGE_HISTORY, JSON.stringify( pageHistory ) );
        }
    }

    /**
     * Get previous page from page history
     * @returns Previous page URL or null if it does not exist
     */
    function getPreviousPageFromHistory() {
        var previousPage = null;
        var pageHistory = window.localStorage.getItem( LS_PAGE_HISTORY );
        if ( pageHistory ) {
            pageHistory = JSON.parse( pageHistory );
            if ( pageHistory.pages.length > 0 ) {
                previousPage = pageHistory.pages.pop();
                window.localStorage.setItem( LS_PAGE_HISTORY, JSON.stringify( pageHistory ) );
                debug && console.log( "UIFrame.getPreviousPageFromHistory: Previous page = '" + previousPage.id + "'" );
            }
        }
        return previousPage;
    }

    /**
     * Clear the page history
     */
    function clearPageHistory() {
        debug && console.log( "UIFrame.clearPageHistory: Removing page history from local storage" );
        window.localStorage.removeItem( LS_PAGE_HISTORY );
    }

    /**
     * Load the specified URL. If running on Android, the PhoneGap URL plugin
     * is used.  Otherwise the standard window.location.href is used.
     * @param url
     */
    function loadUrl( url ) {
        debug && console.log( "UIFrame.loadUrl: Using window.location.replace() to load " + url );
        window.location.replace( url );
        debug && console.log( "UIFrame.loadUrl: URL loaded via window.location.replace()" );

        /*
        var urlLoaded = true;
        if ( Config.getConfig()[ USE_PHONEGAP_LOADURL_PLUGIN ] && window.LoadURL ) {
            debug && console.log( "UIFrame.loadUrl: Using LoadURL Phonegap plugin to load " + url );
            window.LoadURL( { url : url },
                function() {
                    debug && console.log( "UIFrame.loadUrl: LoadURL successful" );
                },
                function() {
                    console.error( "UIFrame.loadUrl: LoadURL Phonegap plugin failed." );
                    urlLoaded = false;
                }
            );
        } else {
            urlLoaded = false;
        }
        if ( !urlLoaded ) {
        }
        */
    }

    /**
     * Navigate to the page specified by url
     * @param url
     * @param skipAddToHistory
     * @param reviewPageId - Used to navigate to the manage work order review pages
     */
    function navigateToPage( url, skipAddToHistory, reviewPageId ) {
        resetTasksMenuSelection();
        var completeNavigationFn = function() {

            // Completing the navigation to a new page always clears the following:
            // Unsaved changes, app paused, app resumed, page after save completes
            // and always clears the app paused/resumed flags
            window.localStorage.removeItem( LS_UNSAVED_CHANGES );
            window.localStorage.removeItem( LS_PAGE_AFTER_SAVE_COMPLETES );
            if ( url !== "debug.html" ) {
                window.localStorage.removeItem( JSONData.LS_APP_PAUSED );
                window.localStorage.removeItem( JSONData.LS_APP_RESUMED );
            }

            // SFAM-180: All attempts to navigate to a different page will update the
            // technician status in the footer so that the time reflects the current timezone
            if ( url !== "login.html") {
                updateCurrentTechnicianStatus( null );
            }

            // Prevent reloading the current page
            var currentPage = getCurrentPage();
            var skipNavigation = false;
            if ( url == currentPage.url &&
                currentPage.id != "manageWorkOrderOverviewPage" &&
                currentPage.id != "manageWorkOrderCustomerReviewPage" &&
                currentPage.id != "manageWorkOrderTechnicianReviewPage" ) {
                skipNavigation = true;
            }

            if ( !skipNavigation ) {

                // Ensure that footer is displaying the correct work order document number
                updateCurrentWorkOrderStatus();

                if ( _.isUndefined( skipAddToHistory ) ) {
                    skipAddToHistory = false;
                }
                if ( !skipAddToHistory ) {
                    addCurrentPageToHistory();
                }
                debug && console.log( "UIFrame.navigateToPage: Getting the page title for the loading message" );

                var pageTitle = "";
                // Use reviewPageId if specified to find review page title
                if ( reviewPageId != undefined && reviewPageId != null ) {
                    pageTitle = Localization.getText( reviewPageId );
                } else {
                    // Otherwise, use the url to find the page title
                    for ( var pageId in Pages ) {
                        if ( getPage( pageId ).url == url ) {
                            pageTitle = Localization.getText( pageId );
                            break;
                        }
                    }
                }

                // If current URL is the login page, close the "attempting logon" progress dialog
                if ( currentPage.id == "loginPage" ) {
                    Dialog.closeDialog( false );
                }

                debug && console.log( "UIFrame.navigateToPage: Showing page loading message for " + pageTitle );
                $.mobile.showPageLoadingMsg( "a", Localization.getText( "loadingPage" ) + " " + pageTitle, true );
                debug && console.log( "UIFrame.navigateToPage: About to navigate to " + url );
                // Save new URL as current page so automatic logon can get back to this page
                if ( url != "debug.html" ) {
                    window.localStorage.setItem( LS_CURRENT_PAGE, url );
                }
                loadUrl( url );
            } else {
                debug && console.log( "UIFrame.navigateToPage: Navigation skipped because page is already loaded" );
            }
        };

        // Write additional page ID to local storage to load correct review page
        if ( reviewPageId != undefined && reviewPageId != null ) {
            window.localStorage.setItem( LS_REVIEW_PAGE_ID, reviewPageId );
        }

        if ( window.localStorage.getItem( LS_UNSAVED_CHANGES ) &&
             !window.localStorage.getItem( JSONData.LS_CURRENT_WORK_ORDER_DELETED ) ) {
            if ( navigateToPageSaveChangesFn && _.isFunction( navigateToPageSaveChangesFn ) ) {
                Dialog.showConfirmYesNo( Localization.getText( "leavingPageTitle" ),
                                         Localization.getText( "leavingPageSaveChangesPrompt" ),
                    // Yes tapped
                    function() {
                        // Close the prompt dialog, save unsaved changes without a post to the MT
                        // and complete the page navigation
                        Dialog.closeDialog( false );
                        window.localStorage.setItem( LS_PAGE_AFTER_SAVE_COMPLETES, url );
                        navigateToPageSaveChangesFn( false );
                    },
                    // No tapped
                    function() {
                        // Close the prompt dialog, do not save changes
                        // and complete the page navigation
                        Dialog.closeDialog( false );
                        completeNavigationFn();
                    }, '400px'
                );
            } else {
                // If save changes function is not set, prompt user to continue navigation and lose
                // unsaved changes
                Dialog.showConfirmYesNo( Localization.getText( "leavingPageTitle" ),
                                         Localization.getText( "leavingPagePrompt" ),
                    function() {
                        Dialog.closeDialog( false );
                        completeNavigationFn();
                    }, null, '400px'
                );
            }
        } else {
            completeNavigationFn();
        }
    }

    /**
     * Set the navigateToPage save changes function.  This function is called
     * by navigateToPage() if the user taps Yes in response to the save unsaved changes
     * prompt.
     *
     * NOTE: navigateToPage will pass false as the first parameter to the save changes funciton.
     *       The save changes function should use this to skip a post to the middle tier
     */
    function setNavigateToPageSaveChangesFunction( saveChangesFn ) {
        if ( saveChangesFn && _.isFunction( saveChangesFn ) ) {
            debug && console.log( "UIFrame.setNavigateToPageSaveChangesFunction: Setting navigateToPage save changes function" );
            navigateToPageSaveChangesFn = saveChangesFn;
        } else {
            debug && console.log( "UIFrame.setNavigateToPageSaveChangesFunction: saveChangesFn parameter is not a function" );
        }
    }

    /**
     * Navigate to the page saved in local storage after a save completes
     */
    function navigateToPageAfterSaveCompletes() {
        var page = window.localStorage.getItem( LS_PAGE_AFTER_SAVE_COMPLETES );
        if ( page ) {
            navigateToPage( page, false, window.localStorage.getItem( LS_REVIEW_PAGE_ID ) );
        }
    }

    /**
     * Navigate to the previous page in the page history
     */
    function navigateToPreviousPage() {
        var previousPage = getPreviousPageFromHistory();
        if ( previousPage ) {
            // Review pages share the same URL. Write out local storage item
            // to load the correct review page.
            debug && console.log( "UIFrame.navigateToPreviousPage: Navigating to " + previousPage.id );
            if ( previousPage.id == "manageWorkOrderCustomerReviewPage" ||
                 previousPage.id == "manageWorkOrderTechnicianReviewPage" ) {
                window.localStorage.setItem( LS_REVIEW_PAGE_ID, previousPage.id );
                navigateToPage( previousPage.url, true, previousPage.id );
            } else {
                navigateToPage( previousPage.url, true, null );
            }
        } else {
            debug && console.log( "UIFrame.navigateToPreviousPage: No previous page in history" );
        }
    }

    /**
     * Get the Pages object for the specified page ID
     * @pageId - Page ID
     */
    function getPage( pageId ) {
        var page = null;
        if ( !_.isUndefined( pageId ) && !_.isNull( pageId ) ) {
            page = Pages[ pageId ];
        }
        if ( !page ) {
            page = null;
        }
        return page;
    }

    /**
     * Return the currently loaded page
     * @returns Object containing Page that contains the page ID and the page URL
     */
    function getCurrentPage() {
        var currentPage;
        var currentPageId = getCurrentPageId();

        // The review pages share the same HTML file which returns the same ID.
        // Use local storage to get the specific review page ID.
        if ( currentPageId == "manageWorkOrderReviewPage" ) {
            currentPageId = window.localStorage.getItem( LS_REVIEW_PAGE_ID );
        }

        currentPage = getPage( currentPageId );
        if ( currentPage ) {
            currentPage.id = currentPageId;
            debug && console.log( "UIFrame.getCurrentPage: ID = " + currentPage.id +
                                  " URL = " + currentPage.url );
        } else {
            currentPage = null;
        }
        return currentPage;
    }

    /**
     * Reload the current page
     */
    function reloadCurrentPage() {
        // Ensure that footer is displaying the correct work order document number
        updateCurrentWorkOrderStatus();
        var completeReloadFn = function() {
            var currentPage = getCurrentPage();
            debug && console.log( "UIFrame.reloadCurrentPage: Reloading " + currentPage.url );
            $.mobile.showPageLoadingMsg( "a", Localization.getText( "reloadingCurrentPage" ) + " " +
                                         Localization.getText( currentPage.id ), true );
            window.location.replace( currentPage.url );
        };
        if ( window.localStorage.getItem( LS_UNSAVED_CHANGES ) ) {
            Dialog.showConfirmYesNo( Localization.getText( "leavingPageTitle" ),
                                     Localization.getText( "leavingPagePrompt" ),
                function() {
                    Dialog.closeDialog( false );
                    window.localStorage.removeItem( LS_UNSAVED_CHANGES );
                    completeReloadFn();
                }, null, '400px'
            );
        } else {
            completeReloadFn();
        }
    }

    /**
     * Build the page header.
     */
    function buildPageHeaderAndFooter( pageId ) {
        var additionalHeaderTemplate;
        var config = Config.getConfig();
        var currentPage = $( "#" + pageId );
        var customerEquipmentPageHeader;
        var renderedHtml;
        var serverIndicatorText;
        var useNativeTasksMenu = true;

        if ( pageId != "loginPage" ) {
            var middleTierLabel = config.middleTierLabel;
            // SFAM-205: Use native tasks menu?
            useNativeTasksMenu = config[USE_NATIVE_TASKS_MENU];
            debug && console.log( "UIFrame.buildPageHeaderAndFooter: Using native tasks menu = " + useNativeTasksMenu );
        }

        if ( pagesWithoutCommonHeaderAndFooter.indexOf( pageId ) != -1 ) {
            debug && console.log( "UIFrame.buildPageHeaderAndFooter: Page ID " + pageId + " does not use the common header / footer" );

            switch ( pageId ) {
                case "closeOutDayPage" :
                    var closeOutDayHeader = new EJS( {url: "templates/header_closeoutdaypage"} ).render( {
                        pageId : pageId
                    });
                    $(closeOutDayHeader).prependTo( currentPage );
                    $(currentPage).trigger( 'pagecreate' );
                    break;

                case "customerEquipmentPage" :
                    customerEquipmentPageHeader = new EJS({ url: "templates/header_customerequipmentpage" }).render( {
                        pageId : pageId
                    });
                    $( customerEquipmentPageHeader ).prependTo( currentPage );

                    if( !window.localStorage.getItem( "invokingPage" )) {
                        $( new EJS({ url: 'templates/footer' }).render()).prependTo( currentPage );
                        $("#footerViewButton").click( function() {
                            WorkOrder.setManageWorkOrderId( WorkOrder.getCurrentWorkOrderId() );
                            navigateToPage( "manageworkorderoverview.html" );
                        });
                        $("#clockIcon").click( function() {
                            JSONData.changeClockingStatus( "", null, null );
                        });
                    }

                    $(currentPage).trigger( 'pagecreate' );

                    // Update the footer with the current work order if its available
                    displayCurrentWorkOrderStatus();

                    // Update the footer with the current technician clock status if its available
                    displayCurrentTechnicianStatus();

                    break;

                case "equipmentDetailPage" :
                    customerEquipmentPageHeader = new EJS({ url: "templates/header_equipmentdetailpage" }).render( {
                        pageId : pageId
                    });
                    $(customerEquipmentPageHeader).prependTo( currentPage );

                    if( !window.localStorage.getItem( "invokingPage" )) {
                        $( new EJS({ url: 'templates/footer' }).render()).prependTo( currentPage );
                        $("#footerViewButton").click( function() {
                            WorkOrder.setManageWorkOrderId( WorkOrder.getCurrentWorkOrderId() );
                            navigateToPage( "manageworkorderoverview.html" );
                        });
                        $("#clockIcon").click( function() {
                            JSONData.changeClockingStatus( "", null, null );
                        });
                    }

                    $(currentPage).trigger( 'pagecreate' );

                    // Update the footer with the current work order if its available
                    displayCurrentWorkOrderStatus();

                    // Update the footer with the current technician clock status if its available
                    displayCurrentTechnicianStatus();
                    break;

                case "vanInventoryPage" :
                    additionalHeaderTemplate = "templates/header_" + pageId.toLowerCase();
                    renderedHtml = new EJS( {url: "templates/header"} ).render( {
                        pageId : pageId,
                        additionalHeaderTemplate : additionalHeaderTemplate,
                        useNativeTasksMenu : useNativeTasksMenu
                    });
                    $(renderedHtml).prependTo( currentPage );
                    renderedHtml = new EJS( {url: 'templates/footer'} ).render();
                    $(renderedHtml).appendTo( currentPage );
                    $(currentPage).trigger( 'pagecreate' );

                    // Build the tasks menu that appears on the header
                    buildTasksMenu();

                    // Update the footer with the current work order if its available
                    displayCurrentWorkOrderStatus();

                    // Update the footer with the current technician clock status if its available
                    displayCurrentTechnicianStatus();

                    // Set the click event handlers for the icons inside the header and footer
                    $("#homeIcon").click( function() {
                        navigateToPage( "home.html", false, null );
                    });
                    $("#messagesIcon").click( function() {
                        navigateToPage( "messages.html", false, null );
                    });
                    $("#questionMarkIcon").click( function() {
                        Dialog.showAbout();
                    });

                    $("#footerViewButton").click( function() {
                        WorkOrder.setManageWorkOrderId( WorkOrder.getCurrentWorkOrderId() );
                        navigateToPage( "manageworkorderoverview.html", false, null );
                    });
                    $("#clockIcon").click( function() {
                        JSONData.changeClockingStatus( "", null, null );
                    });

                    break;
                case "vanInventoryAddPage" :
                    renderedHtml = new EJS( {url: "templates/header_vaninventoryaddpage"} ).render( {
                        pageId : pageId
                    });

                    $(renderedHtml).prependTo( currentPage );
                    $(currentPage).trigger( 'pagecreate' );

                    break;
                case "workOrderHistoryReviewPage" :
                    renderedHtml = new EJS( {url: "templates/header_workorderhistoryreviewpage"} ).render( {
                        pageId : pageId
                    });

                    $(renderedHtml).prependTo( currentPage );
                    $(currentPage).trigger( 'pagecreate' );
                    break;
            }
        } else {
            // Common header and footer are built here
            debug && console.log( "UIFrame.buildPageHeaderAndFooter: Building header for page ID: " + pageId );

            // Insert the header and footer HTML and trigger the pagecreate event to
            // update the DOM (from http://forum.jquery.com/topic/page-level-refresh)
            additionalHeaderTemplate = "";
            if ( getPage( pageId ).additionalHeader ) {
                debug && console.log( "UIFrame.buildPageHeaderAndFooter: Adding additional header for page ID: " + pageId );
                // All of the manage work order pages use the same additional header template
                if ( pageId.indexOf( "manageWorkOrder" ) == 0 ) {
                    additionalHeaderTemplate = "templates/header_manageworkorder";
                } else {
                    additionalHeaderTemplate = "templates/header_" + pageId.toLowerCase();
                }
            }
            debug && console.log( "UIFrame.buildPageHeaderAndFooter: Rendering header HTML for : " + pageId );
            renderedHtml = new EJS( {url: "templates/header"} ).render( {
                pageId : pageId,
                additionalHeaderTemplate : additionalHeaderTemplate,
                useNativeTasksMenu : useNativeTasksMenu
            });
            debug && console.log( "UIFrame.buildPageHeaderAndFooter: Prepending header HTML to : " + pageId );
            $(renderedHtml).prependTo( currentPage );
            debug && console.log( "UIFrame.buildPageHeaderAndFooter: Rendering and appending footer HTML to : " + pageId );
            renderedHtml = new EJS( {url: 'templates/footer'} ).render();
            $(renderedHtml).appendTo( currentPage );
            $(currentPage).trigger( 'pagecreate' );

            // Build the tasks menu that appears on the header
            buildTasksMenu();

            // Update the footer with the current work order if its available
            displayCurrentWorkOrderStatus();

            // Update the footer with the current technician clock status if its available
            displayCurrentTechnicianStatus();

            // Swap the images for the icon buttons when they are tapped to make it
            // more visibly clear that they were tapped.
            var iconButtons = $(".icon-button");
            iconButtons.on( "vmouseover vmousedown", function( event ) {
                var newImgSrc = $(event.target).attr( "src" ).replace( "-up.png", "-down.png" );
                $(event.target).attr( "src", newImgSrc );
            });
            iconButtons.on( "vmouseout vmouseup vclick", function( event ) {
                var newImgSrc = $(event.target).attr( "src" ).replace( "-down.png", "-up.png" );
                $(event.target).attr( "src", newImgSrc );
            });

            // Set the click event handlers for the icons inside the header and footer
            $("#homeIcon").click( function() {
                navigateToPage( "home.html" );
            });
            $("#messagesIcon").click( function() {
                navigateToPage( "messages.html" );
            });
            $("#questionMarkIcon").click( function() {
                Dialog.showAbout();
            });
            $("#footerViewButton").click( function() {
                WorkOrder.setManageWorkOrderId( WorkOrder.getCurrentWorkOrderId() );
                WorkOrder.setManageWorkOrderWritable( true );
                WorkOrder.setManageWorkOrderActivity( WorkOrder.MANAGE_WORK_ORDER_OPEN );
                navigateToPage( "manageworkorderoverview.html" );
            });
            $("#clockIcon").click( function() {
                JSONData.changeClockingStatus( "", null, null );
            });
        }

        // Toolbox icon tap opens work order list page
        $("#toolboxIcon").click( function() {
            // Automatically apply dispatched work orders filter if new work orders exist
            if ( WorkOrder.getNewWorkOrderCount( null ) > 0 ) {
                window.localStorage.setItem( LS_APPLY_DISPATCHED_WORKORDER_FILTER, "true" );
            } else {
                window.localStorage.removeItem( LS_APPLY_DISPATCHED_WORKORDER_FILTER );
            }
            navigateToPage( "workorderlist.html", false, null );
        });

        // Display the version inside the header
        if ( config && config.version ) {
            $("#versionIndicator").text( config.version );
        }
        // SFAM-212: Display server indicator inside the header
        if ( Config.isTrainingMode() ) {
            serverIndicatorText = Localization.getText( "trainingServer" );
        } else {
            serverIndicatorText = Localization.getText( middleTierLabel );
        }
        $("#serverIndicator").text( serverIndicatorText );

        // If read only mode, change online indicator to read only
        if ( config && config.readOnlyMode ) {
            $("#onlineIndicator").text( Localization.getText( "readOnly" ) );
        } else {
            // Set the online indicator in the header
            if ( Util.isOnline( false ) ) {
                $("#onlineIndicator").text( Localization.getText( "online" ) );
            } else {
                $("#onlineIndicator").text( Localization.getText( "offline" ) );
            }
        }
    }

    /**
     * Populate the tasks menu.  The value for each option in the
     * menu is the ID for the page that will be opened when that task
     * option is tapped.
     */
    function buildTasksMenu() {
        debug && console.log( "UIFrame.buildTasksMenu: Building tasks menu" );
        var tasksMenu = $('#tasksMenuSelect');
        tasksMenu.children('option').remove();
        var tasksText = Localization.getText( "tasks" );
        tasksMenu.append( '<option id="tasksPlaceHolder" value="' + tasksText + '" selected="selected" data-placeholder="true">' +
                          tasksText + '</option>\n' );
        for ( var index in Pages ) {
            if ( getPage( index ).onTasksMenu ) {
                tasksMenu.append(
                    '<option id="' + index + '" value="' + index + '">' +
                    Localization.getText( index ) + '</option>\n'
                );
            }
        }
        tasksMenu.selectmenu( "refresh" );

        // Changing the tasks menu selected option will
        // navigate to the selected task page
        tasksMenu.change( function() {
            navigateToTaskPage( $(this).val() );
        });
    }

    /**
     * Reset the tasks menu selection to the Tasks placeholder
     */
    function resetTasksMenuSelection() {
        var tasksMenu = $('#tasksMenuSelect');
        tasksMenu.val( "Tasks" );
        tasksMenu.selectmenu( "refresh" );
    }

    /**
     * Navigate to the task page specified by pageId.
     * If the page has a navigate function, use it to perform the navigation.
     * Otherwise, navigate directly to it.
     * @param pageId
     */
    function navigateToTaskPage( pageId ) {
        debug && console.log( "UIFrame.navigateToTaskPage: Navigating to page ID " + pageId );
        var page = getPage( pageId );

        // Check for a PSRT launch request
        if( page.url == 'crowncatalog.html' ) {

            Util.startPSRT();

            // Refresh the TasksMenu display to "tasks"
            var taskOptionSelector = "#tasksMenuSelect option[value='" + Localization.getText( "tasks" ) + "']";
            $( taskOptionSelector ).attr( "selected", "selected" );
            $( "#tasksMenuSelect" ).selectmenu( 'refresh' );
        } else if ( _.has( page, "navigateFunction" ) && _.isFunction( getPage( pageId ).navigateFunction) ) {
            getPage( pageId ).navigateFunction();
        } else {
            navigateToPage( getPage( pageId ).url );
        }
    }

    /**
     * Update the message count badge on the messages icon.
     * If the message count is 0, the badge is removed.
     */
    function updateMessageCountBadge( count ) {
        debug && console.log( "UIFrame.updateMessageCountBadge: Changing message count to " + count );
        $('#messagesIcon').mobileBadge( {
            count: count,
            position: 'topright'
        });
    }

    /**
     * Update the count badge on the toolbox icon.
     * If the new work
     * @param count - New work order count, optional.  If undefined,
     *                WorkOrder.getNewWorkOrderCount() is called.
     */
    function updateToolboxCountBadge( count ) {
        if ( count === undefined ) {
            count = WorkOrder.getNewWorkOrderCount( null );
        }
        debug && console.log( "UIFrame.updateToolboxCountBadge: Changing toolbox count to " + count );
        var toolboxIcon = $('#toolboxIcon');
        if ( toolboxIcon.mobileBadge ) {
            toolboxIcon.mobileBadge( {
                count: count,
                position: 'topright'
            });
            toolboxIcon.hide().show();
            $("div#header").trigger( 'click' );
        }
    }

    /**
     * Update the current work order status.  This information is displayed in the footer
     * on every page
     */
    function updateCurrentWorkOrderStatus() {
        var currentWorkOrder = WorkOrder.getCurrentWorkOrder();
        var currentWorkOrderStatusText = "";
        var customer;
        debug && console.log( "UIFrame.updateCurrentWorkOrderStatus: Changing current work order in footer" );
        if ( currentWorkOrder ) {
            customer = JSONData.getObjectById( "customers", currentWorkOrder.customerId, null );
            if ( customer ) {
                currentWorkOrderStatusText = Localization.getText("currentWorkOrder") + " " +
                                             customer.name +
                                             " - " + currentWorkOrder.documentNumber;
            }
        }
        window.localStorage.setItem( LS_CURRENT_WORK_ORDER_STATUS, currentWorkOrderStatusText );
        displayCurrentWorkOrderStatus();
    }

    /**
     * Update the footer with the current work order status
     */
    function displayCurrentWorkOrderStatus() {
        var currentWorkOrder = window.localStorage.getItem( LS_CURRENT_WORK_ORDER_STATUS );
        if ( currentWorkOrder ) {
            $("#currentWorkOrderStatus").text( currentWorkOrder );
            $("#currentWorkOrderStatus").show();
            $("#footerViewButton").show();
        } else {
            // If current work order is not set, display nothing for the status and hide the view button
            $("#currentWorkOrderStatus").text( "" );
            $("#currentWorkOrderStatus").hide();
            $("#footerViewButton").hide();
        }
    }

    /**
     * Update the current technician status based on the specified time entry.
     * This information is displayed in the footer on every page
     * @param currentTimeEntry - Current time entry for the technician.  If undefined,
     *                           use getOpenTimeEntry() to get it.
     */
    function updateCurrentTechnicianStatus( currentTimeEntry ) {
        if ( !currentTimeEntry ) {
            currentTimeEntry = JSONData.getOpenTimeEntry();
        }
        if ( !currentTimeEntry ) {
            throw "UIFrame.updateCurrentTechnicianStatus: Open time entry for technician does not exist";
        }
        debug && console.log( "UIFrame.updateCurrentTechnicianStatus: Changing current technician status in footer using time entry " +
                              JSON.stringify( currentTimeEntry ) );

        var currentStatus = Localization.getText( JSONData.getCurrentClockingStatus( currentTimeEntry ) );
        var formattedTime = Localization.formatDateTime( currentTimeEntry.timeStart, "f" );

        var currentTechnicianStatus = JSONData.getTechnicianName() + " - " + currentStatus + " - " + formattedTime;
        debug && console.log( "UIFrame.updateCurrentTechnicianStatus: Changing current technician status in local storage to " +
                              currentTechnicianStatus );
        window.localStorage.setItem( LS_CURRENT_TECHNICIAN_STATUS, currentTechnicianStatus );
        if ( UIFrame ) {
            displayCurrentTechnicianStatus();
        }
    }

    /**
     * Update the footer with the current technician clock status
     */
    function displayCurrentTechnicianStatus() {
        var currentTechnicianStatus = window.localStorage.getItem( LS_CURRENT_TECHNICIAN_STATUS );
        if ( currentTechnicianStatus ) {
            debug && console.log( "UIFrame.displayCurrentTechnicianStatus: " + currentTechnicianStatus );
            $("#currentTechnicianStatus").text( currentTechnicianStatus );
        }
    }

    /**
     * Display the end non productive clocking dialog.
     * @param newClockingStatus - New technician clocking status, defaults to technicianStatusLoggedIn
     *                            if undefined.
     */
    function displayEndNonProductiveClockingDialog( newClockingStatus ) {
        var currentClockingStatus = JSONData.getCurrentClockingStatus( null );
        var dialogPrompt = null;
        var dialogTitle  = null;
        switch ( currentClockingStatus ) {
            case "technicianStatusLunch" :
                if ( JSONData.isLunchBreakShort() ) {
                    dialogPrompt = "endShortLunchBreakPrompt";
                    dialogTitle = "endShortLunchBreakTitle";
                } else {
                    dialogPrompt = "endLunchBreakPrompt";
                    dialogTitle = "endLunchBreakTitle";
                }
                break;
            case "technicianStatusDPTraining":
            	dialogPrompt = "endDPTrainingPrompt";
            	dialogTitle = "endDPTrainingTitle";
            	break;
            case "technicianStatusNoPay" :
                dialogPrompt = "endNoPayClockingPrompt";
                dialogTitle = "endNoPayClockingTitle";
                break;
            case "technicianStatusPaperwork" :
                dialogPrompt = "endPaperworkClockingPrompt";
                dialogTitle = "endPaperworkClockingTitle";
                break;
            case "technicianStatusPartsStaff" :
                dialogPrompt = "endPartsStaffClockingPrompt";
                dialogTitle = "endPartsStaffClockingTitle";
                break;
            case "technicianStatusServiceSupervision":
            	dialogPrompt = "endServiceSupervisionPrompt";
            	dialogTitle = "endServiceSupervisionTitle";
            	break;
            case "technicianStatusTraining" :
                dialogPrompt = "endTrainingClockingPrompt";
                dialogTitle = "endTrainingClockingTitle";
                break;
            case "technicianStatusVehicleMaintenance" :
                dialogPrompt = "endVehicleMaintenanceClockingPrompt";
                dialogTitle = "endVehicleMaintenanceClockingTitle";
                break;
        }
        if ( !newClockingStatus ) {
            newClockingStatus = "technicianStatusLoggedIn";
        }

        debug && console.log( "UIFrame.displayEndNonProductiveClockingDialog: currentClockingStatus = " +
                                currentClockingStatus + " newClockingStatus = " + newClockingStatus );
        var dialogHtml = new EJS({url: 'templates/endnonproductiveclockingdialog' }).render( {
            currentClockingStatus : currentClockingStatus,
            dialogPrompt : dialogPrompt,
            dialogTitle : dialogTitle,
            endTime : Util.getISOCurrentTime(),
            newClockingStatus : newClockingStatus
        });
        Dialog.showDialog({
            mode : 'blank',
            blankContent : dialogHtml,
            width: '400px'
        });
    }

    /**
     * Display the non-productive clocking dialog.  Tapping the save button inside this dialog
     * calls JSONData.saveClockingStatus
     */
    function displayNonProductiveClockingDialog() {
        debug && console.log( "UIFrame.displayNonProductiveClockingDialog: Displaying non-productive clocking dialog" );

        var nonProductiveStartTime =  JSONData.getNewClockingStartTime()

        // Check for nonProductiveStartTime in localStorage, which is set from a previously failed
        //  nonproductiveclockingdialog attempt
        if( window.localStorage.getItem( "nonProductiveStartTime" )) {
            nonProductiveStartTime = window.localStorage.getItem( "nonProductiveStartTime" );
            window.localStorage.removeItem( "nonProductiveStartTime" );
        }

        var dialogHtml = new EJS({url: 'templates/nonproductiveclockingdialog' }).render( {
            nonProductiveStatuses : JSONData.getNonProductiveClockingStatuses(),
            startTime : nonProductiveStartTime
        });
        var firstClockingOfDay = JSONData.isFirstClockingOfTheDay();
        var dialogOptions = {
            mode : 'blank',
            blankContent : dialogHtml,
            forceInput : true,
            fullScreenForce : true,
            width : '400px',
            zindex: '1000'
        };
        Dialog.showDialog( dialogOptions );
        // If first clocking of the day, display the time picker
        if ( firstClockingOfDay ) {
            // Set the time picker options
            debug && console.log( "UIFrame.displayNonProductiveClockingDialog: Displaying dialog with time picker" );
            defaultDateTimePickerOptions.maxDate = new Date();
            $('#startTime').scroller( defaultDateTimePickerOptions );
            Dialog.moveDialogTop( "#nonProductiveClockingDialog", -125 );
        } else {
            debug && console.log( "UIFrame.displayNonProductiveClockingDialog: Displaying dialog without time picker" );
            $("#selectStartTime").hide();
        }
    }

    /**
     * Display the start time dialog.  Tapping the save button inside this dialog
     * calls JSONData.saveClockingStatus
     * @param newClockingStatus - Clocking status to use JSONData.saveClockingStatus
     *                            saves the clocking status.
     * @param clockingChangeCompleteCallback
     * @param changeClockingStatusCompleteCallbackArgs
     */
    function displayStartTimeDialog( newClockingStatus, clockingChangeCompleteCallback,
                                     changeClockingStatusCompleteCallbackArgs ) {
        debug && console.log( "UIFrame.displayStartTimeDialog: Displaying start time dialog" );

        var currentClockingStatus = JSONData.getCurrentClockingStatus( null );
        var startTime = JSONData.getNewClockingStartTime();

        // Dialog template, title and prompt depend upon current clocking status
        var dialogTemplate = "startworkorderwithtraveloptiondialog";
        var dialogPrompt   = "startWorkOrderPrompt";
        var dialogTitle    = "openWorkOrder";
        switch ( currentClockingStatus ) {
            case "technicianStatusLoggedIn" :
            	if( JSONData.isFirstClockingOfTheDay() ) {
	            	dialogTemplate = "starttimewithtraveloptiondialog";
	                dialogPrompt   = "startTimePrompt";
	                dialogTitle    = "startTimeTitle";
                } 
                break;
            case "technicianStatusLunch" :
                if ( JSONData.isLunchBreakShort() ) {
                    dialogPrompt = "endShortLunchStartTimePrompt";
                    dialogTitle = "endShortLunchBreakTitle";
                } else {
                    dialogTitle = "endLunchBreakTitle";
                }
                break;
            case "technicianStatusNoPay" :
                dialogTitle = "endNoPayClockingTitle";
                break;
            case "technicianStatusPaperwork" :
                dialogTitle = "endPaperworkClockingTitle";
                break;
            case "technicianStatusTraining" :
                dialogTitle = "endTrainingClockingTitle";
                break;
            case "technicianStatusVehicleMaintenance" :
                dialogTitle = "endVehicleMaintenanceClockingTitle";
                break;
        }

        // If work order being opened has a technician signature, hide the travel option inside
        // the start time dialog and using a different prompt
        var showTravelCheckbox = true;
        var workOrderForClockingChange = JSONData.getObjectById( "workOrders", JSONData.getWorkOrderIdForClockingChange(), null );
        if ( WorkOrder.isWorkOrderSignedByTechnician( workOrderForClockingChange ) ) {
            debug && console.log( "UIFrame.displayStartTimeDialog: Hiding travel checkbox because work order " +
                                  workOrderForClockingChange.documentNumber + " is signed by the technician" );
            // SFAM-230: If current work order matches the manage work order ID and, display
            // the reopen prompt
            if ( WorkOrder.getCurrentWorkOrderId() == WorkOrder.getManageWorkOrderId() &&
                 UIFrame.getCurrentPageId().indexOf( "manageWorkOrder" ) === 0 ) {
                dialogTitle = Localization.getText( "reopenWorkOrder" );
                dialogPrompt = Localization.getText( "reopenWorkOrderPrompt" );
            } else {
                dialogPrompt = Localization.getText( "openWorkOrderForCustomerSignature" );
            }
            showTravelCheckbox = false;
        }

        var dialogHtml = new EJS({url: 'templates/' + dialogTemplate}).render( {
            dialogPrompt : dialogPrompt,
            dialogTitle : dialogTitle,
            showTravelCheckbox : showTravelCheckbox,
            startTime : startTime,
            newClockingStatus : newClockingStatus
        });

        var dialogOptions = {
            mode : 'blank',
            width: '400px',
            blankContent : dialogHtml,
            callbackClose : clockingChangeCompleteCallback,
            callbackCloseArgs : changeClockingStatusCompleteCallbackArgs
        };
        Dialog.showDialog( dialogOptions );

        // Set the time picker options
        if ( dialogTemplate === "starttimewithtraveloptiondialog" ) {
            defaultDateTimePickerOptions.maxDate = new Date();
            $('#startTime').scroller( defaultDateTimePickerOptions );
            Dialog.moveDialogTop( "#startTimeWithTravelOptionDialog", -125 );
        }
    }

    /**
     * Display the terminate clocking dialog.  Tapping the yes button inside this dialog
     * will change the clocking status to "Logged In".
     */
    function displayTechnicianArrivedDialog() {
        debug && console.log( "UIFrame.displayTechnicianArrivedDialog: Displaying technician arrived dialog" );
        var dialogHtml = new EJS({url: 'templates/technicianarriveddialog' }).render();
        Dialog.showDialog({
            mode : 'blank',
            width: '400px',
            blankContent : dialogHtml
        });
    }

    /**
     * Display the terminate clocking dialog.  Tapping the yes button inside this dialog
     * will change the clocking status to "Logged In".
     * @param title - Dialog title
     * @param prompt - Dialog prompt
     */
    function displayTerminateClockingDialog( title, prompt ) {
        if ( _.isUndefined( title ) || _.isNull( title ) ||
             _.isUndefined( prompt ) || _.isNull( prompt ) ) {
            throw "UIFrame.displayTerminateClockingDialog: One or more required parameters (title, prompt) are undefined or null";
        }

        var dlgPrompt = Localization.getText( prompt );
        var unsavedPrompt;

        // SFAM-218: Modify terminate clocking prompt to include note about losing unsaved changes
        if ( window.localStorage.getItem( LS_UNSAVED_CHANGES ) ) {
            unsavedPrompt = Localization.getText( "terminateClockingUnsavedChanges" )
                                        .replace( "workOrder", WorkOrder.getCurrentWorkOrder().documentNumber );
            dlgPrompt = dlgPrompt + " " + unsavedPrompt;
        }

        debug && console.log( "UIFrame.displayTerminateClockingDialog: Displaying terminate clocking dialog" );
        var dialogHtml = new EJS({url: 'templates/terminateclockingdialog' }).render({
            title: Localization.getText( title ),
            prompt: dlgPrompt
        });
        Dialog.showDialog({
            mode : 'blank',
            width: '400px',
            blankContent : dialogHtml
        });
    }

    /**
     * Save handler for the terminate clocking dialog
     */
    function terminateClockingDialogSaveHandler() {
        Dialog.closeDialog( false );
        debug && console.log( "terminateclockingdialog.save: Changing clocking status to logged in using current time" );
        JSONData.saveClockingStatus( 'technicianStatusLoggedIn', Util.getISOCurrentTime() );
        // SFAM-218: Clear unsaved changes flag
        JSONData.setUnsavedChanges( false, null );
        WorkOrder.setCurrentWorkOrderOnHold();
        var currentPageId = UIFrame.getCurrentPageId();
        // If closing out the day or logging off, post work orders and navigate to close out day page
        if ( window.localStorage.getItem( JSONData.LS_CLOSE_OUT_DAY_ATTEMPT ) ||
             window.localStorage.getItem( JSONData.LS_LOGOFF_IN_PROGRESS )) {
            // If on the time sheet page and attempting to close out the current day
            debug && console.log( "terminateclockingdialog.save: Closing out current day" );
            if ( JSONData.validateClockingForCloseOutDay() ) {
                UIFrame.navigateToPage( "closeoutday.html", false, null );
            }
        // If a manage work order page is active and it's being used to edit the affected open work order,
        // take user to the work orders list page
        } else if ( currentPageId.indexOf( "manageWorkOrder") == 0 &&
                    WorkOrder.getManageWorkOrderActivity() == WorkOrder.MANAGE_WORK_ORDER_OPEN ) {
            debug && console.log( "terminateclockingdialog.save: Navigating to work order list page" );
            UIFrame.navigateToPage( "workorderlist.html", false, null  );
        // If on the work orders list page, repopulate the lists
        } else if ( currentPageId == "workOrderListPage" ) {
            debug && console.log( "terminateclockingdialog.save: Repopulating work order list views" );
            WorkOrderList.populateListViews( WorkOrderList.loadWorkOrders(), false );
            WorkOrder.postWorkOrders( WorkOrder.getWorkOrdersRequiringPostToMiddleTier(), null );
        // Default: Reload current page
        } else {
            debug && console.log( "terminateclockingdialog.save: Reloading current page" );
            WorkOrder.postWorkOrders( WorkOrder.getWorkOrdersRequiringPostToMiddleTier(), function() {
                UIFrame.reloadCurrentPage();
            });
        }
    }

    /**
     * Change the search filter on a list view
     * @param newFilterString
     */
    function changeListFilter( newFilterString ) {
        if( newFilterString !== "" ) {
            debug && console.log( "UIFrame.changeListFilter: Changing list filter to " + newFilterString );
        } else {
            debug && console.log( "UIFrame.changeListFilter: Removing list filter");
        }
        var searchFilterElem = $('input[data-type="search"]');
        searchFilterElem.val( newFilterString );
        searchFilterElem.trigger( "change" );
    }

    /**
     * Filter a list view when an initial list filter was found
     */
    function initListFilter( guidedSearchItemText) {
        debug && console.log( "UIFrame.initListFilter: Searching for initial page load list filters" );

        // Scan the INIT_FILTERS constant for existing filters
        for ( var i = 0; i < INIT_FILTERS.length; i++ ) {
            if ( window.localStorage.getItem( INIT_FILTERS[i] ) != "" ) {
                debug && console.log( "UIFrame.initListFilter: Initial list filter " + INIT_FILTERS[i] + " found" );

                var filter = window.localStorage.getItem( INIT_FILTERS[i] );
                changeListFilter( filter );

                // Remove the filter
                window.localStorage.setItem( INIT_FILTERS[i], "" );

                // Scan the guided search items for this filter
                $( ".guided-search-item" ).each( function() {
                    var guidedSearchItem = $( this ).text();

                    // Check if the filter was the current guided search item
                    if ( guidedSearchItem.indexOf( guidedSearchItemText ) != -1 ) {
                        initListFilterGuidedSearchSelection( $( this ) );
                    }
                });

                return; // return early if the filter was found
            }
        }
    }

    /**
     * When an initial list filter is found, select the appropriate guided search item and add
     *  the clear button.
     */
    function initListFilterGuidedSearchSelection( guidedSearchItem ) {
        // Show the clear button for the selected item
        var clearButton = guidedSearchItem.find("a.guided-search-clear-button");
        clearButton.show();

        // And, change the theme for the selected item
        guidedSearchItem.removeClass(GUIDED_SEARCH_ITEM_DEFAULT_CLASS).addClass(GUIDED_SEARCH_ITEM_SELECTED_CLASS);

        // Clicking on a clear button clears the search filter,
        // changes the item theme back to the default, and hides the clear button
        clearButton.unbind( 'click' );
        clearButton.click( function( event ) {
            // Prevent this event from propagating
            event.preventDefault();
            event.stopPropagation();

            debug && console.log( "UIFrame.initListFilter: Inside clearButton click handler" );
            // Reset the themes for all guided search items
            $(".guided-search-item").each( function() {
                $(this).removeClass(GUIDED_SEARCH_ITEM_SELECTED_CLASS).addClass(GUIDED_SEARCH_ITEM_DEFAULT_CLASS);
            });

            // Reset the search filter
            UIFrame.changeListFilter( "" );

            // Hide the clear button that was tapped
            $(this).hide();
        });
        bindClearButtonHighlightEvents( clearButton );
    }

    function bindClearButtonHighlightEvents( clearButton ) {
        clearButton.unbind( 'vmouseover' );
        clearButton.unbind( 'vmouseout' );
        clearButton.unbind( 'vmousedown' );
        clearButton.unbind( 'vmouseup' );
        clearButton.on( "vmouseover vmousedown", function( event ) {
            debug && console.log( "UIFrame.bindClearButtonHighlightEvents: vmouseover / vmousedown event fired" );
            clearButton.removeClass( "ui-btn-up-e ui-btn-up-c" ).addClass( "ui-clear-btn-down-r" );
        });
        clearButton.on( "vmouseout vmouseup", function( event ) {
            debug && console.log( "UIFrame.bindClearButtonHighlightEvents: vmouseout / vmouseup event fired" );
            clearButton.removeClass( "ui-clear-btn-down-r" ).addClass( "ui-btn-up-e ui-btn-up-c" );
        });
    }

    /**
     * Add guided search divider
     */
    function addGuidedSearchDivider( dividerValue ) {
        debug && console.log( "UIFrame.addGuidedSearchDivider: Adding " + dividerValue );
        var dividerTemplate = new EJS({url: 'templates/guidedsearchdivider'});
        $('#guidedSearchList').append( dividerTemplate.render( { dividerValue : dividerValue } ) );
    }

    /**
     * Add guided search item
     * @param itemText - Used as search item text
     * @param itemId - DOM ID for the item count which allows it to be updated later
     * @param itemCount - Item count value, optional
     */
    function addGuidedSearchItem( itemText, itemId, itemCount ) {
        debug && console.log( "UIFrame.addGuidedSearchItem: Adding guided search item for " + itemText );
        $('#guidedSearchList').append( guidedSearchTemplate.render( {
            itemText : itemText,
            itemId : itemId,
            itemCount : itemCount
        }));
    }

    /**
     * Add guided search item that displays an icon
     * @param itemText - Used as search item text
     * @param iconFilename - Icon filename (assumed to be stored inside images directory)
     * @param itemId - DOM ID for the guided search item
     * @param itemCount - Item count value, optional
     */
    function addGuidedSearchItemWithIcon( itemText, iconFilename, itemId, itemCount ) {
        debug && console.log( "UIFrame.addGuidedSearchItemWithIcon: Adding guided search item for " + itemText );
        $('#guidedSearchList').append( guidedSearchWithIconTemplate.render( {
            itemText    : itemText,
            icon        : iconFilename,
            itemId      : itemId,
            itemCount   : itemCount
        }));
    }

    /**
     * Update a guided search item count
     * @param itemCountId - DOM ID of item to update
     * @param itemCount - New count value
     */
    function updateGuidedSearchItemCount( itemCountId, itemCount ) {
        debug && console.log( "UIFrame.updateGuidedSearchItemCount: Updating " + itemCountId + " to " + itemCount );
        $('#guidedSearchCount' + itemCountId).text( itemCount );
    }

    /**
     * Update a list divider item count
     * @param itemCountId - DOM ID of item to update
     * @param itemCount - New count value
     */
    function updateListDividerItemCount( itemCountId, itemCount ) {
        debug && console.log( "UIFrame.updateListDividerItemCount: Updating " + itemCountId + " to " + itemCount );
        $('#dividerCount' + itemCountId).text( itemCount );
    }

    /**
     * Refresh the guided search by highlighting the selected item
     * and displaying a clear button on it.  Previously selected item
     * is reset back to the default theme
     * @param selectedItem
     * @param clearButtonClickHandler - Clear button click handler.  If undefined,
     *                                  defaultClearButtonClickHandler is used.
     */
    function refreshGuidedSearchWithSelectedItem( selectedItem, clearButtonClickHandler ) {
        // Hide all of the clear buttons and reset all of the item themes
        $(".guided-search-clear-button").hide();
        $(".guided-search-item").each( function() {
            $(this).removeClass(GUIDED_SEARCH_ITEM_SELECTED_CLASS).addClass(GUIDED_SEARCH_ITEM_DEFAULT_CLASS);
        });

        // Then, Show the clear button for the selected item
        var clearButton = $(selectedItem).find("a.guided-search-clear-button");
        clearButton.show();

        // And, change the theme for the selected item
        $(selectedItem).removeClass(GUIDED_SEARCH_ITEM_DEFAULT_CLASS).addClass(GUIDED_SEARCH_ITEM_SELECTED_CLASS);

        // Clicking on a clear button clears the filter by executing the specified
        // clear function
        if ( !clearButtonClickHandler ) {
            clearButtonClickHandler = defaultGuidedSearchClearClickHandler;
        }
        clearButton.unbind( 'click' );
        clearButton.click( clearButtonClickHandler );
        bindClearButtonHighlightEvents( clearButton );
    }

    /**
     * Reset the guided search display back to its defaults
     * This is used by guided search clear button click handlers.
     * @param clearButton - Clear button currently being displayed
     */
    function resetGuidedSearch( clearButton ) {
        // Reset the themes for all guided search items
        $(".guided-search-item").each( function() {
            $(this).removeClass(GUIDED_SEARCH_ITEM_SELECTED_CLASS).addClass(GUIDED_SEARCH_ITEM_DEFAULT_CLASS);
        });
        // Reset the search filter
        UIFrame.changeListFilter( "" );
        // Hide the clear button that was tapped
        $(clearButton).hide();
    }

    /**
     * Default guided search filter uses the title attribute value of the
     * selected guided search item to filter the list view.
     */
    function applyDefaultGuidedSearchFilter( selectedItem ) {
        refreshGuidedSearchWithSelectedItem( selectedItem, null );
        var filter = $(selectedItem).attr( "title" );
        changeListFilter( filter );
    }

    /**
     * Click handler for a guided search item
     */
    function defaultGuidedSearchClickHandler() {
        debug && console.log( "UIFrame.defaultGuidedSearchClickHandler" );
        applyDefaultGuidedSearchFilter( this );
    }

    /**
     * Clicking on a clear button clears the search filter,
     * changes the item theme back to the default, and hides the clear button
     * @param event - Clear button click event
     */
    function defaultGuidedSearchClearClickHandler( event ) {
        // Prevent this event from propagating
        event.preventDefault();
        event.stopPropagation();
        debug && console.log( "UIFrame.defaultGuidedSearchClearClickHandler: Inside clearButton click handler" );
        resetGuidedSearch( this );
    }

    /**
     * Refresh the guided search list.  This also binds a click handler
     * for guided search items that will highlight user selections and
     * add the X image to a guided search item.
     */
    function refreshGuidedSearch() {
        debug && console.log( "UIFrame.refreshGuidedSearch: Started" );
        $('#guidedSearchList').listview( 'refresh' );

        // Adjust the position of the red-x buttons that can appear next to each
        // guided search item
        debug && console.log( "UIFrame.refreshGuidedSearch: Adjusting position of red-x buttons" );
        var guidedSearchClearButtonPos = {
            'right' : '7px',
            'top'   : '45%'
        };
        var guidedSearchClearBtn = $(".guided-search-clear-button");
        guidedSearchClearBtn.find("span[data-theme='r']").each( function() {
            $(this).css( guidedSearchClearButtonPos );
        });

        // Set the theme for the clear button's surrounding anchor to
        // match the theme of a selected guided search item.
        debug && console.log( "UIFrame.refreshGuidedSearch: Setting theme for clear button to match selected guided search item" );
        $("a.guided-search-clear-button").removeClass(GUIDED_SEARCH_ITEM_DEFAULT_CLASS).addClass(GUIDED_SEARCH_ITEM_SELECTED_CLASS);

        // All clear buttons are initially hidden
        debug && console.log( "UIFrame.refreshGuidedSearch: Hidding all clear buttons" );
        guidedSearchClearBtn.hide();
    }

    /**
     * Bind the click handler function to the click event.
     * @param guidedSearchClickHandlerFn - Custom guided search click handler function.
     *                                     If undefined, defaultGuidedSearchClickHandler
     *                                     is used.
     */
    function bindGuidedSearchClickHandler( guidedSearchClickHandlerFn ) {
        if ( guidedSearchClickHandlerFn && _.isFunction( guidedSearchClickHandlerFn ) ) {
            debug && console.log( "UIFrame.bindGuidedSearchClickHandler: Using custom guided search click handler" );
            $(GUIDED_SEARCH_ITEM).unbind( "click" );
            $(GUIDED_SEARCH_ITEM).click( guidedSearchClickHandlerFn );
        } else {
            debug && console.log( "UIFrame.bindGuidedSearchClickHandler: Using default guided search click handler" );
            $(GUIDED_SEARCH_ITEM).unbind( "click" );
            $(GUIDED_SEARCH_ITEM).click( defaultGuidedSearchClickHandler );
        }
    }

    /**
     * Function to show an alert dialog box using the simpledialog plugin.
     * @param title the alert title
     * @param body the alert body (can be HTML)
     */
    function showAlert(title, body) {
        debug && console.log( "UIFrame.showAlert: Showing alert dialog" );

        var alert = new EJS({ url: 'templates/dialog_alert' }).render({
            title: title,
            body: body
        });

        Dialog.showDialog({
            mode : 'blank',
            blankContent : alert
        });
    }

    /**
     * Return the current page ID
     * @returns String containing current page ID which can serve as a key into Pages
     */
    function getCurrentPageId() {
        var elem = $("div[data-role='page']");
        var id = null;
        if ( elem && elem.length > 0 ) {
            id = elem[0].id;
            debug && console.log( "UIFrame.getCurrentPageId: Current page ID = " + id );
        }
        return id;
    }

    /**
     * All pages must be part of the Pages object array
     * @returns Boolean
     */
    function validatePageId( pageId ) {
        if ( getPage( pageId ) == undefined ) {
            throw "UIFrame.validatePageId: Page ID '" + pageId + "' is not part of the Pages array";
        } else {
            return true;
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
        var useScrollableDivs;

        if ( !pageId ) {
            throw "UIFrame.init: Required parameter pageId is undefined";
        }
        UIFrame.validatePageId( pageId );
        debug && console.log( "UIFrame.init: Initializing UI for page ID: " + pageId );

        // Set defaults for dialog boxes
        //noinspection JSPotentiallyInvalidConstructorUsage
        $.mobile.simpledialog2.prototype.options.animate = false;
        //noinspection JSPotentiallyInvalidConstructorUsage
        $.mobile.simpledialog2.prototype.options.forceInput = true;
        //noinspection JSPotentiallyInvalidConstructorUsage
        $.mobile.simpledialog2.prototype.options.transition = "none";

        // Initialize the JSON data.  The rest of UIFrame.init is executed
        // when JSONData.init completes.
        JSONData.init( pageId, function() {
            Localization.loadLanguage( function() {
                debug && console.log( "UIFrame.init: Language successfully loaded" );

                // Build the common UI parts
                buildPageHeaderAndFooter( pageId );
                updateMessageCountBadge( JSONData.getNewMessageCount() );

                // Work order list page will take care of updating the toolbox count
                if ( pageId != "workOrderListPage" ) {
                    updateToolboxCountBadge();
                }

                // Call the page specific init function if defined
                if ( pageInitFunction ) {
                    debug && console.log( "UIFrame.init: Calling page specific init function" );
                    pageInitFunction( pageId );
                } else {
                    debug && console.log( "UIFrame.init: Page specific init function is undefined" );
                }

                // Restrict allowed keypresses inside certain input elements
                bindKeypressToInputElements();

                useScrollableDivs = Config.getConfig()[USE_SCROLLABLE_DIVS];
                debug && console.log( "UIFrame.init: Using scrollable divs = '" + useScrollableDivs + "'");
                if ( _.isNull( useScrollableDivs ) ) {
                    useScrollableDivs = "false";
                }
                if ( useScrollableDivs == "true" ) {
                    $( "div.list-block-div" ).css( "overflow", "auto" );
                }

                // Translate everything
                Localization.translate();
            });
        });
    });

    /**
     * After each page finishes with its page specific initialization,
     * this method is called to perform all common post page specific initialization
     * @param pageId - ID of page being initialized
     */
    function postPageSpecificInit( pageId ) {
        debug && console.log( "UIFrame.postPageSpecificInit: Performing common post page specific initialization for page id: " + pageId );
        // Fix for JIRA issue SFAM-15 - Set style for header to fixed when a list divider is clicked
        $(".ui-li-divider").click( function() {
            debug && console.log( "UIFrame.ui-li-divider.click: Setting header position back to fixed");
            $("#header").css( "position", "fixed" );
        });

        // Prevent taps from turning off fixed headers and footers
        $("[data-role=header]").fixedtoolbar({ tapToggle: false });
        $("[data-role=footer]").fixedtoolbar({ tapToggle: false });

        // Fix the top and bottom border on the list search form
        var listSearchForm = $("form.ui-listview-filter");
        if ( listSearchForm.length >= 1 ) {
            switch ( pageId ) {
                case "customersPage" :
                    listSearchForm.css( "border-bottom", "solid black 1px" );
                    break;
                case "customerEquipmentPage" :
                    listSearchForm.css( "border-top", "solid black 1px" );
                    break;
                case "equipmentDetailPage" :
                case "vanInventoryAddPage" :
                    listSearchForm.css( "border-top", "solid black 1px" );
                    listSearchForm.css( "border-bottom", "solid black 1px" );
                    break;
                default:
                    break;
            }
        }

        // Set a uniform background color for all pages except the login page
        if ( pageId != "loginPage" ) {
            $("div:jqmData(role='page')").css( "background", "#F9F9F9" );
        }

        debug && console.log( "UIFrame.postPageSpecificInit: Finished" );
    }

    /**
     * Hide an element by setting its css display style to none
     * @param elementSelector - String containing jQuery selector for element to show
     */
    function hideElement( elementSelector ) {
        var element;
        if ( elementSelector ) {
            element = $( elementSelector );
            if ( element && element.length == 1 ) {
                debug && console.log( "UIFrame.hideElement: Hiding " + elementSelector );
                element[0].style.display = "none";
            }
        }
    }

    /**
     * Show an element by setting its css display style
     * @param elementSelector - String containing jQuery selector for element to show
     * @param displayStyle - String containing display style value to use
     */
    function showElement( elementSelector, displayStyle ) {
        var element;
        if ( elementSelector && displayStyle ) {
            element = $( elementSelector );
            if ( element && element.length == 1 ) {
                debug && console.log( "UIFrame.showElement: Showing " + elementSelector +
                                      " using style " + displayStyle );
                element[0].style.display = displayStyle;
            }
        }
    }

    // Public accessible methods are exposed here
    return {
        'LS_APPLY_DISPATCHED_WORKORDER_FILTER'      : LS_APPLY_DISPATCHED_WORKORDER_FILTER,
        'LS_CURRENT_PAGE'                           : LS_CURRENT_PAGE,
        'LS_REVIEW_PAGE_ID'                         : LS_REVIEW_PAGE_ID,
        'LS_UNSAVED_CHANGES'                        : LS_UNSAVED_CHANGES,
        'USE_NATIVE_SELECT'                         : USE_NATIVE_SELECT,
        'USE_NATIVE_TASKS_MENU'                     : USE_NATIVE_TASKS_MENU,
        'USE_PHONEGAP_LOADURL_PLUGIN'               : USE_PHONEGAP_LOADURL_PLUGIN,
        'USE_SCROLLABLE_DIVS'                       : USE_SCROLLABLE_DIVS,
        'addCurrentPageToHistory'                   : addCurrentPageToHistory,
        'addGuidedSearchDivider'                    : addGuidedSearchDivider,
        'addGuidedSearchItem'                       : addGuidedSearchItem,
        'addGuidedSearchItemWithIcon'               : addGuidedSearchItemWithIcon,
        'adjustListViewBorders'                     : adjustListViewBorders,
        'allowCostInputOnly'                        : allowCostInputOnly,
        'allowNumericInputOnly'                     : allowNumericInputOnly,
        'applyDefaultGuidedSearchFilter'            : applyDefaultGuidedSearchFilter,
        'bindGuidedSearchClickHandler'              : bindGuidedSearchClickHandler,
        'bindKeypressToInputElements'               : bindKeypressToInputElements,
        'buildPageHeaderAndFooter'                  : buildPageHeaderAndFooter,
        'changeListFilter'                          : changeListFilter,
        'clearPageHistory'                          : clearPageHistory,
        'displayEndNonProductiveClockingDialog'     : displayEndNonProductiveClockingDialog,
        'displayNonProductiveClockingDialog'        : displayNonProductiveClockingDialog,
        'displayStartTimeDialog'                    : displayStartTimeDialog,
        'displayTechnicianArrivedDialog'            : displayTechnicianArrivedDialog,
        'displayTerminateClockingDialog'            : displayTerminateClockingDialog,
        'getCurrentPage'                            : getCurrentPage,
        'getCurrentPageId'                          : getCurrentPageId,
        'getImagePath'                              : getImagePath,
        'getPage'                                   : getPage,
        'hideElement'                               : hideElement,
        'init'                                      : init,
        'initListFilter'                            : initListFilter,
        'initListFilterGuidedSearchSelection'       : initListFilterGuidedSearchSelection,
        'loadUrl'                                   : loadUrl,
        'navigateToPage'                            : navigateToPage,
        'navigateToPageAfterSaveCompletes'          : navigateToPageAfterSaveCompletes,
        'navigateToPreviousPage'                    : navigateToPreviousPage,
        'postPageSpecificInit'                      : postPageSpecificInit,
        'refreshGuidedSearch'                       : refreshGuidedSearch,
        'refreshGuidedSearchWithSelectedItem'       : refreshGuidedSearchWithSelectedItem,
        'reloadCurrentPage'                         : reloadCurrentPage,
        'resetGuidedSearch'                         : resetGuidedSearch,
        'resetTasksMenuSelection'                   : resetTasksMenuSelection,
        'setNavigateToPageSaveChangesFunction'      : setNavigateToPageSaveChangesFunction,
        'showElement'                               : showElement,
        'terminateClockingDialogSaveHandler'        : terminateClockingDialogSaveHandler,
        'updateCurrentTechnicianStatus'             : updateCurrentTechnicianStatus,
        'updateCurrentWorkOrderStatus'              : updateCurrentWorkOrderStatus,
        'updateGuidedSearchItemCount'               : updateGuidedSearchItemCount,
        'updateListDividerItemCount'                : updateListDividerItemCount,
        'updateMessageCountBadge'                   : updateMessageCountBadge,
        'updateToolboxCountBadge'                   : updateToolboxCountBadge,
        'validatePageId'                            : validatePageId
    };
}();
