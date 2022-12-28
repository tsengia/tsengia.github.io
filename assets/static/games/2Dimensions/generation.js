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
 * @description Generates each sector as either sky, sky+grass+dirt, or just dirt based upon the relation to the origin sector. This class extends {@link WorldGenerator}.
 */
function SuperFlatGrassWorldGenerator() {
    this.dirt = game.blockIdList["dirt"];
    this.empty = game.blockIdList["sky"];
    this.grass = game.blockIdList["grass"];
    
    this.generate = function(mapM, sectorX, sectorY) {
	    var rows = [];
	    console.log(mapM.originSectorY + " and  " + sectorY);
		if (mapM.originSectorY == sectorY) { // At the grass line
			console.log("AT");
			var lastLayer = this.empty + 0;
			for (var r = 0; r < mapM.sectorHeight; r++) {
				var a = [];
				if (r > game.generation.SECTOR_SIZE / 2) {
	                	if (lastLayer == (this.empty + 0)) {
	                		for (var c = 0; c < mapM.sectorWidth; c++) {
	                			a.push(this.grass);
	            			}
	                		lastLayer = this.grass + 0;
	                	}
	                	else {
	                    	for (var c = 0; c < mapM.sectorWidth; c++) {
	                			a.push(this.dirt);
	            			}
	                    	lastLayer = this.dirt + 0;
	                    }
	                } else {
	                	for (var c = 0; c < mapM.sectorWidth; c++) {
	                		a.push(this.empty);
	            		}
	                    lastLayer = this.empty + 0;
	                }
	            rows.push(a);
	   	 	}
		}
		else if (mapM.originSectorY < sectorY) { // Below the grass line
		console.log("BELOW");
			for (var r = 0; r < mapM.sectorHeight; r++) {
	            var a = [];
	            for (var c = 0; c < mapM.sectorWidth; c++) {
	                a.push(this.dirt);
	            }
	            rows.push(a);
	        }
		}        
	    else { // Above the grass line
	    console.log("ABOVE");
	        for (var r = 0; r < mapM.sectorHeight; r++) {
	            var a = [];
	            for (var c = 0; c < mapM.sectorWidth; c++) {
	                a.push(this.empty);
	            }
	            rows.push(a);
	        }
	       
	    }
	    
	    var bs = new BlockSector();
	    bs.rows = rows;
	    bs.height = bs.rows.length;
	    bs.width = bs.rows[0].length;
	    mapM.setSector(bs, sectorX, sectorY);
		 console.log("NOW: " + mapM.originSectorY);
    };
    this.generateOrigin = function(mapM) {
        var rows = [];
        
        
  		var lastLayer = this.empty + 0;
			for (var r = 0; r < mapM.sectorHeight; r++) {
				var a = [];
				if (r > game.generation.SECTOR_SIZE / 2) {
	                	if (lastLayer == (this.empty + 0)) {
	                		for (var c = 0; c < mapM.sectorWidth; c++) {
	                			a.push(this.grass);
	            			}
	                		lastLayer = this.grass + 0;
	                	}
	                	else {
	                    	for (var c = 0; c < mapM.sectorWidth; c++) {
	                			a.push(this.dirt);
	            			}
	                    	lastLayer = this.dirt + 0;
	                    }
	                } else {
	                	for (var c = 0; c < mapM.sectorWidth; c++) {
	                		a.push(this.empty);
	            		}
	                    lastLayer = this.empty + 0;
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
 * @description Generates each sector with the bottom half as dirt and the top half as sky blocks. This class extends {@link WorldGenerator}.
 */
function DefaultWorldGenerator() {
    this.solid = game.blockIdList["dirt"];
    this.empty = game.blockIdList["sky"];
    this.generate = function(mapM, sectorX, sectorY) {
        var rows = [];
        for (var r = 0; r < mapM.sectorHeight; r++) {
            var a = [];
            for (var c = 0; c < mapM.sectorWidth; c++) {
                if (r > game.generation.SECTOR_SIZE / 2) {
                    a.push(this.solid);
               //     a[c].number = c;
                } else {
                    a.push(this.empty);
               //     a[c].number = c;
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
                    a.push(this.solid);
                   // a[c].number = c;
                } else {
                    a.push(this.empty);
                   // a[c].number = c;
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
    this.empty = game.blockIdList["grass"];
    this.generate = function(mapM, sectorX, sectorY) {
        if (sectorX == 0 && sectorY == 0) {
            var rows = [];
            for (var r = 0; r < mapM.sectorHeight; r++) {
                var a = [];
                for (var c = 0; c < mapM.sectorWidth; c++) {
                    a.push(this.empty);
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
                a.push(this.empty);
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