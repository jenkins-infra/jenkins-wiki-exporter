/* eslint-env node */
const {GraphQLClient} = require('graphql-request');

const getAllTopicsQuery = `
query getAllTopicsQuery($login: String!, $after: String) {
  organization(login: $login) {
    repositories(first: 100, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          isArchived
          url
          repositoryTopics(first: 100) {
            edges {
              node {
                topic {
                  name
                }
              }
            }
          }
        }
      }
    }
  }
}
`;

const getPullRequestsQuery = `
query getPullRequests($login: String!) {
  organization(login: $login) {
    project(number:3) {
      columns (first:100) {
        edges {
          node {
            id
            cards {
              edges {
                node {
                  content {
                    ... on PullRequest {
                      url
                      baseRepository {
                        object(expression: "master:pom.xml") {
                          ... on Blob {
                            text
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`;

/**
 * Creates a graphql github client
 * @private
 * @return {GraphQLClient}
 */
function getGithubClient() {
  return new GraphQLClient(
      process.env.GITHUB_SERVER || 'https://api.github.com/graphql',
      {
        headers: {
          Authorization: `bearer ${process.env.GITHUB_TOKEN}`,
        },
      },
  );
}

/**
 * Get all the pull requests from the jenkins project
 * @return {object}
 */
async function getPullRequests() {
  return getGithubClient().request(
      getPullRequestsQuery,
      {
        login: 'jenkinsci',
      },
  );
}

/**
 * Gets labels for all repos (paginated)
 *  @param {string} after pagination
 * @return {object}
 */
async function getAllTopics(after) {
  return getGithubClient().request(
      getAllTopicsQuery,
      {
        login: 'jenkinsci',
        after: after,
      },
  );
}

module.exports = {
  getPullRequests,
  getAllTopics,
};
