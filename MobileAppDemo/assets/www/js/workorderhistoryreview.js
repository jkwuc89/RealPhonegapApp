/**
 * workorderhistoryreview.js
 */

"use strict";

/**
 * WorkOrderHistoryReview
 * Display the customer review related content for a previous work order item
 */
var WorkOrderHistoryReview = function() {
	var branch = null,
		address = null,
		segment = null,
		customer = null,
		workOrder = null,
		signature = null,
		equipment = null,
		repairCode = null,
		commDetails = null,
		signatureDate = null,
		signatureImage = null,
		workOrderLines = null,
		emailRecipient = null,
		totalLaborHours = null,
		workOrderHistoryReviewPage = null;
	
	/**
	 * Function to build the review display for the current work order history item
	 */
	function buildReviewPage() {
		debug && console.log( "WorkOrderHistoryReview.buildReviewPage: Building the work order item history review." );

		// Initialize the page instance
		workOrderHistoryReviewPage = $('#workOrderHistoryReviewPage');
		
		// Initialize any required variables
		workOrder = JSONData.getObjectById( "workOrders", window.localStorage.getItem( "historyReviewId" ));
    	// TODO remove this after development - window.localStorage.setItem( "historyReviewId", "" );
		segment = workOrder.workOrderSegments[0];
		equipment = JSONData.getObjectById( "equipment", segment.equipmentId );
		branch = JSONData.getObjectById( "branches", segment.branchId );
		customer = JSONData.getObjectById( "customers", workOrder.customerId );
		address = customer.addresses[0];
		commDetails = _.find( address.communicationDetails, function( currentDetail ) { return currentDetail.main; });
		emailRecipient = _.find( address.communicationDetails, function( currentDetail ) { return currentDetail.type == "EMAIL"; });
		workOrderLines = segment.workOrderLines;
		signature = segment.customerSignature;
		if( signature != null ) {
			signatureDate = Localization.formatDateTime( signature.dateCaptured, "D" );
			signatureImage = "data:" + JSONData.SIGNATURE_FORMAT + "," + signature.value;
		} 
		
		JSONData.getObjectFromDatabaseById( "standardJobCodes", segment.standardJobCodeId,
	        function( standardJobCode ) {
                if ( standardJobCode ) {
                    repairCode( standardJobCode.completeJobCode + " - " + standardJobCode.notes + " - " + standardJobCode.notes );
                } else {
                    repairCode( " - " );
                }
		    }
		);
		
		// Compute total labor hours
        var workOrderClockings = _.filter( JSONData.getObjectsByDataType( "technicianClocking" ), function( clockingInList ) {
            return clockingInList.workOrderHeaderId == workOrder.webId;
        });
		totalLaborHours = 0;
        if ( workOrderClockings && workOrderClockings.length > 0 ) {
            _.each( workOrderClockings, function( clockingInList ) {
                if ( clockingInList.timeEnd ) {
                    totalLaborHours += ( (new Date( clockingInList.timeEnd ).getTime()) - (new Date( clockingInList.timeStart ).getTime()) );
                }
            });
        }
        
        totalLaborHours = Localization.formatNumber( totalLaborHours / 1000 / 60 / 60, "n1" );
        
		// Build the review page header content area 
		buildHeader( branch, customer, commDetails, address, workOrder );
		
		// Build the review page equipment content area 
		buildEquipmentArea();
		
		// Build the review page parts content area
		buildPartsArea();
		
		// Build the work order lines area
		buildWorkReport( segment, repairCode, emailRecipient, totalLaborHours );
		
		// Build the work order signature content area
		buildSignatureArea( signatureDate, signatureImage );
	}
	
	/**
	 * Function to build the header content of the report, containing the branch, customer, and work order info
	 */
	function buildHeader( headerWorkOrder ) {
		debug && console.log( "WorkOrderHistoryReview.buildHeader: Building the header content display." );
		
		var header = new EJS({url: 'templates/workorderhistoryheader'});
		
		var contact = _.find( customer.contacts, function( currentContact ) {
            return currentContact.webId == customer.mainContactId;
        });
		
		workOrderHistoryReviewPage.prepend( header.render({
			branch: branch,
			customer: customer,
			commDetails: commDetails,
			address: address,
			contact: contact,
			workOrder: headerWorkOrder
		}));
	}
	
	/**
	 * Function to build the equipment content area
	 */
	function buildEquipmentArea() {
		debug && console.log( "WorkOrderHistoryReview.buildEquipmentArea: Building the equipment content display." );
		var equipmentContent = new EJS({url: 'templates/workorderhistoryequipment'});
		
		workOrderHistoryReviewPage.append( equipmentContent.render({
			equipment: equipment
		}));
	}
	
	/**
	 * Function to build the parts content area
	 */
	function buildPartsArea() {
		debug && console.log( "WorkOrderHistoryReview.buildPartsArea: Building the parts content display." );
		
		workOrderHistoryReviewPage.append( new EJS({url: 'templates/workorderhistorypartsheader'}).render() );
		var location = "";
		
		// scan all work order lines
		for( var line in workOrderLines ) {
			if ( workOrderLines[line].inventoryId ) {
                location = JSONData.getInventoryLocationString( line.inventoryId() );
            } else {
                location = JSONData.getInventoryLocationString( null );
            }
			workOrderHistoryReviewPage.append( new EJS({url: 'templates/workorderhistorypart'}).render({
				line: workOrderLines[line],
				location: location
			}));
		}
	}
	
	/**
	 * Function to build the labor hours, reported problem, action code and repair notes area
	 */
	function buildWorkReport( currentSegment, standardJobCode, hours ) {
		debug && console.log( "WorkOrderHistoryReview.buildWorkReport: Building the work order report content display." );
		workOrderHistoryReviewPage.append( new EJS({url: 'templates/workorderhistoryreport'}).render({
			hours: hours,
			workOrder: workOrder,
			segment: currentSegment,
			repairCode: repairCode,
			emailRecipient: emailRecipient
		}));
	}
	
	/**
	 * Function to build the signature content area
	 */
	function buildSignatureArea( currentSignatureDate, currentSignatureImage ) {
		debug && console.log( "WorkOrderHistoryReview.buildSignatureArea: Building the signature content display." );
		workOrderHistoryReviewPage.append( new EJS({url: 'templates/workorderhistorysignature'}).render({
			signature: signature,
			signatureImage : signatureImage,
			formattedSignatureDate: signatureDate
		}));
	}
	
	return {
		'buildReviewPage' : buildReviewPage
	};
}();

/**
 * pageinit event handler 
 */
$("div:jqmData(role='page')").on( "pageinit", function( event, ui ) {
    // All pages must set pageId to this.id
    var pageId = this.id;
    debug && console.log( "WorkOrderHistoryReview.pageinit: Initializing " + pageId );
    // This MUST be called by every page specific pageinit event handler!
    UIFrame.init( pageId, function() {
        debug && console.log( "WorkOrderHistoryReview.pageinit: Page specific init goes here" );

        // Build the review page for the work history item
        WorkOrderHistoryReview.buildReviewPage();
        
        // Bind the Done button listener
        $('#btnDone').click( function() {
        	debug && console.log( "WorkOrderHistoryReview.btnDone: Returning to the equipment detail page." );
        	UIFrame.navigateToPage( "equipmentdetail.html" );
        });
        
        // This MUST be the last line inside each page specific init function
        UIFrame.postPageSpecificInit( pageId );
    });
});
