/**
 * vaninventoryadd.js
 */

"use strict";

/**
 * VanInventoryAdd object
 */
var VanInventoryAdd = function() {
    var desiredParts = {},
        workingInventory = null,
        guidedSearchCriteria = false,
        sortCriteria = "sortByPartAsc";

    // Maintain a variable for the current inventory page index
    var currentPage = 1,
    	totalPages = 1;
    
    /**
     * Constants
     */
    var ADD_PART_TEXT     = "";
    var REMOVE_PART_TEXT  = "";
    var REQUEST_PART_TEXT = "";
    var LIST_ITEM_NUMBER = 50;

    // Local copies of JSON object areas, used to improve rendering performance
    var inventoryArray = [];
    
    /**
     * Initialization method for the van inventory add page
     * @param pageId
     */
    function init( pageId ) {
        // Get the inventory, product and stock area data from the DB
        debug && console.log( "VanInventoryAdd.init: Getting inventory and product info from the DB" );
        MobileDb.selectData( MobileDb.SQL_SELECT_INVENTORY_PRODUCTS_STOCKAREAS_AVAILABLE, null, function( results ) {
            
            ADD_PART_TEXT     = Localization.getText( "addPart" );
            REMOVE_PART_TEXT  = Localization.getText( "removePart" );
            REQUEST_PART_TEXT = Localization.getText( "requestPart" );
            
            debug && console.log( "VanInventoryAdd.init: Inventory product and stock area query returned " + results.length + " rows" );
            inventoryArray = _.toArray( $.extend( true, {}, results ) );
            
            // Determine the required amount of pages
            totalPages = parseInt(( inventoryArray.length + ( LIST_ITEM_NUMBER - 1 )) / LIST_ITEM_NUMBER );
            
            // Populate the page
            debug && console.log( "VanInventoryAdd.init: Calling populatePage()" );
            populatePage();

            // TODO this causes duplications in the list when the guided search is clear
            // $('#stockArea1').click();
            $('.headerIcon').remove();
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
            debug && console.log( "VanInventoryAdd.init: Calling UIFrame.postPageSpecificInit()" );
            UIFrame.adjustListViewBorders();
            UIFrame.postPageSpecificInit( pageId );
        }, null );
    }
    
    /**
     * Knockout view Model
     */
    var inventoryViewModel = {
        inventory : ko.observableArray([]),
        quantity: ko.observable( 1 ),
        pageNumber: ko.observable( 1 ),
        pageCount: ko.observable( totalPages ),
        // Add this item from the desiredParts array
        addMe : function( item, event ) {
            var btnId = "#" + item.webId;
            
            // Assign the correct text to the button
            if( $(btnId).text() == ADD_PART_TEXT || $(btnId).text() == REQUEST_PART_TEXT ) {
                $(btnId).text( REMOVE_PART_TEXT );
                
                var inventory = _.find( workingInventory, function( inventoryItem ) {
                    return inventoryItem.webId == item.webId; 
                });
                
                // Add this part to the desiredParts array
                desiredParts[item.webId] = {};
                desiredParts[item.webId]['id'] = item.webId;
                desiredParts[item.webId]['desiredQuantity'] = item.desiredQuantity();
                desiredParts[item.webId]['stockAreaId'] = inventory.stockAreaId;
                
                Dialog.showAlert( Localization.getText( "partsAdded" ), Localization.getText( "partsAddedDialog" ));
            } else if( $(btnId).text() == REMOVE_PART_TEXT ) {
                desiredParts[item.webId] = undefined;
                
                // if the desired amount exceeds the available amount
                if( item.desiredQuantity() <= item.quantity ) {
                    $(btnId).text( ADD_PART_TEXT );
                } else {
                    $(btnId).text( REQUEST_PART_TEXT );
                }

                Dialog.showAlert( Localization.getText( "partsRemoved" ), Localization.getText( "partsRemovedDialog" ));
            }
            
        },
        // Click handler for decrementing a part's quantity inside the part header
        decrementDesiredQuantity : function( item, event ) {
            debug && console.log( "VanInventoryAdd.decrementDesiredQuantity: Decrementing desired quantity" );
            var addBtn = "#" + item.webId;

            // If the inventory hasn't been added yet
            if( $(addBtn).text() != REMOVE_PART_TEXT ) {   
                var newQty = parseInt( item.desiredQuantity() - 1 );
                if ( newQty < 1 ) {
                    newQty = 1;
                }
    
                item.desiredQuantity( newQty );
                // If the desired amount is now less than or equal to the available amount
                if( item.desiredQuantity() <= item.quantity ) {
                    $(addBtn).text( ADD_PART_TEXT );
                }
            }
        },
        // Click handler for incrementing a part's quantity inside the part header
        incrementDesiredQuantity : function( item, event ) {
            debug && console.log( "VanInventoryAdd.incrementQtyInHeader: Incrementing desired quantity" );
            var addBtn = "#" + item.webId;
            
            // If the inventory hasn't been added yet 
            if( $(addBtn).text() != REMOVE_PART_TEXT ) {   
                item.desiredQuantity( parseInt( item.desiredQuantity() + 1 ) );
                
                // if the desired amount exceeds the available amount
                if( item.desiredQuantity() > item.quantity ) {
                    $(addBtn).text( REQUEST_PART_TEXT );
                }
            }
        },
        nextPage : function( item, event ) {
        	debug && console.log( "VanInventoryAdd.nextPage: Next list results page" );
        	if( this.pageNumber() < this.pageCount ) {
        		this.pageNumber( this.pageNumber() + 1 );
        		
        		this.updateListPage();
        	}

        	fixAddButtons();
        },
        previousPage : function( item, event ) {
        	debug && console.log( "VanInventoryAdd.nextPage: Previous list results page" );
        	
        	if( this.pageNumber() > 1 ) {
        		this.pageNumber( this.pageNumber() - 1 );
        		
        		this.updateListPage();
        	}

        	fixAddButtons();
        },
        updateListPage : function() {
        	debug && console.log( "VanInventoryAdd.updateListPage: Updating the list results display" );
        	var pageNumber = parseInt( this.pageNumber() );
    		
        	// Confirm that an index out of range event doesn't occur
        	if( pageNumber * LIST_ITEM_NUMBER < workingInventory.length ) {
        		this.inventory( workingInventory.slice(( pageNumber - 1 ) * LIST_ITEM_NUMBER, pageNumber * LIST_ITEM_NUMBER ));
        	} else {
        		this.inventory( workingInventory.slice(( pageNumber - 1 ) * LIST_ITEM_NUMBER ));
        	}
        }
    };
    
    /**
     * Populate the working inventory array for the inventory list
     */
    function populatePage( newInventoryList, repopulatingList ) {
        debug && console.log( "VanInventoryAdd.populatePage: Populating the van inventory list" );

        var stockAreas = {};
        
        if( repopulatingList == undefined ) {
            repopulatingList = false;
        }
        
        if( !repopulatingList ) {            
            workingInventory = inventoryArray;
            inventoryViewModel.pageCount = totalPages;
            
            desiredParts = {};
            
            desiredParts.size = function() {
                var size = 0,
                    key = null;
                for( key in desiredParts ) {
                    if( desiredParts.hasOwnProperty(key)) {
                        size++;
                    }
                }
                return size;
            };
            
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
            
            // Bind the listeners for the done button
            $('#btnDone').click( function() {
                debug && console.log( "VanInventory: Done button pressed, opening manage work order parts page." );
                
                // Get the work order
                var woLineForProduct = null,
                    currentWorkOrder = JSONData.getCurrentWorkOrder();
                
                // Loop through desiredParts
                var inventoryChanges = [];
                for( var part in desiredParts ) {
                    if( desiredParts[part] != undefined && desiredParts[part].id != undefined ) {
                        debug && console.log( "VanInventoryAdd.btnDone: Adding inventory part: " + desiredParts[part].id );
                        var inventory = JSONData.getObjectFromArrayById( inventoryArray, desiredParts[part].id );
                        
                        // If there are no parts to request
                        if( desiredParts[part].desiredQuantity <= inventory.quantity ) {
                            woLineForProduct = JSONData.createNewWorkOrderLine();
                            woLineForProduct.type = JSONData.WORK_ORDER_LINE_PART_TYPE;
                            woLineForProduct.product.webId = inventory.productId;
                            woLineForProduct.product.productCode = inventory.productCode;
                            woLineForProduct.product.manufacturer = inventory.manufacturer;
                            woLineForProduct.description = inventory.description();
                            woLineForProduct.qtyOrdered = desiredParts[part].desiredQuantity;
                            woLineForProduct.inventoryId = inventory.webId;
                            
                            JSONData.addLineToWorkOrder( currentWorkOrder, woLineForProduct);
                            
                            // subtract the quantity from inventory
                            changeInventoryQtyForPart( inventory.webId, inventory.desiredQuantity(), false );
                        } else {
                            var partsRequestAmount = parseInt( desiredParts[part].desiredQuantity - inventory.quantity);
                            
                            // Add a line for the quantity amount if quantity != 0
                            if( inventory.quantity != 0 ) {
                                woLineForProduct = JSONData.createNewWorkOrderLine();
                                woLineForProduct.type = JSONData.WORK_ORDER_LINE_PART_TYPE;
                                woLineForProduct.product.webId = inventory.productId;
                                woLineForProduct.product.productCode = inventory.productCode;
                                woLineForProduct.product.manufacturer = inventory.manufacturer;
                                woLineForProduct.description = inventory.description();
                                woLineForProduct.qtyOrdered = inventory.quantity;
                                woLineForProduct.inventoryId = inventory.webId;

                                JSONData.addLineToWorkOrder( currentWorkOrder, woLineForProduct);
                            }
                            
                            // Add a line for the difference between quantity and desired amount
                            woLineForProduct = JSONData.createNewWorkOrderLine();
                            woLineForProduct.type = JSONData.WORK_ORDER_LINE_PART_TYPE;
                            woLineForProduct.product.webId = inventory.webId;
                            woLineForProduct.product.productCode = inventory.productCode;
                            woLineForProduct.product.manufacturer = inventory.manufacturer;
                            woLineForProduct.description = inventory.description();
                            woLineForProduct.qtyOrdered = partsRequestAmount;
                            woLineForProduct.inventoryId = null;
                            
                            JSONData.addLineToWorkOrder( currentWorkOrder, woLineForProduct);

                            // subtract the quantity from inventory
                            changeInventoryQtyForPart( inventory.webId, inventory.quantity, false );            
                        }
                        // Add current inventory to list that needs to be saved
                        inventoryChanges.push( inventory );
                    }
                }
                // Save the inventory quantity changes
                JSONData.saveInventoryQuantityChanges( inventoryChanges, function() { 
                    UIFrame.navigateToPage( "manageworkorderparts.html" );
                }, null );
            });
        } else {
            inventoryViewModel.inventory.removeAll();
            
            workingInventory = newInventoryList;
        }
        
        var currentInventory = null;

        debug && console.log( "VanInventoryAdd.populatePage: Adding " + workingInventory.length + " inventory items to the list." );
        // Push the inventory items to the observable array
        if( workingInventory ) {
            for( var i = 0; i < workingInventory.length; i++ ) {
                currentInventory = workingInventory[i];
                
                currentInventory.description =  ko.observable( currentInventory.description );

                // If this item's webId isn't in the desiredParts array
                if( desiredParts[currentInventory.webId] == undefined ) {
                    currentInventory.desiredQuantity = ko.observable( 1 );
                } else {
                    currentInventory.desiredQuantity = ko.observable( desiredParts[currentInventory.webId]['desiredQuantity'] );
                }
                
                if(( currentPage - 1 ) * LIST_ITEM_NUMBER <= i && i < currentPage * LIST_ITEM_NUMBER ) {
                	inventoryViewModel.inventory.push( currentInventory );
                }
                
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
        }
        
        if( !repopulatingList ) {
            debug && console.log( "VanInventoryAdd.populatePage: Adding guided search dividers for stock areas" );
            UIFrame.addGuidedSearchDivider( Localization.getText( "stockAreas" ) );
            for( var stockArea in stockAreas ) {
                if( stockAreas[stockArea].id != undefined ) {
                    UIFrame.addGuidedSearchItem( stockAreas[stockArea].name, "stockArea" + stockAreas[stockArea].id, stockAreas[stockArea].count );
                }
            }
            
            debug && console.log( "VanInventoryAdd.populatePage: Refreshing guided search" );
            UIFrame.refreshGuidedSearch();
            UIFrame.bindGuidedSearchClickHandler( guidedSearchClickHandler );

            debug && console.log( "VanInventoryAdd.populatePage: Applying Knockout bindings" );
            ko.applyBindings( inventoryViewModel );
            
            // Bind the next/previous button listeners
            $('#nextPage').click( function() {
 		       	if( currentPage + 1 <= totalPages ) {
 		       		currentPage ++;
 		       		$('#currentPage').text( currentPage );
 		       		
 		       		inventoryViewModel.nextPage();
 		       	}
            });
            
            $('#previousPage').click( function() {
 	           	if( currentPage > 1 ) {
 	           		currentPage --;
 	           		$('#currentPage').text( currentPage );
 	           		
 	           		inventoryViewModel.previousPage();
 	           	}
            });
            
            fixAddButtons();
            applySearchInventoryHandler();
        }

        initializePaging();
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
    	var searchVal = $( "#inventorySearch" ).val();
    	
    	var inventoryResults = _.filter( inventoryArray, function( currentItem ) {
    		return ( currentItem.productCode + " " + currentItem.description() + " " + currentItem.manufacturer ).toLowerCase().indexOf( searchVal.toLowerCase() ) != -1;
    	});
    	
    	// Update the inventory description for the Knockout ViewModel
    	for( var r in inventoryResults ) {
    		inventoryResults[r].description = inventoryResults[r].description();
    	}
    	
    	debug && console.log( "VanInventory.applySearchInventoryHandler: " + inventoryResults.length + " results found. " );
        currentPage = 1;
        totalPages = parseInt(( inventoryResults.length + ( LIST_ITEM_NUMBER - 1 )) / LIST_ITEM_NUMBER );
        
        // Re-Process the inventory    	
    	populatePage( inventoryResults, true );
        workingInventory = inventoryResults;

    	initializePaging();
    	fixAddButtons();
    }
    
    function initializePaging() {
    	debug && console.log( "VanInventory.initializePaging: Initializing vanInventory paging for page " + parseInt( currentPage ) );
    	$('#currentPage').text( currentPage );
        $('#pageCount').text( totalPages );
    }
    
    /**
     * Change the inventory quantity for a part by the amount 
     * specified inside the part object passed in
     * @param inventoryId
     * @param qty - quantity change
     * @param increaseQty - If true, inventory quantity is increased
     *                      If false, inventory quantity is decreased
     */
    function changeInventoryQtyForPart( inventoryId, qty, increaseQty ) {
        var inventoryForPart = _.find( inventoryArray, function( inventoryInList ) {
            return inventoryInList.webId == inventoryId;
        });
        if ( inventoryForPart ) {
            if ( increaseQty ) {
                inventoryForPart.quantity += qty;
            } else {
                inventoryForPart.quantity -= qty;
            }
            inventoryForPart.changed = true;
            debug && console.log( "VanInventoryAdd.changeInventoryQtyForPart: Quantity for inventory ID " + 
                                  inventoryId + ( increaseQty ? " increased" : " decreased" ) + " by " + qty +  
                                  " to " + inventoryForPart.quantity ); 
        } else {
            debug && console.log( "VanInventoryId.changeInventoryQtyForPart: Inventory object does not exist" );
        }
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

        debug && console.log( "VanInventoryAdd.clearGuidedSearch: Resetting van inventory list views" );
        
        var clearedArray = inventoryArray;
        for( var arrayItem in clearedArray ) {
        	clearedArray[arrayItem].description = clearedArray[arrayItem].description(); 
        }
        
        populatePage( inventoryArray, true );
        guidedSearchCriteria = false;
        UIFrame.resetGuidedSearch( this );

        fixAddButtons();
    }
    
    /**
     * Ensure that the add buttons always show the same text and bind the click listener
     */
    function fixAddButtons() {
        debug && console.log( "VanInventoryAdd.fixAddButtons: Applying fix to add buttons" );
        
        // Process the partsDesired array and change the button text when appropriate
        var key = null,
            id = "";
        
        // Find buttons with insufficient quantity
        for( var part in workingInventory ) {
            id = "#" + workingInventory[part].webId;
            if( workingInventory[part].quantity < 1 ) {
                $(id).text( REQUEST_PART_TEXT );
            } else {
                $(id).text( ADD_PART_TEXT );
            }
        }
        
        for( key in desiredParts ) {
            if( desiredParts.hasOwnProperty(key) && desiredParts[key].id != undefined ) {
                id = "#" + desiredParts[key].id;
                // TODO $(id).attr('data-theme', 'b').removeClass("ui-btn-up-c").addClass("ui-btn-up-b").trigger('create');
                $(id).text( REMOVE_PART_TEXT );
            }
        }
    }
    
    /**
     * Guided search click handler for the van inventory list page
     * @param event - the click event
     */
    function guidedSearchClickHandler( event ) {
        debug && console.log( "VanInventoryAdd.guidedSearchClickHandler" );
        
        // If there wasn't a prior guidedSearch selection
        if( !guidedSearchCriteria ) {
            var stockAreaId = this.id.match( /stockArea(\d+)/ )[1];
            for( var i = 0; i < inventoryViewModel.inventory().length; i++ ) {
                if( inventoryViewModel.inventory()[i].stockAreaId != stockAreaId ) {
                    
                    inventoryViewModel.inventory.remove( inventoryViewModel.inventory()[i] );
                    i --;
                }
            }

            guidedSearchCriteria = true;
            UIFrame.changeListFilter( "" );
            UIFrame.refreshGuidedSearchWithSelectedItem( this, clearGuidedSearch );
        // A guided search item was selected after another was already selected
        } else {
            populatePage( inventoryArray, true );
            guidedSearchCriteria = false;

            fixAddButtons();
            $(this).click();
        }
    }
    
    /**
     * Handle the sort change event
     */
    function sortChangeHandler() {
        debug && console.log( "VanInventoryAdd.sortChangeHandler: Changing sort criteria to " + this.value );
        sortCriteria = this.value;
        populatePage( inventory, true );
    }
    
    /**
     * Sort the van inventory list.  Sort by part number ascending is the default criteria
     */
    function sortList() {
        var sortedList = null;
        switch ( sortCriteria ) {
            case "sortByManufacturer" :
                debug && console.log( "VanInventoryAdd.sortList: Sorting by manufacturer" );
                sortedList = _.sortBy( inventory, function( currentInventory ) {
                    return currentInventory.manufacturer;
                });
                break;
            case "sortByQuantityAsc" :
                debug && console.log( "VanInventoryAdd.sortList: Sorting by quantity ascending" );
                sortedList = _.sortBy( inventory, function( currentInventory ) {
                    return currentInventory.quantity;
                });
                break;
            case "sortByQuantityDes" :
                debug && console.log( "VanInventoryAdd.sortList: Sorting by quantity descending" );
                sortedList = _.sortBy( inventory, function( currentInventory ) {
                    return - (currentInventory.quantity);
                });
                break;
            case "sortByPartDes" :
                debug && console.log( "VanInventoryAdd.sortList: Sorting by part ascending" );
                sortedList = _.sortBy( inventory, function( currentInventory ) {
                    return - currentInventory.productCode;
                });
                break;
            default:
                debug && console.log( "VanInventoryAdd.sortList: Sorting by part ascending" );
                sortedList = _.sortBy( inventory, function( currentInventory ) {
                    return currentInventory.productCode;
                });
                break;
        }

        inventory = sortedList;
    }
    
    return {
        'init'          : init,
        'fixAddButtons' : fixAddButtons,
        'populatePage'  : populatePage
    };
}();

/**
 * pageinit event handler 
 */
$("div:jqmData(role='page')").on( "pageinit", function( event, ui ) {
    // All pages must set pageId to this.id
    var pageId = this.id;
    debug && console.log( "VanInventoryAdd.pageinit: Initializing " + pageId );
    // This MUST be called by every page specific pageinit event handler!
    UIFrame.init( pageId, function() {
        debug && console.log( "VanInventoryAdd.pageinit: Executing page specific init" );
        
        // Page specific init
        VanInventoryAdd.init( pageId );
    });
});
