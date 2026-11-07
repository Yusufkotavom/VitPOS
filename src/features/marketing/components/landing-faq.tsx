import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

const FAQS = [
  {
    question: 'Apakah aplikasi tetap bisa dipakai saat koneksi internet di toko mati?',
    answer: 'Ya, 100% bisa! KOTACOM dirancang dengan arsitektur Offline-First (menggunakan penyimpanan lokal Dexie di perangkat Anda). Kasir tetap bisa melayani pembeli, mencetak struk thermal, dan menginput tiket servis tanpa ada koneksi internet. Begitu koneksi internet kembali tersambung, data otomatis tersinkronisasi ke cloud tanpa resiko hilang.',
  },
  {
    question: 'Bagaimana cara pelanggan saya melacak status barang servis atau spanduk mereka?',
    answer: 'Setiap tanda terima nota memuat QR Code unik dan tautan pelacakan publik. Pelanggan cukup memindai QR Code tersebut menggunakan kamera HP mereka atau membuka web dan memasukkan nomor HP mereka. Mereka dapat melihat status pengerjaan secara langsung tanpa perlu membuat akun atau mengunduh aplikasi tambahan apa pun.',
  },
  {
    question: 'Printer apa saja yang didukung oleh KOTACOM?',
    answer: 'KOTACOM mendukung semua merk printer thermal ukuran 58mm (printer Bluetooth portabel mini) maupun 80mm (printer thermal kasir USB/LAN seperti Epson, Xprinter, Panda, dll). Anda juga bisa mencetak nota faktur / invoice resmi format A4 dan menyimpannya sebagai file PDF.',
  },
  {
    question: 'Bisakah aplikasi ini digunakan untuk toko yang melayani servis HP sekaligus jualan aksesoris?',
    answer: 'Sangat bisa! Itu adalah salah satu keunggulan terbesar kami. Anda bisa menggunakan Kasir POS cepat untuk transaksi aksesoris dan fotokopi (selesai 3 detik), sekaligus membuat tiket servis terpisah untuk pelanggan yang menitipkan gadget atau laptop dengan sistem uang muka (DP).',
  },
  {
    question: 'Apakah saya perlu membeli komputer atau perangkat khusus yang mahal?',
    answer: 'Tidak perlu sama sekali. KOTACOM berbasis web modern yang responsif. Anda bisa menggunakannya di laptop bekas, komputer kasir Windows, iPad/tablet Android, atau bahkan langsung dari smartphone kasir Anda.',
  },
]

export function LandingFaq() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <section className="py-20">
      <div className="container mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase tracking-wider text-xs">
            Tanya Jawab (FAQ)
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Pertanyaan yang Sering Diajukan
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Jawaban lengkap seputar penggunaan harian di toko servis, bengkel, dan percetakan Anda.
          </p>
        </div>

        <div className="w-full space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx
            return (
              <div
                key={idx}
                className="border border-border/80 rounded-xl overflow-hidden bg-card shadow-2xs transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left text-sm sm:text-base font-semibold text-foreground hover:text-primary transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    className={`size-4 text-muted-foreground shrink-0 transition-transform duration-200 ml-3 ${
                      isOpen ? 'rotate-180 text-primary' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-5 sm:px-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t pt-3">
                    {faq.answer}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
