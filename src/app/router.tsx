import { lazy, Suspense, type ComponentType } from 'react'
import { createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/shared/components/layout/app-layout'
import { LoadingState } from '@/shared/components/feedback/loading-state'

const DashboardPage = lazy(() => import('@/features/dashboard/pages/dashboard-page').then(pick('DashboardPage')))
const PosPage = lazy(() => import('@/features/pos/pages/pos-page').then(pick('PosPage')))
const ProductsPage = lazy(() => import('@/features/products/pages/products-page').then(pick('ProductsPage')))
const CustomersPage = lazy(() => import('@/features/customers/pages/customers-page').then(pick('CustomersPage')))
const SalesOrdersPage = lazy(() => import('@/features/sales-orders/pages/sales-orders-page').then(pick('SalesOrdersPage')))
const PaymentsPage = lazy(() => import('@/features/payments/pages/payments-page').then(pick('PaymentsPage')))
const InventoryPage = lazy(() => import('@/features/inventory/pages/inventory-page').then(pick('InventoryPage')))
const CashPage = lazy(() => import('@/features/cash/pages/cash-page').then(pick('CashPage')))
const ReportsPage = lazy(() => import('@/features/reports/pages/reports-page').then(pick('ReportsPage')))
const SettingsPage = lazy(() => import('@/features/settings/pages/settings-page').then(pick('SettingsPage')))
const SyncPage = lazy(() => import('@/features/sync/pages/sync-page').then(pick('SyncPage')))
const ShiftPage = lazy(() => import('@/features/shift/pages/shift-page').then(pick('ShiftPage')))
const ServiceOrdersPage = lazy(() => import('@/features/service-orders/pages/service-orders-page').then(pick('ServiceOrdersPage')))
const PurchasesPage = lazy(() => import('@/features/purchases/pages/purchases-page').then(pick('PurchasesPage')))
const SuppliersPage = lazy(() => import('@/features/suppliers/pages/suppliers-page').then(pick('SuppliersPage')))
const ReturnsPage = lazy(() => import('@/features/returns/pages/returns-page').then(pick('ReturnsPage')))
const PlatformAdminPage = lazy(() => import('@/features/platform-admin/pages/platform-admin-page').then(pick('PlatformAdminPage')))
const LoginPage = lazy(() => import('@/features/auth/pages/login-page').then(pick('LoginPage')))
const TenantSelectorPage = lazy(() => import('@/features/auth/pages/tenant-selector-page').then(pick('TenantSelectorPage')))
const OnboardingPage = lazy(() => import('@/features/auth/pages/onboarding-page').then(pick('OnboardingPage')))

function pick<T extends string>(name: T) {
  return <M extends Record<T, ComponentType>>(module: M) => ({ default: module[name] })
}

function routeElement(Page: ComponentType) {
  return (
    <Suspense fallback={<LoadingState label="Memuat halaman..." />}>
      <Page />
    </Suspense>
  )
}

export const router = createBrowserRouter([
  { path: '/login', element: routeElement(LoginPage) },
  { path: '/tenants', element: routeElement(TenantSelectorPage) },
  { path: '/onboarding', element: routeElement(OnboardingPage) },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: routeElement(DashboardPage) },
      { path: 'pos', element: routeElement(PosPage) },
      { path: 'products', element: routeElement(ProductsPage) },
      { path: 'customers', element: routeElement(CustomersPage) },
      { path: 'sales-orders', element: routeElement(SalesOrdersPage) },
      { path: 'payments', element: routeElement(PaymentsPage) },
      { path: 'inventory', element: routeElement(InventoryPage) },
      { path: 'cash', element: routeElement(CashPage) },
      { path: 'reports', element: routeElement(ReportsPage) },
      { path: 'service-orders', element: routeElement(ServiceOrdersPage) },
      { path: 'purchases', element: routeElement(PurchasesPage) },
      { path: 'suppliers', element: routeElement(SuppliersPage) },
      { path: 'returns', element: routeElement(ReturnsPage) },
      { path: 'settings', element: routeElement(SettingsPage) },
      { path: 'sync', element: routeElement(SyncPage) },
      { path: 'shift', element: routeElement(ShiftPage) },
      { path: 'platform-admin', element: routeElement(PlatformAdminPage) },
    ],
  },
])
