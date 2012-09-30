var rootWebServiceUrl = "http://192.168.1.73:8181/cxf/crm/customerservice";
var rootWorkOrderServiceUrl = "http://192.168.1.73:8181/cxf/workorders";

/**
 * Call the weather webservice.  To test this inside Chrome running
 * on your desktop, see http://stackoverflow.com/questions/3102819/chrome-disable-same-origin-policy 
 */
function callWeatherService() {
    debug && console.log( "Getting current location for weather service call" );
    navigator.geolocation.getCurrentPosition( function( position ) {
        debug && console.log( "Getting weather for lat: " + position.coords.latitude + 
                     " long: " + position.coords.longitude );
        var url = 'http://api.wunderground.com/api/291c24e20eb039e1/geolookup/conditions/q/' + 
                  position.coords.latitude + ',' + position.coords.longitude + ".json";
        debug && console.log( "Calling weather service at url: " + url );
        $.ajax( {
            type:'Get',
            url:url,
            dataType:'json',
            success:weatherServiceSuccessCallback,
            error:webServiceErrorCallback,
            complete:webServiceCompleteCallback
        });
    },
    function( error ) {
        alert( "Attempt to get tablet's current position failed.\n" + 
               "Code: " + error.code + "\nMessage: " + error.message );
    }); 
}

/**
 * Weather service success callback
 * @param data
 * @param status
 * @param xmlHttpReq
 */
function weatherServiceSuccessCallback( weather, status, xmlHttpReq ) {
    debug && console.log( "weatherServiceSuccessCallback:  status = " + status );
    var currentTemp = "Current temp in " + 
        weather.location.city + ", " + weather.location.state + " as of " +
        weather.current_observation.observation_time_rfc822 + ": " + weather.current_observation.temperature_string;
    $("#currentStatus").text( currentTemp );    
}

/**
 * Web service error callback
 * @param xmlHttpReq
 * @param status
 * @param errorThrown
 */
function webServiceErrorCallback( xmlHttpReq, status, errorThrown ) {
    debug && console.log( "weatherServiceErrorCallback:  status = " + status );
    alert( "Web service call failed.  Status = " + status );
}

/**
 * Web service complete callback.  This is called after all
 * error and success callbacks are done.
 * @param xmlHttpReq
 * @param status
 */
function webServiceCompleteCallback( xmlHttpReq, status ) {
    debug && console.log( "webServiceCompleteCallback:  status = " + status );
}

/**
 * Call the CustomerService running on Keith's MacBook Pro
 * under Fuse ESB to get a customer
 */
function callGetCustomer() {
    var url = rootWebServiceUrl + '/customers/123';
    $.ajax( {
        type : 'GET',
        url : url,
        dataType : 'json',
        success : function( data, status, xmlHttpReq ) {
            debug && console.log( "Customer ID = " + data.customer.id );
            debug && console.log( "Customer name = " + data.customer.name );
            var result = "Customer: ID = " + data.customer.id +
                         " Name = " + data.customer.name;
            $("#getcustomerresult").text( result );
        },
        error : webServiceErrorCallback,
        complete : webServiceCompleteCallback
    } );
}

/**
 * Call the CustomerService running on Keith's MacBook Pro
 * under Fuse ESB to add a customer
 */
function callAddCustomer() {
    debug && console.log( "Adding customer" );
    var url = rootWebServiceUrl + '/customers';
    $.ajax( {
        type : 'POST',
        url : url,
        contentType : 'application/json',
        data : JSON.stringify( { "customer" : { "name" : "Jack" } } ),
        dataType : 'json',
        success : function( data, status, xmlHttpReq ) {
            debug && console.log( "New customer ID = " + data.customer.id );
            debug && console.log( "New customer name = " + data.customer.name );
            var result = "New customer: ID = " + data.customer.id +
                         " Name = " + data.customer.name;
            $("#addcustomerresult").text( result );
        },
        error : webServiceErrorCallback,
        complete : webServiceCompleteCallback
    } );
}

/**
 * Get a work order via an Ajax JSON call to 
 * the Fuse ESB WorkOrderService
 */
function getWorkOrder() {
    var url = rootWorkOrderServiceUrl + '/123';
    $.ajax( {
        type : 'GET',
        url : url,
        dataType : 'json',
        success : function( data, status, xmlHttpReq ) {
            debug && console.log( "Work order ID = " + data.workOrder.id );
            debug && console.log( "Customer ID = " + data.workOrder.customerId );
            var result = "Work Order: ID = " + data.workOrder.id +
                         " Customer ID = " + data.workOrder.customerId;
            $("#getworkorderresult").text( result );
        },
        error : webServiceErrorCallback,
        complete : webServiceCompleteCallback
    } );
}

