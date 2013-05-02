var responseData = prev.getResponseDataAsString();
var pmsDueData = null;
try {
    pmsDueData = JSON.parse( responseData );
    var numPMsDue = pmsDueData.pmSchedules.length;
    log.info( numPMsDue + " PM schedules returned from JSON feed pull" );
    var testVarName = "";
    var testVarNumber = 1;
    for ( var index = 0; index < numPMsDue; index++ ) {
        // Store each PM into a test var
        testVarName = "pmSchedule_" + ( testVarNumber );
        testVarNumber++;
        // log.info( "Putting work order " + pmsDueData.pmSchedules[index].documentNumber + " into test var " + testVarName );
        vars.put( testVarName, JSON.stringify( pmsDueData.pmSchedules[ index ] ) );
    }
    // Store number of PMs into a test var
    vars.put( "numPMSchedules", numPMsDue );
} catch( exc ) {
    prev.setResponseMessage( "PM schedule JSON feed returned invalid data" );
    prev.setSuccessful( false );
}
