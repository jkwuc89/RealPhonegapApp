var remoteDebug = true;
if ( remoteDebug && navigator.userAgent.match( /(Android|iPhone|iPod|iPad)/ ) ) {
    debug && console.log( "RemoteDebug: Enabling remote debug via Weinre" );
    $.getScript("http://192.168.1.73:9000/target/target-script-min.js#anonymous");
}
