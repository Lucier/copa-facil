import { Injectable, Logger, OnModuleInit } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as nodemailer from 'nodemailer'
import type { Transporter } from 'nodemailer'

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name)
  private transporter!: Transporter
  private fromAddress!: string

  constructor(private readonly config: ConfigService) {}

  async onModuleInit() {
    const isDev = this.config.get<string>('NODE_ENV') !== 'production'

    if (isDev) {
      const testAccount = await nodemailer.createTestAccount()
      this.transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        auth: { user: testAccount.user, pass: testAccount.pass },
      })
      this.fromAddress = `Cerrados Esportes <${testAccount.user}>`
      this.logger.log(`[DEV] Mail transporter ready (ethereal). Preview at https://ethereal.email`)
    } else {
      this.transporter = nodemailer.createTransport({
        host: this.config.getOrThrow<string>('MAIL_HOST'),
        port: this.config.get<number>('MAIL_PORT') ?? 587,
        secure: this.config.get<boolean>('MAIL_SECURE') ?? false,
        auth: {
          user: this.config.getOrThrow<string>('MAIL_USER'),
          pass: this.config.getOrThrow<string>('MAIL_PASS'),
        },
      })
      this.fromAddress =
        this.config.get<string>('MAIL_FROM') ?? 'Cerrados Esportes <noreply@cerradosesportes.com.br>'
    }
  }

  async sendPasswordReset(to: string, name: string, resetUrl: string): Promise<void> {
    const info = await this.transporter.sendMail({
      from: this.fromAddress,
      to,
      subject: 'Redefinição de senha — Cerrados Esportes',
      text: `Olá, ${name}!\n\nClique no link abaixo para redefinir sua senha (válido por 1 hora):\n\n${resetUrl}\n\nSe você não solicitou isso, ignore este e-mail.`,
      html: `<p>Olá, <strong>${name}</strong>!</p>
<p>Clique no botão abaixo para redefinir sua senha (válido por 1 hora):</p>
<p><a href="${resetUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none">Redefinir senha</a></p>
<p>Se você não solicitou isso, ignore este e-mail.</p>`,
    })

    if (nodemailer.getTestMessageUrl(info)) {
      this.logger.log(`[DEV] Reset password email preview: ${nodemailer.getTestMessageUrl(info)}`)
    }
  }

  async sendInvitation(to: string, orgName: string, inviteUrl: string): Promise<void> {
    const info = await this.transporter.sendMail({
      from: this.fromAddress,
      to,
      subject: `Convite para ${orgName} — Cerrados Esportes`,
      text: `Você foi convidado para fazer parte de ${orgName} no Cerrados Esportes.\n\nAcesse o link abaixo para aceitar (válido por 7 dias):\n\n${inviteUrl}`,
      html: `<p>Você foi convidado para fazer parte de <strong>${orgName}</strong> no Cerrados Esportes.</p>
<p><a href="${inviteUrl}" style="background:#2563eb;color:#fff;padding:12px 24px;border-radius:6px;text-decoration:none">Aceitar convite</a></p>
<p>Este convite expira em 7 dias.</p>`,
    })

    if (nodemailer.getTestMessageUrl(info)) {
      this.logger.log(`[DEV] Invitation email preview: ${nodemailer.getTestMessageUrl(info)}`)
    }
  }
}
