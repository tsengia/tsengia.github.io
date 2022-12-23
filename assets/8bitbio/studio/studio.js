/*
Route Engine Studio Code
*/

function ScriptItem(u, n) {
	this.url = u;
	this.name = n;
	this.addedFlag = false;
}

function ImageItem(n,s) {
	this.url = s;
	this.name = n;
	this.addedFlag = false;
}

function Project() {
  this.name = "Untitled_Project";
  this.version = "0.1";
  this.scripts = [];
  this.images = [];
  this.sounds = [];
  this.code = "/* Hello World! */";

  this.setName = function(n) {
    this.name = n;
  };

  this.setVersion = function(n) {
    this.version = n;
  };

  this.setName.bind(this);
  this.setVersion.bind(this);
}

var Studio = {};
Studio.currentTab = 0;
Studio.tabs = [];
Studio.currentMouseX = 0;
Studio.currentMouseY = 0;
Studio.popups = [];
Studio.popupCount = 0;
Studio.showingAlpha = true;
Studio.scripts = [];
Studio.images = [];
Studio.sounds = [];
Studio.imagePopup;
Studio.stopListeners = [];
Studio.running = false;
Studio.spinnerState = 0;
Studio.spinnerInterval = null;
Studio.SPINNER_SPEED = 700;
Studio.codeDivSave;
Studio.currentProject = new Project();


function linkScript() {
	var n = document.getElementById("scriptName").value;
	var url = document.getElementById("scriptURL").value;
	var s = new ScriptItem(n, url);
	Studio.scripts.push(s);
	var id = findPopupIndex("Link Script");
	closePopup(id);
	Studio.updateCurrentTab();
}

function showLinkScriptPopup() {
	if(!popupExists("Link Script")) {
		var c = document.createElement("div");
		var n = document.createElement("input");
		n.setAttribute("placeholder", "Name of script");
		n.setAttribute("type", "text");
		n.setAttribute("id", "scriptName");
		var url = document.createElement("input");
		url.setAttribute("placeholder", "URL/Location of script");
		url.setAttribute("type", "text");
		url.setAttribute("id", "scriptURL");
		var submit = document.createElement("button");
		submit.setAttribute("type", "button");
		submit.appendChild(document.createTextNode("Link"));
		submit.addEventListener("click", linkScript);
		c.appendChild(n);
		c.appendChild(url);
		c.appendChild(submit);
		var p = makePopup("Link Script", c, 0, 0, 400, 100, true);
		showPopup(p);
	}
}

function addImage() {
	//TODO: This is the event handler for when the "Add an Image" button is pressed
}

function makeScriptsPane() {
  var scriptsDiv = document.createElement("div");
  scriptsDiv.id = "scripts-pane";

  for(var i = 0; i < Studio.scripts.length; i++) {
  	var item = document.createElement("div");
  	item.className = "script-item";
  	item.appendChild(document.createTextNode(Studio.scripts[i].name));

	var url = document.createElement("span");
	url.appendChild(document.createTextNode(Studio.scripts[i].url));
	url.className = "script-url";
	item.appendChild(url);

	scriptsDiv.appendChild(item);
  }
  var addButton = document.createElement("button");
  addButton.appendChild(document.createTextNode("Link Script"));
  addButton.setAttribute("type", "button");
  addButton.addEventListener("click", showLinkScriptPopup);
  
  scriptsDiv.appendChild(addButton);
  return scriptsDiv;
}

function makeImagesPane() {
	var imagesDiv = document.createElement("div");
	imagesDiv.id = "images-pane";
	var addButton = document.createElement("button");
  	addButton.type = "button";
  	addButton.addEventListener("click", addImage);
  	addButton.appendChild(document.createTextNode("Add an Image"));
  	imagesDiv.appendChild(addButton);
	for(var i = 0; i < Studio.images.length; i++) {
		var item = document.createElement("div");
		item.className = "image-item";
		item.appendChild(document.createTextNode(Studio.images[i].name));

		var url = document.createElement("span");
		url.appendChild(document.createTextNode(Studio.images[i].url));
		url.className = "image-url";
		item.appendChild(url);

	imagesDiv.appendChild(item);
	}
	return imagesDiv;
}

function makeCodeDiv() {
	return Studio.codeDivSave;
}


function loadExternalScripts() { //Loads in external scripts from the scripts pane.
		for(var i =0; i < Studio.scripts.length; i++) { //Repeat through the list of scripts
		if(!Studio.scripts[i].addedFlag) { //If that script hasn't been added yet, add it
			Studio.scripts[i].addedFlag = true; //Set the added flag to true
			var sc = document.createElement("script");
			sc.setAttribute("src",Studio.scripts[i].url);
			document.body.appendChild(sc); //Add the script element to the document
		}
	}
}

function StartGame() {
	loadExternalScripts(); //Load any new external scripts
	StopGame(); //This clears any "ghost" functions/window intervals that could be running in the old code.
	var s = document.createElement("script");
	s.id = "outputScript";
	s.innerHTML = Studio.code.getValue();
	document.body.appendChild(s); //Make and add the new game code
	Studio.running = true;
	rotateRunningSpinner(); //Jump on the spinner animation
	Studio.spinnerInterval = setInterval(rotateRunningSpinner, Studio.SPINNER_SPEED); //Start the wonderful spinner animation
}


function StopGame() {
	for(var i = 0; i < Studio.stopListeners.length; i++) {
		Studio.stopListeners[i]();	//This allows the code to stop window intervals and any other listeners.
	}
	if(Studio.running) {
		document.body.removeChild(document.getElementById("outputScript")); //Remove the old game code
		stopSpinner(); //Stop the spinning animation
	}
	Studio.running = false;
};

function rotateRunningSpinner() {
	if(Studio.spinnerState == 0) {
		document.getElementById("running-indicator").innerHTML = "+";
		Studio.spinnerState++;
	}
	else {
		document.getElementById("running-indicator").innerHTML = "x";
		Studio.spinnerState--;
	}
}

function stopSpinner() {
	window.clearInterval(Studio.spinnerInterval); //Stop the interval
	document.getElementById("running-indicator").innerHTML = "-"; //Set to not running mode
}

function switchTab(event) { //Event handler for tab clicks, leads to Studio.updateCurrentTab
	document.getElementById("selected-tab").id = "";
	event.target.id = "selected-tab";
	Studio.currentTab = parseInt(event.target.getAttribute("data-tab-id"));
	Studio.updateCurrentTab();
}

function switchProject(newProj) {
        Studio.currentProject = newProj;
        Studio.projectNameInput.value = Studio.currentProject.name;
        Studio.scripts = Studio.currentProject.scripts;
        Studio.images = Studio.currentProject.images;
        Studio.sounds = Studio.currentProject.sounds;
        //TODO: Load in the code
}

Studio.updateCurrentTab = function () { //Switches the tab view to the current tab #
	document.getElementById("tab-contents").innerHTML = ""; //Clear out the old tab
	var newTab = Studio.tabs[Studio.currentTab];
	document.getElementById("tab-contents").appendChild(newTab()); //Put in the new tab
	Studio.code.refresh(); //Refresh the codebox in case we are in the code view
};

window.addEventListener("mousemove", function(event) {/*
	 //Deprecated as the moving of popups isn't really necessary
	for (var w = 0; w < Studio.popups.length; w++) {
		if (Studio.popups[w].dragging) {
			var win = document.getElementById("popup-"+Studio.popups[w].id);
			win.style.top = event.screenY;
			win.style.left = event.screenX;
		}
	} */
});

function checkCloseContextMenu() {
	var i = findPopupIndex("Context Menu");
	if (i != -1) {
		closePopup(i);
	}
}

function toggleAlpha() { //Function to turn the background pattern of the canvas on and off.
	if(Studio.showingAlpha) {
		Studio.showingAlpha = false;
		document.getElementById("canvas").style.backgroundImage = "none";
	}
	else {
		Studio.showingAlpha = true;
		document.getElementById("canvas").style.backgroundImage = "url(./images/alpha.gif)";
	}
	checkCloseContextMenu();
}

function rightClickedScreen(e) { //Event handler for when the canvas is right clicked. Should show a popup with a button to toggle the canvas background
	e.preventDefault();
	
	if (!popupExists("Context Menu")) {
		var c = document.createElement("div");
		var b = document.createElement("button");
		b.setAttribute("type", "button");
		b.addEventListener("click", toggleAlpha);
		b.appendChild(document.createTextNode("Toggle Alpha"));
		
		c.appendChild(b);
		var p = makePopup("Context Menu", c, e.clientX, e.clientY, 200, 100, true);
		showPopup(p);
	}
}

function makePopup(n,c,xPos,yPos,w,h,destroyOnClose) { //Makes a popup instance, pushes it to Studio.popups and returns the Popup ID. Popup is not shown/added to the document
	var o = {};
	o.title = n;
	o.content = c;
	o.width = w;
	o.height = h;
	o.x = xPos;
	o.y = yPos;
	o.node = false;
	o.id = Studio.popups.length;
	o.dragging = false;
	o.destroyOnClose = destroyOnClose;
	Studio.popups.push(o);
	Studio.popupCount++;
	return o.id;
}

function movePopupHandler(event) {/*
	var i = event.target.getAttribute("data-popupid");
	var win = document.getElementById("popup-"+i);
	if (Studio.popups[i].dragging) {
		Studio.popups[i].dragging = false;
	}
	else {
		if (Studio.popups[i].node == false) {
			Studio.popups[i].dragging = false;
		}
		else {
			Studio.popups[i].dragging = true;
		}
	}*/
}

function deletePopup(id) { // This actually removes the popup from Studio.popups
	delete Studio.popups[id];
}

function closePopupHandler(event) { //Event Handler that leads into closePopup
	var i = event.target.getAttribute("data-popupid");
	Studio.popups[i].dragging = false;
	closePopup(i);
}

function closePopup(id) { //Closes a popup (removes from document) using the Popup's ID. DOES NOT REMOVE FROM Studio.popups!
	document.body.removeChild(Studio.popups[id].node);
	Studio.popups[id].node = false;
	Studio.popups[id].dragging = false;
	if(Studio.popups[id].destroyOnClose) {
		deletePopup(id);	
	}
}

function popupExists(title) {
	for (var i = 0; i < Studio.popupCount; i++) {
		if (Studio.popups[i] != null) {
			if(Studio.popups[i].title == title) {
				return true;			
			}
		}
	}
	return false;
}

function findPopupIndex(title) {
	for (var i = 0; i < Studio.popupCount; i++) {
		if (Studio.popups[i] != null) {
			if(Studio.popups[i].title == title) {
				return i;			
			}
		}
	}
	return -1;
}

function showPopup(id) { //Displays a popup from Studio.popups using the ID. (adds to document)
	var win = document.createElement("div");
	win.className = "popup-window";
	win.id = "popup-"+id;
	var title = document.createElement("div");
	title.className = "popup-title";
	title.setAttribute("data-popupid", id);
	title.addEventListener("click", movePopupHandler);
	title.appendChild(document.createTextNode(Studio.popups[id].title));
	var c = document.createElement("div");
	c.className = "popup-close";
	c.appendChild(document.createTextNode("X"));
	c.setAttribute("data-popupid", id);
	c.addEventListener("click", closePopupHandler);
	title.appendChild(c);
	win.appendChild(title);
	win.appendChild(Studio.popups[id].content);
	win.style.top = Studio.popups[id].y + "px";
	win.style.left = Studio.popups[id].x + "px";
	win.style.width = Studio.popups[id].width + "px";
	win.style.height = Studio.popups[id].height + "px";
	Studio.popups[id].node = win;
	document.body.appendChild(win);
}


Studio.addStopListener = function (f) {
	this.stopListeners.push(f);
}
Studio.addStopListener.bind(Studio);

function updateCoords(event) {
	var totalOffsetX = 0;
	var totalOffsetY = 0;
	var canvasX = 0;
	var canvasY = 0;
	var currentElement = event.target;

	do{
	    totalOffsetX += currentElement.offsetLeft - currentElement.scrollLeft;
	    totalOffsetY += currentElement.offsetTop - currentElement.scrollTop;
	}
	while(currentElement = currentElement.offsetParent)

        canvasX = event.pageX - totalOffsetX;
        canvasY = event.pageY - totalOffsetY;
 	Studio.currentMouseX = canvasX;
	Studio.currentMouseY = canvasY;
	document.getElementById("x-coord").innerHTML = canvasX;
	document.getElementById("y-coord").innerHTML = canvasY;
}

function windowErrorHandler(event) {
	Studio.error("["+event.lineno+"] " + event.error.message);
}

window.addEventListener("error", windowErrorHandler);

Studio.log = function (msg) {
	var s = document.createElement("span");
	s.className = "console-log";
	s.appendChild(document.createTextNode(msg));
	document.getElementById('console').appendChild(s);
	document.getElementById('console').appendChild(document.createElement("br"));
	var objDiv = document.getElementById('console');
	objDiv.scrollTop = objDiv.scrollHeight;
}
Studio.error = function (msg) {
	var s = document.createElement("span");
	s.className = "console-error";
	s.appendChild(document.createTextNode(msg));
	document.getElementById('console').appendChild(s);
	document.getElementById('console').appendChild(document.createElement("br"));
	var objDiv = document.getElementById('console');
	objDiv.scrollTop = objDiv.scrollHeight;
};
Studio.clearConsole = function () {
	document.getElementById('console').innerHTML = "";
	var p = document.createElement("pre");
	p.id = "script-out";
	document.getElementById('console').appendChild(p);
};		
