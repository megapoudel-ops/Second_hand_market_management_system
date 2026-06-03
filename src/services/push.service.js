async function sendPush({ tokens, title, message, data }) {
  console.log('[push:console]', { tokens, title, message, data });
  return { provider: 'console', messageId: null };
}

module.exports = { sendPush };
