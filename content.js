$(document).ready(function() {

	// Callback function variables

	// Filters threads that aren't mega threads
	const megaThreadFilter = 
		function() {
				const $rank = $(this).attr('data-rank');
				if($rank) {
						return $rank.match(/[0-9]+/);
				}
		};

	// Loads the next thread from storage
	const loadNextThread = 
		function(storageItems) {
				var index = JSON.parse(JSON.stringify(storageItems["index"]));
				var urls = JSON.parse(JSON.stringify(storageItems["urls"]));

				var next = null;
				if ("next" in storageItems) {
						next = JSON.parse(storageItems["next"]);
				}

				if (index != null && urls != null) {
						// Update the index with the next page
						chrome.storage.local.set({"index": JSON.stringify(1+parseInt(index))});

						if (parseInt(index) < urls.length) {
								// Go to next thread in 5 seconds
								nextPageCb = function() {
										window.location.href = urls[parseInt(index)];
								};

								// TODO : Stop hardcoding this, we'll probably want to store and retrieve configs from storage
								setTimeout(nextPageCb, 5000);
								console.log(urls[parseInt(index)]);
						} else {
								if (next !== null) {
										// Go to next frontpage in 5 seconds
										nextPageCb = function() {
												window.location.href = next;
										};
										setTimeout(nextPageCb, 5000);
										console.log(next);
								} else {
										console.log("No more results");
								}
						}
				} else {
						console.log("No results");
				}
		}

	// Run Script
	$(function () {
		// Only run on reddit
		if (window.location.href.indexOf("comments") === -1 ) {
				// Assumes user is on reddit main page or subreddit
				// TODO: Make this more robust using regex

				// Only match threads that are not mega threads (labeled 1-25)
				const $queue = $('div.thing').filter(megaThreadFilter);

				// Create an array of urls
				var urls = [];
				for ( var i = 0; i < $queue.length; i++ ) {
						var nextUrl = $queue[i].dataset.permalink;
						urls.push(nextUrl);
				}

				// Select Next page button
				var nextButton = $('span.next-button a');
				if (nextButton !== undefined && nextButton.length > 0) {
						var nextPage = nextButton[0].href;

						// Sets next page to queue
						chrome.storage.local.set({"next": JSON.stringify(nextPage)});
				} else {
						chrome.storage.local.remove("next");
						console.log('Reached last page of results');
				}

				// Store urls
				chrome.storage.local.set({"urls": JSON.parse(JSON.stringify(urls))})

				// Sets next thread to be urls[1]
				chrome.storage.local.set({"index": JSON.stringify(1)});

				// Redirect to the first thread
				nextPageCb = function() {
						if(urls.length > 0) {
								window.location.href = urls[0];
						}
				};

				// Set redirect in X seconds
				// TODO: put this in local storage and allow user to configure
				setTimeout(nextPageCb, 5000);

		} else { // Assumes user is in a comments page

				// Autoscroll down page 
				// Interval speed is in milliseconds. 
				// Will want to hook up an adjustable speed slider 
				// on the HTML Popup to work with this
				let interval = 50;
				let stop = false;
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
											chrome.storage.local.get(["index", "urls", "next"], loadNextThread);
											stop = true;
									}
							}
					}
				}, interval);
		}
	});

});
