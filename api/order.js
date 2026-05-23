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
      const itemsHtml = items.map(i => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #F2DDD1;font-size:14px;color:#1C1C1C;">
            ${i.name}${i.colorStr ? ` — ${i.colorStr}` : i.color ? ` — ${i.color}` : ''} ×${i.qty || 1}
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #F2DDD1;font-size:14px;color:#1C1C1C;text-align:left;">
            ₪${i.price * (i.qty || 1)}
          </td>
        </tr>`).join('');

      const testBanner = test_mode ? `
        <div style="background:#FEF3C7;border:1px dashed #F59E0B;border-radius:8px;padding:12px;margin-bottom:20px;text-align:center;font-size:13px;color:#92400E;">
          🧪 הזמנת בדיקה — לא בוצע תשלום אמיתי
        </div>` : '';

      const emailHtml = `
<!DOCTYPE html>
<html lang="he" dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#FAF6F2;font-family:'Helvetica Neue',Arial,sans-serif;direction:rtl;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAF6F2;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:#1C1C1C;border-radius:16px 16px 0 0;padding:28px 36px;text-align:center;">
            <h1 style="margin:0;color:#FAF6F2;font-size:28px;font-weight:900;letter-spacing:-1px;">ZIVOR</h1>
            <p style="margin:6px 0 0;color:#C4957A;font-size:13px;">חגורות אוטומטיות פרימיום</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="background:#fff;padding:36px;border-right:1px solid #F2DDD1;border-left:1px solid #F2DDD1;">
            ${testBanner}
            <h2 style="margin:0 0 8px;font-size:22px;color:#1C1C1C;">ההזמנה אושרה! 🎉</h2>
            <p style="margin:0 0 24px;font-size:15px;color:#6B5B53;">היי ${customer_name}, תודה שקנית ב-ZIVOR!</p>

            <div style="background:#FAF6F2;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0;font-size:13px;color:#9D8D85;">מספר הזמנה</p>
              <p style="margin:4px 0 0;font-size:20px;font-weight:700;color:#1C1C1C;">#${order.order_number}</p>
            </div>

            <!-- Items -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
              <tr>
                <th style="text-align:right;font-size:12px;color:#9D8D85;font-weight:600;padding-bottom:8px;border-bottom:2px solid #F2DDD1;">פריט</th>
                <th style="text-align:left;font-size:12px;color:#9D8D85;font-weight:600;padding-bottom:8px;border-bottom:2px solid #F2DDD1;">מחיר</th>
              </tr>
              ${itemsHtml}
            </table>

            <!-- Totals -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr>
                <td style="font-size:13px;color:#6B5B53;padding:4px 0;">משלוח</td>
                <td style="font-size:13px;color:#6B5B53;text-align:left;">${shipping === 0 ? 'חינם 🎉' : '₪' + shipping}</td>
              </tr>
              <tr>
                <td style="font-size:16px;font-weight:700;color:#1C1C1C;padding-top:10px;border-top:2px solid #F2DDD1;">סה״כ לתשלום</td>
                <td style="font-size:16px;font-weight:700;color:#C4957A;text-align:left;padding-top:10px;border-top:2px solid #F2DDD1;">₪${total}</td>
              </tr>
            </table>

            <!-- Shipping address -->
            <div style="background:#FAF6F2;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
              <p style="margin:0 0 8px;font-size:13px;font-weight:600;color:#1C1C1C;">כתובת משלוח</p>
              <p style="margin:0;font-size:14px;color:#6B5B53;line-height:1.6;">
                ${address}<br>${city}${zip ? ' ' + zip : ''}<br>ישראל
              </p>
            </div>

            <!-- Delivery info -->
            <div style="border:1px solid #F2DDD1;border-radius:12px;padding:16px 20px;text-align:center;">
              <p style="margin:0 0 4px;font-size:13px;color:#9D8D85;">⏱️ זמן משלוח משוער</p>
              <p style="margin:0;font-size:15px;font-weight:600;color:#1C1C1C;">5–14 ימי עסקים</p>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#F2DDD1;border-radius:0 0 16px 16px;padding:20px 36px;text-align:center;">
            <p style="margin:0 0 8px;font-size:13px;color:#6B5B53;">שאלות? נשמח לעזור</p>
            <p style="margin:0;font-size:13px;">
              <a href="https://wa.me/972000000000" style="color:#C4957A;text-decoration:none;">💬 WhatsApp</a>
              &nbsp;·&nbsp;
              <a href="mailto:support@zivor-il.com" style="color:#C4957A;text-decoration:none;">support@zivor-il.com</a>
            </p>
            <p style="margin:12px 0 0;font-size:11px;color:#9D8D85;">© 2025 ZIVOR · zivor-il.com</p>
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
          subject: `${test_mode ? '[בדיקה] ' : ''}אישור הזמנה #${order.order_number} — ZIVOR`,
          html: emailHtml,
        }),
      }).catch(e => console.error('Email error:', e));
    }

    return new Response(
      JSON.stringify({ success: true, order_id: order.id, order_number: order.order_number }),
      { status: 200, headers: cors }
    );

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'שגיאה פנימית' }), { status: 500, headers: cors });
  }
}
