/**
 * @param {Pick<import("github-script").AsyncFunctionArguments, "core">} args
 * @param {{ datetime: string }} inputs
 */
async function execute({ core }, { datetime: dateString }) {
  const nowTime = new Date().getTime();
  const waitDate = new Date(dateString);
  const waitTime = waitDate.getTime();
  core.info(`Waiting until ${waitDate.toISOString()}`);
  const waitMs = waitTime - nowTime;
  await new Promise((resolve) => {
    setTimeout(resolve, waitMs);
  });
}

module.exports = execute;
