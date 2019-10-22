#!/usr/bin/groovy
if (JENKINS_URL == 'https://ci.jenkins.io/') {
    // not sure what to do here
    return
}
@Library('github.com/halkeye/jenkins-shared-library@master') _
buildDockerfile('halkeye/jenkins-wiki-exporter')
