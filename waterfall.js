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
            if (window.location.href.indexOf("comments") === -1 ) {
                // Assumes user is on reddit main page or subreddit
                // TODO: Make this more robust using regex

                // Only match threads that are not mega threads (labeled 1-25)
                const $queue = $('div.thing').filter( function() {
                    const $rank = $(this).attr('data-rank');
                    if($rank) {
                        return $rank.match(/[0-9]+/);
                    }
                });

                // Create an array of urls
                var urls = [];
                for ( var i = 0; i < $queue.length; i++ ) {
                    var nextUrl = $queue[i].dataset.permalink;
                    urls.push(nextUrl);
                    console.log('Saved');
                    console.log(nextUrl);
                }

                // Store urls
                chrome.storage.local.set({"urls": JSON.parse(JSON.stringify(urls))}, function() {
                    if (chrome.runtime.error) {
                        console.log(chrome.runtime.error);
                    }
                })

                // Sets next page to be urls[1]
                chrome.storage.local.set({"index": JSON.stringify(1)}, function() {
                    if (chrome.runtime.error) {
                        console.log(chrome.runtime.error);
                    }
                });
            } else { // Assumes user is in a comments page

                // Autoscroll down page 
                // Interval speed is in milliseconds. 
                // Will want to hook up an adjustable speed slider 
                // on the HTML Popup to work with this
                let interval = 50;
                var stop = false;
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
                    } else {
                        // Check this boolean flag to only redirect once
                        if (!stop) {
                            // get next thread to load
                            chrome.storage.local.get(["index", "urls"], function(storageItems) {
                                var index = JSON.parse(JSON.stringify(storageItems["index"]));
                                var urls = JSON.parse(JSON.stringify(storageItems["urls"]));

                                if (index != null && urls != null) {
                                    // Update the index with the next page
                                    chrome.storage.local.set({"index": JSON.stringify(1+parseInt(index))});
                                    console.log(urls[parseInt(index)]);
                                    if (parseInt(index) < urls.length) {
                                        window.location.href = urls[parseInt(index)];
                                    } else {
                                        console.log("No more results");
                                    }
                                } else {
                                    console.log("No more results");
                                }
                            });
                            stop = true;
                        }
                    }
                }
                }, interval);
            }
        });
	});
}(window.jQuery));
