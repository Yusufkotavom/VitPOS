import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const BANNERS = [
  {
    id: 1,
    title: 'Selamat Datang di KOTACOM!',
    description: 'Aplikasi kasir pintar untuk memajukan bisnis Anda.',
    bgClass: 'bg-gradient-to-r from-blue-500 to-indigo-600',
  },
  {
    id: 2,
    title: 'Pantau Stok Anda',
    description: 'Gunakan fitur Inventori untuk menghindari kehabisan barang.',
    bgClass: 'bg-gradient-to-r from-orange-400 to-rose-500',
  },
  {
    id: 3,
    title: 'Ringkasan Laporan',
    description: 'Cek laporan harian Anda dengan cepat di menu Laporan.',
    bgClass: 'bg-gradient-to-r from-emerald-500 to-teal-600',
  },
]

export function DashboardCarousel() {
  const [current, setCurrent] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % BANNERS.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  function prevSlide() {
    setCurrent((prev) => (prev === 0 ? BANNERS.length - 1 : prev - 1))
  }

  function nextSlide() {
    setCurrent((prev) => (prev + 1) % BANNERS.length)
  }

  return (
    <div className="group relative w-full overflow-hidden rounded-2xl shadow-sm">
      <div 
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {BANNERS.map((banner) => (
          <div key={banner.id} className="min-w-full">
            <div className={`flex h-36 flex-col justify-center px-6 md:h-48 md:px-10 ${banner.bgClass} text-white`}>
              <h2 className="mb-2 text-xl font-bold md:text-3xl">{banner.title}</h2>
              <p className="max-w-md text-sm text-white/90 md:text-base">{banner.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Buttons */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/20 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/40 group-hover:opacity-100"
        onClick={prevSlide}
      >
        <ChevronLeft className="size-5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/20 text-white opacity-0 backdrop-blur-sm transition-opacity hover:bg-black/40 group-hover:opacity-100"
        onClick={nextSlide}
      >
        <ChevronRight className="size-5" />
      </Button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {BANNERS.map((_, idx) => (
          <Button
            key={idx}
            className={`h-1.5 rounded-full transition-all ${current === idx ? 'w-4 bg-white' : 'w-1.5 bg-white/50 hover:bg-white/80'}`}
            onClick={() => setCurrent(idx)}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
