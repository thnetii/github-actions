/* eslint-disable node/no-unpublished-require */
const path = require("path");
const { exec } = require("@actions/exec");

const formatterPath = path.join(__dirname, "formatter.js");

const {
  bindCoreHelpers,
} = require("../../lib/gh-actions-core-helpers/index.cjs");

const core = bindCoreHelpers(require("@actions/core"));

function main() {
  const toolArgs = core.getMultilineInputEx("arguments");
  const execCwd = core.getInputEx("working-directory");
  const npmExecArgs = core.getNpmExecArguments();
  npmExecArgs.push("--", "eslint", "--format", formatterPath, ...toolArgs);

  exec("npm", npmExecArgs, { cwd: execCwd, ignoreReturnCode: true }).then(
    (exitCode) => {
      core.setOutput("eslint-exitcode", exitCode);
      process.exitCode = exitCode;
    },
  );
}

main();
