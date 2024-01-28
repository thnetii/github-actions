/* eslint-disable node/no-unpublished-require */
const ghaCore = require("@actions/core");
const httpClientModule = require("@actions/http-client");

// eslint-disable-next-line node/no-unsupported-features/es-syntax, node/no-missing-import
const msalNodeModule = import("@azure/msal-node");

const {
  bindCoreHelpers,
} = require("../../lib/gh-actions-core-helpers/index.cjs");
const buildGhaHttpClient = require("../../lib/gh-actions-http-client");

const { saveStateEx: saveState } = bindCoreHelpers(ghaCore);
const { HttpClientError } = httpClientModule;
const { GhaHttpClient } = buildGhaHttpClient(ghaCore, httpClientModule);

const utils = require("./utils");
const GhaMsalAccessTokenProviderModule = require("./GhaMsalAccessTokenProvider");
const GhaServicePrincipalUpdater = require("./GhaServicePrincipalUpdater");

const GhaAzAcsClient = require("./GhaAzAcsClient");
const { generateCertificate } = require("./GhaOpenSslCertProvider");

/**
 * @typedef {Awaited<ReturnType<import("./GhaMsalAccessTokenProvider")>>} GhaMsalAccessTokenProvider
 */

/**
 * @param {InstanceType<GhaMsalAccessTokenProvider>} msalApp
 * @param {string} resource
 * @param {number} maxAttempts
 */
async function acquireAccessTokenMsal(msalApp, resource, maxAttempts) {
  const { AuthError } = await msalNodeModule;
  let error;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    let result;
    try {
      if (attempt > 0) {
        ghaCore.info(
          `Authentication attempt ${attempt} failed. Waiting 5 seconds for the system to propagate possibly missing credentials.`,
        );
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          setTimeout(resolve, 5000);
        });
      }
      // eslint-disable-next-line no-await-in-loop
      result = await msalApp.acquireAccessToken(resource);
    } catch (err) {
      if (err instanceof AuthError) {
        error = err;
        // eslint-disable-next-line no-continue
        continue;
      }
      throw err;
    }
    if (!result) {
      error = new AuthError(undefined, "No Authentication result received");
      // eslint-disable-next-line no-continue
      continue;
    }

    const { accessToken } = result;

    ghaCore.setOutput("access-token", accessToken);
    ghaCore.setOutput("result", result);
    return;
  }

  throw error;
}

/**
 * @param {import("./GhaAzAcsClient")} acsClient
 * @param {string} resource
 * @param {number} maxAttempts
 */
async function acquireAccessTokenAzAcs(acsClient, resource, maxAttempts) {
  const { AuthError } = await msalNodeModule;
  let error;
  let attempt;
  for (attempt = 0; attempt < maxAttempts; attempt += 1) {
    let result;
    try {
      if (attempt > 0) {
        ghaCore.info(
          `Authentication attempt ${attempt} failed. Waiting 5 seconds for the system to propagate possibly missing credentials.`,
        );
        // eslint-disable-next-line no-await-in-loop
        await new Promise((resolve) => {
          setTimeout(resolve, 5000);
        });
      }
      // eslint-disable-next-line no-await-in-loop
      result = await acsClient.acquireTokenByClientCredential(resource);
    } catch (err) {
      if (err instanceof HttpClientError) {
        error = err;
        // eslint-disable-next-line no-continue
        continue;
      }
      throw err;
    }
    if (!result) {
      error = new AuthError(undefined, "No Authentication result received");
      // eslint-disable-next-line no-continue
      continue;
    }

    result = result.result;
    const { access_token: accessToken } = result;

    ghaCore.setOutput("access-token", accessToken);
    ghaCore.setOutput("result", result);
    return;
  }

  ghaCore.info(
    `Authentication attempt ${attempt} failed. Maximum number of retries reached.`,
  );
  throw error;
}

/**
 * @param {import('@actions/http-client').HttpClient} httpClient
 */
async function acquireAccessToken(httpClient) {
  const { getActionInputs, getGithubActionsToken } = utils;
  const GhaMsalAccessTokenProvider = await GhaMsalAccessTokenProviderModule();
  let maxAttempts = 1;
  const {
    clientId,
    tenantId,
    instance,
    resource,
    idTokenAudience,
    authMethod,
  } = await getActionInputs();
  const idToken = await getGithubActionsToken(idTokenAudience);
  let msalApp = new GhaMsalAccessTokenProvider(
    httpClient,
    clientId,
    idToken,
    tenantId,
    instance,
  );

  if (authMethod === "ms-idp-temporary-certificate") {
    maxAttempts = 60;
    const keyPair = await generateCertificate();
    let keyCredential;
    const spnUpdater = new GhaServicePrincipalUpdater(msalApp, clientId);
    try {
      keyCredential = await spnUpdater.addCertificateKeyCredential(keyPair);
    } finally {
      await spnUpdater.dispose();
    }
    saveState("key-credential-id", keyCredential?.keyId);

    ghaCore.debug(
      "Replacing MSAL application with a new application using the temporary certificate for client authentication",
    );
    msalApp = new GhaMsalAccessTokenProvider(
      httpClient,
      clientId,
      {
        privateKey: keyPair.privateKey,
        thumbprint: keyPair.thumbprint.toString("hex"),
        // x5c: keyPair.certificate,
      },
      tenantId,
      instance,
    );
    return acquireAccessTokenMsal(msalApp, resource, maxAttempts);
  }
  if (
    authMethod === "ms-idp-temporary-secret" ||
    authMethod === "az-acs-temporary-secret"
  ) {
    maxAttempts = 60;
    let passwordCredential;
    const spnUpdater = new GhaServicePrincipalUpdater(msalApp, clientId);
    try {
      const now = new Date();
      const oneHourInMs = 1000 * 60 * 60;
      const end = new Date(now.getTime() + oneHourInMs);
      passwordCredential = await spnUpdater.addPasswordCredential({
        displayName: ``,
        startDateTime: now.toISOString(),
        endDateTime: end.toISOString(),
      });
    } finally {
      await spnUpdater.dispose();
    }
    saveState("password-credential-id", passwordCredential?.keyId);

    if (authMethod === "ms-idp-temporary-secret") {
      ghaCore.debug(
        "Replacing MSAL application with a new application using the temporary password credential for client authentication",
      );
      msalApp = new GhaMsalAccessTokenProvider(
        httpClient,
        clientId,
        { clientSecret: passwordCredential.secretText || "" },
        tenantId,
        instance,
      );
      return acquireAccessTokenMsal(msalApp, resource, maxAttempts);
    }
    if (authMethod === "az-acs-temporary-secret") {
      ghaCore.warning(
        "Azure Access Control Service authentication is depcreated.",
      );
      ghaCore.debug(
        "Creating Azure Access Control Service client using the temporary password credential for client authentication",
      );
      const acsClient = new GhaAzAcsClient(
        httpClient,
        clientId,
        passwordCredential.secretText || "",
        tenantId,
        instance,
      );
      return acquireAccessTokenAzAcs(acsClient, resource, maxAttempts);
    }
  }

  return acquireAccessTokenMsal(msalApp, resource, maxAttempts);
}

async function run() {
  const msalHttpClient = new GhaHttpClient();
  try {
    await acquireAccessToken(msalHttpClient);
  } finally {
    msalHttpClient.dispose();
  }
}

run();
