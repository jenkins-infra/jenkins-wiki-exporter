#!/usr/bin/groovy
if (JENKINS_URL == 'https://ci.g4v.dev/') {
  @Library('github.com/halkeye/jenkins-shared-library@master') _
  buildDockerfile('halkeye/jenkins-wiki-exporter')
  return
}
buildDockerImage('jenkins-wiki-exporter')
