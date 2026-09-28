import { useEffect, useState } from 'react'
import { repo } from '../lib/db'

export function useReceiptImageUrl(itemId: string | undefined, hasImage: boolean) {
  const [url, setUrl] = useState<string | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null
    let cancelled = false

    if (itemId && hasImage) {
      repo.getReceiptImage(itemId).then((blob) => {
        if (cancelled || !blob) return
        objectUrl = URL.createObjectURL(blob)
        setUrl(objectUrl)
      })
    } else {
      setUrl(null)
    }

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [itemId, hasImage])

  return url
}
