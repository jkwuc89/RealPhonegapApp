/**
 * debug.js
 */

"use strict";

/**
 *
 */
var Debug = function() {
    var config = Config.getConfig();

    var LOCAL_STORAGE_DUMP_FILE_DIR = config.externalStorageDirectory;
    var LOCAL_STORAGE_DUMP_FILENAME = "crownsfalocalstorage.txt";

    /**
     * Knockout view model for this page
     */
    var debugViewModel = {
        appVersion : ko.observable( config.version ),
        localStorageItems : ko.observableArray( [] ),
        localStorageItemCount : ko.observable(),
        localStorageItemSize : ko.observable(),
        server : ko.observable( config.middleTierLabel ),
        // Click handler for the exit button
        exit : exitClickHandler,
        openItem : openItem,
        save : saveClickHandler
    };

    /**
     * Populate the debug page
     */
    function populatePage() {
        // Variable declarations
        var customer;
        var customerId = Localization.getText( "customerId" );
        var customerName;
        var localStorageDisplayedKey;
        var localStorageKey;
        var localStorageItems = [];
        var localStorageItemValue;
        var localStorageItemValueObject;
        var localStorageItemSize = 0;

        debug && console.log( "Debug.populatePage: Populating debug page" );
        // Hide controls that won't work when logged on in debug mode
        $("#clockIcon" ).hide();
        $("#homeIcon" ).hide();
        $("#messagesIcon" ).hide();
        $("#questionMarkIcon" ).hide();
        $("#toolboxIcon" ).hide();
        $("#tasksMenuDiv" ).hide();

        // Populate the local storage items array

        for ( localStorageKey in window.localStorage ) {
            localStorageItemValue = window.localStorage.getItem( localStorageKey );

            // Augment certain data types with additional information to make locating them easier
            if ( localStorageKey.indexOf( "workOrders." ) == 0 ) {
                localStorageItemValueObject = JSON.parse( localStorageItemValue );
                localStorageDisplayedKey = localStorageKey + " - " + localStorageItemValueObject.documentNumber;
            } else if ( localStorageKey.indexOf( "customers." ) == 0 ) {
                localStorageItemValueObject = JSON.parse( localStorageItemValue );
                localStorageDisplayedKey = localStorageKey + " - " +
                                           localStorageItemValueObject.name;
            } else if ( localStorageKey.indexOf( "pmSchedules." ) == 0 ) {
                localStorageItemValueObject = JSON.parse( localStorageItemValue );
                if ( localStorageItemValueObject.equipment ) {
                    customer = JSONData.getObjectById( "customers", localStorageItemValueObject.customerId, null );
                    if ( customer ) {
                        customerName = customer.name;
                    } else {
                        customerName = Localization.getText( "customerMissing" );
                    }
                    localStorageDisplayedKey = localStorageKey + " - " +
                                               customerName + " - " +
                                               localStorageItemValueObject.equipment.manufacturer + ": " +
                                               localStorageItemValueObject.equipment.productCode + " - " +
                                               localStorageItemValueObject.equipment.serialNumber;
                }
            } else if ( localStorageKey.indexOf( "technicianClocking." ) == 0 ) {
                localStorageItemValueObject = JSON.parse( localStorageItemValue );
                localStorageDisplayedKey = localStorageKey;
                if ( localStorageItemValueObject.workOrderCustomerName ) {
                    localStorageDisplayedKey += ( " - " + localStorageItemValueObject.workOrderCustomerName );
                }
                if ( localStorageItemValueObject.workOrderDocumentNumber ) {
                    localStorageDisplayedKey += ( " - " + localStorageItemValueObject.workOrderDocumentNumber );
                }
            } else {
                localStorageDisplayedKey = localStorageKey;
            }

            localStorageItems.push( {
                displayedKey : localStorageDisplayedKey,
                key : localStorageKey,
                value : localStorageItemValue
            });
            localStorageItemSize += localStorageItemValue.length;
        }
        debugViewModel.localStorageItems( _.sortBy( localStorageItems, function( itemInList ) {
            return itemInList.key;
        }));
        debugViewModel.localStorageItemCount( localStorageItems.length );
        debugViewModel.localStorageItemSize( Localization.formatNumber( localStorageItemSize, "n0" ) );

        // Apply KO bindings
        ko.applyBindings( debugViewModel );
    }

    /**
     * Exiting the debug page takes the tech to the logon page
     */
    function exitClickHandler() {
        var exitPage = window.localStorage.getItem( "debugExitPage" );
        debug && console.log( "Debug.exitClickHandler: Exiting debug page" );
        if ( exitPage ) {
            window.localStorage.removeItem( "debugExitPage" );
            UIFrame.navigateToPage( exitPage, true, null );
        } else {
            UIFrame.loadUrl( "login.html" );
        }
    }

    /**
     * Save local storage contents to the local file system
     */
    function saveClickHandler() {
        var localStorageContents = "";
        var localStorageItems = [];
        var localStorageKey;
        var localStorageValue;
        debug && console.log( "Debug.saveClickHandler: Saving local storage contents to local file system" );
        for ( localStorageKey in window.localStorage ) {
            localStorageValue = window.localStorage.getItem( localStorageKey );
            localStorageItems.push( localStorageKey + " = " + localStorageValue );
        }
        localStorageItems = _.sortBy( localStorageItems, function( itemInList ) {
            return itemInList;
        });
        _.each( localStorageItems, function( itemInList ) {
            localStorageContents += ( itemInList + "\n\n" );
        });
        LocalFS.writeFile( LOCAL_STORAGE_DUMP_FILE_DIR + LOCAL_STORAGE_DUMP_FILENAME, localStorageContents,
            function() {
                debug && console.log( "Debug.saveClickHandler: Local storage contents written out to " +
                                      LOCAL_STORAGE_DUMP_FILENAME );
                Dialog.showAlert( Localization.getText( "debugPage" ),
                                  Localization.getText( "debugLocalStorageContentsSaved" ).replace( "filename", LOCAL_STORAGE_DUMP_FILENAME ),
                                  null, "400px" );
            },
            function() {
                console.error( "Debug.saveClickHandler: Local storage content save failed" );
                Dialog.showAlert( Localization.getText( "debugPage" ),
                                  Localization.getText( "debugLocalStorageContentsSaveFailed" ),
                                  null, "400px" );
            }
        );
    }

    /**
     * Open a local storage item
     * this contains the localStorageItem that was tapped
     */
    function openItem() {
        var localStorageItem = this;
        var displayedValue;
        debug && console.log( "Debug.openItem: Opening item " + localStorageItem.key );

        // Use scrollable text dialog to display contents of opened item

        if ( localStorageItem.value.indexOf( "webId" ) !== -1 ) {
            displayedValue = JSON.stringify( JSON.parse( localStorageItem.value ), undefined, 4 );
        } else {
            displayedValue = localStorageItem.value;
        }
        Dialog.showScrollableDialog( localStorageItem.key, displayedValue, null, "700px" );
    }

    return {
        'openItem'              : openItem,
        'populatePage'          : populatePage
    }
}();

/**
 * pageinit event handler
 */
$("div:jqmData(role='page')").on( "pageinit", function() {
    // All pages must set pageId to this.id
    var pageId = this.id;
    debug && console.log( "Debug.pageinit: Initializing " + pageId );
    // This MUST be called by every page specific pageinit event handler!
    UIFrame.init( pageId, function() {
        debug && console.log( "Debug.pageinit: Page specific init goes here" );

        // Initialize the local file system
        debug && console.log( "ManageWorkOrderParts.init: Initializing the local file system" );
        LocalFS.init();

        Debug.populatePage();
        // This MUST be the last line inside each page specific init function
        UIFrame.postPageSpecificInit( pageId );
    });
});
