---
layout: post
title: "2022 Hack PSU 1st place: Sauron"
author: "Tyler Sengia"
categories: hackathon, psu, cloud, data
tags: [hackathon, cloud, data, grafana, gcp, web]
image: hackpsu-sauron-splash.png
image-alt: Screenshot of the Hack PSU 2022 Sauron entry.
---

While at Penn State, I entered the Hack PSU hackathon in Spring of 2022 and won first place! Our entry was titled _Sauron_, 
which is an event data aggregator and dashboard for crisis situations hosted on Google Cloud Platform.
Our team won first place overall, as well as the first place prize for the Nittany AI category of the hackathon.

## Overview of Sauron
Sauron is a proof-of-concept, cloud based, event data aggregator and dashboard for crisis situations.
It is meant to collect event reports from multiple data sources and display them in a unified interface for users to interact with.
Inside, it is powered by a MySQL database, Flask REST API, the youtube-dl library, and Grafana.

Sauron is a proof-of-concept because for the HackPSU hackathon, we only had around 12 hours to build everything.

Our proof of concept demonstrated the following features:
- Unified dashboard interface with event reports plotted on a map
- Automated event report creation from live stream video
- Manual event report creation from users on mobile devices

## Google Cloud Platform
Using free credits from GCP, I set up a managed MySQL server, as well as two `e2-small` VM instances.  
One VM instance hosted the Grafana Dashboard, and the other hosted the Flask Web App.  

Could we have used Kubernetes or some sort of serverless architecture?
Sure, but we only had about 12 hours to build all of this, so I went with what was quick and understandable.

## Grafana Dashboard
Our Dashboard was truly the selling point of our entry.  
Using Grafana, we were able to create a slick UI within in a few hours, and with zero previous experience.  

<div style="text-align: center;" >
<img src="assets/img/quibs-network.png" alt="Diagram of the quib's feedforward neural network" />  
</div>

We used two Table panels to display event reports and event sources. Event reports were also plotted onto a Geomap panel on the right side.
Grafana's "Data Links" feature allows us to make the reports and sources tables linked to the report images and source videos.
These images were served by our Flask web-app, and the source videos were simply links to YouTube livestreams of traffic cameras.  

One of the cool features of Grafana is it's "low code" ability to grab data from multiple types of sources.
We used a MySQL data source, and once the database connection was up, it was very easy to make some `SELECT` queries (shown below) to populate the data into our dashboard.  

<div style="text-align: center;" >
<img src="assets/img/sauron/sources-list-sql-query.png" alt="SELECT statement used to populate the sources list." />  
</div>

## Automated Report Submission
Any "event data aggregator" needs to be able to comb through a large number of data sources and pick out events and metrics that actually mean something to the end user.
We envisioned adding an "anomaly detector" to Sauron to do this, but for the hackathon, we would randomly choose when to treat an incoming video frame as a anomaly.  

We used OpenCV to stream data from the traffic camera live streams on YouTube. You can see [the Python script we wrote to accomplish this](https://github.com/tsengia/HackPSU-Sauron/blob/master/detect-incidents-hardcoded.py).  

This Python script would randomly choose frames from the camera live stream, save it to the Flask web-app's image directory, and make `INSERT` statements into the SQL database.
Grafana would work its polling magic, and up would pop our randomly generated event reports on the Dashboard.  

## Manual Report Submission
As mentioned earlier, Sauron provides users the ability to upload event reports from their own mobile devices.  
Because Sauron is hosted in the cloud, mobile users could use with web browser to open up the form show below to submit event reports.

<div style="text-align: center;" >
<img src="assets/img/quibs-network.png" alt="Diagram of the quib's feedforward neural network" />  
</div>

This entry form was a very simple HTML form that POST's to our Flask web-app's API.
The Flask web-app saves the user reported photo, and performs an SQL `INSERT` into the `report_list` table.

The latitude and longitude of the user's location is auto-populated using JavaScript in the HTML page. 
Fun fact, most mobile web browsers block websites from requesting location information unless the website has an HTTPS certificate.  
So, we created a self-signed certificate and configured Flask to use HTTPS.  