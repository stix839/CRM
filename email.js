'use strict';

// Branded M2 email footer (signature), built from the sender's profile.
// Email clients need table layout and inline styles; the logo must be a hosted PNG.

const DEFAULT_WEBSITE = process.env.WEBSITE_URL || 'https://m2-mediamanagement.com';

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function fmtPhone(p) {
  const d = String(p || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
  return d.length === 10 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : String(p || '').trim();
}

function siteLabel(url) {
  return String(url || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
}

// fields: { name, title, phone, email, website, logoUrl }
function signature(fields) {
  const f = { ...fields, website: fields.website || DEFAULT_WEBSITE };
  const phone = fmtPhone(f.phone);
  const tel = String(f.phone || '').replace(/\D/g, '');
  const contact = [
    phone ? `<a href="tel:+1${tel.slice(-10)}" style="color:#0a0a0a;text-decoration:none">${esc(phone)}</a>` : '',
    f.email ? `<a href="mailto:${esc(f.email)}" style="color:#0a0a0a;text-decoration:none">${esc(f.email)}</a>` : '',
  ].filter(Boolean).join('&nbsp;&nbsp;·&nbsp;&nbsp;');
  const html = `
<table cellpadding="0" cellspacing="0" border="0" role="presentation" style="margin-top:24px;border-collapse:collapse;font-family:Segoe UI,Helvetica,Arial,sans-serif">
  <tr><td colspan="2" style="border-top:2px solid #0a0a0a;padding-top:14px;font-size:0;line-height:0">&nbsp;</td></tr>
  <tr>
    <td valign="top" style="padding-right:14px">
      <a href="${esc(f.website)}" style="text-decoration:none"><img src="${esc(f.logoUrl)}" width="48" height="48" alt="M2" style="display:block;border:0;border-radius:11px;width:48px;height:48px"></a>
    </td>
    <td valign="top" style="font-size:13px;line-height:1.5;color:#3f3f46">
      <div style="font-size:15px;font-weight:700;color:#0a0a0a">${esc(f.name || '')}</div>
      <div style="font-size:12px;font-weight:600;color:#71717a;letter-spacing:.04em;text-transform:uppercase">${esc([f.title, 'M2'].filter(Boolean).join(' · '))}</div>
      ${contact ? `<div style="margin-top:4px">${contact}</div>` : ''}
      <div style="margin-top:2px"><a href="${esc(f.website)}" style="color:#0a0a0a;font-weight:600;text-decoration:underline">${esc(siteLabel(f.website))}</a></div>
    </td>
  </tr>
  <tr><td colspan="2" style="padding-top:10px;font-size:11px;color:#a1a1aa;letter-spacing:.06em;text-transform:uppercase">Social media that grows your business</td></tr>
</table>`.trim();
  const text = ['--', f.name, [f.title, 'M2'].filter(Boolean).join(' · '), [phone, f.email].filter(Boolean).join(' · '), f.website]
    .filter(Boolean).join('\n');
  return { html, text };
}

module.exports = { signature, DEFAULT_WEBSITE };
