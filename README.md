# tsengia.net
Hello! This repository is the source code for my statically hosted website that you can visit here [https://tsengia.net](https://tsengia.net).  

This repo is automatically deployed by AWS Amplify, and my domain name is registered through AWS Route 53.  

For about \$5.00 a month, that's some cheap, easy, and secure web hosting!  

Many thanks to [Paul Le](https://github.com/LeNPaul) for providing this great Jekyll template [Lagrange](https://github.com/LeNPaul/Lagrange) that I am using for this site.  

## Building
To build, you will have to install Bundler for Ruby.  

Once you have Bundler installed, install the needed Gems using:
```bash
bundle install
```

Once you have the Gems installed, you can serve the page while performing live-edits on drafts:
```bash
jekyll serve --drafts -w -I -H 0.0.0.0
```