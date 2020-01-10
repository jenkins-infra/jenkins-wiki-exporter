Older versions of this plugin may not be safe to use. Please review the
following warnings before using an older version:

-   [Cross-site scripting (XSS)
    vulnerability](https://jenkins.io/security/advisory/2018-01-22/){.external-link}

# Description

This plugin adds [Apache Ant](http://ant.apache.org/){.external-link}
support to Jenkins.This functionality used to be a part of the core, but
as of Jenkins 1.431, it was split off into separate plugins.

# Installation and usage

## Installation

For this plugin to be used, an Ant installation must be specified in the
global Jenkins configuration. It can be installed automatically:

![](docs/images/automatic.png){.confluence-embedded-image
.confluence-content-image-border width="680"}

Or manually:

![](docs/images/manual.png){.confluence-embedded-image
.confluence-content-image-border width="680"}

## Usage

![](docs/images/usage.png){.confluence-embedded-image
.confluence-content-image-border width="680"}

-   **Ant Version:** Ant Installation to use. See previous section.
-   **Targets:** Ant targets to invoke. If left blank, default target
    will be invoked.
-   **Build File:** Build file to use. If left blank, plugin will look
    for build.xml in the root directory.
-   **Properties:** Additional parameters (typical properties file
    format) to pass to the build. They are passed like -D(name)=(value)
-   **Java Options:** Custom ANT\_OPS.

  

An example of using the Ant task inside Pipeline DSL. This code snippet
must be put inside a `step` block when using the declarative syntax.

    withAnt(installation: 'myinstall') {
        dir("scoring") {
        if (isUnix()) {
          sh "ant mytarget"

        } else {
          bat "ant mytarget"
        }
    }

# Change Log

### Version 1.10 and later

See [GitHub
releases](https://github.com/jenkinsci/ant-plugin/releases){.external-link}.

### Version 1.9 (2018-10-29)

-   [
    JENKINS-54133](https://issues.jenkins-ci.org/browse/JENKINS-54133){.jira-issue-key} -
    Getting issue details... STATUS as applied to Ant console notes.
-   [
    JENKINS-52139](https://issues.jenkins-ci.org/browse/JENKINS-52139){.jira-issue-key} -
    Getting issue details... STATUS

### Version 1.8 (Jan 22, 2018)

-   [Fix security
    issue](https://jenkins.io/security/advisory/2018-01-22/){.external-link}

### Version 1.7 (Aug 21, 2017)

-    Bump baseline to 1.651.3 and fix
    tests \[[JENKINS-46317](https://issues.jenkins-ci.org/browse/JENKINS-46317){.external-link}\]

### Version 1.6 (Aug 08, 2017)

Now requires Jenkins 1.642.x or newer.

-   Pipeline-compatible build
    wrapper \[[JENKINS-26056](https://issues.jenkins-ci.org/browse/JENKINS-26056)\]

### Version 1.5 (May 9, 2017)

-   Add description to
    POM \[[JENKINS-40002](https://issues.jenkins-ci.org/browse/JENKINS-40002){.external-link}\]
-   Ant plugin does not correctly resolve and property resolving empty
    build
    parameter \[[JENKINS-41801](https://issues.jenkins-ci.org/browse/JENKINS-41801){.external-link}\]
-   AntInstallation not setting
    PATH+ANT \[[JENKINS-42382](https://issues.jenkins-ci.org/browse/JENKINS-42382){.external-link}\]
-   Improve test coverage

### Version 1.4 (Aug 30, 2016)

-   Descriptors annotated with @Symbol
    \[[JENKINS-37388](https://issues.jenkins-ci.org/browse/JENKINS-37388){.external-link}\]
-   Update test dependencies.

### Version 1.3 (May 11, 2016)

-   Upgrade to new [plugin parent
    pom](https://github.com/jenkinsci/plugin-pom){.external-link}.
-   Fixed regression: empty parameters causing the build to fail
    \[[JENKINS-33712](https://issues.jenkins-ci.org/browse/JENKINS-33712){.external-link}\]
-   Update French translations

### Version 1.2 (Feb 20, 2013)

-   Mmproved documentation
-   Translations
-   Label in Plugin Manager

### Version 1.1 (Sep 19, 2011)

-   First release, split off from the core.

### Version 1.0 (Sep 19, 2011)

-   Erroneous release. Initial release is 1.1

  
