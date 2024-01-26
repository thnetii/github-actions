/**
 * @param {Pick<import("github-script").AsyncFunctionArguments, "core" | "exec">} args
 * @param {{
 *  command: string;
 *  arguments: string | undefined,
 *  "working-directory": string | undefined;
 * }} inputs
 */
async function execute({ core, exec }, inputs) {
  const toolCmd = inputs.command;
  const toolArgs = (inputs.arguments || "")
    .split("\n")
    .map((a) => a.trim())
    .filter((a) => !!a);
  const toolCwd = inputs["working-directory"];

  const exitCode = await exec.exec(toolCmd, toolArgs, {
    cwd: toolCwd,
    ignoreReturnCode: true,
  });
  core.setOutput("command-exitcode", exitCode);
  process.exitCode = exitCode;
}

module.exports = execute;
