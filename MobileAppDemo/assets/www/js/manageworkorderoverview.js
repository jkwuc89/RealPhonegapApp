/**
 * manageworkorderoverview.js
 */

"use strict";

/**
 * ManageWorkOrderOverview object
 */
var ManageWorkOrderOverview = function() {

    /**
     * After the overview page loads, post work order status changes
     * to the middle tier.
     */
    $(window).load( function( event ) {
        // Set the current work order ID if manage work order is being opened in writable mode
        if ( !ManageWorkOrder.isReadOnly() ) {
            var manageWorkOrderId = ManageWorkOrder.getWorkOrder().webId;
            if ( JSONData.getCurrentWorkOrderId() != manageWorkOrderId ) {
                debug && console.log( "ManageWorkOrderOverview.window.load: Setting current work order ID to " + manageWorkOrderId ); 
                var workOrdersChanged = JSONData.setCurrentWorkOrderId( manageWorkOrderId );
                UIFrame.updateCurrentWorkOrderStatus();
                JSONData.postWorkOrders( workOrdersChanged, function() {
                    debug && console.log( "ManageWorkOrderOverview.window.load: Changed work orders posted to middle tier" );
                    UIFrame.reloadCurrentPage();
                });
            }
        }
    });    
    
    /**
     * Init this object
     */
    function init() {
        debug && console.log( "ManageWorkOrderOverview.init" );
        ManageWorkOrder.init();
    }
    
    /**
     * populatePage
     * Populate the work order overview page
     * @param pageId - Page ID for manage work order page being populated
     */
    function populatePage( pageId ) {
        debug && console.log( "ManageWorkOrderOverview.populatePage: Populating the page" );
        // Populate the common parts of manage work order
        ManageWorkOrder.populatePage( pageId );

        // Apply view model bindings to populate several of the fields on the overview page
        ko.applyBindings( ManageWorkOrder.viewModel );
        
        // Populate the customer and contact information
        var workOrder   = ManageWorkOrder.getWorkOrder();
        var customer    = ManageWorkOrder.getCustomer();
        var equipment   = ManageWorkOrder.getEquipment();        
        
        // Display the customer notes        
        var customerNotes = JSONData.getFilteredObjectList( "notes", function( noteInList ) {
            return noteInList.customerId == customer.webId;
        });
        if ( customerNotes ) {
            var notesHtml = "";
            for ( var noteIndex = 0; noteIndex < customerNotes.length; noteIndex++ ) {
                notesHtml = notesHtml.concat( "<span>" + customerNotes[noteIndex].message + "</span><br/>" );
            }
            $("#customerInstructions").append( notesHtml );
        }
        
        // Populate the rest of the fields that require localization or some logic to get their values
        if ( equipment.nextPMDate ) {
            var pmContractYorN = ( new Date( equipment.nextPMDate ) >= new Date() ? Localization.getText( "yes" ) : Localization.getText( "no") );
            $("#pmContractYorN").text( pmContractYorN );
            $("#nextPMDate").text( Localization.formatDateTime( equipment.nextPMDate, "d" ) );
        }
        if ( equipment.lastServiceDate ) {
            $("#lastServiceDate").text( Localization.formatDateTime( equipment.lastServiceDate, "d" ) );
        }
        
        JSONData.getObjectFromDatabaseById( "standardJobCodes", workOrder.workOrderSegments[0].standardJobCodeId,
            function( standardJobCode ) {
                if ( standardJobCode ) {
                    $("#jobCode").text( standardJobCode.completeJobCode );
                } else {
                    // Standard job code information is hidden if work order does not have a standard job code
                    $("#standardJobCodeInfo").hide();
                }
            }
        );

        JSONData.isEquipmentUnderWarranty( equipment ) ? 
            $("#warranty").text( Localization.getText( "yes" ) ) :
            $("#warranty").text( Localization.getText( "no" ) );
        if ( equipment.hourMeter ) {
            $("#hourMeter").text( Localization.formatNumber( equipment.hourMeter, "n0" ) );
        }
        $("#workOrderDate").text( Localization.formatDateTime( workOrder.workOrderSegments[0].dateOpened, "d" ) );
        $("#openWorkOrdersCount").text( Localization.formatNumber(
            JSONData.getFilteredObjectCount( "workOrders", function( currentWorkOrder ) {
                return currentWorkOrder.customerId == customer.webId &&
                       currentWorkOrder.workOrderSegments[0].webStatus != JSONData.WORK_ORDER_STATUS_REJECTED &&
                       currentWorkOrder.workOrderSegments[0].webStatus != JSONData.WORK_ORDER_STATUS_COMPLETED;
            }), "n0") );
        $("#openPMsDueCount").text( Localization.formatNumber(
            JSONData.getFilteredObjectCount( "pmSchedules", function( currentPMDue ) {
                return currentPMDue.customerId == customer.webId;
        }), "n0") );
    }
    
    return {
        'init'                 : init,
        'populatePage'         : populatePage
    };
}();

/**
 * pageinit event handler 
 */
$("div:jqmData(role='page')").on( "pageinit", function( event, ui ) {
    // All pages must set pageId to this.id
    var pageId = this.id;
    debug && console.log( "ManageWorkOrderOverview.pageinit" );
    UIFrame.init( pageId, function() {
        debug && console.log( "ManageWorkOrderOverview.pageinit: Executing page specific init" );
        ManageWorkOrderOverview.init();
        ManageWorkOrderOverview.populatePage( pageId );

        // This MUST be the last line inside each page specific init function
        UIFrame.postPageSpecificInit( pageId );
    });
});

