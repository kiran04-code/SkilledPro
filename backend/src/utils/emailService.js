const nodemailer = require('nodemailer');

const createTransporter = () => {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '0', 10) || undefined;
  const secure = port === 465; // common secure port

  const auth = process.env.EMAIL_USER ? { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } : undefined;

  const opts = {};
  if (host) {
    opts.host = host;
    if (port) opts.port = port;
    opts.secure = secure;
  } else {
    // fallback to Gmail service if no SMTP host provided
    opts.service = 'gmail';
  }

  if (auth) opts.auth = auth;

  return nodemailer.createTransport(opts);
};

const sendVerificationOtpEmail = async (toEmail, toName, otp) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"SkilledPro" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Your SkilledPro verification code',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>SkilledPro Email Verification</title>
        </head>
        <body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
                  <tr>
                    <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:40px;text-align:center;">
                      <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">SkilledPro</h1>
                      <p style="color:#c7d2fe;margin:8px 0 0;font-size:14px;">Connect with skilled professionals</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:40px;">
                      <h2 style="color:#1e1b4b;font-size:22px;font-weight:700;margin:0 0 12px;">Confirm your email with OTP</h2>
                      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 8px;">
                        Hi <strong style="color:#374151;">${toName}</strong>,
                      </p>
                      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 28px;">
                        Thanks for signing up. Use this one-time verification code to activate your SkilledPro account.
                        This code is valid for <strong>5 minutes</strong>.
                      </p>
                      <div style="text-align:center;margin:0 0 28px;">
                        <div style="display:inline-block;background:#eef2ff;border:1px solid #c7d2fe;border-radius:14px;padding:18px 28px;">
                          <p style="margin:0 0 8px;color:#6366f1;font-size:12px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;">Verification Code</p>
                          <p style="margin:0;color:#1e1b4b;font-size:34px;font-weight:800;letter-spacing:0.35em;">${otp}</p>
                        </div>
                      </div>
                      <p style="color:#9ca3af;font-size:13px;line-height:1.6;margin:0;">
                        Enter this code on the SkilledPro verification screen to finish creating your account.
                      </p>
                      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px;margin:28px 0 0;">
                        <p style="color:#92400e;font-size:13px;margin:0;line-height:1.5;">
                          If you did not create a SkilledPro account, you can safely ignore this email.
                        </p>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px;text-align:center;">
                      <p style="color:#9ca3af;font-size:12px;margin:0;">Copyright 2026 SkilledPro. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };

  try {
    // Do not fail registration if verify() fails intermittently; attempt to send and catch errors
    await transporter.sendMail(mailOptions);
    console.log(`Verification OTP email sent to ${toEmail}`);
  } catch (err) {
    console.error('sendVerificationOtpEmail error:', err && err.stack ? err.stack : err);
    throw err;
  }
};

const sendVerificationEmail = async (toEmail, toName, token) => {
  const transporter = createTransporter();
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  const mailOptions = {
    from: `"SkilledPro" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Verify your SkilledPro account',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width,initial-scale=1" />
          <title>Verify your SkilledPro account</title>
        </head>
        <body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
                  <tr>
                    <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:32px;text-align:center;">
                      <h1 style="color:#ffffff;margin:0;font-size:26px;font-weight:700;">SkilledPro</h1>
                      <p style="color:#c7d2fe;margin:6px 0 0;font-size:13px;">Please verify your email to continue</p>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:28px;">
                      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 12px;">Hi <strong style="color:#374151;">${toName}</strong>,</p>
                      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 20px;">Click the button below to verify your SkilledPro account. This link will expire in 24 hours.</p>

                      <div style="text-align:center;margin:18px 0 22px;">
                        <a href="${verifyUrl}" style="display:inline-block;padding:12px 22px;background:#4f46e5;color:#fff;border-radius:10px;text-decoration:none;font-weight:700;">Verify Email</a>
                      </div>

                      <p style="color:#9ca3af;font-size:13px;line-height:1.6;margin:0 0 12px;">Or copy & paste this link into your browser:</p>
                      <p style="word-break:break-all;color:#374151;font-size:13px;background:#f8fafc;padding:10px;border-radius:8px;border:1px solid #eef2ff;">${verifyUrl}</p>

                      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:12px;margin:18px 0 0;">
                        <p style="color:#92400e;font-size:13px;margin:0;line-height:1.5;">If you did not create a SkilledPro account, you can safely ignore this email.</p>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:18px;text-align:center;">
                      <p style="color:#9ca3af;font-size:12px;margin:0;">Copyright ${new Date().getFullYear()} SkilledPro. All rights reserved.</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Verification link email sent to ${toEmail}`);
  } catch (err) {
    console.error('sendVerificationEmail error:', err && err.stack ? err.stack : err);
    throw err;
  }
};

module.exports = { sendVerificationEmail, sendVerificationOtpEmail };
