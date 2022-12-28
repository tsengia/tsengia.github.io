/* 2Dimensions
 * By: Tyler Sengia
 *
 */

//TODO: Clean up this loading and start-up mess


/**
 * @global
 * @description Variable holding the current game type the player is in. IN DEVELOPMENT
 */
var GAME_TYPE = 0; // 0 = New Map, 1 = Loaded Map, 2 = Join Server

var STUDIO_DEV = false;

var BLOCK_SIZE = 32; //this is the dimensions of the images. DOES NOT SCALE! Also, the blocks folder should have a directory named the block size (ie the directory holding 32x32px blocks is named "32")

var game = {};

function initializeGame() {

	/**
	 * @namespace game
	 * @prop {Boolean} drawGrid - If set to true, the game will render a black border round every block rendered.
	 * @prop {Integer} INTERVAL_TIME - The number of milliseconds between each game tick interval.
	 * @prop {Number} mouseX - The current x position of the user's cursor
	 * @prop {Number} mouseY - The current y position of the user's cursor
	 * @description The "game" object is a Game Object from the RouteEngineA1 javascript engine. See the RouteEngineA1 documentation for more details. RouteEngineA1 should be used for any UI elements, image loading, and sound loading.
	 */
	game = new Game(document.getElementById("gamecanvas")); //Create a new RouteEngineA1 Game

	game.setSize(513, 513);

	game.INTERVAL_TIME = 50;

	game.background = new Background("color", "#59F"); //Default blue background is #59F
	game.render();

	game.can.fillStyle = "#FFF";
	game.can.fillText("Loading...", 50, 50);

	game.loaded = 0;
	game.needsLoaded = 0;
	game.drawGrid = false; //Draw grid should be false in prod, it is only used for testing (for now)

	/**
	 * @memberof game
	 * @description Holds input about user interactions. Not necessarily key presses and mouse clicks, but those can be mapped to here too.
	 * @prop {Boolean} up - True if the user has triggered the "up" action.
	 * @prop {Boolean} down - True if the user has triggered the "down" action.
	 * @prop {Boolean} left - True if the user has triggered the "left" action.
	 * @prop {Boolean} right - True if the user has triggered the "right" action.
	 * @prop {Boolean} space - True if the user has triggered the "space" action.
	 * @prop {Boolean} leftClick - True if the user has triggered the "left click" action.
	 */
	game.inputMatrix = {
		up: false,
		down: false,
		left: false,
		right: false,
		space: false,
		leftClick: false
	};

	game.mouseX = 0;
	game.mouseY = 0;

	/**
	 * @memberof game
	 * @description Holds info about the current position of the user's cursor.
	 * @prop {Integer} mScreenBlockX - The x position of the block the cursor is over on the screen. Relative to the screen, not the map!
	 * @prop {Integer} mScreenBlockY - The y position of the block the cursor is over on the screen. Relative to the screen, not the map!
	 * @prop mapBlockPosition {BlockPosition} - The {@link BlockPosition} that the cursor is currently over. This is based on the {@link SectoredBlockMap}.
	 *
	 */
	game.cursor = {
		mScreenBlockX: 0,
		mScreenBlockY: 0,
		mapBlockPosition: null,
		block: null
	};

	/**
	 * @memberof game
	 * @description Holds information about where the game's viewport/window is located. Basically, the set of coordinates that the user is will be looking at on their window.
	 * @prop {Integer} focusSectorX - The x index of the sector the game window is currently centered over
	 * @prop {Integer} focusSectorY - The y index of the sector the game window is currently centered over
	 * @prop {Number} focusLocalX - The x coordinate of the block in the focused sector that the game window is currently centered over. This can be a decimal!
	 * @prop {Number} focusLocalY - The y coordinate of the block in the focused sector that the game window is currently centered over. This can be a decimal!
	 */
	game.view = {
		focusLocalX: 0.0,
		focusLocalY: 0.0,
		focusSectorX: 0,
		focusSectorY: 0
	};

	/**
	 * @memberof game
	 * @description Holds the global map generation settings for the game
	 * @prop {Boolean} GENERATE_WITH_PLAYER - If set to true, the map will generate a new sector whenever the player can see the edge of the map/an non generated sector. Default: true
	 * @prop {Integer} SECTOR_SIZE - The height and width of one sector in blocks. This must be an ODD number! Default: 101
	 * @prop {Integer} GENERATION_DISTANCE - The number of sectors ahead that the WorldGenerator will generate around the player. Default: 1
	 */
	game.generation = {
		GENERATE_WITH_PLAYER: true, //Add another sector if the player sees the edge of the map?
		SECTOR_SIZE: 101, // The height and width of one sector in blocks. This must be an ODD number!
		GENERATION_DISTANCE: 1
	};

	/**
	 * @memberof game
	 * @description Holds a list of BlockPosition objects that hold the sector coords that are to be generated with the next game.update() call
	 */
	//game.generation.generationQue = [];

	/**
	 * @memberof game
	 * @description Holds a list of all Block objects, indexed by ids (blockList[0] = DirtBlockObject)
	 */
	game.blockList = []; // Holds a list of all Block objects, indexed by ids (blockList[0] = DirtBlockObject)
	game.blockList[0] = new Block(-1, false, "sky"); // Add in the sky block cause its special

	/**
	 * @memberof game
	 * @description Holds a list of all block names and ids, indexed by names (blockIdList["dirt"] = 1)
	 */
	game.blockIdList = []; // Holds a list of all block names and ids, indexed by names (blockIdList["dirt"] = 1)
	game.blockIdList["sky"] = 0; // Add in the sky block cause its special


	game.ils = new ImageLoadStack(); //ImageLoadStack to load in all of the blocks for the game
	game.ils.onload = function() {
		game.images = game.ils.images; //Hand the images over to the game to keep everything unified
		game.loaded++; //Increment the assets load count
		if (game.loaded == game.needsLoaded) { //If all assets are loaded, start the game
			game.onstart(); //Start the game
		}
	}

	/**
	 * @memberof game
	 * @method addBlock
	 * @description This method is for registering normal sized blocks (square, taking up 1 tile) into the game. It enters the image to be loaded, assigns the image ID, and registers its name and ID into the blockList and blockIdList arrays.
	 * @param {String} src - The URI of the image for this block
	 * @param {Boolean} solid - If true, this block will be treated as a solid. If false, projectiles and entities will be able to pass through it.
	 * @param {String} name - The canonical name of this block ("dirt", "grass", "stone")
	 * @returns {Integer} The Block ID of this block. This will represent the block in the {@link BlockMap}.
	 */
	game.addBlock = function(src, solid, name) {
		game.blockIdList[name] = game.blockList.length; // Store the name of the block and its ID
		game.blockList.push(new Block(game.ils.addImage(src, BLOCK_SIZE, BLOCK_SIZE), solid, name)); // Enter the image to be loaded and use the returned ID to set the image ID of the block, and push it into the array of blocks indexed by IDs
		return game.blockList.length - 1; // Return the Block ID
	};

	/**
	 * @memberof game
	 * @function
	 * @description Loads all of the images, sounds, and other assets at the start of the game
	 */
	game.loadAssets = function() {
		//IMAGES
		game.needsLoaded++; //Images need to be loaded
		game.addBlock("../2Dimensions/images/blocks/" + BLOCK_SIZE + "/0.png", true, "grass");
		game.addBlock("../2Dimensions/images/blocks/" + BLOCK_SIZE + "/1.png", true, "dirt"); //Load dirt
		game.addBlock("../2Dimensions/images/blocks/" + BLOCK_SIZE + "/2.png", true, "stone"); //Load stone
		game.addBlock("../2Dimensions/images/blocks/" + BLOCK_SIZE + "/3.png", true, "bush"); //Load bush

		game.ils.start();
	};

	/** 
	 * @memberof game
	 * @function
	 * @description Initializes values, clears the screen, calls map generation, and calls for the game loop to start
	 */
	game.onstart = function() { //When the game starts...
		game.render(); //Clear the canvas with the blue sky
		game.blockSize = game.images[0].width; //Set the blocksize
		game.dimensions = game.calculateDimensions(game.cW, game.cH, game.blockSize); //Calculate the dimensions

		switch (GAME_TYPE) { //Switch to the game mode (note: mostly just for testing, remove in prod)
			case (0): //0 is single-player offline
				game.generateMap(); //Create the map
				game.player = new Player("Bob");
				game.view.position = new BlockPosition(game.player.position.sectorX, game.player.position.sectorY, game.player.position.localX, game.player.position.localY);
				//game.map.sectorRows[0][0].rows[50][50] = new game.blocks.bushBlock();
				game.startLoop(); //Start the actual game
				break;
		}
	};

	/**
	 * @memberof game
	 * @function
	 * @description Generates the map and initializes it
	 */
	game.generateMap = function() {
		game.map = new SectoredBlockMap(game.generation.SECTOR_SIZE, game.generation.SECTOR_SIZE, new SuperFlatGrassWorldGenerator());
		game.map.init();
	};

	/**
	 * @memberof game
	 * @function
	 * @description Starts the main game loop
	 */
	game.startLoop = function() {
		game.interval = window.setInterval(game.loop, game.INTERVAL_TIME);
	};

	/**
	 * @memberof game
	 * @function
	 * @description Stops the main game loop
	 */
	game.stopLoop = function() {
		window.clearInterval(game.interval);
	};

	if (STUDIO_DEV) {
		Studio.addStopListener(function() {
			game.stopLoop();
		});
	}

	/**
	 * @memberof game
	 * @protected
	 * @function
	 * @description Called at the start of the game to calculate padding values and the amount of blocks that fit on the screen
	 * @returns An object containing the values it calculated. You really don't need to know the specifics, this is a core function that should never be modified.
	 */
	game.calculateDimensions = function(width, height, blockSize) {
		var paddingWidth = width % blockSize;
		var paddingHeight = height % blockSize;
		var blocksWide = (width - paddingWidth) / blockSize;
		var blocksHigh = (height - paddingHeight) / blockSize;

		var renderedBlocksWide = (blocksWide % 2 == 0) ? blocksWide + 3 : blocksWide + 4; //Number of blocks that have to rendered on the screen (must be odd)
		var renderedBlocksHigh = (blocksHigh % 2 == 0) ? blocksHigh + 3 : blocksHigh + 4; // and + 2 for odds as it means that the blocks fit perfectly, but we need a buffer
		return {
			"blocksWide": blocksWide,
			"blocksHigh": blocksHigh,
			"paddingWidth": paddingWidth,
			"paddingHeight": paddingHeight,
			"renderedBlocksWide": renderedBlocksWide,
			"renderedBlocksHigh": renderedBlocksHigh
		};
	};

	/**
	 * @memberof game
	 * @function
	 * @callback
	 * @description The main loop for the game.
	 */
	game.loop = function() {
		game.locateCursor();
		game.handleInput();
		game.update();
		game.refocusView();
		game.render(); //Draw the background, this is a RouteEngineA1 built in function
		game.drawEverything(); //Draw the tiles, sprites, etc
	};

	/**
	 * @memberof game
	 * @function
	 * @description Realigns the global view settings to the position of the player
	 */
	game.refocusView = function() {
		game.view.position = new BlockPosition(game.player.position.sectorX, game.player.position.sectorY, game.player.position.localX, game.player.position.localY);
	};

	/**
	 * @memberof game
	 * @private
	 * @function
	 * @description Physics, hunger, environmental events are all checked and handled in this function.
	 */
	game.update = function() { //Physics, hunger, time, events
		if (game.map.generationQue.length > 0) { // If there are sectors needing to be generated...
			for (var i = 0; i < game.map.generationQue.length; i++) { // Loop through the requested sectors to be generated
				game.map.generator.generate(game.map, game.map.generationQue[i].sectorX, game.map.generationQue[i].sectorY); // Call the map generator to generate each sector
				console.log("GEN CALLED");
			}
			game.map.generationQue = []; // Clear the generation que
		}
		game.player.update();
		
		
	};
	
	game.physics = {};
    game.physics.blockSolidAt = function (blockPosition) {
        return game.blockList[game.map.getBlockIdAt(blockPosition)].solid;
    };
    game.physics.blockSolidAt.bind(game);
	
	
	game.physics.playerAboveSolidBlock = function (p) {
		 if(p.dimensions.bWidth < 1) { //Only need to worry about two positions
            var farRight = game.map.getPositionRelativeTo(p.position, p.dimensions.bWidth, 1);
            var farLeft = game.map.getPositionRelativeTo(p.position, 0, 1);
            
            return game.physics.blockSolidAt(farRight) || game.physics.blockSolidAt(farLeft);
            
		 }
		 else { //Need to worry about multiple positions (the ends and the blocks inbetween)
            return false;	  
		 }
		 
		 
		 /*var t = false;
		 if ((Math.floor(blockPosition.localX) == blockPosition.localX)) {
		 	return game.blockList[game.map.getBlockIdAt(game.map.getPositionRelativeTo(blockPosition, 0, 1))].solid;
		 }
         
		 else { // Directly below and to the left below
		 	var direct = Math.round(blockPosition.localX) - blockPosition.localX < 0 ? -1 : 1;
		 	return game.blockList[game.map.getBlockIdAt(game.map.getPositionRelativeTo(blockPosition, 0, 1))].solid || game.blockList[game.map.getBlockIdAt(game.map.getPositionRelativeTo(blockPosition, direct, 1))].solid;
		 } */
		 
		 /*
		 else if (game.player.position.localX - Math.floor(game.player.position.localX) < 0) { // Directly below and to the right below
		 	return game.blockList[game.map.getBlockIdAt(game.map.getPositionRelativeTo(blockPosition, 0, 1))].solid || game.blockList[game.map.getBlockIdAt(game.map.getPositionRelativeTo(blockPosition, 1, 1))].solid;
		 }
		 else { // Directly below and to the left below
		 	return game.blockList[game.map.getBlockIdAt(game.map.getPositionRelativeTo(blockPosition, 0, 1))].solid || game.blockList[game.map.getBlockIdAt(game.map.getPositionRelativeTo(blockPosition, -1, 1))].solid;
		 }*/
		  
	};
	game.physics.playerAboveSolidBlock.bind(game);
	
	game.physics.belowSolidBlock = function (blockPosition) {
		var t = false;
		 if ((Math.floor(blockPosition.localX) == blockPosition.localX)) {
		 	return game.blockList[game.map.getBlockIdAt(game.map.getPositionRelativeTo(blockPosition, 0, -1))].solid;
		 }
		 else if (blockPosition.localX - Math.floor(blockPosition.localX) < 0) {
		 	return game.blockList[game.map.getBlockIdAt(game.map.getPositionRelativeTo(blockPosition, 0, -1))].solid || game.blockList[game.map.getBlockIdAt(game.map.getPositionRelativeTo(blockPosition, 1, -1))].solid;
		 }
		 else {
		 	return game.blockList[game.map.getBlockIdAt(game.map.getPositionRelativeTo(blockPosition, 0, -1))].solid || game.blockList[game.map.getBlockIdAt(game.map.getPositionRelativeTo(blockPosition, -1, -1))].solid;
		 }
		  
	};
	game.physics.belowSolidBlock.bind(game);

	/**
	 * @memberof game
	 * @function
	 * @description Renders an array of blocks on the screen (does not adjust to padding or dimensions!)
	 * @param {Array} array - An 2D array of blocks to be rendered. 
	 */
	game.drawArray = function(array) { //Draws an array of blocks, centered according to the padding and dimensions
		
		for (var r = 0; r < array.length; r++) {
			var row = array[r];
			for (var b = 0; b < row.length; b++) {
				if (game.blockList[row[b]].imageId != -1) { //-1 is the image ID for sky blocks
					game.can.drawImage(game.images[game.blockList[row[b]].imageId], (game.blockSize * b), (game.blockSize * r));
				}

				if (game.drawGrid) { //Draws a black grid over the blocks, if the flag is set
					game.can.strokeRect((game.blockSize * b), (game.blockSize * r), game.blockSize, game.blockSize);
				}
			}
		}
	};

	/**
	 * @private
	 * @function
	 * @description Draws a black border for padding, usually disabled
	 */
	game.drawPadding = function() { //Draws the black border for the padding, not drawn by default
		game.can.fillStyle = "#000";
		game.can.fillRect(0, 0, game.dimensions.paddingWidth / 2, game.cH);
		game.can.fillRect(game.cW - game.dimensions.paddingWidth / 2, 0, game.cW, game.cH);
		game.can.fillRect(0, 0, game.cW, game.dimensions.paddingHeight / 2);
		game.can.fillRect(0, game.cH - game.dimensions.paddingHeight / 2, game.cW, game.dimensions.paddingHeight / 2);
	};

	/**
	 * @memberof game
	 * @function
	 * @description Renders the cursor on the game screen.
	 */
	game.drawCursor = function() {
		var cX = game.cursor.mScreenBlockX * game.blockSize;
		var cY = game.cursor.mScreenBlockY * game.blockSize;

		game.can.strokeStyle = "#F00";
		game.can.strokeRect(cX, cY, game.blockSize, game.blockSize);
		game.can.strokeRect(cX + (game.blockSize / 4), cY + (game.blockSize / 4), game.blockSize * 0.5, game.blockSize * 0.5);
		game.can.strokeStyle = "#000";
	};

	/**
	 * @private
	 * @function
	 * @description Grabs a ViewWindow of the current focus point and renders it on the game screen.
	 */
	game.drawTiles = function() {
		//Focus variable is to emphasize that we are focusing on a position, not always the player
		var centerPosition = new BlockPosition(game.player.position.sectorX, game.player.position.sectorY, Math.floor(game.player.position.localX), Math.floor(game.player.position.localY));
		var win = game.map.getWindow(centerPosition, game.dimensions.renderedBlocksWide, game.dimensions.renderedBlocksHigh);
		//console.log(win.length, win[0].length);
		game.drawArray(win);
	};

	/**
	 * @memberof game
	 * @function
	 * @description Draws EVERYTHING. Blocks, cursor, and player. Scrolling and padding is taken into account.
	 */
	game.drawEverything = function() {
		//Note: Sprites and background are already drawn by game.render()
		//Draw everything that is tile bound, then translate according to the localX and localY (scrolling effect), then draw the player
		game.translateView();
		game.drawTiles();
		game.drawCursor();
		game.unTranslateView();
		game.player.render((game.cW / 2) - (game.blockSize / 2), (game.cH / 2) - ((3 * game.blockSize / 2)), game);
	};

	/**
	 * @memberof game
	 * @function
	 * @description Translates the game canvas according to scrolling and padding
	 */
	game.translateView = function() { // This function translates the currently drawn canvas to the perspective of the localX and localY (scrolling effect)
		var scrollingX = (game.blockSize) * (Math.abs(game.view.position.localX) - Math.floor(Math.abs(game.view.position.localX)));
		var scrollingY = (game.blockSize) * (Math.abs(game.view.position.localY) - Math.floor(Math.abs(game.view.position.localY)));

		var centeringX = (((game.dimensions.renderedBlocksWide - game.dimensions.blocksWide) / 2) * game.blockSize) - (game.dimensions.paddingWidth / 2);
		var centeringY = ((game.dimensions.renderedBlocksHigh - game.dimensions.blocksHigh) / 2) * game.blockSize - (game.dimensions.paddingHeight / 2);

		var totalX = scrollingX + centeringX + game.blockSize;
		var totalY = scrollingY + centeringY;
		game.can.translate(-totalX, -totalY);
	};

	/**
	 * @function
	 * @memberof game
	 * @description Un-translates the canvas after being translated by the {@link game.translateView} function.
	 */
	game.unTranslateView = function() {
		var scrollingX = (game.blockSize) * (Math.abs(game.view.position.localX) - Math.floor(Math.abs(game.view.position.localX)));
		var scrollingY = (game.blockSize) * (Math.abs(game.view.position.localY) - Math.floor(Math.abs(game.view.position.localY)));

		var centeringX = (((game.dimensions.renderedBlocksWide - game.dimensions.blocksWide) / 2) * game.blockSize) - (game.dimensions.paddingWidth / 2);
		var centeringY = ((game.dimensions.renderedBlocksHigh - game.dimensions.blocksHigh) / 2) * game.blockSize - (game.dimensions.paddingHeight / 2);

		var totalX = scrollingX + centeringX + game.blockSize;
		var totalY = scrollingY + centeringY;

		game.can.translate(totalX, totalY);
	};

	game.onmousedown = function() {
		game.inputMatrix.leftClick = true;
	};

	game.onmouseup = function() {
		game.inputMatrix.leftClick = false;
	};

	/**
	 * @protected
	 * @function
	 * @description Calls functions based upon the current state of {@link game.inputMatrix}
	 *
	 */
	game.handleInput = function() {
		if (game.inputMatrix.left) {
			game.player.goLeft();
		}
		if (game.inputMatrix.right) {
			game.player.goRight();
		}
		if (game.inputMatrix.up) {
			if (game.player.gravity && !game.player.noClipMode) { // Player must jump
				if (game.player.canJump) {
					game.player.jump();
				}
			}
			else { // Player can fly
				game.player.goUp();
			}
		}
		if (game.inputMatrix.down) {
			if (!game.player.gravity || game.player.noClipMode) {
				game.player.goDown();
			}
		}
		if (game.inputMatrix.leftClick) {
			game.map.setBlockIdAt(game.cursor.mapBlockPosition, game.blockIdList["sky"]);
			console.log(game.cursor.mapBlockPosition);
		}
	};

	/**
	 * @memberof game
	 * @function
	 * @protected
	 * @description Updates game values to reflect the BlockPosition that the cursor is selecting
	 */
	game.locateCursor = function() {
		
		var scrollingX = ((game.blockSize) * (Math.abs(game.view.position.localX) - Math.floor(Math.abs(game.view.position.localX))));
		var scrollingY = (game.blockSize) * (Math.abs(game.view.position.localY) - Math.floor(Math.abs(game.view.position.localY)));

		var centeringX = (((game.dimensions.renderedBlocksWide - game.dimensions.blocksWide) / 2) * game.blockSize) - (game.dimensions.paddingWidth / 2);
		var centeringY = ((game.dimensions.renderedBlocksHigh - game.dimensions.blocksHigh) / 2) * game.blockSize - (game.dimensions.paddingHeight / 2);

		var totalX = scrollingX + centeringX + game.blockSize;
		var totalY = scrollingY + centeringY;

		game.cursor.mScreenBlockX = Math.floor((game.mouseX + totalX) / game.blockSize);
		game.cursor.mScreenBlockY = Math.floor((game.mouseY + totalY) / game.blockSize);

		//Alright, to figure out the actual BlockPosition of the cursor, lets figure out how many x and y blocks away from the Player's position we are
		//First, we need to figure out what SCREEN block the player is always rendered on. This changes slightly based upon the amount of scrolling we have going on
		//Once we figure that out, then we figure out the horizontal number of blocks different the mScreenBlockX is from the Player's screen X and do the same with mScreenBlockY and player's screen Y
		//Then we use game.map.getPositonRelativeTo(Player.position, xDiff, yDiff) to get the BlockPosition of the cursor.
		var playerScreenBlockX = (Math.floor((game.dimensions.renderedBlocksWide - 1) / 2) + 1) + Math.round(scrollingX/game.blockSize);
		var playerScreenBlockY = Math.floor((game.dimensions.renderedBlocksHigh - 1) / 2) + 1  + Math.round(scrollingY/game.blockSize);
		
		var xDiff = game.cursor.mScreenBlockX - playerScreenBlockX;
		var yDiff = game.cursor.mScreenBlockY - playerScreenBlockY;
		
		game.cursor.mapBlockPosition = game.map.getPositionRelativeTo(game.view.position, xDiff, yDiff);

		/*
		game.cursor.mapBlockPosition = game.map.getPositionRelativeTo(new BlockPosition(game.view.position.sectorX, game.view.position.sectorY, Math.floor(game.view.position.localX), Math.floor(game.view.position.localY)), -1 * (Math.floor((game.dimensions.renderedBlocksWide / 2) + 1) - game.cursor.mScreenBlockX), -1 * ((Math.floor(game.dimensions.renderedBlocksHigh / 2) + 1) - game.cursor.mScreenBlockY));
		*/
	};

	game.loadAssets();
}


window.onkeydown = function(event) {
	var k = String.fromCharCode(event.keyCode);
	if (k == 'D') {
		game.inputMatrix.right = true;
	}
	if (k == 'A') {
		game.inputMatrix.left = true;
	}
	if (k == 'W') {
		game.inputMatrix.up = true;
	}
	if (k == 'S') {
		game.inputMatrix.down = true;
	}
	if (k == ' ') {
		game.inputMatrix.space = true;
	}
};

window.onkeyup = function(event) {
	var k = String.fromCharCode(event.keyCode);
	if (k == 'D') {
		game.inputMatrix.right = false;
	}
	if (k == 'A') {
		game.inputMatrix.left = false;
	}
	if (k == 'W') {
		game.inputMatrix.up = false;
	}
	if (k == 'S') {
		game.inputMatrix.down = false;
	}
	if (k == ' ') {
		game.inputMatrix.space = false;
	}
};

document.onload = initializeGame();