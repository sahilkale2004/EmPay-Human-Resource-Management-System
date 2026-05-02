const transporter = require('../config/mailer');

const sendWelcomeEmail = async (employee, plainPassword) => {
  try {
    const mailOptions = {
      from: `"EmPay HR" <${process.env.MAIL_USER}>`,
      to: employee.email,
      subject: "Welcome to EmPay â€” Your Login Credentials",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #5C7A5F;">Welcome to EmPay</h2>
          <p>Hello ${employee.first_name},</p>
          <p>Your EmPay account has been created.</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Login ID:</strong> ${employee.login_id}</p>
            <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${plainPassword}</p>
          </div>
          <p>Please log in at <a href="${process.env.APP_URL}" style="color: #5C7A5F;">${process.env.APP_URL}</a> and change your password immediately.</p>
          <p style="color: #666; font-size: 0.9em;">Do not share your credentials with anyone.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 0.8em; color: #999;">This is an automated message, please do not reply.</p>
        </div>
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Welcome email sent:', info.messageId);
    return info;
  } catch (err) {
    console.error('Failed to send welcome email:', err);
    // Do not block the employee creation response
  }
};

module.exports = {
  sendWelcomeEmail,
};
