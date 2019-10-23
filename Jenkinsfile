#!/usr/bin/groovy
if (JENKINS_URL == 'https://ci.jenkins.io/') {
  pipeline {
    agent {
      label: 'docker&&linux'
    }

    options {
      buildDiscarder(logRotator(numToKeepStr: '5', artifactNumToKeepStr: '5'))
      timeout(time: 60, unit: "MINUTES")
      ansiColor("xterm")
    }

    stages {
      stage("Build") {
        environment { DOCKER = credentials("${credential}") }
        steps {
          sh "docker build -t jenkins-wiki-exporter ."
        }
      }
    }
  }
  return
}
@Library('github.com/halkeye/jenkins-shared-library@master') _
buildDockerfile('halkeye/jenkins-wiki-exporter')
