/**
 * @param {import("@actions/core")} core
 * @param {import("@actions/http-client")} httpClient
 */
module.exports = (core, { HttpClient }) =>
  class GhaHttpClient extends HttpClient {
    /**
     * @override
     * @type {import("@actions/http-client").HttpClient['requestRaw']}
     */
    async requestRaw(info, data) {
      if (core.isDebug())
        core.debug(`--> ${info.options.method} ${info.parsedUrl}`);
      const resp = await super.requestRaw(info, data);
      if (core.isDebug()) {
        core.debug(
          `<-- HTTP/${resp.message.httpVersion} ${resp.message.statusCode} ${resp.message.statusMessage}`,
        );
        core.debug(`<-- Content-Type: ${resp.message.headers["content-type"]}`);
        core.debug(
          `<-- Content-Length: ${resp.message.headers["content-length"]}`,
        );
      }
      return resp;
    }
  };
