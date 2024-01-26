/* eslint-disable node/no-missing-require */
/* eslint-disable no-console */
/* eslint-disable no-await-in-loop */

const { execSync, fork } = require("node:child_process");
const path = require("node:path");
const { execPath } = require("node:process");
const { createRequire } = require("node:module");

/**
 * @param {Record<string, string> | undefined} dependencies
 * @param {NodeRequire} actionRequire
 */
function checkUnfulfilledPackageDependencies(dependencies, actionRequire) {
  let unfulfilledDependencies = false;
  for (const dependencyName of Object.keys(
    typeof dependencies === "object" ? dependencies : {},
  )) {
    try {
      process.stdout.write(`- ${dependencyName}`);
      actionRequire(dependencyName);
      console.log(": fulfilled");
    } catch (dependencyError) {
      if (dependencyError instanceof Error) {
        console.log(`: failed`);
      }
      console.log("At least one unfulfilled dependency detected.");
      unfulfilledDependencies = true;
      break;
    }
  }
  return unfulfilledDependencies;
}

/**
 * @param {string} repoRootPath
 */
function ensureForkableNpm(repoRootPath) {
  try {
    return require.resolve("npm");
  } catch (err) {
    // Do nothing
  }
  try {
    const execDir = path.dirname(execPath);
    return require.resolve("npm", { paths: [execDir] });
  } catch (err) {
    // Do nothing
  }

  const repoTmpPath = path.join(repoRootPath, "tmp");
  const repoTmpLibPath = path.join(repoTmpPath, "lib");
  const npmCommand = `npm --prefix "${repoTmpPath}" install --global npm --no-audit --no-fund`;
  console.log(`[command]${npmCommand}`);
  execSync(npmCommand, {
    cwd: __dirname,
    stdio: [process.stdin, process.stdout, process.stderr],
  });

  // eslint-disable-next-line node/no-missing-require
  const npmPath = require.resolve("npm", {
    paths: [repoTmpLibPath, repoTmpPath],
  });
  return npmPath;
}

const defaultNpmInstallArgs = [
  "--no-save",
  "--omit=dev",
  "--omit=peer",
  "--omit=optional",
  "--no-audit",
  "--no-fund",
];

/**
 * @param {string} actionPath
 * @param {string} npmPath
 */
function installPackageInLocalDirectory(actionPath, npmPath) {
  const npmArgs = ["--prefix", actionPath, "install", ...defaultNpmInstallArgs];
  const npmCommand = `npm ${npmArgs.join(" ")}`;
  console.log(`[command]${npmCommand}`);
  const npmFork = fork(npmPath, npmArgs, {
    cwd: actionPath,
  });

  /** @type {Promise<number>} */
  const npmPromise = new Promise((resolve) => {
    npmFork.on("exit", (exitCode) => {
      console.log(`npm exited with exit code: ${exitCode}.`);
      resolve(exitCode || 0);
    });
  });
  return npmPromise;
}

/**
 * @param {string} actionPath
 */
async function setup(actionPath) {
  const repoRootPath = path.resolve(path.join(__dirname, "..", ".."));

  const actionPackagePath = path.join(actionPath, "package.json");
  const actionRequire = createRequire(actionPath);
  /** @type {{name: string; dependencies?: Record<string, string>}} */
  const { name: actionPackageName, dependencies } =
    actionRequire(actionPackagePath);
  console.log(
    `Checking for unfulfilled dependencies of package: ${actionPackageName}`,
  );
  const unfulfilledDependencies = checkUnfulfilledPackageDependencies(
    dependencies,
    actionRequire,
  );
  if (!unfulfilledDependencies) {
    console.log(`All dependencies are installed. Setup complete.`);
    return;
  }

  const npmPath = ensureForkableNpm(repoRootPath);
  console.log(`npm module located at: ${npmPath}`);

  const localInstallExitCode = await installPackageInLocalDirectory(
    actionPath,
    npmPath,
  );
  if (localInstallExitCode === 0) console.log("Setup complete.");
}

module.exports = setup;
