# Card Image Standards

<!--toc:start-->
- [Card Image Standards](#card-image-standards)
  - [Goal](#goal)
  - [Aspect Ratio](#aspect-ratio)
  - [Master Image](#master-image)
  - [Display Sizes](#display-sizes)
  - [Card preview](#card-preview)
  - [UI Rules](#ui-rules)
<!--toc:end-->

## Goal

Card images should be high quality enough for gameplay, preview, and future
collectible card features.

## Aspect Ratio

All card images must use a vertical 5:7 aspect ratio.
Recommended master size:

```text
2000 × 2800 px
```

## Master Image

Master images are the source-quality card images.

Recommended format:

```text
PNG
WebP quality 90+
```

Master images should be stored without UI shadows, borders, or rounded corners.
Those effects should be added by the frontend.

## Display Sizes

Hand cards

Desktop:

```text
160 × 224 px
```

Tablet:

```text
120 × 168 px
```

Mobile:

```text
96 × 134 px
```

## Card preview

Desktop:

```text
720 × 1008 px max
```

Tablet:

```text
560 × 784 px max
```

Mobile:

```text
90vw max width
5:7 ratio
```

## UI Rules

- Card images should keep the 5:7 ratio in all layouts.
- The frontend should use object-fit: cover or object-fit: contain depending on
the card design.
- Shadows, borders, hover effects, selection states, and rounded corners belong
to UI styles, not the source image.
- Future generated thumbnails should be derived from the master image, not
uploaded separately.
