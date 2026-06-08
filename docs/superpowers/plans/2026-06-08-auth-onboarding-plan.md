# Auth, Onboarding & User Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign auth flow to include proper login, register, 5-step onboarding wizard, tenant selection, strict dashboard protection, and user settings profile.

**Architecture:** 
- Strict `AuthGuard` blocking all unauthenticated access. 
- React Router setup for `/register`, `/login`, `/onboarding`, `/tenants`, and `/settings/profile`.
- Multi-step onboarding using local state before final commit to stores/DB.
- `useAuthStore` updates to handle strict tenant state.

**Tech Stack:** React, TypeScript, React Router, Zustand, React Hook Form, Zod, shadcn/ui.

---

### Task 1: AuthGuard & Router Strictness

**Files:**
- Modify: `src/app/router.tsx`
- Modify: `src/features/auth/components/auth-guard.tsx`
- Modify: `src/features/auth/stores/auth-store.ts`

- [ ] **Step 1: Fix AuthStore state types**
Update `src/features/auth/stores/auth-store.ts` to ensure strict typings for `currentUser` and `activeTenant`.

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { LocalTenant, LocalUser } from '@/services/local-db/schema'

export type AuthTenant = LocalTenant & { role: string }

type AuthState = {
  currentUser: LocalUser | null
  activeTenant: AuthTenant | null
  setAuth: (user: LocalUser) => void
  setActiveTenant: (tenant: LocalTenant, role: string) => void
  isAuthenticated: () => boolean
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      activeTenant: null,
      setAuth: (user) => set({ currentUser: user }),
      setActiveTenant: (tenant, role) => set({ activeTenant: { ...tenant, role } }),
      isAuthenticated: () => get().currentUser !== null,
      logout: () => set({ currentUser: null, activeTenant: null }),
    }),
    { name: 'kotacom-auth-store' },
  ),
)
```

- [ ] **Step 2: Update AuthGuard logic**
Modify `src/features/auth/components/auth-guard.tsx`. Ensure unauthenticated users go to `/login`, and authenticated users without a tenant go to `/tenants` (unless they are on an allowed setup route).

```tsx
import { type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/features/auth/stores/auth-store'

export function AuthGuard({ children }: { children: ReactNode }) {
  const { currentUser, activeTenant } = useAuthStore()
  const location = useLocation()

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const isSetupRoute = location.pathname === '/tenants' || location.pathname === '/onboarding'

  if (!activeTenant && !isSetupRoute) {
    return <Navigate to="/tenants" replace />
  }

  return children
}
```

- [ ] **Step 3: Update Router**
Modify `src/app/router.tsx`. Add `RegisterPage` route. Move `/settings/profile` out of standard settings or add to settings children.

```tsx
// Add lazy import
const RegisterPage = lazy(() => import('@/features/auth/pages/register-page').then(pick('RegisterPage')))
const UserProfilePage = lazy(() => import('@/features/settings/pages/user-profile-page').then(pick('UserProfilePage')))

// Add to routes array
export const router = createBrowserRouter([
  { path: '/login', element: routeElement(LoginPage) },
  { path: '/register', element: routeElement(RegisterPage) },
  { path: '/tenants', element: routeElement(TenantSelectorPage) }, // Protected later inside component or by separate guard
  { path: '/onboarding', element: routeElement(OnboardingPage) },
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      // ... existing routes
      { path: 'settings/profile', element: routeElement(UserProfilePage) }
    ]
  }
])
```

- [ ] **Step 4: Commit**
```bash
git add src/app/router.tsx src/features/auth/components/auth-guard.tsx src/features/auth/stores/auth-store.ts
git commit -m "fix: strict auth guard and routing setup"
```

---

### Task 2: Register & Login Pages

**Files:**
- Create: `src/features/auth/pages/register-page.tsx`
- Modify: `src/features/auth/pages/login-page.tsx`

- [ ] **Step 1: Create Register Page**
Create `src/features/auth/pages/register-page.tsx` with name, email, pw. On submit, mock user creation, `setAuth()`, then redirect to `/onboarding`.

```tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/features/auth/stores/auth-store'

export function RegisterPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [loading, setLoading] = useState(false)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    // Mock register
    setTimeout(() => {
      setAuth({
        id: crypto.randomUUID(),
        name: formData.get('name') as string,
        email: formData.get('email') as string,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      navigate('/onboarding')
    }, 500)
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-muted/30">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Buat Akun</h1>
          <p className="text-sm text-muted-foreground">Mulai kelola bisnis Anda sekarang</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input id="name" name="name" required disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required disabled={loading} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required disabled={loading} />
          </div>
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? 'Mendaftar...' : 'Daftar'}
          </Button>
        </form>
        <p className="px-8 text-center text-sm text-muted-foreground">
          Sudah punya akun? <Link to="/login" className="underline underline-offset-4 hover:text-primary">Login</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update Login Page**
Modify `src/features/auth/pages/login-page.tsx`. Redirect to `/tenants` on success. Add link to `/register`.

```tsx
import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/features/auth/stores/auth-store'

export function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [loading, setLoading] = useState(false)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    setTimeout(() => {
      setAuth({
        id: crypto.randomUUID(),
        name: 'Test User',
        email: formData.get('email') as string,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      navigate('/tenants')
    }, 500)
  }

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-muted/30">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Selamat Datang</h1>
          <p className="text-sm text-muted-foreground">Masuk ke akun Anda</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required disabled={loading} defaultValue="admin@vitpos.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required disabled={loading} defaultValue="password" />
          </div>
          <Button className="w-full" type="submit" disabled={loading}>
            {loading ? 'Masuk...' : 'Login'}
          </Button>
        </form>
        <p className="px-8 text-center text-sm text-muted-foreground">
          Belum punya akun? <Link to="/register" className="underline underline-offset-4 hover:text-primary">Daftar disini</Link>
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Commit**
```bash
git add src/features/auth/pages/register-page.tsx src/features/auth/pages/login-page.tsx
git commit -m "feat: add register page and update login flow"
```

---

### Task 3: Onboarding Wizard (Part 1 - Framework & Company Info)

**Files:**
- Modify: `src/features/auth/pages/onboarding-page.tsx`

- [ ] **Step 1: Build Onboarding Shell**
Implement multi-step state in `onboarding-page.tsx`.

```tsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/features/auth/stores/auth-store'

export function OnboardingPage() {
  const navigate = useNavigate()
  const { currentUser, setActiveTenant } = useAuthStore()
  const [step, setStep] = useState(1)
  const [tenantName, setTenantName] = useState('')
  const [template, setTemplate] = useState('retail')

  if (!currentUser) {
    navigate('/login')
    return null
  }

  const finishOnboarding = () => {
    // Mock save to DB
    const newTenant = {
      id: crypto.randomUUID(),
      name: tenantName || 'Toko Baru',
      type: 'retail',
      planCode: 'free',
      status: 'active' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    setActiveTenant(newTenant, 'owner')
    navigate('/')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-2xl bg-background rounded-lg border shadow-sm p-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Setup Bisnis Anda</h1>
            <span className="text-sm text-muted-foreground">Langkah {step} dari 4</span>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-secondary">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(step / 4) * 100}%` }} />
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Informasi Perusahaan</h2>
            <div className="space-y-2">
              <Label>Nama Bisnis</Label>
              <Input value={tenantName} onChange={(e) => setTenantName(e.target.value)} placeholder="Contoh: Toko Kopi Senja" />
            </div>
            <Button onClick={() => setStep(2)} disabled={!tenantName}>Lanjut</Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Pilih Template Bisnis</h2>
            <div className="grid grid-cols-2 gap-4">
              {['retail', 'fnb', 'jasa'].map((t) => (
                <div 
                  key={t} 
                  className={`border rounded p-4 cursor-pointer ${template === t ? 'border-primary bg-primary/5' : ''}`}
                  onClick={() => setTemplate(t)}
                >
                  <div className="font-medium capitalize">{t}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)}>Kembali</Button>
              <Button onClick={() => setStep(3)}>Lanjut</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Produk Bawaan</h2>
            <p className="text-muted-foreground">Berdasarkan template {template}, kami menyiapkan produk awal.</p>
            <div className="border rounded p-4 text-sm text-muted-foreground">
              (Daftar produk mockup disini, bisa diedit nanti di pengaturan produk)
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(2)}>Kembali</Button>
              <Button onClick={() => setStep(4)}>Lanjut</Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Pilih Paket Langganan</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="border border-primary rounded p-4">
                <div className="font-bold">Free Trial</div>
                <div className="text-sm text-muted-foreground mt-2">Coba gratis 14 hari</div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button variant="outline" onClick={() => setStep(3)}>Kembali</Button>
              <Button onClick={finishOnboarding}>Mulai Gunakan Dashboard</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**
```bash
git add src/features/auth/pages/onboarding-page.tsx
git commit -m "feat: multi-step onboarding wizard"
```

---

### Task 4: User Profile Settings Page

**Files:**
- Create: `src/features/settings/pages/user-profile-page.tsx`

- [ ] **Step 1: Build User Profile Page**
Create page allowing edit of email/name.

```tsx
import { useState } from 'react'
import { PageHeader } from '@/shared/components/layout/page-header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAuthStore } from '@/features/auth/stores/auth-store'

export function UserProfilePage() {
  const { currentUser, setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    
    if (currentUser) {
      setTimeout(() => {
        setAuth({
          ...currentUser,
          name: formData.get('name') as string,
          email: formData.get('email') as string,
        })
        setLoading(false)
        alert('Profil diperbarui')
      }, 500)
    }
  }

  if (!currentUser) return null

  return (
    <div className="space-y-6 p-6">
      <PageHeader title="Profil Pengguna" description="Atur informasi akun Anda." />
      
      <div className="max-w-2xl border rounded-lg p-6 bg-card">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input id="name" name="name" defaultValue={currentUser.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue={currentUser.email} required />
          </div>
          
          <div className="pt-4 border-t mt-6">
            <h3 className="font-medium mb-4">Ganti Password</h3>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Password Baru</Label>
                <Input id="password" name="password" type="password" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </div>
        </form>
      </div>

      <div className="max-w-2xl border rounded-lg p-6 bg-card">
        <h3 className="font-medium mb-2">Paket Langganan</h3>
        <p className="text-sm text-muted-foreground mb-4">Anda saat ini berada di paket Free Trial.</p>
        <Button variant="outline">Upgrade Paket</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**
```bash
git add src/features/settings/pages/user-profile-page.tsx
git commit -m "feat: user profile settings page"
```
