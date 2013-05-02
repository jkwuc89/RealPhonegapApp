/**
 * Reassign all work orders that are not closed
 * This script requires the following libraries:
 *     jQuery
 *     Underscore
 */

var debug = true;
var baseUrl = "http://206.51.156.155:8080/mobileservice";
var version = "0.1";
var logonPath = "j_spring_security_check";
var processWorkOrderPath = "workOrder/process";
var logonUrl = baseUrl + "/" + logonPath;
var processWorkOrderUrl = baseUrl + "/" + version + "/" + processWorkOrderPath;
var workOrderJSONFeedUrl = baseUrl + "/" + version + "/" + "workOrder/list";

var rejected = 200;
var completed = 700;

function logon( username, password, callbackFn ) {
    $.ajax( {
        url : logonUrl,
        type : "POST",
        timeout : 30 * 1000,
        beforeSend : function( xhr ) {
            // Logon requires this additional header
            xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
        },
        data : {
            j_username : "520032" + ";" + username,
            j_password : password
        },
        dataType : 'json',
        success : function( data, textStatus, jqXHR ) {
            callbackFn();
        },
        error : function( jqXHR, textStatus, errorThrown ) {
            debug && console.log( "logon: ajax error" );
            if ( textStatus && textStatus.length > 0 ) {
                debug && console.log( "logon: error status text = " + textStatus );
            }
        }
    });
}

function postDataToMiddleTier( url, data, timeout, successCallback, errorCallback ) {
    if ( !url || !data || !timeout ) {
        throw "JSONData.postDataToMiddleTier: One or more required parameters (url, data, timeout) are missing or invalid";
    }

    // Construct the post URL
    var postUrl = "http://206.51.156.155:8080/mobileservice/0.1/workOrder/process";
    debug && console.log( "postDataToMiddleTier: Posting the following data to " + postUrl + ": " + data );
    // Do the ajax post
    $.ajax( {
        url : postUrl,
        type : "POST",
        data : data,
        contentType : "application/json; charset=utf-8",
        dataType : 'json',
        timeout : timeout * 1000,
        // Post successful
        success : function( updatedData, textStatus, jqXHR ) {
            debug && console.log( "postDataToMiddleTier: ajax request to " + postUrl + " successful" );
            if ( updatedData.success ) {
                debug && console.log( "postDataToMiddleTier: Returned JSON data indicates successful processing" );
                if ( successCallback && _.isFunction( successCallback ) ) {
                    successCallback( updatedData );
                }
            } else {
                console.error( "postDataToMiddleTier: Returned JSON data indicates unsuccessful processing" );
                if ( errorCallback && _.isFunction( errorCallback ) ) {
                    errorCallback();
                }
            }
        },
        // Post failed
        error : function( jqXHR, textStatus, errorThrown ) {
            console.error( "JSONData.postDataToMiddleTier: ajax request to " + postUrl + " failed",
                           jqXHR, textStatus, errorThrown );
            if ( errorCallback && _.isFunction( errorCallback ) ) {
                errorCallback();
            }
        }
    });
}

function loadJSONFeed( url, callbackFn ) {
    $.ajax( {
        url : url,
        dataType : 'json',
        success : callbackFn,
        error : function() {
            throw "loadJSONFeed failed";
        }
    });
}

function reassignWorkOrder( workOrder ) {
    console.log( "Reassigning work order " + workOrder.documentNumber );
    workOrder.workOrderSegments[0].webStatus = rejected;
    postDataToMiddleTier( processWorkOrderUrl, JSON.stringify( workOrder ), 45,
        function( updatedWorkOrder ) {
            console.log( "Work order " + updatedWorkOrder.workOrder.documentNumber + " reassigned" );
        }
    );
}

logon( "rob.smith@crown.com", "password", function() {
    console.log( "Logon successful" );
    loadJSONFeed( workOrderJSONFeedUrl, function( workOrderData ) {
        console.log( workOrderData.total + " work orders returned" );
        for ( var i = 0; i < workOrderData.total; i++ ) {
            // Reassign all work orders that are not rejected or completed
            if ( workOrderData.workOrders[i].workOrderSegments[0].webStatus != rejected &&
                 workOrderData.workOrders[i].workOrderSegments[0].webStatus != completed ) {
                reassignWorkOrder( workOrderData.workOrders[i] );
            }
        }
    });
});

