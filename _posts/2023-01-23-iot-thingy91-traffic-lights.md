---
layout: post
title: "ESP32: Control LED Lights over BLE"
author: "Tyler Sengia"
categories: iot, esp32, BLE, programming, embedded
tags: [IoT, BLE, bluetooth, esp32, programming, embedded]
image: thingy-91-traffic-light-splash.png
image-alt: Diagram of LED traffic lights controlled over LTE and BLE.
---

ESP32 based microcontrollers are great for IoT applications, and allow you to use low power communication protocols such as Bluetooth Low Energy. 
In this post, I'll show you how to program your own ESP32 to control a set of LEDs over a BLE connection from your smart phone.

<div class="note" >
  Link to souce code: <a href="https://github.com/tsengia/iot-thingy91-traffic-lights/tree/main/esp32" >tsengia/iot-thingy91-traffic-lights/esp32 on GitHub</a><br />
</div>

## Hardware and Schematics
I'm using this [`ESP-WROOM-32` ESP-32S Development Board from Amazon](https://a.co/d/16fcZjt), but these instructions and code will probably work for almost any ESP32 based device.
Just be sure to adjust the pinouts when making your circuits and programming the device.

TODO: Create wiring schematic
<div style="text-align: center; ">
  <img src="assets/img/iot-thingy91/TODO.png " alt="Schematic showing how to wire up your ESP32 on a breadboard." />
</div>

The following pinouts are used in the above schematic:  

| *Light #* | *Color* | *ESP32 GPIO Pin #* | *ESP32 Physical Pin # |
|-----------:|:-------|:-------------:|:-------------------------:|
| 1 | Red    | GPIO23 | 37 |
| 1 | Yellow | GPIO22 | 36 |
| 1 | Green  | GPIO21 | 33 |
| 2 | Red    | GPIO19 | 31 |
| 2 | Yellow | GPIO18 | 30 |
| 2 | Green  | GPIO5  | 29 |
| 1 | GND    | N/A    | 14, 38, or 32 |
| 2 | GND    | N/A    | 14, 38, or 32 |

These pin asssignments can be changed by modifying the `r1Pin`, `y1Pin`, `g1Pin`, `r2pin`, `y2pin`, and `g2pin` variables located at the top of the `btControl.ino` file. 

The pinout of the ESP-WROOM-32 microcontroller is shown below.
<div style="text-align: center; ">
  <img src="assets/img/iot-thingy91/esp32_pinout.jpg " alt="Pinout diagram of theESP-WROOM-32 microcontroller." />
</div>

## Setup Arduino IDE
To program the ESP32, you will need to download the Arduino board packages for the ESP-WROOM-32.  
To do this, open up your Arduino IDE and go to "File -> Preferences".  
In the settings tab, you will see a field named "Additional Boards Manager URLs", add this URL to the field:
https://dl.espressif.com/dl/package_esp32_index.json.
If you already have other URLs in that box, separate them by adding a comma between them.
Once you have added this URL, press "OK" in the dialog box to apply the changes.

<div style="text-align: center; ">
  <img src="assets/img/iot-thingy91/arduino_ide_setup_instruction_urls.png" alt="Screenshot of the Arduino IDE Preferences window with the boards URL circled in red." /><br />
  <small>Enter your board URL to the field circled in Red and press "OK"</small><br />
</div>

## Program Device
Once you have the correct boards installed onto your Arduino IDE, you can then open up the source code to program your device with.  

To program your device with this software, select the "Node32s" board type in "Tools -> Board -> ESP32 Arduino -> Node32s".
Select the correct COM/tty port in "Tools -> Port".

Press the upload button to compile and upload the program to the ESP32.  

While uploading the program, you will have to press and hold the "Boot Button" on the ESP-WROOM-32.
This button is located to the right of the micro USB connector, as circled in red in the image below.

<div style="text-align: center; ">
  <img src="assets/img/iot-thingy91/esp32_boot_button.png" alt="Boot button of the ESP-WROOM-32 circled in red, located to the right of the microUSB connector." /><br />
  <small>You will need to press and hold this button when starting the upload of your program.</small><br />
</div>

## Try it Out
    Link to Android app for testing