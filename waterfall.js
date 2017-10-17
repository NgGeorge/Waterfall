(function ($) {
  /*
   * Commenting out the observer code
   * It will only be used for Facebook/Twitter
   * but both currently aren't supported.
   *
	var obs_count = 0; 				// Number of events observed by an observer
	
	// For Pages with dynamic feeds
	// Creates an observer, and tells it what to do when it successfully observes mutations
	var createObserver = function(item, filterDelay) {
		var observer = new MutationObserver(function (mutations, observer) {
			// fired when a mutation occurs
			obs_count++;

			if (obs_count % filterDelay === 0) {
				console.log("REACHED");

				blockDynamicSpoilers(item);
			}
		});

		return observer;
	}

    // Setup an observer for the given target element
	var setupObserver = function(target, observer) {
		observer.observe(target, {
			subtree: true, // watches target and it's descendants
			attributes: true, // watches targets attributes
		});
	}
  */

    // Persists the state of the enable button (even when the popup is closed), and dynamically changes the text when the button is pressed; might use the storage API in the future.
    const setupEnabledSwitch = function(state, port) {
        $('#enabledLabel').text(state ? 'Enabled' : 'Enable');
        $('#enabledSwitch').attr('checked', state ? 'checked' : null).click(function() {
            $('#enabledLabel').text($('#enabledLabel').text() == 'Enabled' ? 'Enable' : 'Enabled');
            port.postMessage({cmd: "setEnabledState", data: !state});
        });
    }

	// Case insensitive jquery contains
	jQuery.expr[':'].icontains = function(element, index, match) {
		return jQuery(element).text().toUpperCase()
		.indexOf(match[3].toUpperCase()) >= 0;
	};

	// Run script
	$(function () {
        // Get the enabled state.
        const backgroundPort = chrome.runtime.connect({name: "background"});
        backgroundPort.postMessage({cmd: "getEnabledState"});
        backgroundPort.onMessage.addListener(function(response) {
            setupEnabledSwitch(response, backgroundPort);

            // Only runs the entire extension if "enabledState" returns true
            if (!response) return;
            
            // Only run on reddit
            if (window.location.href.indexOf("reddit") === -1 ) return;

            // Only match threads that are not mega threads (labeled 1-25)
            const $queue = $('div.thing').filter( function() {
                const $rank = $(this).attr('data-rank');
                if($rank) {
                    return $rank.match(/[0-9]+/);
                }
            });

            for ( var i = 0; i < $queue.length; i++ ) {
                const $next = $queue[i].dataset.permalink;
                console.log($next);
            }

            // Autoscroll down page 
            // Interval speed is in milliseconds. 
            // Will want to hook up an adjustable speed slider 
            // on the HTML Popup to work with this
            let interval = 50;
            const scroll = setInterval(function(){ 
              window.scrollBy(0, 1);   

              // Check if the current window is at the bottom of the page
              if ((window.innerHeight + window.scrollY + 1) >= document.body.scrollHeight) {

                // Gets the last child element of sitetable with the class of thing
                const $lastThreadChild = $('.thing:last');

                // Check if the load more comments button exists at the bottom of the page
                if ($lastThreadChild.hasClass('morechildren')) {
                 
                 // Click the load more comments button
                 $lastThreadChild.find('a span').click();
                }
              }
            }, interval); 
        });
	});
}(window.jQuery));
