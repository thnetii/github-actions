/* eslint-disable node/no-unpublished-require */
const ghaCore = require("@actions/core");
const httpClientModule = require("@actions/http-client");

const {
  bindCoreHelpers,
} = require("../../libraries/gh-actions-core-helpers/index.cjs");
const buildGhaHttpClient = require("../../libraries/gh-actions-http-client");

const ghaHelpers = bindCoreHelpers(ghaCore);
const { GhaHttpClient } = buildGhaHttpClient(ghaCore, httpClientModule);

const utils = require("./utils");

const GhaMsalAccessTokenProviderModule = require("./GhaMsalAccessTokenProvider");
const GhaServicePrincipalUpdater = require("./GhaServicePrincipalUpdater");

async function getState() {
  const { getActionInputs } = utils;
  const keyCredentialId = ghaHelpers.getStateEx("key-credential-id");
  const passwordCredentialId = ghaHelpers.getStateEx("password-credential-id");
  return {
    keyCredentialId,
    passwordCredentialId,
    ...(await getActionInputs()),
  };
}

async function cleanup() {
  const { getGithubActionsToken } = utils;
  const GhaMsalAccessTokenProvider = await GhaMsalAccessTokenProviderModule();

  const {
    clientId,
    tenantId,
    instance,
    idTokenAudience,
    keyCredentialId,
    passwordCredentialId,
  } = await getState();
  if (!keyCredentialId && !passwordCredentialId) {
    ghaCore.info("No temporary keyCredential registered for cleanup.");
    ghaCore.info("No temporary passwordCredential registered for cleanup.");
    return;
  }

  const idToken = await getGithubActionsToken(idTokenAudience);
  const msalHttpClient = new GhaHttpClient();
  try {
    const msalApp = new GhaMsalAccessTokenProvider(
      msalHttpClient,
      clientId,
      idToken,
      tenantId,
      instance,
    );
    const msgraphClient = new GhaServicePrincipalUpdater(msalApp, clientId);
    try {
      if (keyCredentialId) {
        ghaCore.info(
          `Detected keyCredential previously registered for cleanup. keyId: ${keyCredentialId}`,
        );
        await msgraphClient.removeKeyCredentialByKeyId(keyCredentialId);
      }
      if (passwordCredentialId) {
        ghaCore.info(
          `Detected passwordCredential previously registered for cleanup. keyId: ${passwordCredentialId}`,
        );
        await msgraphClient.removePasswordCredentialByKeyId(
          passwordCredentialId,
        );
      }
    } finally {
      await msgraphClient.dispose();
    }
  } finally {
    msalHttpClient.dispose();
  }
}

cleanup();
