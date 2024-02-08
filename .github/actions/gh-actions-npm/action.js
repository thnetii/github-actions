const regexErrorPattern = "^npm\\s+ERR!\\s+(.*)$";
const regexErrorMatcher = new RegExp(regexErrorPattern, "u");
const regexWarningPattern = "^npm\\s+WARN\\s+(\\S+)\\s(.*)$";
const regexWarningMatcher = new RegExp(regexWarningPattern, "u");

/**
 * @typedef {Object} BufferedMessage
 * @property {typeof import("@actions/core")["error"]} callback
 * @property {string} message
 * @property {string} [code]
 * @property {import('@actions/core').AnnotationProperties} properties
 */
/** @type {BufferedMessage[]} */
const msgBuffer = [];

/**
 * @param {import("@actions/core")} core
 * @param {string} line
 */
function tryGetErrorMatch(core, line) {
  const match = regexErrorMatcher.exec(line);
  if (!match) {
    return false;
  }
  const [message = "", title = ""] = match;
  msgBuffer.push({ callback: core.error, message, properties: { title } });
  return true;
}

/** @type {typeof tryGetErrorMatch} */
function tryGetWarningMatch(core, line) {
  const match = regexWarningMatcher.exec(line);
  if (!match) {
    return false;
  }
  const [message = "", code = "", title = ""] = match;
  msgBuffer.push({
    callback: core.warning,
    message,
    properties: {
      title,
    },
    code,
  });
  return true;
}

/** @see https://github.com/dword-design/package-name-regex/blob/658ce7a661512f3e1e5496d6eb1dfd5ec8ae65a1/src/index.js */
const npmPackageNameRegex =
  /(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*/;
const npmPackageNameRegexWithVersionAndColon = new RegExp(
  `^\\s*${npmPackageNameRegex.source}@\\S+:`,
  "u",
);

/**
 * @param {Pick<import("github-script").AsyncFunctionArguments, "core" | "exec">} args
 * @param {{
 *  arguments?: string | undefined;
 *  "working-directory"?: string | undefined;
 * }} inputs
 */
async function execute({ core, exec }, inputs) {
  const npmArgs = (inputs.arguments || "")
    .split("\n")
    .map((a) => a.trim())
    .filter((a) => !!a);
  const npmCwd = inputs["working-directory"];
  const exitCode = await exec.exec("npm", npmArgs, {
    cwd: npmCwd,
    ignoreReturnCode: true,
    listeners: {
      errline(line) {
        const handled =
          tryGetErrorMatch(core, line) || tryGetWarningMatch(core, line);
        if (handled) {
          /** Do nothing */
        }
      },
    },
  });

  const reducedMsgBuffer = msgBuffer.reduce((acc, cur) => {
    const prv = acc[acc.length - 1];
    let merged = false;
    if (prv) {
      const {
        callback: prvCb,
        code: prvCode,
        properties: { title: prvTitle = "" },
      } = prv;
      const {
        callback: curCb,
        code: curCode,
        properties: { title: curTitle = "" },
      } = cur;
      if (prvCb === curCb && prvCode && curCode && prvCode === curCode) {
        if (
          npmPackageNameRegexWithVersionAndColon.test(prvTitle) &&
          !npmPackageNameRegexWithVersionAndColon.test(curTitle)
        ) {
          prv.properties.title += `\n${curTitle}`;
          prv.message += `\n${cur.message}`;
          merged = true;
        }
      }
    }
    if (!merged) {
      acc.push(cur);
    }
    return acc;
  }, /** @type {typeof msgBuffer} */ ([]));
  for (const { callback, message, properties } of reducedMsgBuffer) {
    callback(message, properties);
  }
  core.setOutput("npm-exitcode", exitCode);
  process.exitCode = exitCode;
}

module.exports = execute;
