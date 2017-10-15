(function ($) {
	const SPOILER_LIST = ['destiny', 'traveler', 'cayde', 'ikora', 'calus', 'destiny2', 'leviathan', 'ghaul', 'bungie']; // Terms to be filtered on
	var obs_count = 0; 				// Number of events observed by an observer


	// For Pages with dynamic feeds
	// Creates an observer, and tells it what to do when it successfully observes mutations
	// Necessary for Facebooks "neverending" scrolling
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

	// Create a filter that watches and dynamically filters Facebook
	var filterFacebook = function() { 
		// The target elements to watch for mutation
		var feed = $('[id^=topnews_main_stream_]').get(0);
		var feedItem = "[id^=hyperfeed_story_id_]";
		var page = $('[id^=pagelet_timeline]').get(0);
		var pageItem = "[class^=_4-u2]";
		var group = $('[id^=pagelet_group_mall]').get(0);
		var groupItem = "[class^=_4-u2]";

		// Will potentially need to put in a check for _401d feed and _307z posts
		
		var observer;
		
		// Setup the observers to observe specific targets
		if (feed) {
			observer = createObserver(feedItem, 4);
			setupObserver(feed, observer);
		}

		if (page) {
			obs_count = -8;
			observer = createObserver(pageItem, 6);
			setupObserver(page, observer);
		}
		
		if (group) {
			console.log("TEST");
			obs_count = -8;
			observer = createObserver(groupItem, 6);
			setupObserver(group, observer);

			// Facebook's usage of element classes and IDs are horrifically undecipherable at times. 
			// This line is necessary to avoid the accidental filtering of the entire news feed for groups pages.
			$('#contentArea').css('-webkit-filter', '');

		}
			
	}

	// Create a filter that watches and dynamically filters Twitter
	var filterTwitter = function() {
		// The target elements to watch for mutation
		var feed = $('[id^=stream-items-id]').get(0);
		var feedItem = "[id^=stream-item-tweet]";

		var observer;
		
		// Setup the observers to observe specific targets
		if (feed) {
			observer = createObserver(feedItem, 3);
			setupObserver(feed, observer);
		}


	}

	// This function applies the censor filters to the page based on the items in the spoiler list.
	var searchForSpoilers = function() {
		if (SPOILER_LIST == null) return;

		var searchString = '';
		SPOILER_LIST.forEach(function (item) {
			
			searchString = searchString + [
								"p:icontains('" + item + "')", 
								"h1:icontains('" + item + "')", 
								"h2:icontains('" + item + "')", 
								"span:icontains('" + item + "')", 
								"img[src*='" + item + "']", 
								"source[src*='" + item + "'], "
							].join(', ');
		});
		searchString = searchString.substring(0, searchString.length - 2);

		// Blur the spoiler's parent (excluding body+head) because it's important to block the spoiler's surrounding terms.
		$(searchString).parent(":not('body')", ":not('head')", ":not('ol')").css('-webkit-filter', 'blur(5px)').click(function() {
			$(this).css('-webkit-filter', '');
		});

	}

	var blockDynamicSpoilers = function(blockElement) {
		if (SPOILER_LIST == null) return;

		var searchString = '';
		SPOILER_LIST.forEach(function (item) {
			
			searchString = searchString + "p:icontains('" + item + "'), span:icontains('" + item + "'), ";
		});
		searchString = searchString.substring(0, searchString.length - 2);
		$(searchString).parents(blockElement, ":not('ol')").css('-webkit-filter', 'blur(5px)');
	}

    // Persists the state of the enable button (even when the popup is closed), and dynamically changes the text when the button is pressed; might use the storage API in the future.
    var setupEnabledSwitch = function(state, port) {
        $('#enabledLabel').text(state ? 'Enabled' : 'Enable');
        $('#enabledSwitch').attr('checked', state ? 'checked' : null).click(function() {
            $('#enabledLabel').text($('#enabledLabel').text() == 'Enabled' ? 'Enable' : 'Enabled');
            port.postMessage({cmd: "setEnabledState", data: !state});
            
            // Reload the browser page.
            chrome.tabs.reload();
        });
    }

	// This function checks if the title includes any of the terms, if it does, then it will block all the images and videos on the page - just incase.
	checkTitle = function() {
		var title = $('title').text().toLowerCase();
		for (var i = 0; i < SPOILER_LIST.length; i++) {
			if (title.includes(SPOILER_LIST[i])) {
				$('img, source').parent(":not('body')", ":not('head')", ":not('ol')").css('-webkit-filter', 'blur(5px)');
				break;
			}
		}
	}

	// Case insensitive jquery contains
	jQuery.expr[':'].icontains = function(element, index, match) {
		return jQuery(element).text().toUpperCase()
		.indexOf(match[3].toUpperCase()) >= 0;
	};

	// Run script
	$(function () {
        // Get the enabled state.
        var backgroundPort = chrome.runtime.connect({name: "background"});
        backgroundPort.postMessage({cmd: "getEnabledState"});
        backgroundPort.onMessage.addListener(function(response) {
            setupEnabledSwitch(response, backgroundPort);
            
            // Only runs the entire extension if "enabledState" returns true
            if (!response) return;

			if (window.location.href.indexOf("nggeorge.github.io") > 1 | window.location.href.indexOf("NgGeorge/Cloaked") > 1) return;
            
            // Filter through the entire page first
            searchForSpoilers();
            
            // Check if the current site is Facebook, then apply a filter that watches the mutating page feed if it is
            if (window.location.href.indexOf("facebook") > -1) {
                filterFacebook();

            } else if (window.location.href.indexOf("twitter") > -1) {
				filterTwitter();
			} else {
            	checkTitle();
			}
        });
	});
}(window.jQuery));
