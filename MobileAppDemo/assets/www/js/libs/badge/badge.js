(function($) {
    "use strict";
    $.fn.mobileBadge = function(options) {
        if(typeof options.count !== "number") {
            throw "Specified count isn't a number";
        }
        if(options.position !== "topleft" && options.position !== "topright") {
            throw options.position + " is not a valid position for the count badge. Specify 'topleft' or 'topright'";
        }
        
        var settings = {
				position: "topright",
				classnames : "badge_variable"
			},
			badgeMarkup = "",
			badgeSizeAndPosClass = "badge_single_digit_width",
			badgeRightPosClass = "badge_position_single_digit_right", 
			attachToElement = this, 
			i = 0;
		if(options) {
			$.extend(settings, options);
		}
		
		// Set the badge size and position classes based on the count value
		if ( settings.count >= 10 ) {
		    badgeSizeAndPosClass = "badge_double_digit_width";
		    badgeRightPosClass   = "badge_position_double_digit_right";
		}
		
		// Allow setting custom classes for styling the badge
		if(typeof settings.classnames === "string") {
			badgeMarkup = "<span class='" + badgeSizeAndPosClass + " " + settings.classnames;
		}
		// If an array of class names is passed in
		else if(typeof settings.classnames === "object") {
			badgeMarkup = "<span class='" + badgeSizeAndPosClass + " ";
			for(i = 0; i < settings.classnames.length; i++) {
				if(typeof settings.classnames[i] === "string") {
					badgeMarkup += " " + settings.classnames[i] + " ";
				}
			}
		}
		
        if (settings.position === "topright" ) {
            badgeMarkup += " " + badgeRightPosClass + "'><span class='badge_count'>" + settings.count + "</span></span>";
        } else {
            badgeMarkup += " badge_position_left'><span class='badge_count'>" + settings.count + "</span></span>";
        }
        
        if(this.is("input[type='radio']")) {
			attachToElement = this.next();
		}
		
		else if(this.is("button")) {
			attachToElement = this.parent();
		}
		attachToElement.children("span").remove();
		
		// Add badge only if count is greater than 0
		if ( settings.count > 0 ) {
		    attachToElement.append(badgeMarkup);
		}
        return this;
   };
}(jQuery));
