(function ($) {
 
    // Callback function variables

    // Persists the state of the enable button (even when the popup is closed), and dynamically changes the text when the button is pressed; might use the storage API in the future.
    const setupEnabledSwitch = function(state, port) {
        $('#enabledLabel').text(state ? 'Enabled' : 'Enable');
        $('#enabledSwitch').attr('checked', state ? 'checked' : null).click(function() {
            $('#enabledLabel').text($('#enabledLabel').text() == 'Enabled' ? 'Enable' : 'Enabled');
            port.postMessage({cmd: "setEnabledState", data: !state});
        });
    }


	// Run script
	$(function () {

    console.log("TEST");
    // Kenny Toss in pause stuff here then execute script when you think it's necessary
    // Use Execute Script Here

	});
}(window.jQuery));
