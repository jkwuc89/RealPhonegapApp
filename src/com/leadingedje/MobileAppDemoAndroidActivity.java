package com.leadingedje;

import org.apache.cordova.DroidGap;

import android.os.Bundle;
import android.util.Log;
import android.webkit.WebSettings.RenderPriority;

public class MobileAppDemoAndroidActivity extends DroidGap {
    
    // Logging tag
    private static final String TAG = "MobileAppDemo";
    // PhoneGap URL for this app
    private static final String PHONEGAP_URL = "file:///android_asset/www/index.html"; 
    
    /** Called when the activity is first created. */
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Use the app helper to copy a pre-populated database
        AppHelper appHelper = new AppHelper( getApplicationContext() );
        if ( !appHelper.databaseExists() ) {
            appHelper.copyDatabaseFiles();
        }
        
        Log.d( TAG, "Opening PhoneGap URL: " + PHONEGAP_URL );
        super.loadUrl( PHONEGAP_URL );
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