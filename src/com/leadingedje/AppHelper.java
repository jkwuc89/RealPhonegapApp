package com.leadingedje;

import android.content.Context;
import android.util.Log;

import java.io.*;

public class AppHelper {
    // APK database directory
    private static final String APK_DATABASE_DIR = "database";
    // Our database name
    private static final String DB_NAME = "RealPhonegapApp";
    // File containing information about our DB (size, patch, name)
    private static final String DATABASES_DB_FILE = "Databases.db";
    // File containing the database
    private static final String DB_SUBDIR = "file__0"; 
    private static final String DB_FILE   = DB_SUBDIR + "/0000000000000001.db";

    private String databasesDbDevicePath;
    private String mobileappDbDevicePath;
    private String jsonDeviceDir;
    
    // Android context
    private final Context context;

    /**
     * Constructor
     * @param context Android context
     */
    public AppHelper( Context context ) {
        Log.d( RealPhonegapAppAndroidActivity.TAG, "AppHelper constructor called" );
        this.context = context;

        // Database directory on the device
        String dbDataDir = context.getApplicationInfo().dataDir;
        String databaseDeviceDir = dbDataDir + "/app_database/";
        FileUtil.createDirectory( databaseDeviceDir + DB_SUBDIR );
        databasesDbDevicePath = databaseDeviceDir + DATABASES_DB_FILE;
        mobileappDbDevicePath  = databaseDeviceDir + DB_FILE;
    }

    /**
     * Does the database already exist?
     * @return true if it does, false if not
     */
    public boolean databaseExists() {
        Log.d( RealPhonegapAppAndroidActivity.TAG, "AppHelper.databaseExists: Checking for existence of " + DB_NAME + " database files" );
        boolean dbExists = false;
        File dbFile = new File( databasesDbDevicePath );
        if ( dbFile.exists() ) {
            dbFile = new File( mobileappDbDevicePath );
            if ( dbFile.exists() ) {
                dbExists = true;
            }
        }
        Log.d( RealPhonegapAppAndroidActivity.TAG, "AppHelper.databaseExists: " + DB_NAME + " database exists? " + dbExists );
        return dbExists;
    }

    /**
     * Copy database files from the app's APK asset path to the device's
     * path
     * @return true if copy is successful, false if an error occured
     */
    public boolean copyDatabaseFiles() {
        Log.d( RealPhonegapAppAndroidActivity.TAG, "AppHelper.copyDatabaseFiles: Copying database files" );
        boolean copySuccessful = true;
        try {
            copyAssetFile( APK_DATABASE_DIR + "/" + DATABASES_DB_FILE, databasesDbDevicePath );
            copyAssetFile( APK_DATABASE_DIR + "/" + DB_FILE, mobileappDbDevicePath );
        } catch ( IOException exc ) {
            Log.e( RealPhonegapAppAndroidActivity.TAG, "AppHelper.copyDatabaseFiles: Unable to copy database files", exc );
            copySuccessful = false;
        }
        return copySuccessful;
    }
    
    /**
     * Copy a file from the application's APK to the specified destination
     * @param source - path for source file inside the APK
     * @param destination - destination path
     * @throws IOException
     */
    private void copyAssetFile( String source, String destination ) throws IOException {
        Log.d( RealPhonegapAppAndroidActivity.TAG, "AppHelper.copyAssetFile: Copying " + source + " to " + destination );
        InputStream sourceStream = context.getAssets().open( source );
        OutputStream destStream  = new FileOutputStream( destination );
        FileUtil.copyFile( sourceStream, destStream );
        Log.d( RealPhonegapAppAndroidActivity.TAG, "AppHelper.copyAssetFile: Copy successful" );
    }
}
