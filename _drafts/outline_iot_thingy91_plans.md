# Plans for IoT Thingy:91 post for traffic lights

Posts:
1. Programming ESP32 for bluetooth serial control
    Instructions for installing libraries
    Pin Outs for LEDs
    Credits for NUS Code
    Nordic UART Service
    Note about insecure
    Link to Android app for testing
    Link to GitHub

2. Programming the nRF52840 to control the ESP32
    Instructions to setp the VS Code with Nordic SDK
    Overview of the Thingy:91
    Link to Code and Explanation of how it works
    Programming instructions

3. Parsing JSON on IoT device
    Intro to cJSON
    Examples
    Example for nRF9160 on Thingy:91

4. Making HTTP/HTTPS requests on a Thingy:91
    Highlight unimplemented `shutdown()` limitation for HTTP requests
    Show how to parse JSON responses
    Show how to send custom HTTP request headers

5. Event propagation with HTTP
    Discuss:
        HTTP Polling
        HTTP Server Side Events
        HTTP Long Polling
        Websockets
    Compare browser support

6. Setting up an ACME CSE and oneM2M Overview
    Instructions for setup w/ AWS
    Instructions for accessing Web UI
    Explanation of:
        ACP
        AE
        Polling Channel
        Flex Container
    Instructions for custom flex containers

6. oneM2M AE on Thingy:91
    Link to code
    Programming instructions
    Explanation of code
    Link to Video demonstrating full functionality