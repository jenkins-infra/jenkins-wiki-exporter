#!/usr/bin/groovy
if (JENKINS_URL.contains('infra.ci.jenkins.io')) {
  buildDockerAndPublishImage('jenkins-wiki-exporter')
  return;
}

if (JENKINS_URL.contains('ci.jenkins.io')) {
  node('docker&&linux') {
    checkout scm
    sh "docker build -t jenkins-wiki-exporter ."
    docker.inside('jenkins-wiki-exporter') {
      sh 'NODE_ENV=development npm install'
      sh 'NODE_ENV=development npm run test'
    }
  }
  return;
}

