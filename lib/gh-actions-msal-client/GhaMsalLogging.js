/**
 * @param {import("./types").MsalNodeModule} msalNode
 * @param {import("@actions/core")} core
 */
module.exports = function getCoreLoggerOptions({ LogLevel }, core) {
  const { error, warning, info, isDebug, debug } = core;

  return {
    /** @type {import('@azure/msal-common').ILoggerCallback} */
    loggerCallback(level, message) {
      if (level === LogLevel.Error) error(message);
      else if (level === LogLevel.Warning) warning(message);
      else if (level === LogLevel.Info) info(message);
      else if (isDebug()) debug(message);
    },
    logLevel: isDebug() ? LogLevel.Verbose : LogLevel.Info,
    piiLoggingEnabled: false,
  };
};
