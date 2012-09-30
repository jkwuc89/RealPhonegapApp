/**
 * vaninventory.js
 */

"use strict";

/**
 * VanInventory object
 */
var VanInventory = function() {
    var stockAreas = {};

    // Maintain a variable for the current inventory page index
    var totalPages = 1,
    	currentPage = 0,
    	inventory = null;
    
    /**
     * Constants
     */
    var LIST_ITEM_NUMBER = 50;

    // Local copies of JSON object areas, used to improve rendering performance
    var inventoryArray = [];
    
    /**
     * Initialization method for the van inventory page
     */
    function init( pageId ) {
        // Get the inventory, product and stock area data from the DB
        debug && console.log( "VanInventoryAdd.init: Getting inventory and product info from the DB" );
        MobileDb.selectData( MobileDb.SQL_SELECT_INVENTORY_PRODUCTS_STOCKAREAS_AVAILABLE, null, function( results ) {
        	
            debug && console.log( "VanInventory.init: Inventory product and stock area query returned " + results.length + " rows" );
            inventoryArray = _.toArray( $.extend( true, {}, results ) );
            
            // Determine the required amount of pages
            totalPages = parseInt( ( inventoryArray.length + (LIST_ITEM_NUMBER - 1)) / LIST_ITEM_NUMBER );
            
            // Populate the page
            debug && console.log( "VanInventory.init: Calling populatePage()" );
            populateListViews();

            // TODO this causes duplications in the list when the guided search is clear
            // $('#stockArea1').click();
            $("#listSortSelectDiv").remove();
            
            // Adjust the style to hide the search form that appears at the top of the
            // van inventory list
            var vanInventoryListSearchFormStyle = {
                'margin-left'  : '0px',
                'margin-right' : '0px',
                'margin-top'   : '5px',
                'margin-bottom': '0px',
                'border-style' : 'none'
            };
            $(".ui-listview-filter").css( vanInventoryListSearchFormStyle );
            
            // This MUST be the last line inside each page specific init function
            debug && console.log( "VanInventory.init: Calling UIFrame.postPageSpecificInit()" );
            UIFrame.postPageSpecificInit( pageId );
            UIFrame.adjustListViewBorders();
        }, null );
    }
    
    /**
     * Populate the vanInventoryListView
     */
    function populateListViews( vanInventoryList, repopulatingList ) {
        debug && console.log( "VanInventory.populateListViews: Populating the van inventory list" );
        
        if( repopulatingList === undefined ) {
            repopulatingList = false;
        }

        if( !repopulatingList ) {
            $('#guidedSearchList').children('li').remove();
            UIFrame.addGuidedSearchDivider( Localization.getText( "stockAreas" ) );
        }
        
        if( vanInventoryList && vanInventoryList.length >= 0 ) {
            inventory = vanInventoryList;
        } else {
            inventory = inventoryArray;
            
            stockAreas.size = function() {
            var size = 0,
                key = null;
                for( key in stockAreas ) {
                    if( stockAreas.hasOwnProperty(key)) {
                        size++;
                    }
                }
                return size;
            };
        }
        
        totalPages = parseInt( ( inventory.length + (LIST_ITEM_NUMBER - 1)) / LIST_ITEM_NUMBER );
        
        var vanInventoryListItem = null,
            vanInventoryList = $('#vanInventoryList');
            vanInventoryList.children('li').remove();
            
            // Initial list items for the van inventory list
            vanInventoryListItem = new EJS({url: 'templates/vaninventorylistitem'});
            vanInventoryList.append( new EJS({url: 'templates/vaninventorylistheader'}).render() );
            
            
        if( inventory && inventory.length > 0) {
            debug && console.log( "VanInventory.populateListViews: " + inventory.length + " inventory items found, paging by " + LIST_ITEM_NUMBER + " results." );
            var endingIndex = ((currentPage + 1) * LIST_ITEM_NUMBER < inventory.length) ? (currentPage + 1) * LIST_ITEM_NUMBER : inventory.length; 
            
            if( !repopulatingList ) {
            	var currentInventory = null;
                
	            for( var i = 0; i < inventory.length; i++ ) {
	                currentInventory = inventory[i];
	                
	                if( i < endingIndex ) {
	                	vanInventoryList.append( vanInventoryListItem.render({
	                		inventory: currentInventory
	                	}));
	                }
	                
	               // Update the stockArea associativeArray regarding this item
	               if( stockAreas[currentInventory.stockAreaId] == undefined ) {
	                   stockAreas[currentInventory.stockAreaId] = {};
	                   stockAreas[currentInventory.stockAreaId]['id'] = currentInventory.stockAreaId;
	                   stockAreas[currentInventory.stockAreaId]['name'] = currentInventory.stockAreaName;
	                   stockAreas[currentInventory.stockAreaId]['type'] = currentInventory.stockAreaType;
	                   stockAreas[currentInventory.stockAreaId]['count'] = 1;
	                } else {
	                   stockAreas[currentInventory.stockAreaId]['count'] ++;
	                }
	            }
            } else {
            	debug && console.log( "VanInventory.populateListViews: Displaying results " +  currentPage * LIST_ITEM_NUMBER + " to " + endingIndex );
            	var startTime = new Date().getTime();
            	
            	for( var i = currentPage * LIST_ITEM_NUMBER; i < endingIndex; i++ ) {
	 	            vanInventoryList.append( vanInventoryListItem.render({ inventory: inventory[i] }));
            	}
            	
            	var executionTime = (new Date().getTime() - startTime) / 1000; 
                debug && console.log( "VanInventoryAdd.populateListViews: Execution time in seconds = " + executionTime );
            }
            
            debug && console.log( "VanInventoryAdd.populateListViews: Refreshing ListView" );
            // Refresh the list so that it is themed correctly 
            
            vanInventoryList.listview('refresh');
        }
        
        // Scan through the vans and add guided search items accordingly
        if( !repopulatingList ) {
            for( var stockArea in stockAreas ) {
                if( stockAreas[stockArea].id != undefined ) {
                    UIFrame.addGuidedSearchItem( stockAreas[stockArea].name, "stockArea" + stockAreas[stockArea].id, stockAreas[stockArea].count );
                }
            }

            // update with the technician's truck identifying information
            UIFrame.refreshGuidedSearch();
            UIFrame.bindGuidedSearchClickHandler( guidedSearchClickHandler );
            
            // Manually override the default ListView behavior
            $('#vanInventoryList').listview('option', 'filterCallback', function ( text, search ) {
         	  return text.toLowerCase().indexOf( search ) === -1;
            });
            
            // Override the updatelayout method to always include the list header
           $('#vanInventoryList').on("updatelayout", function() {
                // ensure that the header is still an item in the list
                var listItems = $('#vanInventoryList').children(":visible");
                if( listItems.length != 0 ) {
                    if( listItems[0].id !== "listHeader" ) {
                        debug && console.log( "VanInventory.populateListViews: Adding missing listview divider" );
                        
                        // prepend the divider if not found
                        $('.van-inventory-list-header').remove();
                        vanInventoryList.prepend( new EJS({url: 'templates/vaninventorylistheader'}).render() );
                        vanInventoryList.listview( 'refresh' );
                    }
                }
            });
           
           // Bind the next/previous button listeners
           $('#nextPage').click( function() {
		       	if( currentPage + 1 < totalPages ) {
		       		currentPage ++;
		       		$('#currentPage').text( currentPage + 1);
		       		populateListViews( inventory, true );
		       	}
           });
           
           $('#previousPage').click( function() {
	           	if( currentPage > 0 ) {
	           		currentPage --;
	           		$('#currentPage').text( currentPage + 1);
	           		populateListViews( inventory, true );
	           	}
           });

           applySearchInventoryHandler();
        }

        initializePaging();
        if ( repopulatingList ) {
            UIFrame.adjustListViewBorders();
        }
    }
    
    /**
     * Bind event handlers to our custom search bar
     */
    function applySearchInventoryHandler() {
        debug && console.log( "VanInventory.applySearchInventoryHandler: Binding the custom inventory search bar handlers" );
        
        // Bind the search handler
        $("#inventorySearch").bind( "change", searchInventoryHandler );
    }
    
    /**
     *  callback for the ListView search event
     */
    function searchInventoryHandler( event, ui ) {
    	debug && console.log( "VanInventory.applySearchInventoryHandler: Searching for listview results" );
    	var searchVal = $("#inventorySearch" ).val();
    	
    	var inventoryResults = _.filter( inventoryArray, function( currentItem ) {
    		return ( currentItem.productCode + " " + currentItem.description + " " + currentItem.manufacturer ).toLowerCase().indexOf( searchVal.toLowerCase() ) != -1;
    	});

    	if( !inventory ) {
    		inventory = [];
    	}
        
    	populateListViews( inventoryResults, true );
    	initializePaging();
    }
    
    /**
     * Guided search click handler for van inventory resets the list views
     * after filtering the inventory
     * @param event - click event    
     */
    function clearGuidedSearch( event ) {
        // These two calls must be the first two lines in all custom clear handlers
        event.preventDefault();
        event.stopPropagation();

        debug && console.log( "VanInventory.clearGuidedSearch: Resetting van inventory list views" );
        
        populateListViews( null, true );
        UIFrame.resetGuidedSearch( this );
        
        currentPage = 0;
    	totalPages = parseInt( ( inventory.length + (LIST_ITEM_NUMBER - 1) ) / LIST_ITEM_NUMBER );
        initializePaging();
    }
    
    /**
     * Guided search click handler for the van inventory list page
     * @param event - the click event
     */
    function guidedSearchClickHandler( event ) {
        debug && console.log( "VanInventory.guidedSearchClickHandler" );

        var filteredInventory = null;
        
        // Stock area guided search
        if( this.id.indexOf("stockArea") != -1 ) {
            var stockAreaId = new Array( this.id.match( /stockArea(\d+)/ )[1] );
           
            filteredInventory = _.filter( inventoryArray, function( currentInventory ) { 
                return currentInventory.stockAreaId == stockAreaId;
            });
        }
        
    	currentPage = 0;
        if( filteredInventory == null ) {
            filteredInventory = [];
        } else {
        	totalPages = parseInt( ( filteredInventory.length + (LIST_ITEM_NUMBER - 1) ) / LIST_ITEM_NUMBER );
        	initializePaging();
        }
         
        populateListViews( filteredInventory, true );
        
        
        UIFrame.refreshGuidedSearchWithSelectedItem( this, clearGuidedSearch );
    }
    
    function initializePaging() {
    	debug && console.log( "VanInventory.initializePaging: Initializing vanInventory paging for page " + parseInt( currentPage + 1 ) );
    	$('#currentPage').text( currentPage + 1 );
        $('#pageCount').text( totalPages );
    }
    
    return {
        'init'              : init,
        'populateListViews' : populateListViews
    };
}();

/**
 * pageinit event handler 
 */
$("div:jqmData(role='page')").on( "pageinit", function( event, ui ) {
    // All pages must set pageId to this.id
    var pageId = this.id;
    debug && console.log( "VanInventory.pageinit: Initializing " + pageId );
    // This MUST be called by every page specific pageinit event handler!
    UIFrame.init( pageId, function() {
        debug && console.log( "VanInventory.pageinit: Page specific init goes here" );

        // Page specific init
        VanInventory.init( pageId );
        
        // Adjust the style to hide the search form that appears at the top of the
        // van inventory list
        var vanInventoryListSearchFormStyle = {
            'margin-left'  : '0px',
            'margin-right' : '0px',
            'margin-top'   : '0px',
            'margin-bottom': '0px',
            'border-style' : 'none'
        };
        $(".ui-listview-filter").css( vanInventoryListSearchFormStyle );
        
        // This MUST be the last line inside each page specific init function
        UIFrame.postPageSpecificInit( pageId );
    });
});
