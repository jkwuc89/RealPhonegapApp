/**
 * manageworkorder.js
 */

"use strict";

/**
 * ManageWorkOrder object
 */
var ManageWorkOrder = function() {
    
    /**
     * Local storage location for the currently open work order ID
     */
    var LS_REVIEW_PAGE_ID  = "reviewPageId";
    var CUSTOMER_REVIEW_PAGE = "manageWorkOrderCustomerReviewPage";
    var TECH_REVIEW_PAGE     = "manageWorkOrderTechnicianReviewPage";
    
    var address             = null;
    var branch              = null;
    var contact             = null;
    var customer            = null;
    var customerCommDetails = null;
    var equipment           = null;
    var workOrder           = null;
    var readOnly            = false;
    
    // Knockout view model for the overview page
    var viewModel = {
        address : null,
        branch : null,
        contact : null,
        customer : null,
        customerCommDetails : null,
        equipment : null,
        workOrder : null
    };
    
    /**
     * Init this object
     */
    function init() {
        debug && console.log( "ManageWorkOrder.init" );
        
        // Get the JSON data necessary to manage the work order
        workOrder           = JSONData.getObjectById( "workOrders", JSONData.getManageWorkOrderId() );
        customer            = JSONData.getObjectById( "customers", workOrder.customerId );
        address             = Util.getObjectFromArray( customer.addresses, 'webId', customer.mainAddressId );
        if ( !address ) {
            address = customer.addresses[0];
        }
        branch              = JSONData.getObjectById( "branches", workOrder.workOrderSegments[0].branchId );
        if ( address.communicationDetails && address.communicationDetails.length > 0 ) {
            customerCommDetails = JSONData.getMainCommunicationDetails( address.communicationDetails );
        }
        contact             = Util.getObjectFromArray( customer.contacts, 'webId', customer.mainContactId );
        equipment           = workOrder.workOrderSegments[0].equipment;
        readOnly            = !(JSONData.isManageWorkOrderWritable());

        // Populate our view model with the JSON data
        viewModel.workOrder             = ko.mapping.fromJS( workOrder );
        viewModel.branch                = ko.mapping.fromJS( branch );
        viewModel.customer              = ko.mapping.fromJS( customer );
        viewModel.customerCommDetails   = ko.mapping.fromJS( customerCommDetails );
        viewModel.address               = ko.mapping.fromJS( address );
        viewModel.contact               = ko.mapping.fromJS( contact );
        if ( equipment ) {
            viewModel.equipment             = ko.mapping.fromJS( equipment );
        } else {
            // If equipment is missing, set up an empty one to support the view model
            equipment = {
                missing : true,
                modelYear : "",
                serialNumber : "",
                product : {
                    manufacturer: "",
                    productCode: "",
                }
            };
            viewModel.equipment = ko.mapping.fromJS( equipment );
        }
    }
    
    /**
     * populatePage
     * Populate the common parts of any manage work order page
     * @param pageId - Page ID for manage work order page being populated
     */
    function populatePage( pageId ) {
        debug && console.log( "ManageWorkOrder.populatePage: Populating the page" );
        
        // Populate the header
        populateHeader();

        // Change the repair work navbar button font size 
        $(".manage-work-order-parts-navbar-button").find( "span.ui-btn-text" ).css( "font-size", "12pt" );

        // Highlight the icon bar being tapped
        var iconBarBtns = $(".manage-work-order-icon-button");
        iconBarBtns.on( "vmouseover vmousedown", function( event ) {
            var newImgSrc = $(event.target).attr( "src" ).replace( "-inactive", "-active" );
            $(event.target).attr( "src", newImgSrc );
        });
        iconBarBtns.on( "vmouseout vmouseup", function( event ) {
            var newImgSrc = $(event.target).attr( "src" ).replace( "-active", "-inactive" );
            $(event.target).attr( "src", newImgSrc );
        });
        
        // Set the page title
        setPageTitle( pageId );
    }
    
    /**
     * Set the page title using the specified pageId
     * @param pageId
     */
    function setPageTitle( pageId ) {
        if ( !pageId ) {
            throw "ManageWorkOrder.setPageTitle: Required parameter pageId is undefined";
        }
        // We are setting the title manually so don't translate it
        var title = Localization.getText( pageId ) + " - " + workOrder.documentNumber;
        if ( isReadOnly() ) {
            title = title.concat( " - " + Localization.getText( "viewOnly" ) );
        }
        debug && console.log( "ManageWorkOrder.setPageTitle: Setting page title to " + title );
        var htmlPageId = $("div:jqmData(role='page')").attr( "id" );
        $("h1#" + htmlPageId).text( title );
        $("h1#" + htmlPageId).attr( "translate", "no" );
    }
    
    /**
     * Populate the work order header
     */
    function populateHeader() {
        debug && console.log( "ManageWorkOrder.populateHeader: Populating the manage work order header" );
        $("#manageWorkOrderHeaderStatusIcon").attr( "src", JSONData.getWorkOrderStatusIcon( workOrder ) );
        if ( !JSONData.isPartOnOrder( workOrder ) ) {
            $("#manageWorkOrderHeaderPartsOnOrderIcon").hide();
        }
        $("#workOrderStatus").text( JSONData.getWorkOrderStatusText( workOrder ) );
        
        // Bind the header button listeners
        var documentLocation = document.location.href;
        var invokingPage = documentLocation.substring( documentLocation.lastIndexOf( '/' ) + 1, documentLocation.indexOf( '.html' ));
        $('#manageWorkOrderCustomer').click( function() {
        	debug && console.log( "ManageWorkOrderOverview.init: User selected the Customer button" );
        	window.localStorage.setItem( "customerId", customer.webId );
        	window.localStorage.setItem( "invokingPage", invokingPage + "-customer" );
        	UIFrame.navigateToPage( "customerequipment.html" );		
        });
        
        if ( equipment.missing ) {
        	$("#manageWorkOrderEquipment").click( function() {
        		Dialog.showAlert( Localization.getText( "noEquipmentHeader" ), Localization.getText( "noWorkOrderEquipment" ));
        	});
        } else {
        	$('#manageWorkOrderEquipment').click( function() {
            	debug && console.log( "ManageWorkOrderOverview.init: User selected the Equipment button" );
            	window.localStorage.setItem( "equipmentId", equipment.webId );
            	window.localStorage.setItem( "invokingPage", invokingPage );
            	UIFrame.navigateToPage( "equipmentdetail.html" );	
            });
        }
    }
    
    /**
     * Return the customer for the work order
     */
    function getCustomer() {
        return customer;
    }
    
    /**
     * Return the equipment
     */
    function getEquipment() {
        return equipment;
    } 
    
    /**
     * Return the work order
     */
    function getWorkOrder() {
        return workOrder;
    }
    
    /**
     * Are we in read only mode?
     */
    function isReadOnly() {
        return readOnly;
    }
    
    /**
     * Set the readonly flag
     */
    function setReadOnly( newFlagValue ) {
        readOnly = newFlagValue;
    }
    
    /**
     * Navigate to a review page
     * @param reviewPageId - Either TECH_REVIEW_PAGE or CUSTOMER_REVIEW_PAGE
     */
    function navigateToReviewPage( reviewPageId ) {
        if ( !reviewPageId ||
             ( reviewPageId != CUSTOMER_REVIEW_PAGE && reviewPageId != TECH_REVIEW_PAGE ) ) {
            throw "ManageWorkOrder.navigateToReviewPage: Required parameter reviewPageType is undefined or invalid";
        }
        var dialogTitle = ( ( reviewPageId == CUSTOMER_REVIEW_PAGE ) ?
                            Localization.getText( "customerReviewTitle" ) : Localization.getText( "technicianReview" ) );
        if ( isReadOnly() ) {
            // Viewing review pages is always OK if the work order is marked as read only
            UIFrame.navigateToPage('manageworkorderreview.html', false, reviewPageId );
        } else {
            if ( reviewPageId == CUSTOMER_REVIEW_PAGE &&
                 !JSONData.isWorkOrderSignedByTechnician( workOrder ) ) {
                // Block navigation to the customer review page until the work order is signed by the technician
                Dialog.showAlert( dialogTitle, Localization.getText( "customerReviewBlocked" ) );
            } else if ( workOrder.workOrderSegments[0].standardJobCodeId == null ) {
                // Block navigation to the review pages if the work order does not have a standard job code ID
                Dialog.showAlert( dialogTitle, Localization.getText( "standardJobCodeMissing" ) );
            } else if ( workOrder.postToMiddleTierRequired ) {
                if ( Util.isOnline() ) {
                    // Ask technician to post work order before navigating to the review page
                    Dialog.showConfirmYesNo( dialogTitle, Localization.getText( "workOrderReviewPostRequired" ),
                        function() {
                            UIFrame.closeActiveDialog();
                            debug && console.log( "ManageWorkOrder.navigateToReviewPage: Posting work order before attempting navigation" );
                            JSONData.postWorkOrder( workOrder, true, true,
                                function() {
                                    debug && console.log( "ManageWorkOrder.navigateToReviewPage: Post successful.  Navigating to review page." );
                                    UIFrame.navigateToPage('manageworkorderreview.html', false, reviewPageId );
                                },
                                function() {
                                    debug && console.log( "ManageWorkOrder.navigateToReviewPage: Post failed.  Navigation stopped." );
                                    Dialog.showAlert( dialogTitle, Localization.getText( "workOrderReviewPostFailed" ) );
                                }
                            );
                        }
                    );
                } else {
                    Dialog.showAlert( dialogTitle, Localization.getText( "workOrderReviewPostRequiredOffline" ) );
                }
            } else {
                UIFrame.navigateToPage('manageworkorderreview.html', false, reviewPageId );
            }
        }
    }
    
    return {
        'LS_REVIEW_PAGE_ID'     : LS_REVIEW_PAGE_ID,
        'CUSTOMER_REVIEW_PAGE'  : CUSTOMER_REVIEW_PAGE, 
        'TECH_REVIEW_PAGE'      : TECH_REVIEW_PAGE,
        'init'                  : init,
        'getCustomer'           : getCustomer,
        'getEquipment'          : getEquipment,
        'getWorkOrder'          : getWorkOrder,
        'isReadOnly'            : isReadOnly,
        'navigateToReviewPage'  : navigateToReviewPage,
        'populateHeader'        : populateHeader,
        'populatePage'          : populatePage,
        'setPageTitle'          : setPageTitle,
        'setReadOnly'           : setReadOnly,
        'viewModel'             : viewModel
    };
}();

