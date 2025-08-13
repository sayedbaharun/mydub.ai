export type PreviewArticle = {
  title: string
  body: string // HTML
  featuredImageUrl?: string
  gallery?: string[]
}

// Normalize different article shapes into PreviewArticle
export function toPreviewArticle(a: any): PreviewArticle {
  const title = a?.title || a?.heading || a?.name || ''

  // Prefer explicit HTML body fields, then rich text/content fallbacks
  const body =
    a?.bodyHtml ??
    a?.body ??
    a?.contentHtml ??
    a?.content ??
    a?.article ??
    ''

  // Normalize featured image
  const featuredImageUrl =
    a?.featuredImageUrl ??
    a?.featured_image_url ??
    a?.featured_image ??
    a?.imageUrl ??
    a?.image ??
    undefined

  // Normalize gallery/other images
  const galleryRaw =
    a?.gallery ??
    a?.images ??
    a?.otherImages ??
    a?.other_images ??
    []

  const gallery: string[] = Array.isArray(galleryRaw)
    ? galleryRaw
    : typeof galleryRaw === 'string'
    ? [galleryRaw]
    : []

  return { title, body, featuredImageUrl, gallery }
}
