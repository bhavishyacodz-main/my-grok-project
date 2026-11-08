export type MailResult = { delivered: false; reason: string };

/** Provider-independent mail slot. Nothing is sent until a provider is wired server-side. */
export async function sendMail(_input: {
  to: string;
  subject: string;
  text: string;
}): Promise<MailResult> {
  return {
    delivered: false,
    reason: "No email provider is configured, so this message was not sent.",
  };
}
