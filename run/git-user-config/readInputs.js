/* eslint-disable node/no-unpublished-require */
const {
  bindCoreHelpers,
} = require("../../lib/gh-actions-core-helpers/index.cjs");

const core = bindCoreHelpers(require("@actions/core"));

module.exports = {
  get "working-directory"() {
    return core.getInputEx("working-directory") || undefined;
  },
  get "config-global"() {
    return core.getBooleanOrUndefinedInput("config-global");
  },
  get "user-name"() {
    return core.getInputEx("user-name", { required: true });
  },
  get "user-email"() {
    return core.getInputEx("user-email", { required: true });
  },
};
