FROM ruby:3.1.3-buster

# Install Ruby Bundler
RUN apt-get update -y && apt-get install -y bundler git git-lfs

# Declare volume
RUN mkdir /opt/website
VOLUME /opt/website
WORKDIR /opt/website

# Install jekyll and associated plugins
COPY Gemfile .
COPY lagrange.gemspec .
COPY Gemfile.lock .
RUN bundle install

# Open up the web port
EXPOSE 4000

# Start Jekyll in production mode
RUN export JEKYLL_ENV=production
ENTRYPOINT jekyll serve -w -I -H 0.0.0.0