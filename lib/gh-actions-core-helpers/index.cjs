/**
 * @this {import("@actions/core")}
 * @param {Parameters<import("@actions/core")["getInput"]>[0]} name
 * @param {Parameters<import("@actions/core")["getInput"]>[1]} [options]
 * @returns {ReturnType<import("@actions/core")["getInput"]>}
 */
function getInputEx(name, options) {
  const val = this.getInput(name, options);
  this.debug(`INPUT ${name}: ${val}`);
  return val;
}

/**
 * @this {import("@actions/core")}
 * @param {Parameters<import("@actions/core")["getMultilineInput"]>[0]} name
 * @param {Parameters<import("@actions/core")["getMultilineInput"]>[1]} [options]
 * @returns {ReturnType<import("@actions/core")["getMultilineInput"]>}
 */
function getMultilineInputEx(name, options) {
  const val = this.getMultilineInput(name, options);
  this.debug(`INPUT ${name}: ${JSON.stringify(val)}`);
  return val;
}

/**
 * @this {import("@actions/core")}
 * @param {Parameters<import("@actions/core")["getInput"]>[0] & Parameters<import("@actions/core")["getBooleanInput"]>[0]} name
 * @param {Parameters<import("@actions/core")["getInput"]>[1] & Parameters<import("@actions/core")["getBooleanInput"]>[1]} [options]
 * @returns {ReturnType<import("@actions/core")["getBooleanInput"]> | undefined}
 */
function getBooleanOrUndefinedInput(name, options) {
  const valString = this.getInput(name, options);
  let val;
  if (!valString && (!options || !options.required)) {
    val = undefined;
  } else {
    val = this.getBooleanInput(name, options);
  }
  this.debug(`INPUT ${name}: ${val}`);
  return val;
}

/**
 * @this {import("@actions/core")}
 */
function getNpmExecArguments() {
  const npmExecArgs = ["exec"];
  if (
    getBooleanOrUndefinedInput.call(this, "npm-exec-allow-package-install", {
      required: false,
    })
  ) {
    npmExecArgs.push("--yes");
  }
  const execPackages = getMultilineInputEx.call(this, "npm-exec-packages", {
    required: false,
  });
  for (const execPkg of execPackages) {
    npmExecArgs.push(`--package=${execPkg}`);
  }
  const npmWorkspace = getMultilineInputEx.call(this, "npm-workspace", {
    required: false,
  });
  if (npmWorkspace?.length) {
    npmExecArgs.push(...npmWorkspace.flatMap((w) => ["--workspace", w]));
  } else if (
    getBooleanOrUndefinedInput.call(this, "npm-workspaces", { required: false })
  ) {
    npmExecArgs.push("--workspaces");
    if (
      getBooleanOrUndefinedInput.call(this, "npm-include-workspace-root", {
        required: false,
      })
    ) {
      npmExecArgs.push("--include-workspace-root");
    }
  }
  return npmExecArgs;
}

/**
 * @this {import("@actions/core")}
 * @param {Parameters<import("@actions/core")["saveState"]>[0]} name
 * @param {Parameters<import("@actions/core")["saveState"]>[1]} value
 * @returns {Parameters<import("@actions/core")["saveState"]>[1]}
 */
function saveStateEx(name, value) {
  this.saveState(name, value);
  this.debug(`STATE ${name} = ${value}`);
  return value;
}

/**
 * @this {import("@actions/core")}
 * @param {Parameters<import("@actions/core")["getState"]>[0]} name
 * @returns {ReturnType<import("@actions/core")["getState"]>}
 */
function getStateEx(name) {
  const value = this.getState(name);
  this.debug(`STATE ${name}: ${value}`);
  return value;
}

const exportedFunctions = {
  getInputEx,
  getBooleanOrUndefinedInput,
  getMultilineInputEx,
  getNpmExecArguments,
  saveStateEx,
  getStateEx,
};

/**
 * @this {import("@actions/core")}
 * @returns {{
 *  [N in keyof exportedFunctions]: OmitThisParameter<exportedFunctions[N]>
 * }}
 */
function withCoreHelpers() {
  return Object.assign(
    this,
    ...Object.entries(exportedFunctions).map(([name, fn]) => ({
      [name]: fn.bind(this),
    })),
  );
}

module.exports = {
  ...exportedFunctions,
  /**
   * @param {import("@actions/core")} core
   */
  bindCoreHelpers: (core) => withCoreHelpers.call(core),
};
