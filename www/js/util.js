/**
 * util.js
 */

"use strict";

/**
 * Util
 */
var Util = function() {

    // Local storage flag to indicate that PSRT was started
    var LS_PSRT_STARTED = "psrtStarted";

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
     * Do the start and end times specified cross midnight
     * @param startTime - ISO formatted start time
     * @param endTime - ISO formatted end time
     */
    function doStartAndEndTimesCrossMidnight( startTime, endTime ) {
        var crossesMidnight = false;
        if ( _.isNull( startTime ) || _.isUndefined( startTime ) ||
             _.isNull( endTime ) || _.isUndefined( endTime ) ) {
            throw "Util.doStartAndEndTimesCrossMidnight: One or more required parameters (startTime, endTime) are null or undefined";
        }
        var startDate = new Date( startTime );
        var endDate   = new Date( endTime );
        debug && console.log( "Util.doStartAndEndTimesCrossMidnight: startDate = " + startDate + " endDate = " + endDate );
        startDate.setHours( 0, 0, 0, 0 );
        endDate.setHours( 0, 0, 0, 0 );
        debug && console.log( "Util.doStartAndEndTimesCrossMidnight: startDate = " + startDate + " endDate = " + endDate );
        if ( ( endDate.getTime() - startDate.getTime() ) >= ( 1000 * 60 * 60 * 24 ) ) {
            debug && console.log( "Util.doStartAndEndTimesCrossMidnight: crossesMidnight = " + crossesMidnight );
            crossesMidnight = true;
        }
        return crossesMidnight;
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
     * Get a unique ID using the JS random number generator combined
     * with the current time in ms.
     */
    function getUniqueId() {
        return ( Math.floor( Math.random() * new Date().getTime() ) );
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
        var sortedWorkOrders = _.sortBy( workOrders, function( workOrderInList ) {
            return workOrderInList.documentNumber;
        });
        _.each( sortedWorkOrders, function( workOrderInList ) {
            workOrderNumbers += ( workOrderInList.documentNumber + " " );
        });
        workOrderNumbers = $.trim( workOrderNumbers );

        return workOrderNumbers;
    }

    /**
     * Get the current date.  This method returns a Date object with
     * the time components zeroed out.
     * @returns Date
     */
    function getCurrentDate() {
        var now = new Date();
        now.setHours( 0, 0, 0, 0 );
        return now;
    }

    /**
     * Get the suffix number from the specified ID
     * @param id
     * @return String containing the suffix number or "" if the ID does not have a suffix
     */
    function getIdSuffixNumber( id ) {
        var suffix = "";
        var suffixPos = id.toString().indexOf( "-" );
        if ( suffixPos > 0 ) {
            suffix = id.substring( suffixPos + 1 );
        }
        return suffix;
    }

    /**
     * Get the current time in the ISO format that conforms to the DIS JSON model
     */
    function getISOCurrentTime() {
        return new Date().toISOString();
    }

    /**
     * Is the mobile app online?
     * @param skipReadOnlyCheck If true, the config read only check is skipped.
     */
    function isOnline( skipReadOnlyCheck ) {
        var config = Config.getConfig();
        var online = false;
        var networkState;
        var states = {};

        // Read only mode returns false unless the current page is the login page
        if ( ( _.isUndefined( skipReadOnlyCheck ) || !skipReadOnlyCheck ) &&
             !_.isNull( config ) && config.readOnlyMode ) {
            debug && console.log( "Util.isOnline: Running in read only mode" );
        } else if ( Util.isRunningOnChromeDesktop() ) {
            debug && console.log( "Util.isOnline: Running on Chrome Desktop, using navigator.onLine" );
            online = navigator.onLine;
        } else if ( navigator.connection && ( typeof Connection !== "undefined" ) && !_.isNull( Connection ) ) {
            debug && console.log( "Util.isOnline: Using PhoneGap's navigator.connection to determine if app is online" );
            networkState = navigator.connection.type;
            states[Connection.UNKNOWN] = "Unknown connection";
            states[Connection.ETHERNET] = "Ethernet connection";
            states[Connection.WIFI] = "WiFi connection";
            states[Connection.CELL_2G] = "Cell 2G connection";
            states[Connection.CELL_3G] = "Cell 3G connection";
            states[Connection.CELL_4G] = "Cell 4G connection";
            states[Connection.NONE] = "No network connection";
            debug && console.log( "Util.isOnline: Connection type: " + states[networkState] );
            online = ( networkState != Connection.NONE && networkState != Connection.UNKNOWN && networkState != Connection.CELL_2G );
            // Set the online status flag to reflect latest check
            if ( online ) {
                window.localStorage.setItem( "onlineStatus", "online" );
            } else {
                window.localStorage.setItem( "onlineStatus", "offline" );
            }
        } else {
            console.warn( "Util.isOnline: PhoneGap's navigator.network not available.  Falling back to onlineStatus local storage value." );
            var onlineStatus = window.localStorage.getItem( "onlineStatus" );
            switch ( onlineStatus ) {
                case "online" :
                    debug && console.log( "Util.isOnline: onlineStatus local storage flag = online" );
                    online = true;
                    break;
                case "offline" :
                    debug && console.log( "Util.isOnline: onlineStatus local storage flag = offline" );
                    online = false;
                    break;
                default:
                    debug && console.log( "Util.isOnline: Using navigator.onLine to determine if app is online" );
                    online = navigator.onLine;
                    break;
            }
        }
        debug && console.log( "Util.isOnline: online = " + online );
        return online;
    }

    /**
     * Is the mobile app running on Chrome desktop?
     */
    function isRunningOnChromeDesktop() {
        return ( !navigator.userAgent.match( /(Android|iPhone|iPod|iPad)/ ) );
    }

    /**
     * Is the mobile app running on Android?
     */
    function isRunningOnAndroid() {
        return ( navigator.userAgent.match( /(Android)/ ) );
    }

    /**
     * Is the specified date/time stamp a valid ISO formatted date/time stamp?
     * @param dateTimeStamp
     * @returns true or false
     */
    function isValidISODateTimeStamp( dateTimeStamp ) {
        var testPattern = new RegExp( "(\\d{4})-(\\d{2})-(\\d{2})T(\\d{2}):(\\d{2}):(\\d{2})(.(\\d{2,3}))*Z" );
        return testPattern.test( dateTimeStamp );
    }

    /**
     * Remove the -# suffix from and ID
     * @param id
     * @return String with suffix removed
     */
    function removeSuffixFromId( id ) {
        var trimmedId = null;
        var suffixPos = id.toString().indexOf( "-" );
        if ( suffixPos > 0 ) {
            trimmedId = id.substr( 0, suffixPos );
        } else {
            trimmedId = id;
        }
        return trimmedId;
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
     *  @param serialNumber - optional
     *  @param psrtModel - optional
     *  @param customerName - optional
     *  @param workOrderDocumentNumber - optional
     */
    function startPSRT( serialNumber, psrtModel, customerName, workOrderDocumentNumber ) {
        var config = Config.getConfig();
        var psrtRequestDir = config.externalStorageDirectory + config.psrtRequestDirectory;

        debug && console.log( "Util.startPSRT: Attempting PSRT launch via Firefox using URL: " + config.psrtUrl );

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
                woRequestFilename = psrtRequestDir + "/" + workOrderDocumentNumber + ".json";
            }

            var woRequestData = JSON.stringify( woRequestObj );
            debug && console.log( "Util.startPSRT: Writing " + woRequestData + " to " + woRequestFilename );

            // Create the WO request directory
            LocalFS.createDirectory( psrtRequestDir, function() {
                // Write the WO request file
                LocalFS.writeFile( woRequestFilename, woRequestData,
                    // Write success results in attempt to start PSRT
                    function() {
                        window.localStorage.setItem( LS_PSRT_STARTED, true );
                        debug && console.log( "Util.startPSRT: WO request file created. Starting PSRT" );
                        if ( window.Firefox ) {
                            debug && console.log( "Util.startPSRT: Firefox Phonegap plugin available" );
                            window.Firefox( { url : config.psrtUrl },
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
                    function() {
                        alert( Localization.getText( "psrtWORequestFileWriteError") );
                    }
                );
            });
        // Normal launch with no equipment criteria
        } else {
            debug && console.log( "Util.startPSRT: Starting PSRT with no equipment criteria." );
            if ( window.Firefox ) {
                debug && console.log( "Util.startPSRT: Firefox Phonegap plugin available" );
                window.Firefox( { url : config.psrtUrl },
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
        'LS_PSRT_STARTED'                     : LS_PSRT_STARTED,
        'clone'                               : clone,
        'convert12HourTimeToISODateTimeStamp' : convert12HourTimeToISODateTimeStamp,
        'convertDateToISODateTimeStamp'       : convertDateToISODateTimeStamp,
        'doStartAndEndTimesCrossMidnight'     : doStartAndEndTimesCrossMidnight,
        'getCurrentDate'                      : getCurrentDate,
        'getIdSuffixNumber'                   : getIdSuffixNumber,
        'getISOCurrentTime'                   : getISOCurrentTime,
        'getObjectFromArray'                  : getObjectFromArray,
        'getUniqueId'                         : getUniqueId,
        'getWorkOrderDocumentNumbersAsString' : getWorkOrderDocumentNumbersAsString,
        'isOnline'                            : isOnline,
        'isRunningOnAndroid'                  : isRunningOnAndroid,
        'isRunningOnChromeDesktop'            : isRunningOnChromeDesktop,
        'isValidISODateTimeStamp'             : isValidISODateTimeStamp,
        'removeSuffixFromId'                  : removeSuffixFromId,
        'setSecondsAndMillisecondsToZero'     : setSecondsAndMillisecondsToZero,
        'startPSRT'                           : startPSRT,
        'takePicture'                         : takePicture
    };
}();
