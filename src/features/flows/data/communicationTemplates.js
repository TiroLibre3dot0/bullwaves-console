// Local communication templates (MVP placeholders).
// Later: replace with API/CRM-backed templates while keeping stable IDs.

export const templatesById = {
  welcome_email: {
    id: 'welcome_email',
    channel: 'email',
    title: 'Welcome Email',
    subject: 'Your Account Manager is ready on WhatsApp',
    trigger: 'After registration (welcome sequence)',
    content: {
      html: `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bullwaves WhatsApp Contact</title>
</head>

<body style="margin:0;padding:0;background:#eef4ff;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#eef4ff;padding:25px 10px;">
<tr>
<td align="center">

<table width="600" cellpadding="0" cellspacing="0"
style="background:#fff;border-radius:14px;overflow:hidden;font-family:Arial,Helvetica,sans-serif;
border:1px solid #e6eef7;">

<!-- HEADER -->
<tr>
<td align="center" style="padding:28px 20px 14px;">
<img src="http://cdn.mcauto-images-production.sendgrid.net/c49e37cd579f1c08/60bf128f-a2f3-4d7d-a307-a75921400431/1185x1185.png"
width="85" style="display:block;">
<h2 style="margin:14px 0 6px;color:#0A122A;font-weight:900;">
Your Account Manager is ready on WhatsApp
</h2>
<p style="color:#55607a;font-size:13px;margin:0;">
Direct support. Fast answers. One real contact.
</p>
</td>
</tr>

<!-- TEXT -->
<tr>
<td align="center" style="padding:10px 40px 24px;">

<p style="font-size:13px;color:#0A122A;font-weight:800;">
Quick step: <span style="font-weight:600;color:#55607a;">
Save the number and send your first message.
</span>
</p>

<div style="background:#f4f7ff;border:1px solid #dbe5ff;
padding:14px 18px;border-radius:14px;display:inline-block;margin-top:10px;">
<div style="font-size:11px;color:#667;">WhatsApp number</div>
<div style="font-size:17px;font-weight:900;color:#0A122A;">
+357 99 514794
</div>
</div>

<p style="font-size:12px;color:#6a7590;margin-top:14px;">
No spam. Only account help and useful updates.
</p>

</td>
</tr>

<!-- WAVE TRANSITION (VISIBLE MOBILE) -->
<tr>
<td style="padding:0;background:#fff;line-height:0;">
<svg width="100%" height="95" viewBox="0 0 600 95"
preserveAspectRatio="none" style="display:block;">
<path d="M0,60 C130,15 260,15 340,40 C450,75 520,75 600,40 L600,95 L0,95 Z"
fill="#0036FF"></path>
</svg>
</td>
</tr>

<!-- CTA SECTION -->
<tr>
<td style="background:#002BE6;text-align:center;padding:26px 20px 30px;">

<a href="https://wa.me/35799514794?text=Hi%21%20I%20just%20registered%20with%20Bullwaves%20and%20saved%20your%20number%20%F0%9F%99%82%20Could%20you%20connect%20me%20with%20my%20account%20manager%3F"
style="background:#fff;color:#0036FF;
padding:15px 38px;border-radius:32px;
font-weight:900;text-decoration:none;font-size:14px;display:inline-block;">
Start WhatsApp Chat
</a>

<p style="color:#dce6ff;font-size:11px;margin-top:14px;">
Tip: saving the number keeps your support channel active.
</p>

</td>
</tr>

<!-- FOOTER PREMIUM -->
<tr>
<td style="background:#0A122A;padding:30px;text-align:center;">

<p style="color:#b9c6e2;font-size:12px;margin:0 0 16px;">
You’re connected directly with a dedicated Account Manager.
</p>

<div style="background:#fff;border-radius:14px;padding:12px 14px;display:inline-block;">
<img src="http://cdn.mcauto-images-production.sendgrid.net/c49e37cd579f1c08/e1f21c08-7a17-4dde-9dff-9527697b9cfe/762x729.png"
width="75" style="display:block;">
</div>

<p style="font-size:10px;color:#93a2c8;margin-top:18px;">
If you didn’t request this, please ignore this email.
</p>

<p style="margin:12px 0 0;font-size:10px;">
<a href="<%asm_group_unsubscribe_raw_url%>" style="color:#93a2c8;text-decoration:underline;">Unsubscribe</a>
</p>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>
`,
    },
  },

  welcome_whatsapp: {
    id: 'welcome_whatsapp',
    channel: 'whatsapp',
    title: 'Welcome WhatsApp Message',
    trigger: 'After welcome email (approx +10 min)',
    content: {
      text: `[A_first_outreach]\nCiao Marco, sono Sofia (Bullwaves).\nPer iniziare, rispondi con 1 parola:\nSetup / Verifica / Rischio\n\n[B_followup_2h]\nCiao Marco — promemoria rapido.\nSetup / Verifica / Rischio?\n— Sofia\n\n[C_followup_24h]\nCiao Marco. Ultimo promemoria: rispondi Setup / Verifica / Rischio e ti guido io.\n— Sofia`,
    },
  },
}
