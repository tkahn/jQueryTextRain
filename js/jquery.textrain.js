(function($) {

	$.widget("thomaskahn.textrain", {
		// Set default values
		options: {
			easingMethod: 'easeOutBounce', // string - ui easing presets
			rainingOrder: 'random', // string - random, fromBeginning, fromEnd
			totalAnimationTime: 5000, // integer - milliseconds
			timeForEachWordToFall: 1000, // integer - milliseconds
			animateToOpacity: 1.0 // float - 0.0 = transparent, 1.0 = opaque
		},

		// Initialize the plugin
		_create: function() {
			var self = this, o = this.options, el = this.element;

			// Get the width of a space
			el.append("<span id=\"testSpan\">&nbsp;</span>");

			el.data("spaceWidth", $("#testSpan").width());
			$("#testSpan").remove();

			el.data("container", {
				"id": el.attr("id"),
				"offset": el.offset(),
				"top": el.offset().top,
				"left": el.offset().left,
				"width": el.innerWidth(),
				"height": el.innerHeight(),
				"originalText": el.text(),
				"lineHeight": parseInt(el.css("line-height"),10),
				"fontSize": parseInt(el.css("font-size"),10)
			});

			el.data("cumulativeWidth", el.data("container").left);
			el.data("cumulativeHeight", el.data("container").top);

			el.data("fallingDelay", 0);
			el.data("reversedFallingDelay", o.totalAnimationTime);
			el.data("elemArr", []);

			self._renderWords(self._getArrayOfWords(el.data("container").originalText, false, true));
		},

		// The method that makes the text rain
		rain: function() {
			var self = this, o = this.options, el = this.element;
			el.data("fallingDelay", 0);
			el.data("reversedFallingDelay", o.totalAnimationTime);

			$.each(el.data("elemArr"), function(index, value) {

				var fallingWord = $(this);

				//var fallDist = ((el.data("container").height + el.data("container").top) - el.data("container").lineHeight);

				//let the block fall
				switch (o.rainingOrder) {
					
					case "fromBeginning":
						el.data("fallingDelay", el.data("fallingDelay") + (o.totalAnimationTime / el.data("elemArr").length));
						//eachFallDuration = eachFallDuration;

						$(fallingWord).stop().delay(el.data("fallingDelay")).animate({
							top: el.data("cumulativeHeight") + "px",
							opacity: parseFloat(o.animateToOpacity)
						}, o.timeForEachWordToFall, o.easingMethod);
						break;
					case "fromEnd":
						el.data("reversedFallingDelay", el.data("reversedFallingDelay") - (o.totalAnimationTime / el.data("elemArr").length));

						$(fallingWord).stop().delay(el.data("reversedFallingDelay")).animate({
							top: el.data("cumulativeHeight") + "px",
							opacity: parseFloat(o.animateToOpacity)
						}, o.timeForEachWordToFall, o.easingMethod);
						break;
					default: //random
						el.data("fallingDelay", self._getRandom(o.totalAnimationTime));

						$(fallingWord).stop().delay(el.data("fallingDelay")).animate({
							top: el.data("cumulativeHeight") + "px",
							opacity: parseFloat(o.animateToOpacity)
						}, o.timeForEachWordToFall, o.easingMethod);
						break;
				} // End switch statement
			}); // End element array each-statement

		},

		// Resets the page to its original state, ready to rain again
		reset: function() {
			var self = this, o = this.options, el = this.element;
			el.text(el.data("container").originalText);
			self._create();
		},

		_getArrayOfWords: function(inputString, removeUnwantedCharacters, trimWhitespace) {
			// Some variables
			var arrWords = new Array;

			// Should unwanted characters be removed?
			if (removeUnwantedCharacters) {
				inputString = inputString.replace(/[\."?!:;,*\^~¨{}()%\[\]+-=\\<>|]/g, "");
			}

			// Trim leading and trailing whitespace 
			if (trimWhitespace) {
				inputString = jQuery.trim(inputString);
			}

			// Check that the string is not empty by now
			if (inputString.length > 0) {
				// Split the string into an array with one word in each element
				arrWords = inputString.split(" ");
			}

			return arrWords;
		},

		_renderWords: function(arrWords) {
			var self = this, el = this.element, o = this.options;
			var lookAheadWidth;

			// Is there at least one element in the array?
			if (arrWords.length > 0) {

				// Delete containing content and hard wire width and height to
				// preserve original layout
				$(el).empty().css({ "width": el.data("container").width, "height": el.data("container").height });

				// Loop through the array and put a span around each word.
				// Cache the length of the array and use a string builder
				// for better performance.
				var arrWordsLength = parseInt(arrWords.length, 10);
				var strb = "";
				for (var j = 0; j < arrWordsLength; j++) {
					strb += "<span id=\"" + el.data("container").id + "_" + j + "\" class=\"word\">" + arrWords[j] + "<span class=\"space\">&nbsp;</span></span>"
				}
				el.append(strb);

				// Get the new elements as an array 
				el.data("elemArr", el.find(".word").toArray());

				// Loop through the array of elements.
				// Cache the lenght og the array for performance.
				var elemArrLength = parseInt(el.data("elemArr").length, 10);
				for (var i = 0; i < elemArrLength; i++) {
					// Add the width of this word to see if
					// it exceeds the width of the container.
					el.data("lookAheadWidth", el.data("cumulativeWidth") + $(el.data("elemArr")[i]).outerWidth(true));

					// If the look ahead width exceeds the width of the container
					// then the previous word shouldn't have a space after it and
					// the text should start on a new row
					if ((el.data("lookAheadWidth") - el.data("spaceWidth") > (el.data("container").width + el.data("container").left))) {
						// Remove the last space since we're about to start a new line
						$(el.data("elemArr")[i - 1]).find(".space").remove();
						// Start a new line by reseting the cumulativeWidht to
						// the left offset of the element and the cumulativeHeight
						// to the current height + one new line (determined by the
						// line height)
						el.data("cumulativeWidth", el.data("container").left);
						el.data("cumulativeHeight", (el.data("cumulativeHeight") + el.data("container").lineHeight));
					}


					// Set the position of the current word
					var cssObj = { "position": "absolute",
						"z-index": i,
						"top": Math.round(el.data("cumulativeHeight")) + "px",
						"left": Math.round(el.data("cumulativeWidth")) + "px"
					};
					$(el.data("elemArr")[i]).css(cssObj);

					el.data("cumulativeWidth", el.data("cumulativeWidth") + $(el.data("elemArr")[i]).outerWidth(true));

				}
			} // End arrLength if-statement
		},
		_getRandom: function(milliseconds) {
			var ranNum = Math.floor(Math.random() * milliseconds);
			return ranNum;
		},

		destroy: function() {


			// Call the base destroy function
			$.Widget.prototype.destroy.call(this);
		},

		// React to option changes after initialization
		_setOption: function(key, value) {
			switch (key) {
				default:
					this.options[key] = value;
					break;
			}

			this._update();
		}
	});

})(jQuery);
