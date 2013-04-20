/**
 * knockoutdemo.js 
 */

"use strict";

/**
 * Using the Revealing Module JavaScript pattern to encapsulate
 * the UI frame functionality into an object
 */
var KnockoutDemo = function() {

    var demoViewModel = {
        name : ko.observable(""),
        address : ko.observable(""),
        city : ko.observable(""),
        selectedState : ko.observable( "" ),
        states : ko.observable( [ "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
                                  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
                                  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
                                  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
                                  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY" ] ),
        zip : ko.observable(""),
        customers : ko.mapping.fromJS( _.sortBy( JSONData.getObjectsByDataType( "customers" ), function( customerInList ) {
            return customerInList.name;
        })),
        parts : ko.observableArray([]),
        addCustomer : addCustomer
    };

    /**
     * After the PhoneGap deviceready event fires, run postLoadFn()
     */
    document.addEventListener( "deviceready", onDeviceReady, false );
    function onDeviceReady() {
        debug && console.log( "KnockoutDemo.onDeviceReady: Running postLoadFn" );
        postLoadFn();
    }

    /**
     * After the overview page loads on Chrome Desktop, run postLoadFn()
     */
    $(window).load( function() {
        if ( Util.isRunningOnChromeDesktop() ) {
            debug && console.log( "KnockoutDemo.window.load: Running postLoadFn" );
            postLoadFn();
        } else {
            debug && console.log( "ManageWorkOrderOverview.window.load: App running on tablet. postLoadFn skipped." );
        }
    });

    /**
     * This function is executed after the page loads on Chrome Desktop
     * or when the onDeviceReady event fires on the tablet.
     */
    function postLoadFn() {
        debug && console.log( "KnockoutDemo.postLoadFn: Started at " + new Date() );

        // Populate the parts list using the DB
        JSONData.getObjectsFromDatabase( "parts", function( parts ) {
            demoViewModel.parts( parts );
        });
    }

    /**
     * Initialization
     */
    var init = _.once( function( pageId ) {
        debug && console.log( "KnockoutDemo.init: Knockout Demo page initialization" );
        
        // Apply the knockout bindings
        ko.applyBindings( demoViewModel );
    });
    
    /**
     * Reset the add customer label styles
     */
    function resetAddCustomerLabelStyles() {
        $("#nameLabel").css( "color", "#333" );
        $("#addressLabel").css( "color", "#333" );
        $("#cityLabel").css( "color", "#333" );
        $("#zipLabel").css( "color", "#333" );
    }
    
    /**
     * Reset the add customer input fields
     */
    function resetAddCustomerInput() {
        demoViewModel.name("");
        demoViewModel.address("");
        demoViewModel.city("");
        demoViewModel.zip("");
    }
    
    /**
     * Add a customer to the list
     */
    function addCustomer() {
        debug && console.log( "KnockoutDemo.addCustomer: Add a customer using form fields" );
        
        resetAddCustomerLabelStyles();
        
        var inputValid = true;
        var newCustomer = {};
        
        // Validate input
        if ( !demoViewModel.name() ) {
            $("#nameLabel").css( "color", "red" );
            inputValid = false;
        }
        if ( !demoViewModel.address() ) {
            $("#addressLabel").css( "color", "red" );
            inputValid = false;
        }
        if ( !demoViewModel.city() ) {
            $("#cityLabel").css( "color", "red" );
            inputValid = false;
        }
        if ( !demoViewModel.zip() ) {
            $("#zipLabel").css( "color", "red" );
            inputValid = false;
        }

        // Input is valid, add customer to list and save it
        if ( inputValid ) {
            newCustomer.id = Util.getUniqueId();
            newCustomer.name = demoViewModel.name();
            newCustomer.address = demoViewModel.address();
            newCustomer.city = demoViewModel.city();
            newCustomer.state = demoViewModel.selectedState();
            newCustomer.zip = demoViewModel.zip();
            demoViewModel.customers.push( newCustomer );
            JSONData.saveJSON( "customers", newCustomer );
            resetAddCustomerInput();
            resetAddCustomerLabelStyles();
        }
    }

    return {
        'init'           : init
    };
}();

/**
 * pageinit event handler 
 */
$("div:jqmData(role='page')").on( "pageinit", function( event, ui ) {
    // All pages must set pageId to this.id
    var pageId = this.id;
    debug && console.log( "KnockoutDemo.pageinit: Initializing " + pageId );
    // This MUST be called by every page specific pageinit event handler!
    UIFrame.init( pageId, function() {
        debug && console.log( "KnockoutDemo.pageinit: Page specific init goes here" );
        KnockoutDemo.init();

        // This MUST be the last line inside each page specific init function
        UIFrame.postPageSpecificInit( pageId );
    });
});
