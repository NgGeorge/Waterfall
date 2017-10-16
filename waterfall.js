(function ($) {
	var obs_count = 0; 				// Number of events observed by an observer
	var enabledState;

	// TODO: function getEnabledState gets state from storage, or sets it if it doesn't yet exist; use in conjuncion with chrome.storage.onChanged.addListener...
	function getEnabledState() {
		chrome.storage.local.get("enabledState", function(result) {
			// Scrolling should be disabled by default.
			if (result == null) {
				setEnabledState(false);
			} else {
				enabledState = result;
			}
		});
	}

	// Sets enabledState in chrome local storage.
	function setEnabledState(state) {
		chrome.storage.local.set({
			'enabledState': state
		}, function (result) {
			if (chrome.runtime.error) {
				console.log(chrome.runtime.error);
			}
		});
	}


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

    // Persists the state of the enable button
    // var setupEnabledSwitch = function(state, port) {
		// 		// Update the button text based on the enabled state.
		// 		$('#enabledLabel').text(state ? 'Enabled' : 'Enable');
		//
    //     $('#enabledSwitch').attr('checked', state ? 'checked' : null).click(function() {
    //         $('#enabledLabel').text($('#enabledLabel').text() == 'Enabled' ? 'Enable' : 'Enabled');
    //         port.postMessage({cmd: "setEnabledState", data: !state});
    //     });
    // }


	// Case insensitive jquery contains
	jQuery.expr[':'].icontains = function(element, index, match) {
		return jQuery(element).text().toUpperCase()
		.indexOf(match[3].toUpperCase()) >= 0;
	};

	// Run script
	$(function () {
				// Only run on Reddit
				if (window.location.href.indexOf("reddit") === -1 ) return;

				// Get the enabled state.
        // var backgroundPort = chrome.runtime.connect({name: "background"});
        // backgroundPort.postMessage({cmd: "getEnabledState"});
        // backgroundPort.onMessage.addListener(function(response) {
				// 		setupEnabledSwitch(response, backgroundPort);
        //     // Only runs the entire extension if "enabledState" returns true
        //     if (!response) return;
        // });

				$('#enabledSwitch').click(function() {
					console.log("clicked!");
					$('#enabledLabel').text(enabledState ? 'Enabled' : 'Enable');
					// Clicking the on/off button sends the opposite value to storage.
					setEnabledState(!enabledState);
				});

				// TODO: Upon any change to storage, re-runs scroll code.
				chrome.storage.onChanged.addListener(function(changes, areaName) {
						var newState = changes["enabledState"].newValue;
						console.log(newState);
						// Update the enabled/disabled button text
						$('#enabledLabel').text(state ? 'Enabled' : 'Enable');
		        $('#enabledSwitch').attr('checked', state ? 'checked' : null);
						// Stop or restart the scrolling.
				});
	});
}(window.jQuery));
