package com.leadingedje;

import android.util.Log;
import org.apache.cordova.api.CallbackContext;
import org.apache.cordova.api.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * LoadURL
 */
public class LoadURL extends CordovaPlugin {

    // Logging tag
    private static final String LOG_TAG = "RealPhonegapApp"; 

    /**
     * Constructor
     */
    public LoadURL() {
        Log.d( LOG_TAG, "Constructing LoadURL PhoneGap plugin" );
    }
    
    /**
     * When this plug in is executed, it uses the webView to load the specified URL
     * @param action - Plugin action, we are only interested in start
     * @param args - JSON data containing arguments for this plugin, must contain url property
     */
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
    // public PluginResult execute( String action, JSONArray args, String callbackId ) {
        try {
            if ( action.equals( "start" ) ) {

                // Get the desired URL from the args passed in
                JSONObject argObj = null;
                String url = "";
                if ( args.length() == 1 ) {
                    argObj = args.getJSONObject( 0 );
                    url = argObj.has( "url" ) ? argObj.getString( "url" ) : null;
                }
                if ( url == null || url.equalsIgnoreCase( "" ) ) {
                    Log.e( LOG_TAG, "url parameter is missing" );
                    return false;
                }

                // Attempt to load the specified URL into the webView
                String completeUrl = "file:///android_asset/www/" + url;
                Log.d( LOG_TAG, "Loading " + completeUrl + " into webview" );
                webView.loadUrl( completeUrl ); 
                
                // Return OK as the plugin result
                return true;

            } else {
                return false;
            }
        } catch ( JSONException e ) {
            e.printStackTrace();
            return false;
        }
    }
}
