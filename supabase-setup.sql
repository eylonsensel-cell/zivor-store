-- =============================================
-- ZIVOR Store — Supabase Database Setup
-- הרץ את כל זה ב-SQL Editor של Supabase
-- =============================================

-- ===== טבלת מוצרים =====
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  price INTEGER NOT NULL,
  compare_price INTEGER,
  stock INTEGER DEFAULT 99,
  images TEXT[] DEFAULT '{}',
  variants JSONB DEFAULT '{"colors": [], "sizes": []}',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== טבלת הזמנות =====
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number BIGINT GENERATED ALWAYS AS IDENTITY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  address TEXT,
  city TEXT,
  zip TEXT,
  items JSONB NOT NULL,
  subtotal INTEGER NOT NULL,
  shipping INTEGER DEFAULT 0,
  total INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','paid','processing','shipped','delivered','cancelled','refunded')),
  payment_ref TEXT,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ===== אינדקסים =====
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS orders_customer_email_idx ON orders(customer_email);

-- ===== Row Level Security =====
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- מוצרים: כולם קוראים מוצרים פעילים
CREATE POLICY "Public read active products"
  ON products FOR SELECT USING (active = true);

-- מוצרים: משתמש מחובר (אדמין) יכול לעשות הכל
CREATE POLICY "Admin full access products"
  ON products FOR ALL USING (auth.role() = 'authenticated');

-- הזמנות: כולם יכולים ליצור הזמנה (צ'קאאוט)
CREATE POLICY "Anyone can create orders"
  ON orders FOR INSERT WITH CHECK (true);

-- הזמנות: משתמש מחובר (אדמין) קורא ומעדכן הכל
CREATE POLICY "Admin read all orders"
  ON orders FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin update orders"
  ON orders FOR UPDATE USING (auth.role() = 'authenticated');

-- ===== עדכון updated_at אוטומטי =====
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ===== Storage — דלי לתמונות מוצר =====
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT DO NOTHING;

CREATE POLICY "Public view product images"
  ON storage.objects FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Admin upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.role() = 'authenticated');

CREATE POLICY "Admin delete product images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.role() = 'authenticated');

-- ===== מוצר ראשון — חגורת ZIVOR =====
INSERT INTO products (name, description, price, compare_price, stock, images, variants) VALUES (
  'חגורת ZIVOR אוטומטית',
  'חגורת נשים אוטומטית מתכווננת — ללא חורים, ללא מאמץ. מתאימה לכל מידה.',
  149,
  199,
  50,
  ARRAY['https://placehold.co/800x800/F2DDD1/1C1C1C?text=ZIVOR'],
  '{"colors": ["שחור", "בז׳"], "sizes": ["one-size"]}'::jsonb
);
