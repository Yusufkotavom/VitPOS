import { AlertCircle, ArrowLeft, LayoutDashboard, ShoppingCart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

export function NotFoundPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1)
      return
    }

    navigate('/')
  }

  return (
    <div className="flex min-h-[calc(100vh-12rem)] items-center justify-center">
      <Card className="w-full max-w-2xl border-dashed">
        <CardContent className="flex flex-col items-center gap-6 py-12 text-center">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertCircle className="size-8" />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              {t('errors.not_found_code')}
            </p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t('errors.not_found_title')}
            </h1>
            <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
              {t('errors.not_found_description')}
            </p>
          </div>

          <div className="flex w-full flex-col justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="sm:min-w-44">
              <Link to="/">
                <LayoutDashboard className="size-4" />
                {t('errors.not_found_go_dashboard')}
              </Link>
            </Button>
            <Button type="button" variant="outline" size="lg" className="sm:min-w-36" onClick={handleBack}>
              <ArrowLeft className="size-4" />
              {t('common.back')}
            </Button>
            <Button asChild type="button" variant="secondary" size="lg" className="sm:min-w-36">
              <Link to="/pos">
                <ShoppingCart className="size-4" />
                {t('errors.not_found_open_pos')}
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
