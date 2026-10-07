import { AbstractNotificationProviderService, MedusaError } from '@medusajs/framework/utils'
import type {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from '@medusajs/framework/types'
import nodemailer, { type Transporter } from 'nodemailer'

type InjectedDependencies = {
  logger: Logger
}

type Options = {
  host: string
  port: number
  user: string
  pass: string
  /** Default sender, for example `Shop name <shop@example.com>`. */
  from: string
}

const REQUIRED_OPTIONS = ['host', 'port', 'user', 'pass', 'from'] as const

/**
 * Sends email-channel notifications over SMTP (Gmail in v1; docs/decisions.md, "Outbound email
 * through Gmail SMTP"). Callers pass the finished message in `content` (subject plus html and/or
 * text); this provider does no templating.
 */
class SmtpNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = 'smtp'

  protected logger_: Logger
  protected options_: Options
  protected transporter_: Transporter

  constructor({ logger }: InjectedDependencies, options: Options) {
    super()

    this.logger_ = logger
    this.options_ = options
    this.transporter_ = nodemailer.createTransport({
      host: options.host,
      port: Number(options.port),
      // Port 465 uses TLS from the start; 587 upgrades with STARTTLS.
      secure: Number(options.port) === 465,
      auth: { user: options.user, pass: options.pass },
    })
  }

  static validateOptions(options: Record<any, any>) {
    const missing = REQUIRED_OPTIONS.filter((key) => !options[key])

    if (missing.length) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `SMTP notification provider is missing options: ${missing.join(', ')}. Set the SMTP_* variables in .env.`
      )
    }
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const { to, from, content, attachments, template } = notification

    if (!content?.subject || !(content.html || content.text)) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        `Email "${template}" needs content.subject and content.html or content.text.`
      )
    }

    const info = await this.transporter_.sendMail({
      from: from || this.options_.from,
      to,
      subject: content.subject,
      html: content.html,
      text: content.text,
      attachments: attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content,
        encoding: 'base64',
        contentType: attachment.content_type,
        contentDisposition: attachment.disposition as 'attachment' | 'inline' | undefined,
        cid: attachment.id,
      })),
    })

    this.logger_.info(`Sent email "${template}" (${info.messageId})`)

    return { id: info.messageId }
  }
}

export default SmtpNotificationProviderService
