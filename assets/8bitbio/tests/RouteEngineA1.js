if(!RouteEngine) {
var RouteEngine = {};
RouteEngine.games = [];
RouteEngine.images = [];
RouteEngine.ImageLoaders = [];
RouteEngine.noImage = loadImage("none.png", 20, 20);
RouteEngine.GameClicked = function(event) {
	RouteEngine.games[event.target.dataset.gameId].clicked(event);
};
RouteEngine.GameDown = function(event) {
	RouteEngine.games[event.target.dataset.gameId].down(event);
};
RouteEngine.GameUp = function(event) {
	RouteEngine.games[event.target.dataset.gameId].up(event);
};
RouteEngine.GameMouseMove = function(event) {
	RouteEngine.games[event.target.dataset.gameId].mousemove(event);
};
RouteEngine.GameMouseOut = function(event) {
	RouteEngine.games[event.target.dataset.gameId].mouseout(event);
};
RouteEngine.IdImageLoaded = function(e) {
//All image loaders assign their image objects with "ImageId" + loader's id + ":" + image id.
//Redirect the image load event to the loader event via id.
var id = e.target.id.substring(7);
RouteEngine.ImageLoaders[id.split(":")[0]].imageLoaded(id.split(":")[1]);
};
}

function Game(element) {
this.id = RouteEngine.games.length;
RouteEngine.games.push(this);
this.c = element;
this.can = this.c.getContext("2d");
this.cW = this.c.width;
this.cH = this.c.height;
this.self = this;
this.images = [];
this.sprites = [];
this.mouseDown = false;
this.onclick = function(e) { };
this.onmouseup = function(e) { };
this.onmousedown = function(e) { };
this.onmousemove = function(e) { };
this.onstart = function() { };
this.onload = function() { };
this.onmouseout = function() { };
this.clicked = function(event) { this.onclick(); };
this.mousemove = function(event) { this.getPosition(event); this.onmousemove(event); };
this.down = function(event) { this.mouseDown = true; this.onmousedown(event); };
this.up = function(event) { this.mouseDown = false; this.onmouseup(event); };
this.mouseout = function(event) { this.self.mouseDown = false; this.self.mouseX = -1; this.self.mouseY = -1; this.self.onmouseout(); };
this.background = new Background("clear");
this.c.dataset.gameId = this.id;
this.c.addEventListener("click", function(event) { RouteEngine.GameClicked(event); });
this.c.addEventListener("mousedown", function(event) { RouteEngine.GameDown(event); });
this.c.addEventListener("mouseup", function(event) { RouteEngine.GameUp(event); });
this.c.addEventListener("mousemove", function(event) { RouteEngine.GameMouseMove(event); });
this.c.addEventListener("mouseout", function(event) { RouteEngine.GameMouseOut(event); });

this.render = function() {
this.background.draw(this.self);
for (var s = 0; s < this.sprites.length; s++) {
this.sprites[s].draw(this.self);
}
};

this.clear = function() {
this.can.clearRect(0, 0, this.cW, this.cH);	
};

this.getPosition = function(event){
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
	this.mouseX = canvasX;
	this.mouseY = canvasY;
};

}

function Background(type, value) {
this.color = "#FFF";
this.img = RouteEngine.noImage;
this.type = type;

switch(this.type) {
case "color":
this.color = value;
break;
case "image":
case "img":
this.img = value;
break;
case "clear":
//Nothing
break;
default:
//No Type! Default to clear
this.type = "clear";
break;
}

this.draw = function(game) {
switch(this.type) {
case "color":
game.can.fillStyle = this.color;
game.can.fillRect(0, 0, game.cW, game.cH);
break;
case "image":
case "img":
game.can.drawImage(this.img, 0, 0);
break;
case "clear":
game.clear();
break;
default:
console.log("Impossible really, how can this happen?");
break;
}	
};
}

function Sound(src) {
this.src = src;
this.sound = new Audio();
this.sound.src = this.src;
this.onload = function() { };
this.onplay = function() { };
this.load = function() {
this.sound.load();	
};
this.sound.onload = function() { this.onload(); };

this.play = function() {
this.sound.load();
this.sound.play();
this.onplay();
};

}

function TextSprite(text, x, y) {
this.align = "left"; //left, start, center, right, end
this.text = text;
this.font = "30px Arial";
this.x = x;
this.y = y;
this.visible = true;
this.color = "#222";

this.draw = function(game) {
if(this.visible) {
game.can.font = this.font;
game.can.fillStyle = this.color;
game.can.textAlign = this.align;
game.can.fillText(this.text, this.x, this.y);
}
};

this.hide = function() {
this.visible = false;
};

this.show = function() {
this.visible = true;
};

this.toggle = function() {
if(this.visible) {
this.visible = false;
}
else {
this.visible = true;
}
};

this.inHit = function(cx, cy) {
var c = document.createElement("canvas").getContext("2d");
c.font = this.font;
var metrics = c.measureText(this.text);
switch(this.align) {
case "left":
case "start":
if(this.x <	cx && this.x + metrics.width > cx && cy < this.y && this.y - parseInt(this.font.split("px")[0]) < cy) {
return true;	
}
else {
return false;	
}
break;
case "center":
if(this.x <	cx && this.x + (metrics.width/2) > cx && cy < this.y && this.y - (parseInt(this.font.split("px")[0])/2) < cy) {
return true;	
}
else {
return false;	
}
break;
case "right":
case "end":
if(this.x >	cx && this.x - metrics.width < cx && cy < this.y && this.y - parseInt(this.font.split("px")[0]) < cy) {
return true;	
}
else {
return false;	
}
break;
}
};
}

function ImageSprite(img, x, y) {
this.img = img;
this.x = x;
this.y = y;
this.images = [];
this.visible = true;

this.draw = function(game) {
if(this.visible) {
game.can.drawImage(this.img, this.x, this.y);
}
};

this.hide = function() {
this.visible = false;
};

this.show = function() {
this.visible = true;
};

this.toggle = function() {
if(this.visible) {
this.visible = false;
}
else {
this.visible = true;
}
};

this.inHit = function(cx, cy) {
if(this.x <	cx && this.x + this.img.width > cx && cy > this.y && this.y + this.img.height > cy) {
return true;	
}
else {
return false;	
}
};
}

function ImageLoadStack() {
this.images = [];
this.onload = function () { };
this.finished = false; //Are all of the images loaded
this.loaded = 0; //The number of images that are loaded
this.total = 0; //The total number of images, finished or not
this.started = false;
this.progress = 0; //Percentage of loading done
this.onload = function() { };
this.id = RouteEngine.ImageLoaders.length;
RouteEngine.ImageLoaders.push(this);
this.start = function() {
this.started = true;
if(this.total == this.loaded) {
this.finished = true;
this.onload();
}
};

this.addImage = function(src, width, height) {
var img = loadIdImage(src, width, height, "ImageId" + this.id + ":" + this.images.length);
img.addEventListener("load", RouteEngine.IdImageLoaded);
this.images.push(img);
this.total++;
};

this.imageLoaded = function(imgId) {
this.loaded++;
this.progress = Math.round((this.loaded / this.total) * 100);
if(this.total == this.loaded) {
this.finished = true;
this.onload();
}
};

}

function loadIdImage(src, width, height, id) {
var i = new Image(width, height);
i.src = src;
i.id = id;
return i;
}

function loadImage(src, width, height) {
var i = new Image(width, height);
i.src = src;
return i;
}