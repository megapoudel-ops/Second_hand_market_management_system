function renderTemplate(template, variables = {}) {
  const replace = (value) =>
    value.replace(/\{\{([a-zA-Z0-9_.]+)\}\}/g, (_match, key) => {
      const replacement = key.split('.').reduce((current, part) => current?.[part], variables);
      return replacement === undefined || replacement === null ? '' : String(replacement);
    });

  return {
    title: replace(template.title),
    message: replace(template.message)
  };
}

module.exports = { renderTemplate };
