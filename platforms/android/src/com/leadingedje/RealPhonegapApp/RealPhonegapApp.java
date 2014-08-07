package com.leadingedje.RealPhonegapApp;

import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import org.apache.cordova.*;

import java.io.File;

public class RealPhonegapApp extends CordovaActivity {
    // Logging tag
    public static final String TAG = "RealPhonegapApp";

    @Override
    public void onCreate( Bundle savedInstanceState ) {
        Log.d( TAG, "RealPhonegapApp.onCreate: Activity is being created" );

        super.onCreate(savedInstanceState);
        super.init();

        Context appContext = getApplicationContext();

        // Use the app helper to copy a pre-populated database
        AppHelper appHelper = new AppHelper( appContext );
        if ( !appHelper.databaseExists() ) {
            // This only occurs when the app is started for the first time
            appHelper.copyDatabaseFiles();
        }

        File appDir = new File( appContext.getApplicationInfo().dataDir );
        String[] appDirList = appDir.list();
        Log.d( TAG, "RealPhonegapAppAndroidActivity.onCreate: Contents of " + appDir.getAbsolutePath() );
        for ( String dirEntry : appDirList ) {
            Log.d( TAG, "RealPhonegapAppAndroidActivity.onCreate: " + dirEntry );
        }

        // Output device info to the log
        StringBuilder versionInfo = new StringBuilder();
        versionInfo.append( "Mfg: '" );
        versionInfo.append( Build.MANUFACTURER );
        versionInfo.append( "' Model: '" );
        versionInfo.append( Build.MODEL );
        versionInfo.append( "' Serial: '" );
        versionInfo.append( Build.SERIAL );
        versionInfo.append( "' Brand: '" );
        versionInfo.append( Build.BRAND );
        versionInfo.append( "'" );
        Log.d(TAG, "RealPhonegapAppAndroidActivity.onCreate: Device info: " + versionInfo.toString());

        // Set by <content src="index.html" /> in config.xml
        super.loadUrl( Config.getStartUrl() );
    }
}

