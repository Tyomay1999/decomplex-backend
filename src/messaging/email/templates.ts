import { EmailJobPayload } from "../rabbitmq/emailQueue";

export interface RenderedEmail {
  subject: string;
  html: string;
}

export function renderEmailTemplate(payload: EmailJobPayload): RenderedEmail {
  const language = payload.language ?? "en";
  const vars = payload.variables ?? {};
  const name = (vars.name as string) || "User";
  const lastName = (vars.lastName as string) || "";

  switch (payload.template) {
    case "AfterVerificationUserEmail": {
      const subject =
        payload.subject ||
        (language === "am" ? "Գրանցումը հաջողությամբ հաստատված է" : "Registration confirmed");

      const html = `
<!DOCTYPE html>
<html lang="${language}">
  <body>
    <p>This is email message.</p>
    <p>Hello, ${name} ${lastName}</p>
    <p>Your registration has been successfully confirmed.</p>
  </body>
</html>
      `.trim();

      return { subject, html };
    }

    default: {
      const subject = payload.subject || "Notification from Decomplex";
      const html = `
<!DOCTYPE html>
<html lang="${language}">
  <body>
    <p>This is email message.</p>
  </body>
</html>
      `.trim();

      return { subject, html };
    }
  }
}
