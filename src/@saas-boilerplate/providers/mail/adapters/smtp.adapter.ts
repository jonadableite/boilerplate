import nodemailer from 'nodemailer'

import { MailProvider } from '../mail.provider'
import { type MailProviderOptions } from '../interfaces/provider.interface'
import { type Transporter } from 'nodemailer'

let transporter: Transporter | null = null

export const smtpAdapter = MailProvider.adapter(
  (options: MailProviderOptions) => {
    // Create a reusable transporter object using SMTP

    const getTransporter = () => {
      if (!transporter) {
        // Parse SMTP URL if provided in the format smtp://user:pass@host:port
        const smtpUrl = options.secret

        transporter = nodemailer.createTransport(smtpUrl)
      }

      return transporter
    }

    return {
      send: async ({ to, subject, html, text, scheduledAt }) => {
        const transport = getTransporter()

        // Set up email data
        const mailOptions = {
          from: options.from,
          to,
          subject,
          html,
          text,
          date: scheduledAt,
        }

        // Send mail with defined transport object
        const info = await transport.sendMail(mailOptions)
        return info
      },
    }
  },
)
