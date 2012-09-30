/**
 * util.js
 */

"use strict";

/**
 * Util
 */
var Util = function() {
    
    /**
     * Loop over a list that requires asynchronous processing
     * iterator function must call resume() to iterate to the next item 
     * in the list.
     * @param list - Item list
     * @param iterator - Function called for each item in the list
     */
    function asyncEach( list, iterator ) {
        debug && console.log( "Util.asyncEach: Iterating over " + list.length + " items" );
        
        var n = list.length,
            i = -1;

        var iterate = function() {
            debug && console.log( "Util.asyncEach: Iterating to next item in the list" );
            i += 1;
            if ( i === n )
                return;
            iterator( list[i], resume );
        };

        var resume = function() {
            debug && console.log( "Util.asyncEach: Resuming asynchronous loop" );
            setTimeout( iterate, 1 );
        };
        resume();
    };
    
    // PSRT integration directories
    var PSRT_REQUEST_DIR = ".WOrequests";

    /**
     * Quickly clone an object
     */
    function clone( obj ) {
        var target = {};
        for ( var i in obj ) {
            if ( obj.hasOwnProperty( i ) ) {
                target[i] = obj[i];
            }
        }
        return target;
    }

    /**
     * Convert 12 hour time in HH:MM AM or PM to an ISO date time stamp that includes today's date.
     * 
     * @param time
     */
    function convert12HourTimeToISODateTimeStamp( time ) {
        if ( !time ) {
            throw "Util.convert12HourTimeToISODateTimeStamp: Required parameter time is undefined";
        }
        debug && console.log( "Util.convert12HourTimeToISODateTimeStamp: Converting '" + time + "'" );
        var dateTimeStamp = new Date();
        var timeToConvert = new Date( "01/01/2000 " + time );
        dateTimeStamp.setHours( timeToConvert.getHours() );
        dateTimeStamp.setMinutes( timeToConvert.getMinutes() );
        dateTimeStamp.setSeconds( 0 );
        dateTimeStamp.setMilliseconds( 0 );
        var isoDateTimeStamp = dateTimeStamp.toISOString();
        debug && console.log( "Util.convert12HourTimeToISODateTimeStamp: Converted date/time stamp = '" + isoDateTimeStamp + "'" );
        return isoDateTimeStamp;
    }

    /**
     * Convert YYYY-MM-DD date to an ISO date time stamp
     * 
     * @param date
     */
    function convertDateToISODateTimeStamp( date ) {
        if ( !date ) {
            throw "Util.convertDateToISODateTimeStamp: Required parameter date is undefined";
        }
        var pattern = new RegExp( "(\\d{4})-(\\d{2})-(\\d{2})" );
        var dateParts = pattern.exec( date );
        var isoDateTimeStamp = null;
        if ( dateParts && dateParts.length === 4 ) {
            debug && console.log( "Util.convertDateToISODateTimeStamp: Converting '" + date + "'" );
            var dateTimeStamp = new Date( parseInt( dateParts[1] ), parseInt( dateParts[2], 10 ) - 1, parseInt( dateParts[3], 10 ), 0, 0,
                                          0, 0 );
            isoDateTimeStamp = dateTimeStamp.toISOString();
            debug && console.log( "Util.convert12HourTimeToISODateTimeStamp: Converted date/time stamp = '" + isoDateTimeStamp + "'" );
        } else {
            throw "Util.convertDateToISODateTimeStamp: '" + date + "' does not match expected pattern: YYYY-MM-DD";
        }
        return isoDateTimeStamp;
    }

    /**
     * Get an object from an array using the specified key and value
     * 
     * @param array -
     *            Array to search
     * @param key -
     *            Key to search for
     * @param value -
     *            Value to search for
     */
    function getObjectFromArray( array, key, value ) {
        // Invalid parameter immediately returns -1 indicating not found
        if ( !array || !array.length || array.length < 1 || !key || !value ) {
            return null;
        }

        for ( var i = 0; i < array.length; i++ ) {
            if ( !_.isUndefined( array[i][key] ) ) {
                if ( array[i][key] === value ) {
                    return array[i];
                }
            } else {
                // Missing key throws an error
                throw "Util.getObjectFromArray: Array does not contain key: " + key;
            }
        }
        throw "Util.getObjectFromArray: Array does not contain object where '" + key + "'='" + value + "'";
    }

    /**
     * Get a unique ID. Currently, this uses Date.getTime() which returns the number of milliseconds since January 1, 1970
     */
    function getUniqueId() {
        var id = new Date().getTime();
        return id;
    }
    
    /**
     * Return a string containing a string separated list of work
     * order document numbers
     * @param workOrders - work order array
     * @returns String containing work order document numbers
     */
    function getWorkOrderDocumentNumbersAsString( workOrders ) {
        if ( !workOrders || !_.isArray( workOrders ) || workOrders.length === 0 ) {
            throw "Util.getWorkOrderDocumentNumbersAsString: Required parameter workOrders is missing or is invalid";
        }
        
        var workOrderNumbers = "";
        _.each( workOrders, function( workOrderInList ) {
            workOrderNumbers += ( workOrderInList.documentNumber + " " );
        });
        workOrderNumbers = $.trim( workOrderNumbers );
        
        return workOrderNumbers;
    }

    /**
     * Get the current time in the ISO format that conforms to the DIS JSON model
     */
    function getISOCurrentTime() {
        return new Date().toISOString();
    }

    /**
     * Is the mobile app online?
     */
    function isOnline() {
        var online = false;
        if ( (window.location.pathname).indexOf( "SpecRunner.html" ) != -1 ) {
            debug && console.log( "Util:isOnline: Running tests" );
        } else if ( navigator.network && navigator.network.connection ) {
            debug && console.log( "Util:isOnline: Using navigator.network.connection to determine if app is online" );
            var networkState = navigator.network.connection.type;
            var states = {};
            states[Connection.UNKNOWN] = "Unknown connection";
            states[Connection.ETHERNET] = "Ethernet connection";
            states[Connection.WIFI] = "WiFi connection";
            states[Connection.CELL_2G] = "Cell 2G connection";
            states[Connection.CELL_3G] = "Cell 3G connection";
            states[Connection.CELL_4G] = "Cell 4G connection";
            states[Connection.NONE] = "No network connection";
            debug && console.log( "Util:isOnline: Connection type: " + states[networkState] );
            online = ( networkState != Connection.NONE && networkState != Connection.UNKNOWN && networkState != Connection.CELL_2G );
        } else {
            // Use the onlineStatus local storage item as a fallback mechanism on the tablet
            // to determine if the app is online
            var onlineStatus = window.localStorage.getItem( "onlineStatus" );
            switch ( onlineStatus ) {
                case "online" :
                    debug && console.log( "Util:isOnline: onlineStatus = online" );
                    online = true;
                    break;
                case "offline" :
                    debug && console.log( "Util:isOnline: onlineStatus = offline" );
                    online = false;
                    break;
                default:
                    debug && console.log( "Util:isOnline: Using navigator.onLine to determine if app is online" );
                    online = navigator.onLine;
                    break;
            }
        }
        debug && console.log( "Util:isOnline: online = " + online );
        return online;
    }
    
    /**
     * Is the mobile app running on Chrome desktop?
     */
    function isRunningOnChromeDesktop() {
        return ( !navigator.userAgent.match( /(Android|iPhone|iPod|iPad)/ ) );
    }

    /**
     * Is the specified date/time stamp a valid ISO formatted date/time stamp?
     * 
     * @param dateTimeStamp
     * @returns true or false
     */
    function isValidISODateTimeStamp( dateTimeStamp ) {
        var testPattern = new RegExp( "(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2}):(\\d{2})(.(\\d{2,3}))*Z" );
        return testPattern.test( dateTimeStamp );
    }

    /**
     * Remove the seconds and the milliseconds from the specified date/time stamp
     * 
     * @param dateTimeStamp -
     *            ISO formatted date/time stamp
     * @returns Date/time stamp with seconds and milliseconds set to 0
     */
    function setSecondsAndMillisecondsToZero( dateTimeStamp ) {
        if ( !dateTimeStamp ) {
            throw "Util.setSecondsAndMillisecondsToZero: Required parameter dateTimeStamp is undefined";
        }
        if ( !isValidISODateTimeStamp( dateTimeStamp ) ) {
            throw "Util.setSecondsAndMillisecondsToZero: '" + dateTimeStamp + "' is not an ISO formated date/time stamp";
        }
        var dateTime = new Date( dateTimeStamp );
        dateTime.setSeconds( 0 );
        dateTime.setMilliseconds( 0 );
        return dateTime.toISOString();
    }

    /** 
     * Start the PSRT application. This must handle the TaskBar, Customer Equipment, and Manage WO contexts
     * 	@param equipmentSerialNumber - optional
     *  @param psrtModel - optional 
     * 	@param customerName - optional 
     *  @param workOrderDocumentNumber - optional
     */
    function startPSRT( serialNumber, psrtModel, customerName, workOrderDocumentNumber ) {
    	debug && console.log( "Util.startPSRT: Attempting PSRT launch" );
        
        // If the workOrder parameter was sent, create a request
        if( workOrderDocumentNumber ) {
            // Create WO request file for PSRT.  This allows PSRT to initialize it's search filter.
            var woRequestObj = {};
            if ( psrtModel ) {
                woRequestObj.model = psrtModel;
            } else {
                woRequestObj.model = "";
            }
            
            if( customerName ) {
            	woRequestObj.customer = customerName;
            } else {
            	woRequestObj.customer = "";
            }
            	            
            woRequestObj.serialNumber = serialNumber;
            
            var woRequestFilename = "";
        	if( workOrderDocumentNumber ) {
        		woRequestFilename = PSRT_REQUEST_DIR + "/" + workOrderDocumentNumber + ".json";
        	}
            	
            var woRequestData = JSON.stringify( woRequestObj );
            debug && console.log( "Util.startPSRT: Writing " + woRequestData + " to " + woRequestFilename );
            
            // Create the WO request directory
            LocalFS.createDirectory( PSRT_REQUEST_DIR, function() {
                // Write the WO request file
                LocalFS.writeFile( woRequestFilename, woRequestData,
                    // Write success results in attempt to start PSRT
                    function() {
                        debug && console.log( "Util.startPSRT: WO request file created. Starting PSRT" );
                        if ( window.Firefox ) {
                            debug && console.log( "Util.startPSRT: Firefox Phonegap plugin available" );
                            window.Firefox( { url : JSONData.getConfig().psrtUrl },
                                function() {
                                    // Write flag to local storage to indicate that PSRT was started
                                    window.localStorage.setItem( "psrtStarted", Util.getISOCurrentTime() ); 
                                    debug && console.log( "Util.startPSRT: Firefox started" );
                                },
                                function() {
                                    console.error( "Util.startPSRT: Attempt to start Firefox failed" );
                                }
                            );
                        } else {
                            console.error( "Util.startPSRT: Firefox plugin is not available" ); 
                        }
                    },
                    // Failure to write the PSRT WO request file results in an alert
                    function( error ) {
                        alert( Localization.getText( "psrtWORequestFileWriteError") );
                    }
                );
            });
        // Normal launch with no equipment criteria
        } else {
        	debug && console.log( "Util.startPSRT: Starting PSRT with no equipment criteria." );
            if ( window.Firefox ) {
                debug && console.log( "Util.startPSRT: Firefox Phonegap plugin available" );
                window.Firefox( { url : JSONData.getConfig().psrtUrl },
                    function() {
                        // Write flag to local storage to indicate that PSRT was started
                        window.localStorage.setItem( "psrtStarted", Util.getISOCurrentTime() ); 
                        debug && console.log( "Util.startPSRT: Firefox started" );
                    },
                    function() {
                        console.error( "Util.startPSRT: Attempt to start Firefox failed" );
                    }
                );
            } else {
                console.error( "Util.startPSRT: Firefox plugin is not available" ); 
            }
        }
    }
    
    /**
     * Take a picture using the tablet's camera.
     * 
     * @param pictureCallback -
     *            This function is called after sucessfully taking a picture. The base64 encoded image string is passed to this
     *            callback.
     * @returns imageData - base64 encoded image data string
     */
    function takePicture( pictureCallback ) {
        if ( !pictureCallback || !_.isFunction( pictureCallback ) ) {
            throw "Util.takePicture: Required parameter pictureCallback is undefined or not a function";
        }
        if ( navigator.camera && _.isFunction( navigator.camera.getPicture ) ) {
            debug && console.log( "Util.takePicture: Taking picture" );
            navigator.camera.getPicture(
            // Success callback
            function( imageData ) {
                debug && console.log( "Util.takePicture: Successful.  Start of image data: " + imageData.substr( 0, 50 ) );
                pictureCallback( imageData );
            },
            // Failed callback
            function( message ) {
                debug && console.log( "Util.takePicture: Failed.  Message: " + message );
                if ( message.indexOf( "cancelled" ) === -1 ) {
                    var alertMsg = Localization.getText( "takePictureFailed" ) + " " + message;
                    alert( alertMsg );
                }
            },
            // getPicture options
            {
                allowEdit : false,
                destinationType : Camera.DestinationType.DATA_URL,
                encodingType : Camera.EncodingType.PNG,
                quality : 50,
                saveToPhotoAlbum : true
            } );
        } else {
            alert( Localization.getText( "cameraNotAvailable" ) );
        }
    }

    return {
        'asyncEach'                           : asyncEach,
        'clone'                               : clone,
        'convert12HourTimeToISODateTimeStamp' : convert12HourTimeToISODateTimeStamp,
        'convertDateToISODateTimeStamp'       : convertDateToISODateTimeStamp,
        'getISOCurrentTime'                   : getISOCurrentTime,
        'getObjectFromArray'                  : getObjectFromArray,
        'getUniqueId'                         : getUniqueId,
        'getWorkOrderDocumentNumbersAsString' : getWorkOrderDocumentNumbersAsString,
        'isOnline'                            : isOnline,
        'isRunningOnChromeDesktop'            : isRunningOnChromeDesktop,
        'isValidISODateTimeStamp'             : isValidISODateTimeStamp,
        'setSecondsAndMillisecondsToZero'     : setSecondsAndMillisecondsToZero,
        'startPSRT'                           : startPSRT,
        'takePicture'                         : takePicture
    };

}();
