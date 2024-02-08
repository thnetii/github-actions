/**
 * @param {Pick<import("github-script").AsyncFunctionArguments, "core" | "context" | "github">} args
 */
async function execute({ github, context, core }) {
  core.debug("requesting details about current run from GitHub API");
  const runResp = await github.rest.actions.getWorkflowRun({
    owner: context.repo.owner,
    repo: context.repo.repo,
    run_id: context.runId,
  });
  const { workflow_id: workflowId } = runResp.data;
  core.info(`Determined ${workflowId} as the wokflow id of the current run`);
  core.setOutput("workflow-id", workflowId);
}

module.exports = execute;
