---
layout: post
title: "AWS: Thoughts while learning AWS AppSync"
author: "Tyler Sengia"
categories: web, aws, serverless, graphql
tags: [web, aws, serverless, graphql]
---

I recently became an AWS Certified Cloud Practitioner, and I'm taking the time to migrate most of my old projects onto AWS to show as part of my portfolio of work.  
For those of you who also took the practitioner test, I am using a combination of "rehost", "replatform", and "refactoring" to get my portfolio onto AWS.  

This blog is currently hosted on AWS Amplify, and the source code for it is automatically pulled from <a href="https://github.com/tsengia/tsengia.github.io">this GitHub repository</a>. At first, my blog was just a regular GitHub pages website, but I switched to AWS Amplify once I realized that I could:
- Register a `.net` domain name through Route53 for about $20 a year
- Automatically deploy new content by pushing to my GitHub repo
- Offer more flexibility in content through other AWS services

# Experimenting with AWS AppSync
Today I was determined to try out AWS AppSync. It's essentially a serverless, managed GraphQL API server that integrates nicely with other AWS services such as Cognito and Dynamo. 
It took me a decent amount of time to figure out how Resolvers work, and how to attach Functions to the resolver pipeline (ie. the button to attach functions wasn't visible until I scrolled down).

It was interesting to me that Resolvers that run in the pure AppSync JS runtime do not impose additional cost, but Resolvers running as Lambda functions do. It seems almost like a loophole. However, well-designed web APIs really should not take much runtime to fulfil requests in the first place. Yes, they can trigger longer actions to start/stop when the request comes in, but the request itself should not take more than a few tens of milliseconds to fulfull.