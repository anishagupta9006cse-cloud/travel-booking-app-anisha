const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function downloadTicket(b) {
  const l = b.listing || {};
  const date = new Date(b.startDate).toDateString();
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Ticket ${esc(b.code)}</title>
<style>
  body{font-family:Arial,sans-serif;background:#f3f6fb;padding:24px}
  .t{max-width:520px;margin:auto;background:#fff;border:2px dashed #1d4ed8;border-radius:12px;padding:24px}
  h1{margin:0 0 4px;color:#1d4ed8} .code{font-size:22px;font-weight:bold;letter-spacing:2px;margin:12px 0}
  table{width:100%;border-collapse:collapse} td{padding:8px 0;border-bottom:1px solid #eee} td:first-child{color:#666;width:40%}
  .note{margin-top:16px;font-size:12px;color:#666} button{margin-top:16px;padding:8px 16px}
  @media print{.noprint{display:none} body{background:#fff}}
</style></head><body><div class="t">
  <h1>TravelBook</h1><div>E-Ticket / Booking Confirmation</div>
  <div class="code">${esc(b.code)}</div>
  <table>
    <tr><td>Trip</td><td>${esc(l.title)}</td></tr>
    <tr><td>Type</td><td>${esc(l.type)}</td></tr>
    <tr><td>From</td><td>${esc(l.origin || '-')}</td></tr>
    <tr><td>To</td><td>${esc(l.destination)}</td></tr>
    <tr><td>Travel date</td><td>${esc(date)}</td></tr>
    <tr><td>Travelers</td><td>${esc(b.travelers)}</td></tr>
    <tr><td>Coach / seat area</td><td>${esc(b.coach || 'Not specified')}</td></tr>
    <tr><td>Amount paid</td><td>₹${Number(b.amount).toLocaleString('en-IN')}</td></tr>
    <tr><td>Status</td><td>${esc(b.status)}</td></tr>
  </table>
  <p class="note">In a medical emergency call 112. This ticket is for demo purposes.</p>
  <button class="noprint" onclick="window.print()">Print / Save as PDF</button>
</div></body></html>`;

  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `ticket-${b.code}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}