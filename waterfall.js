(function ($) {
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
        });
	});
}(window.jQuery));
