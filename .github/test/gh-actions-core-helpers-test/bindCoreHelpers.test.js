/* eslint-disable node/no-unpublished-require */
const {
  bindCoreHelpers,
} = require("../../libraries/gh-actions-core-helpers/index.cjs");

describe(bindCoreHelpers.name, () => {
  test("returns an object with new properties", () => {
    const core = {};
    const coreKeysCount = Object.keys(core).length;

    const retval = bindCoreHelpers(
      /** @type {import("@actions/core")} */ (core),
    );

    expect(typeof retval).toBe("object");
    const retvalKeysCount = Object.keys(retval).length;
    expect(retvalKeysCount).toBeGreaterThan(coreKeysCount);
  });
});
