const core = require("@actions/core");

/**
 * @param {string} name
 */
function getInputEnvKey(name) {
  return `INPUT_${name.replace(/ /g, "_").toUpperCase()}`;
}

/**
 * @param {(keyof import("@actions/core"))[] | undefined} [passthrough]
 */
function getMockCore(passthrough) {
  const passthroughKeys = Array.isArray(passthrough) ? passthrough : [];
  const mockCore = Object.fromEntries(
    Object.entries(core).map(([name, value]) => {
      const key = /** @type {keyof import("@actions/core")} */ (name);
      if (typeof value !== "function") return [key, undefined];
      if (passthroughKeys.includes(key))
        return [
          key,
          jest.fn(/** @type {(...args: any) => any} */ (value)).mockName(key),
        ];
      return [key, jest.fn().mockName(key)];
    }),
  );
  return /** @type {MockActionsCore} */ (mockCore);
}

module.exports = {
  getInputEnvKey,
  getMockCore,
};

/**
 * @typedef {{
 * [K in keyof import("@actions/core")]: import("@actions/core")[K] extends (...args: infer P) => infer R
 *   ? jest.Mock<R, P, undefined>
 *   : undefined;
 * }} MockActionsCore
 */
