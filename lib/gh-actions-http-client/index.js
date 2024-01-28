const buildGhaHttpClient = require("./GhaHttpClient");

/**
 * @param {import("@actions/core")} core
 * @param {import("@actions/http-client")} httpClient
 */
module.exports = (core, httpClient) => {
  const GhaHttpClient = buildGhaHttpClient(core, httpClient);
  return {
    GhaHttpClient,
  };
};
