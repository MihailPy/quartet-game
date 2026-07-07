import { CARD_IMAGES_PATH } from '../constants/ui'

export function getCardImageURL(imageURL?: string): string | undefined {
  if (!imageURL) {
    return undefined
  }

  if (imageURL.startsWith('http://') || imageURL.startsWith('https://')) {
    return imageURL
  }

  return `${CARD_IMAGES_PATH}${imageURL}`
}
