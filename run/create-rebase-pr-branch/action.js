/** @param {string} repository */
function getRepoRef(repository) {
  const slashIdx = (repository || "").indexOf("/");
  if (slashIdx < 0) return { owner: undefined, repo: undefined };
  return {
    owner: repository.slice(0, slashIdx),
    repo: repository.slice(slashIdx + 1),
  };
}

/**
 * @param {ScriptArguments} args
 */
async function existsRef({ github, context, inputs }) {
  const { owner = context.repo.owner, repo = context.repo.repo } = getRepoRef(
    inputs.repository,
  );
  try {
    await github.rest.git.getRef({
      owner,
      repo,
      ref: `heads/${inputs["branch-name"]}`,
    });
  } catch (err) {
    const reqError =
      /** @type { import('@octokit/request-error').RequestError } */ (err);
    const { name, status } = reqError;
    if (name !== "HttpError" || status !== 404) {
      throw err;
    }
    return false;
  }
  return true;
}

/**
 * @param {ScriptArguments} args
 */
async function execute(args) {
  const {
    exec: { exec },
    inputs: { "branch-name": branchName, "working-directory": workDir },
  } = args;
  const branchExists = await existsRef(args);
  /** @type {import('@actions/exec').ExecOptions} */
  const execOpts = {
    cwd: workDir,
  };
  if (branchExists) {
    await exec(
      "git",
      ["checkout", "-B", "tmp/create-rebase-branch-upstream"],
      execOpts,
    );
    await exec(
      "git",
      ["fetch", "origin", `${branchName}:${branchName}`],
      execOpts,
    );
    await exec(
      "git",
      [
        "rebase",
        "--strategy-option=theirs",
        "tmp/create-rebase-branch-upstream",
        branchName,
      ],
      execOpts,
    );
  } else {
    await exec("git", ["checkout", "-B", branchName], execOpts);
  }
}

module.exports = execute;

/**
 * @typedef {Pick<
 *    import("github-script").AsyncFunctionArguments,
 *    "core" | "context" | "github" | "exec"
 *  > & {
 *  inputs: {
 *    'branch-name': string,
 *    'repository': string,
 *    'upstream-sha': string,
 *    'working-directory': string,
 *  }
 * }} ScriptArguments
 */
