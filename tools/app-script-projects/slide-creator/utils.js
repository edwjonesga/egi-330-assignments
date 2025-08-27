/**
 * Replaces placeholders in a template string with values from a data object.
 * Placeholders should be in the format ${key}.
 *
 * @param {string} template The template string.
 * @param {object} data The object containing key-value pairs for replacement.
 * @returns {string} The processed string with placeholders replaced.
 */
function fillTemplate(template, data) {
  return template.replace(/\$\{(\w+)\}/g, function(match, key) {
    return data.hasOwnProperty(key) ? data[key] : match;
  });
}
