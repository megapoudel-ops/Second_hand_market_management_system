async function sendSms({ to, message }) {
  console.log('[sms:console]', { to, message });
  return { provider: 'console', messageId: null };
}

module.exports = { sendSms };
