/**
 * manageworkorderreview.js
 */

"use strict";

/**
 * ManageWorkOrderReview object
 */
var ManageWorkOrderReview = function() {

    // Current email addresses...this allows us to detect if
    // changes were made when the e-mail address update dialog
    // is displayed
    var currentEmailToAddress = "";
    var currentEmailCCAddress = "";

    // Signature pad instance
    var signaturePad = null;

    // Signature type
    var signatureType = "";

    // Missing signature prompt
    var missingSignaturePrompt = "";

    // Viewing signature in signature dialoge?
    var viewingSignature = false;

    // Holds list of work orders awaiting customer signature
    var workOrdersAwaitingCustomerSignature = [];

    // Customer sign all work orders at once?
    var customerSignAllAtOnce = false;

    // Maintain previous values for the To and CC fields
    var emailToAddressPrevious = "";
    var emailCCAddressPrevious = "";

    // Constants
    var EMAIL_TO_ATTEMPT = 0;
    var EMAIL_CC_ATTEMPT = 1;

    // Knockout view model for tech review
    var reviewViewModel = {
        billingFolder : ko.observable(""),
        branchCommDetails : ko.observableArray( [] ),
        emailCCAddress : ko.observable(""),
        emailToAddress : ko.observable(""),
        emailContacts : ko.observableArray( [] ),
        laborHoursInBusinessSystem: ko.observable( 0 ),
        laborHoursNotInBusinessSystem: ko.observable( 0 ),
        manageWO : null,
        multipleWorkOrdersSigned : ko.observable( false ),
        pageId : ko.observable( window.localStorage.getItem( UIFrame.LS_REVIEW_PAGE_ID ) ),
        repairCode : ko.observable(""),
        reviewDate : ko.observable( Util.getISOCurrentTime() ),
        reviewMessageText : ko.observable(""),
        reviewPicture : ko.observable(""),
        signatureDate : ko.observable( Util.getISOCurrentTime() ),
        signatureImage : ko.observable(""),
        technicianName : ko.observable( JSONData.getTechnicianName() ),
        technicianVan : ko.observable( "" ),
        unpostedLaborLines: ko.observableArray( [] ),
        workOrderLines : ko.observableArray( [] ),
        workOrderNumbers : ko.observable( "" ),
        workOrderReviewed : ko.observable( false ),
        workOrderSigned : ko.observable( false ),
        writable : ko.observable( false ),
        displayEmailAddressUpdateDialog : displayEmailAddressUpdateDialog,
        reviewWorkOrder : displayWorkOrderReviewDialog,
        cancelEmailAddressUpdate : cancelEmailAddressUpdate,
        saveEmailAddressUpdate : saveEmailAddressUpdate,
        saveSignature : saveSignature,
        sendWorkOrderReviewMessage : sendWorkOrderReviewMessage,
        refreshWorkOrderLinesList : function( elements ) {
            $('#manageWorkOrderPartsList').listview();
        },
        signWorkOrder : function() {
            var validEmailEntries = validateEmailEntries();

            if( reviewViewModel.pageId() == ManageWorkOrder.CUSTOMER_REVIEW_PAGE ) {
                var invalid = false;

                // Confirm an email entry
                if( this.emailToAddress() == "" ) {
                     Dialog.showAlert( Localization.getText( "emailContactRequiredTitle" ),
                        Localization.getText( "emailContactRequiredText" ), function() {
                         Dialog.closeDialog();
                         displayEmailAddressUpdateDialog();
                     }, "450px" );
                    return;
                }

                // Confirm valid email etries
                if((( this.emailToAddress() != "" || this.emailCCAddress ) && validEmailEntries != "" )) {
                    Dialog.showAlert( Localization.getText( "invalidEmailFormat" ), validEmailEntries, function() {
                         Dialog.closeDialog();
                         displayEmailAddressUpdateDialog();
                    }, "450px" );
                    return;
                }
            }

            var viewModel = this;
            if ( this.pageId() == ManageWorkOrder.CUSTOMER_REVIEW_PAGE ) {
                // If multiple work orders can be signed at once and current work order being
                // managed is open, ask technician about signing them all.
                customerSignAllAtOnce = false;
                if ( workOrdersAwaitingCustomerSignature.length > 1 &&
                     WorkOrder.getManageWorkOrderActivity() == WorkOrder.MANAGE_WORK_ORDER_OPEN ) {
                    this.workOrderNumbers( Util.getWorkOrderDocumentNumbersAsString( workOrdersAwaitingCustomerSignature ) );
                    var promptText =
                        Localization.getText( "customerSignatureMultipleWorkOrders" ).replace( "workOrders", this.workOrderNumbers() );
                    Dialog.showConfirmYesNo( Localization.getText( "customerSignatureLabel" ), promptText,
                        // Yes handler...sign all work orders at once
                        function() {
                            Dialog.closeDialog();
                            var workOrdersNotViewedByCustomer = _.filter( workOrdersAwaitingCustomerSignature, function( workOrderInList ) {
                                return !workOrderInList.viewedByCustomer;
                            });
                            if ( workOrdersNotViewedByCustomer.length > 0 ) {
                                Dialog.showAlert( Localization.getText( "customerSignatureLabel" ),
                                                  Localization.getText( "customerReviewRequiredPrompt" ).replace( "workOrders",
                                                          Util.getWorkOrderDocumentNumbersAsString( workOrdersNotViewedByCustomer ) ), null, "400px" );
                            } else {
                                customerSignAllAtOnce = true;
                                viewModel.workOrderNumbers( Util.getWorkOrderDocumentNumbersAsString( workOrdersAwaitingCustomerSignature ) );
                                displaySignatureCaptureBlock();
                            }
                        },
                        // No handler...sign currently open work order only
                        function() {
                            Dialog.closeDialog();
                            viewModel.workOrderNumbers( ManageWorkOrder.getWorkOrder().documentNumber );
                            displaySignatureCaptureBlock();
                        }, "400px"
                    );
                } else {
                    viewModel.workOrderNumbers( ManageWorkOrder.getWorkOrder().documentNumber );
                    displaySignatureCaptureBlock();
                }
            } else {
                displaySignatureCaptureBlock();
            }
        },
        cancelSignature : function() {
            // Clear the signature canvas when cancel is tapped
            signaturePad.clearCanvas();
            hideSignatureCaptureBlock( true );
        },
        takeWorkOrderReviewPicture : takeWorkOrderReviewPicture
    };

    /**
     * After the PhoneGap deviceready event fires, run postLoadFn()
     */
    document.addEventListener( "deviceready", onDeviceReady, false );
    function onDeviceReady() {
        debug && console.log( "ManageWorkOrderReview.onDeviceReady: Calling postLoadFn" );
        postLoadFn();
    }

    /**
     * After this page loads on Chrome Desktop, run postLoadFn()
     */
    $(window).load( function() {
        if ( Util.isRunningOnChromeDesktop() ) {
            debug && console.log( "ManageWorkOrderReview.window.load: Calling postLoadFn" );
            postLoadFn();
        } else {
            debug && console.log( "ManageWorkOrderReview.window.load: App running on tablet. postLoadFn skipped." );
        }
    });

    /**
     * This function is executed after the page loads on Chrome Desktop
     * or when the onDeviceReady event fires on the tablet.
     */
    function postLoadFn() {
        debug && console.log( "ManageWorkOrderReview.postLoadFn: Running post load function" );
        UIFrame.showElement( "div#manageWorkOrderReviewPageContent", "block" );
        initEmailTo( true );
    }

    /**
     * Init this object
     */
    function init() {
        var billingFolder = "";
        var signature = null;
        var totalLaborHours = 0;
        var unpostedLaborHourListItem = {};
        var workOrderMenu = $( "#manageWorkOrderSelectMenu" );
        var xcodeForWorkOrder;

        debug && console.log( "ManageWorkOrderReview.init: Initializing review page id: " + reviewViewModel.pageId() );
        ManageWorkOrder.init();
        // Handle differences between the different review pages
        switch ( reviewViewModel.pageId() ) {
            case ManageWorkOrder.CUSTOMER_REVIEW_PAGE :
                missingSignaturePrompt = "customerReviewSignatureMissing";
                signature = ManageWorkOrder.getWorkOrder().workOrderSegments[0].customerSignature;
                signatureType = Localization.getText( "customerSignatureLabel" );

                // Get all work orders for this customer that can be signed for at once by the customer
                workOrdersAwaitingCustomerSignature = _.filter( JSONData.getObjectsByDataType( "workOrders"), function( workOrderInList ) {
                    return ( workOrderInList.customerId == ManageWorkOrder.getWorkOrder().customerId &&
                             workOrderInList.workOrderSegments[0].webStatus != WorkOrder.WORK_ORDER_STATUS_COMPLETED &&
                             WorkOrder.isWorkOrderSignedByTechnician( workOrderInList ) );
                });
                workOrdersAwaitingCustomerSignature = _.sortBy( workOrdersAwaitingCustomerSignature, function( workOrderInList ) {
                    return ( workOrderInList.documentNumber );
                });
                debug && console.log( "ManageWorkOrderReview.init: Work orders for customer " +
                                      ManageWorkOrder.getCustomer().name + " awaiting customer signature: " +
                                      workOrdersAwaitingCustomerSignature.length );

                // If there are multiple work orders that can be signed, add them to the drop
                // down menu at the top right and show the menu
                if ( workOrdersAwaitingCustomerSignature.length > 0 ) {
                    reviewViewModel.workOrderNumbers( Util.getWorkOrderDocumentNumbersAsString( workOrdersAwaitingCustomerSignature ) );
                } else {
                    reviewViewModel.workOrderNumbers( ManageWorkOrder.getWorkOrder().documentNumber );
                }
                if ( workOrdersAwaitingCustomerSignature.length > 1 ) {
                    debug && console.log( "ManageWorkOrderReview.init: Displaying work order drop down on customer review page" );
                    _.each( workOrdersAwaitingCustomerSignature, function( workOrderInList ) {
                        // Add "viewed by customer" property to each work order in the customer signature list
                        // Switching between the work orders will set viewed by customer to true.
                        if ( workOrderInList.webId === ManageWorkOrder.getWorkOrder().webId ) {
                            if ( !workOrderInList.viewedByCustomer ) {
                                workOrderInList.viewedByCustomer = true;
                                JSONData.saveJSON( "workOrders", workOrderInList );
                            }
                        } else {
                            if ( _.isUndefined( workOrderInList.viewedByCustomer ) ) {
                                workOrderInList.viewedByCustomer = false;
                                JSONData.saveJSON( "workOrders", workOrderInList );
                            }
                        }
                        var workOrderElementText = workOrderInList.documentNumber;
                        if ( workOrderInList.viewedByCustomer ) {
                            workOrderElementText += ( " - " + Localization.getText( "viewedByCustomer" ) );
                        }
                        var workOrderElement = "<option class='manageWorkOrderMenuItem' id='" +
                                                workOrderInList.webId + "' value='" +
                                                workOrderInList.webId + "'>" + workOrderElementText + "</option>";
                        workOrderMenu.append( workOrderElement );
                    });
                    // Make the current work order the selected work order in the drop down.
                    workOrderMenu.val( ManageWorkOrder.getWorkOrder().webId );
                    if ( WorkOrder.getManageWorkOrderActivity() == WorkOrder.MANAGE_WORK_ORDER_OPEN ) {
                        $("#manageWorkOrderSelectDiv").show();
                    }
                    // Bind the handler to the work order drop down
                    $("#manageWorkOrderSelectMenu").change( changeCustomerReviewWorkOrder );
                }
                
                // Initialize the email To and CC variables
                var workOrder = ManageWorkOrder.getWorkOrder();

                if( workOrder.workOrderSegments[0].emailTo ) {
                	reviewViewModel.emailToAddress( workOrder.workOrderSegments[0].emailTo );
                	emailToAddressPrevious = reviewViewModel.emailToAddress();
                } else {
                    initEmailTo();
                    workOrder.workOrderSegments[0].emailTo = reviewViewModel.emailToAddress();
                }

                if( workOrder.workOrderSegments[0].emailCC ) {
                	reviewViewModel.emailCCAddress( workOrder.workOrderSegments[0].emailCC );
                	emailCCAddressPrevious = reviewViewModel.emailCCAddress();
                }

                // Red gear for back ordered parts not shown on customer review page
                UIFrame.hideElement( ".backordered-part-icon" );

                reviewViewModel.emailContacts( JSONData.getOrderEmailListForCustomer( ManageWorkOrder.getCustomer() ) );
                break;

            case ManageWorkOrder.TECH_REVIEW_PAGE :
                reviewViewModel.workOrderNumbers( ManageWorkOrder.getWorkOrder().documentNumber );
                missingSignaturePrompt = "technicianReviewSignatureMissing";
                signature = ManageWorkOrder.getWorkOrder().workOrderSegments[0].technicianSignature;
                signatureType = Localization.getText( "technicianSignatureLabel" );

                // Populate unposted labor hours list
                unpostedLaborHourListItem.date = "4/24/2013";
                unpostedLaborHourListItem.startTime = "8:00 AM";
                unpostedLaborHourListItem.endTime = "";
                unpostedLaborHourListItem.hours = 1;
                unpostedLaborHourListItem.type = "Productive";
                reviewViewModel.unpostedLaborLines.push( unpostedLaborHourListItem );

                break;
        }

        // Display the technician's van name
        var technicianVan = JSONData.getTechnicianVan();
        if ( technicianVan ) {
            reviewViewModel.technicianVan( technicianVan.name );
        }

        // Display the billing folder
        billingFolder = JSONData.getObjectById( "folders", ManageWorkOrder.getWorkOrder().workOrderSegments[0].folderId, null );
        if ( billingFolder ) {
            reviewViewModel.billingFolder( billingFolder.description );
        }

        // Add the parent manage work order view model to the this page's view model
        reviewViewModel.manageWO = ManageWorkOrder.viewModel;

        // If the branch communication details are available, display them on the review page
        if ( reviewViewModel.manageWO.branch.address.communicationDetails ) {
            var branchCommDetails = reviewViewModel.manageWO.branch.address.communicationDetails();
            if ( branchCommDetails && branchCommDetails.length > 0 ) {
                var branchCommDetailString = "";
                var branchCommDetailsArray = [];
                _.each( branchCommDetails, function( commDetailInList ) {
                    switch ( commDetailInList.type() ) {
                        case JSONData.COMM_DETAIL_TYPE_PHONE :
                            branchCommDetailString += ( Localization.getText( "telLabel" ) ) + commDetailInList.information();
                            if ( commDetailInList.extension() ) {
                                branchCommDetailString += ( Localization.getText( "phoneExtension" ) +
                                                            commDetailInList.extension() );
                            }
                            branchCommDetailsArray[0] = branchCommDetailString;
                            break;
                        case JSONData.COMM_DETAIL_TYPE_FAX :
                            branchCommDetailString += ( Localization.getText( "faxLabel" ) ) + commDetailInList.information();
                            branchCommDetailsArray[1] = branchCommDetailString;
                            break;
                        default :
                            break;
                    }
                    branchCommDetailString = "";
                });
                _.each( branchCommDetailsArray, function( commDetailInList ) {
                    reviewViewModel.branchCommDetails.push( commDetailInList );
                });
            }
        }

        // Add computed observable for formatting the equipment hour meter
        if ( reviewViewModel.manageWO.workOrder.workOrderSegments()[0].hourMeter() ) {
            reviewViewModel.formattedEquipmentHourMeter = ko.computed( function() {
                return Localization.formatNumber( reviewViewModel.manageWO.workOrder.workOrderSegments()[0].hourMeter(), "n0" );
            });
        } else {
            reviewViewModel.formattedEquipmentHourMeter = ko.observable( 0 );
        }

        // Add computed observables for formatting the work order start and complete dates
        if ( reviewViewModel.manageWO.workOrder.workOrderSegments()[0].dateStarted() ) {
            reviewViewModel.formattedWorkOrderStartDate =
                ko.observable( Localization.formatDateTime( reviewViewModel.manageWO.workOrder.workOrderSegments()[0].dateStarted(), "d" ) );
        } else {
           reviewViewModel.formattedWorkOrderStartDate = ko.observable( "" );
        }
        if ( reviewViewModel.manageWO.workOrder.workOrderSegments()[0].dateCompleted() ) {
            reviewViewModel.formattedWorkOrderCompleteDate =
                ko.observable( Localization.formatDateTime( reviewViewModel.manageWO.workOrder.workOrderSegments()[0].dateCompleted(), "d" ) );
        } else {
            reviewViewModel.formattedWorkOrderCompleteDate = ko.observable( "" );
        }

        // Set the observable for the customer's e-mail address
        var emailCommDetail = null;
        if( reviewViewModel.manageWO.contact && reviewViewModel.manageWO.contact.length > 0 ) {
            _.find( reviewViewModel.manageWO.contact.address.communicationDetails(), function( commDetailInList ) {
                return commDetailInList.type() == JSONData.COMM_DETAIL_TYPE_EMAIL;
            });
        }

        if ( emailCommDetail ) {
            reviewViewModel.emailToAddress( emailCommDetail.information() );
        }

        // Add computed observable for displaying a formatted signature date
        reviewViewModel.formattedSignatureDate = ko.computed( function() {
            return Localization.formatDateTime( reviewViewModel.signatureDate(), "D" );
        });

        // Add computed observable for displaying the review date
        if ( reviewViewModel.manageWO.workOrder.reviewDate ) {
            reviewViewModel.reviewDate( reviewViewModel.manageWO.workOrder.reviewDate() );
            reviewViewModel.workOrderReviewed( true );
        }
        reviewViewModel.formattedReviewDate = ko.computed( function() {
            return Localization.formatDateTime( reviewViewModel.reviewDate(), "D" );
        });

        // Add the work order lines. Labor lines will be used to calculate the total labor hours.
        xcodeForWorkOrder = WorkOrder.getXcodeLineFromWorkOrder( ManageWorkOrder.getWorkOrder() );
        _.each( reviewViewModel.manageWO.workOrder.workOrderSegments()[0].workOrderLines(), function( lineInList ) {
            var laborLine = false;
            var workOrderLine = {};
            if ( lineInList.product.manufacturer ) {
                workOrderLine.mfg = lineInList.product.manufacturer;
            } else {
                workOrderLine.mfg = "";
            }
            if ( lineInList.product.productCode ) {
                workOrderLine.partNumber = lineInList.product.productCode();
            } else {
                workOrderLine.partNumber = "";
            }
            workOrderLine.backOrdered = ( lineInList.qtyBackOrder() > 0 );

            // All labor related lines are used to calculate the total labor hours
            if ( lineInList.product.manufacturer && lineInList.product.manufacturer() == WorkOrder.WORK_ORDER_LINE_MFG_LABOR ) {
                totalLaborHours += lineInList.qtyOrdered();
                laborLine = true;
            }

            // Outside part purchases are handled differently because information
            // about them won't exist inside products or inside inventory
            if ( lineInList.product.productCode && lineInList.product.productCode() == WorkOrder.OUTSIDE_PART_PURCHASE_PRODUCE_CODE ) {
                workOrderLine.description = lineInList.description;
                workOrderLine.location = "";
            } else if ( lineInList.type() == WorkOrder.WORK_ORDER_LINE_NOTE_TYPE &&
                        xcodeForWorkOrder &&
                        lineInList.standardJobCodeId() == xcodeForWorkOrder.standardJobCodeId ) {
                // X codes display their their description only
                workOrderLine.description = xcodeForWorkOrder.description;
                workOrderLine.location = "";
            } else {
                workOrderLine.description = lineInList.description;
                workOrderLine.location = lineInList.location;
            }

            // Do not show the quantity for note lines
            if ( lineInList.type() == WorkOrder.WORK_ORDER_LINE_NOTE_TYPE ) {
                workOrderLine.quantity = null;
            } else {
                workOrderLine.quantity = lineInList.qtyOrdered;
            }

            // Labor lines are not placed on the customer review page
            if ( !(reviewViewModel.pageId() == ManageWorkOrder.CUSTOMER_REVIEW_PAGE && laborLine) ) {
                reviewViewModel.workOrderLines.push( workOrderLine );
            }
        });

        // On the customer review page, the total labor hours includes
        // the time used to get the customer's signature which is represented
        // by the last open productive clocking for the work order.
        var customerSignatureLaborAdjustment = 0.0;
        if ( reviewViewModel.pageId() == ManageWorkOrder.CUSTOMER_REVIEW_PAGE && !ManageWorkOrder.isReadOnly() ) {
            debug && console.log( "ManageWorkOrderReview.init: Adding time for getting customer signature to total labor hours" );
            var lastProductiveClocking = _.find( JSONData.getObjectsByDataType( "technicianClocking" ), function( clockingInList ) {
                return ( clockingInList.workOrderHeaderId == ManageWorkOrder.getWorkOrder().webId &&
                         clockingInList.workOrderSegmentId == ManageWorkOrder.getWorkOrder().workOrderSegments[0].webId &&
                         clockingInList.technicianStatus == JSONData.TECHNICIAN_STATUS_PRODUCTIVE &&
                         clockingInList.timeEnd == null );
            });
            if ( lastProductiveClocking && lastProductiveClocking.timeStart ) {
                var lastClockingDuration = ( ( new Date().getTime() - new Date( lastProductiveClocking.timeStart ).getTime() ) / 1000 / 60 );
                customerSignatureLaborAdjustment = ( ( parseInt(lastClockingDuration / 30) ) + 1 ) * 0.5;
                debug && console.log( "ManageWorkOrderReview.init: Actual time in minutes used to get customer signature = " + lastClockingDuration +
                                      " Labor adjustment in hours = " + customerSignatureLaborAdjustment );
            }
        }

        // Add total labor hours to the view model
        reviewViewModel.totalLaborHours = ko.computed( function() {
            return Localization.formatNumber( totalLaborHours + customerSignatureLaborAdjustment, "n1" );
        });

        // Get the repair code information
        if ( reviewViewModel.manageWO.workOrder.workOrderSegments()[0].standardJobCode ) {
            debug && console.log( "ManageWorkOrderReview.init: Using standard job code info from merged work order" );
            if ( reviewViewModel.manageWO.workOrder.workOrderSegments()[0].standardJobCode.notes() ) {
                reviewViewModel.repairCode( reviewViewModel.manageWO.workOrder.workOrderSegments()[0].standardJobCode.notes() );
            } else {
                reviewViewModel.repairCode( reviewViewModel.manageWO.workOrder.workOrderSegments()[0].standardJobCode.description() );
            }
        } else {
            debug && console.log( "ManageWorkOrderReview.init: Using standard job code info from the DB" );
            JSONData.getObjectFromDatabaseById( "standardJobCodes",
                                                reviewViewModel.manageWO.workOrder.workOrderSegments()[0].standardJobCodeId(),
                function( standardJobCode ) {
                    if ( standardJobCode ) {
                        if ( standardJobCode.notes ) {
                            reviewViewModel.repairCode( standardJobCode.notes );
                        } else {
                            reviewViewModel.repairCode( standardJobCode.description );
                        }
                    }
                }
            );
        }

        // Is the work order already signed?
        if ( signature ) {
            reviewViewModel.signatureDate( signature.dateCaptured );
            reviewViewModel.signatureImage( "data:" + JSONData.SIGNATURE_FORMAT + "," + signature.value );
            reviewViewModel.workOrderSigned( true );
        }

        // Is work order information writable?
        reviewViewModel.writable( !ManageWorkOrder.isReadOnly() );

        // Options for the signature pad initialization
        var options = {
            defaultAction : "drawIt",
            drawOnly : true,
            lineTop :  210,
            onFormError : null
        };
        signaturePad = $('.sigPad').signaturePad( options );
    }

    /**
     * If there is currently no emailTo value for this order, use the the JSONData.getWorkOrderPrimaryEmailForCustomer
     *  method to assign the primary work order contact by default
     */
    function initEmailTo() {
        if( reviewViewModel.emailToAddress() == "" ) {
            var primaryWOContact = JSONData.getWorkOrderPrimaryEmailForCustomer( ManageWorkOrder.getCustomer() );
            if( !_.isNull( primaryWOContact )) {
                debug && console.log( "ManageWorkOrderReview.initEmailTo: Assigning Work Order Primary Contact " +
                    primaryWOContact );
                reviewViewModel.emailToAddress( primaryWOContact );
                currentEmailToAddress = reviewViewModel.emailToAddress();
                emailToAddressPrevious = reviewViewModel.emailToAddress();

                saveEmailAddressUpdate();
            }
        }
    }

    /**
     * populatePage
     * Populate the work order customer review page
     */
    function populatePage() {
        debug && console.log( "ManageWorkOrderReview.populatePage: Populating " + reviewViewModel.pageId() );
        ManageWorkOrder.populatePage( reviewViewModel.pageId() );
        // Apply view model bindings to populate several of the fields on the overview page
        ko.applyBindings( reviewViewModel );
    }

    /**
     * onchange handler for work order drop down list on the customer review page.
     * This changes the customer review page to the selected work order.
     */
    function changeCustomerReviewWorkOrder() {
        var selectedWorkOrderWebId = this.value;
        // When switching between customer signature work orders, the
        // currently open work order is the only one that is writable.
        WorkOrder.setManageWorkOrderWritable( selectedWorkOrderWebId === WorkOrder.getCurrentWorkOrderId() );
        WorkOrder.setManageWorkOrderId( selectedWorkOrderWebId );
        UIFrame.reloadCurrentPage();
    }

    /**
     * Display the signature capture block
     */
    function displaySignatureCaptureBlock() {
        debug && console.log( "ManageWorkOrderReview.displaySignatureCaptureBlock: Displaying the signature capture block" );
        $("#signatureArea").show();
        $("#signature").hide();
        $("#captureSignatureLink").hide();
        $("#capturingSignature").show();
        window.scrollBy( 0, 300 );
    }

    /**
     * Hide the signature capture block
     */
    function hideSignatureCaptureBlock( showSignatureLink ) {
        $("#signatureArea").hide();
        $("#capturingSignature").hide();
        $("#signature").show();
        if ( showSignatureLink ) {
            $("#captureSignatureLink").show();
            window.scrollBy( 0, -300 );
        }
    }

    /**
     * Update the header and footer on the review page with the
     * current work order status and the current technician status
     */
    function updateHeaderAndFooter() {
        _.delay( function() {
            debug && console.log( "ManageWorkOrderReview.updateHeaderAndFooter: Updating footer with new technician and work order status" );
            ManageWorkOrder.setPageTitle( reviewViewModel.pageId() );
            UIFrame.updateCurrentWorkOrderStatus();
            UIFrame.updateCurrentTechnicianStatus();
        }, 500 );
    }

    /**
     * Save and post multiple work orders
     * @param workOrders - Work orders to save and post
     */
    function saveAndPostWorkOrders( workOrders ) {
        var numWorkOrders = workOrders.length;
        debug && console.log( "ManageWorkOrderReview.saveAndPostWorkOrders: Saving and posting " +
                              numWorkOrders + " work orders" );

        // SFAM-245: Don't display post please wait if app is offline
        if ( Util.isOnline( false ) ) {
            var workOrderNumbers = Util.getWorkOrderDocumentNumbersAsString( workOrders );
            var pleaseWaitText = Localization.getText( "postingWorkOrdersText" ).replace( "workOrders", workOrderNumbers );
            Dialog.showPleaseWait( Localization.getText( "postingWorkOrdersTitle" ), pleaseWaitText, "400px" );
        }

        // Set up an _.after function that is executed once after all of the posts are done
        var saveAndPostCompleteFn = _.after( numWorkOrders, function() {
            Dialog.closeDialog();
            debug && console.log( "ManageWorkOrderReview.saveAndPostWorkOrders: " + numWorkOrders +
                                  " work orders posted to the middle tier" );
        });

        // Save and post all of the work orders
        _.each( workOrders, function( workOrderInList ) {
            debug && console.log( "ManageWorkOrderReview.saveAndPostWorkOrders: Saving and posting work order " +
                                  workOrderInList.documentNumber );
            workOrderInList.postToMiddleTierRequired = true;
            JSONData.saveJSON( "workOrders", workOrderInList );
            // SFAM-245: Don't post the work orders if the app is offline
            if ( Util.isOnline( false ) ) {
                WorkOrder.postWorkOrder( workOrderInList, false, false, saveAndPostCompleteFn, saveAndPostCompleteFn );
            } else {
                saveAndPostCompleteFn();
            }
        });
    }

    /**
     * Save and post the updated work order
     * @param workOrder - Updated work order
     */
    function saveAndPostWorkOrder( workOrder ) {
        debug && console.log( "ManageWorkOrderReview.saveAndPostWorkOrder: Saving and posting work order " +
                              workOrder.documentNumber );
        // Save the work order changes locally
        workOrder.postToMiddleTierRequired = true;
        JSONData.saveJSON( "workOrders", workOrder );

        // Post the work order to the middle tier
        WorkOrder.postWorkOrder( workOrder, true, true, function( updatedWorkOrder ) {
            debug && console.log( "ManageWorkOrderReview.saveAndPostWorkOrder: Work order " +
                                  updatedWorkOrder.documentNumber + " successfully posted to middle tier" );
        }, null );
    }

    /**
     * Save the captured signature
     */
    function saveSignature() {
        if ( viewingSignature ) {
            debug && console.log( "ManageWorkOrderReview.saveSignature: Viewing signature only, save skipped" );
        } else {
            // Check the size of the signature array for a signature
            var signatureString = signaturePad.getSignatureString();
            var signatureDate = Util.getISOCurrentTime();
            if ( signatureString != "[]" ) {
                hideSignatureCaptureBlock( false );
                var workOrder = ManageWorkOrder.getWorkOrder();
                debug && console.log( "ManageWorkOrderReview.saveSignature:  Saving signature with date = " +
                                      signatureDate + " inside work order " + workOrder.documentNumber );

                // Create a Signature object
                var signature = JSONData.createNewSignature();
                var signatureImage = signaturePad.getSignatureImage();
                signature.dateCaptured = signatureDate;
                signature.value = signatureImage.substr( signatureImage.indexOf(",") + 1 );

                // Update the view model to display the captured signature
                debug && console.log( "ManageWorkOrderReview.saveSignature:  Updating view model with signature" );
                reviewViewModel.workOrderSigned( true );
                reviewViewModel.signatureImage( signatureImage );

                switch ( reviewViewModel.pageId() ) {
                    case ManageWorkOrder.CUSTOMER_REVIEW_PAGE :
                        // If work order is open, change the technician status to logged in and clear
                        // the current work order from local storage
                        if ( WorkOrder.getManageWorkOrderActivity() == WorkOrder.MANAGE_WORK_ORDER_OPEN ) {
                            debug && console.log( "ManageWorkOrderReview.saveSignature: Changing work order to complete and changing status to logged in" );
                            JSONData.saveClockingStatus( 'technicianStatusLoggedIn', signatureDate );
                            WorkOrder.removeCurrentWorkOrderId();
                        }
                        ManageWorkOrder.setReadOnly( true );
                        reviewViewModel.writable( false );
                        WorkOrder.setManageWorkOrderActivity( WorkOrder.MANAGE_WORK_ORDER_VIEW );
                        updateHeaderAndFooter();
                        // Store the signature in the work order(s), set the work order dateCompleted to the
                        // customer signature date and set the WO status to completed
                        debug && console.log( "ManageWorkOrderReview.saveSignature:  Updating work order with signature" );
                        if ( customerSignAllAtOnce && workOrdersAwaitingCustomerSignature.length > 0 ) {
                            _.each( workOrdersAwaitingCustomerSignature, function( workOrderInList ) {
                                workOrderInList.workOrderSegments[0].dateCompleted = signatureDate;
                                workOrderInList.workOrderSegments[0].webStatus = WorkOrder.WORK_ORDER_STATUS_COMPLETED;
                                workOrderInList.workOrderSegments[0].customerSignature = signature;
                            });
                            saveAndPostWorkOrders( workOrdersAwaitingCustomerSignature );
                            if ( workOrdersAwaitingCustomerSignature.length > 1 ) {
                                reviewViewModel.multipleWorkOrdersSigned( true );
                            }
                            $("#manageWorkOrderSelectDiv").hide();
                        } else {
                            workOrder.workOrderSegments[0].dateCompleted = signatureDate;
                            workOrder.workOrderSegments[0].webStatus = WorkOrder.WORK_ORDER_STATUS_COMPLETED;
                            workOrder.workOrderSegments[0].customerSignature = signature;
                            saveAndPostWorkOrder( workOrder );
                        }
                        // Set date completed inside the view model
                        reviewViewModel.formattedWorkOrderCompleteDate( Localization.formatDateTime( signatureDate, "d" ) );

                        // Re-populate the header to update the status
                        workOrder.workOrderSegments[0].webStatus = WorkOrder.WORK_ORDER_STATUS_COMPLETED;
                        WorkOrder.setManageWorkOrderWritable( false );
                        workOrder.workOrderSegments[0].customerSignature = signature;
                        ManageWorkOrder.populateHeader();
                        break;
                    case ManageWorkOrder.TECH_REVIEW_PAGE :
                        debug && console.log( "ManageWorkOrderReview.saveSignature:  Updating work order with signature" );
                        workOrder.workOrderSegments[0].technicianSignature = signature;
                        // If work order is open, prompt technician about getting the customer's signature now
                        // before changing the clocking status, changing the work order status and saving the work order
                        if ( WorkOrder.getManageWorkOrderActivity() == WorkOrder.MANAGE_WORK_ORDER_OPEN ) {
                            Dialog.showConfirmYesNo( Localization.getText( "customerSignatureLabel" ),
                                                     Localization.getText( "gettingCustomerSignaturePrompt" ),
                                function() {
                                    // YES: Close current productive clocking and start a new one
                                    //      to track time used to get the customer's signature
                                    debug && console.log( "ManageWorkOrderReview.saveSignature: Creating productive clocking for getting customer signature" );
                                    Dialog.closeDialog();
                                    JSONData.setWorkOrderIdForClockingChange( reviewViewModel.manageWO.workOrder.webId() );
                                    JSONData.saveClockingStatus( "technicianStatusProductiveOrderApproval", Util.getISOCurrentTime() );
                                    updateHeaderAndFooter();
                                    saveAndPostWorkOrder( workOrder );
                                    // Re-populate the header to update the status
                                    ManageWorkOrder.populateHeader();
                                }, function() {
                                    // NO: Put the work order on hold and change technician status
                                    //     to logged in.
                                    Dialog.closeDialog();
                                    debug && console.log( "ManageWorkOrderReview.saveSignature: Putting work order on hold and clocking status to logged in" );
                                    workOrder.workOrderSegments[0].webStatus = WorkOrder.WORK_ORDER_STATUS_WAITING_ON_HOLD;
                                    WorkOrder.removeCurrentWorkOrderId();
                                    WorkOrder.setManageWorkOrderWritable( false );
                                    JSONData.saveClockingStatus( 'technicianStatusLoggedIn', Util.getISOCurrentTime() );
                                    ManageWorkOrder.setReadOnly( true );
                                    reviewViewModel.writable( false );
                                    updateHeaderAndFooter();
                                    saveAndPostWorkOrder( workOrder );
                                    // Re-populate the header to update the status
                                    ManageWorkOrder.populateHeader();
                                }, "400px" );
                        } else {
                            // Edit mode - simply save the work order with the tech signature
                            saveAndPostWorkOrder( workOrder );
                        }
                        break;
                }
            } else {
                Dialog.showAlert( signatureType, Localization.getText( missingSignaturePrompt ), null, "400px" );
            }
        }
    }

    /**
     * Display the send to e-mail address selection dialog
     */
    function displayEmailAddressUpdateDialog() {
        if( !ManageWorkOrder.isReadOnly() ) {
            currentEmailCCAddress = reviewViewModel.emailCCAddress();
            currentEmailToAddress = reviewViewModel.emailToAddress();

            debug && console.log( "ManageWorkOrderReview.displayEmailAddressUpdateDialog: Displaying send to e-mail selection dialog" );
            var dialogHtml = new EJS({url: 'templates/emailaddressupdatedialog' }).render();

            Dialog.showDialog({
                mode : 'blank',
                blankContent : dialogHtml,
                width : '700px'
            });

            $( '#emailToAddress' ).focus();

            // Apply knockout bindings to the dialog
            ko.applyBindings( reviewViewModel, $("#emailAddressUpdateDialog")[0] );
        }
    }
    
    /**
     * Cancel the e-mail address update
     */
    function cancelEmailAddressUpdate() {
    	debug && console.log( "ManageWorkOrderReview.cancelEmailAddressUpdate: Un-doing update to email fields" );
    	reviewViewModel.emailToAddress( emailToAddressPrevious );
        reviewViewModel.emailCCAddress( emailCCAddressPrevious );
        Dialog.closeDialog( false );
    }

    /**
     * Save the e-mail address update
     */
    function saveEmailAddressUpdate( pageLoad ) {
        Dialog.closeDialog( false );

        if( pageLoad == undefined ) {
            pageLoad = false;
        }

        var validEmailEntries = validateEmailEntries();

        // Validate the email entries
        if( reviewViewModel.pageId() == ManageWorkOrder.CUSTOMER_REVIEW_PAGE && validEmailEntries != ""&& pageLoad ) {
            Dialog.showAlert( Localization.getText( "invalidEmailFormat" ), validEmailEntries, function() {
                    Dialog.closeDialog();
                    displayEmailAddressUpdateDialog();
            }, "450px" );

            return;
        } else {
            // trim the email values for leading spaces
            reviewViewModel.emailToAddress( reviewViewModel.emailToAddress().replace(new RegExp("^[\\s]+", "g"), "" ));
            reviewViewModel.emailCCAddress( reviewViewModel.emailCCAddress().replace(new RegExp("^[\\s]+", "g"), "" ));
        }

        // Send a contact update message if either e-mail address changes
        if ( reviewViewModel.emailToAddress() != emailToAddressPrevious ||
             reviewViewModel.emailCCAddress() != emailCCAddressPrevious ) {

            debug && console.log( "ManageWorkOrderReview.saveEmailAddressUpdate: Creating customer contact update message with new e-mail addresses" );
            var message = JSONData.createNewMessage();
            message.dateSent   = message.dateUpdate;
            message.type       = JSONData.MESSAGE_TYPE_CUSTOMER_CONTACT_UPDATE;
            message.entityType = "Customer";
            message.entityId   = reviewViewModel.manageWO.customer.webId();
            message.value      = Localization.getText( "emailAddressUpdate" ) + "\n" +
                                 Localization.getText( "toLabel" ) + ": " + reviewViewModel.emailToAddress() + "\n" +
                                 Localization.getText( "ccLabel" ) + ": " + reviewViewModel.emailCCAddress();
            // JSONData.saveJSON( "messages", message, true );

            // Initialize the sendTo and sendCC fields of the workOrder
            var workOrder = ManageWorkOrder.getWorkOrder();
            workOrder.workOrderSegments[0].emailTo = reviewViewModel.emailToAddress();
            workOrder.workOrderSegments[0].emailCC = reviewViewModel.emailCCAddress();

            // Update the emailPrevious varaibles
            emailToAddressPrevious = reviewViewModel.emailToAddress();
            emailCCAddressPrevious = reviewViewModel.emailCCAddress();

            // Save the work order changes locally
            JSONData.saveJSON( "workOrders", workOrder, true );
            debug && console.log( "ManageWorkOrderReview.saveEmailAddressUpdate: Customer contact update message saved" );
        } else {
            Dialog.closeDialog( false );
            debug && console.log( "ManageWorkOrderReview.saveEmailAddressUpdate: No e-mail changes detected, customer contact update message not sent" );
        }
    }

    /**
     * Display the review work order dialog.
     * and to view a signature.
     */
    function displayWorkOrderReviewDialog() {
        debug && console.log( "ManageWorkOrderReview.displayWorkOrderReviewDialog: Displaying work order review dialog" );
        var dialogHtml = new EJS({url: 'templates/workorderreviewdialog' }).render( {
            workOrder : ManageWorkOrder.getWorkOrder()
        });
        Dialog.showDialog({
            mode : 'blank',
            blankContent : dialogHtml,
            width : '900px'
        });

        // Apply knockout bindings to the dialog
        reviewViewModel.reviewMessageText("");
        ko.applyBindings( reviewViewModel, $("#workOrderReviewDialog")[0] );
    }

    /**
     * Take a picture for work order review
     */
    function takeWorkOrderReviewPicture() {
        Util.takePicture( function( imageData ) {
            debug && console.log( "ManageWorkOrderReview.takeWorkOrderReviewPicture: Successful" );
            reviewViewModel.reviewPicture( "data:image/png;base64," + imageData );
            debug && console.log( "ManageWorkOrderReview.takeWorkOrderReviewPicture: Start of image data: " +
                                  reviewViewModel.reviewPicture().substr( 0, 50 ) );
        });
    }

    /**
     * Send the work order review message
     */
    function sendWorkOrderReviewMessage() {
        if ( reviewViewModel.reviewMessageText().length > 0 ) {
            debug && console.log( "ManageWorkOrderReview.sendWorkOrderReviewMessage: Creating new work order review message for " +
                    ManageWorkOrder.getWorkOrder().documentNumber );
            Dialog.closeDialog();

            // Construct and save message object for the work order review
            var message = JSONData.createNewMessage();
            message.value       = reviewViewModel.reviewMessageText();
            message.type        = JSONData.MESSAGE_TYPE_WO_REVIEW;
            message.entityType  = "WorkOrderSegment";
            message.entityId    = ManageWorkOrder.getWorkOrder().workOrderSegments[0].webId;
            message.sent        = Util.getISOCurrentTime();
            JSONData.saveJSON( "messages", message );
            debug && console.log( "ManageWorkOrderReview.sendWorkOrderReviewMessage: Review message saved" );
            // Update the work order to indicate that it was reviewed
            var workOrder = ManageWorkOrder.getWorkOrder();
            workOrder.reviewDate = message.sent;
            JSONData.saveJSON( "workOrders", workOrder );
            debug && console.log( "ManageWorkOrderReview.sendWorkOrderReviewMessage: Work order review date saved" );
            // Update the view model with the review information
            reviewViewModel.reviewDate( workOrder.reviewDate );
            reviewViewModel.workOrderReviewed( true );
        } else {
            Dialog.closeDialog();
        	Dialog.showAlert( Localization.getText( "workOrderReview" ), Localization.getText( "workOrderReviewTextMissing" ), function() {
                Dialog.closeDialog();
            	displayWorkOrderReviewDialog();
        	}, "350px" );
        }
    }

    /**
     *
     */
    function emailContacts() {
        return reviewViewModel.emailContacts();
    }
    /**
     * Display the selectemailcontactdialog.ejs dialog
     * @param toOrCCAttempt identifies if this was from the TO or CC selection
     */
     function showContactsForEmail( toOrCCAttempt) {
        var customersList = "";

        // Close the selectEmailContactDialog dialog
        Dialog.closeDialog( false );

        // If contact is in the To or CC list (respectively), check them here
        _.each( reviewViewModel.emailContacts(), function( contact ) {
            customersList += "<input type='checkbox' name='" + contact.email + "' name='" + contact.email + "'" +
                " id='" + contact.email + "' class='custom' data-theme='c' ";

            // Check the entry if it is already in the email field
            if(( toOrCCAttempt == EMAIL_TO_ATTEMPT && reviewViewModel.emailToAddress().indexOf( contact.email ) != -1 ) ||
                ( toOrCCAttempt == EMAIL_CC_ATTEMPT &&  reviewViewModel.emailCCAddress().indexOf( contact.email ) != -1 )) {
                customersList += "checked='checked'"
            }

            // Check if the entry is already entered in the opposing email field
            if(( toOrCCAttempt == EMAIL_TO_ATTEMPT && reviewViewModel.emailCCAddress().indexOf( contact.email ) != -1 ) ||
                ( toOrCCAttempt == EMAIL_CC_ATTEMPT &&  reviewViewModel.emailToAddress().indexOf( contact.email ) != -1 )) {
                customersList += "disabled='disabled'"
            }

            customersList += "/><label for='" + contact.email + "'>" + contact.name + " " + contact.email + "</label>";
        });

        var dialog = new EJS({ url: "templates/selectemailcontactdialog" }).render({
            customersList: customersList,
            toOrCCAttempt: toOrCCAttempt
        });

        Dialog.showDialog({
            blankContent : dialog,
            fullScreenForce: true,
            width: '600px',
            zindex: '1000'
        });
     }

     /**
      * Save the email contacts from the selectemailcontactdialog entries
      * @param toOrCCAttempt
      * @param contactResults array of contact results from the selectmailcontactdialog
      */
     function saveEmailContacts( toOrCCAttempt, contactResults ) {
        var tmpEmail = ( toOrCCAttempt == EMAIL_TO_ATTEMPT ) ? reviewViewModel.emailToAddress() : reviewViewModel.emailCCAddress();

        _.each( contactResults, function( contact ) {
            // If contact was selected and was previously not in the emailTo field
            if( contact.checked && tmpEmail.indexOf( contact.name ) == -1 ) {
                tmpEmail += " " + contact.name;
            }

            // If the contact was not selected and was previously in the tmpEmail field
            if( !contact.checked && tmpEmail.indexOf( contact.name ) != -1 ) {
                // validate that the contact was listed as either "x, y, z" or "x y z"
                if( tmpEmail.indexOf( " " + contact.name ) != -1 ) {
                    tmpEmail = tmpEmail.replace( contact.name, ""  );
                } else if ( tmpEmail.indexOf( ", " + contact.name ) != -1 ) {
                    tmpEmail = tmpEmail.replace( ", " + contact.name, "" );
                } else {
                    tmpEmail = tmpEmail.replace( contact.name, "" );
                }
            }
        });

        // Resave the proper email field in the viewModel accordingly
        if( toOrCCAttempt == EMAIL_TO_ATTEMPT ) {
            reviewViewModel.emailToAddress( tmpEmail );
        } else {
            reviewViewModel.emailCCAddress( tmpEmail );
        }

        // Re-display the emailAddressUpdate dialog
        displayEmailAddressUpdateDialog();
     }

     /**
      * Validate that the emailTo and emailCC fields contain valid entries
      * @return valid user entry status
      */
     function validateEmailEntries() {
        var regex = /\S+@\S+\.\S+/;

        // Check for email addresses by splitting the text by instances of spaces and commas
        var emailToCandidate = reviewViewModel.emailToAddress().replace( ",", "").split( " " );
        var emailCCCandidate = reviewViewModel.emailCCAddress().replace( ",", "").split( " " );

        for( var candidate in emailToCandidate ) {
            if( emailToCandidate[candidate] != '' && !regex.test( emailToCandidate[candidate] )) {
                return Localization.getText( "invalidEmailAddressFoundTO" ) + emailToCandidate[candidate];
            }
        }

        // Check that each email CC candidate contains an @
        for( var candidate in emailCCCandidate ) {
           if( emailCCCandidate[candidate] != '' && !regex.test( emailCCCandidate[candidate] )) {
                return Localization.getText( "invalidEmailAddressFoundCC" ) + "'" + emailCCCandidate[candidate] + "'";
            }

            // Check that the user didn't manually add a contact to the email fields
            if( $.inArray( emailCCCandidate[candidate], emailToCandidate ) != -1 ) {
                return Localization.getText( "invalidEmailAddressToAndCC" ) + "'" + emailCCCandidate[candidate] + "'";
            }
        }

        return "";
     }

    return {
        'validateEmailEntries'              : validateEmailEntries,
        'displayEmailAddressUpdateDialog'   : displayEmailAddressUpdateDialog,
        'emailContacts'                     : emailContacts,
        'EMAIL_TO_ATTEMPT'                  : EMAIL_TO_ATTEMPT,
        'EMAIL_CC_ATTEMPT'                  : EMAIL_CC_ATTEMPT,
        'init'                              : init,
        'populatePage'                      : populatePage,
        'saveSignature'                     : saveSignature,
        'saveEmailContacts'                 : saveEmailContacts,
        'sendWorkOrderReviewMessage'        : sendWorkOrderReviewMessage,
        'showContactsForEmail'              : showContactsForEmail
    };

}();

/**
 * pageinit event handler
 */
$("div:jqmData(role='page')").on( "pageinit", function( event, ui ) {
    // All pages must set pageId to this.id
    var pageId = this.id;
    debug && console.log( "ManageWorkOrderReview.pageinit" );
    // This MUST be called by every page specific pageinit event handler!
    UIFrame.init( pageId, function() {
        debug && console.log( "ManageWorkOrderReview.pageinit: Executing page specific init" );
        // UIFrame.hideElement( "div#manageWorkOrderReviewPage" );
        ManageWorkOrderReview.init();
        ManageWorkOrderReview.populatePage();
        // This MUST be the last line inside each page specific init function
        UIFrame.postPageSpecificInit( pageId );
    });
});
