/* eslint-disable node/no-unpublished-require */
/* eslint-disable import/prefer-default-export */

const buildGhaHttpClient = require("../gh-actions-http-client");

const buildLoggerOptions = require("./GhaMsalLogging");
const buildNetworkModule = require("./GhaMsalNetworkModule");

/**
 * @typedef {Required<Pick<T, K>> & Omit<T, K>} RequiredProperty
 * @template T
 * @template {keyof T} K
 */

/**
 * @param {{
 *  core: import("@actions/core");
 *  "http-client": import("@actions/http-client");
 *  "msal-node": import("./types").MsalNodeModule;
 * }} modules
 */
module.exports = ({
  core,
  "http-client": httpClientModule,
  "msal-node": msal,
}) => {
  const { GhaHttpClient } = buildGhaHttpClient(core, httpClientModule);
  const loggerOptions = buildLoggerOptions(msal, core);
  const GhaMsalNetworkModule = buildNetworkModule(httpClientModule);

  return {
    /**
     * @param {import('@actions/http-client').HttpClient | undefined} [httpClient]
     * @returns {RequiredProperty<import('./types').MsalNodeModule.NodeSystemOptions, 'loggerOptions' | 'networkClient'>}
     */
    buildNodeSystemOptions(httpClient) {
      // eslint-disable-next-line no-param-reassign
      httpClient = httpClient || new GhaHttpClient();
      return {
        loggerOptions,
        networkClient: new GhaMsalNetworkModule(httpClient),
      };
    },
  };
};
