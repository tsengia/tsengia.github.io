---
layout: post
title: "Thingy91: Connecting to an ESP32 over BLE"
author: "Tyler Sengia"
categories: iot, thingy91, esp32, BLE, programming, embedded
tags: [IoT, BLE, bluetooth, thingy91, esp32, programming, embedded]
image: thingy91-ble-splash.png
image-alt: Diagram of LED traffic lights controlled over LTE and BLE.
---

The Thingy:91 is an LTE and BLE capable IoT prototyping device created by Nordic Semiconductor. In this post, I'll show you how to pair your Thingy:91 to an ESP32 over BLE.

<div class="note" >
  Link to souce code: <a href="https://github.com/tsengia/iot-thingy91-traffic-lights/tree/main/thingy/traffic_light_nrf9160" >tsengia/iot-thingy91-traffic-lights/thingy/traffic_light_nrf9160 on GitHub</a><br />
</div>

# Thingy:91 Overview
The Thingy:91 packs a decent amount of capability under the hood, and it does so using two different microprocessors:
- the nRF9160 SiP
- the nRF52840 SoC

The nRF9160 is the "application processor" for the Thingy:91. It contains a larger amount of Flash and RAM, a flaster clock speed, and provides a Secure Processing Environment using the ARM Trusted Firmware-M. It also contains a built-in LTE modem, which is protected behind this ARM TFM.  

The nRF52840 is a SoC, which contains the Bluetooth Low Energy modem, and smaller Flash and RAM sizes.

We will be programming the nRF52840 in this post, because it has the BLE modem.  

# Programming the Thingy:91
Because there are two microprocessors onboard the Thingy:91, programming them is slightly more complicated.  
Both have the ability to be programmed with the [nRF Connect Programmer](https://infocenter.nordicsemi.com/index.jsp?topic=%2Fug_nc_programmer%2FUG%2Fnrf_connect_programmer%2Fncp_introduction.html) through a standard micro-USB connection to your computer, but this comes with a catch.  

The only microprocessor that has direct access to the USB ports is the nRF9160. Traffic that comes through the USB CDC ACM ports will not reach the nRF52840, unless the nRF9160 forwards the data along the UART-0 or UART-1 serial port.  

This means that in order to program the nRF52840, you must first program the nRF9160 to act as a serial pass through for the UART-0 port. For now, you can use the [Connectivity Bridge](https://developer.nordicsemi.com/nRF_Connect_SDK/doc/latest/nrf/applications/connectivity_bridge/README.html) that Nordic Semiconductor provides to acheive this passthrough, but you'll need to keep this in mind when you go to program the nRF9160. 

<div class="note" >
  Link to Connectivity Bridge souce code: <a href="https://github.com/nrfconnect/sdk-nrf/tree/main/applications/connectivity_bridge" >nrfconnect/sdk-nrf/applications/connectivity_bridge on GitHub</a><br />
</div>

