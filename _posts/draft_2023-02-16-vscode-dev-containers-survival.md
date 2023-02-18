---
layout: post
title: "Survival Guide to VS Code Dev Containers"
author: "Tyler Sengia"
categories: devops, containers, vscode, programming, software
tags: [devops, containers, docker, vscode]
image: routea1-engine-ide-splash.png
image-alt: Screenshot of the RouteEngineA1 IDE.
---

The Dev Containers extensions for VS Code is magical.  
Imagine, your development team all using the same development environment without having to understand containers or Linux.  
Just open up VS Code and start coding.  

Except that's not the case.  
As fantastic as Dev Containers are, I've found there are some things not listed on the front page that you must add to your Dev Containers in order to achieve your containerization nirvana.

## 1. Git Configuration
When the Dev Container is built, VS Code will pull in the host's git configuration into the Dev Container.  
This helps avoid the developer having to setup git when they first start, but I've found that this git configuration can also pull in things that break.  

For me, the `http.sslBackend` setting would cause developers working on Windows hosts to not be able to push/pull using VS Code's Source Control panel.  
To fix this, I recommend adding this to your `devcontainer.json` file:  
```json
{
    ...
    "postCreateCommand": "git config --unset-all http.sslBackend",
    ...
}
```

This post-create command will unset the `http.sslBackend` option, which as mentioned in [this Stack Overflow post](https://stackoverflow.com/a/66863477) is usually only supported on Windows.

If you are [pre-building Dev Containers](https://code.visualstudio.com/docs/devcontainers/devcontainer-cli#_prebuilding) and exporting them using `docker export` to then distribute to your development teams, you'll have to also wipe your personal git configuration from the produced Dev Container:
```json
{
    ...
    "postCreateCommand": "git config --unset-all http.sslBackend && git config --unset-all user.name && git config --unset-all user.email",
    ...
}
```

## 2. Extensions
VS Code allows you to specify default extensions in the `devcontainer.json` file, but sadly you will need internet access to the marketplace for this to work.  
If you are working behind a corporate firewall, there [may be ways to set your HTTP/HTTPS proxy settings](https://stackoverflow.com/questions/55992660/) to get extensions to install properly.

If you are working offline, you are pretty much out of luck.  
I've found it easiest to include the downloaded `.vsix` extensions inside of the Docker image

Yes, this will make your image larger.