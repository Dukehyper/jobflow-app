import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { CollectionItem } from '@/types'
import { CollectionClient } from '@/components/collection/collection-client'

export const metadata = {
  title: 'Job Collection',
  description: 'Save jobs you\'re interested in, then start applications when ready.',
}

export default async function CollectionPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/login')
  }

  const { data: items, error: fetchError } = await supabase
    .from('collection')
    .select('*')
    .eq('user_id', user.id)
    .order('saved_at', { ascending: false })

  if (fetchError) {
    console.error('[CollectionPage] Failed to fetch collection:', fetchError)
  }

  const collectionItems: CollectionItem[] = items ?? []

  return <CollectionClient initialItems={collectionItems} />
}
