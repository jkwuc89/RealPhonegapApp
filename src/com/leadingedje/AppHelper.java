package com.leadingedje;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;

import android.content.Context;
import android.util.Log;

public class AppHelper {
    // Root data directories
    private static final String ROOT_DEVICE_DB_DIR = "/data/data/";
    private static final String ROOT_DEVICE_JSON_DIR = "/mnt/sdcard/";
    // APK database directory
    private static final String APK_DATABASE_DIR = "database";
    // APK json directory
    private static final String APK_JSON_DIR = "json";
    // Logging tag
    private static final String LOG_TAG = "MobileAppDemo"; 
    // Our database name
    private static final String DB_NAME = "MobileAppDemo";
    // File containing information about our DB (size, patch, name)
    private static final String DATABASES_DB_FILE = "Databases.db";
    // File containing the MobileAppDemo database
    private static final String DB_SUBDIR = "file__0"; 
    private static final String DB_FILE   = DB_SUBDIR + "/0000000000000001.db";
    
    // Paths to the database files
    private String databaseDeviceDir;
    private String databasesDbDevicePath;
    private String dbDevicePath;
    private String jsonDeviceDir;
    
    // Android context
    private final Context context;

    /**
     * Constructor
     * @param context Android context
     */
    public AppHelper( Context context ) {
        Log.d( LOG_TAG, "AppHelper constructor called" );
        this.context = context;

        // Database directory on the device
        String dbDataDir = ROOT_DEVICE_DB_DIR + context.getPackageName();
        databaseDeviceDir = dbDataDir + "/app_database/";
        createDirectory( databaseDeviceDir + DB_SUBDIR );
        databasesDbDevicePath = databaseDeviceDir + DATABASES_DB_FILE;
        dbDevicePath  = databaseDeviceDir + DB_FILE;
        
        // JSON destination directory on the device
        jsonDeviceDir = ROOT_DEVICE_JSON_DIR + context.getPackageName();
        createDirectory( jsonDeviceDir );
    }

    /**
     * Does the database already exist?
     * @return true if it does, false if not
     */
    public boolean databaseExists() {
        Log.d( LOG_TAG, "Checking for existence of " + DB_NAME + " database files" );
        boolean dbExists = false;
        File dbFile = new File( databasesDbDevicePath );
        if ( dbFile.exists() ) {
            dbFile = new File( dbDevicePath );
            if ( dbFile.exists() ) {
                dbExists = true;
            }
        }
        Log.d( LOG_TAG, DB_NAME + " database exists? " + dbExists );
        return dbExists;
    }

    /**
     * Copy database files from the app's APK asset path to the device's
     * path
     * @return true if copy is successful, false if an error occured
     */
    public boolean copyDatabaseFiles() {
        Log.d( LOG_TAG, "Copying database files" );
        boolean copySuccessful = true;
        try {
            copyFile( APK_DATABASE_DIR + "/" + DATABASES_DB_FILE, databasesDbDevicePath );
            copyFile( APK_DATABASE_DIR + "/" + DB_FILE, dbDevicePath );
        } catch ( IOException exc ) {
            Log.e( LOG_TAG, "Unable to copy database files", exc );
            copySuccessful = false;
        }
        return copySuccessful;
    }
    
    /**
     * Copy the JSON files from the app's APK asset path to the device's
     * data path 
     * @return true if copy is successful, false if an error occurs
     */
    public boolean copyJSONFiles() {
        Log.d( LOG_TAG, "Copying JSON files" );
        boolean copySuccessful = true;
        try {
            String[] jsonList = context.getAssets().list( APK_JSON_DIR );
            if ( jsonList != null && jsonList.length > 0 ) {
                File jsonDestDir = new File( jsonDeviceDir );
                if ( !jsonDestDir.isDirectory() ) {
                    jsonDestDir.mkdirs();
                }
                for ( String jsonFile : jsonList ) {
                    copyFile( APK_JSON_DIR + "/" + jsonFile, jsonDeviceDir + "/" + jsonFile );
                }
            }
        } catch ( IOException exc ) {
            Log.e( LOG_TAG, "Unable to copy json files", exc );
            copySuccessful = false;
        }
        return copySuccessful;
    }
    
    /**
     * Create the directory recursively if it does not exist
     * @param dirName
     */
    private void createDirectory( String dirName ) {
        File destDir = new File( dirName );
        if ( !destDir.isDirectory() ) {
            destDir.mkdirs();
        }
    }
    
    /**
     * Copy a file from the application's APK to the specified destination
     * @param source - path for source file inside the APK
     * @param destination - destination path
     * @throws IOException
     */
    private void copyFile( String source, String destination ) throws IOException {
        Log.d( LOG_TAG, "Copying " + source + " to " + destination );
        InputStream sourceStream = context.getAssets().open( source );
        OutputStream destStream  = new FileOutputStream( destination );
        byte[] mBuffer = new byte[1024];
        int len = 0;
        while ( ( len = sourceStream.read( mBuffer ) ) > 0 ) {
            destStream.write( mBuffer, 0, len );
        }
        destStream.flush();
        destStream.close();
        sourceStream.close();
        Log.d( LOG_TAG, "Copy successful" );
    }
}
