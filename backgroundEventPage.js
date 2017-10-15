// This is an background (event) page that persists the on/off state.
var enabledState = true;

chrome.runtime.onConnect.addListener(function (port) {
	console.assert(port.name == "background");
	port.onMessage.addListener(function(msg) {
		if (msg.cmd == "setEnabledState") {
			enabledState = msg.data;
		} else if (msg.cmd == "getEnabledState") {
			port.postMessage(enabledState);
		}
	});
});