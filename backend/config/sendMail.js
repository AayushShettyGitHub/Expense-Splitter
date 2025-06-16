const nodemailer = require('nodemailer');

exports.sendResetEmail = async (email, otp) => {
 
  let testAccount = await nodemailer.createTestAccount();


  let transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  let info = await transporter.sendMail({
    from: '"YourApp" <no-reply@yourapp.com>',
    to: email,
    subject: "Password Reset OTP",
    text: `Your OTP for password reset is ${otp}. It expires in 10 minutes.`,
  });

  console.log("Message sent: %s", info.messageId);
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
};
