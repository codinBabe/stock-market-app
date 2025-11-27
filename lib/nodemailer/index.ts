import nodemailer from "nodemailer";
import {
  WELCOME_EMAIL_TEMPLATE,
  NEWS_SUMMARY_EMAIL_TEMPLATE,
} from "./template";
import { STOCK_ALERT_UPPER_EMAIL_TEMPLATE, STOCK_ALERT_LOWER_EMAIL_TEMPLATE } from "./template";

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASSWORD,
  },
});

export const sendWelcomeEmail = async ({
  email,
  name,
  intro,
}: WelcomeEmailData) => {
  const htmlTemplate = WELCOME_EMAIL_TEMPLATE.replace("{{name}}", name).replace(
    "{{intro}}",
    intro
  );

  const mailOptions = {
    from: `"Signalist" <signalist@techiebaker.pro>`,
    to: email,
    subject: `Welcome ${name} to Signalist - your stock market toolkit is ready!`,
    text: "Thanks for joining Signalist",
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};

export const sendPriceAlertEmail = async ({
  email,
  symbol,
  company,
  currentPrice,
  targetPrice,
  type,
  timestamp,
}: {
  email: string;
  symbol: string;
  company: string;
  currentPrice: number | string;
  targetPrice: number | string;
  type: "upper" | "lower";
  timestamp?: string;
}) => {
  const template =
    type === "upper" ? STOCK_ALERT_UPPER_EMAIL_TEMPLATE : STOCK_ALERT_LOWER_EMAIL_TEMPLATE;

  const htmlTemplate = template
    .replace("{{symbol}}", String(symbol))
    .replace("{{company}}", String(company))
    .replace("{{currentPrice}}", String(currentPrice))
    .replace("{{targetPrice}}", String(targetPrice))
    .replace("{{timestamp}}", timestamp || new Date().toLocaleString());

  const subject =
    type === "upper"
      ? `Price Alert: ${symbol} reached your upper target`
      : `Price Alert: ${symbol} hit your lower target`;

  const mailOptions = {
    from: `"Signalist" <signalist@techiebaker.pro>`,
    to: email,
    subject,
    text: `${symbol} price alert: current ${currentPrice} target ${targetPrice}`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};

export const sendNewsSummaryEmail = async ({
  email,
  date,
  newsContent,
}: {
  email: string;
  date: string;
  newsContent: string;
}) => {
  const htmlTemplate = NEWS_SUMMARY_EMAIL_TEMPLATE.replace(
    "{{date}}",
    date
  ).replace("{{newsContent}}", newsContent);

  const mailOptions = {
    from: `"Signalist" <signalist@techiebaker.pro>`,
    to: email,
    subject: `Signalist - Market News Summary for Today - ${date}`,
    text: `Market news summary for ${date}`,
    html: htmlTemplate,
  };

  await transporter.sendMail(mailOptions);
};
