type CardImageProps = {
  imageUrl?: string
  title: string
  className?: string
}

export function CardImage({ imageUrl, title, className = '' }: CardImageProps) {
  return (
    <div className={`card-image ${className}`.trim()}>
      {imageUrl ? (
        <img src={imageUrl} alt={title} />
      ) : (
        <span>🂠</span>
      )}
    </div>
  )
}
