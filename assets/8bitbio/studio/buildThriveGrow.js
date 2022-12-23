//Copy and paste this into the RouteEngineA1 studio

var TICK_TIME = 300; // amount of milliseconds that go into each tick
var TICKS_IN_CYCLE = 20; // amount of ticks in a cycle
var loopNumber, tickCount, cycleCount;

var FUNGI_COLOR = "#0F0";
var FUNGI_TICKS_TILL_GROWTH = 3; // amount of ticks to pass before growing
var STARTING_FUNGI_POPULATION = 40;
var fungiX = [], fungiY = [], fungiGrowthTicks = []; //An array of all of the fungi entities

var WASTE_COLOR = "#D00";
var WASTE_ATTRACTION_RATE = 2; // pixels per tick that the waste gets attracted to the center
var STARTING_WASTE_AMOUNT = 150; //Amount of waste to be randomly placed at the start
var WASTE_CREATION_CHANCE = 5; // x out of 10 chance that a piece of waste will be created by a living pixel
var WASTE_CREATION_RATE = 20; // number of ticks that go by before trying to make a pixel of waste
var WASTE_RANDOM_FLOAT_SPEED = 3;

var wasteX = [], wasteY =[];

var LIVING_COLOR = "#FF0";
var LIVING_ENERGY_USE_RATE = 1; // energy used per tick
var LIVING_STARTING_ENERGY = 70;
var LIVING_SPEED = 10; // what to multiply the neural output by for movement
var STARTING_LIVING_POPULATION = 100;
var LIVING_NEURON_LAYERS = [4,8,2]; // Please note, the first layer should always have 4 neurons and the last layer has 2 or else you will have to modify the code
var living = []; //An array of all of the living pixels

var FRUIT_COLOR = "#F0F";
var FRUIT_ENERGY_GAIN = 5; //Amount of energy a living pixel gains when it eats a fruit.
var FRUIT_PRODUCTION_CHANCE = 6; // x out of 10 chance that a fruit pixel will be grow on a tick
var fruit = []; //An array of all of the fruit

var worldHeight, worldWidth;
var centerX, centerY;

var wasteColor,livingColor,fruitColor,fungiColor;

var g = new Game(document.getElementById("gamecanvas"));
g.background.type = "color";
g.background.color = "#000";

function stopSimulation() {
	window.clearInterval(loopNumber);
}

function startSimulation() { //Reset and clear everything
	worldHeight = g.c.height;
	worldWidth = g.c.width;
	centerX = Math.round(worldWidth / 2);
	centerY = Math.round(worldHeight / 2);
	tickCount = 0, cycleCount = 0;
	waste = [];
	fungiX = [];
	fungiY = [];
	fungiGrowthTicks = [];
	fruit = [];
	living = [];
	fungiGrowthTicks = [];
	populateLiving();
	populateWaste();
	populateFungi();
	wasteColor = hexToRgb(WASTE_COLOR);
	livingColor = hexToRgb(LIVING_COLOR);
	fruitColor = hexToRgb(FRUIT_COLOR);
	fungiColor = hexToRgb(FUNGI_COLOR);
	loopNumber = window.setInterval(doLoop, TICK_TIME);
}

function doLoop() {
	render();
	update();
	drawUI();
	doTick();
}

function doTick() {
	tickCount++;
	if(tickCount > TICKS_IN_CYCLE) {
		tickCount = 0;
		cycleCount++;
	}
}

function populateLiving() {
	for (var o = 0; o < STARTING_LIVING_POPULATION; o++) {
		living.push(new LivingPixel(g.randomNumber(0, worldWidth), g.randomNumber(0, worldHeight), LIVING_STARTING_ENERGY, true));
	}
}

function populateFungi() {
	for (var o = 0; o < STARTING_FUNGI_POPULATION; o++) {
		addFungus(g.randomNumber(Math.round(worldWidth*0.4),Math.round(worldWidth*0.6)),g.randomNumber(Math.round(worldHeight*0.4),Math.round(worldHeight*0.6)));
	} //Are populated at the center of the world.
}

function populateWaste() {
for (var o = 0; o < STARTING_WASTE_AMOUNT; o++) {
	addWaste(g.randomNumber(Math.round(worldWidth*0.25),Math.round(worldWidth*0.75)),g.randomNumber(Math.round(worldHeight*0.25),Math.round(worldHeight*0.75)));
} //Are populated at the center of the world.
}

function drawUI() {
	g.can.fillStyle = "#FFF";
	g.can.fillText(tickCount, 5,10);
	g.can.fillText(cycleCount, 5, 20);
}

function render() {
	g.render();
	g.drawWaste();
	g.drawLiving();
	g.drawFungi();
	g.drawFruit();
}

function update() {
	var canvasData = g.can.getImageData(0,0,worldWidth, worldHeight);
	for (var i =0; i < waste.length; i++) {
		if (!waste[i].settled) {
			if(nearWaste(waste[i].x,waste[i].y,canvasData.data)) {
				waste[i].settled = true;
				continue;
			}
			var randomFloatX = (Math.random() > 0.5 ? -1 : 1) * Math.round(Math.random() * WASTE_RANDOM_FLOAT_SPEED);
			var randomFloatY = (Math.random() > 0.5 ? -1 : 1) * Math.round(Math.random() * WASTE_RANDOM_FLOAT_SPEED);
			var dX = waste[i].x > centerX ? -1 : 1;
			var dY = waste[i].y > centerY ? -1 : 1;
			dX = waste[i].x == centerX ? 0 : dX;
			dY = waste[i].y == centerY ? 0 : dY;
			waste[i].x += (WASTE_ATTRACTION_RATE * dX) + randomFloatX;
			waste[i].y += (WASTE_ATTRACTION_RATE * dY) + randomFloatY;
		}
	}
	var newFungiX = [], newFungiY = [];
	for (var i=0; i < fungiX.length; i++) {
		if(fungiGrowthTicks[i] > FUNGI_TICKS_TILL_GROWTH) {
			var x = fungiX[i];
			var y = fungiY[i];
			var r = false;
			g.can.fillStyle = FUNGI_COLOR;
			if (!r && getRGBPixelFromData(x+1,y,canvasData.data).equals(wasteColor)) {
				r = true;
				newFungiX.push(x+1);
				newFungiY.push(y);
				removeWasteAt(x+1,y);
			}
			if (!r && getRGBPixelFromData(x,y+1,canvasData.data).equals(wasteColor)) {
				r = true;
				newFungiX.push(x);
				newFungiY.push(y+1);
				removeWasteAt(x,y+1);
			}
			if (!r && getRGBPixelFromData(x-1,y,canvasData.data).equals(wasteColor)) {
				r = true;
				newFungiX.push(x-1);
				newFungiY.push(y);
				removeWasteAt(x-1,y);
			}
			if (!r && getRGBPixelFromData(x,y-1,canvasData.data).equals(wasteColor)) {
				r = true;
				newFungiX.push(x);
				newFungiY.push(y-1);
				removeWasteAt(x,y-1);
			}
			else if(!r && doChanceOutOfTen(FRUIT_PRODUCTION_CHANCE)) {
				if(!nearFruit(x,y,canvasData.data)) {
					fruit.push(new Fruit(x+1,y+1));
					r = true;
				}
			}
			if (r) {
				fungiGrowthTicks[i] = 0;
			}
		}
		else {
			fungiGrowthTicks[i] += 1;
		}
  }

  for(var a=0;a<newFungiX.length;a++) {
    addFungus(newFungiX[a],newFungiY[a]);
  }

  for (var l = 0; l < living.length; l++) {
	if (nearFruit(Math.round(living[l].x), Math.round(living[l].y),canvasData.data)) {
			living[l].energy = living[l].energy + FRUIT_ENERGY_GAIN;
			removeFruitAt(nearestFruit(living[l].x,living[l].y));
	}
	var r = runLivingWeights(living[l]);
	living[l].x += (r[0] * LIVING_SPEED);
	living[l].y += (r[1] * LIVING_SPEED);
	if (living[l].wasteCreationTicks > WASTE_CREATION_RATE) {
		if (doChanceOutOfTen(WASTE_CREATION_CHANCE)) {
			addWaste(Math.round(living[l].x),Math.round(living[l].y));
		}
		living[l].wasteCreationTicks = 0;
	}
	else {
		living[l].wasteCreationTicks++;
	}
  }

  for (var w = 0; w < wasteX.length; w++) {
  	if (wasteX[w] < 0) {
  		wasteX[w] = worldWidth;
  	}
  	if (wasteY[w] < 0) {
  		wasteY[w] = worldHeight;
  	}
  	if (wasteX[w] > worldWidth) {
  		wasteX[w] = 0;
  	}
  	if (wasteY[w] > worldHeight) {
  		wasteY[w] = 0;
  	}
  }

   for (var l = 0; l < living.length; l++) {
	  	if (living[l].x < 0) {
	  		living[l].x = worldWidth;
	  	}
	  	if (living[l].y < 0) {
	  		living[l].y = worldHeight;
	  	}
	  	if (living[l].x > worldWidth) {
	  		living[l].x = 0;
	  	}
	  	if (living[l].y > worldHeight) {
	  		living[l].y = 0;
	  	}
   }
   for (var l = 0; l < living.length; l++) {
   		living[l].energy -= LIVING_ENERGY_USE_RATE;
   		if (living[l].energy <= 0) {
   			addFungus(Math.round(living[l].x), Math.round(living[l].y));
   			living.splice(l, 1);
   			l--;
   		}
   }
}

g.drawWaste = function () {
	g.can.fillStyle = WASTE_COLOR;
	for(var i = 0; i < waste.length; i++) {
		g.can.fillRect(waste[i].x, waste[i].y, 1,1);
	}
};

g.drawLiving = function () {
	g.can.fillStyle = LIVING_COLOR;
	for (var i = 0; i < living.length; i++) {
		g.can.fillRect(Math.round(living[i].x),Math.round(living[i].y), 1, 1);
	}
};

g.drawFungi = function () {
	g.can.fillStyle = FUNGI_COLOR;
	for (var i = 0; i < fungiX.length; i++) {
		g.can.fillRect(fungiX[i],fungiY[i],1,1);
	}
};

g.drawFruit = function () {
	g.can.fillStyle = FRUIT_COLOR;
	for (var i = 0; i < fruit.length; i++) {
		g.can.fillRect(fruit[i].x,fruit[i].y,1,1);
	}
};

function Waste(startX,startY,isSettled) {
	this.x = startX;
	this.y = startY;
	this.settled = isSettled;
}

function LivingPixel(startX, startY, startEnergy, randomized) {
	this.energy = startEnergy;
	this.x = startX;
	this.y = startY;
	this.layers = [];
	this.biases = [];
	this.wasteCreationTicks = 0;
	if (randomized) {
		this.biases = randomSignedFloatArray(totalArray(LIVING_NEURON_LAYERS), 0,1); //bias for each neuron
		for (var i = 0; i < LIVING_NEURON_LAYERS.length-1; i++) { //Ok, so for each layer, except the last one, we need to make connections to the next layer
			var totalWeights = LIVING_NEURON_LAYERS[i] * LIVING_NEURON_LAYERS[i+1];
			this.layers.push(randomSignedFloatArray(totalWeights,0,1));
		}
	}
}

function Fruit(startX,startY) {
	this.x = startX;
	this.y = startY;
}

function addWaste(x,y) {
	waste.push(new Waste(x,y,false));
}

function runLivingWeights(living) {
	var n = nearestFruit(living.x, living.y);
	var dX = (n[0] - living.x) > 0 ? -1 : 1; // -1 if to the left, 1 if to the right
	var dY = (n[1] - living.y) > 0 ? 1 : -1; // 1 if above, -1 if below
	var inputs = [dX * -1, dX * 1, dY * 1, dY * -1]; //left, right, up, down || -1 if false, 1 if true
	for (var i = 0; i < inputs.length; i++) {
		inputs[i] += living.biases[i];
	}
	var lastLayer = inputs;
	var biasIndex = inputs.length;
	for (var l = 0; l < LIVING_NEURON_LAYERS.length-1; l++) { //l is the current weight layer
		var currentNeurons = [];
		for (var n = 0; n < LIVING_NEURON_LAYERS[l+1]; n++) { // l+1 because we are arranging the neurons of the next layer
			currentNeurons.push(living.biases[biasIndex]);
			biasIndex++;
			for (var x = 0; x < lastLayer.length; x++) {
				currentNeurons[n] += lastLayer[x] * living.layers[l][(lastLayer.length * n) + x];
			}
		}
		lastLayer = currentNeurons;
	}
	return lastLayer;
}

function addFungus(x,y) {
	fungiX.push(x);
	fungiY.push(y);
	fungiGrowthTicks.push(0);
}

function removeWasteAt(x,y) {
	for (var i = 0; i < waste.length; i++) {
		if (waste[i].x == x && waste[i].y == y) {
			waste.splice(i, 1);
			return true;
		}
	}
	return false;
}

function removeFruitAt(x,y) {
	for (var i = 0; i < fruit.length; i++) {
		if (fruit[i].x == x && fruit[i].y == y) {
			fruit.splice(i, 1);
			return true;
		}
	}
	return false;
}

function nearestFruit(x,y) {
	var coords = [centerX, centerY];
	var d = 999999999999;
	for (var i = 0; i < fruit.length; i++) {
		var a = Math.abs(x - fruit[i].x);
		var b = Math.abs(y = fruit[i].y);
		var c = Math.sqrt(Math.pow(a,2) + Math.pow(b,2));
		if (c < d) {
			d = c;
			coords = [fruit[i].x,fruit[i].y];
		}
	}
	return coords;
}

function nearWaste(x,y,data) {
	if (getRGBPixelFromData(x+1,y,data).equals(wasteColor)) {
		return true;
	}
	if (getRGBPixelFromData(x,y+1,data).equals(wasteColor)) {
		return true;
	}
	if (getRGBPixelFromData(x-1,y,data).equals(wasteColor)) {
		return true;
	}
	if (getRGBPixelFromData(x,y-1,data).equals(wasteColor)) {
		return true;
	}
	if (getRGBPixelFromData(x-1,y-1,data).equals(wasteColor)) {
		return true;
	}
	if (getRGBPixelFromData(x+1,y-1,data).equals(wasteColor)) {
		return true;
	}
	if (getRGBPixelFromData(x-1,y+1,data).equals(wasteColor)) {
		return true;
	}
	if (getRGBPixelFromData(x+1,y+1,data).equals(wasteColor)) {
		return true;
	}
	return false;
}

function nearFruit(x,y,data) {
	if (getRGBPixelFromData(x+1,y,data).equals(fruitColor)) {
		return true;
	}
	if (getRGBPixelFromData(x,y+1,data).equals(fruitColor)) {
		return true;
	}
	if (getRGBPixelFromData(x-1,y,data).equals(fruitColor)) {
		return true;
	}
	if (getRGBPixelFromData(x,y-1,data).equals(fruitColor)) {
		return true;
	}
	if (getRGBPixelFromData(x-1,y-1,data).equals(fruitColor)) {
		return true;
	}
	if (getRGBPixelFromData(x+1,y-1,data).equals(fruitColor)) {
		return true;
	}
	if (getRGBPixelFromData(x-1,y+1,data).equals(fruitColor)) {
		return true;
	}
	if (getRGBPixelFromData(x+1,y+1,data).equals(fruitColor)) {
		return true;
	}
	return false;
}

function hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, function(m, r, g, b) {
        return r + r + g + g + b + b;
    });

    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
        parseInt(result[1], 16),
        parseInt(result[2], 16),
        parseInt(result[3], 16)
    ] : null;
}

function getRGBPixelFromData(x,y,data) {
	var a = [];
	var index = ((y*worldHeight)+x)*4;
	a.push(data[index]);
	a.push(data[index+1]);
	a.push(data[index+2]);
	return a;
}

function doChanceOutOfTen(x) { // do a random chance, x out of 10 probability
	var c = x/10;
	return c > Math.random();
}

function randomFloatArray(items, min, max) { //return an array of random floats from min to max. max value for max is 100
	var a = [];
	for (var i = 0; i<items; i++) {
		a.push(Math.floor((Math.random()*(max*100))+(min*100))/1000);
	}
	return a;
}

function randomSignedFloatArray(items, min, max) { //return an array of random floats with an abs value from min to max. max value for max is 100
	var a = [];
	for (var i = 0; i<items; i++) {
		a.push((Math.floor((Math.random()*(max*100))+(min*100))/1000) * (Math.random() > 0.5 ? -1 : 1));
	}
	return a;
}

function totalArray(a) {
	var t = 0;
	for (var i = 0; i < a.length; i++) {
		t += a[i];
	}
	return t;
}

// Warn if overriding existing method
if(Array.prototype.equals) {
    console.warn("Overriding existing Array.prototype.equals. Possible causes: New API defines the method, there's a framework conflict or you've got double inclusions in your code.");
}
// attach the .equals method to Array's prototype to call it on any array
Array.prototype.equals = function (array) {
    if (!array) {
        return false;
	}
    if (this.length != array.length) {
        return false;
    }
    for (var i = 0, l=this.length; i < l; i++) {
        if (this[i] instanceof Array && array[i] instanceof Array) {
            if (!this[i].equals(array[i])) {
                return false;
            }
        }
        else if (this[i] != array[i]) {
            // Warning - two different object instances will never be equal: {x:20} != {x:20}
            return false;
        }
    }
    return true;
}
// Hide method from for-in loops
Object.defineProperty(Array.prototype, "equals", {enumerable: false});