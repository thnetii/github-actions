/**
 * @param {Pick<import("github-script").AsyncFunctionArguments, "exec">} args
 */
async function execute({ exec }) {
  await exec.exec("dotnet", ["--info"]);
}

module.exports = execute;
