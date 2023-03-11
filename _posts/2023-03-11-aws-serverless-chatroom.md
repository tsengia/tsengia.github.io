---
layout: post
title: "AWS: Building a Serverless Chatroom App in 1 Day"
author: "Tyler Sengia"
categories: web, javascript, reactjs, aws, serverless
tags: [web, javascript, reactjs, aws, serverless]
---

Recently I've become an AWS Certified Cloud Practitioner. In this post I'll show you how I made a serverless chatroom webapp in a single day.

# Architecture


# Step One: Setup IAM
Security should always come first. AWS best practices tell use to create IAM Users, IAM User Groups, and IAM Roles for applications, and give them the least amount of priviledges as needed to perform their jobs.  
I'll create an AWS IAM User named `ChatroomDeveloper` is tagged with `{"project":"chatroom-app"}`.

# Step Two: Create an Amazon DynamoDB
- Use eventually consistent reads
- Use on-demand pricing
- Sort by timestamp
- Use `channel` as partition/primary key

# Step Two: Create a GraphQL Schema

# Step Three: Create a Lambda 