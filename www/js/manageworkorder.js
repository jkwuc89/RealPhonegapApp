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
    var LS_ORIGINAL_HOUR_METER_VALUE    = "originalHourMeterValue";
    var CUSTOMER_REVIEW_PAGE            = "manageWorkOrderCustomerReviewPage";
    var TECH_REVIEW_PAGE                = "manageWorkOrderTechnicianReviewPage";

    var address             = null;
    var branch              = null;
    var contact             = null;
    var customer            = null;
    var equipment           = null;
    var workOrder           = null;
    var readOnly            = false;

    // Knockout view model for the overview page
    var viewModel = {
        address : null,
        branch : null,
        contact : null,
        customer : null,
        customerCommDetails : ko.observable(""),
        equipment : null,
        mainContact : ko.observable( "" ),
        workOrder : null
    };

    /**
     * Init this object
     */
    function init() {
        debug && console.log( "ManageWorkOrder.init" );

        // Get the JSON data necessary to manage the work order
        loadWorkOrder();
        customer = JSONData.getObjectById( "customers", workOrder.customerId, null );
        if ( !customer ) {
            JSONData.handleDataMissingError( "customer", workOrder.customerId );
            return;
        }
        address = Util.getObjectFromArray( customer.addresses, 'webId', customer.mainAddressId );
        if ( !address ) {
            address = customer.addresses[0];
        }
        branch              = JSONData.getObjectById( "branches", workOrder.workOrderSegments[0].branchId );
        if ( address.communicationDetails && address.communicationDetails.length > 0 ) {
            viewModel.customerCommDetails( Localization.getText( "telLabel" ) +
                                           JSONData.getMainCommunicationDetails( address.communicationDetails ).information );
        }
        contact             = Util.getObjectFromArray( customer.contacts, 'webId', customer.mainContactId );
        equipment           = workOrder.workOrderSegments[0].equipment;
        readOnly            = !(WorkOrder.isManageWorkOrderWritable());

        // Populate our view model with the JSON data
        viewModel.workOrder             = ko.mapping.fromJS( workOrder );
        viewModel.isPMWorkOrder         = ko.observable( WorkOrder.isPMWorkOrder( workOrder ) ),
        viewModel.branch                = ko.mapping.fromJS( branch );
        viewModel.customer              = ko.mapping.fromJS( customer );
        viewModel.address               = ko.mapping.fromJS( address );
        viewModel.contact               = ko.mapping.fromJS( contact );
        viewModel.contactList           = ko.observableArray( JSONData.getContactListForCustomer( customer ) );
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
                    productCode: ""
                }
            };
            viewModel.equipment = ko.mapping.fromJS( equipment );
        }
    }

    /**
     * Load the work order being used inside manage work order
     */
    function loadWorkOrder() {
        workOrder = JSONData.getObjectById( "workOrders", WorkOrder.getManageWorkOrderId() );
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
        var currentActivity = WorkOrder.getManageWorkOrderActivity();
        if ( isReadOnly() ) {
            title = title.concat( " - " + Localization.getText( "viewOnly" ) );
        } else if ( currentActivity == WorkOrder.MANAGE_WORK_ORDER_EDIT ) {
            title = title.concat( " - " + Localization.getText( "editOnly" ) );
        } else if ( currentActivity == WorkOrder.MANAGE_WORK_ORDER_OPEN_NOCLOCKING ) {
            title = title.concat( " - " + Localization.getText( "editOnlyPartsOnly" ) );
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
        $("#manageWorkOrderHeaderStatusIcon").attr( "src", ( WorkOrder.getWorkOrderStatusIcon( workOrder ) ) );
        if ( !WorkOrder.isPartOnOrder( workOrder ) ) {
            $("#manageWorkOrderHeaderPartsOnOrderIcon").hide();
        }
        $("#workOrderStatus").text( WorkOrder.getWorkOrderStatusText( workOrder ) );

        // Bind the header button listeners
        $("#change").click( function() {
            debug && console.log( "ManageWorkOrder.init: Change button tapped" );
            WorkOrderList.openWorkOrderActions( workOrder );
        });

        var documentLocation = UIFrame.getCurrentPage().url;
        var invokingPage = documentLocation.substring( documentLocation.lastIndexOf( '/' ) + 1, documentLocation.indexOf( '.html' ));
        $('#manageWorkOrderCustomer').click( function() {
            debug && console.log( "ManageWorkOrder.init: User selected the Customer button" );
            window.localStorage.setItem( JSONData.LS_CURRENT_CUSTOMER_ID, customer.webId );
            window.localStorage.setItem( "invokingPage", invokingPage + "-customer" );
            UIFrame.navigateToPage( "customerequipment.html", false, null );
        });

        if ( equipment.missing ) {
            $("#manageWorkOrderEquipment").click( function() {
                Dialog.showAlert( Localization.getText( "noEquipmentHeader" ),
                                  Localization.getText( "noWorkOrderEquipment" ), null, "400px" );
            });
        } else {
            $('#manageWorkOrderEquipment').click( function() {
                debug && console.log( "ManageWorkOrder.init: User selected the Equipment button" );
                window.localStorage.setItem( "equipmentId", equipment.webId );
                window.localStorage.setItem( "invokingPage", invokingPage );
                UIFrame.navigateToPage( "equipmentdetail.html", false, null );
            });
        }

        // Hide change button if no actions are available for the work order being managed
        if ( ( WorkOrder.getCurrentWorkOrderId() === WorkOrder.getManageWorkOrderId() &&
               !WorkOrder.isWorkOrderSignedByTechnician( workOrder ) ) ||
             ( WorkOrder.isPartsOnlyWorkOrder( workOrder ) &&
               WorkOrder.getManageWorkOrderActivity() == WorkOrder.MANAGE_WORK_ORDER_OPEN_NOCLOCKING ) ||
             WorkOrder.isWorkOrderSignedByCustomer( workOrder ) ) {
            $( "#change" ).hide();
        } else {
            $( "#change" ).show();
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
     * Set the equipment
     * @param newEquipment
     */
    function setEquipment( newEquipment ) {
        equipment = newEquipment;
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
     * Is the work order writable?  A work order is writable if:
     * It's not set to read only mode
     * It's not signed by the tech OR
     * It's signed by the tech and the tech is now editing the work order
     */
    function isWritable() {
        var currentActivity = WorkOrder.getManageWorkOrderActivity();
        return (
            !isReadOnly() &&
            ( !WorkOrder.isWorkOrderSignedByTechnician( workOrder ) ||
              WorkOrder.isWorkOrderSignedByTechnician( workOrder ) &&
              ( currentActivity == WorkOrder.MANAGE_WORK_ORDER_EDIT ||
                currentActivity == WorkOrder.MANAGE_WORK_ORDER_OPEN_NOCLOCKING )
            )
        );
    }

    /**
     * Navigate to a manage work order page.  This function is used
     * when manage work order icons are tapped.
     * @param pageId - Manage work order page ID
     */
    function navigateToPage( pageId ) {
        var completeNavigationFn = function() {
            if ( pageId === CUSTOMER_REVIEW_PAGE || pageId === TECH_REVIEW_PAGE ) {
                navigateToReviewPage( pageId );
            } else {
                UIFrame.navigateToPage( UIFrame.getPage( pageId ).url, false, null );
            }
        };

        // Prevent navigation to other manage work order pages while
        // the technician is traveling and the work order being managed is the current work order
        if ( JSONData.isTechnicianTraveling() ) {
            Dialog.showConfirmYesNo( Localization.getText( "technicianStatusTraveling" ),
                                     Localization.getText( "manageWorkOrderTravelNavAlert" ),
                function() {
                    // SFAM-297: Switch to productive clocking and complete the navigation
                    Dialog.closeDialog( false );
                    Clocking.switchTravelToProductive();
                    completeNavigationFn();
                }, null, '400px' );
        } else {
            completeNavigationFn();
        }
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
            // SFAM-192: Collecting a signature requires equipment if the work order is not parts only
            if ( _.isNull( JSONData.getObjectById( "workOrders", workOrder.webId, null ).workOrderSegments[0].equipmentId ) &&
                 !WorkOrder.isPartsOnlyWorkOrder( workOrder ) ) {
                Dialog.showAlert( dialogTitle, Localization.getText( "workOrderReviewEquipmentRequired" ), null, '400px' );
            } else {
                if ( reviewPageId == CUSTOMER_REVIEW_PAGE &&
                    !WorkOrder.isWorkOrderSignedByTechnician( workOrder ) ) {
                    // Block navigation to the customer review page until the work order is signed by the technician
                    Dialog.showAlert( dialogTitle, Localization.getText( "customerReviewBlocked" ), null, '400px' );
                } else if ( workOrder.workOrderSegments[0].standardJobCodeId == null &&
                            !WorkOrder.isPMWorkOrder( workOrder ) &&
                            !WorkOrder.isPartsOnlyWorkOrder( workOrder ) ) {
                    // Block navigation to the review pages if a non-PM work order does not have a standard job code ID
                    // and its not a parts only work order
                    Dialog.showAlert( dialogTitle, Localization.getText( "standardJobCodeMissing" ), null, "400px" );
                // SFAM-222: Post is required if post to MT flag is on OR
                //           tech is going to customer review page and work order is missing business system ID
                } else if ( workOrder.postToMiddleTierRequired && reviewPageId == CUSTOMER_REVIEW_PAGE ) {
                    if ( Util.isOnline( false ) ) {
                        // Ask technician to post work order before navigating to the review page
                        Dialog.showConfirmYesNo( dialogTitle, Localization.getText( "workOrderReviewPostRequired" ),
                            function() {
                                Dialog.closeDialog( false );
                                debug && console.log( "ManageWorkOrder.navigateToReviewPage: Posting work order before attempting navigation" );
                                WorkOrder.postWorkOrder( workOrder, true, true,
                                    function() {
                                        var updatedWorkOrder;
                                        var proceedToReviewPage = true;
                                        // SFAM-222: If navigating to customer review page, make sure updated
                                        //           work order has a business system ID
                                        if ( reviewPageId == CUSTOMER_REVIEW_PAGE ) {
                                            updatedWorkOrder = JSONData.getObjectById( "workOrders", workOrder.webId );
                                            if ( _.isNull( updatedWorkOrder.internalID ) ) {
                                                debug && console.log( "ManageWorkOrder.navigateToReviewPage: Updated work order " +
                                                                      "still missing internalId after post" );
                                                // SFAM-235: Proceed to customer review page even if post failed to update internalId
                                                proceedToReviewPage = true;
                                            }
                                        }
                                        if ( proceedToReviewPage ) {
                                            debug && console.log( "ManageWorkOrder.navigateToReviewPage: Post succeeded. Navigating to review page." );
                                            UIFrame.navigateToPage('manageworkorderreview.html', false, reviewPageId );
                                        }
                                    },
                                    function() {
                                        // SFAM-235: Proceed to review page even after a post failure
                                        debug && console.log( "ManageWorkOrder.navigateToReviewPage: Post failed.  Navigation will continue." );
                                        UIFrame.navigateToPage('manageworkorderreview.html', false, reviewPageId );
                                    }
                                );
                            }, null, "400px"
                        );
                    } else {
                        // SFAM-235: Allow navigation to review pages when app is offline
                        UIFrame.navigateToPage('manageworkorderreview.html', false, reviewPageId );
                    }
                } else {
                    UIFrame.navigateToPage('manageworkorderreview.html', false, reviewPageId );
                }
            }
        }
    }

    return {
        'LS_ORIGINAL_HOUR_METER_VALUE'  : LS_ORIGINAL_HOUR_METER_VALUE,
        'CUSTOMER_REVIEW_PAGE'          : CUSTOMER_REVIEW_PAGE,
        'TECH_REVIEW_PAGE'              : TECH_REVIEW_PAGE,
        'init'                          : init,
        'getCustomer'                   : getCustomer,
        'getEquipment'                  : getEquipment,
        'getWorkOrder'                  : getWorkOrder,
        'isReadOnly'                    : isReadOnly,
        'isWritable'                    : isWritable,
        'loadWorkOrder'                 : loadWorkOrder,
        'navigateToPage'                : navigateToPage,
        'navigateToReviewPage'          : navigateToReviewPage,
        'populateHeader'                : populateHeader,
        'populatePage'                  : populatePage,
        'setEquipment'                  : setEquipment,
        'setPageTitle'                  : setPageTitle,
        'setReadOnly'                   : setReadOnly,
        'viewModel'                     : viewModel
    };
}();

