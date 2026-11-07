import { execSync } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'

const SQL = `
BEGIN;

-- 1. Ensure Tenant exists and is active with proper name
UPDATE tenants 
SET name = 'Kotacom IT Service & Percetakan Digital',
    phone = '0812-3456-7890',
    email = 'admin@kotacom.id',
    address = 'Jl. Ngagel Jaya Selatan No. 88, Surabaya',
    plan_code = 'enterprise-monthly',
    is_active = true
WHERE id = '5f6909cb-e54f-4041-a0d0-045ad54d2481';

-- 2. Demo User demo@kotacom.id (password: demo12345)
-- sha256(demo12345) = 51459c23ca91ebce271449dd8b5c26751c99039c2ae4c628067898ca0e104039
INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
VALUES (
  'd3300000-0000-4000-a000-000000000001',
  'demo@kotacom.id',
  '51459c23ca91ebce271449dd8b5c26751c99039c2ae4c628067898ca0e104039',
  'Demo Owner Kotacom',
  'user',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE 
SET email = EXCLUDED.email, password_hash = EXCLUDED.password_hash, name = EXCLUDED.name;

-- 3. Tenant Memberships for demo user
INSERT INTO tenant_members (id, tenant_id, user_id, role, is_active, created_at, updated_at)
VALUES (
  'd3300000-0000-4000-a000-000000000002',
  '5f6909cb-e54f-4041-a0d0-045ad54d2481',
  'd3300000-0000-4000-a000-000000000001',
  'owner',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 4. Default Branch
INSERT INTO branches (id, tenant_id, name, address, phone, is_default, is_active, created_at, updated_at)
VALUES (
  'b1000000-0000-4000-a000-000000000001',
  '5f6909cb-e54f-4041-a0d0-045ad54d2481',
  'Kotacom Workshop Surabaya',
  'Jl. Ngagel Jaya Selatan No. 88, Surabaya',
  '0812-3456-7890',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 5. Default Warehouse
INSERT INTO warehouses (id, tenant_id, branch_id, name, is_default, is_active, created_at, updated_at)
VALUES (
  '00000000-0000-4000-a000-000000000001',
  '5f6909cb-e54f-4041-a0d0-045ad54d2481',
  'b1000000-0000-4000-a000-000000000001',
  'Gudang Sparepart & Toko',
  true,
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- 6. Product Categories
INSERT INTO product_categories (id, tenant_id, name, is_active, sync_status, version, created_at, updated_at)
VALUES 
  ('00000000-0000-4000-b000-000000000001', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'Sparepart HP & Tablet', true, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-b000-000000000002', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'Hardware Laptop & PC', true, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-b000-000000000003', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'Bahan Percetakan & Kertas', true, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-b000-000000000004', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'Aksesoris & Retail', true, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-b000-000000000005', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'Jasa Servis & Desain', true, 'synced', 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 7. Customers
INSERT INTO customers (id, tenant_id, branch_id, name, phone, address, is_active, sync_status, version, created_at, updated_at)
VALUES
  ('00000000-0000-4000-c000-000000000001', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', 'Budi Santoso (Toko Berkah)', '0812-3456-7890', 'Ruko Manyar Jaya Blok B4, Surabaya', true, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-c000-000000000002', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', 'Ibu Maya (CV Graha Media)', '0813-9988-7766', 'Kawasan Industri Rungkut, Surabaya', true, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-c000-000000000003', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', 'Rian Pratama', '0857-1234-5678', 'Jl. Gubeng Kertajaya VIII, Surabaya', true, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-c000-000000000004', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', 'Dimas Wahyudi', '0896-7788-9900', 'Asrama Mahasiswa ITS Sukolilo', true, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-c000-000000000005', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', 'Bu Siti Aminah (Sekolah Harapan)', '0821-5566-7788', 'Jl. Raya Kebomas, Gresik', true, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-c000-000000000006', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', 'Kevin Sanjaya', '0878-1122-3344', 'Perumahan Dharmahusada Indah', true, 'synced', 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 8. Suppliers
INSERT INTO suppliers (id, tenant_id, name, phone, city, payable, orders, is_active, sync_status, version, created_at, updated_at)
VALUES
  ('00000000-0000-4000-d000-000000000001', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'PT Master Sparepart Glodok', '021-62548899', 'Jakarta Barat', 0, 14, true, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-d000-000000000002', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'IndoPrint Media Jaya', '031-8472911', 'Sidoarjo', 0, 8, true, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-d000-000000000003', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'Sentral Komputer Distribusi', '031-5349001', 'Surabaya', 0, 22, true, 'synced', 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 9. Products & Spareparts
INSERT INTO products (id, tenant_id, branch_id, category_id, name, sku, barcode, type, sale_price, wholesale_price, cost_price, minimum_stock, is_active, manage_stock, sync_status, version, created_at, updated_at)
VALUES
  ('00000000-0000-4000-e000-000000000001', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000001', 'LCD iPhone 11 Pro OLED Original OEM', 'SP-LCD-IP11P', '8990001001', 'physical', 650000, 590000, 420000, 3, true, true, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-e000-000000000002', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000001', 'Baterai Samsung Galaxy A52 (4500mAh)', 'SP-BAT-SMA52', '8990001002', 'physical', 185000, 160000, 95000, 5, true, true, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-e000-000000000003', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000001', 'Flexible Charger Board Type-C Xiaomi Note 10', 'SP-FLX-XMN10', '8990001003', 'physical', 75000, 60000, 35000, 4, true, true, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-e000-000000000004', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000002', 'SSD NVMe M.2 512GB Kingston NV2 Gen 4', 'HW-SSD-512K', '8990002001', 'physical', 550000, 510000, 410000, 4, true, true, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-e000-000000000005', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000002', 'RAM DDR4 Sodimm 8GB 3200MHz Samsung', 'HW-RAM-8GB32', '8990002002', 'physical', 320000, 290000, 230000, 5, true, true, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-e000-000000000006', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000002', 'Thermal Paste Arctic MX-4 4gr Original', 'HW-TP-ARCTIC', '8990002003', 'physical', 85000, 75000, 50000, 6, true, true, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-e000-000000000007', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000002', 'Keyboard Laptop Asus TUF Gaming FX505', 'HW-KBD-ASUS', '8990002004', 'physical', 240000, 210000, 160000, 2, true, true, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-e000-000000000008', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000003', 'Kertas Art Paper 260gr A3+ (Rim / 500 Lbr)', 'BP-AP260-A3', '8990003001', 'physical', 140000, 125000, 95000, 5, true, true, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-e000-000000000009', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000003', 'Stiker Vinyl Matte A3+ Waterproof (Pack)', 'BP-STK-VINYL', '8990003002', 'physical', 110000, 95000, 72000, 4, true, true, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-e000-000000000010', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000003', 'Bahan Banner Flexi Korea 340gr (per m2)', 'BP-FLX-340', '8990003003', 'physical', 35000, 28000, 18000, 20, true, true, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-e000-000000000011', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000003', 'Tinta Botol Sublimasi Epson 100ml CMYK', 'BP-TNT-SUB100', '8990003004', 'physical', 85000, 75000, 45000, 8, true, true, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-e000-000000000012', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000004', 'Charger GaN 65W Dual Type-C + USB Baseus', 'ACC-GAN-65W', '8990004001', 'physical', 195000, 175000, 115000, 3, true, true, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-e000-000000000013', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000004', 'Kabel Fast Charging Braided Type-C to C 100W', 'ACC-KBL-100W', '8990004002', 'physical', 45000, 35000, 18000, 8, true, true, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-e000-000000000014', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000004', 'Tempered Glass 9D Full Cover All Type', 'ACC-TG-9D', '8990004003', 'physical', 35000, 25000, 10000, 15, true, true, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-e000-000000000015', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000005', 'Jasa Pasang LCD & TrueTone Kalibrasi', 'SRV-JS-LCD', '8990005001', 'service', 150000, 120000, 0, 0, true, false, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-e000-000000000016', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000005', 'Jasa Cleaning Fan + Repaste Laptop Arctic MX-4', 'SRV-JS-CLEAN', '8990005002', 'service', 100000, 85000, 15000, 0, true, false, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-e000-000000000017', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000005', 'Jasa Install Ulang Windows 11 + Software & Driver', 'SRV-JS-OS', '8990005003', 'service', 100000, 85000, 0, 0, true, false, 'synced', 1, NOW(), NOW()),
  ('00000000-0000-4000-e000-000000000018', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', '00000000-0000-4000-b000-000000000005', 'Jasa Cetak Spanduk Outdoor Finishing Plong (m2)', 'SRV-JS-BANNER', '8990005004', 'service', 35000, 28000, 18000, 0, true, false, 'synced', 1, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 10. Service Orders
INSERT INTO service_orders (id, tenant_id, branch_id, customer_id, code, customer_name, description, date, cost, paid_total, status, items, timeline, sync_status, version, created_at, updated_at)
VALUES
  (
    '00000000-0000-4000-f000-000000000001',
    '5f6909cb-e54f-4041-a0d0-045ad54d2481',
    'b1000000-0000-4000-a000-000000000001',
    '00000000-0000-4000-c000-000000000003',
    'SRV-202611-001',
    'Rian Pratama',
    'iPhone 11 Pro - Layar blank hitam bergaris setelah jatuh, getar & notifikasi masih bunyi. Ganti LCD OLED OEM + TrueTone',
    NOW() - INTERVAL '3 days',
    650000,
    650000,
    'completed',
    '[{"productId": "00000000-0000-4000-e000-000000000001", "name": "LCD iPhone 11 Pro OLED Original OEM", "qty": 1, "price": 500000, "costPrice": 420000, "subtotal": 500000}, {"productId": "00000000-0000-4000-e000-000000000015", "name": "Jasa Pasang LCD & TrueTone", "qty": 1, "price": 150000, "costPrice": 0, "subtotal": 150000}]'::jsonb,
    '[{"id": "t1", "status": "Diterima", "date": "04/11/2026", "note": "Unit diterima di meja kasir oleh Doni"}, {"id": "t2", "status": "Dikerjakan", "date": "05/11/2026", "note": "LCD dipasang dan TrueTone dikalibrasi"}, {"id": "t3", "status": "Selesai", "date": "06/11/2026", "note": "Quality control pass, siap diambil garansi 30 hari"}]'::jsonb,
    'synced',
    1,
    NOW() - INTERVAL '3 days',
    NOW()
  ),
  (
    '00000000-0000-4000-f000-000000000002',
    '5f6909cb-e54f-4041-a0d0-045ad54d2481',
    'b1000000-0000-4000-a000-000000000001',
    '00000000-0000-4000-c000-000000000002',
    'SRV-202611-002',
    'Ibu Maya (CV Graha Media)',
    'MacBook Pro 13" 2020 - Kipas bunyi bising abnormal, thermal paste kering & suhu capai 94C saat render. Repaste Arctic MX-4',
    NOW() - INTERVAL '2 days',
    350000,
    150000,
    'in_progress',
    '[{"productId": "00000000-0000-4000-e000-000000000006", "name": "Thermal Paste Arctic MX-4", "qty": 1, "price": 85000, "costPrice": 50000, "subtotal": 85000}, {"productId": "00000000-0000-4000-e000-000000000016", "name": "Jasa Cleaning Heatsink + Repaste", "qty": 1, "price": 265000, "costPrice": 0, "subtotal": 265000}]'::jsonb,
    '[{"id": "t1", "status": "Diterima", "date": "05/11/2026", "note": "Unit masuk, DP Rp 150.000 via QRIS"}, {"id": "t2", "status": "Dikerjakan", "date": "06/11/2026", "note": "Pembersihan kipas selesai, proses running benchmark suhu"}]'::jsonb,
    'synced',
    1,
    NOW() - INTERVAL '2 days',
    NOW()
  ),
  (
    '00000000-0000-4000-f000-000000000003',
    '5f6909cb-e54f-4041-a0d0-045ad54d2481',
    'b1000000-0000-4000-a000-000000000001',
    '00000000-0000-4000-c000-000000000004',
    'SRV-202611-003',
    'Dimas Wahyudi',
    'ASUS TUF Gaming F15 - Minta upgrade SSD NVMe M.2 512GB & clone Windows 11 + instalasi game drive',
    NOW() - INTERVAL '2 days',
    650000,
    650000,
    'picked_up',
    '[{"productId": "00000000-0000-4000-e000-000000000004", "name": "SSD NVMe M.2 512GB Kingston NV2", "qty": 1, "price": 550000, "costPrice": 410000, "subtotal": 550000}, {"productId": "00000000-0000-4000-e000-000000000017", "name": "Jasa Pasang & Clone Windows 11", "qty": 1, "price": 100000, "costPrice": 0, "subtotal": 100000}]'::jsonb,
    '[{"id": "t1", "status": "Diterima", "date": "05/11/2026", "note": "Unit diterima"}, {"id": "t2", "status": "Selesai", "date": "06/11/2026", "note": "Speed read/write 3500MB/s normal"}, {"id": "t3", "status": "Diambil", "date": "07/11/2026", "note": "Unit diambil customer, lunas transfer BCA garansi 90 hari"}]'::jsonb,
    'synced',
    1,
    NOW() - INTERVAL '2 days',
    NOW()
  ),
  (
    '00000000-0000-4000-f000-000000000004',
    '5f6909cb-e54f-4041-a0d0-045ad54d2481',
    'b1000000-0000-4000-a000-000000000001',
    '00000000-0000-4000-c000-000000000005',
    'SRV-202611-004',
    'Bu Siti Aminah (Sekolah Harapan)',
    'Printer Epson L3210 - Indikator tinta dan kertas kedip serempak (General Error), waste ink pad penuh',
    NOW() - INTERVAL '1 day',
    175000,
    0,
    'in_progress',
    '[{"productId": "00000000-0000-4000-e000-000000000011", "name": "Bantalan Waste Ink Pad + Reset Chip", "qty": 1, "price": 75000, "costPrice": 35000, "subtotal": 75000}, {"productId": "00000000-0000-4000-e000-000000000016", "name": "Jasa Cleaning Head & Reset Counter", "qty": 1, "price": 100000, "costPrice": 0, "subtotal": 100000}]'::jsonb,
    '[{"id": "t1", "status": "Diterima", "date": "06/11/2026", "note": "Unit diantar oleh kurir sekolah"}, {"id": "t2", "status": "Dikerjakan", "date": "07/11/2026", "note": "Resetter software done, sedang pembersihan tabung pembuangan"}]'::jsonb,
    'synced',
    1,
    NOW() - INTERVAL '1 day',
    NOW()
  ),
  (
    '00000000-0000-4000-f000-000000000005',
    '5f6909cb-e54f-4041-a0d0-045ad54d2481',
    'b1000000-0000-4000-a000-000000000001',
    '00000000-0000-4000-c000-000000000001',
    'SRV-202611-005',
    'Budi Santoso (Toko Berkah)',
    'Cetak Spanduk Spesial HUT Toko Berkah 4x1.5m bahan Flexi Korea 340gr resolusi tinggi mata ayam keliling',
    NOW() - INTERVAL '1 day',
    210000,
    210000,
    'picked_up',
    '[{"productId": "00000000-0000-4000-e000-000000000010", "name": "Flexi Korea 340gr (6 m2)", "qty": 6, "price": 35000, "costPrice": 18000, "subtotal": 210000}]'::jsonb,
    '[{"id": "t1", "status": "Diterima", "date": "06/11/2026", "note": "File cetak siap cetak via WA"}, {"id": "t2", "status": "Selesai", "date": "06/11/2026", "note": "Cetak selesai & plong keliling"}, {"id": "t3", "status": "Diambil", "date": "07/11/2026", "note": "Diambil dan dibayar tunai lunas"}]'::jsonb,
    'synced',
    1,
    NOW() - INTERVAL '1 day',
    NOW()
  ),
  (
    '00000000-0000-4000-f000-000000000006',
    '5f6909cb-e54f-4041-a0d0-045ad54d2481',
    'b1000000-0000-4000-a000-000000000001',
    '00000000-0000-4000-c000-000000000006',
    'SRV-202611-006',
    'Kevin Sanjaya',
    'Samsung Galaxy A52 - Baterai cepat habis drop dari 80% ke 0%, backdoor renggang terdorong baterai kembung',
    NOW(),
    280000,
    0,
    'received',
    '[{"productId": "00000000-0000-4000-e000-000000000002", "name": "Baterai Samsung Galaxy A52", "qty": 1, "price": 185000, "costPrice": 95000, "subtotal": 185000}, {"productId": "00000000-0000-4000-e000-000000000015", "name": "Jasa Pasang & Lem Backdoor T-7000", "qty": 1, "price": 95000, "costPrice": 0, "subtotal": 95000}]'::jsonb,
    '[{"id": "t1", "status": "Diterima", "date": "07/11/2026", "note": "Unit diterima di counter servis, estimasi besok sore"}]'::jsonb,
    'synced',
    1,
    NOW(),
    NOW()
  ),
  (
    '00000000-0000-4000-f000-000000000007',
    '5f6909cb-e54f-4041-a0d0-045ad54d2481',
    'b1000000-0000-4000-a000-000000000001',
    '00000000-0000-4000-c000-000000000004',
    'SRV-202611-007',
    'Dimas Wahyudi',
    'Lenovo ThinkPad T480 - Mati total tidak ada indikator charging sama sekali, dugaan short kapasitor power rail 19V',
    NOW(),
    450000,
    0,
    'in_progress',
    '[{"productId": "00000000-0000-4000-e000-000000000015", "name": "Jasa Servis Motherboard & Ganti IC Mosfet", "qty": 1, "price": 450000, "costPrice": 50000, "subtotal": 450000}]'::jsonb,
    '[{"id": "t1", "status": "Diterima", "date": "07/11/2026", "note": "Unit masuk tanpa charger"}, {"id": "t2", "status": "Dikerjakan", "date": "07/11/2026", "note": "Ditemukan kapasitor PC401 short ke ground"}]'::jsonb,
    'synced',
    1,
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 11. Sales Orders
INSERT INTO sales_orders (id, tenant_id, branch_id, customer_id, order_number, status, subtotal, discount_total, tax_total, grand_total, paid_total, notes, date, sync_status, version, created_at, updated_at)
VALUES
  (
    '10000000-0000-4000-a000-000000000001',
    '5f6909cb-e54f-4041-a0d0-045ad54d2481',
    'b1000000-0000-4000-a000-000000000001',
    '00000000-0000-4000-c000-000000000006',
    'TRX-202611-001',
    'paid',
    240000,
    0,
    0,
    240000,
    240000,
    'Penjualan Aksesoris Charger GaN 65W & Kabel Fast Charging',
    NOW(),
    'synced',
    1,
    NOW(),
    NOW()
  ),
  (
    '10000000-0000-4000-a000-000000000002',
    '5f6909cb-e54f-4041-a0d0-045ad54d2481',
    'b1000000-0000-4000-a000-000000000001',
    '00000000-0000-4000-c000-000000000002',
    'TRX-202611-002',
    'paid',
    630000,
    0,
    0,
    630000,
    630000,
    'Cetak Spanduk Desain CV Graha 10m2 + Kertas Art Paper 2 Rim',
    NOW() - INTERVAL '1 day',
    'synced',
    1,
    NOW() - INTERVAL '1 day',
    NOW()
  ),
  (
    '10000000-0000-4000-a000-000000000003',
    '5f6909cb-e54f-4041-a0d0-045ad54d2481',
    'b1000000-0000-4000-a000-000000000001',
    '00000000-0000-4000-c000-000000000003',
    'TRX-202611-003',
    'paid',
    650000,
    0,
    0,
    650000,
    650000,
    'Pelunasan Servis SRV-202611-001 Ganti LCD iPhone 11 Pro',
    NOW() - INTERVAL '1 day',
    'synced',
    1,
    NOW() - INTERVAL '1 day',
    NOW()
  ),
  (
    '10000000-0000-4000-a000-000000000004',
    '5f6909cb-e54f-4041-a0d0-045ad54d2481',
    'b1000000-0000-4000-a000-000000000001',
    '00000000-0000-4000-c000-000000000004',
    'TRX-202611-004',
    'paid',
    870000,
    0,
    0,
    870000,
    870000,
    'Upgrade RAM 8GB + SSD NVMe 512GB ASUS TUF',
    NOW() - INTERVAL '2 days',
    'synced',
    1,
    NOW() - INTERVAL '2 days',
    NOW()
  ),
  (
    '10000000-0000-4000-a000-000000000005',
    '5f6909cb-e54f-4041-a0d0-045ad54d2481',
    'b1000000-0000-4000-a000-000000000001',
    '00000000-0000-4000-c000-000000000001',
    'TRX-202611-005',
    'paid',
    280000,
    0,
    0,
    280000,
    280000,
    'Spanduk HUT Toko 4x1.5m + Tempered Glass 2 pcs',
    NOW() - INTERVAL '2 days',
    'synced',
    1,
    NOW() - INTERVAL '2 days',
    NOW()
  ),
  (
    '10000000-0000-4000-a000-000000000006',
    '5f6909cb-e54f-4041-a0d0-045ad54d2481',
    'b1000000-0000-4000-a000-000000000001',
    '00000000-0000-4000-c000-000000000005',
    'TRX-202611-006',
    'receivable',
    310000,
    0,
    0,
    310000,
    0,
    'Pengadaan Kertas Art Paper & Tinta Sublimasi Sekolah Harapan (Piutang Tempo)',
    NOW() - INTERVAL '3 days',
    'synced',
    1,
    NOW() - INTERVAL '3 days',
    NOW()
  )
ON CONFLICT (id) DO NOTHING;

-- 12. Sales Order Items
INSERT INTO sales_order_items (id, tenant_id, sales_order_id, product_id, name, qty, unit_price, subtotal)
VALUES
  ('20000000-0000-4000-a000-000000000001', '5f6909cb-e54f-4041-a0d0-045ad54d2481', '10000000-0000-4000-a000-000000000001', '00000000-0000-4000-e000-000000000012', 'Charger GaN 65W Dual Type-C + USB Baseus', 1, 195000, 195000),
  ('20000000-0000-4000-a000-000000000002', '5f6909cb-e54f-4041-a0d0-045ad54d2481', '10000000-0000-4000-a000-000000000001', '00000000-0000-4000-e000-000000000013', 'Kabel Fast Charging Braided Type-C to C 100W', 1, 45000, 45000),
  ('20000000-0000-4000-a000-000000000003', '5f6909cb-e54f-4041-a0d0-045ad54d2481', '10000000-0000-4000-a000-000000000002', '00000000-0000-4000-e000-000000000010', 'Bahan Banner Flexi Korea 340gr (10 m2)', 10, 35000, 350000),
  ('20000000-0000-4000-a000-000000000004', '5f6909cb-e54f-4041-a0d0-045ad54d2481', '10000000-0000-4000-a000-000000000002', '00000000-0000-4000-e000-000000000008', 'Kertas Art Paper 260gr A3+ (2 Rim)', 2, 140000, 280000),
  ('20000000-0000-4000-a000-000000000005', '5f6909cb-e54f-4041-a0d0-045ad54d2481', '10000000-0000-4000-a000-000000000003', '00000000-0000-4000-e000-000000000001', 'LCD iPhone 11 Pro OLED Original OEM + Jasa', 1, 650000, 650000),
  ('20000000-0000-4000-a000-000000000006', '5f6909cb-e54f-4041-a0d0-045ad54d2481', '10000000-0000-4000-a000-000000000004', '00000000-0000-4000-e000-000000000004', 'SSD NVMe M.2 512GB Kingston NV2', 1, 550000, 550000),
  ('20000000-0000-4000-a000-000000000007', '5f6909cb-e54f-4041-a0d0-045ad54d2481', '10000000-0000-4000-a000-000000000004', '00000000-0000-4000-e000-000000000005', 'RAM DDR4 Sodimm 8GB 3200MHz Samsung', 1, 320000, 320000),
  ('20000000-0000-4000-a000-000000000008', '5f6909cb-e54f-4041-a0d0-045ad54d2481', '10000000-0000-4000-a000-000000000005', '00000000-0000-4000-e000-000000000010', 'Spanduk 4x1.5m Flexi Korea 340gr', 6, 35000, 210000),
  ('20000000-0000-4000-a000-000000000009', '5f6909cb-e54f-4041-a0d0-045ad54d2481', '10000000-0000-4000-a000-000000000005', '00000000-0000-4000-e000-000000000014', 'Tempered Glass 9D Full Cover', 2, 35000, 70000),
  ('20000000-0000-4000-a000-000000000010', '5f6909cb-e54f-4041-a0d0-045ad54d2481', '10000000-0000-4000-a000-000000000006', '00000000-0000-4000-e000-000000000008', 'Kertas Art Paper 260gr A3+ (1 Rim)', 1, 140000, 140000),
  ('20000000-0000-4000-a000-000000000011', '5f6909cb-e54f-4041-a0d0-045ad54d2481', '10000000-0000-4000-a000-000000000006', '00000000-0000-4000-e000-000000000011', 'Tinta Botol Sublimasi Epson 100ml CMYK (2 Botol)', 2, 85000, 170000)
ON CONFLICT (id) DO NOTHING;

-- 13. Payments
INSERT INTO payments (id, tenant_id, branch_id, sales_order_id, payment_number, method, amount, status, sync_status, created_at, updated_at)
VALUES
  ('30000000-0000-4000-a000-000000000001', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000001', 'PAY-202611-001', 'cash', 240000, 'success', 'synced', NOW(), NOW()),
  ('30000000-0000-4000-a000-000000000002', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000002', 'PAY-202611-002', 'qris', 630000, 'success', 'synced', NOW() - INTERVAL '1 day', NOW()),
  ('30000000-0000-4000-a000-000000000003', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000003', 'PAY-202611-003', 'transfer', 650000, 'success', 'synced', NOW() - INTERVAL '1 day', NOW()),
  ('30000000-0000-4000-a000-000000000004', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000004', 'PAY-202611-004', 'qris', 870000, 'success', 'synced', NOW() - INTERVAL '2 days', NOW()),
  ('30000000-0000-4000-a000-000000000005', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', '10000000-0000-4000-a000-000000000005', 'PAY-202611-005', 'cash', 280000, 'success', 'synced', NOW() - INTERVAL '2 days', NOW())
ON CONFLICT (id) DO NOTHING;

-- 14. Cash Entries (Buku Kas & Pengeluaran)
INSERT INTO cash (id, tenant_id, branch_id, ref, date, income, expense, status, sync_status, created_at, updated_at)
VALUES
  ('40000000-0000-4000-a000-000000000001', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', 'KAS-202611-001', NOW() - INTERVAL '4 days', 1500000, 0, 'posted', 'synced', NOW() - INTERVAL '4 days', NOW()),
  ('40000000-0000-4000-a000-000000000002', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', 'KAS-202611-002', NOW() - INTERVAL '3 days', 0, 1850000, 'posted', 'synced', NOW() - INTERVAL '3 days', NOW()),
  ('40000000-0000-4000-a000-000000000003', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', 'KAS-202611-003', NOW() - INTERVAL '2 days', 0, 450000, 'posted', 'synced', NOW() - INTERVAL '2 days', NOW()),
  ('40000000-0000-4000-a000-000000000004', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', 'KAS-202611-004', NOW() - INTERVAL '1 day', 2670000, 0, 'posted', 'synced', NOW() - INTERVAL '1 day', NOW()),
  ('40000000-0000-4000-a000-000000000005', '5f6909cb-e54f-4041-a0d0-045ad54d2481', 'b1000000-0000-4000-a000-000000000001', 'KAS-202611-005', NOW(), 1140000, 0, 'posted', 'synced', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

COMMIT;
`

writeFileSync('/tmp/seed.sql', SQL)

console.log('Seeding demo data into Postgres container...')
try {
  const containerId = execSync("docker ps -q -f name=vitpos-db").toString().trim()
  if (!containerId) {
    throw new Error('vitpos-db container not found')
  }
  execSync(`docker cp /tmp/seed.sql ${containerId}:/tmp/seed.sql`)
  const result = execSync(`docker exec -i ${containerId} psql -U vitpos -d vitpos -f /tmp/seed.sql`).toString()
  console.log(result)
  console.log('Postgres successfully seeded!')
} catch (err) {
  console.error('Failed to seed:', err)
} finally {
  try { unlinkSync('/tmp/seed.sql') } catch {}
}
