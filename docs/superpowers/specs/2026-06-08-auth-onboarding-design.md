# Auth, Onboarding & User Settings Redesign

## 1. Flow Login & Registrasi
- **Auth Guard**: Perbaiki `AuthGuard` agar dashboard benar-benar tertutup tanpa login.
- **Login**: Email & Password. Jika sukses, masuk `TenantSelector`.
- **Register**: Email, Name, Password. Setelah sukses, langsung masuk ke flow Onboarding.

## 2. Onboarding Flow (Wizard Multi-step)
Setelah register sukses:
1. **Company Info**: Input Nama Bisnis & pilih Icon/Logo.
2. **Business Template**: Pilih jenis usaha (F&B, Retail, Jasa, dll).
3. **Product Setup**: Tampil data produk bawaan template. User bisa CRUD (Tambah/Edit/Hapus) via dialog.
4. **Payment Methods**: Setup metode pembayaran awal (Tunai, Transfer, QRIS).
5. **Billing/Subscription**: Tampilkan opsi paket langganan. Skip-able (masuk ke Free/Trial tier).
6. **Selesai**: Redirect ke Dashboard.

## 3. Multi-Tenant
- **Konsep**: 1 User bisa buat & masuk ke banyak bisnis (Tenant).
- **Pemilihan**: Saat login, tampil `TenantSelector`. Jika baru punya 1, auto-select (opsional, tapi selector lebih aman untuk testing).
- **Data Isolation**: Semua query & mutate harus difilter berdasarkan `activeTenant.id` di context.

## 4. User Settings & Billing Page
Membuat halaman baru di Settings atau top-level:
- **Profil User**: Edit Nama, Email, Password, dll (menggunakan `shadcn`).
- **Billing & Subscription**: Tampil paket aktif, upgrade, riwayat billing (mock data sementara).

## Arsitektur & Komponen Baru
- `features/auth/pages/register-page.tsx`: Halaman registrasi baru.
- `features/auth/pages/onboarding-wizard.tsx`: Komponen utama wizard, memanggil step-step sub-komponen.
- `features/settings/pages/user-profile-page.tsx`: Halaman edit user.
- Update `router.tsx` untuk routing baru.
- Update `AuthGuard` untuk proteksi ketat.
