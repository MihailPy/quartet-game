import { useState } from 'react'
import { DEFAULT_CARD_IMAGE } from '../constants/ui'
import { getCardImageURL } from '../utils/cardImages'

type CardImageProps = {
  imageUrl?: string
  title: string
  className?: string
}

export function CardImage({ imageUrl, title, className = '' }: CardImageProps) {
  const [hasError, setHasError] = useState(false)

  const resolvedImageURL = getCardImageURL(
    hasError ? DEFAULT_CARD_IMAGE : imageUrl || DEFAULT_CARD_IMAGE,
  )

  return (
    <div className={`card-image ${className}`.trim()}>
      <img
        src={resolvedImageURL}
        alt={title}
        onError={() => setHasError(true)}
      />
    </div>
  )
}
