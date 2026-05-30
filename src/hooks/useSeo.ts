import { useEffect } from 'react'

type SeoOptions = {
  title: string
  description: string
}

function setMetaDescription(description: string) {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')

  if (!meta) {
    meta = document.createElement('meta')
    meta.name = 'description'
    document.head.appendChild(meta)
  }

  meta.content = description
}

export function useSeo({ title, description }: SeoOptions) {
  useEffect(() => {
    const previousTitle = document.title
    const previousDescription = document
      .querySelector<HTMLMetaElement>('meta[name="description"]')
      ?.content

    document.title = title
    setMetaDescription(description)

    return () => {
      document.title = previousTitle
      if (previousDescription) setMetaDescription(previousDescription)
    }
  }, [description, title])
}
