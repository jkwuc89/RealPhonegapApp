var REJECTED = 200;
var COMPLETED = 700;

var responseData = prev.getResponseDataAsString();
var workOrderData = null;
try {
    workOrderData = JSON.parse( responseData );
    var numWorkOrders = workOrderData.workOrders.length;
    log.info( numWorkOrders + " work orders returned from JSON feed pull" );
    var testVarName = "";
    var testVarNumber = 1;
    for ( var index = 0; index < numWorkOrders; index++ ) {
        // Only include work orders that match the status value passed into this script
        if ( args.length === 1 ) {
            if ( workOrderData.workOrders[ index ].workOrderSegments[0].webStatus == args[0] ) {
                testVarName = "workOrder_" + ( testVarNumber );
                testVarNumber++;
                vars.put( testVarName, JSON.stringify( workOrderData.workOrders[ index ] ) );
            }
        // If a status value is not passed in, include all work orders
        // that are not rejected and are not completed
        } else if ( workOrderData.workOrders[ index ].workOrderSegments[0].webStatus != REJECTED &&
                    workOrderData.workOrders[ index ].workOrderSegments[0].webStatus != COMPLETED ) {
            testVarName = "workOrder_" + ( testVarNumber );
            testVarNumber++;
            vars.put( testVarName, JSON.stringify( workOrderData.workOrders[ index ] ) );
        }
    }
} catch( exc ) {
    prev.setResponseMessage( "Work order JSON feed returned invalid data" );
    prev.setSuccessful( false );
}
