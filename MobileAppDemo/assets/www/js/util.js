/**
 * util.js
 */

"use strict";

/**
 * Util
 */
var Util = function() {
    
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
     * Is the mobile app running on an iOS device?
     */
    function isRunningOniOS() {
        return ( navigator.userAgent.match( /(iPhone|iPod|iPad)/ ) );
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
        'clone'                               : clone,
        'convert12HourTimeToISODateTimeStamp' : convert12HourTimeToISODateTimeStamp,
        'convertDateToISODateTimeStamp'       : convertDateToISODateTimeStamp,
        'getISOCurrentTime'                   : getISOCurrentTime,
        'getObjectFromArray'                  : getObjectFromArray,
        'getUniqueId'                         : getUniqueId,
        'isOnline'                            : isOnline,
        'isRunningOnChromeDesktop'            : isRunningOnChromeDesktop,
        'isRunningOniOS'                      : isRunningOniOS,
        'isValidISODateTimeStamp'             : isValidISODateTimeStamp,
        'setSecondsAndMillisecondsToZero'     : setSecondsAndMillisecondsToZero,
        'takePicture'                         : takePicture
    };

}();
