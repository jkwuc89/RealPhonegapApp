package com.leadingedje;

import android.content.ComponentName;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;
import org.apache.cordova.api.CallbackContext;
import org.apache.cordova.api.CordovaPlugin;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Android Phonegap plugin that starts Firefox and loads the specified URL
 */
public class Firefox extends CordovaPlugin {

    // Logging tag
    private static final String LOG_TAG = "RealPhonegapApp"; 
    
    /**
     * Constructor
     */
    public Firefox() {
        Log.d( LOG_TAG, "Constructing Firefox PhoneGap plugin" );
    }

    /**
     * Executes the request and returns PluginResult.
     * 
     * @param action
     *            The action to execute.
     * @param args
     *            JSONArray of arguments for the plugin.
     * @param callbackId
     *            The callback id used when calling back into JavaScript.
     * @return A PluginResult object with a status and message.
     */
    @Override
    public boolean execute(String action, JSONArray args, CallbackContext callbackContext) {
    // public PluginResult execute(String action, JSONArray args, String callbackId) {
        try {
            if ( action.equals( "start" ) ) {
                
                // Get the desired URL from the args passed in
                JSONObject argObj = null; 
                String url = "http://leadingedje.com";
                if ( args.length() == 1 ) {
                    argObj = args.getJSONObject(0);
                    url = argObj.has("url") ? argObj.getString("url") : null;
                } 
                
                // Attempt to start Firefox
                Log.d( LOG_TAG, "Attempting to start Firefox" );
                Intent intent = new Intent(Intent.ACTION_MAIN, null);
                intent.addCategory(Intent.CATEGORY_LAUNCHER);
                intent.setComponent(new ComponentName("org.mozilla.firefox", "org.mozilla.firefox.App"));
                intent.setAction("org.mozilla.gecko.BOOKMARK");
                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                intent.putExtra("args", "--url=" + url);
                intent.setData(Uri.parse(url));

                cordova.getActivity().startActivity( intent );
                // this.ctx.startActivity(intent);
                return true;
                
            } else {
                return false;
            }
        } catch (JSONException e) {
            e.printStackTrace();
            return false;
        }
    }
}
