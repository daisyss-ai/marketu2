import { Suspense, type ComponentProps } from 'react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PublicProfile } from '@/components/profile/PublicProfile'
import {
  getPublicProfile,
  getSellerReputation,
  getBuyerReputation,
  getSellerStats,
  getSellerProducts,
} from '@/lib/profile/getPublicProfile'
import type { Product } from '@/lib/profile/types'

interface Props {
  params: Promise<{ id: string }>
}

function UserProfileContent(props: ComponentProps<typeof PublicProfile>) {
  return <PublicProfile {...props} />
}

export async function generateMetadata({ params }: Props) {
  const { id } = await params
  const profile = await getPublicProfile(id)
  if (!profile) return { title: 'Perfil não encontrado' }
  return {
    title: `${profile.full_name} — Perfil`,
    description: `Vê o perfil e reputação de ${profile.full_name} na plataforma.`,
  }
}

export default async function UserProfilePage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [profile, sellerReputation, buyerReputation, sellerStats, rawProducts] = await Promise.all([
    getPublicProfile(id),
    getSellerReputation(id),
    getBuyerReputation(id),
    getSellerStats(id),
    getSellerProducts(id),
  ])

  if (!profile) notFound()

  const products: Product[] = rawProducts.map((p) => ({
    id: p.id,
    title: p.title,
    price: p.price,
    images: (p.images as string[] | null) ?? null,
    category_id: p.category_id ?? null,
    type: p.type ?? null,
  }))

  const isOwn = user?.id === profile.id

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfileContent
        profile={profile}
        isOwn={isOwn}
        sellerReputation={sellerReputation}
        buyerReputation={buyerReputation}
        sellerStats={sellerStats}
        products={products}
      />
    </Suspense>
  )
}
