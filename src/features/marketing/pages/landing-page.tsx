import { LandingNavbar } from '@/features/marketing/components/landing-navbar'
import { LandingHero } from '@/features/marketing/components/landing-hero'
import { LandingServiceNiche } from '@/features/marketing/components/landing-service-niche'
import { LandingFeatures } from '@/features/marketing/components/landing-features'
import { LandingPricing } from '@/features/marketing/components/landing-pricing'
import { LandingFaq } from '@/features/marketing/components/landing-faq'
import { LandingFooter } from '@/features/marketing/components/landing-footer'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <LandingNavbar />
      <main className="flex-1">
        <LandingHero />
        <LandingServiceNiche />
        <LandingFeatures />
        <LandingPricing />
        <LandingFaq />
      </main>
      <LandingFooter />
    </div>
  )
}
