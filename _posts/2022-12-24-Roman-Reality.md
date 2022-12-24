---
layout: post
title: "Roman Reality"
author: "Tyler Sengia"
categories: java, vr, android
tags: [java, opengl, vr, android, google-cardboard-sdk]
image: roman-reality-splash.png
---

During my highschool years, I participated in a local computer fair and developed a simple VR app called "Roman Reality" that teaches users about the Roman Colosseum. It only won a 3rd place prize due to poor UX, but I gained some great experience programming the app.  

In this article, I will discuss how the Roman Reality app is used, how it works, and the shortcomings of the application.  

<div class="note">
You can view <a href="https://github.com/tsengia/Roman-Reality" >the source code for Roman Reality on GitHub</a>.  
</div>

## Using Roman Reality
The purpose of the Roman Reality app is to educate users about the Roman Colosseum in the exciting realm of VR. It's essentially a Power Point presentation in VR.  

At the time, the only VR equipment I had access to was a [Google Cardboard](https://developers.google.com/cardboard/) headset. These headsets are literally made out of cardboard, but provide a very quick and easy way to get started with VR development on Android.

Users are placed in the center of the Colosseum and are able to look around and "click" on floating Info Dots to open up a text box of information. Each Info Dot is colored blue when the user is looking away from it, and changes to red when the user is able to select it. An Info Dot is selected by looking directly at it and pressing the headset. When an Info Dot is selected, a cylinder of informational text pops up around the user. The user can read this text and press the trigger again to close the text.  

TODO: Add screenshots, add screenshot of blue VS. red dot

## How Roman Reality Works
- Discuss OpenGL ES and shaders
- Mention RouteEngine3D?
- Used Blender to create object models (talk about left/right hand rule)
- Upload Blender model to GitHub repo

## Problems with Roman Reality
- Hard to read grainy text (screenshot of grainy text)
- Reading text by rotating head is not natural
- Hard to press on dots
- No sounds/feedback
- Poor graphics, saturated lighting, no shadows