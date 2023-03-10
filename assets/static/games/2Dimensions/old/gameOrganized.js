/* 2Dimensions
 * By: Tyler Sengia
 *
 * Coding while jamming to Radical Face, Greg Laswel, cheesy ads, Band of Horses, Cold War Kids, Milky Chance, Lord Huron, Gregory Alan Isakov, Bon Iver, Sea Wolf, Whitley
 */

//
// WARNING WARNING WARNING
// 		THIS IS THE PROTOTYPE GAME. MANY FEATURES ARE UNDER DEVELOPMENT AND TESTING
//

//TODO: Clean up this loading and start-up mess

var GAME_TYPE = 0; // 0 = New Map, 1 = Loaded Map, 2 = Join Server


/**
 * @namespace game
 */
var game = new Game(document.getElementById("gamecanvas")); //Create a new RouteEngineA1 Game

game.setSize(500, 500);

game.background = new Background("color", "#59F"); //Default blue background is #59F
game.render();

game.can.fillStyle = "#FFF";
game.can.fillText("Loading...", 50, 50);
game.loaded = 0
game.needsLoaded = 0;
game.drawGrid = true; //Draw grid should be false in prod, it is only used for testing (for now)
game.INTERVAL_TIME = 50;

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
game.cursor = {
    mScreenBlockX: 0,
    mScreenBlockY: 0,
    mapBlockX: 0,
    mapBlockY: 0,
    block: null
};

game.view = {
    focusX: 0.0,
    focusY: 0.0,
    focusBlockX: 0,
    focusBlockY: 0,
    focusSectorX: 0,
    focusSectorY: 0
};

/**
 * @memberof game
 * @name Game Generation Settings Object
 * @description Holds the global map generation settings for the game
 */
game.generation = {
    GENERATE_WITH_PLAYER: true, //Add another Col if the player sees the edge of the map?
    SECTOR_SIZE: 101, // The height and width of one sector in blocks. This must be an ODD number!
    GENERATION_DISTANCE: 1
};
/**
 * @memberof game
 * @name Section Generation Que
 * @description Holds a list of BlockPosition objects that hold the sector coords that are to be generated with the next game.update() call
 */
game.generation.generationQue = [];

var ils = new ImageLoadStack(); //ImageLoadStack to load in all of the blocks for the game
ils.onload = function() {
    game.images = ils.images; //Hand the images over to the game to keep everything unified
    game.loaded++; //Increment the assets load count
    if (game.loaded == game.needsLoaded) { //If all assets are loaded, start the game
        game.onstart(); //Start the game
    }
}

/**
 * @class
 * @name Block
 * @Default class for a new block
 * @prop {Integer} imageId - The image id of the block
 * @prop {Boolean} solid - A boolean value representing whether or not the block is solid
 */
function Block() {
    this.imageId = 0;
    this.solid = true;
}

/**
 * @memberof game
 * @function
 * @description Loads all of the images, sounds, and other assets at the start of the game
 */
game.loadAssets = function() {
    //IMAGES
    game.needsLoaded++; //Images need to be loaded
    var BLOCK_SIZE = 32; //this is the dimensions of the images. DOES NOT SCALE! Also, the blocks folder should have a directory named the block size (ie the directory holding 32x32px blocks is named "32")
    ils.addImage("../2Dimensions/images/blocks/" + BLOCK_SIZE + "/0.png", BLOCK_SIZE, BLOCK_SIZE); //Load grass
    ils.addImage("../2Dimensions/images/blocks/" + BLOCK_SIZE + "/1.png", BLOCK_SIZE, BLOCK_SIZE); //Load dirt
    ils.addImage("../2Dimensions/images/blocks/" + BLOCK_SIZE + "/2.png", BLOCK_SIZE, BLOCK_SIZE); //Load stone
    ils.addImage("../2Dimensions/images/blocks/" + BLOCK_SIZE + "/3.png", BLOCK_SIZE, BLOCK_SIZE); //Load bush
    ils.start();

    //SOUNDS

    //EXTRA


    //CREATE BLOCKS

    game.blocks = {};
    game.blocks.skyBlock = function SkyBlock() {
        this.imageId = -1;
    };
    game.blocks.grassBlock = function GrassBlock() {
        this.imageId = 0;
    };
    game.blocks.dirtBlock = function DirtBlock() {
        this.imageId = 1;
    };
    game.blocks.stoneBlock = function StoneBlock() {
        this.imageId = 2;
    };
    game.blocks.bushBlock = function BushBlock() {
        this.imageId = 3;
    };
    game.blocks.emptyBlock = function EmptyBlock() {
        this.imageId = -1;
    };
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
            //game.map.sectorRows[0][0].rows[50][50] = new game.blocks.bushBlock();
            game.startLoop(); //Start the actual game
            break;
    }
};

game.generateMap = function() { //TODO: Make a real block generator, this is just for testing
    game.map = new SectoredBlockMap(game.generation.SECTOR_SIZE, game.generation.SECTOR_SIZE, new DefaultWorldGenerator());
    game.map.init();
};

/**
 * @@memberof game
 * @function
 * @description Starts the main game loop
 */
game.startLoop = function() {
    game.interval = window.setInterval(game.loop, game.INTERVAL_TIME);
};

/**
 * @@memberof game
 * @function
 * @description Stops the main game loop
 */
game.stopLoop = function() {
    window.clearInterval(game.interval);
};
Studio.addStopListener(function() {
    game.stopLoop();
});

/**
 * @@memberof game
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
 * @@memberof game
 * @function
 * @description Realigns the global view settings to the position of the player
 */
game.refocusView = function() {
    game.view.focusLocalX = game.player.position.localX;
    game.view.focusLocalY = game.player.position.localY;
    game.view.focusSectorX = game.player.position.sectorX;
    game.view.focusSectorY = game.player.position.sectorY;
};

/**
 * @@memberof game
 * @function
 * @private
 * @description Updates game values to reflect the BlockPosition that the cursor is selecting
 */
game.locateCursor = function() {

    var scrollingX = (game.blockSize) * (Math.abs(game.view.focusLocalX) - Math.floor(Math.abs(game.view.focusLocalX)));
    var scrollingY = (game.blockSize) * (Math.abs(game.view.focusLocalY) - Math.floor(Math.abs(game.view.focusLocalY)));

    var centeringX = (((game.dimensions.renderedBlocksWide - game.dimensions.blocksWide) / 2) * game.blockSize) - (game.dimensions.paddingWidth / 2);
    var centeringY = ((game.dimensions.renderedBlocksHigh - game.dimensions.blocksHigh) / 2) * game.blockSize - (game.dimensions.paddingHeight / 2);

    var totalX = scrollingX + centeringX + game.blockSize;
    var totalY = scrollingY + centeringY;

    game.cursor.mScreenBlockX = Math.floor((game.mouseX + totalX) / game.blockSize);
    game.cursor.mScreenBlockY = Math.floor((game.mouseY + totalY) / game.blockSize);

    game.cursor.mapBlockPosition = game.map.getPositionRelativeTo(new BlockPosition(game.view.focusSectorX, game.view.focusSectorY, Math.floor(game.view.focusLocalX), Math.floor(game.view.focusLocalY)), -1 * (Math.floor((game.dimensions.renderedBlocksWide / 2) + 1) - game.cursor.mScreenBlockX), -1 * ((Math.floor(game.dimensions.renderedBlocksHigh / 2) + 1) - game.cursor.mScreenBlockY));

};

/**
 * @class
 * @global
 * @name BlockPosition
 * @description Represents the location of a block, can be an existing, or nonexistant block.
 * @prop {Integer} sectorX - The sector x-position that the block is located
 * @prop {Integer} sectorY - The sector y-position that the block is located
 * @prop {Number} localX - The local (within the sector) x-position of the block (this can be a decimal!)
 * @prop {Number} localY - The local (within the sector) y-position of the block (this can be a decimal!)
 */
function BlockPosition(sectorX, sectorY, localX, localY) {
    this.sectorX = sectorX;
    this.sectorY = sectorY;
    this.localX = localX;
    this.localY = localY;
}

/**
 * @memberof game
 * @private
 * @function
 * @description Physics, hunger, environmental events are all checked and handled in this function.
 */
game.update = function() { //Physics, hunger, time, events
    if (game.generation.generationQue.length > 0) { // If there are sectors needing to be generated...
        for (var i = 0; i < game.generation.generationQue.length; i++) { // Loop through the requested sectors to be generated
            game.map.generator.generate(game.map, game.generation.generationQue[i].sectorX, game.generation.generationQue[i].sectorY); // Call the map generator to generate each sector
        }
        game.generation.generationQue = []; // Clear the generation que
    }
};

/**
 * @memberof game
 * @private
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
 * @description Renders an array of blocks on the screen (does not adjust to padding or dimensions!)
 * @param {Array} array - An 2D array of blocks to be rendered. 
 */
game.drawArray = function(array) { //Draws an array of blocks, centered according to the padding and dimensions
    for (var r = 0; r < array.length; r++) {
        var row = array[r];
        for (var b = 0; b < row.length; b++) {
            if (row[b].imageId != -1) { //-1 is the image ID for sky blocks
                game.can.drawImage(game.images[row[b].imageId], (game.blockSize * b), (game.blockSize * r));
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
    var scrollingX = (game.blockSize) * (Math.abs(game.view.focusLocalX) - Math.floor(Math.abs(game.view.focusLocalX)));
    var scrollingY = (game.blockSize) * (Math.abs(game.view.focusLocalY) - Math.floor(Math.abs(game.view.focusLocalY)));

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
    var scrollingX = (game.blockSize) * (Math.abs(game.view.focusLocalX) - Math.floor(Math.abs(game.view.focusLocalX)));
    var scrollingY = (game.blockSize) * (Math.abs(game.view.focusLocalY) - Math.floor(Math.abs(game.view.focusLocalY)));

    var centeringX = (((game.dimensions.renderedBlocksWide - game.dimensions.blocksWide) / 2) * game.blockSize) - (game.dimensions.paddingWidth / 2);
    var centeringY = ((game.dimensions.renderedBlocksHigh - game.dimensions.blocksHigh) / 2) * game.blockSize - (game.dimensions.paddingHeight / 2);

    var totalX = scrollingX + centeringX + game.blockSize;
    var totalY = scrollingY + centeringY;

    game.can.translate(totalX, totalY);
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
    var centerPosition = new BlockPosition(game.view.focusSectorX, game.view.focusSectorY, Math.floor(game.view.focusLocalX), Math.floor(game.view.focusLocalY));

    game.drawArray(game.map.getWindow(centerPosition, game.dimensions.renderedBlocksWide, game.dimensions.renderedBlocksHigh));
};

/**
 * @public
 * @class
 * @name Player
 * @constructor
 * @param {String} nick The nickname for the player
 * @prop {String} nickname - The nickname of the player
 * @prop {Number} id - The id of the player
 * @prop {Integer} HP - The current number of health points the player has.
 * @prop {integer} maxHP - The maximum number of health points the player can have.
 * @prop {BlockPosition} position - The current {@link BlockPosition} of the player.
 * @prop {Number} xSpeed - The speed at which the player changes their x position per tick when moving.
 * @prop {Number} ySpeed - The speed at which the player changes their x position per tick when moving.
 */
function Player(nick) {
    this.nickname = nick;
    this.id = 0;
    this.HP = 10;
    this.maxHP = 10;

    this.position = new BlockPosition(0, 0, 0, 0);

    this.dimensions = {
        bWidth: 1,
        bHeight: 3
    };

    this.xSpeed = 4 / game.blockSize;
    this.ySpeed = 4 / game.blockSize;

    this.updateSectorPosition = function() {
        if (this.position.localY < 0) { // If we go above the our previous sector, decrement the sectorY and calculate the new localY
            this.position.sectorY--;
            this.position.localY = game.generation.SECTOR_SIZE + this.position.localY;
        } else if (this.position.localY > game.generation.SECTOR_SIZE) { // If we go below the our previous sector, increment the sectorY and calculate the new localY
            this.position.sectorY++;
            this.position.localY -= game.generation.SECTOR_SIZE;
        }

        if (this.position.localX < 0) { // If we go left of the previous sector, decrement the sectorX and calculate the new localX
            this.position.sectorX--;
            this.position.localX = game.generation.SECTOR_SIZE + this.position.localX;
        } else if (this.position.localX > game.generation.SECTOR_SIZE) { // If we go right of the previous sector, increment the sectorX and calculate the new localX
            this.position.sectorX++;
            this.position.localX -= game.generation.SECTOR_SIZE;
        }
    };

    this.render = function(x, y, g) {
        g.can.fillStyle = "#FF0";
        g.can.fillRect(x, y, g.blockSize, g.blockSize * 3);
    };

    this.goRight = function() {
        this.position.localX += this.xSpeed;
        this.updateSectorPosition();
    };
    this.goLeft = function() {
        this.position.localX -= this.xSpeed;
        this.updateSectorPosition();
    };
    this.goUp = function() {
        this.position.localY -= this.ySpeed;
        this.updateSectorPosition();
    };
    this.goDown = function() {
        this.position.localY += this.ySpeed;
        this.updateSectorPosition();
    };
}

//TODO: Create a MapUtil class with all these methods

/**
 * @global
 * @function
 * @param t A constructor for the blocks/tiles to be created
 * @param w The number of blocks/tiles of type t that will be returned
 * @returns {Array} An array of length w of blocks/tiles of type t
 *
 */
function getTileRow(t, w) { //Creates an array of w tile t objects
    var row = [];
    for (var i = 0; i < w; i++) {
        row.push(new t());
    }
    return row;
}

/**
 * @global
 * @function
 * @param {Array} first
 * @param {Array} last
 * @description Concats two 2D arrays into one 2D array
 * @returns {Array} A 2D array created by concatenating the last array onto the end of the first array
 */
function concatRows(first, last) {
    var a = [];
    for (var r = 0; r < first.length; r++) {
        a[r] = first[r].concat(last[r]);
    }
    return a;
}

/**
  * @class
  * @abstract
  * @name WorldGenerator
  * @description An abstract class to extend to create different sector based world generators.
  */
function WorldGenerator() {
	
	/**
	  * @memberof WorldGenerator
	  * @abstract
	  * @method
	  * @param {SectoredBlockMap} mapM
	  * @param {Number} sectorX
	  * @param {Number} sectorY
	  * @description Generates the sector located at sectorX and sectorY for the given SectoredBlockMap mapM.
	  */
	this.generate = function (mapM, sectorX, sectorY) { };
	
	/**
	  * @memberof WorldGenerator
	  * @abstract
	  * @method
	  * @param {SectoredBlockMap} mapM
	  * @description Generates the origin sector for the given SectoredBlockMap mapM.
	  */
	this.generateOrigin = function (mapM) { };
}

/**
 * @class
 * @description Generates each sector with the bottom half as dirt and the top half as sky blocks. This class extends {@link WorldGenerator}.
 */
function DefaultWorldGenerator() {
    this.solid = game.blocks.dirtBlock;
    this.empty = game.blocks.skyBlock;
    this.generate = function(mapM, sectorX, sectorY) {
        var rows = [];
        for (var r = 0; r < mapM.sectorHeight; r++) {
            var a = [];
            for (var c = 0; c < mapM.sectorWidth; c++) {
                if (r > game.generation.SECTOR_SIZE / 2) {
                    a.push(new this.solid());
                    a[c].number = c;
                } else {
                    a.push(new this.empty());
                    a[c].number = c;
                }
            }
            rows.push(a);
        }
        var bs = new BlockSector();
        bs.rows = rows;
        bs.height = bs.rows.length;
        bs.width = bs.rows[0].length;
        mapM.setSector(bs, sectorX, sectorY);

    };
    this.generateOrigin = function(mapM) {
        var rows = [];
        for (var r = 0; r < mapM.sectorHeight; r++) {
            var a = [];
            for (var c = 0; c < mapM.sectorWidth; c++) {
                if (r > game.generation.SECTOR_SIZE / 2) {
                    a.push(new this.solid());
                    a[c].number = c;
                } else {
                    a.push(new this.empty());
                    a[c].number = c;
                }
            }
            rows.push(a);
        }
        var bs = new BlockSector();
        bs.rows = rows;
        bs.height = bs.rows.length;
        bs.width = bs.rows[0].length;
        mapM.sectorRows[0].push(bs);
    };
}

/**
 * @class
 * @description Generates each sector with just sky blocks. This class extends {@link WorldGenerator}.
 */
function EmptySectorGenerator() {
    this.empty = game.blocks.skyBlock;
    this.generate = function(mapM, sectorX, sectorY) {
        if (sectorX == 0 && sectorY == 0) {
            var rows = [];
            for (var r = 0; r < mapM.sectorHeight; r++) {
                var a = [];
                for (var c = 0; c < mapM.sectorWidth; c++) {
                    a.push(new this.empty());
                }
                rows.push(a);
            }
            var bs = new BlockSector();
            bs.rows = rows;
            bs.height = bs.rows.length;
            bs.width = bs.rows[0].length;
            mapM.setSector(bs, sectorX, sectorY);
        }
    };
    this.generateOrigin = function(mapM) {
        var rows = [];
        for (var r = 0; r < mapM.sectorHeight; r++) {
            var a = [];
            for (var c = 0; c < mapM.sectorWidth; c++) {
                a.push(new this.empty());
                a[c].number = c;
            }
            rows.push(a);
        }
        var bs = new BlockSector();
        bs.rows = rows;
        bs.height = bs.rows.length;
        bs.width = bs.rows[0].length;
        mapM.sectorRows[0].push(bs);
    };
}

/**
 * @name BlockSector
 * @class
 * @description An object representing a sector. Contains all 2D arrays of blocks and any sector-specific information.
 */
function BlockSector() {
    /** 
	  * @field {Array} rows - A 2D array of blocks in the BlockSector 
	  * @memberof BlockSector
      */
    this.rows = [];
}

/**
 * @class SectoredBlockMap
 * @name SectoredBlockMap
 * @constructor
 * @param {Integer} sectorWidth - The number of blocks wide each sector should be (must be odd!)
 * @param {Integer} sectorHeight - The number of blocks high each sector should be (must be odd!)
 * @param {WorldGenerator} worldGenerator - The {@link WorldGenerator} Object to be used for this map
 * @prop {WorldGenerator} generator - The {@link WorldGenerator} to be used for this map
 * @prop {Array} sectorRows - A 2D array of BlockSectors and undefined values that make up the map
 * @prop {Integer} sWidth - A number representing the width of the map in sectors.
 * @prop {Integer} sHeight - A number representing the height of the map in sectors.
 * @prop {Integer} sectorWidth - An odd number representing the width of a sector in blocks
 * @prop {Integer} sectorHeight - An odd number representing the height of a sector in blocks
 * @prop {Integer} sectorCenterX - The index in the center row where the center sector of the map is
 * @prop {Integer} sectorCenterY - The index of the center row where the center sector of the map is
 * @prop {Integer} originSectorX - The x coordinate of the origin sector of the map
 * @prop {Integer} originSectorY - The y coordinate of the origin sector of the map
 * @prop {Integer} sectorRightBound - The x coordinate of the furthest right sector of the map
 * @prop {Integer} sectorLeftBound - The x coordinate of the furthest left sector of the map
 * @prop {Integer} sectorTopBound - The y coordinate of the furthest up sector of the map
 * @prop {Integer} sectorBottomBound - The y coordinate of the furthest down sector of the map
 * 
 */
function SectoredBlockMap(sectorWidth, sectorHeight, worldGenerator) {
    /*
     * The sectorRows in this sector map will create ONE rectangular shape, however, sectors/sector indexes may be filled in as "undefined" allowing gaps to exist in maps.
     *
     * For a SectoredBlockMap and for Sectors:
     *
     * +----------> Right is increasing X (the leftmost sector/block is 0)
     * | Down is increasing Y (The highest sector/block is 0)
     * |
     *\|/
     * *
     */
    this.generator = worldGenerator;
    this.sectorRows = [];
    this.sWidth = 1; //Width and height is in sectors, NOT BLOCKS!
    this.sHeight = 1;
    this.sectorXOffset = 0; //This allows us to add in one sector at a time, we don't need to create a duplicate/empty sector on the other side, simply compensate for the difference
    this.sectorYOffset = 0; //If there is more sectors on the right, sectorXOffset should be negative, more on the left, it should be positive

    this.sectorWidth = sectorWidth;
    if (this.sectorWidth % 2 == 0) {
        this.sectorWidth++; //If the width is not odd, add one to make it odd
    }

    this.sectorHeight = sectorHeight;
    if (this.sectorHeight % 2 == 0) {
        this.sectorHeight++; //If the height is not odd, add one to make it odd
    }

    //Add the origin sector
    this.sectorRows.push(new Array());

    /**
     * @method init
     * @memberof SectoredBlockMap
     * @description Itializes the  map, should be called before the map is used!
     */
    this.init = function() {
        this.generator.generateOrigin(this);
    };

    this.sectorCenterX = ((this.sectorWidth - 1 - this.sectorXOffset) / 2); //For example, width of 3: 3-1 = 2, 2 / 2 = 1, centerX is 1: [0][1][2]
    this.sectorCenterY = ((this.sectorHeight - 1 - this.sectorYOffset) / 2);
    this.originSectorX = 0; //Currently, there is only 1 sector existing, so the origin's index is 0,0
    this.originSectorY = 0;
    this.sectorRightBound = 0; //The X position of the rightmost sector
    this.sectorLeftBound = 0; //The X position of the leftmost sector
    this.sectorTopBound = 0; //The Y position of the topmost sector
    this.sectorBottomBound = 0; //The Y position of the bottommost sector

    /**
     * @method sectorCoordsToSectorIndex
     * @memberof SectoredBlockMap
     * @arg {Number} sectorX
     * @arg {Number} sectorY
     * @description This methods converts x and y coordinates into the indexes in the map's 2D array to access the specified sector.
     * @returns (Object) An object with two properties "sectorXIndex" and "sectorYIndex" that contain the x and y indexes of the sector specified with the x and y coords.
     */
    this.sectorCoordsToSectorIndex = function(sectorX, sectorY) {
        return {
            sectorXIndex: sectorX + this.originSectorX,
            sectorYIndex: sectorY + this.originSectorY
        };
    };

    /**
     * @method getOriginSector
     * @memberof SectoredBlockMap
     * @returns {BlockSector} The origin BlockSector of the map.
     */
    this.getOriginSector = function() {
        return this.sectorRows[this.originSectorY][this.originSectorX]; //Returns the center tile of the map
    };
    this.getOriginSector.bind(this);

    /**
     * @method getSector
	 * @memberof SectoredBlockMap
     * @arg sectorX
     * @arg sectorY
     * @description Returns the BlockSector specified by the sector coords. Will return a BlockSector full of air/empty blocks if the sector doesn't exist!
     * @returns {BlockSector} Returns the BlockSector specified by the sector coords. Will return a BlockSector full of air/empty blocks if the sector doesn't exist!
     *
     */
    this.getSector = function(sectorX, sectorY) {
        if (!this.sectorExists(sectorX, sectorY)) {
            return new BlockSector(this.sectorWidth, this.sectorHeight); //Return a sector of air/empty blocks if the sector doesn't exist
        }
        var i = this.sectorCoordsToSectorIndex(sectorX, sectorY);

        return this.sectorRows[i.sectorYIndex][i.sectorXIndex];
    };

    /**
     * @method sectorInBounds
     * @memberof SectoredBlockMap
     * @arg sectorX
     * @arg sectorY
     * @description Tests to see if the specified sector is within the current bounds of the SectoredBlockMap.
     * @returns {Boolean} true if the sector is within the current bounds, false if not. This does not check to see if the sector exists!
     */
    this.sectorInBounds = function(sectorX, sectorY) { //Checks to see if the given coords point within the current boundaries
        if ((sectorX <= this.sectorRightBound) && (sectorX >= this.sectorLeftBound)) { //Too far to the right
            if ((sectorY >= this.sectorTopBound) && (sectorY <= this.sectorBottomBound)) {
                return true; //Everything checks out, return true
            }
        }
        return false;
    };
    this.sectorInBounds.bind(this);

    /**
     * @method sectorExists
	 * @memberof SectoredBlockMap
     * @arg {Number} sectorX
     * @arg {Number} sectorY
     * @returns {Boolean} True if the sector is within the map bounds and has been generated, false if otherwise.
     */
    this.sectorExists = function(sectorX, sectorY) { //Checks to see if the given coords point to an extisting sector
        if (this.sectorInBounds(sectorX, sectorY)) {
            var i = this.sectorCoordsToSectorIndex(sectorX, sectorY);
            if (this.sectorRows[i.sectorYIndex][i.sectorXIndex] == undefined) {
                return false; //Sector has not been generated/created yet, return false
            } else {
                return true; //Sector has been generated, return true
            }
        }
        return false; //Sector isn't even within the boundaries, return false
    };

    //Return 1 if an old sector was replaced with the new one, return 2 if new sector was in the bounds and replaced an undefinied sector, return 3 if the sector was out of the boundaries and the map's structure had to be changed
    this.setSector = function(newSector, sectorX, sectorY) { //This can replace sectors and also add on new ones
        if (newSector.width != this.sectorWidth || newSector.height != this.sectorHeight) {
            Studio.error("The new sector's dimensions do not match the sector size of the SectoredBlockMap!");
            return false;
        }

        if (this.sectorExists(sectorX, sectorY)) { //Sector already existed, replacing with new Sector, returning 1
            var i = this.sectorCoordsToSectorIndex(sectorX, sectorY);
            this.sectorRows[i.sectorYIndex][i.sectorXIndex] = newSector;
            return 1;
        } else {
            if (this.sectorInBounds(sectorX, sectorY)) { //Ok, the sector is within the bounds, we don't have to do anything to the map structure, just put in the sector, return 2
                var i = this.sectorCoordsToSectorIndex(sectorX, sectorY);
                this.sectorRows[i.sectorYIndex][i.sectorXIndex] = newSector;
                return 2;
            } else {
                //Ok, sector is not in the bounds, we will have to adjust the map to fit it in, returning 3
                if (sectorX > this.sectorRightBound) {
                    console.log("right" + sectorX);
                    var diff = sectorX - this.sectorRightBound;
                    for (var row = 0; row < this.sHeight; row++) {
                        for (var i = 0; i < diff; i++) {
                            this.sectorRows[i].push(undefined);

                        }

                    }
                    this.sectorRightBound += diff;
                    this.sWidth += diff;
                    //When we push elements, the origin sector does not change.
                } else if (sectorX < this.sectorLeftBound) {
                    console.log("left" + sectorX);
                    var diff = this.sectorLeftBound - sectorX;
                    for (var row = 0; row < this.sHeight; row++) {
                        for (var i = 0; i < diff; i++) {
                            this.sectorRows[i].unshift(undefined);
                        }
                    }
                    this.sectorLeftBound -= diff;
                    this.sWidth += diff;
                    this.originSectorX += diff;
                }

                if (sectorY < this.sectorTopBound) {
                    console.log("top" + sectorY);
                    var diff = this.sectorTopBound - sectorY;
                    var blankRow = [];
                    for (var col = 0; col < this.sWidth; col++) {
                        blankRow.push(undefined);
                    }
                    for (var i = 0; i < diff; i++) {
                        this.sectorRows.unshift(blankRow);
                    }
                    this.sHeight += diff;
                    this.originSectorY += diff;
                    this.sectorTopBound -= diff;
                } else if (sectorY > this.sectorBottomBound) {
                    console.log("bottom" + sectorY);
                    var diff = sectorY - this.sectorBottomBound;
                    var blankRow = [];
                    for (var col = 0; col < this.sWidth; col++) {
                        blankRow.push(undefined);
                    }
                    for (var i = 0; i < diff; i++) {
                        this.sectorRows.push(blankRow);
                    }
                    this.sHeight += diff;
                    this.sectorBottomBound += diff;
                }

                var index = this.sectorCoordsToSectorIndex(sectorX, sectorY);
                this.sectorRows[index.sectorYIndex][index.sectorXIndex] = newSector;
                return 3;
            }
        }
    };

    this.getBlockAt = function(blockPosition) {
        return this.getSector(blockPosition.sectorX, blockPosition.sectorY).rows[Math.round(blockPosition.localY)][Math.round(blockPosition.localX)];
    };

    //TODO: Figure out a better OOP way of doing this
    this.setBlockImageAt = function(blockPosition, newImageId) {
        this.getSector(blockPosition.sectorX, blockPosition.sectorY).rows[Math.round(blockPosition.localY)][Math.round(blockPosition.localX)].imageId = newImageId;
    };

    //TODO: Figure out what the below function does and why it even exists....
    this.isInMap = function(blockX, blockY) {
        //blockX and blockY are the distance in blocks from the origin block
        if (!game.generation.GENERATE_WITH_PLAYER) { //if we have an infinite world, we should always have some map for the cursor to land in
            var nX = Math.abs(Math.floor(blockX + this.sectorCenterX));
            var nY = Math.abs(Math.floor(blockY + this.sectorCenterY));
            var sectorX = (nX / this.sectorWidth) - ((nX % this.sectorWidth) * this.sectorWidth);
            var sectorY = (nY / this.sectorHeight) - ((nY % this.sectorHeight) * this.sectorHeight);
            if (this.sectorExists(sectorX, sectorY)) {
                return true;
            } else {
                return false;
            }
        } else {
            return true;
        }
    };
    this.isInMap.bind(this);
    this.setBlockImageAt.bind(this);

    // Get the BlockPosition of the block that is relX to right of and relY below the block given by originPosition
    /**
      * @memberof SectoredBlockMap
      * @method getPositionRelativeTo
      * @description Returns a new {@link BlockPosition} based upon relX blocks left and right and relY blocks up and down from the original {@link BlockPosition} originPosition
      * @param {BlockPosition} originPosition - The position that will be used as a point of reference.
      * @param {Integer} relX - Number of blocks to the right of the point of reference. (left if negative)
      * @param {Integer} relY - Number of blocks below the point of reference (up if negative).
      * @returns {BlockPosition}
      */
    this.getPositionRelativeTo = function(originPosition, relX, relY) {
        var newLocalX = originPosition.localX + relX;
        var newLocalY = originPosition.localY + relY;
        var sectorX = originPosition.sectorX;
        var sectorY = originPosition.sectorY;

        while (newLocalY < 0) {
            sectorY--;
            newLocalY += game.generation.SECTOR_SIZE;
        }

        while (newLocalY > game.generation.SECTOR_SIZE) {
            newLocalY = Math.abs(game.generation.SECTOR_SIZE - newLocalY);
            sectorY++;
        }

        while (newLocalX < 0) {
            sectorX--;
            newLocalX += game.generation.SECTOR_SIZE;
        }

        while (newLocalX > game.generation.SECTOR_SIZE) {
            newLocalX = Math.abs(game.generation.SECTOR_SIZE - newLocalX);
            sectorX++;
        }

        return new BlockPosition(sectorX, sectorY, newLocalX, newLocalY);
    };
    this.getPositionRelativeTo.bind(this);


	/**
	 * @memberof SectoredBlockMap
	 * @method getWindow
	 * @param {BlockPosition} centerPosition - The position of the block that the window is centered around
	 * @param {Integer} width - The number of blocks from left bound to right bound of the window (must be odd!)
	 * @param {Integer} height - The number of blocks from the top bound to the bottom bound of the window (must be odd!)
	 * @description This function takes a center position and dimensions to select an area of blocks from the SectoredBlockMap to return as a 2D array of blocks. It is a way to select all blocks in an area, even if that area contains multiple sectors.
	 * @returns {Array} A 2D array of blocks that are within the window
	 *
	 */
    this.getWindow = function(centerPosition, width, height) { //Height and Width must be odd!
        //centerPoition holds the position of the center block of the window:
        // x is the localX position of the center block
        // y is the localY position of the center block
        // width is the number of blocks from left bound to right bound of the window
        // height is the number of blocks from the top bound to the bottom bound of the window

        //First let's figure out the number rows and columns this window will span

        var localLeftBound = Math.floor((centerPosition.localX - (width / 2)));
        var localRightBound = Math.floor((centerPosition.localX + (width / 2)));
        var localTopBound = Math.floor((centerPosition.localY - (height / 2)));
        var localBottomBound = Math.floor((centerPosition.localY + (height / 2)));

        //Now lets calculate the number of sectors in each direction (other than the given sector) that will need to be added
        var sectorsAbove = 0;
        var sectorsBelow = 0;
        var sectorsLeft = 0;
        var sectorsRight = 0;

        if (localTopBound < 0) {
            sectorsAbove = Math.ceil((localTopBound + game.generation.SECTOR_SIZE) / game.generation.SECTOR_SIZE);
        }
        if (localBottomBound > game.generation.SECTOR_SIZE) {
            sectorsBelow = Math.ceil((localBottomBound - game.generation.SECTOR_SIZE) / game.generation.SECTOR_SIZE)
        }

        if (localLeftBound < 0) {
            sectorsLeft = Math.ceil((localLeftBound + game.generation.SECTOR_SIZE) / game.generation.SECTOR_SIZE);
        }
        if (localRightBound > game.generation.SECTOR_SIZE) {
            sectorsRight = Math.ceil((localRightBound - game.generation.SECTOR_SIZE) / game.generation.SECTOR_SIZE);
        }

        var windowList = []; // The windowList is an array of rows. Each row is an array of blocks. Top left is 0,0, bottom right is length,length
        //Now we will piece together our windowList, we will start from top left, go to the right, and then drop down one sector and repeat until we reach bottom right
        var currentSectorX = centerPosition.sectorX - sectorsLeft;

        for (var currentSectorY = centerPosition.sectorY - sectorsAbove; currentSectorY <= centerPosition.sectorY + sectorsBelow; currentSectorY++) {
            var windowRow = [];
            for (var currentSectorX = centerPosition.sectorX - sectorsLeft; currentSectorX <= centerPosition.sectorX + sectorsRight; currentSectorX++) {
                //We will calculate the center of a large window in terms of blocks (local) relative to the local bounds of the target sector

                var signX = (currentSectorX == centerPosition.sectorX) ? 1 : -1 * (Math.abs(currentSectorX - centerPosition.sectorX) / (currentSectorX - centerPosition.sectorX));
                var signY = (currentSectorY == centerPosition.sectorY) ? 1 : -1 * (Math.abs(currentSectorY - centerPosition.sectorY) / (currentSectorY - centerPosition.sectorY));
                var relativeLocalX = (game.generation.SECTOR_SIZE * (Math.abs(currentSectorX - centerPosition.sectorX))) + (signX * centerPosition.localX);
                var relativeLocalY = (game.generation.SECTOR_SIZE * (Math.abs(currentSectorY - centerPosition.sectorY))) + (signY * centerPosition.localY);
                windowRow.push(this.windowOfSector(new BlockPosition(currentSectorX, currentSectorY, relativeLocalX, relativeLocalY), width, height, game.generation.GENERATE_WITH_PLAYER));
            }
            windowList.push(windowRow);
        }


        //Now we have to merge all of these windows into one big window to return
        var rows = [];
        for (var windowRow = 0; windowRow < windowList.length; windowRow++) { // For each row of windows
            var mergedRows = [];
            for (var windowColumn = 0; windowColumn < windowList[windowRow].length; windowColumn++) { // For each window in a row
                //For each row in a window
                for (var r = 0; r < windowList[windowRow][windowColumn].length; r++) {
                    if (windowColumn != 0) {
                        mergedRows[r] = mergedRows[r].concat(windowList[windowRow][windowColumn][r]);
                    } else {
                        mergedRows[r] = windowList[windowRow][windowColumn][r];
                    }
                }
            }

            if (windowRow != 0) {
                rows = rows.concat(mergedRows);
            } else {
                rows = mergedRows;
            }
        }
        //console.log(rows);
        return rows;
    };

    //This returns a window of the specified sector. Note, it does not include from other sectors. So if the window only include the top right corner of the specified sector, only the top right corner is returned.
    this.windowOfSector = function(centerPosition, width, height, generateIfNeeded) {
        //centerPosition holds the BlockPosition of the center block of the window
        //localX is the x position of the center of the window
        //localY is the y position of the center of the window

        var sector = this.getSector(centerPosition.sectorX, centerPosition.sectorY).rows;
        //First lets calculate the normal boundaries	   
        var localLeftBound = Math.floor((centerPosition.localX - (width / 2)));
        var localRightBound = Math.floor((centerPosition.localX + (width / 2)));
        var localTopBound = Math.floor((centerPosition.localY - (height / 2)));
        var localBottomBound = Math.floor((centerPosition.localY + (height / 2)));

        //Now lets limit the boundaries to the sector bounds
        if (localTopBound < 0) {
            localTopBound = 0;
        }
        if (localBottomBound > game.generation.SECTOR_SIZE) {
            localBottomBound = game.generation.SECTOR_SIZE - 1;
        }

        if (localLeftBound < 0) {
            localLeftBound = 0;
        }
        if (localRightBound > game.generation.SECTOR_SIZE) {
            localRightBound = game.generation.SECTOR_SIZE - 1;
        }

        if (this.sectorExists(centerPosition.sectorX, centerPosition.sectorY)) {
            //Now lets splice the array to get our array to return
            var rows = sector.slice(localTopBound, localBottomBound + 1);
            for (var i = 0; i < rows.length; i++) {
                rows[i] = rows[i].slice(localLeftBound, localRightBound + 1);
            }
            return rows;
        } else {
            //Sector doesnt exist

            if (generateIfNeeded) {
                //Add the non-existant sector to the generation que for the next tick if we are generating as the player moves/this sector needs generated
                game.generation.generationQue.push(centerPosition);
            }

            //In the meantime, lets generate a blank set of blocks to be generated
            var blankRows = [];
            var row = [];
            var h = localBottomBound - localTopBound;
            var w = localRightBound - localLeftBound;
            for (var c = 0; c < w + 1; c++) {
                row.push(new game.blocks.emptyBlock());
            }
            for (var r = 0; r < h + 1; r++) {
                blankRows.push(row);
            }
            return blankRows;
        }
    };

    //Below, allows methods to access their parent
    this.getWindow.bind(this);
    this.sectorExists.bind(this);
    this.setSector.bind(this);
    this.windowOfSector.bind(this);
    this.sectorCoordsToSectorIndex.bind(this);
    this.getSector.bind(this);
}

/**
 * @private
 * @function
 * @description Calls functions based upon keyboard and mouse input
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
        game.player.goUp();
    }
    if (game.inputMatrix.down) {
        game.player.goDown();
    }
    if (game.inputMatrix.leftClick) {
        game.map.setBlockImageAt(game.cursor.mapBlockPosition, -1);
    }
};

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

game.onmousedown = function() {
    game.inputMatrix.leftClick = true;
};

game.onmouseup = function() {
    game.inputMatrix.leftClick = false;
};

game.loadAssets();