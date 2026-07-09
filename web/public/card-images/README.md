# Card Images

Card images are stored in this directory and referenced from card `image_url` fields.

## Path format

Use paths relative to this directory.
Examples:

```text
cat.png
animals/cat.png
placeholders/default-card.svg
```

Do not include /card-images/ in the saved image_url.
The frontend adds that prefix automatically.

## Supported formats

* .jpg
* .png
* .webp
* .svg for placeholders only

## Recommended shape

Use vertical card-like images with a 5:7 aspect ratio.

## Naming

Use lowercase filenames with hyphens.

Good:

```
red-dragon.png
forest-fox.webp
```

Avoid spaces and non-latin characters in filenames.
