import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendMail(to: string, subject: string, text: string) {
  try {
    await transporter.sendMail({
      from: `"FinTrack" <${process.env.SMTP_USER}>`,
      to,
      subject,
      text,
    });
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}
