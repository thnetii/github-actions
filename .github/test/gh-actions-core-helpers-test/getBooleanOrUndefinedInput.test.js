const process = require("node:process");

/* eslint-disable node/no-unpublished-require */
const {
  bindCoreHelpers,
  getBooleanOrUndefinedInput,
} = require("../../libraries/gh-actions-core-helpers/index.cjs");

const { getInputEnvKey, getMockCore } = require("./helpers/coreHelpers.cjs");

describe(getBooleanOrUndefinedInput.name, () => {
  test("does not call getBooleanInput if input name is undefined", () => {
    const coreMock = getMockCore();
    const core = /** @type {Partial<import("@actions/core")>} */ (coreMock);
    const coreEx = bindCoreHelpers(
      /** @type {import("@actions/core")} */ (core),
    );
    const name = "TEST_NAME_293b36f2";
    delete process.env[getInputEnvKey(name)];

    const retval = coreEx.getBooleanOrUndefinedInput(name);

    expect(retval).toBeUndefined();
    expect(coreMock.getInput).toHaveBeenCalledWith(name, undefined);
    expect(coreMock.getBooleanInput).toHaveBeenCalledTimes(0);
    expect(coreMock.debug).toHaveBeenCalled();
  });

  test("calls getInput and getBooleanInput if input name is defined", () => {
    const coreMock = getMockCore(["getInput", "getBooleanInput"]);
    const core = /** @type {Partial<import("@actions/core")>} */ (coreMock);
    const coreEx = bindCoreHelpers(
      /** @type {import("@actions/core")} */ (core),
    );
    const name = "TEST_NAME_43c0d51b";
    const value = true;
    const valueString = `${value}`;
    process.env[getInputEnvKey(name)] = valueString;

    const retval = coreEx.getBooleanOrUndefinedInput(name);

    expect(retval).toStrictEqual(value);
    expect(coreMock.getInput).toHaveBeenCalledWith(name, undefined);
    expect(coreMock.getBooleanInput).toHaveBeenCalledWith(name, undefined);
    expect(coreMock.debug).toHaveBeenCalled();
  });

  test("does not call debug when getInput throws", () => {
    const coreMock = getMockCore(["getInput", "getBooleanInput"]);
    const core = /** @type {Partial<import("@actions/core")>} */ (coreMock);
    const coreEx = bindCoreHelpers(
      /** @type {import("@actions/core")} */ (core),
    );
    const name = "TEST_NAME_2225240";
    delete process.env[getInputEnvKey(name)];

    expect(() =>
      coreEx.getBooleanOrUndefinedInput(name, { required: true }),
    ).toThrow();
    expect(coreMock.getInput).toHaveBeenCalled();
    expect(coreMock.getInput).toHaveReturnedTimes(0);
    expect(coreMock.getBooleanInput).toHaveBeenCalledTimes(0);
    expect(coreMock.debug).toHaveBeenCalledTimes(0);
  });

  test("does not call debug when getInput returns, but getBooleanInput throws", () => {
    const coreMock = getMockCore(["getInput", "getBooleanInput"]);
    const core = /** @type {Partial<import("@actions/core")>} */ (coreMock);
    const coreEx = bindCoreHelpers(
      /** @type {import("@actions/core")} */ (core),
    );
    const name = "TEST_NAME_356d51a6";
    const valueString = "TEST INVALID BOOLEAN STRING";
    process.env[getInputEnvKey(name)] = valueString;

    expect(() =>
      coreEx.getBooleanOrUndefinedInput(name, { required: true }),
    ).toThrow();
    expect(coreMock.getInput).toHaveBeenCalledWith(name, { required: true });
    expect(coreMock.getInput).toHaveReturnedWith(valueString);
    expect(coreMock.getBooleanInput).toHaveBeenCalledWith(name, {
      required: true,
    });
    expect(coreMock.getBooleanInput).toHaveReturnedTimes(0);
    expect(coreMock.debug).toHaveBeenCalledTimes(0);
  });
});
