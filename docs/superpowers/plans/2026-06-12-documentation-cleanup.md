# Documentation Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean stale documentation, add documentation indexes, and ensure internal markdown links point to existing docs.

**Architecture:** Documentation gets one root hub at `docs/README.md`, one architecture hub at `docs/architecture/README.md`, and one superpowers hub at `docs/superpowers/README.md`. Stale top-level planning files are deleted, while active specs/plans receive cross-links.

**Tech Stack:** Markdown, Git, shell verification scripts

---

## File Map

### Delete

- `README.backup.md`
- `task_plan.md`
- `progress.md`
- `findings.md`
- `docs/2026-06-11-accounting-pos-integration-plan.md`
- `PROJECT_PLAN.md`

### Create

- `docs/README.md`
- `docs/architecture/README.md`
- `docs/superpowers/README.md`
- `docs/superpowers/plans/2026-06-12-documentation-cleanup.md`

### Modify

- `README.md`
- `docs/superpowers/specs/2026-06-12-documentation-cleanup-design.md`
- active `docs/superpowers/specs/*.md`
- active `docs/superpowers/plans/*.md`

## Task 1: Remove stale docs

**Files:** delete listed stale files.

- [ ] **Step 1: Delete stale docs**

Remove:

```txt
README.backup.md
task_plan.md
progress.md
findings.md
docs/2026-06-11-accounting-pos-integration-plan.md
PROJECT_PLAN.md
```

- [ ] **Step 2: Verify deleted files are gone**

Run: `test ! -e README.backup.md && test ! -e task_plan.md && test ! -e progress.md && test ! -e findings.md && test ! -e docs/2026-06-11-accounting-pos-integration-plan.md && test ! -e PROJECT_PLAN.md`
Expected: exit 0.

## Task 2: Add docs index pages

**Files:**
- Create: `docs/README.md`
- Create: `docs/architecture/README.md`
- Create: `docs/superpowers/README.md`

- [ ] **Step 1: Create `docs/README.md`**

Content:

```md
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
```

- [ ] **Step 2: Create `docs/architecture/README.md`**

Content:

```md
# Architecture Documentation

Peta dokumen arsitektur KOTACOM Business Suite.

## Core Architecture

- [Database](database.md) — struktur data lokal, offline-first, dan arah adapter.
- [Contracts](contracts.md) — kontrak shared antar modul dan service.
- [Sync Payloads](sync-payloads.md) — bentuk payload sinkronisasi.

## Platform Shells

- [Android Shell](android-shell.md) — shell Android/WebView dan pertimbangan mobile.
- [Desktop Integrations](desktop-integrations.md) — integrasi desktop dan adapter masa depan.

## Related Docs

- [Sync Engine](../SYNC_ENGINE.md)
- [Superpowers Plans & Specs](../superpowers/README.md)
```

- [ ] **Step 3: Create `docs/superpowers/README.md`**

Content:

```md
# Superpowers Plans and Specs

Dokumen di folder ini berisi design specs dan implementation plans aktif. Spec menjelaskan keputusan desain. Plan menjelaskan langkah implementasi.

## Active Feature Pairs

| Feature | Spec | Plan |
| --- | --- | --- |
| Android refresh UX | [Spec](specs/2026-06-12-android-refresh-ux-design.md) | [Plan](plans/2026-06-12-android-refresh-ux.md) |
| Documentation cleanup | [Spec](specs/2026-06-12-documentation-cleanup-design.md) | [Plan](plans/2026-06-12-documentation-cleanup.md) |
| Laporan + onboarding UMKM | [Spec](specs/2026-06-12-laporan-onboarding-umkm-design.md) | [Plan](plans/2026-06-12-laporan-onboarding-umkm.md) |
| SaaS billing super admin | [Spec](specs/2026-06-12-saas-billing-super-admin-design.md) | [Plan](plans/2026-06-12-saas-billing-super-admin.md) |
| 404 page + language switcher | [Spec](specs/2026-06-12-404-page-and-header-language-switcher-design.md) | [Plan](plans/2026-06-12-404-page-and-header-language-switcher.md) |

## Maintenance Rules

- Tambah baris baru setiap membuat pasangan spec/plan aktif.
- Hapus baris bila pasangan doc dihapus.
- Jangan link ke file yang tidak ada.
- Jika fitur sudah selesai tapi masih relevan sebagai keputusan desain, biarkan tetap di tabel.
```

## Task 3: Update root README and cross-links

**Files:**
- Modify: `README.md`
- Modify: `docs/superpowers/specs/2026-06-12-documentation-cleanup-design.md`
- Modify: active spec/plan pairs under `docs/superpowers/`

- [ ] **Step 1: Add docs hub section to README**

Add near existing documentation section or after project overview:

```md
## Documentation

- [Documentation Index](docs/README.md)
- [Architecture Docs](docs/architecture/README.md)
- [Sync Engine](docs/SYNC_ENGINE.md)
- [Superpowers Plans and Specs](docs/superpowers/README.md)
```

- [ ] **Step 2: Add plan link to documentation cleanup spec**

Add after title in `docs/superpowers/specs/2026-06-12-documentation-cleanup-design.md`:

```md
Related plan: [Documentation Cleanup Implementation Plan](../plans/2026-06-12-documentation-cleanup.md)
```

- [ ] **Step 3: Add reciprocal links to active pairs**

For each active pair, add after title:

```md
Related spec: [Feature Design](../specs/<matching-spec>.md)
```

or:

```md
Related plan: [Implementation Plan](../plans/<matching-plan>.md)
```

Pairs:

```txt
specs/2026-06-12-android-refresh-ux-design.md <-> plans/2026-06-12-android-refresh-ux.md
specs/2026-06-12-documentation-cleanup-design.md <-> plans/2026-06-12-documentation-cleanup.md
specs/2026-06-12-laporan-onboarding-umkm-design.md <-> plans/2026-06-12-laporan-onboarding-umkm.md
specs/2026-06-12-saas-billing-super-admin-design.md <-> plans/2026-06-12-saas-billing-super-admin.md
specs/2026-06-12-404-page-and-header-language-switcher-design.md <-> plans/2026-06-12-404-page-and-header-language-switcher.md
```

## Task 4: Verify markdown links

**Files:** no source changes expected unless broken links found.

- [ ] **Step 1: Run internal markdown link verification script**

Run:

```bash
python3 - <<'PY'
from pathlib import Path
import re

roots = [Path('README.md'), Path('PHASES.md'), Path('docs')]
files = []
for root in roots:
    if root.is_file():
        files.append(root)
    elif root.is_dir():
        files.extend(root.rglob('*.md'))

missing = []
for file in files:
    text = file.read_text(encoding='utf-8')
    for match in re.finditer(r'\[[^\]]+\]\(([^)]+)\)', text):
        target = match.group(1).split('#', 1)[0].strip()
        if not target or re.match(r'^[a-zA-Z][a-zA-Z0-9+.-]*:', target):
            continue
        path = (file.parent / target).resolve()
        if not path.exists():
            missing.append(f'{file}:{match.start(1)} -> {target}')

if missing:
    print('\n'.join(missing))
    raise SystemExit(1)
print(f'OK: checked {len(files)} markdown files')
PY
```

Expected: `OK: checked ... markdown files`.

- [ ] **Step 2: Run git status and review diff**

Run: `git status --short && git diff --stat`
Expected: only docs cleanup files changed/deleted plus pre-existing unrelated working tree files remain unstaged.

## Self-Review

### Spec coverage

- Delete stale docs: Task 1.
- Add doc hubs: Task 2.
- Cross-link active docs: Task 3.
- Verify links: Task 4.

### Placeholder scan

No placeholders kept.

### Type consistency

No code types affected. Markdown link pairs use exact filenames from current docs inventory.
