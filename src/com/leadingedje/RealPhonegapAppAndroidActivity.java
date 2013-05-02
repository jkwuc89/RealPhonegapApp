package com.leadingedje;

import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.webkit.WebSettings.RenderPriority;
import org.apache.cordova.DroidGap;

import java.io.File;

public class RealPhonegapAppAndroidActivity extends DroidGap {
    
    // Logging tag
    public static final String TAG = "RealPhonegapApp";
    // PhoneGap URL for this app
    private static final String PHONEGAP_URL = "file:///android_asset/www/login.html"; 
    
    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        Log.d( TAG, "RealPhonegapAppAndroidActivity.onCreate: Activity is being created" );

        Context appContext = getApplicationContext();

        super.onCreate(savedInstanceState);
        
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
        
        Log.d( TAG, "RealPhonegapAppAndroidActivity.onCreate: Opening PhoneGap URL: " + PHONEGAP_URL );
        super.loadUrl( PHONEGAP_URL );
    }

    /**
     * Called when the activity is becoming visible to the user.
     */
    @Override
    protected void onStart() {
        Log.d( TAG, "RealPhonegapAppAndroidActivity.onStart: Mobile app is now visible to the user" );
        super.onStart();
    }

    /**
     * Called when the activity is no longer visible to the user,
     * because another activity has been resumed and is covering this one.
     */
    @Override
    protected void onStop() {
        Log.d( TAG, "RealPhonegapAppAndroidActivity.onStop: Mobile app is being stopped and is no longer visible" );
        super.onStop();
    }

    /**
     * Called when the system is about to start resuming a previous activity. This is
     * typically used to commit unsaved changes to persistent data, stop animations
     * and other things that may be consuming CPU, etc. Implementations of this method must be
     * very quick because the next activity will not be resumed until this method returns.
     */
    @Override
    protected void onPause() {
        Log.d( TAG, "RealPhonegapAppAndroidActivity.onPause: Mobile app is being paused" );
        super.onPause();
    }

    /**
     * Called when our activity is being destroyed by the system
     */
    @Override
    public void onDestroy() {
        Log.d( TAG, "RealPhonegapAppAndroidActivity.onDestroy: Mobile app is being destroyed" );
        super.onDestroy();
    }

    /**
     * Per the link below, overriding init() fixes the issue with the 9 key not
     * be accepted as input.
     * http://stackoverflow.com/questions/9781657/phonegap-for-android-does-not-accept-the-9-key
     * @see org.apache.cordova.DroidGap#init()
     */
    @Override
    public void init() {
        super.init();  
        // Setting the load URL timeout value to a very large number to fix
        // the crash caused by a timeout that occurs when the switch between manage work order
        // pages is canceled due to unsaved changes
        super.setIntegerProperty( "loadUrlTimeoutValue", 600000 );

        // Set the web view's render priority
        this.appView.getSettings().setRenderPriority( RenderPriority.HIGH );
    }
}