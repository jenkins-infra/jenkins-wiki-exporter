Jenkins Wiki Exporter
=====================

Service to convert jenkins plugin Wiki format to github Markdown or Asciidoc.
It was hosted at https://jenkins-wiki-exporter.jenkins.io, now deprecated and archived, the corresponding code has been imported in [jenkins-infra/infra-reports](https://github.com/jenkins-infra/infra-reports).
See https://github.com/jenkins-infra/helpdesk/issues/3059

## Usage

See the documentation [here](https://jenkins.io/doc/developer/publishing/wiki-page/#migrating-from-wiki-to-github).

## Configuration

### Environmental Variables

* CONFLUENCE_USERNAME - username that connects to wiki.jenkins.io
* CONFLUENCE_PASSWORD - password that connects to wiki.jenkins.io
* GITHUB_TOKEN        - token for GitHub API, needs `read:org` and `public_repo` scopes

# Contributing

See the Makefile in the repository

# Releasing

`npm run release`
