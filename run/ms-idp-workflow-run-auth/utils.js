/* eslint-disable node/no-unpublished-require */
const core = require("@actions/core");

const {
  bindCoreHelpers,
} = require("../../lib/gh-actions-core-helpers/index.cjs");

// eslint-disable-next-line node/no-unsupported-features/es-syntax, node/no-missing-import
const msalNode = import("@azure/msal-node");

const {
  info,
  getIDToken,
  setSecret,
  isDebug,
  debug,
  getInputEx: getInput,
} = bindCoreHelpers(core);

module.exports = {
  async getActionInputs() {
    const { AzureCloudInstance } = await msalNode;
    const clientId = getInput("client-id", {
      required: true,
      trimWhitespace: true,
    });
    const tenantId = getInput("tenant-id", {
      required: true,
      trimWhitespace: true,
    });
    const instance =
      /** @type {import("./types").AzureCloudInstance} */ (
        getInput("instance", { required: false, trimWhitespace: true })
      ) || AzureCloudInstance.AzurePublic;
    const resource =
      getInput("resource", {
        required: false,
        trimWhitespace: true,
      }) || clientId;
    const idTokenAudience =
      getInput("id-token-audience", {
        required: false,
        trimWhitespace: true,
      }) || undefined;
    const authMethod =
      /** @type {import('./types.js').GhaActionAuthMethod} */ (
        getInput("auth-method", {
          required: false,
          trimWhitespace: true,
        })
      ) || "ms-idp-federated-credential";
    return {
      clientId,
      tenantId,
      instance,
      resource,
      idTokenAudience,
      authMethod,
    };
  },

  /**
   * @param {string | undefined} [audience]
   */
  async getGithubActionsToken(audience) {
    info(`Requesting GitHub Actions ID token for audience: '${audience}'`);
    const idToken = await getIDToken(audience);
    return idToken;
  },

  /** @param {string} token */
  onJwtToken(token) {
    if (!token) return;
    setSecret(token);
    const [, body, signature] = token.split(".", 3);
    // Special protection for the token signature.
    // Without it the rest of the token is safe to be displayed.
    if (signature) setSecret(signature);
    if (isDebug()) {
      if (body) {
        try {
          const bodyDecoded = Buffer.from(body, "base64url").toString("utf-8");
          debug(`JWT: ${bodyDecoded}`);
        } catch {
          debug(`JWT-ish (body is not Base64 encoded): ${body}`);
        }
      } else {
        debug("Non JWT received.");
      }
    }
  },
};
