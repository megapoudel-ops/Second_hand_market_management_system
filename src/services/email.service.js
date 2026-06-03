const nodemailer = require('nodemailer');
const config = require('../config/env');

function hasSmtpConfig() {
  return (
    config.emailProvider === 'smtp' &&
    Boolean(config.smtp.host && config.smtp.user && config.smtp.pass)
  );
}

async function sendEmail({ to, subject, text }) {
  if (!hasSmtpConfig()) {
    console.log('[email:console]', { to, subject, text });
    return { provider: 'console', messageId: null };
  }

  const transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.secure,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass
    }
  });

  const result = await transporter.sendMail({
    from: config.smtp.from,
    to,
    subject,
    text
  });

  return { provider: 'smtp', messageId: result.messageId };
}

module.exports = { sendEmail };
