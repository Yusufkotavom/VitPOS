import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Boxes,
  CloudOff,
  HelpCircle,
  MessageCircle,
  Printer,
  Rocket,
  Search,
  ShoppingCart,
  Wallet,
  Wrench,
  ChevronRight,
  Clock,
  Sparkles,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { HELP_ARTICLES, HELP_CATEGORIES, type HelpCategory } from '@/features/help/data/help-articles'
import { HelpArticleView } from '@/features/help/components/help-article-view'
import { useAuthStore } from '@/features/auth/stores/auth-store'

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Rocket,
  Wrench,
  Printer,
  ShoppingCart,
  Boxes,
  Wallet,
  Search,
  CloudOff,
}

export function HelpPage() {
  const { currentUser } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<HelpCategory | 'semua'>('semua')
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null)

  const activeArticle = useMemo(() => {
    if (!activeArticleId) return null
    return HELP_ARTICLES.find((a) => a.id === activeArticleId) || null
  }, [activeArticleId])

  const filteredArticles = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    return HELP_ARTICLES.filter((article) => {
      const matchCategory = selectedCategory === 'semua' || article.category === selectedCategory
      if (!matchCategory) return false

      if (!query) return true

      return (
        article.title.toLowerCase().includes(query) ||
        article.summary.toLowerCase().includes(query) ||
        article.tags.some((t) => t.toLowerCase().includes(query)) ||
        article.content.toLowerCase().includes(query)
      )
    })
  }, [searchQuery, selectedCategory])

  if (activeArticle) {
    return (
      <div className="container max-w-5xl py-8 px-4 sm:px-6">
        <HelpArticleView article={activeArticle} onBack={() => setActiveArticleId(null)} />
      </div>
    )
  }

  return (
    <div className="container max-w-6xl py-8 px-4 sm:px-6 space-y-10">
      {/* Top Banner & Search */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-b from-primary/10 via-primary/5 to-background border border-border/80 p-6 sm:p-10 text-center space-y-4">
        <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <HelpCircle className="size-3.5" />
          <span>Pusat Bantuan & Panduan Praktis</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
          Bagaimana kami dapat membantu bisnis Anda?
        </h1>
        <p className="max-w-2xl mx-auto text-sm sm:text-base text-muted-foreground leading-relaxed">
          Panduan langkah demi langkah untuk memaksimalkan fitur kasir kilat, tiket servis ber-QR,
          lacak pesanan mandiri, stok sparepart, dan pembukuan kas UMKM Anda.
        </p>

        <div className="max-w-xl mx-auto relative pt-2">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari topik panduan... (misal: servis hp, garansi, cetak nota, dp, kas)"
              className="pl-10 pr-4 h-11 text-sm bg-background/90 shadow-xs rounded-xl"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">Kategori Panduan</h2>
          {selectedCategory !== 'semua' && (
            <Button
              variant="link"
              size="sm"
              onClick={() => setSelectedCategory('semua')}
              className="text-xs text-primary p-0 h-auto"
            >
              Tampilkan Semua
            </Button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
          <button
            type="button"
            onClick={() => setSelectedCategory('semua')}
            className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
              selectedCategory === 'semua'
                ? 'border-primary bg-primary/5 text-primary shadow-xs'
                : 'border-border/60 bg-card hover:border-primary/40 hover:bg-muted/40 text-muted-foreground'
            }`}
          >
            <Sparkles className="size-5 mb-2 text-primary" />
            <span className="text-sm font-semibold text-foreground">Semua Topik</span>
            <span className="text-xs text-muted-foreground line-clamp-1">{HELP_ARTICLES.length} artikel panduan</span>
          </button>

          {HELP_CATEGORIES.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.iconName] || HelpCircle
            const count = HELP_ARTICLES.filter((a) => a.category === cat.id).length
            const isSelected = selectedCategory === cat.id

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex flex-col items-start p-3.5 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-primary bg-primary/5 text-primary shadow-xs'
                    : 'border-border/60 bg-card hover:border-primary/40 hover:bg-muted/40 text-muted-foreground'
                }`}
              >
                <Icon className={`size-5 mb-2 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                <span className="text-sm font-semibold text-foreground">{cat.label}</span>
                <span className="text-xs text-muted-foreground line-clamp-1">{count} panduan</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Articles Listing */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold tracking-tight text-foreground">
            {selectedCategory === 'semua'
              ? 'Daftar Artikel Panduan'
              : `Panduan: ${HELP_CATEGORIES.find((c) => c.id === selectedCategory)?.label}`}
          </h2>
          <span className="text-xs text-muted-foreground">
            Menampilkan {filteredArticles.length} artikel
          </span>
        </div>

        {filteredArticles.length === 0 ? (
          <div className="text-center py-12 border border-dashed rounded-2xl space-y-3">
            <HelpCircle className="size-10 mx-auto text-muted-foreground/60" />
            <p className="text-sm font-medium text-foreground">Tidak ada panduan yang sesuai kata kunci pencarian</p>
            <p className="text-xs text-muted-foreground">Coba gunakan kata kunci umum lain atau reset filter kategori.</p>
            <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setSelectedCategory('semua') }}>
              Reset Pencarian
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
            {filteredArticles.map((article) => (
              <Card
                key={article.id}
                className="group cursor-pointer hover:border-primary/50 hover:shadow-sm transition-all border-border/70 flex flex-col justify-between"
                onClick={() => setActiveArticleId(article.id)}
              >
                <CardHeader className="space-y-2 pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <Badge variant="outline" className="text-[11px] font-normal uppercase tracking-wider text-muted-foreground">
                      {article.category.replace('_', ' ')}
                    </Badge>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="size-3" />
                      <span>{article.readingTime}</span>
                    </div>
                  </div>
                  <CardTitle className="text-base font-semibold group-hover:text-primary transition-colors">
                    {article.title}
                  </CardTitle>
                  <CardDescription className="line-clamp-2 text-xs leading-relaxed">
                    {article.summary}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center justify-between border-t pt-3 mt-1 text-xs font-medium text-primary">
                    <span>Baca Panduan Selengkapnya</span>
                    <ChevronRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Support CTA Footer Card */}
      <div className="rounded-2xl border bg-muted/40 p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div className="space-y-1 text-center sm:text-left">
          <h3 className="text-base font-semibold text-foreground">Belum menemukan solusi yang Anda cari?</h3>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl">
            Tim dukungan KOTACOM siap membantu konsultasi alur operasional toko servis & percetakan Anda.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button asChild variant="outline" size="sm">
            <a
              href="https://wa.me/6281234567890?text=Halo%20Tim%20KOTACOM%2C%20saya%20butuh%20bantuan%20mengenai%20aplikasi"
              target="_blank"
              rel="noopener noreferrer"
              className="gap-2"
            >
              <MessageCircle className="size-4 text-emerald-600" />
              Tanya via WhatsApp
            </a>
          </Button>
          {!currentUser && (
            <Button asChild size="sm">
              <Link to="/register">Coba Gratis 14 Hari</Link>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
