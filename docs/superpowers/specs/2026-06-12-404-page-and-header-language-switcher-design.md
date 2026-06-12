# 404 Page and Header Language Switcher Design

Related plan: [404 Page and Header Language Switcher Implementation Plan](../plans/2026-06-12-404-page-and-header-language-switcher.md)

## Tujuan

Menambahkan halaman 404 yang jelas, konsisten dengan layout dashboard, dan memberi jalur pemulihan cepat lewat tombol aksi utama. Sekaligus menambahkan language switcher di header aplikasi agar pengguna bisa mengganti bahasa tanpa masuk ke halaman pengaturan.

## Lingkup

Perubahan mencakup:

- fallback route untuk path yang tidak ditemukan
- tampilan halaman 404 di dalam app shell untuk area aplikasi yang sudah login
- tombol aksi 404 yang jelas: ke dashboard, kembali, dan buka POS
- dropdown language switcher di header kanan
- persistensi pilihan bahasa antarreload
- penambahan string i18n untuk Indonesia dan English

Perubahan ini tidak mencakup:

- pembuatan halaman bantuan `/help`
- penerjemahan seluruh aplikasi yang belum lengkap
- pengaturan bahasa per-tenant atau per-user di backend

## Kondisi Saat Ini

- Router utama ada di `src/app/router.tsx` dan belum memiliki route fallback `*`.
- Layout aplikasi utama ada di `src/shared/components/layout/app-layout.tsx`.
- Header saat ini menampilkan `SyncIndicator`, `ThemeToggle`, dan `UserMenu`.
- Konfigurasi i18n berada di `src/lib/i18n/index.ts` dengan resource `id` dan `en`, tetapi inisialisasi masih hardcoded ke `lng: 'id'` tanpa persistensi pilihan bahasa.

## Pendekatan yang Dipilih

Menggunakan 404 page yang tetap berada di dalam `AppLayout` untuk route internal. Ini menjaga konteks pengguna, mempertahankan sidebar/topbar, dan membuat tombol aksi seperti “Ke Dashboard” terasa natural. Language switcher ditambahkan sebagai dropdown kecil di header kanan, sejajar dengan kontrol global lain.

## Desain Halaman 404

### Struktur UI

Halaman 404 ditampilkan sebagai content page di area `<Outlet />`, bukan full-page terpisah. Kontennya memakai layout terpusat berbasis card dengan hirarki seperti berikut:

- badge/label kecil: `404`
- heading utama: `Halaman tidak ditemukan`
- deskripsi singkat yang menjelaskan kemungkinan penyebab
- kelompok tombol aksi yang jelas

### Aksi

- **Primary:** `Ke Dashboard` → navigasi ke `/`
- **Secondary:** `Kembali` → menggunakan history back, dengan fallback ke dashboard bila tidak ada history layak
- **Tertiary:** `Buka POS` → navigasi ke `/pos`

### Karakter visual

- konsisten dengan dashboard: card, spacing lega, ikon sederhana, tidak dekoratif berlebihan
- mobile-first: tombol stack vertikal pada layar kecil, horizontal pada layar lebih besar
- copy menggunakan bahasa bisnis Indonesia yang ringkas

## Desain Routing

### Route internal

Tambahkan route anak `path: '*'` di bawah node root yang memakai `AppLayout`. Dengan ini, semua path internal yang tidak cocok tetap masuk ke shell aplikasi dan menampilkan 404 page.

### Route eksternal

Untuk scope ini, route publik seperti `/login` dan `/register` tidak mendapat halaman 404 terpisah. Jika user membuka path acak saat belum login, perilaku tetap mengikuti struktur router saat ini. Fokus implementasi adalah experience “seperti dashboard” sesuai permintaan.

Jika nanti dibutuhkan, route-level 404 publik dapat ditambahkan sebagai pekerjaan terpisah.

## Desain Language Switcher

### Lokasi

Language switcher ditempatkan di header kanan `AppLayout`, di antara `SyncIndicator` dan `ThemeToggle` atau berdekatan dengan kontrol global lain yang sudah ada. Ia harus terlihat langsung tanpa masuk ke `UserMenu`.

### Bentuk komponen

Komponen berupa dropdown trigger kecil dengan label singkat bahasa aktif:

- `ID` untuk Bahasa Indonesia
- `EN` untuk English

Saat dibuka, dropdown menampilkan dua opsi penuh:

- `Bahasa Indonesia`
- `English`

Bahasa aktif diberi indikator visual yang jelas.

### Perilaku

- klik opsi memanggil `i18n.changeLanguage('id' | 'en')`
- pilihan bahasa disimpan ke local storage
- saat app dimuat ulang, bahasa mengikuti nilai tersimpan
- jika local storage kosong atau invalid, fallback ke `id`

## Perubahan Data dan i18n

### Inisialisasi bahasa

`src/lib/i18n/index.ts` diperbarui agar:

- membaca bahasa awal dari local storage
- memvalidasi hanya `id` atau `en`
- tetap fallback ke `id`

### Resource baru

Tambahkan key baru untuk:

- 404 page title, description, dan labels tombol
- label language switcher di header
- nama bahasa dalam dropdown

Semua key baru harus ada di resource `id` dan `en` agar perpindahan bahasa tidak meninggalkan string kosong.

## Struktur File

Perubahan diperkirakan menyentuh file berikut:

- **Modify:** `src/app/router.tsx`
- **Create:** `src/shared/components/feedback/not-found-page.tsx`
- **Create or Modify:** `src/shared/components/nav/language-switcher.tsx`
- **Modify:** `src/shared/components/layout/app-layout.tsx`
- **Modify:** `src/lib/i18n/index.ts`

Komponen 404 ditempatkan di `shared/components/feedback` karena bersifat reusable sebagai state page. Language switcher ditempatkan di `shared/components/nav` karena merupakan kontrol navigasi global.

## Error Handling dan Edge Cases

- Tombol `Kembali` harus aman saat user masuk langsung ke URL invalid. Jika history browser tidak cukup, arahkan ke dashboard.
- Jika language code yang tersimpan tidak valid, abaikan dan pakai `id`.
- Dropdown switcher harus tetap usable di mobile header yang sempit.

## Testing dan Verifikasi

Minimal verifikasi:

- route tidak dikenal di area internal menampilkan 404 page
- tombol `Ke Dashboard` mengarahkan ke `/`
- tombol `Buka POS` mengarahkan ke `/pos`
- tombol `Kembali` tidak error saat history kosong
- mengganti bahasa mengubah label UI terkait
- reload mempertahankan bahasa aktif
- lint, typecheck, tests, dan build berjalan sukses bila script tersedia

## Keputusan yang Sengaja Ditunda

- halaman bantuan nyata untuk route `/help`
- global 404 untuk route publik di luar shell
- sinkronisasi preferensi bahasa ke backend/user profile
