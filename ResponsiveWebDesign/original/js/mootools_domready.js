// JavaScript Document
window.addEvent('domready', function() {
	
	// Correct PNG transparency for IE6
	if ( typeof correctPNG == 'function' ) correctPNG();
	
	// Create image button animation and bind events
	var image_path = 'images/';
	var content_container_id = 'demo-wrapper';
	var current_tab = null;
	var current_tab_content_id = null;
	var arr_tabIds = [
	  { id:'tab_home' },
	  { id:'tab_our-story' },
	  { id:'tab_our-work' },
	  { id:'tab_successes' },
	  { id:'tab_interested' }
	];
	
	// Attach behaviors to other elements to open and close the slide menu.
	// .each, .map, .every, and the other iterators let you pass along both the element in 
	// the iteration and the index of that element in the array ("function (lnk, index)...")
	// .map is basically a foreach loop on a $$() array. .map returns a new acted on array of values.
	arr_tabIds.each(function(lnk, index){
	
		// Preload images
		var on_image = image_path + lnk.id +'_on.png';
		var temp = new Asset.images( on_image, {} );
			
		// Access the tab object properties set up in the array
		var el_id = lnk.id;
		var el = $(el_id);
		// If the element exists
		if ( el )
		{
			// Initialize the tab state (null, on, over)
			el.tab_state = null;
			
			// Create the mouseOver event
			el.addEvent('mouseover', function(e){
				if (e != null) e = new Event(e).stop();
				// If not on, continue:
				if ( el != current_tab ) {
					// Update the tab state
					el.tab_state = 'over';
					// Set the current image src for restore use
					el.prev_src = getSrc( el );
					// Swap to over image
					swapImage( el, '_on' );
					// Get/set z-index (primarily for the home button)
					el.prev_zindex = el.getStyle('z-index');
					el.setStyle('z-index', 50);
				}
			}.bind(this));
			
			// Create the mouseOut event
			el.addEvent('mouseout', function(e){
				if (e != null) e = new Event(e).stop();
				// If not on, continue:
				if ( el != current_tab ) {
					// Update the tab state
					el.tab_state = null;
					// Swap to off image ( el.prev_src )
					swapImage( el, '' );
					// Swap z-index (primarily for the home button)
					el.setStyle('z-index', el.prev_zindex);
				}
			}.bind(this));
		}
		//end if element exists
		
	}, this);//.each, .map, etc. take a second argument, the thing to bind "this" to
	
	/*
	Passing an element and an image suffix, this function will swap the elements src
	for one in the images directory with the same element id, plus the suffix and extension.
	*/
	function swapImage( el, suffix, force_image )
	{
		var image_dir = 'images/';
		var extension = '.png';
		var image = ( force_image != null ) ? force_image : image_dir + el.getProperty('id') + suffix + extension;
		// IE6 fix
		if ( typeof correctPNG == 'function' ) {
			el.filters(0).src = image;
		} else {
			el.setProperty( 'src', image );
		}
	}
	
	/*
	Passing an element, return it's src
	*/
	function getSrc( el )
	{
		// IE6 fix
		if ( typeof correctPNG == 'function' ) {
			return( el.filters(0).src );
		} else {
			return( el.getProperty( 'src' ) );
		}
	}
	
	
});

window.addEvent('load', function(){
} );