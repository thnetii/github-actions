/* eslint-disable node/no-unpublished-require */
const path = require("path");
const ghaCore = require("@actions/core");
const { getExecOutput } = require("@actions/exec");

const {
  bindCoreHelpers,
} = require("../../lib/gh-actions-core-helpers/index.cjs");

const {
  getInputEx: getInput,
  getMultilineInputEx: getMultilineInput,
  getNpmExecArguments,
} = bindCoreHelpers(ghaCore);

const prettierArgs = getMultilineInput("arguments");
const prettierCwd = getInput("working-directory");
const githubWorkspace = getInput("github-workspace") || process.cwd();
const npmExecArgs = getNpmExecArguments();
npmExecArgs.push("--", "prettier", "--list-different");
if (prettierArgs?.length > 0) npmExecArgs.push(...prettierArgs);
else npmExecArgs.push(".");
const prettierFilePrefix = path.relative(
  githubWorkspace,
  path.resolve(prettierCwd),
);

getExecOutput("npm", npmExecArgs, {
  cwd: prettierCwd,
  ignoreReturnCode: true,
}).then(({ exitCode, stdout: prettierOutput }) => {
  const prettierFiles = prettierOutput
    .split(/[\r\n]+/)
    .map((l) => l.trim())
    .filter((l) => !!l);
  for (const fileRel of prettierFiles) {
    const filePath = path.join(prettierFilePrefix, fileRel);
    const title = `Code style issues found in '${filePath}'`;
    ghaCore.warning(`Prettier: ${title}`, { title, file: filePath });
  }
  if (exitCode === 0) {
    const title = "Everything formatted properly";
    ghaCore.notice(`Prettier: ${title}`, { title });
  }
  if (exitCode === 1) {
    const title = "Something wasn't formatted properly";
    ghaCore.error(`Prettier: ${title}`, { title });
  }
  if (exitCode === 2) {
    const title = "Something's wrong with Prettier";
    ghaCore.notice(`Prettier: ${title}`, { title });
  }
  ghaCore.setOutput("prettier-exitcode", exitCode);
  process.exitCode = exitCode;
});
