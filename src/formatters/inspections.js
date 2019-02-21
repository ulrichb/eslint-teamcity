const path = require('path');
const utils = require('../utils');

/**
 * Format results using the "inspections" style. ESLint messages are grouped by rule.
 * @param {array} results The output generated by running ESLint.
 * @param {object} config The settings to be used by the formatter.
 * @returns {array} The final list of messages to be displayed in TeamCity
 */
module.exports = (results, config) => {
  const { reportName } = config;
  const outputList = [];
  let errorCount = 0;
  let warningCount = 0;

  results.forEach(result => {
    const { messages } = result;

    if (messages.length === 0) {
      return;
    }

    const filePath = utils.escapeTeamCityString(path.relative(process.cwd(), result.filePath));

    messages.forEach(messageObj => {
      const { line, column, message, ruleId, fatal, severity } = messageObj;
      const isError = fatal || severity === 2;

      const escapedMessage = utils.escapeTeamCityString(message);
      const escapedRule = utils.escapeTeamCityString(ruleId);
      const formattedMessage = `line ${line}, col ${column}, ${escapedMessage}`;

      outputList.push(
        `##teamcity[inspectionType id='${escapedRule}' category='${reportName}' name='${escapedRule}' description='${reportName}']`
      );

      const severityLevel = isError ? 'ERROR' : 'WARNING';
      outputList.push(
        `##teamcity[inspection typeId='${escapedRule}' message='${formattedMessage}' ` +
          `file='${filePath}' line='${line}' SEVERITY='${severityLevel}']`
      );

      if (!isError) {
        warningCount += 1;
      } else {
        errorCount += 1;
      }
    });
  });

  outputList.push(
    `##teamcity[buildStatisticValue key='${config.errorStatisticsName}' value='${errorCount}']`
  );
  outputList.push(
    `##teamcity[buildStatisticValue key='${config.warningStatisticsName}' value='${warningCount}']`
  );

  return outputList;
};
