import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LayoutGrid, List, Filter, Image as ImageIcon, Package, Coffee, Shirt, MonitorSmartphone, Download, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { formatCurrency } from '@/lib/format-currency'
import { ProductCrudActions } from '@/features/products/components/product-crud-actions'
import { ProductImportDialog } from '@/features/products/components/product-import-dialog'
import { useProducts } from '@/features/products/hooks/use-products'
import { exportProducts } from '@/features/products/lib/export-products'
import { DataTable } from '@/shared/components/data-table/data-table'
import { ContentCard } from '@/shared/components/display/content-card'
import { StatusBadge } from '@/shared/components/display/status-badge'
import { PageShell } from '@/shared/components/layout/page-shell'
import { EmptyState } from '@/shared/components/feedback/empty-state'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useMediaQuery } from '@/hooks/use-media-query'

const iconMap: Record<string, React.ReactNode> = {
  Package: <Package className="size-6 text-muted-foreground" />,
  Coffee: <Coffee className="size-6 text-muted-foreground" />,
  Shirt: <Shirt className="size-6 text-muted-foreground" />,
  MonitorSmartphone: <MonitorSmartphone className="size-6 text-muted-foreground" />,
}

function ProductMedia({ imageUrl, iconName, className }: { imageUrl?: string; iconName?: string; className?: string }) {
  if (imageUrl) {
    return (
      <div className={`bg-muted overflow-hidden shrink-0 ${className}`}>
        <img src={imageUrl} alt="Product" className="w-full h-full object-cover" loading="lazy" />
      </div>
    )
  }
  return (
    <div className={`bg-muted/30 flex items-center justify-center shrink-0 border border-muted-foreground/10 ${className}`}>
      {iconName && iconMap[iconName] ? iconMap[iconName] : <ImageIcon className="size-6 text-muted-foreground" />}
    </div>
  )
}

function statusTone(status: string) {
  if (status === 'Aktif') return 'success'
  if (status === 'Draft') return 'warning'
  return 'neutral'
}

function displayStock(product: { type: string; stock: number; manageStock?: boolean }) {
  if (product.type === 'Jasa' || product.manageStock === false) return 'Unlimited'
  return `${product.stock} pcs`
}

export function ProductsPage() {
  const { t } = useTranslation()
  const productRows = useProducts()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [view, setView] = useState<'list' | 'card'>('list')
  const [search, setSearch] = useState('')
  const [filterOpen, setFilterOpen] = useState(false)
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [importOpen, setImportOpen] = useState(false)
  const activeView = isDesktop ? view : 'card'

  const filtered = productRows.filter(row => {
    if (search && ![row.name, row.category, row.type].some(f => f.toLowerCase().includes(search.toLowerCase()))) return false
    if (filterType !== 'all' && row.type !== filterType) return false
    if (filterStatus !== 'all' && row.status !== filterStatus) return false
    return true
  })

  const hasActiveFilter = filterType !== 'all' || filterStatus !== 'all'

  return (
    <PageShell title={t('products.title')} description={t('products.description')} actions={<ProductCrudActions />}>
      <ContentCard>
        <div className="mb-4 flex flex-col gap-2 border-b pb-4 sm:flex-row sm:items-center">
          <Input placeholder={t('common.search')} value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:w-64" />

          <div className="flex flex-wrap items-center gap-2 sm:ml-auto sm:flex-nowrap">
            <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
              <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setFilterOpen(true)}>
                <Filter className="h-4 w-4" />
                {hasActiveFilter && <span className="absolute -top-1 -right-1 size-2 rounded-full bg-primary" />}
              </Button>
              <DialogContent className="max-w-xs">
                <DialogHeader>
                  <DialogTitle>{t('common.filter')}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('common.type')}</label>
                    <Select value={filterType} onValueChange={setFilterType}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('shared.form_select_placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        <SelectItem value="Produk Fisik">{t('common.goods') || 'Barang'}</SelectItem>
                        <SelectItem value="Jasa">{t('common.service') || 'Jasa'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('common.status')}</label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue placeholder={t('shared.form_select_placeholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t('common.all')}</SelectItem>
                        <SelectItem value="Aktif">{t('common.active')}</SelectItem>
                        <SelectItem value="Draft">{t('products.status_draft')}</SelectItem>
                        <SelectItem value="Arsip">{t('common.archive') || 'Arsip'}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2 pt-2">
                    {hasActiveFilter && (
                      <Button variant="outline" className="flex-1" onClick={() => { setFilterType('all'); setFilterStatus('all') }}>
                        {t('common.reset')}
                      </Button>
                    )}
                    <Button className="flex-1" onClick={() => setFilterOpen(false)}>
                      {t('common.close')}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 shrink-0"
              onClick={() => {
                exportProducts(productRows)
                toast.success(t('products.export_success'))
              }}
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">{t('common.export')}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 shrink-0"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">{t('common.import')}</span>
            </Button>

            {isDesktop && (
              <div className="flex items-center gap-1 rounded-lg border bg-muted/50 p-1 shrink-0">
                <Button
                  variant={activeView === 'list' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setView('list')}
                  className="h-7 w-7"
                  title="List View"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  variant={activeView === 'card' ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setView('card')}
                  className="h-7 w-7"
                  title="Card View"
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        {activeView === 'list' ? (
          <DataTable
            columns={[
              { key: 'image', header: '', render: (row) => <ProductMedia imageUrl={row.imageUrl} iconName={row.icon} className="size-10 rounded-md" /> },
              { key: 'name', header: t('common.name') },
              { key: 'category', header: t('common.category') },
              { key: 'type', header: t('common.type') },
              { key: 'costPrice', header: t('common.cost_price') || 'HPP', render: (row) => formatCurrency(row.costPrice ?? 0) },
              { key: 'price', header: t('common.sell_price') || 'Harga Jual', render: (row) => {
                if (row.wholesaleTiers && row.wholesaleTiers.length > 0) {
                  const tierLabels = row.wholesaleTiers
                    .sort((a: { minQty: number }, b: { minQty: number }) => a.minQty - b.minQty)
                    .map((t: { minQty: number; price: number }) => `${t.minQty}+: ${formatCurrency(t.price)}`)
                    .join(', ')
                  return (
                    <div className="flex flex-col">
                      <span>{formatCurrency(row.price)}</span>
                      <span className="text-xs text-muted-foreground">{t('products.wholesale_label') || 'Grosir:'} {tierLabels}</span>
                    </div>
                  )
                }
                return row.wholesalePrice ? `${formatCurrency(row.price)} / Grosir ${formatCurrency(row.wholesalePrice)}` : formatCurrency(row.price)
              }},
              { key: 'stock', header: 'Stok', render: (row) => displayStock(row) },
              { key: 'status', header: t('common.status'), render: (row) => <StatusBadge label={row.status} tone={statusTone(row.status)} /> },
              { key: 'actions', header: t('common.actions'), render: (row) => <ProductCrudActions product={row} /> },
            ]}
            data={filtered}
          />
        ) : filtered.length === 0 ? (
          <EmptyState title={t('products.empty')} description={t('products.add_description')} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filtered.map((row) => (
              <div key={row.id} className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-background shadow-sm transition-all hover:shadow-md hover:border-primary/20">
                <ProductMedia imageUrl={row.imageUrl} iconName={row.icon} className="w-full h-32 border-b" />
                <div className="p-5 flex flex-col justify-between flex-1">
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <StatusBadge label={row.status} tone={statusTone(row.status)} />
                      <span className="text-xs font-medium px-2 py-1 bg-muted rounded-md text-muted-foreground">{row.type}</span>
                    </div>
                    <h3 className="font-semibold text-lg line-clamp-1">{row.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">{row.category}</p>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex flex-col bg-muted/30 p-2 rounded-lg">
                        <span className="text-muted-foreground text-xs mb-0.5">{t('products.cost_price')}</span>
                        <span className="font-medium">{formatCurrency(row.costPrice ?? 0)}</span>
                      </div>
                      <div className="flex flex-col bg-muted/30 p-2 rounded-lg">
                        <span className="text-muted-foreground text-xs mb-0.5">{t('products.selling_price')}</span>
                        <span className="font-medium">{formatCurrency(row.price)}</span>
                      </div>
                      <div className="flex flex-col bg-muted/30 p-2 rounded-lg col-span-2">
                        <span className="text-muted-foreground text-xs mb-0.5">{t('inventory.stock_per_warehouse') || 'Sisa Stok'}</span>
                        <span className="font-medium">{displayStock(row)}</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t flex justify-end">
                      <ProductCrudActions product={row} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </ContentCard>

      <ProductImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        existingProducts={productRows}
        onComplete={() => {}}
      />
    </PageShell>
  )
}
