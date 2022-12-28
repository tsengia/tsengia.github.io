/**
 * @class Block
 * @description Class for a new block type, holds the data about the registered block.
 * @param {Integer} imageId - The image id of the block. The image id is the same as the index of the image in the ImageLoadStack when the images are loaded.
 * @param {Boolean} solid - A boolean value representing whether or not the block is solid
 * @param {String} name - The canonical name of this block ("dirt", "grass", "stone")
 * @prop {Integer} imageId - The image id of the block. The image id is the same as the index of the image in the ImageLoadStack when the images are loaded.
 * @prop {Boolean} solid - A boolean value representing whether or not the block is solid
 * @prop {String} name - The canonical name of this block ("dirt", "grass", "stone")
 */
function Block(imageId, solid, name) {
    this.imageId = imageId;
    this.solid = solid;
    this.name = name;
}

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