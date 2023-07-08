---
layout: post
title: "Web Based Virtual Keyboard in Vue"
author: "Tyler Sengia"
categories: web, javascript, vue
tags: [web, vue]
image: piano-practice-splash.png
image-alt: Screenshot of the Piano Practice web-app, treble and bass cleffs are visible.
---

While I was stuck at home during peak COVID lockdown, I made a fun little web app that uses Vue and MIDI.JS to let you play a virtual piano from your web browser.

<div class="note" >
  <a href="https://master.d1e5qjqqw33xnw.amplifyapp.com/" >Try out Piano Practice here!</a>
</div>

# How to Play
1. Open [this link](https://master.d1e5qjqqw33xnw.amplifyapp.com) in a modern web browser to try out Piano Practice
2. Press the "Load Soundfont" button 
3. Wait for the Soundfont to finish loading
4. Press keys on the homerow of your keyboard to start playing notes

## Features
By default, Piano Practice launches into "Single Note" mode. In this mode, a random note is generated and displayed to the user. Once the user presses the correct key corresponding to the note, a new note is randomly generated.  

The key bindings are configurable by pressing the "Keys" button. By clicking on a note, you can press any key to set the new key for that note.

I had many other modes planned for this webapp, but the "Single Note" mode is the most complete. Expect bugs or incompleteness when trying out the other modes.

# How it Works
Piano Practice is a webapp utilizing the following libraries:
- [Vue](https://vuejs.org/) for reactive UI
- [midi-js-soundfonts](https://github.com/gleitz/midi-js-soundfonts) provides the prerendered grand piano SoundFont
- [MIDI.JS](https://github.com/mudcube/MIDI.js/) for decoding and playing SoundFonts
- [abc.js](https://github.com/paulrosen/abcjs) for rendering music notes

When the users presses the "Load Soundfont" button, the `MIDI.loadPlugin` function is call to load the grandpiano soundfont. Once it is loaded, user key presses trigger calls to `MIDI.noteOn()` to play the note, and key releases trigger calls to `MIDI.noteOff()`. MIDI JS uses the browser's Web Audio API to produce the sounds.

# The `Note` class
Within [note.js](https://github.com/tsengia/PianoPractice/blob/master/js/note.js) I define several classes:
- Beat
- Rest
- Note
- Measure
- TimeSignature
- NoteRange
- Stave
- Instrument
- Song

The default "Single Note" mode of Piano Practice randomly generates `Note` objects. These `Note` objects are converted into ABC representation using their `Note.toAbc()` method. 
This ABC representation is rendered into SVG using the `ABCJS.renderAbc()` method provided by abc.js

# Why Manually Load Soundfonts?
When I was first developing this application, I found a bug/problem in my browser when I had the Soundfont load automatically. It seemed to be overwhelming the browser and would cause the load to fail. By switching to a user-triggered load, the bug ceased to exist. Soundfonts are very large assets.