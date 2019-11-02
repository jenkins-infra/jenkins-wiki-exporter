Jenkins Wiki Exporter
=====================

Service to convert jenkins plugin Wiki format to github Markdown or Asciidoc.
Currently it is hosted on https://jenkins-wiki-exporter.g4v.dev/

## Usage

See the documentation [here](https://jenkins.io/doc/developer/publishing/wiki-page/#migrating-from-wiki-to-github).

## Configuration

### Environmental Variables

* CONFLUENCE_USERNAME - username that connects to wiki.jenkins.io
* CONFLUENCE_PASSWORD - password that connects to wiki.jenkins.io

# Contributing

See the Makefile in the repository

# Releasing

`npm run release`
