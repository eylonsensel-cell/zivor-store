export const config = { runtime: 'edge' };

const SUPABASE_URL   = 'https://wqbozlhyobharxaduink.supabase.co';
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;
const RESEND_KEY      = process.env.RESEND_API_KEY;

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const cors = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    const body = await req.json();
    const { customer_name, customer_email, customer_phone, address, city, zip,
            items, subtotal, shipping, total, payment_method, notes, test_mode } = body;

    if (!customer_name || !customer_email || !items?.length) {
      return new Response(JSON.stringify({ error: 'שדות חובה חסרים' }), { status: 400, headers: cors });
    }

    /* ── Save to Supabase ── */
    const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SECRET,
        'Authorization': `Bearer ${SUPABASE_SECRET}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        customer_name, customer_email, customer_phone,
        address, city, zip, notes,
        items, subtotal, shipping, total,
        payment_method: payment_method || 'credit',
        status: test_mode ? 'test' : 'pending',
      }),
    });

    if (!dbRes.ok) {
      const err = await dbRes.text();
      console.error('Supabase error:', err);
      return new Response(JSON.stringify({ error: 'שגיאה בשמירת ההזמנה' }), { status: 500, headers: cors });
    }

    const [order] = await dbRes.json();

    /* ── Send confirmation email ── */
    if (RESEND_KEY) {
      const testBanner = test_mode ? `
        <div style="background:#FEF3C7;border:1px dashed #F59E0B;border-radius:8px;padding:12px;margin-bottom:20px;text-align:center;font-size:13px;color:#92400E;">
          🧪 הזמנת בדיקה — לא בוצע תשלום אמיתי
        </div>` : '';

      const itemsHtmlDetailed = items.map(i => {
        const imgCell = i.imgUrl
          ? `<td width="56" style="padding:10px 0 10px 12px;vertical-align:top;">
               <img src="${i.imgUrl}" width="56" height="56" alt="${i.name}" style="width:56px;height:56px;border-radius:10px;object-fit:cover;display:block;">
             </td>`
          : '';
        const label = `${i.name}${i.colorStr ? ` · ${i.colorStr}` : i.color ? ` · ${i.color}` : ''}`;
        return `<tr>
          ${imgCell}
          <td style="padding:10px 0;border-bottom:1px solid #F2DDD1;font-size:14px;color:#1C1C1C;vertical-align:middle;">
            <span style="font-weight:600;">${label}</span><br>
            <span style="font-size:12px;color:#9D8D85;">כמות: ${i.qty || 1}</span>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #F2DDD1;font-size:14px;font-weight:700;color:#1C1C1C;text-align:left;vertical-align:middle;white-space:nowrap;">
            ₪${i.price * (i.qty || 1)}
          </td>
        </tr>`;
      }).join('');

      const emailHtml = `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
  <style>@import url('https://fonts.googleapis.com/css2?family=Heebo:wght@400;600;700;800;900&display=swap');</style>
</head>
<body style="margin:0;padding:0;background:#FAF6F2;font-family:'Heebo','Helvetica Neue',Arial,sans-serif;direction:rtl;">

  <!-- Preview text (hidden, shows in inbox preview) -->
  <span style="display:none;max-height:0;overflow:hidden;mso-hide:all;">
    הזמנה #${order.order_number} התקבלה — החגורה שלך בדרך אלייך תוך 5–14 ימים 📦
  </span>

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6F2;padding:32px 16px;">
  <tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

    <!-- HEADER BANNER -->
    <tr>
      <td style="border-radius:20px 20px 0 0;overflow:hidden;background:linear-gradient(135deg,#1C1C1C 0%,#2d2d2d 60%,#3a2a22 100%);padding:0;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:32px 36px 24px;text-align:center;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C4957A;font-weight:600;">ORDER CONFIRMED</p>
              <h1 style="margin:0;color:#FAF6F2;font-size:38px;font-weight:900;letter-spacing:-2px;">ZIVOR</h1>
              <p style="margin:6px 0 0;color:#FAF6F2;opacity:0.5;font-size:12px;">החגורה האוטומטית</p>
            </td>
          </tr>
          <!-- Accent bar -->
          <tr><td style="height:4px;background:linear-gradient(90deg,#C4957A,#E8C5A0,#C4957A);"></td></tr>
        </table>
      </td>
    </tr>

    <!-- HERO TEXT -->
    <tr>
      <td style="background:#fff;padding:36px 36px 0;border-right:1px solid #F2DDD1;border-left:1px solid #F2DDD1;">
        ${testBanner}
        <h2 style="margin:0 0 6px;font-size:24px;font-weight:800;color:#1C1C1C;letter-spacing:-0.5px;">
          ההזמנה התקבלה! 🎉
        </h2>
        <p style="margin:0 0 28px;font-size:15px;color:#6B5B53;line-height:1.6;">
          היי ${customer_name}, תודה שבחרת ב-ZIVOR.<br>
          אנחנו מכינים את החגורה שלך לשליחה.
        </p>

        <!-- Order number pill -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td style="background:#FAF6F2;border-radius:14px;padding:18px 22px;border:1px solid #F2DDD1;">
              <p style="margin:0;font-size:12px;color:#9D8D85;font-weight:600;text-transform:uppercase;letter-spacing:1px;">מספר הזמנה</p>
              <p style="margin:6px 0 0;font-size:26px;font-weight:900;color:#1C1C1C;letter-spacing:-1px;">#${order.order_number}</p>
            </td>
          </tr>
        </table>

        <!-- Divider label -->
        <p style="margin:0 0 12px;font-size:12px;color:#9D8D85;font-weight:600;text-transform:uppercase;letter-spacing:1px;border-bottom:1px solid #F2DDD1;padding-bottom:10px;">פרטי ההזמנה</p>

        <!-- Items -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
          ${itemsHtmlDetailed}
        </table>

        <!-- Totals -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td style="font-size:13px;color:#6B5B53;padding:5px 0;">משלוח</td>
            <td style="font-size:13px;color:#6B5B53;text-align:left;">${shipping === 0 ? '✦ חינם' : '₪' + shipping}</td>
          </tr>
          <tr>
            <td style="font-size:17px;font-weight:800;color:#1C1C1C;padding-top:12px;border-top:2px solid #F2DDD1;">סה״כ לתשלום</td>
            <td style="font-size:17px;font-weight:800;color:#C4957A;text-align:left;padding-top:12px;border-top:2px solid #F2DDD1;">₪${total}</td>
          </tr>
        </table>

        <!-- Shipping address -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
          <tr>
            <td style="background:#FAF6F2;border-radius:14px;padding:18px 22px;border:1px solid #F2DDD1;">
              <p style="margin:0 0 8px;font-size:12px;color:#9D8D85;font-weight:600;text-transform:uppercase;letter-spacing:1px;">כתובת משלוח</p>
              <p style="margin:0;font-size:14px;color:#1C1C1C;line-height:1.7;">
                ${customer_name}<br>
                ${address}<br>
                ${city}${zip ? ' ' + zip : ''}<br>
                ישראל
              </p>
            </td>
          </tr>
        </table>

        <!-- Delivery estimate -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
          <tr>
            <td align="center" style="background:#FAF6F2;border-radius:14px;padding:18px 22px;border:1px solid #F2DDD1;text-align:center;">
              <p style="margin:0 0 2px;font-size:22px;">📦</p>
              <p style="margin:0 0 4px;font-size:13px;color:#9D8D85;">זמן משלוח משוער</p>
              <p style="margin:0;font-size:17px;font-weight:800;color:#1C1C1C;">5–14 ימי עסקים</p>
              <p style="margin:4px 0 0;font-size:12px;color:#9D8D85;">תקבלי עדכון כשהחבילה תצא</p>
            </td>
          </tr>
        </table>


      </td>
    </tr>

    <!-- TRUST STRIP -->
    <tr>
      <td style="background:#F9F1EB;border-right:1px solid #F2DDD1;border-left:1px solid #F2DDD1;padding:16px 36px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="text-align:center;font-size:12px;color:#6B5B53;width:33%;">
              <p style="margin:0;font-size:18px;">🔒</p>
              <p style="margin:2px 0 0;">תשלום מאובטח</p>
            </td>
            <td style="text-align:center;font-size:12px;color:#6B5B53;width:33%;border-right:1px solid #F2DDD1;border-left:1px solid #F2DDD1;">
              <p style="margin:0;font-size:18px;">↩️</p>
              <p style="margin:2px 0 0;">30 יום החזרה</p>
            </td>
            <td style="text-align:center;font-size:12px;color:#6B5B53;width:33%;">
              <p style="margin:0;font-size:18px;">⭐</p>
              <p style="margin:2px 0 0;">4,800+ לקוחות</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- FOOTER -->
    <tr>
      <td style="background:#1C1C1C;border-radius:0 0 20px 20px;padding:24px 36px;text-align:center;">
        <p style="margin:0 0 6px;font-size:13px;color:#FAF6F2;opacity:0.7;">
          <a href="mailto:support@zivor-il.com" style="color:#C4957A;text-decoration:none;">support@zivor-il.com</a>
          &nbsp;·&nbsp;
          <a href="https://zivor-il.com" style="color:#FAF6F2;opacity:0.7;text-decoration:none;">zivor-il.com</a>
        </p>
        <p style="margin:8px 0 0;font-size:11px;color:#FAF6F2;opacity:0.35;">© 2025 ZIVOR · כל הזכויות שמורות</p>
      </td>
    </tr>

  </table>
  </td></tr>
  </table>
</body>
</html>`;

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'ZIVOR <orders@zivor-il.com>',
          to: [customer_email],
          bcc: 'zivorilstore@gmail.com',
          subject: `${test_mode ? '[בדיקה] ' : ''}${customer_name}, ההזמנה שלך אושרה #${order.order_number} 🎉`,
          html: emailHtml,
        }),
      }).then(r => r.json()).then(d => console.log('Resend:', JSON.stringify(d))).catch(e => console.error('Email error:', e));
    }

    return new Response(
      JSON.stringify({ success: true, order_id: order.id, order_number: order.order_number, email_attempted: !!RESEND_KEY }),
      { status: 200, headers: cors }
    );

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'שגיאה פנימית' }), { status: 500, headers: cors });
  }
}
