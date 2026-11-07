import { ArrowLeft, Clock, Tag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HelpArticle } from '@/features/help/data/help-articles'

interface HelpArticleViewProps {
  article: HelpArticle
  onBack: () => void
}

export function HelpArticleView({ article, onBack }: HelpArticleViewProps) {
  // Simple markdown renderer for headers, bold, bullet points, and code
  const renderFormattedContent = (text: string) => {
    const lines = text.trim().split('\n')
    return lines.map((line, idx) => {
      const trimmed = line.trim()
      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={idx} className="mt-6 mb-3 text-xl font-bold tracking-tight text-foreground">
            {trimmed.replace('### ', '')}
          </h3>
        )
      }
      if (trimmed.startsWith('#### ')) {
        return (
          <h4 key={idx} className="mt-4 mb-2 text-base font-semibold text-primary">
            {trimmed.replace('#### ', '')}
          </h4>
        )
      }
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        return (
          <li key={idx} className="ml-5 list-disc text-sm leading-relaxed text-muted-foreground my-1">
            {trimmed.substring(2)}
          </li>
        )
      }
      if (trimmed.match(/^\d+\.\s/)) {
        return (
          <li key={idx} className="ml-5 list-decimal text-sm leading-relaxed text-muted-foreground my-1">
            {trimmed.replace(/^\d+\.\s/, '')}
          </li>
        )
      }
      if (!trimmed) {
        return <div key={idx} className="h-2" />
      }
      return (
        <p key={idx} className="text-sm leading-relaxed text-muted-foreground my-1.5">
          {trimmed}
        </p>
      )
    })
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2 mb-4 -ml-2 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Kembali ke Daftar Panduan
        </Button>
      </div>

      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-3 pb-4 border-b">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
              {article.category.replace('_', ' ').toUpperCase()}
            </Badge>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="size-3.5" />
              <span>Estimasi baca: {article.readingTime}</span>
            </div>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {article.title}
          </CardTitle>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {article.summary}
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {renderFormattedContent(article.content)}
          </div>

          <div className="mt-8 pt-6 border-t flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Tag className="size-3.5" /> Topik terkait:
            </span>
            {article.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs font-normal">
                #{tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
