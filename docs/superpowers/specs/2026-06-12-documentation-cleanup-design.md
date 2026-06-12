# Desain: Documentation Cleanup dan Cross-Linking

Tanggal: 2026-06-12

Related plan: [Documentation Cleanup Implementation Plan](../plans/2026-06-12-documentation-cleanup.md)

## Ringkasan

Cleanup dokumentasi fokus pada penghapusan file stale/noise, perbaikan link rusak, penambahan index docs berlapis, dan penguatan relasi antara root README, docs arsitektur, serta docs superpowers plans/specs. Pendekatan ini memakai deletion langsung untuk file yang jelas tidak relevan lagi.

## Tujuan

- Hapus dokumen stale/backup/noise.
- Jadikan `docs/` punya entrypoint yang jelas.
- Tambah index untuk `docs/architecture/` dan `docs/superpowers/`.
- Perbaiki link rusak dan referensi dokumen hilang.
- Hubungkan spec ↔ plan ↔ docs induk.

## Non-Goals

- Menulis ulang seluruh isi semua doc teknis.
- Mengarsipkan file stale ke folder archive.
- Menyatukan semua dokumen ke satu file besar.

## Penghapusan Langsung

Hapus file berikut karena stale atau noise jelas:
- `README.backup.md`
- `task_plan.md`
- `progress.md`
- `findings.md`
- `docs/2026-06-11-accounting-pos-integration-plan.md`
- `PROJECT_PLAN.md` bila hanya refer ke plan hilang dan tidak lagi jadi source of truth

## Dokumen yang Dipertahankan

- `README.md`
- `PHASES.md`
- `docs/SYNC_ENGINE.md`
- `docs/agent-changelog.md`
- `docs/architecture/*.md`
- semua `docs/superpowers/specs/*.md`
- semua `docs/superpowers/plans/*.md`

## Struktur Baru

Tambahkan:
- `docs/README.md`
- `docs/architecture/README.md`
- `docs/superpowers/README.md`

## Aturan Linking

### Root README
Harus link ke:
- `docs/README.md`
- `docs/SYNC_ENGINE.md`
- `docs/architecture/README.md`
- `docs/superpowers/README.md`

### docs/README.md
Harus jadi hub untuk:
- arsitektur
- sync engine
- changelog agent
- sample import / utility docs
- superpowers plans/specs
- roadmap makro bila `PHASES.md` dipertahankan

### docs/architecture/README.md
Kelompokkan:
- Android shell
- Database
- Desktop integrations
- Contracts
- Sync payloads

### docs/superpowers/README.md
Kelompokkan:
- active specs
- active plans
- pasangan spec ↔ plan per feature/date

## Perbaikan Konsistensi

- Hapus referensi ke plan/spec yang sudah tidak ada.
- Tambah link dua arah untuk pasangan spec dan plan aktif.
- Pastikan nama link menjelaskan konteks, bukan hanya tanggal.
- Bila `PHASES.md` masih aktif, link dari `docs/README.md` atau `README.md`.

## Verifikasi

- Cek semua file target masih ada.
- Cek tidak ada link internal ke file yang dihapus.
- Cek root README tidak lagi menunjuk doc usang.
- Build/test codebase tidak perlu berubah, tapi markdown paths harus valid.
