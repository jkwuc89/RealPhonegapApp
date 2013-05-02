package com.leadingedje;

import android.content.Context;
import android.content.res.AssetManager;
import android.os.Environment;
import android.util.Log;

import java.io.*;

/**
 * FileUtil - File utilities
 * User: jkwuc89
 * Date: 3/14/13
 * Time: 10:33 AM
 */
public class FileUtil {
    /**
     * Copy a file.  Both streams are closed when the copy is complete.
     * @param in  - Stream for input file
     * @param out - Stream for output file
     * @throws IOException
     */
    public static void copyFile( InputStream in, OutputStream out ) throws IOException {
        Log.d( RealPhonegapAppAndroidActivity.TAG, "FileUtil.copyFile: Copying file" );
        byte[] buffer = new byte[1024];
        int read;
        while ( ( read = in.read( buffer ) ) != -1 ) {
            out.write( buffer, 0, read );
        }
        out.flush();
        out.close();
        in.close();
    }

    /**
     * Create the directory recursively if it does not exist
     *
     * @param dirName - String containing directory to create
     */
    public static void createDirectory( String dirName ) {
        File destDir = new File( dirName );
        if ( !destDir.isDirectory() ) {
            Log.d( RealPhonegapAppAndroidActivity.TAG, "FileUtil.createDirectory: Creating " + destDir );
            destDir.mkdirs();
        }
    }
}
