/**
 * localfs.js
 */

"use strict";

var fsDebug = true;

/**
 * LocalFS
 * Encapsulate local file system functionality that is provided by PhoneGap
 */
var LocalFS = function() {

    var rootDir = null;
    
    /** 
     * Subdirectory under devices local file system directory
     * where JSON files are stored
     */
    var JSON_DIR = "com.leadingedje";
    
    /**
     * Open the local file system
     */
    function init() {
        fsDebug && console.log( "LocalFS.init: Requesting local file system access" );
        
        // Handle differences between desktop browser and device browser
        if ( navigator.userAgent.match( /(Android|iPhone|iPod|iPad)/ ) ) {
            // When requesting access to the local file system, we need to give
            // PhoneGap time to load.
            var maxAttempts = 5;
            var currentAttempt = 0;
            var openInterval = null;
            openInterval = window.setInterval( function() {
                try {
                    // This returns /mnt/sdcard on device
                    window.requestFileSystem( LocalFileSystem.PERSISTENT, 0,
                                              fileSystemRequestCallback, defaultErrorCallback );
                    window.clearInterval( openInterval );
                } catch ( e ) {
                    if ( currentAttempt < maxAttempts ) {
                        fsDebug && console.log( "LocalFS: open failed, retrying" );
                        currentAttempt++;
                    } else {
                        fsDebug && console.error( "LocalFS.init: open failed and retries exhausted." );
                        logException( e );
                        window.clearInterval( openInterval );
                    }
                }
            }, 500 );
        } else {
            // This is required to support persistent storage under desktop Chrome
            // From REQUESTING STORAGE QUOTA on http://www.html5rocks.com/en/tutorials/file/filesystem/
            window.webkitStorageInfo.requestQuota(PERSISTENT, 1024*1024, function(grantedBytes) {
                window.requestFileSystem = window.requestFileSystem || window.webkitRequestFileSystem;
                window.requestFileSystem( PERSISTENT, grantedBytes, fileSystemRequestCallback, defaultErrorCallback );
            }, function( error ) {
                console.error('LocalFS.init: webkitStorageInfo.requestQuota Error', error );
            });            
        }
    }
    
    /**
     * Log exception information
     */
    function logException( exc ) {
        console.error( "LocalFS: exc is: " + exc );
        console.error( "LocalFS: exc.number is: " + (exc.number & 0xFFFF) );
        console.error( "LocalFS: exc.description is: " + exc.description );
        console.error( "LocalFS: exc.name is: " + exc.name );
        console.error( "LocalFS: exc.message is: " + exc.message );
    }
    
    /**
     * Log directory entries
     */
    function logDirEntries() {
        var dirReader = rootDir.createReader();
        dirReader.readEntries( function( entries ) {
            if ( entries.length > 0 ) {
                for ( var i = 0; i < entries.length; i++ ) {
                    fsDebug && console.log( "LocalFS.logDirEntries: Entry #" + i + ": " + entries[i].fullPath );
                }
            } else {
                fsDebug && console.log( "LocalFS.logDirEntries: " + rootDir.fullPath + " contains no entries" );
            }
        }, defaultErrorCallback );
    } 
    
    /**
     * Read a file
     * @param filename - file to read
     * @param successCallback - called when read is successful
     * @param errorCallback - called when read fails
     */
    function readFile( filename, successCallback, errorCallback ) {
        if ( filename == null || filename == undefined ) {
            throw( "LocalFS.readFile: Required argument filename is null or undefined" );
        }
        fsDebug && console.log( "LocalFS.readFile: Reading " + filename );
        
        // Use default callbacks if specific ones are not specified
        if ( successCallback === undefined || successCallback == null ) {
            successCallback = defaultReadSuccessCallback;
        }
        if ( errorCallback === undefined || errorCallback == null ) {
            errorCallback = defaultErrorCallback;
        }
        
        // Create the FileReader and read the file.
        var fileReader = null;
        rootDir.getFile( filename, null, function( fileEntry ) {
            fileEntry.file( function( file ) {
                fileReader = new FileReader();
                // Successful read callback
                fileReader.onload = successCallback;
                // Error callback
                fileReader.onerror = errorCallback;
                // Read the file as text
                fileReader.readAsText( file );
            }, errorCallback );
        }, errorCallback );
    }
    
    /**
     * Delete a file
     * @param filename - file to delete
     * @param successCallback - called when delete is successful
     * @param errorCallback - called when delete fails
     */
    function deleteFile( filename, successCallback, errorCallback ) {
        if ( filename == null || filename == undefined ) {
            throw( "LocalFS.deleteFile: Required argument filename is null or undefined" );
        }
        
        // Use default callbacks if specific ones are not specified
        if ( successCallback === undefined || successCallback == null ) {
            successCallback = function() {
                fsDebug && console.log( "LocalFS.deleteFile: " + filename + " deleted." );
            };
        }
        if ( errorCallback === undefined || errorCallback == null ) {
            errorCallback = defaultErrorCallback;
        }
        
        // Create the FileEntry and delete the file.
        rootDir.getFile( filename, null,
            function( fileEntry ) {
                fsDebug && console.log( "LocalFS.deleteFile: Deleting " + filename );
                fileEntry.remove( successCallback, errorCallback );
            },
            function() {
                console.error( "LocalFS.deleteFile: Unable to get file entry for " + filename );
            }
        );
    }

    /**
     * Create a directory if it does not already exist
     * @param dirname - directory name to create
     * @param successCallback - success callback fn
     * @param errorCallback - error callback fn
     */
    function createDirectory( dirname, successCallback, errorCallback ) {
        if ( !dirname ) {
            throw "LocalFS.createDirectory: Required parameter dirname is undefined";
        }
        
        // Use default callbacks if specific ones are not specified
        if ( successCallback === undefined || successCallback == null ) {
            successCallback = function() {
                fsDebug && console.log( "LocalFS.createDirectory: " + dirname + " successfully created" );
            };
        }
        if ( errorCallback === undefined || errorCallback == null ) {
            errorCallback = defaultErrorCallback;
        }
        rootDir.getDirectory( dirname, {create: true, exclusive: false}, successCallback, errorCallback ); 
    }
    
    var readJSONSuccessCallback;
    /**
     * Read a JSON file from the local file system.  The callback function
     * specified by successCallback will be called after a successful read.
     * The parameter in this callback will contain the JSON data
     * @param filename - JSON file name, do not include any path information
     * @param successCallback
     * @param errorCallBack
     */
    function readJSONFile( filename, successCallback, errorCallback ) {
        if ( filename == null || filename == undefined ) {
            throw( "LocalFS.readJSONFile: Required argument filename is null or undefined" );
        }
        var jsonFilePath = JSON_DIR + "/" + filename;
        fsDebug && console.log( "LocalFS.readJSONFile: Reading " + jsonFilePath );
        if ( successCallback === undefined || successCallback == null ) {
            readJSONSuccessCallback = defaultReadSuccessCallback; 
        } else {
            readJSONSuccessCallback = successCallback;
        }
        readFile( jsonFilePath, getJSONDataCallback, errorCallback );
    } 
    
    /**
     * Intermediary success callback function for readJSONFile.  This 
     * callback gets the JSON data from the read result and then, passes
     * it to the final callback specified in the readJSONFile's 
     * parameter, successCallback
     */
    function getJSONDataCallback( readResult ) {
        fsDebug && console.log( "LocalFS.getJSONDataCallback: Returning JSON data" );
        readJSONSuccessCallback( readResult.target.result );
    }

    /**
     * Write a file
     * @param filename - file to write
     * @param data - data to write to the file
     * @param successCallback - called when read is successful
     * @param errorCallback - called when read fails
     */
    function writeFile( filename, data, successCallback, errorCallback ) {
        if ( filename == null || filename == undefined || data == null || data == undefined ) {
            throw( "LocalFS.writeFile: One or more required parameters (filename, data) are null or undefined" );
        }
        fsDebug && console.log( "LocalFS.writeFile: Writing '" + data + "' to " + filename );
        
        // Use default callbacks if specific ones are not specified
        if ( successCallback === undefined || successCallback == null ) {
            successCallback = defaultWriteSuccessCallback;
        }
        if ( errorCallback === undefined || errorCallback == null ) {
            errorCallback = defaultErrorCallback;
        }

        // Create the FileWriter 
        rootDir.getFile( filename, { create : true, exclusive : false }, function( fileEntry ) {
            fileEntry.createWriter( function( fileWriter ) {
                fsDebug && console.log( "LocalFS.writeFile: FileWriter opened for " + filename );
                // Set up write callbacks
                fileWriter.onwrite = successCallback;
                fileWriter.onerror = errorCallback;
                // Write the data
                fsDebug && console.log( "LocalFS.writeFile: Writing '" + data + "' to " + fileWriter.fileName );
                try {
                    fileWriter.write( data );
                } catch ( exc ) {
                    logException( exc );
                }
            }, errorCallback );
        }, errorCallback );
    }
    
    /**
     * Request file system callback
     */
    function fileSystemRequestCallback( fileSystem ) {
        fsDebug && console.log( "LocalFS.fileSystemRequestCallback successful.  File system name = " + fileSystem.name );
        rootDir = fileSystem.root;
    }
    
    /**
     * Resolve file system callback
     */
    function fileSystemResolveCallback( fileSystem ) {
        fsDebug && console.log( "LocalFS.fileSystemResolveCallback successful.  File system name = " + fileSystem.name );
        rootDir = fileSystem;
    }
    
    /**
     * Default read file success callback
     */
    function defaultReadSuccessCallback( event ) {
        fsDebug && console.log( "LocalFS.defaultReadSuccessCallback: File read successful.  Data: " + event.target.result );
    }

    /**
     * Default write file success callback
     */
    function defaultWriteSuccessCallback( event ) {
        fsDebug && console.log( "LocalFS.defaultWriteSuccessCallback: File read successful.  Data: " + event.target.result );
    }
    
    /**
     * Default file system success callback
     */
    function defaultSuccessCallback( fileObj ) {
        fsDebug && console.log( "LocalFS.defaultSuccessCallback: File API successful" );
    }
    
    /**
     * Default file system error callback
     */
    function defaultErrorCallback( error ) {
        var errorMsg;
        switch ( error.code ) {
            case FileError.ABORT_ERR :
                errorMsg = "ABORT_ERR";
                break;
            case FileError.SECURITY_ERR :
                errorMsg = "SECURITY_ERR";
                break;
            case FileError.ENCODING_ERR :
                errorMsg = "ENCODING_ERR";
                break;
            case FileError.INVALID_MODIFICATION_ERR :
                errorMsg = "INVALID_MODIFICATION_ERR";
                break;
            case FileError.INVALID_STATE_ERR :
                errorMsg = "INVALID_STATE_ERR";
                break;
            case FileError.NOT_FOUND_ERR :
                errorMsg = "NOT_FOUND_ERR";
                break;
            case FileError.NOT_READABLE_ERR :
                errorMsg = "NOT_READABLE_ERR";
                break;
            case FileError.NO_MODIFICATION_ALLOWED_ERR :
                errorMsg = "NO_MODIFICATION_ALLOWED_ERR";
                break;
            case FileError.PATH_EXISTS_ERR :
                errorMsg = "PATH_EXISTS_ERR";
                break;
            case FileError.QUOTA_EXCEEDED_ERR :
                errorMsg = "QUOTA_EXCEEDED_ERR";
                break;
            case FileError.SECURITY_ERR :
                errorMsg = "SECURITY_ERR";
                break;
            case FileError.SYNTAX_ERR :
                errorMsg = "SYNTAX_ERR";
                break;
            case FileError.TYPE_MISMATCH_ERR :
                errorMsg = "TYPE_MISMATCH_ERR";
                break;
            default :
                errorMsg = "Unknown";
                break;
        }
        throw "LocalFS.defaultErrorCallback: File API failed.  Error = " + errorMsg;
    }
    
    return {
        'createDirectory'       : createDirectory,
        'deleteFile'            : deleteFile,
        'init'                  : init,
        'logDirEntries'         : logDirEntries,
        'readFile'              : readFile,
        'writeFile'             : writeFile
    };
}();
