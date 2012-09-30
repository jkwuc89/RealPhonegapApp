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
    
    // Knockout view model for tech review
    var reviewViewModel = {
        emailCCAddress : ko.observable(""),
        emailToAddress : ko.observable(""),
        manageWO : null,
        pageId : ko.observable( window.localStorage.getItem( ManageWorkOrder.LS_REVIEW_PAGE_ID ) ),
        repairCode : ko.observable(""),
        reviewDate : ko.observable( Util.getISOCurrentTime() ),
        reviewMessageText : ko.observable(""),
        reviewPicture : ko.observable(""),
        signatureDate : ko.observable( Util.getISOCurrentTime() ),
        signatureImage : ko.observable(""),
        technicianName : ko.observable( JSONData.getTechnicianName() ),
        workOrderLines : ko.observableArray( [] ),
        workOrderReviewed : ko.observable( false ),
        workOrderSigned : ko.observable( false ),
        writable : ko.observable( false ),
        displayEmailAddressUpdateDialog : displayEmailAddressUpdateDialog,
        reviewWorkOrder : displayWorkOrderReviewDialog,
        saveEmailAddressUpdate : saveEmailAddressUpdate,
        saveSignature : saveSignature, 
        sendWorkOrderReviewMessage : sendWorkOrderReviewMessage,
        refreshWorkOrderLinesList : function( elements ) {
        	$('#manageWorkOrderPartsList').listview();
        },
        signWorkOrder : function() {
            if ( this.pageId() == ManageWorkOrder.CUSTOMER_REVIEW_PAGE ) {
                // If multiple work orders can be signed at once, ask technician about
                // signing them all.
                customerSignAllAtOnce = false;
                if ( workOrdersAwaitingCustomerSignature.length > 1 ) {
                    var workOrderNumbers = Util.getWorkOrderDocumentNumbersAsString( workOrdersAwaitingCustomerSignature );
                    var promptText =
                        Localization.getText( "customerSignatureMultipleWorkOrders" ).replace( "workOrders", workOrderNumbers );
                    Dialog.showConfirmYesNo( Localization.getText( "customerSignatureLabel" ), promptText,
                        // Yes handler...sign all work orders at once
                        function() {
                            UIFrame.closeActiveDialog();
                            customerSignAllAtOnce = true;
                            displaySignatureCaptureBlock();
                        },
                        // No handler...sign currently open work order only
                        function() {
                            UIFrame.closeActiveDialog();
                            displaySignatureCaptureBlock();
                        }, "400px"
                    );
                } else {
                    displaySignatureCaptureBlock();

                }
            } else {
                displaySignatureCaptureBlock();
            }
        },
        cancelSignature : function() {
            hideSignatureCaptureBlock( true );
        },
        takeWorkOrderReviewPicture : takeWorkOrderReviewPicture
    };
    
    /**
     * Init this object
     */
    function init() {
        debug && console.log( "ManageWorkOrderReview.init: Initializing review page id: " + reviewViewModel.pageId() );
        ManageWorkOrder.init();

        // Handle differences between the different review pages
        var signature = null;
        var workOrderMenu = $("#manageWorkOrderSelectMenu");
        switch ( reviewViewModel.pageId() ) {
            case ManageWorkOrder.CUSTOMER_REVIEW_PAGE :
                missingSignaturePrompt = "customerReviewSignatureMissing";
                signature = ManageWorkOrder.getWorkOrder().workOrderSegments[0].customerSignature;
                signatureType = Localization.getText( "customerSignatureLabel" );

                // Get all work orders for this customer that can be signed for at once by the customer
                workOrdersAwaitingCustomerSignature = _.filter( JSONData.getObjectsByDataType( "workOrders"), function( workOrderInList ) {
                    return ( workOrderInList.customerId == ManageWorkOrder.getWorkOrder().customerId &&
                             workOrderInList.workOrderSegments[0].webStatus != JSONData.WORK_ORDER_STATUS_COMPLETED && 
                             JSONData.isWorkOrderSignedByTechnician( workOrderInList ) );
                });
                workOrdersAwaitingCustomerSignature = _.sortBy( workOrdersAwaitingCustomerSignature, function( workOrderInList ) {
                    return ( workOrderInList.documentNumber );
                });
                debug && console.log( "ManageWorkOrderReview.init: Work orders for customer " + 
                                      ManageWorkOrder.getCustomer().name + " awaiting customer signature: " +
                                      workOrdersAwaitingCustomerSignature.length );
                
                // If there are multiple work orders that can be signed, add them to the drop
                // down menu at the top right and show the menu
                if ( workOrdersAwaitingCustomerSignature.length > 1 ) {
                    debug && console.log( "ManageWorkOrderReview.init: Displaying work order drop down on customer review page" ); 
                    _.each( workOrdersAwaitingCustomerSignature, function( workOrderInList ) {
                        var workOrderItemElement = "<option class='manageWorkOrderMenuItem' id='" +
                                                   workOrderInList.webId + "' value='" + 
                                                   workOrderInList.webId + "'>" + workOrderInList.documentNumber + "</option>";
                        workOrderMenu.append( workOrderItemElement );
                    });
                    // Make the current work order the selected work order in the drop down.
                    workOrderMenu.val( ManageWorkOrder.getWorkOrder().webId );
                    $("#manageWorkOrderSelectDiv").show();
                    // Bind the handler to the work order drop down
                    $("#manageWorkOrderSelectMenu").change( changeCustomerReviewWorkOrder );
                } 
                break;
                
            case ManageWorkOrder.TECH_REVIEW_PAGE :
            	missingSignaturePrompt = "technicianReviewSignatureMissing";
                signature = ManageWorkOrder.getWorkOrder().workOrderSegments[0].technicianSignature;
                signatureType = Localization.getText( "technicianSignatureLabel" );
                break;
        }
        
        // Add the parent manage work order view model to the this page's view model
        reviewViewModel.manageWO = ManageWorkOrder.viewModel;

        // Add computed observable for formatting the equipment hour meter
        if ( reviewViewModel.manageWO.workOrder.workOrderSegments()[0].hourMeter() ) {
            reviewViewModel.formattedEquipmentHourMeter = ko.computed( function() {
                return Localization.formatNumber( reviewViewModel.manageWO.workOrder.workOrderSegments()[0].hourMeter(), "n0" );
            });
        } else {
            reviewViewModel.formattedEquipmentHourMeter = ko.observable( 0 );
        }
        
        // Add computed observable for formatting the work order start and complete date
        reviewViewModel.formattedWorkOrderStartDate = ko.computed( function() {
            return Localization.formatDateTime( reviewViewModel.manageWO.workOrder.dateOpened(), "d" );
        });
        reviewViewModel.formattedWorkOrderCompleteDate = ko.computed( function() {
            return Localization.formatDateTime( Util.getISOCurrentTime(), "d" );
        });

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
        
        // Add the work order lines.  
        // the total labor hours.
        var totalLaborHours = 0;
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
            
            // All labor related lines are used to calculate the total labor hours
            if ( lineInList.product.manufacturer && lineInList.product.manufacturer() == JSONData.WORK_ORDER_LINE_MFG_LABOR ) {
                totalLaborHours += lineInList.qtyOrdered();
                laborLine = true;
            }
            
            // Outside part purchases are handled differently because information
            // about them won't exist inside products or inside inventory
            if ( lineInList.product.productCode && lineInList.product.productCode() == JSONData.OUTSIDE_PART_PURCHASE_PRODUCE_CODE ) {
                workOrderLine.description = lineInList.description;
                workOrderLine.location = "";
            } else {
                workOrderLine.description = lineInList.description;
                workOrderLine.location = lineInList.location;
            }
            workOrderLine.quantity = lineInList.qtyOrdered;
            
            // Labor lines are not placed on the customer review page
            if ( !(reviewViewModel.pageId() == ManageWorkOrder.CUSTOMER_REVIEW_PAGE && laborLine) ) {
                reviewViewModel.workOrderLines.push( workOrderLine );
            }
        });

        // On the customer review page, the total labor hours includes
        // the time used to get the customer's signature which is represented
        // by the last productive clocking for the work order.
        var customerSignatureLaborAdjustment = 0.0;
        if ( reviewViewModel.pageId() == ManageWorkOrder.CUSTOMER_REVIEW_PAGE && !ManageWorkOrder.isReadOnly() ) {
            debug && console.log( "ManageWorkOrderOverview.init: Adding time for getting customer signature to total labor hours" );
            var clockingsForWorkOrder = _.filter( JSONData.getObjectsByDataType( "technicianClocking"), function( clockingInList ) {
                return ( clockingInList.workOrderHeaderId == ManageWorkOrder.getWorkOrder().webId && 
                         clockingInList.technicianStatus == JSONData.TECHNICIAN_STATUS_PRODUCTIVE );
            });
            var lastProductiveClocking = _.last( clockingsForWorkOrder );
            if ( lastProductiveClocking && lastProductiveClocking.timeStart ) {
                var lastClockingDuration = ( ( new Date().getTime() - new Date( lastProductiveClocking.timeStart ).getTime() ) / 1000 / 60 );
                customerSignatureLaborAdjustment = ( ( parseInt(lastClockingDuration / 30) ) + 1 ) * 0.5; 
                debug && console.log( "ManageWorkOrderOverview.init: Actual time in minutes used to get customer signature = " + lastClockingDuration + 
                                      " Labor adjustment in hours = " + customerSignatureLaborAdjustment );
            }
        }
        
        // Add total labor hours to the view model
        reviewViewModel.totalLaborHours = ko.computed( function() {
            return Localization.formatNumber( totalLaborHours + customerSignatureLaborAdjustment, "n1" );
        });
        
        // Get the repair code information
        JSONData.getObjectFromDatabaseById( "standardJobCodes",
                                            reviewViewModel.manageWO.workOrder.workOrderSegments()[0].standardJobCodeId(),
            function( standardJobCode ) {
                if ( standardJobCode ) {
                    reviewViewModel.repairCode( standardJobCode.completeJobCode + " - " + 
                                                standardJobCode.description + " - " + 
                                                standardJobCode.notes );
                }
            }
        );

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
        var selectedWorkOrderWebId = this.value;;
        JSONData.setManageWorkOrderId( selectedWorkOrderWebId );
        $.mobile.showPageLoadingMsg();
        // Cannot use reload on Android...using location.href instead
        // location.reload();
        document.location.href = "manageworkorderreview.html";
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
        debug && console.log( "ManageWorkOrderReview.saveAndPostWorkOrder: Saving and posting " +
                              numWorkOrders + " work orders" );
        
        var workOrderNumbers = Util.getWorkOrderDocumentNumbersAsString( workOrders );
        var pleaseWaitText = Localization.getText( "postingWorkOrdersText" ).replace( "workOrders", workOrderNumbers );
        Dialog.showPleaseWait( Localization.getText( "postingWorkOrdersTitle" ), pleaseWaitText, "400px" );
        
        // Set up an _.after function that is executed once after all of the posts are done
        var postCompleteFn = _.after( numWorkOrders, function() {
            UIFrame.closeActiveDialog();
            debug && console.log( "ManageWorkOrderReview.saveAndPostWorkOrder: " + numWorkOrders + 
                                  " work orders posted to the middle tier" );
        });
        
        // Save and post all of the work orders
        _.each( workOrders, function( workOrderInList ) {
            debug && console.log( "ManageWorkOrderReview.saveAndPostWorkOrders: Saving and posting work order " +
                                  workOrderInList.documentNumber );
            JSONData.saveJSON( "workOrders", workOrderInList );
            JSONData.postWorkOrder( workOrderInList, false, false, postCompleteFn, postCompleteFn );
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
        JSONData.saveJSON( "workOrders", workOrder );
        
        // Post the work order to the middle tier
        JSONData.postWorkOrder( workOrder, true, true, function( updatedWorkOrder ) {
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
            if ( signatureString != "[]" ) {
                hideSignatureCaptureBlock( false );
                var workOrder = ManageWorkOrder.getWorkOrder();
                debug && console.log( "ManageWorkOrderReview.saveSignature:  Saving signature with date = " + 
                                      reviewViewModel.signatureDate() + " inside work order " + workOrder.documentNumber );

                // Create a Signature object
                var signature = JSONData.createNewSignature();
                var signatureImage = signaturePad.getSignatureImage();
                signature.dateCaptured = reviewViewModel.signatureDate();
                signature.value = signatureImage.substr( signatureImage.indexOf(",") + 1 );

                // Update the view model to display the captured signature
                debug && console.log( "ManageWorkOrderReview.saveSignature:  Updating view model with signature" );
                reviewViewModel.workOrderSigned( true );
                reviewViewModel.signatureImage( signatureImage );

                switch ( reviewViewModel.pageId() ) {
                    case ManageWorkOrder.CUSTOMER_REVIEW_PAGE :
                        // Change the technician status to logged in.
                        debug && console.log( "ManageWorkOrderReview.saveSignature: Changing work order to complete and changing status to logged in" );
                        JSONData.saveClockingStatus( 'technicianStatusLoggedIn', Util.getISOCurrentTime() );
                        JSONData.removeCurrentWorkOrderId();
                        ManageWorkOrder.setReadOnly( true );
                        reviewViewModel.writable( false );
                        updateHeaderAndFooter();
                        // Store the signature in the work order(s) and set the work order status to completed
                        debug && console.log( "ManageWorkOrderReview.saveSignature:  Updating work order with signature" );
                        if ( customerSignAllAtOnce && workOrdersAwaitingCustomerSignature.length > 0 ) {
                            _.each( workOrdersAwaitingCustomerSignature, function( workOrderInList ) {
                                workOrderInList.workOrderSegments[0].webStatus = JSONData.WORK_ORDER_STATUS_COMPLETED;
                                workOrderInList.workOrderSegments[0].customerSignature = signature;
                            });
                            saveAndPostWorkOrders( workOrdersAwaitingCustomerSignature );
                        } else {
                            workOrder.workOrderSegments[0].webStatus = JSONData.WORK_ORDER_STATUS_COMPLETED;
                            workOrder.workOrderSegments[0].customerSignature = signature;
                            saveAndPostWorkOrder( workOrder );
                        }
                        // Re-populate the header to update the status
                        workOrder.workOrderSegments[0].webStatus = JSONData.WORK_ORDER_STATUS_COMPLETED;
                        workOrder.workOrderSegments[0].customerSignature = signature;
                        ManageWorkOrder.populateHeader();
                        break;
                    case ManageWorkOrder.TECH_REVIEW_PAGE :
                        debug && console.log( "ManageWorkOrderReview.saveSignature:  Updating work order with signature" );
                        workOrder.workOrderSegments[0].technicianSignature = signature;
                        // Prompt technician about getting the customer's signature now.
                        Dialog.showConfirmYesNo( Localization.getText( "customerSignatureLabel" ),
                                                 Localization.getText( "gettingCustomerSignaturePrompt" ),
                        function() {
                            // YES: Close current productive clocking and start a new one
                            //      to track time used to get the customer's signature
                            debug && console.log( "ManageWorkOrderReview.saveSignature: Creating productive clocking for getting customer signature" );
                            UIFrame.closeActiveDialog();
                            JSONData.setWorkOrderIdForClockingChange( reviewViewModel.manageWO.workOrder.webId() );
                            JSONData.saveClockingStatus( "technicianStatusProductive", Util.getISOCurrentTime() );
                            updateHeaderAndFooter();
                            saveAndPostWorkOrder( workOrder );
                            // Re-populate the header to update the status
                            ManageWorkOrder.populateHeader();
                        }, function() {
                            // NO: Put the work order on hold and change technician status
                            //     to logged in.
                            UIFrame.closeActiveDialog();
                            debug && console.log( "ManageWorkOrderReview.saveSignature: Putting work order on hold and clocking status to logged in" );
                            workOrder.workOrderSegments[0].webStatus = JSONData.WORK_ORDER_STATUS_WAITING_ON_HOLD;
                            JSONData.removeCurrentWorkOrderId();
                            JSONData.saveClockingStatus( 'technicianStatusLoggedIn', Util.getISOCurrentTime() );
                            ManageWorkOrder.setReadOnly( true );
                            reviewViewModel.writable( false );
                            updateHeaderAndFooter();
                            saveAndPostWorkOrder( workOrder );
                            // Re-populate the header to update the status
                            ManageWorkOrder.populateHeader();
                        }, "400px" );
                        break;
                }
            } else {
                Dialog.showAlert( signatureType, Localization.getText( missingSignaturePrompt ) );
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
             
            $(document).simpledialog2({
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
     * Save the e-mail address update
     */
    function saveEmailAddressUpdate() {
        UIFrame.closeActiveDialog();
        
        // Send a contact update message if either e-mail address changes
        if ( reviewViewModel.emailToAddress() != currentEmailToAddress ||
             reviewViewModel.emailCCAddress() != currentEmailCCAddress ) {
            debug && console.log( "ManageWorkOrderReview.saveEmailAddressUpdate: Creating customer contact update message with new e-mail addresses" );
            var message = JSONData.createNewMessage();
            message.dateSent   = message.dateUpdate;
            message.type       = JSONData.MESSAGE_TYPE_CUSTOMER_CONTACT_UPDATE;
            message.entityType = "Customer";
            message.entityId   = reviewViewModel.manageWO.customer.webId();
            message.value      = Localization.getText( "emailAddressUpdate" ) + "\n" +
                                 Localization.getText( "toLabel" ) + ": " + reviewViewModel.emailToAddress() + "\n" +
                                 Localization.getText( "ccLabel" ) + ": " + reviewViewModel.emailCCAddress();
            JSONData.saveJSON( "messages", message );
            debug && console.log( "ManageWorkOrderReview.saveEmailAddressUpdate: Customer contact update message saved" );
        } else {
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
        $(document).simpledialog2({
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
            UIFrame.closeActiveDialog();
            
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
            alert( Localization.getText( "workOrderReviewTextMissing" ) );
        }
    }
    
    return {
        'init'                          : init,
        'populatePage'                  : populatePage,
        'saveSignature'                 : saveSignature,
        'sendWorkOrderReviewMessage'    : sendWorkOrderReviewMessage
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
        
        ManageWorkOrderReview.init();
        ManageWorkOrderReview.populatePage();

        // This MUST be the last line inside each page specific init function
        UIFrame.postPageSpecificInit( pageId );
    });
});
