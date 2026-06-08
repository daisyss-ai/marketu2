'use client'

import Image from 'next/image'
import Link from 'next/link'
import { GraduationCap, MessageCircle, Package, Star } from 'lucide-react'
import Header from '@/components/layout/Header'
import { ReputationBadge } from './ReputationBadge'
import { SellerReputation } from './SellerReputation'
import { BuyerReputation } from './BuyerReputation'
import { SellerStats } from './SellerStats'
import { computeSeal } from '@/lib/profile/types'
import type {
  PublicProfile,
  SellerReputationData,
  BuyerReputationData,
  SellerStats as SellerStatsType,
  Product,
} from '@/lib/profile/types'

interface Props {
  profile: PublicProfile
  isOwn: boolean
  sellerReputation: SellerReputationData
  buyerReputation: BuyerReputationData
  sellerStats: SellerStatsType
  products: Product[]
}

function Avatar({ url, name }: { url: string | null; name: string }) {
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <div className="relative w-fit">
      <div className="w-28 h-28 rounded-full border-4 border-white shadow-lg overflow-hidden bg-[#EDE7FF] flex items-center justify-center">
        {url ? (
          <Image src={url} alt={name} width={112} height={112} className="w-full h-full object-cover" />
        ) : (
          <span className="text-4xl font-bold text-[#4B187C]">{initials}</span>
        )}
      </div>
    </div>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white p-4 rounded-2xl border border-[#EDE7FF] shadow-sm">
      <span className="text-gray-500 text-xs font-medium uppercase tracking-wider block mb-2">
        {label}
      </span>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      {sub && <div className="text-xs text-gray-400 mt-0.5">{sub}</div>}
    </div>
  )
}

function formatResponseTime(minutes: number | null): string {
  if (minutes === null) return '—'
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

function ProductCard({ product }: { product: Product }) {
  const img = product.images?.[0]
  return (
    <Link
      href={`/product/${product.id}`}
      className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:border-[#EDE7FF] hover:shadow-md transition-all duration-200"
    >
      <div className="relative h-44 bg-gray-100 overflow-hidden">
        {img ? (
          <Image
            src={img}
            alt={product.title}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-gray-300" />
          </div>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-gray-800 text-sm line-clamp-1">{product.title}</p>
        <p className="text-[#4B187C] font-bold text-sm mt-1">
          {product.price.toLocaleString('pt-AO')} Kz
        </p>
      </div>
    </Link>
  )
}

function EmptyProducts() {
  return (
    <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-[#EDE7FF]">
      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-500 text-sm">Nenhum produto à venda de momento.</p>
    </div>
  )
}

export function PublicProfile({
  profile,
  isOwn,
  sellerReputation,
  buyerReputation,
  sellerStats,
  products,
}: Props) {
  const seal = computeSeal(
    sellerReputation.total_reviews,
    sellerReputation.avg_rating,
    profile.is_verified
  )

  const memberSince = new Date(profile.created_at).toLocaleDateString('pt-PT', {
    month: 'long',
    year: 'numeric',
  })

  const studentInfo = [profile.course, profile.class].filter(Boolean).join(' • ')

  return (
    <div className="bg-[#f8f7ff] min-h-screen">
      <Header />

      {/* Banner */}
      <div className="h-36 w-full bg-gradient-to-r from-[#4B187C] to-[#6d28b0]" />

      {/* Profile header */}
      <div className="max-w-5xl mx-auto px-4 -mt-16 relative z-10">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
          <div className="flex flex-col gap-3">
            <Avatar url={profile.avatar_url} name={profile.full_name} />
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{profile.full_name}</h1>
                <ReputationBadge seal={seal} size="sm" />
              </div>
              {studentInfo && (
                <div className="flex items-center gap-1 text-gray-500 text-sm mt-1">
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>{studentInfo}</span>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">Membro desde {memberSince}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pb-1">
            {isOwn ? (
              <Link
                href="/edit-profile"
                className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#4B187C] text-[#4B187C] text-sm font-medium hover:bg-[#EDE7FF] transition-colors"
              >
                Editar perfil
              </Link>
            ) : (
              <Link
                href={`/chat?user=${profile.id}`}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#4B187C] text-white text-sm font-medium hover:bg-[#3E1367] transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Enviar mensagem
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">

        {/* Stats */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Estatísticas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Produtos à venda" value={sellerStats.active_products} />
            <StatCard label="Vendas concluídas" value={sellerStats.completed_sales} />
            <StatCard
              label="Taxa positiva"
              value={`${sellerStats.positive_rate}%`}
              sub="avaliações positivas"
            />
            <StatCard
              label="Negócios confirmados"
              value={`${sellerStats.confirmation_rate}%`}
              sub="vs iniciados"
            />
            <StatCard
              label="Tempo médio de resposta"
              value={formatResponseTime(sellerStats.avg_response_minutes)}
              sub={sellerStats.avg_response_minutes ? 'pending → confirmado' : 'sem dados'}
            />
            {sellerReputation.total_reviews > 0 && (
              <StatCard
                label="Avaliação"
                value={sellerReputation.avg_rating.toFixed(1)}
                sub={`(${sellerReputation.total_reviews} avaliações)`}
              />
            )}
          </div>
        </section>

        {/* Products */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              À venda
              <span className="text-sm font-normal text-gray-400 ml-2">
                ({sellerStats.active_products})
              </span>
            </h2>
            {sellerStats.active_products > products.length && (
              <Link
                href={`/search?seller=${profile.id}`}
                className="text-sm text-[#4B187C] hover:underline font-medium"
              >
                Ver todos →
              </Link>
            )}
          </div>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <EmptyProducts />
          )}
        </section>

        {/* Seller reputation */}
        <section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Reputação como vendedor</h2>
          <div className="bg-white rounded-2xl border border-[#EDE7FF] shadow-sm p-6">
            <SellerReputation data={sellerReputation} />
          </div>
        </section>

        {/* Buyer reputation — só mostra se tiver avaliações */}
        {buyerReputation.total_reviews > 0 && (
          <section>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Reputação como comprador</h2>
            <div className="bg-white rounded-2xl border border-[#EDE7FF] shadow-sm p-6">
              <BuyerReputation data={buyerReputation} />
            </div>
          </section>
        )}

      </div>
    </div>
  )
}