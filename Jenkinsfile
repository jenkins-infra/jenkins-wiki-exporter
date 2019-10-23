#!/usr/bin/groovy
if (JENKINS_URL == 'https://ci.jenkins.io/') {
  node('docker&&linux') {
    properties([buildDiscarder(logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '', daysToKeepStr: '5', numToKeepStr: '5'))])
    timeout(30) {
      ansiColor('xterm') {
        sh "docker build -t jenkins-wiki-exporter ."
      }
    }
  }
  return
}
@Library('github.com/halkeye/jenkins-shared-library@master') _
buildDockerfile('halkeye/jenkins-wiki-exporter')
