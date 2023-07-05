---
layout: post
title: "Tips for Setting up Local GitLab Runners"
author: "Tyler Sengia"
categories: devops, gitlab, programming, cicd, automation
tags: [devops, gitlab, programming, cicd, automation]
---

GitLab's CI/CD pipelines are fantastic for automating builds, unit tests, packaging, and deployments. However, sometimes it takes a while for developers to find out if their changes break builds because the pipeline takes a while to execute. By installing the GitLab Runner executable locally on developer's machines, you can allow developers to run the CI pipeline locally to receive feedback much quicker.

# Installation
For many Linux distributions, `sudo apt-get install gitlab-runner` will work, however I recommend [downloading the latest version](https://gitlab-runner-downloads.s3.amazonaws.com/latest/index.html).  

Make sure you also have the Docker Engine installed if your CI pipelines use Docker executors.  

You do NOT have to register the GitLab Runner with your GitLab instance since you are using it on the local machine.

## Running GitLab Runner Locally
Once you have the GitLab Runner installed, you can `cd` into your repository and try running your pipeline locally with GitLab Runner's `exec` command:  
```bash
gitlab-runner exec
```