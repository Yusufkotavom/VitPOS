# KOTACOM Business Suite Documentation

Dokumentasi ini jadi peta utama untuk arsitektur, sinkronisasi, rencana fitur, dan catatan kerja agent.

## Entry Points

- [Root README](../README.md) — overview project, stack, dan workflow utama.
- [Roadmap Phases](../PHASES.md) — roadmap makro dan urutan fase produk.
- [Sync Engine](SYNC_ENGINE.md) — desain sync engine offline-first.
- [Agent Changelog](agent-changelog.md) — catatan perubahan oleh agent.
- [Sample Product Import: Percetakan & ATK](sample-product-import-percetakan-atk.md) — contoh data import produk.

## Architecture

- [Architecture Index](architecture/README.md)
- [Android Shell](architecture/android-shell.md)
- [Database](architecture/database.md)
- [Desktop Integrations](architecture/desktop-integrations.md)
- [Contracts](architecture/contracts.md)
- [Sync Payloads](architecture/sync-payloads.md)

## Plans and Specs

- [Superpowers Plans & Specs](superpowers/README.md)

## Maintenance Rules

- Hapus doc stale bila sudah tidak jadi sumber keputusan.
- Setiap spec aktif harus link ke plan pasangannya.
- Setiap plan aktif harus link balik ke spec.
- Root README hanya link ke hub utama, bukan semua file detail.
