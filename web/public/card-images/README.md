# Card Images

Card images are stored in this directory and referenced from card `image_url` fields.

## How to add an image

1. Add the image file to this directory or one of its subdirectories.
2. Use a path relative to `web/public/card-images/`.
3. Save that path in the card `image_url` field.

## Path examples

If the file is here:

```text
web/public/card-images/cat.png
```

Use this image_url:

```text
cat.png
```

If the file is here:

```text
web/public/card-images/animals/cat.png
```

Use this image_url:

```text
animals/cat.png
```

If the file is here:

```text
web/public/card-images/placeholders/red-card.svg
```

Use this image_url:

```text
placeholders/red-card.svg
```

Do not include /card-images/ in the saved image_url.
The frontend adds that prefix automatically.

## Supported formats

* .jpg
* .png
* .webp
* .svg for placeholders

## Recommended shape

Use vertical card-like images with a 5:7 aspect ratio.

Recommended examples:

```text
500x700
750x1050
1000x1400
```

## Naming

Use lowercase filenames with hyphens.

Good:

```text
red-dragon.png
forest-fox.webp
blue-card.svg
```

Avoid:

```text
Red Dragon.png
кот.png
card image final copy.png
```

## Fallback

If image_url is empty or the image file cannot be loaded, the frontend shows:

```text
placeholders/default-card.svg
```

## Where images are displayed

Card images are used in:

* quartets editor
* card preview modal
* player hand
* request card flow
* game room card UI
