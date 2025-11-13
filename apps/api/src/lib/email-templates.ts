export function getVerificationEmailTemplate(
  name: string,
  verificationUrl: string
): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .container {
        background-color: #ffffff;
        border-radius: 8px;
        padding: 30px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
      }
      .logo {
        font-size: 24px;
        font-weight: bold;
        color: #4caf50;
        margin-bottom: 10px;
      }
      h1 {
        color: #333;
        font-size: 24px;
        margin-bottom: 20px;
      }
      .button {
        display: inline-block;
        background-color: #4caf50;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 5px;
        margin: 20px 0;
        font-weight: 500;
      }
      .button:hover {
        background-color: #45a049;
      }
      .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #eee;
        font-size: 12px;
        color: #666;
        text-align: center;
      }
      .url-text {
        word-break: break-all;
        color: #666;
        font-size: 12px;
        margin-top: 10px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">Group Pay</div>
      </div>
      <h1>Verify Your Email</h1>
      <p>Hi ${name},</p>
      <p>
        Thank you for signing up for Group Pay! Please verify your email address
        by clicking the button below:
      </p>
      <div style="text-align: center;">
        <a href="${verificationUrl}" class="button">Verify Email</a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p class="url-text">${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, you can safely ignore this email.</p>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Group Pay. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
  `.trim();
}

export function getResendVerificationEmailTemplate(
  name: string,
  verificationUrl: string
): string {
  return `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 600px;
        margin: 0 auto;
        padding: 20px;
      }
      .container {
        background-color: #ffffff;
        border-radius: 8px;
        padding: 30px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .header {
        text-align: center;
        margin-bottom: 30px;
      }
      .logo {
        font-size: 24px;
        font-weight: bold;
        color: #4caf50;
        margin-bottom: 10px;
      }
      h1 {
        color: #333;
        font-size: 24px;
        margin-bottom: 20px;
      }
      .button {
        display: inline-block;
        background-color: #4caf50;
        color: white;
        padding: 12px 24px;
        text-decoration: none;
        border-radius: 5px;
        margin: 20px 0;
        font-weight: 500;
      }
      .button:hover {
        background-color: #45a049;
      }
      .footer {
        margin-top: 30px;
        padding-top: 20px;
        border-top: 1px solid #eee;
        font-size: 12px;
        color: #666;
        text-align: center;
      }
      .url-text {
        word-break: break-all;
        color: #666;
        font-size: 12px;
        margin-top: 10px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <div class="logo">Group Pay</div>
      </div>
      <h1>Verify Your Email</h1>
      <p>Hi ${name},</p>
      <p>
        You requested a new verification email. Please verify your email address
        by clicking the button below:
      </p>
      <div style="text-align: center;">
        <a href="${verificationUrl}" class="button">Verify Email</a>
      </div>
      <p>Or copy and paste this link into your browser:</p>
      <p class="url-text">${verificationUrl}</p>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't request this email, you can safely ignore it.</p>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Group Pay. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
  `.trim();
}

