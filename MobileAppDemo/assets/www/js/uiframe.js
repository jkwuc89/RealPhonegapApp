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
    var GUIDED_SEARCH_ITEM                = ".guided-search-item";
    var GUIDED_SEARCH_ITEM_DEFAULT_CLASS  = "ui-btn-up-c";
    var GUIDED_SEARCH_ITEM_SELECTED_CLASS = "ui-btn-up-e";
    var IMAGE_PATH                        = "images/";
    var USE_NATIVE_SELECT                 = "true";
    
    /**
     * Local storage locations
     */
    var LS_CURRENT_TECHNICIAN_STATUS      = "currentTechnicianStatus";
    var LS_CURRENT_WORK_ORDER_STATUS      = "currentWorkOrderStatus";
    var LS_PAGE_HISTORY                   = "pageHistory";

    /**
     * Initial page load list filtering constants
     */
    var INIT_FILTERS = [
        "plannedMaintenanceFilter",
        "workOrderFilter"
    ];
    
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
        'crownCatalogPage' : {
            url : 'crowncatalog.html',
            onTasksMenu : true,
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
            onTasksMenu : true,
            additionalHeader : false
        },
        'messagesPage' : {
            url : 'messages.html',
            onTasksMenu : true,
            additionalHeader : false
        },
        'pmsDuePage' : {
            url : 'pmsdue.html',
            onTasksMenu : true,
            additionalHeader : true
        },
        'serviceQuotesPage' : {
            url : 'servicequotes.html',
            onTasksMenu : true,
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
            url : 'index.html',
            navigateFunction : JSONData.logoff,
            onTasksMenu : true,
            additionalHeader : false
        }
    };
    var pagesWithoutCommonHeaderAndFooter = [ "closeOutDayPage", "customerEquipmentPage", "equipmentDetailPage", "loginPage", "pmsDueListFrame", 
                                              "vanInventoryPage", "vanInventoryAddPage", "workOrderHistoryReviewPage", "workOrderListFrame" ];

    // Preload commonly used EJS templates
    var guidedSearchTemplate         = new EJS({url: 'templates/guidedsearchitem'});
    var guidedSearchWithIconTemplate = new EJS({url: 'templates/guidedsearchitemwithicon'});
        
    /**
     * Handle window onload to process UI changes that can only occur
     * after the document is loaded. 
     */
    $(window).load( function( event ) {
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
            var listSearchForm = $("form.ui-listview-filter");
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
                    $( contentLists[index] ).children( "li" ).css( "border-right", "solid 1px black" );
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
                pageHistory.pages = new Array();
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
     * Navigate to the page specified by url
     * @param url
     * @param skipAddToHistory
     * @param reviewPageId - Used to navigate to the manage work order review pages
     */
    function navigateToPage( url, skipAddToHistory, reviewPageId ) {

        // Prevent reloading the current page
        var currentPage = getCurrentPage();
        var skipNavigation = false;
        if ( url == currentPage.url &&
             currentPage.id != "manageWorkOrderCustomerReviewPage" &&
             currentPage.id != "manageWorkOrderTechnicianReviewPage" ) {
            skipNavigation = true;
        }

        if ( !skipNavigation ) {
            if ( _.isUndefined( skipAddToHistory ) ) {
                skipAddToHistory = false;
            }
            if ( !skipAddToHistory ) {
                addCurrentPageToHistory();
            }
            debug && console.log( "UIFrame.navigateToPage: About to navigate to " + url );
            
            var pageTitle = "";
            // Use reviewPageId if specified to find review page title
            if ( reviewPageId != undefined && reviewPageId != null ) {
                pageTitle = Localization.getText( reviewPageId );
            } else {
                // Otherwise, use the url to find the page title
                for ( var pageId in Pages ) {
                    if ( Pages[pageId].url == url ) {
                        pageTitle = Localization.getText( pageId );
                        break;
                    }
                }
            }

            // If current URL is the login page, close the "attempting logon" progress dialog
            if ( currentPage.id == "loginPage" ) {
                closeActiveDialog();
            }
            
            // Write additional page ID to local storage to load correct review page
            if ( reviewPageId != undefined && reviewPageId != null ) {
                window.localStorage.setItem( ManageWorkOrder.LS_REVIEW_PAGE_ID, reviewPageId );
            }
            $.mobile.showPageLoadingMsg( "a", Localization.getText( "loadingPage" ) + " " + pageTitle, true );
            document.location.href = url;
        } else {
            debug && console.log( "UIFrame.navigateToPage: Navigation skipped because page is already loaded" );
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
                window.localStorage.setItem( ManageWorkOrder.LS_REVIEW_PAGE_ID, previousPage.id );
                navigateToPage( previousPage.url, true, previousPage.id );
            } else {
                navigateToPage( previousPage.url, true );
            }
        } else {
            debug && console.log( "UIFrame.navigateToPreviousPage: No previous page in history" );
        }
    }
    
    /**
     * Navigate to the page specified by url
     * @param url
     */
    function navigateParentToPage( url ) {
        debug && console.log( "UIFrame.navigateParentToPage: About to navigate to " + url );
        parent.document.location.href = url;
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
        if ( pagesWithoutCommonHeaderAndFooter.indexOf( pageId ) != -1 ) {
            debug && console.log( "UIFrame.buildPageHeaderAndFooter: Page ID " + pageId + " does not use the common header / footer" );
            
        	var currentPage = $( "#" + pageId );
        	
        	switch ( pageId ) {
        	    case "closeOutDayPage" :
                    var closeOutDayHeader = new EJS( {url: "templates/header_closeoutdaypage"} ).render( {
                        pageId : pageId
                    });
                    $(closeOutDayHeader).prependTo( currentPage );
                    $(currentPage).trigger( 'pagecreate' );
        	        break;
        	        
        	    case "customerEquipmentPage" :
                    var customerEquipmentPageHeader = new EJS( {url: "templates/header_customerequipmentpage"} ).render( {
                        pageId : pageId
                    });
                    $(customerEquipmentPageHeader).prependTo( currentPage );
                    $(currentPage).trigger( 'pagecreate' );
        	        break;
        	        
                case "equipmentDetailPage" :
                    var customerEquipmentPageHeader = new EJS( {url: "templates/header_equipmentdetailpage"} ).render( {
                        pageId : pageId
                    });
                    $(customerEquipmentPageHeader).prependTo( currentPage );
                    $(currentPage).trigger( 'pagecreate' );
                    break;
                    
                case "vanInventoryPage" :
                    var additionalHeaderTemplate = "templates/header_" + pageId.toLowerCase();
                    var renderedHtml = new EJS( {url: "templates/header"} ).render( {
                        pageId : pageId,
                        additionalHeaderTemplate : additionalHeaderTemplate
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
                        navigateToPage( "home.html" );
                    });
                    $("#messagesIcon").click( function() {
                        navigateToPage( "messages.html" );
                    });
                    $("#toolboxIcon").click( function() {
                        navigateToPage( "workorderlist.html" );
                    });
                    $("#footerViewButton").click( function() {
                        JSONData.setManageWorkOrderId( JSONData.getCurrentWorkOrderId() );
                        navigateToPage( "manageworkorderoverview.html" );
                    });
                    $("#clockIcon").click( function() {
                        JSONData.changeClockingStatus( "", null, null );
                    });
                
                	break;
                case "vanInventoryAddPage" :
                	var renderedHtml = new EJS( {url: "templates/header_vaninventoryaddpage"} ).render( {
                        pageId : pageId
                    });
                    
                    $(renderedHtml).prependTo( currentPage );
                    $(currentPage).trigger( 'pagecreate' );
                
                	break;
                case "workOrderHistoryReviewPage" :
                	var renderedHtml = new EJS( {url: "templates/header_workorderhistoryreviewpage"} ).render( {
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
            var currentPage = $( "#" + pageId );
            var additionalHeaderTemplate = "";
            if ( Pages[pageId].additionalHeader ) {
                debug && console.log( "UIFrame.buildPageHeaderAndFooter: Adding additional header for page ID: " + pageId );
                // All of the manage work order pages use the same additional header template
                if ( pageId.indexOf( "manageWorkOrder" ) == 0 ) {
                    additionalHeaderTemplate = "templates/header_manageworkorder";
                } else {
                    additionalHeaderTemplate = "templates/header_" + pageId.toLowerCase();
                }
            }
            debug && console.log( "UIFrame.buildPageHeaderAndFooter: Rendering header HTML for : " + pageId );
            var renderedHtml = new EJS( {url: "templates/header"} ).render( {
                pageId : pageId,
                additionalHeaderTemplate : additionalHeaderTemplate
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
            $("#toolboxIcon").click( function() {
                navigateToPage( "workorderlist.html" );
            });
            $("#footerViewButton").click( function() {
                JSONData.setManageWorkOrderId( JSONData.getCurrentWorkOrderId() );
                navigateToPage( "manageworkorderoverview.html" );
            });
            $("#clockIcon").click( function() {
                JSONData.changeClockingStatus( "", null, null );
            });
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
            if ( Pages[index].onTasksMenu ) {
                tasksMenu.append(
                    '<option id="' + index + '" value="' + index + '">' +
                    Localization.getText( index ) + '</option>\n'
                );
            }
        }
        tasksMenu.selectmenu("refresh");

        // Changing the tasks menu selected option will 
        // navigate to the selected task page
        tasksMenu.change( function() {
            navigateToTaskPage( $(this).val() );
        });
    }
    
    /**
     * Navigate to the task page specified by pageId.
     * If the page has a navigate function, use it to perform the navigation.
     * Otherwise, navigate directly to it.
     * @param pageId
     */
    function navigateToTaskPage( pageId ) {
        debug && console.log( "UIFrame.navigateToTaskPage: Navigating to page ID " + pageId );
        var page = Pages[pageId];
        
        // Check for a PSRT launch request
        if( page.url == 'crowncatalog.html' ) {

        	Util.startPSRT();
        	
        	// Refresh the TasksMenu display to "tasks"
        	$( "#tasksMenuSelect option[value='" + Localization.getText( "tasks" )  +"']" ).attr( "selected", "selected" );
        	$( "#tasksMenuSelect" ).selectmenu( 'refresh' );
        } else if ( _.has( page, "navigateFunction" ) && _.isFunction( Pages[pageId].navigateFunction) ) {
            Pages[pageId].navigateFunction();
        } else {
            navigateToPage( Pages[pageId].url );
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
     *                JSONData.getNewWorkOrderCount() is called.
     */
    function updateToolboxCountBadge( count ) {
        if ( count === undefined ) {
            count = JSONData.getNewWorkOrderCount();
        }
        debug && console.log( "UIFrame.updateToolboxCountBadge: Changing toolbox count to " + count );
        var toolboxIcon = $('#toolboxIcon');
        if ( toolboxIcon.mobileBadge ) {
            toolboxIcon.mobileBadge( {
                count: count,
                position: 'topright'
            });
        }
    }

    /**
     * Update the current work order status.  This information is displayed in the footer
     * on every page
     */
    function updateCurrentWorkOrderStatus() {
        debug && console.log( "UIFrame.updateCurrentWorkOrderStatus: Changing current work order in footer" );
        var currentWorkOrder = JSONData.getCurrentWorkOrder();
        var currentWorkOrderStatusText = "";
        if ( currentWorkOrder ) {
            currentWorkOrderStatusText = Localization.getText("currentWorkOrder") + " " + 
                                         JSONData.getObjectById( "customers", currentWorkOrder.customerId ).name + 
                                         " - " + currentWorkOrder.documentNumber;
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
        debug && console.log( "UIFrame.updateCurrentTechnicianStatus: Changing current technician status in footer" );

        var currentStatus = Localization.getText( JSONData.getCurrentClockingStatus( currentTimeEntry ) );
        var formattedTime = Localization.formatDateTime( currentTimeEntry.timeStart, "t" );
        
        var currentTechnicianStatus = currentStatus + " - " + formattedTime;
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
        // var currentTechnicianStatusIcon = window.localStorage.getItem( LS_CURRENT_TECHNICIAN_STATUS_ICON );
        if ( currentTechnicianStatus /* && currentTechnicianStatusIcon */ ) {
            $("#currentTechnicianStatus").text( currentTechnicianStatus );
        }
    }

    /**
     * Display the end non productive clocking dialog.
     * @param newClockingStatus - New technician clocking status, defaults to technicianStatusLoggedIn
     *                            if undefined.
     */
    function displayEndNonProductiveClockingDialog( newClockingStatus ) {
        var currentClockingStatus = JSONData.getCurrentClockingStatus();
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
            case "technicianStatusNoPay" :
                dialogPrompt = "endNoPayClockingPrompt";
                dialogTitle = "endNoPayClockingTitle";
                break;
            case "technicianStatusPaperwork" :
                dialogPrompt = "endPaperworkClockingPrompt";
                dialogTitle = "endPaperworkClockingTitle";
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
        $(document).simpledialog2({
            mode : 'blank',
            blankContent : dialogHtml
        });
    }

    /**
     * Display the non-productive clocking dialog.  Tapping the save button inside this dialog
     * calls JSONData.saveClockingStatus
     */
    function displayNonProductiveClockingDialog() {
        debug && console.log( "UIFrame.displayNonProductiveClockingDialog: Displaying non-productive clocking dialog" );
        var dialogHtml = new EJS({url: 'templates/nonproductiveclockingdialog' }).render( {
            nonProductiveStatuses : JSONData.getNonProductiveClockingStatuses()
        });
        $(document).simpledialog2({
            mode : 'blank',
            blankContent : dialogHtml,
            width : '400px'
        });
    }
    
    /**
     * Display the start time dialog.  Tapping the save button inside this dialog
     * calls JSONData.saveClockingStatus
     * @param newClockingStatus - Clocking status to use JSONData.saveClockingStatus
     *                            saves the clocking status.
     */
    function displayStartTimeDialog( newClockingStatus, clockingChangeCompleteCallback,
                                     changeClockingStatusCompleteCallbackArgs ) {
        debug && console.log( "UIFrame.displayStartTimeDialog: Displaying start time dialog" );
        
        // Start time inside dialog depends upon current clocking status
        var currentClockingStatus = JSONData.getCurrentClockingStatus( null );
        var startTime = null;
        if ( currentClockingStatus == "technicianStatusLoggedIn" ) {
            startTime = JSONData.getCurrentClockingStartTime( null );
        } else {
            startTime = Util.getISOCurrentTime();
        }
        
        // Dialog template, title and prompt depend upon current clocking status
        var dialogTemplate = "startworkorderwithtraveloptiondialog";
        var dialogPrompt   = "startWorkOrderPrompt";
        var dialogTitle    = "openWorkOrder";
        switch ( currentClockingStatus ) {
            case "technicianStatusLoggedIn" :
                dialogTemplate = "starttimewithtraveloptiondialog";
                dialogPrompt   = "startTimePrompt";
                dialogTitle    = "startTimeTitle";
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
        // the start time dialog.
        var showTravelCheckbox = true;
        var workOrderForClockingChange = JSONData.getObjectById( "workOrders", JSONData.getWorkOrderIdForClockingChange() );
        if ( JSONData.isWorkOrderSignedByTechnician( workOrderForClockingChange ) ) {
            debug && console.log( "UIFrame.displayStartTimeDialog: Hiding travel checkbox because work order " + 
                                  workOrderForClockingChange.documentNumber + " is signed by the technician" );
            showTravelCheckbox = false;
        }
        
        var dialogHtml = new EJS({url: 'templates/' + dialogTemplate}).render( {
            dialogPrompt : dialogPrompt,
            dialogTitle : dialogTitle,
            showTravelCheckbox : showTravelCheckbox,
            startTime : startTime,
            newClockingStatus : newClockingStatus
        });
        
        $(document).simpledialog2({
            mode : 'blank',
            width: '340px',
            blankContent : dialogHtml,
            callbackClose : clockingChangeCompleteCallback,
            callbackCloseArgs : changeClockingStatusCompleteCallbackArgs
        });
    }

    /**
     * Display the terminate clocking dialog.  Tapping the yes button inside this dialog
     * will change the clocking status to "Logged In".
     */
    function displayTechnicianArrivedDialog() {
        debug && console.log( "UIFrame.displayTechnicianArrivedDialog: Displaying technician arrived dialog" );
        var dialogHtml = new EJS({url: 'templates/technicianarriveddialog' }).render();
        $(document).simpledialog2({
            mode : 'blank',
            width: '400px',
            blankContent : dialogHtml
        });
    }

    /**
     * Display the terminate clocking dialog.  Tapping the yes button inside this dialog
     * will change the clocking status to "Logged In".
     */
    function displayTerminateClockingDialog() {
        debug && console.log( "UIFrame.displayTerminateClockingDialog: Displaying terminate clocking dialog" );
        var dialogHtml = new EJS({url: 'templates/terminateclockingdialog' }).render();
        $(document).simpledialog2({
            mode : 'blank',
            width: '400px',
            blankContent : dialogHtml
        });
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
        $('input[data-type="search"]').val( newFilterString );
        $('input[data-type="search"]').trigger( "change" );
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
        $(".guided-search-clear-button").find("span[data-theme='r']").each( function() {
            $(this).css( guidedSearchClearButtonPos );
        });
        
        // Set the theme for the clear button's surrounding anchor to 
        // match the theme of a selected guided search item.
        debug && console.log( "UIFrame.refreshGuidedSearch: Setting theme for clear button to match selected guided search item" );
        $("a.guided-search-clear-button").removeClass(GUIDED_SEARCH_ITEM_DEFAULT_CLASS).addClass(GUIDED_SEARCH_ITEM_SELECTED_CLASS);
        
        // All clear buttons are initially hidden
        debug && console.log( "UIFrame.refreshGuidedSearch: Hidding all clear buttons" );
        $(".guided-search-clear-button").hide();
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

        $(document).simpledialog2({
            mode : 'blank',
            blankContent : alert
        });
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
     * Get a new valid work order document number 
     */
    function getNewValidWorkOrderNumber() {
    	var date = new Date();
    	var configuration = JSONData.getConfig();
    	var newWorkOrderIndex = configuration.localWorkOrderIndex;
    	var tempWorkOrderNumber = "";
    	var validWorkOrderNumber = false;
    	var pmWorkOrders = _.sortBy( _.filter( JSONData.getObjectsByDataType( "workOrders" ), function( wo ) {
    		return wo.workOrderSegments[0].folderId == 359;
    	}), function( wo ) {
    		return wo.documentNumber;
    	});
    	
    	newWorkOrderIndex++;
    	newWorkOrderIndex = ( newWorkOrderIndex < 10 ) ? "00" + newWorkOrderIndex : 
    		( newWorkOrderIndex < 100 ) ? "0" + newWorkOrderIndex: newWorkOrderIndex;

		tempWorkOrderNumber = date.getYear() - 100;
		tempWorkOrderNumber += ( date.getMonth() < 10 ) ? "0" + parseInt( date.getMonth() + 1 ).toString() :  parseInt( date.getMonth() + 1 ).toString() ;
		tempWorkOrderNumber += ( date.getDate() < 10 ) ? "0" + parseInt( date.getDate()).toString() :  parseInt( date.getDate()).toString() ;
    	
		// Loop through the local work order document numbers to ensure that the localWorkOrderIndex is accurate
		if( pmWorkOrders.length > 0 ) {
			while( !validWorkOrderNumber ) {
				debug && console.log( "UIFrame.getNewValidWorkOrderNumber: Attempting new workOrderindex " + newWorkOrderIndex );
				if( _.filter( pmWorkOrders, function( wo ) {
					return wo.documentNumber.substring( 0, 11 ) == "PM" + tempWorkOrderNumber + newWorkOrderIndex;
				}).length == 0 ) {
					debug && console.log( "UIFrame.getNewValidWorkOrderNumber: workOrderindex " + newWorkOrderIndex + " is valid" );
					validWorkOrderNumber = true;
				} else {
					debug && console.log( "UIFrame.getNewValidWorkOrderNumber: workOrderindex " + newWorkOrderIndex + " is invalid, incremening configuration.newWorkOrderIndex" );
					newWorkOrderIndex++;
			    	newWorkOrderIndex = ( newWorkOrderIndex < 10 ) ? "00" + newWorkOrderIndex : 
			    		( newWorkOrderIndex < 100 ) ? "0" + newWorkOrderIndex: newWorkOrderIndex;
				}
			}
			
			configuration.localWorkOrderIndex = newWorkOrderIndex;
		}
		
		
    	var newDocumentNumber = tempWorkOrderNumber + newWorkOrderIndex;
        
    	// Increment the localWorkOrderIndex
        JSONData.saveJSON( "configuration", configuration );
        return newDocumentNumber;
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
        // If the ManageWorkOrderParts object is still valid, we can safely call into 
        // it to complete PSRT integration
        if ( typeof ManageWorkOrderParts !== 'undefined' ) {
            ManageWorkOrderParts.addPSRTPartsToPartList();
        } 
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
            switch ( UIFrame.getCurrentPageId() ) {
                case "manageWorkOrderRepairDetailsPage" :
                    // Restore the repair details button in the navbar as active
                    $("#manageWorkOrderRepairDetails").addClass( "ui-btn-active" );
                    break;
                case "manageWorkOrderPartsPage" :
                    // Restore the parts button in the navbar as active
                    $("#manageWorkOrderParts").addClass( "ui-btn-active" );
                    break;
            }
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
    
    
    
    // Public accessible methods are exposed here
    return {
        'USE_NATIVE_SELECT'                         : USE_NATIVE_SELECT,
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
        'closeActiveDialog'                         : closeActiveDialog,
        'displayEndNonProductiveClockingDialog'     : displayEndNonProductiveClockingDialog,
        'displayNonProductiveClockingDialog'        : displayNonProductiveClockingDialog,
        'displayStartTimeDialog'                    : displayStartTimeDialog,
        'displayTechnicianArrivedDialog'            : displayTechnicianArrivedDialog,
        'displayTerminateClockingDialog'            : displayTerminateClockingDialog,
        'getCurrentPage'                            : getCurrentPage,
        'getCurrentPageId'                          : getCurrentPageId,
        'getImagePath'                              : getImagePath,
        'getNewValidWorkOrderNumber'                : getNewValidWorkOrderNumber,
        'init'                                      : init,
        'initListFilter'                            : initListFilter,
        'initListFilterGuidedSearchSelection'       : initListFilterGuidedSearchSelection,
        'isDialogDisplayed'                         : isDialogDisplayed,
        'navigateToPage'                            : navigateToPage,
        'navigateToPreviousPage'                    : navigateToPreviousPage,
        'postPageSpecificInit'                      : postPageSpecificInit,
        'refreshGuidedSearch'                       : refreshGuidedSearch,
        'refreshGuidedSearchWithSelectedItem'       : refreshGuidedSearchWithSelectedItem,
        'reloadCurrentPage'                         : reloadCurrentPage,
        'resetGuidedSearch'                         : resetGuidedSearch,
        'updateCurrentTechnicianStatus'             : updateCurrentTechnicianStatus,
        'updateCurrentWorkOrderStatus'              : updateCurrentWorkOrderStatus,
        'updateGuidedSearchItemCount'               : updateGuidedSearchItemCount,
        'updateListDividerItemCount'                : updateListDividerItemCount,
        'updateMessageCountBadge'                   : updateMessageCountBadge,
        'updateToolboxCountBadge'                   : updateToolboxCountBadge,
        'validatePageId'                            : validatePageId
    };
}();
