1
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
 * @prop {BlockPosition} position - The current {@link BlockPosition} of the player. This is the {@link BlockPosition} of the player's feet.
 * @prop {Number} xSpeed - The speed at which the player changes their block x position per tick when moving.
 * @prop {Number} ySpeed - The speed at which the player changes their block y position per tick when moving.
 */
function Player(nick) {
    this.nickname = nick;
    this.id = 0;
    this.HP = 10;
    this.maxHP = 10;
    this.noClipMode = false; // If set to true, the player ignores gravity, fluids, explosions, solid blocks. Player can move freely without limits
    this.gravity = true; // If set to true, player will fall at twice ySpeed until they land on a block
    this.canJump = true; // Player can only jump if not already in the air or jumping
	this.jumpingTicks = 0; // Number of ticks the player still has left in their jump. If 0, then the player is not jumping at all

    this.position = new BlockPosition(0, 0, 50, 50); // This block position is the position of the bottom-most, left corner block of the player entity. (their feet block)
    
    this.update = function () {
		if (!this.noClipMode) {
			if (this.gravity) {
				if (this.jumpingTicks > 0) {
					if (!game.physics.belowSolidBlock(game.map.getPositionRelativeTo(this.position, 0, -2 + (-3*this.speed.yBlockSpeed)))) {
						this.position.localY -= 3*this.speed.yBlockSpeed;
						this.jumpingTicks--;
					}
					else {
						this.position.localY = Math.floor(this.position.localY); // Player is hitting their head on a block above them, so make sure the player actually reaches the block and doesnt cut short (mining stairs logic)
						this.jumpingTicks = 0;					
					}
				}
				else {
					/*if (!game.physics.aboveSolidBlock(this.position)) {
						this.position.localY += 2*this.speed.yBlockSpeed;
						this.canJump = false;
					}*/
					
					if (!game.physics.playerAboveSolidBlock(this)) {
					   this.position.localY += 2*this.speed.yBlockSpeed;
					   this.canJump = false;
					}
					else {
						this.canJump = true; // Player is on top of a solid block, so allow the player to jump now
						if (this.position.localY > Math.floor(this.position.localY)) { //Player landed on a solid block, so lets ensure that the player is directly on top of the block and not floating on top of the block
							this.position.localY = Math.ceil(this.position.localY);
						}
					}
				}
			}
		}    	
    };
    
    
    /**
      * @function
      * @memberof Player
      * @param {Object} entity - The entity that is being tested to see if testPosition is within its hitbox
      * @param {BlockPosition} testPosition - The {@link BlockPosition} that represents the position that is being tested to see if it is within the entity's hitbox
      * @returns {Boolean} True if the BlockPosition is within the target entity's hitbox. False otherwise.
      * @description This function tests to see if the given BlockPosition is within the target entity's hitbox. Takes into account sectors!
      *
      */
    this.positionInHitBox = function (entity, testPosition) {
    	
		if (entity.position.sectorX == testPosition.sectorY && entity.position.sectorY == testPosition.sectorY) {
			//Great, they're in the same sector! Let's test it.
			if (entity.position.localX <= testPosition.localX && entity.position.localX + entity.dimensions.bWidth >= testPosition.localX) {
				//Ok, within the needed X range, lets test Y
				if (entity.position.localY >= testPosition.localY && entity.position.localY - entity.dimensions.bHeight <= testPosition.localY) {
					return true;
				}
			}
			return false;
		}    	
    	else {
    	//First let's make sure that this is even remotely near the entity by checking how many sectors its away
    	if (Math.sqrt(Math.pow(testPosition.sectorX - entity.position.sectorX, 2) + Math.pow(testPosition.sectorY - entity.position.sectorY, 2)) <= 1) {
        		//Ok fine, it's close enough to waste the CPU time to check if its in the hitbox
    	    	var leftBound = new BlockPosition(entity.position.sectorX, entity.position.sectorY, entity.position.localX, entity.position.localY); //Left bound is the sectorX and localX, needs no modification
    	    	var rightBound = game.map.getPositionRelativeTo(new BlockPosition(entity.position.sectorX, entity.position.sectorY, entity.position.localX, entity.position.localY), entity.dimensions.bWidth, 0); //Right bound is the sectorX and localX plus the width of the entity
    	    	var topBound = game.map.getPositionRelativeTo(new BlockPosition(entity.position.sectorX, entity.position.sectorY, entity.position.localX, entity.position.localY), 0, -1 * entity.dimensions.bHeight); //Top bound is the sectorY and localY minus the height of the entity
    	    	var bottomBound = new BlockPosition(entity.position.sectorX, entity.position.sectorY, entity.position.localX, entity.position.localY); //Bottom bound is the sectorY and localY, needs no modification
    
        		//Test each bound to see if the testPosition violates any requirements of the position. If it doesn't violate any requirements, then it must be in the hitbox, so return true.
        		if (leftBound.sectorX > testPosition.sectorX) {
        			return false;	
        		}
        		else if (leftBound.sectorX == testPosition.sectorX) {
        			if (leftBound.localX > testPosition.localX) {
        				return false;
        			}
        		}
        		
    			if (rightBound.sectorX < testPosition.sectorX) {
    				return false;
    			}
    			else if (rightBound.sectorX == testPosition.sectorX) {
    				if (rightBound.localX < testPosition.sectorX) {
    					return false;
    				}
    			}    		
        		
    			if (topBound.sectorY > testPosition.sectorY) {
    				return false;
    			}    		
    			else if (topBound.sectorY == testPosition.sectorY) {
    				if (topBound.localY > testPosition.localY) {
    					return false;
    				}
    			}
    			
    			if (bottomBound.sectorY < testPosition.sectorY) {
    				return false;
    			}
    			else if (bottomBound.sectorY == testPosition.sectorY) {
    				if (bottomBound.localY < testPosition.sectorY) {
    					return false;
    				}
    			}    
    			
        		return true;
        	}
        	else {
        		return false;
        	}
        }
    };
    

    this.dimensions = {
        bWidth: 0.5,
        bHeight: 3
    };

    this.speed = {
        xBlockSpeed: 0.125,
        yBlockSpeed: 0.125,
        xSpeed: this.xBlockSpeed * game.blockSize,
        ySpeed: this.yBlockSpeed * game.blockSize
    };
    
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
        g.can.fillRect(x, y, this.dimensions.bWidth * g.blockSize, g.blockSize * this.dimensions.bHeight);
        g.can.fillStyle = "#F00";
        g.can.beginPath();
        g.can.arc(x,y,4,0,2 * Math.PI);
        g.can.fill();
    };

    this.goRight = function() {
		if (this.noClipMode || (
!game.blockList[game.map.getBlockIdAt(game.map.getPositionRelativeTo(this.position, this.dimensions.bWidth + this.speed.xBlockSpeed/2, 0))].solid && 
		!game.blockList[game.map.getBlockIdAt(game.map.getPositionRelativeTo(this.position, this.dimensions.bWidth + this.speed.xBlockSpeed/2, -1))].solid &&
 !game.blockList[game.map.getBlockIdAt(game.map.getPositionRelativeTo(this.position, this.dimensions.bWidth + this.speed.xBlockSpeed/2, -2))].solid
)) {
			
    	
        this.position.localX += this.speed.xBlockSpeed;
        this.updateSectorPosition();
 	   }
    };
    
   this.goLeft = function() {
		if (this.noClipMode || (
!game.blockList[game.map.getBlockIdAt(game.map.getPositionRelativeTo(this.position, -this.speed.xBlockSpeed, 0))].solid
 && !game.blockList[game.map.getBlockIdAt(game.map.getPositionRelativeTo(this.position, -this.speed.xBlockSpeed, -1))].solid 
&& !game.blockList[game.map.getBlockIdAt(game.map.getPositionRelativeTo(this.position, -this.speed.xBlockSpeed, -2))].solid
)) {
			
    	
        this.position.localX -= this.speed.xBlockSpeed;
        this.updateSectorPosition();
 	   }
    };
    
    this.goUp = function() {
        this.position.localY -= this.speed.yBlockSpeed;
        this.updateSectorPosition();
    };
    
    this.goDown = function() {
        this.position.localY += this.speed.yBlockSpeed;
        this.updateSectorPosition();
    };
    
    this.jump = function () {
    	if (this.canJump) {
	    	//this.position.localY -= 24*this.speed.yBlockSpeed;
	    	//this.updateSectorPosition();
	    	this.canJump = false;
	    	this.jumpingTicks = 6;
	    }
    };
}
