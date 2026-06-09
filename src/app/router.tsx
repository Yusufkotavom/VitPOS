import { lazy, Suspense, type ComponentType } from 'react'
import { createBrowserRouter } from 'react-router-dom'

import { AppLayout } from '@/shared/components/layout/app-layout'
import { AuthGuard } from '@/features/auth/components/auth-guard'
import { PlatformAdminGuard } from '@/features/auth/components/platform-admin-guard'
import { LoadingState } from '@/shared/components/feedback/loading-state'

const DashboardPage = lazy(() => import('@/features/dashboard/pages/dashboard-page').then(pick('DashboardPage')))
const PosPage = lazy(() => import('@/features/pos/pages/pos-page').then(pick('PosPage')))
const ProductsPage = lazy(() => import('@/features/products/pages/products-page').then(pick('ProductsPage')))
const CategoriesPage = lazy(() => import('@/features/products/pages/categories-page').then(pick('CategoriesPage')))
const RecipesPage = lazy(() => import('@/features/recipes/pages/recipes-page').then(pick('RecipesPage')))
const CustomersPage = lazy(() => import('@/features/customers/pages/customers-page').then(pick('CustomersPage')))
const CustomerDetailPage = lazy(() => import('@/features/customers/pages/customer-detail-page').then(pick('CustomerDetailPage')))
const SalesOrdersPage = lazy(() => import('@/features/sales-orders/pages/sales-orders-page').then(pick('SalesOrdersPage')))
const SalesOrderDetailPage = lazy(() => import('@/features/sales-orders/pages/sales-order-detail-page').then(pick('SalesOrderDetailPage')))
const PaymentsPage = lazy(() => import('@/features/payments/pages/payments-page').then(pick('PaymentsPage')))
const InventoryPage = lazy(() => import('@/features/inventory/pages/inventory-page').then(pick('InventoryPage')))
const InventoryAdjustmentPage = lazy(() => import('@/features/inventory/pages/inventory-adjustment-page').then(pick('InventoryAdjustmentPage')))
const CashPage = lazy(() => import('@/features/cash/pages/cash-page').then(pick('CashPage')))
const CashCategoriesPage = lazy(() => import('@/features/cash/pages/cash-categories-page').then(pick('CashCategoriesPage')))
const ReportsPage = lazy(() => import('@/features/reports/pages/reports-page').then(pick('ReportsPage')))
const ProfitLossPage = lazy(() => import('@/features/reports/pages/profit-loss-page').then(pick('ProfitLossPage')))
const BalanceSheetPage = lazy(() => import('@/features/reports/pages/balance-sheet-page').then(pick('BalanceSheetPage')))
const SalesReportPage = lazy(() => import('@/features/reports/pages/sales-report-page').then(pick('SalesReportPage')))
const PaymentReportPage = lazy(() => import('@/features/reports/pages/payment-report-page').then(pick('PaymentReportPage')))
const InventoryReportPage = lazy(() => import('@/features/reports/pages/inventory-report-page').then(pick('InventoryReportPage')))
const SettingsPage = lazy(() => import('@/features/settings/pages/settings-page').then(pick('SettingsPage')))
const UserProfilePage = lazy(() => import('@/features/settings/pages/user-profile-page').then(pick('UserProfilePage')))
const SubscriptionPage = lazy(() => import('@/features/settings/pages/subscription-page').then(pick('SubscriptionPage')))
const PaymentMethodsPage = lazy(() => import('@/features/settings/pages/payment-methods-page').then(pick('PaymentMethodsPage')))
const MessageTemplatesPage = lazy(() => import('@/features/settings/pages/message-templates-page').then(pick('MessageTemplatesPage')))
const SyncPage = lazy(() => import('@/features/sync/pages/sync-page').then(pick('SyncPage')))
const ShiftPage = lazy(() => import('@/features/shift/pages/shift-page').then(pick('ShiftPage')))
const ServiceOrdersPage = lazy(() => import('@/features/service-orders/pages/service-orders-page').then(pick('ServiceOrdersPage')))
const ServiceOrderDetailPage = lazy(() => import('@/features/service-orders/pages/service-order-detail-page').then(pick('ServiceOrderDetailPage')))
const ServiceOrderCreatePage = lazy(() => import('@/features/service-orders/pages/service-order-create-page').then(pick('ServiceOrderCreatePage')))
const PurchasesPage = lazy(() => import('@/features/purchases/pages/purchases-page').then(pick('PurchasesPage')))
const SuppliersPage = lazy(() => import('@/features/suppliers/pages/suppliers-page').then(pick('SuppliersPage')))
const ReturnsPage = lazy(() => import('@/features/returns/pages/returns-page').then(pick('ReturnsPage')))
const PlatformAdminPage = lazy(() => import('@/features/platform-admin/pages/platform-admin-page').then(pick('PlatformAdminPage')))
const LoginPage = lazy(() => import('@/features/auth/pages/login-page').then(pick('LoginPage')))
const BillingPage = lazy(() => import('@/features/auth/pages/billing-page').then(pick('BillingPage')))
const RegisterPage = lazy(() => import('@/features/auth/pages/register-page').then(pick('RegisterPage')))
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
  { path: '/register', element: routeElement(RegisterPage) },
  { path: '/tenants', element: <AuthGuard>{routeElement(TenantSelectorPage)}</AuthGuard> },
  { path: '/onboarding', element: <AuthGuard>{routeElement(OnboardingPage)}</AuthGuard> },
  { path: '/billing', element: <AuthGuard>{routeElement(BillingPage)}</AuthGuard> },
  {
    path: '/',
    element: (
      <AuthGuard>
        <AppLayout />
      </AuthGuard>
    ),
    children: [
      { index: true, element: routeElement(DashboardPage) },
      { path: 'pos', element: routeElement(PosPage) },
      { path: 'products', element: routeElement(ProductsPage) },
      { path: 'products/categories', element: routeElement(CategoriesPage) },
      { path: 'products/recipes', element: routeElement(RecipesPage) },
      { path: 'customers', element: routeElement(CustomersPage) },
      { path: 'customers/:id', element: routeElement(CustomerDetailPage) },
      { path: 'sales-orders', element: routeElement(SalesOrdersPage) },
      { path: 'sales-orders/:id', element: routeElement(SalesOrderDetailPage) },
      { path: 'payments', element: routeElement(PaymentsPage) },
      { path: 'inventory', element: routeElement(InventoryPage) },
      { path: 'inventory/adjust', element: routeElement(InventoryAdjustmentPage) },
      { path: 'cash', element: routeElement(CashPage) },
      { path: 'cash/categories', element: routeElement(CashCategoriesPage) },
      { path: 'cash/payment-methods', element: routeElement(PaymentMethodsPage) },
      { path: 'reports', element: routeElement(ReportsPage) },
      { path: 'reports/profit-loss', element: routeElement(ProfitLossPage) },
      { path: 'reports/balance-sheet', element: routeElement(BalanceSheetPage) },
      { path: 'reports/sales', element: routeElement(SalesReportPage) },
      { path: 'reports/payments', element: routeElement(PaymentReportPage) },
      { path: 'reports/inventory', element: routeElement(InventoryReportPage) },
      { path: 'service-orders', element: routeElement(ServiceOrdersPage) },
      { path: 'service-orders/create', element: routeElement(ServiceOrderCreatePage) },
      { path: 'service-orders/:id', element: routeElement(ServiceOrderDetailPage) },
      { path: 'purchases', element: routeElement(PurchasesPage) },
      { path: 'suppliers', element: routeElement(SuppliersPage) },
      { path: 'returns', element: routeElement(ReturnsPage) },
      { path: 'settings', element: routeElement(SettingsPage) },
      { path: 'settings/profile', element: routeElement(UserProfilePage) },
      { path: 'settings/billing', element: routeElement(SubscriptionPage) },
      { path: 'settings/templates', element: routeElement(MessageTemplatesPage) },
      { path: 'sync', element: routeElement(SyncPage) },
      { path: 'shift', element: routeElement(ShiftPage) },
    ],
  },
  {
    path: '/platform-admin',
    element: (
      <PlatformAdminGuard>
        <Suspense fallback={<LoadingState label="Memuat halaman..." />}>
          <PlatformAdminPage />
        </Suspense>
      </PlatformAdminGuard>
    ),
  },
])
