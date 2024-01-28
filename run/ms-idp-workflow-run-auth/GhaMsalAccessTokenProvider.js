/* eslint-disable node/no-unpublished-require */
const { URL } = require("node:url");

const core = require("@actions/core");
const httpClientModule = require("@actions/http-client");

// eslint-disable-next-line node/no-unsupported-features/es-syntax, node/no-missing-import
const msalNode = import("@azure/msal-node");

const buildMsalClient = require("../../lib/gh-actions-msal-client");

const utils = require("./utils");

const { debug, info, isDebug } = core;

const clientIdSym = Symbol("#clientId");

module.exports = async () => {
  const {
    AuthError,
    AzureCloudInstance,
    ConfidentialClientApplication,
    buildAppConfiguration,
  } = await msalNode;
  const { onJwtToken } = utils;
  const { buildNodeSystemOptions } = buildMsalClient({
    core,
    "http-client": httpClientModule,
    "msal-node": await msalNode,
  });

  return class GhaMsalAccessTokenProvider {
    /**
     * @param {import('@actions/http-client').HttpClient} httpClient
     * @param {string} clientId
     * @param {string | Exclude<import("./types").MsalConfiguration['auth']['clientCertificate'], undefined> | { clientSecret: string }} assertionInfo
     * @param {string} tenantId
     * @param {Awaited<import("./types").AzureCloudInstance> | undefined} [instance]
     */
    constructor(httpClient, clientId, assertionInfo, tenantId, instance) {
      const instanceUrl = new URL(instance || AzureCloudInstance.AzurePublic);
      const authorityUrl = new URL(tenantId, instanceUrl);
      this[clientIdSym] = clientId;
      /** @type {import("./types").MsalConfiguration} */
      const config = {
        auth: {
          clientId,
          authority: authorityUrl.toString(),
        },
        system: buildNodeSystemOptions(httpClient),
      };
      if (typeof assertionInfo === "string")
        config.auth.clientAssertion = assertionInfo;
      else if ("clientSecret" in assertionInfo) {
        config.auth.clientSecret = assertionInfo.clientSecret;
      } else if (assertionInfo?.privateKey && assertionInfo?.thumbprint)
        config.auth.clientCertificate = assertionInfo;
      this.msalApp = new ConfidentialClientApplication(
        buildAppConfiguration(config),
      );
    }

    /**
     * @param {string | undefined} [resource]
     */
    async acquireAccessToken(resource) {
      const { msalApp } = this;
      if (!resource) {
        // eslint-disable-next-line no-param-reassign
        resource = this[clientIdSym];
        debug(
          `No resource requested for access token audience, using client id instead.`,
        );
      }
      info(`Acquiring MSAL access token for resource: ${resource}`);
      const authResult = await msalApp.acquireTokenByClientCredential({
        scopes: [`${resource || this[clientIdSym]}/.default`],
      });
      if (!authResult)
        throw new AuthError(undefined, "Authentication result is null");
      info("Sucessfully acquired MSAL access token.");
      const { accessToken, scopes } = authResult;
      onJwtToken(accessToken);
      if (isDebug()) {
        for (const scope of scopes) debug(`Available scope: ${scope}`);
      }
      return authResult;
    }
  };
};
