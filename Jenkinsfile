#!/usr/bin/groovy
if (JENKINS_URL.contains('infra.ci.jenkins.io')) {
  buildDockerAndPublishImage('jenkins-wiki-exporter')
  return;
}

if (JENKINS_URL.contains('ci.jenkins.io')) {
  node('docker&&linux') {
    sh "docker build ."
  }
  return;
}

