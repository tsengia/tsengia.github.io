---
layout: post
title: "2Dimensions: Block based HTML5 Canvas game"
author: "Tyler Sengia"
categories: web, javascript, canvas, game
tags: [web, javascript, canvas, game]
image: 2dimensions-splash.png
image-alt: Screenshot of the 2Dimensions game, which shows a yellow player sprite digging a hole into the dirt blocks.
---

Block based sandbox games are fantastic. Minecraft and Terraria dominate the market for it, but it's always fun to try to create your own games. Many other open source "voxel" based games and frameworks exist, such as [Voxel JS](https://www.voxeljs.com/) and [MineTest](https://www.minetest.net/).

In my spare time I've also hacked up a little 2D block based sandbox game that I call "2Dimensions." 

In this article, I'll show how to play the game, how it works, and discuss some of its limitations.

<div class="note" >
  Link to demo application: <a href="assets/static/games/2Dimensions/game.html" >Play 2Dimensions here!</a>
</div>

## Playing 2Dimensions
You can play 2Dimensions on your web browser by clicking on [this link](assets/static/games/2Dimensions/game.html).

The controls are:
- WASD - Move
- Click - Destroy Blocks

Currently, there are only dirt and grass blocks spanning infinitely in both directions. The logic for falling/jumping is still a bit buggy.

## How it Works
The game screen is an HTML5 Canvas element.

Rendering, input handling, and physics is taken care of in one [game loop](assets/static/games/2Dimensions/docs/game.js.html#line259) that runs every 50 milliseconds.

Each execution of the game loop does the following:
1. Locates the block that the user's cursor is pointing at ([line 513](assets/static/games/2Dimensions/docs/game.js.html#line513))
2. Executes any user inputs/keystrokes ([line 479](assets/static/games/2Dimensions/docs/game.js.html#line479))
3. Performs physics/game logic ([line 283](assets/static/games/2Dimensions/docs/game.js.html#line283))
4. Aligns the game viewport around the player ([line 273](assets/static/games/2Dimensions/docs/game.js.html#line273))
5. Renders the game background ([line 175 of RouteEngineA1.js](assets/static/games/2Dimensions/docs/RouteEngineA1.js.html#line175))
6. Renders the player, tiles, and other sprites ([line 420](assets/static/games/2Dimensions/docs/game.js.html#line420))


There is also [documentation for 2Dimensions](assets/static/games/2Dimensions/docs/index.html) generated by [JSDoc](https://jsdoc.app/) that gives additional insight into how the game works.

## Limitations
Besides technological debt is how the map is stored. Currently, the world map is made up of pure JavaScript Objects. Each block == 1 Object. That's a lot of data for a 50x50 block chunk! 

A better idea would be to use something like an [`Uint8Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Uint8Array) that allows me to manually pack bits and bytes. Additional speedup could be realized by programming in C/C++ and compiling down to WebAssembly. 

As mentioned before, another small bug/quirk is how the logic for detecting falling/collision is written. The bug allows the player to "climb" up walls and sometimes land on "ghost" blocks that don't exist. Honestly, I just haven't taken the time to sit down and think through the math for correcting in the bug, and it doesn't make the game unplayable so for now it stays.