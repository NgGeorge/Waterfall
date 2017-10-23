'use strict';

(function ($) {
	var obs_count = 0; 				// Number of events observed by an observer
	// (Deprecated?) enabledState was intended to be the global variable referenced by all relevant functions, HOWEVER it is only set to false
	var enabledState;
	const DEFAULT_SCROLL_INTERVAL = 50;
	var scrollTimer;

	// For Pages with dynamic feeds: creates an observer, and tells it what to do when it successfully observes mutations
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

	// Case insensitive jquery contains
	jQuery.expr[':'].icontains = function(element, index, match) {
		return jQuery(element).text().toUpperCase()
		.indexOf(match[3].toUpperCase()) >= 0;
	};

	// Sets the scroll "speed"
	function setScroll(newState) {
		if (newState === false) {
			console.log("turning off scroll");
			window.clearInterval(scrollTimer);
			return;
		}

		console.log("turning on scroll");
		scrollTimer = window.setInterval(function() {
			window.scrollBy(0, 1);
			loadMoreComments();
		}, DEFAULT_SCROLL_INTERVAL);
		// ALternate approach?: set scrollBy() values to 0? but it leaves the interval; THIS DOESN'T WORK HOWEVER
	}

	function loadMoreComments() {
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
	}

	// Run script
	$(function () {
		// Only run on Reddit; HOWEVER THIS CAUSES THE REST TO NOT RUN BECAUSE DURING DEVELOPMENT I NEED TO REFRESH THE EXTENSION PAGE FIRST
		if (window.location.href.indexOf("reddit") === -1 ) {
			console.log("not reddit");
			return;
		}

		// When enabledState in local storage is changed, changes the scroll.
		chrome.storage.onChanged.addListener(function(changes, areaName) {
			var newState = changes["enabledState"].newValue;
			console.log(".storage.onChanged triggered! new state: ", newState);

			// Trying: passing in newState
			setScroll(newState);
		});

		// Looks in storage for an object called "enabledState"
		chrome.storage.local.get("enabledState", function(storageItems) {
			enabledState = storageItems["enabledState"];
			// console.log("inner enabledState = ", enabledState)
			if (enabledState == null) {
				// Set it to the default value
				// console.log("TEST");
				enabledState = false;

				chrome.storage.local.set({"enabledState": enabledState}, function() {
					// console.log("state saved.");
				});
			}

			// On click, updates the text and changes the value of enabledState
			$("#enabledSwitch").click(function() {
				// console.log("enabledState before click: ", enabledState);
				enabledState = !enabledState;
				// console.log("enabledState after click: ", enabledState);

				$('#enabledLabel').text(enabledState ? 'Enabled' : 'Enable');
				$('#enabledSwitch').attr('checked', enabledState ? 'checked' : null);

				// console.log("enabledState saved to ", enabledState);
				chrome.storage.local.set({"enabledState": enabledState});
			});
		});
	});
}(window.jQuery));
