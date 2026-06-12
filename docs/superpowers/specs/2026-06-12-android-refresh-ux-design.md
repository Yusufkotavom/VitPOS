# Desain: Android Refresh UX untuk Error dan Pull-to-Refresh

Tanggal: 2026-06-12

## Ringkasan

Tambahkan refresh UX yang terasa natural di Android tanpa bergantung pada plugin native. Pola yang dipakai adalah gabungan ringan: popup retry untuk error berat, pull-to-refresh untuk halaman mobile saat scroll di posisi atas, dan tombol retry nyata pada offline/sync banner.

## Tujuan

- Memberi jalan keluar cepat saat data gagal dimuat.
- Membuat perilaku refresh terasa natural di Android.
- Menyatukan retry manual, refresh halaman, dan retry sync dalam satu mekanisme global.
- Tetap aman untuk web, PWA, dan WebView.

## Non-Goals

- Implementasi native Android plugin.
- Retry granular untuk setiap query satu per satu.
- Rework total semua halaman error.

## Pendekatan

### 1. RefreshProvider global
Tambahkan provider global yang expose fungsi `refreshAll()`.

Tanggung jawab:
- invalidasi/refetch query aktif
- trigger sync ringan bila ada mekanisme sync global
- expose status `isRefreshing`
- expose `lastError` untuk memicu dialog bila perlu

### 2. Pull-to-refresh mobile
Tambahkan wrapper `PullToRefresh` di sekitar area konten aplikasi mobile.

Perilaku:
- hanya aktif di mobile / layar kecil
- hanya bisa dipicu saat scroll berada di paling atas
- tarik ke bawah → tampil indikator
- lepas → panggil `refreshAll()`

### 3. Error dialog untuk gagal muat berat
Tambahkan `AppErrorDialog` untuk kasus error aplikasi atau fetch utama yang gagal.

Aksi:
- `Coba Lagi` → `refreshAll()`
- `Muat Ulang Aplikasi` → `window.location.reload()`

### 4. Retry nyata di offline banner
`OfflineBanner` sekarang punya CTA yang belum jadi refresh nyata. Ubah supaya:
- saat offline → tombol `Coba lagi`
- saat sync gagal → tombol `Sinkron ulang`
- aksi → `refreshAll()`

## Titik Integrasi

- `src/app/providers.tsx`
  - tempat provider global refresh
- `src/shared/components/layout/app-layout.tsx`
  - tempat wrapper pull-to-refresh + dialog global
- `src/shared/components/sync/offline-banner.tsx`
  - tempat CTA retry nyata
- `src/shared/components/sync/sync-indicator.tsx`
  - opsional trigger retry cepat
- `src/features/updates/hooks/use-app-update.ts`
  - bisa dipakai sebagai pola refresh existing

## Komponen Baru

- `src/shared/components/feedback/app-error-dialog.tsx`
- `src/shared/components/feedback/pull-to-refresh.tsx`
- `src/shared/providers/refresh-provider.tsx`

## UX Copy

### Dialog error
- Judul: `Ada kendala memuat data`
- Deskripsi: `Periksa koneksi, lalu coba muat ulang.`
- Tombol 1: `Coba Lagi`
- Tombol 2: `Muat Ulang Aplikasi`

### Pull-to-refresh
- tarik: `Tarik untuk refresh`
- tahan: `Lepas untuk refresh`
- proses: `Memuat ulang...`

### Offline banner
- offline: `Coba lagi`
- sync gagal: `Sinkron ulang`

## Risiko dan Mitigasi

### Gesture bentrok dengan scroll
Mitigasi: aktif hanya saat scroll di paling atas dan hanya untuk drag vertikal turun.

### Refresh terlalu agresif
Mitigasi: debounce sederhana dan guard `isRefreshing`.

### Dialog terlalu sering muncul
Mitigasi: pakai hanya untuk error berat/global, bukan semua toast error kecil.

## Testing

- unit test `RefreshProvider`
- interaction test `PullToRefresh`
- test `OfflineBanner` retry callback
- test dialog aksi `Coba Lagi` dan `Muat Ulang Aplikasi`
- lint, typecheck, targeted tests, build
