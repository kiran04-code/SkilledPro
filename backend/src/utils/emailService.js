const nodemailer = require('nodemailer');

/**
 * Creates a reusable Nodemailer transporter using Gmail SMTP.
 * Uses App Password for secure auth (no raw password stored).
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Gmail App Password (16 chars, no spaces)
    },
  });
};

/**
 * Sends an email verification link to a newly registered user.
 * @param {string} toEmail - Recipient email address
 * @param {string} toName  - Recipient name for personalisation
 * @param {string} token   - Secure random verification token
 */
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
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Email Verification</title>
        </head>
        <body style="margin:0;padding:0;background:#f4f6fb;font-family:'Segoe UI',Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0"
                  style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background:linear-gradient(135deg,#4f46e5,#7c3aed);padding:40px;text-align:center;">
                      <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">
                        SkilledPro
                      </h1>
                      <p style="color:#c7d2fe;margin:8px 0 0;font-size:14px;">Connect with skilled professionals</p>
                    </td>
                  </tr>

                  <!-- Body -->
                  <tr>
                    <td style="padding:40px;">
                      <h2 style="color:#1e1b4b;font-size:22px;font-weight:700;margin:0 0 12px;">
                        Verify your email address
                      </h2>
                      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 8px;">
                        Hi <strong style="color:#374151;">${toName}</strong>,
                      </p>
                      <p style="color:#6b7280;font-size:15px;line-height:1.6;margin:0 0 28px;">
                        Thanks for signing up! Click the button below to verify your email address and activate your account.
                        This link is valid for <strong>24 hours</strong>.
                      </p>

                      <!-- CTA Button -->
                      <div style="text-align:center;margin:0 0 28px;">
                        <a href="${verifyUrl}"
                          style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#ffffff;text-decoration:none;
                                 padding:14px 36px;border-radius:10px;font-size:16px;font-weight:600;letter-spacing:0.2px;">
                          ✅ Verify My Email
                        </a>
                      </div>

                      <!-- Fallback link -->
                      <p style="color:#9ca3af;font-size:13px;line-height:1.6;margin:0 0 4px;">
                        If the button doesn't work, copy and paste this link into your browser:
                      </p>
                      <p style="margin:0;">
                        <a href="${verifyUrl}" style="color:#4f46e5;font-size:13px;word-break:break-all;">
                          ${verifyUrl}
                        </a>
                      </p>

                      <!-- Warning -->
                      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px;margin:28px 0 0;">
                        <p style="color:#92400e;font-size:13px;margin:0;line-height:1.5;">
                          ⚠️ If you didn't create a SkilledPro account, you can safely ignore this email.
                        </p>
                      </div>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background:#f9fafb;border-top:1px solid #e5e7eb;padding:24px;text-align:center;">
                      <p style="color:#9ca3af;font-size:12px;margin:0;">
                        © 2026 SkilledPro. All rights reserved.
                      </p>
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

  // Verify connection before sending so errors are logged clearly
  await transporter.verify();
  await transporter.sendMail(mailOptions);
  console.log(`✅ Verification email sent to ${toEmail}`);

};

module.exports = { sendVerificationEmail };
