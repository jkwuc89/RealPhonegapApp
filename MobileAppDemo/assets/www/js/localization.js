/**
 * localization.js
 */

"use strict";

/**
 * Localization
 * Provides localization functionality for the entire mobile app
 */
var Localization = function() {

    var currentTranslationDictionary = null;
    
    /**
     * Language constants
     */
    var DEFAULT_LANGUAGE       = "en-US";
    var LS_LANGUAGE            = "language";
    // Separate language files not supported by tablet 
    // var LANGUAGE_FILE_LOCATION = "js/translations/";

    /**
     * Change the language
     * @param newLang - New language
     * @param reloadPage - Reload page after setting the language?
     */
    function setLanguage( newLang, reloadPage ) {
        debug && console.log( "Localization.setLanguage: Changing language to " + newLang );
        window.localStorage.setItem( LS_LANGUAGE, newLang );
        Globalize.culture( newLang );
        if ( reloadPage ) {
            // Reload the login page
            // window.location.reload();
            document.location.href = "index.html";
        }
    }
    
    /**
     * Get the current language
     */
    function getLanguage() {
        debug && console.log( "Localization.getLanguage: Getting current language" );
        var currentLanguage = window.localStorage.getItem( LS_LANGUAGE );
        if ( !currentLanguage ) {
            currentLanguage = DEFAULT_LANGUAGE;
        }
        return currentLanguage;
    }

    /**
     * Load the language
     */
    function loadLanguage( loadCallback ) {
        if ( !loadCallback ) {
            throw "Localization.loadLanguage: Required parameter loadCallback is undefined";
        }
        var currentLanguage = getLanguage();
        debug && console.log( "Localization.loadLanguage: Loading language " + currentLanguage );
        Globalize.culture( currentLanguage );

        // The code below for switching language files works on Google Chrome desktop
        // and on Google Chrome Beta on the Android tablet.  However, it fails on
        // Android default browser with unknown chromium error: -6.
        // So, we are forced to keep all translations in a single preloaded file
        /*
        var languageFile = LANGUAGE_FILE_LOCATION + currentLanguage + ".js";
        debug && console.log( "Localization.loadLanguage: Loading language file " + languageFile );
        $.ajax({
            url : languageFile,
            dataType : "script",
            success : loadCallback,
            error : function( jqXHR, textStatus, errorThrown ) {
                console.error( JSON.stringify( jqXHR ) );
                console.error( JSON.stringify( errorThrown ) );
                throw "Localization.loadLanguage: Loading language file failed.  Status = " + textStatus;
            }
        });
        */

        // Using single translations file
        this.currentTranslationDictionary = translations[currentLanguage];
        
        // Set the translation dictionary using the translations from the loaded language file
        $.i18n.setDictionary( this.currentTranslationDictionary );
        
        loadCallback();
    }
    
    /**
     * Return the localized text for the specified ID
     */
    function getText( textId ) {
        debug && console.log( "Localization.getText: Getting text for textId: " + textId );
        return $.i18n._( textId );
    }
    
    /**
     * Translate the text inside a jQuery mobile button
     */
    function translateButton( button ) {
        // Text for a button is actually in the span tag whose class is ui-btn-text
        debug && console.log( "Localization.translateButton: Translating " + button.id + " as a button" );
        $(button).find( "span.ui-btn-text").text( $.i18n._( button.id ) );
    }
    
    /**
     * Translate all elements on a page.  The translate attribute
     * is used to select all elements that must be translated
     */
    function translate() {
        var elementsToTranslate = $("[translate='yes']");
        var currentElement;
        for ( var i = 0; i < elementsToTranslate.length; i++ ) {
            currentElement = elementsToTranslate[i];
            
            // Handle element translation special cases here
            
            // Buttons
            if ( "button" == $(currentElement).attr( "data-role" ) || "button" == $(currentElement).attr( "role" ) ) {
                translateButton( currentElement );
            // Select elements styled as buttons
            } else if ( currentElement instanceof HTMLSelectElement ) {
                var buttonForSelect = $( "#" + currentElement.id + "-button" );
                if ( buttonForSelect.length == 1 ) {
                    translateButton( buttonForSelect[0] );
                }
            // Translation of all other elements is done here
            } else {
                debug && console.log( "Localization.translate: Translating " + currentElement.id );
                $(currentElement).text( $.i18n._( currentElement.id ) );
            }
        }
        // Refresh translated elements
        $('select').selectmenu( 'refresh' );
    }
    
    /**
     * Format a date/time string using Globalize.
     * See https://github.com/jquery/globalize#dates for details
     * about the format string
     * @param dateTime - Date/time string to format
     * @param format - Globalize format string
     * @returns Formatted date/time string
     */
    function formatDateTime( dateTime, format ) {
        if ( !dateTime || !format ) {
            throw "Localization.formatDateTime: One or more required parameters (dateTime, format) are undefined";
        }
        var isoDateTime = null;
        if ( Util.isValidISODateTimeStamp( dateTime ) ) {
            isoDateTime = dateTime;
        } else {
            // Attempt to convert the dateTime parameter to ISO format
            isoDateTime = Util.convertDateToISODateTimeStamp( dateTime );
        }
        return Globalize.format( new Date( isoDateTime ), format );
    }
    
    /**
     * Format a number using Globalize.
     * See https://github.com/jquery/globalize#numbers for details about
     * the format string
     * @param number to format, it MUST be a number and not a string containing a number
     * @param format
     * @returns formatted number that contains at most 2 decimal places
     */
    function formatNumber( number, format ) {
        if ( number === undefined || !format ) {
            throw "Localization.format: One or more required parameters (number, format) are undefined";
        }
        if ( !_.isNumber( number ) ) {
            throw "Localization.format: number parameter is not a number";
        }
        return Globalize.format( number, format );
    }
    
    return {
        'currentTranslationDictionary'  : currentTranslationDictionary,
        'formatDateTime'                : formatDateTime,
        'formatNumber'                  : formatNumber,
        'getLanguage'                   : getLanguage,
        'loadLanguage'                  : loadLanguage,
        'getText'                       : getText,
        'setLanguage'                   : setLanguage,
        'translate'                     : translate
    };
}();
