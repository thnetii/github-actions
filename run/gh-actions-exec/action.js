/* eslint-disable node/no-unpublished-require */
const {
  bindCoreHelpers,
} = require("../../lib/gh-actions-core-helpers/index.cjs");

/**
 * @param {Pick<import("github-script").AsyncFunctionArguments, "core" | "exec">} args
 */
async function execute({ core, exec }) {
  const ghaCore = bindCoreHelpers(core);

  const toolCmd = ghaCore.getInputEx("command", { required: true });
  const toolArgs = ghaCore.getMultilineInputEx("arguments");
  const toolCwd = ghaCore.getInputEx("working-directory");

  const exitCode = await exec.exec(toolCmd, toolArgs, {
    cwd: toolCwd,
    ignoreReturnCode: true,
  });
  ghaCore.setOutput("command-exitcode", exitCode);
  process.exitCode = exitCode;
}

module.exports = execute;
