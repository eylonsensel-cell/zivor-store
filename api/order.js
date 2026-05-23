export const config = { runtime: 'edge' };

const SUPABASE_URL = 'https://wqbozlhyobharxaduink.supabase.co';
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;

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
    const { customer_name, customer_email, customer_phone, address, city, zip, items, subtotal, shipping, total, payment_method, test_mode } = body;

    if (!customer_name || !customer_email || !items?.length) {
      return new Response(JSON.stringify({ error: 'שדות חובה חסרים' }), { status: 400, headers: cors });
    }

    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_SECRET,
        'Authorization': `Bearer ${SUPABASE_SECRET}`,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        customer_name, customer_email, customer_phone,
        address, city, zip,
        items, subtotal, shipping, total,
        payment_method: payment_method || 'credit',
        status: test_mode ? 'test' : 'pending',
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Supabase error:', err);
      return new Response(JSON.stringify({ error: 'שגיאה בשמירת ההזמנה', detail: err, key_set: !!SUPABASE_SECRET }), { status: 500, headers: cors });
    }

    const [order] = await res.json();
    return new Response(JSON.stringify({ success: true, order_id: order.id, order_number: order.order_number }), { status: 200, headers: cors });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: 'שגיאה פנימית' }), { status: 500, headers: cors });
  }
}
