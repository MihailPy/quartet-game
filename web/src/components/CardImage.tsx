import { DEFAULT_CARD_IMAGE } from '../constants/ui'
import { getCardImageURL } from '../utils/cardImages'

type CardImageProps = {
  imageUrl?: string
  title: string
  className?: string
}

export function CardImage({ imageUrl, title, className = '' }: CardImageProps) {
  const resolvedImageURL = getCardImageURL(imageUrl || DEFAULT_CARD_IMAGE)

  return (
    <div className={`card-image ${className}`.trim()}>
      <img src={resolvedImageURL} alt={title} />
    </div>
  )
}
