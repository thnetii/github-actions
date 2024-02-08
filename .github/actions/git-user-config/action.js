const { exec } = require("@actions/exec");

const inputs = require("./readInputs");

async function main() {
  const configArgs = ["config"];
  const useGlobal = inputs["config-global"];
  if (useGlobal) {
    configArgs.push("--global");
  }
  /** @type {import('@actions/exec').ExecOptions} */
  const opts = { cwd: inputs["working-directory"] };
  await exec("git", [...configArgs, "user.name", inputs["user-name"]], opts);
  await exec("git", [...configArgs, "user.email", inputs["user-email"]], opts);
}

main();
