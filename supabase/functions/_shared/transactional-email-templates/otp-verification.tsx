/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  code?: string
  recipientName?: string
}

const OTPEmail = ({ code = '0000', recipientName }: Props) => (
  <Html lang="fa" dir="rtl">
    <Head />
    <Preview>{`کد تایید آکادمی رفیعی: ${code}`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>آکادمی رفیعی</Heading>
        <Text style={text}>
          {recipientName ? `${recipientName} عزیز،` : 'سلام،'}
        </Text>
        <Text style={text}>
          برای تکمیل ورود، از کد تایید زیر استفاده کنید. این کد تا ۵ دقیقه معتبر است.
        </Text>
        <Section style={codeBox}>
          <Text style={codeText}>{code}</Text>
        </Section>
        <Text style={hint}>
          اگر این درخواست از سوی شما نبوده، می‌توانید این ایمیل را نادیده بگیرید.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: OTPEmail,
  subject: (data: Props) =>
    `کد تایید شما: ${data?.code ?? ''}`.trim(),
  displayName: 'OTP verification code',
  previewData: { code: '1234' },
} satisfies TemplateEntry

const main: React.CSSProperties = {
  backgroundColor: '#ffffff',
  fontFamily:
    "Vazir, Tahoma, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
}

const container: React.CSSProperties = {
  maxWidth: '480px',
  margin: '0 auto',
  padding: '32px 24px',
  textAlign: 'right',
}

const h1: React.CSSProperties = {
  color: '#0f172a',
  fontSize: '20px',
  fontWeight: 600,
  margin: '0 0 24px',
}

const text: React.CSSProperties = {
  color: '#334155',
  fontSize: '15px',
  lineHeight: '26px',
  margin: '0 0 16px',
}

const codeBox: React.CSSProperties = {
  backgroundColor: '#f1f5f9',
  borderRadius: '12px',
  padding: '20px',
  textAlign: 'center',
  margin: '24px 0',
}

const codeText: React.CSSProperties = {
  color: '#0f172a',
  fontSize: '34px',
  fontWeight: 700,
  letterSpacing: '10px',
  margin: 0,
  fontFamily: 'monospace',
}

const hint: React.CSSProperties = {
  color: '#94a3b8',
  fontSize: '13px',
  lineHeight: '22px',
  margin: '24px 0 0',
}
