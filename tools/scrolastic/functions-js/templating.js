// templating.js
const { getFromDb } = require("./dbutils");

/**
 * An asynchronous templating engine that can handle nested objects,
 * array lookups, and direct database lookups.
 * @param {string} template The template string.
 * @param {object} data The data to use for formatting.
 * @returns {Promise<string>} The formatted string.
 */
async function formatTemplate(template, data) {
  const regex = /\$\{(.+?)\}/g;
  const matches = [...template.matchAll(regex)];

  const promises = matches.map(match => {
    const path = match[1];
    if (path.startsWith('.db.')) {
      return getFromDb(path.substring(4)); // Remove '.db.' prefix
    } else {
      return Promise.resolve(get(data, path));
    }
  });

  const values = await Promise.all(promises);

  let result = template;
  for (let i = 0; i < matches.length; i++) {
    const match = matches[i][0];
    const value = values[i];
    if (value !== undefined) {
      // Stringify objects and arrays before replacing
      const replacement = typeof value === 'object' ? JSON.stringify(value, null, 2) : value;
      result = result.replace(match, replacement);
    }
  }

  return result;
}

/**
 * Gets a value from an object at a given path.
 * @param {object} obj The object to get the value from.
 * @param {string} path The path to the value.
 * @returns {*} The value at the given path, or undefined if it doesn't exist.
 */
function get(obj, path) {
  const parts = path.split(/[\.\[\]]/).filter(Boolean);
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    const match = part.match(/(\w+)=(.+)/);
    if (Array.isArray(current) && match) {
      const [_, key, value] = match;
      current = current.filter(item => item[key] == value);
    } else if (Array.isArray(current) && !isNaN(part)) {
        let index = parseInt(part, 10);
        if (index < 0) {
            index = current.length + index;
        }
        current = current[index];
    } else {
      current = current[part];
    }
  }
  return current;
}

module.exports = { formatTemplate };
