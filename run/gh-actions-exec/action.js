const trueStringRegexp = /^\s*true\s*$/iu;
const falseStringRegexp = /^\s*false\s*$/iu;

/** @param {string | undefined} [value] */
function getBooleanInput(value) {
  let parsable = value;
  if (typeof value === "undefined") return false;
  if (typeof value !== "string") parsable = `${value}`;
  parsable = value.trim();
  if (!parsable) return false;
  if (trueStringRegexp.test(parsable)) return true;
  if (falseStringRegexp.test(parsable)) return false;
  try {
    const numbVal = parseInt(parsable, 10);
    if (typeof numbVal === "undefined") return false;
    if (typeof numbVal !== "number") throw new TypeError();
    return numbVal !== 0;
  } catch {
    return false;
  }
}

/**
 * @param {Pick<import("github-script").AsyncFunctionArguments, "core" | "exec">} args
 * @param {{
 *  command: string;
 *  arguments?: string | undefined,
 *  "working-directory"?: string | undefined;
 *  "ignore-exitcode"?: string | undefined;
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
  if (!getBooleanInput(inputs["ignore-exitcode"])) process.exitCode = exitCode;
}

module.exports = execute;
