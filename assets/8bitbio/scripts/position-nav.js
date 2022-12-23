//Vertically center nav-button text on load
//And correct the font size
//Some browsers have a funky default font size
function positionAndSize() {
		var topbar = document.getElementById("topbar");
		var barHeight = parseInt(getComputedStyle(topbar).height);
		var third = Math.round(barHeight / 3);
		var fontSizeCorrected = third % 2 === 0 ? third : third-1;
		topbar.style.fontSize = fontSizeCorrected + "px";
		var elementList = document.getElementsByClassName("nav-button");
		for(var e = 0; e < elementList.length; e++) {
			var button = elementList[e];
			button.style.paddingTop = third + "px";
		}
		var fraction = Math.round(parseInt(getComputedStyle(document.body).height) / 40);
		var correctedFraction = fraction % 2 === 0 ? fraction : fraction - 1;
		document.body.style.fontSize = correctedFraction + "px";
		console.log("if");
}
window.addEventListener("load", positionAndSize);
window.addEventListener("resize", positionAndSize); 