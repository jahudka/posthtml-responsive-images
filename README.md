# `posthtml-responsive-images`

This is a PostHTML plugin which generates `srcset` and `sizes` attributes
for images based on configured presets. It will just generate the HTML,
not the actual images - but there are other tools for that. This plugin
integrates especially well with ParcelJS.

The plugin requires the image element to have a `width` and `height` attribute
matching the actual image dimensions - it will not try to resolve the image file
and read its dimensions.

The plugin works with the following elements:

 - `<img>`
 - `<source>` inside a `<picture>`

## Installation

```shell
npm i -D posthtml-responsive-images
```

### Configuration

`.posthtmlrc`:

```json
{
  "plugins": {
    "posthtml-responsive-images": {
      "urlFormat": "{baseUrl}{basename}@{width}x{height}.{ext}",
      "presets": {
        "preset A": {
          "sources": [ 128, 256, 512 ],
          "sizes": [
            [ 560, "256px" ],
            [ "30vw" ]
          ],
          "aspectRatio": "1:1"
        }
      }
    }
  }
}
```

### HTML input

```html
<img src="/images/thumbs/my-pretty-face.jpg" width="720" height="640" responsive="preset A">
```

### HTML output

```html
<img src="/images/thumbs/my-pretty-face@512x512.jpg"
  width="512"
  height="512"
  srcset="
    /images/thumbs/my-pretty-face@128x128.jpg 128w,
    /images/thumbs/my-pretty-face@256x256.jpg 256w,
    /images/thumbs/my-pretty-face@512x512.jpg 512w
  "
  sizes="(min-width: 560px) 256px, 30vw">
```

## Configuration options

### Global

| Option         | Type                     | Description                                                                       |
|----------------|--------------------------|-----------------------------------------------------------------------------------|
| `urlFormat`    | `string`                 | Format string for generated URLs, see below for details.                          |
| `srcUrlFormat` | `string`                 | Format string for adjusted `src`, see below for details. Defaults to `urlFormat`. |
| `presets`      | `Record<string, Preset>` | See next section.                                                                 |

### Presets

| Option         | Type                                                             | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
|----------------|------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `sources`      | `number[]`                                                       | An array of source sizes in ascending order.                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| `sizes`        | `([number, string &vert; number] &vert; string &vert; number)[]` | CSS sizes the image can have. If this is omitted, the `sizes` attribute will not be generated. All but the last entry should be a `[number, string &vert; number]` tuple, where the first element represents the `min-width` of the viewport for the size to apply. The last entry is the default size. A size specified as a `number` will be suffixed with `px`. A size string which contains any of the characters `-+*/()` and doesn't begin with `calc`, `clamp`, `max` or `min` will be wrapped in a `calc()`. |
| `aspectRatio`  | `string &vert; number`                                           | Optional aspect ratio. If not specified, it will be calculated from the image `width` and `height` attributes. If this _is_ specified, the `height` parameter of the generated URLs will be computed from the respective `width` using this aspect ratio. Can be specified as a fractional number (e.g. `0.5625` for 16:9) or a string formatted as either `W:H` or `WxH`.                                                                                                                                           |
| `urlFormat`    | `string`                                                         | Optional preset-specific override for the global `urlFormat` option.                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| `srcUrlFormat` | `string`                                                         | Optional preset-specific override for the global `srcUrlFormat` option.                                                                                                                                                                                                                                                                                                                                                                                                                                              |


## Generated output

The `sources` will be filtered to only use source sizes smaller than
or equal to the original image width, so you're never enlarging small images.

Aside from generating the `srcset` and `sizes` attributes, the plugin will also
adjust the `src`, `width` and `height` attributes to match the largest of the
configured `sizes` which is still smaller than or equal to the original width.
This means that if you set an `aspectRatio`, the width and height will now match
that, and browsers which don't support `srcset` and `sizes` will gracefully fall
back to the best resolution which should be needed for that particular image,
no matter the source resolution.

The `urlFormat` and `srcUrlFormat` strings should include placeholders which will
be replaced with the appropriate values. The available placeholders are:

| Placeholder  | Value                                                                                                                                        |
|--------------|----------------------------------------------------------------------------------------------------------------------------------------------|
| `{baseurl}`  | The base URL of the image, that is, everything up to and including the last `/` character in the original image URL, e.g. `/images/thumbs/`. |
| `{filename}` | The original image file name and extension, e.g. `my-pretty-face.jpg`.                                                                       |
| `{basename}` | The original image file name without extension, e.g. `my-pretty-face`.                                                                       |
| `{ext}`      | The original image extension, e.g. `jpg`.                                                                                                    |
| `{width}`    | The width of the image at the requested size.                                                                                                |
| `{height}`   | The height of the image at the requested size.                                                                                               |


## Programmatic usage

The plugin exports the core `generateResponsiveAttributes` function, so if you have some
special use-case which the plugin doesn't cover, you should be able to create your own
plugin easily enough. The function has the following signature:

```typescript
export function generateResponsiveAttributes(
  originalSrc: string,
  originalWidth: number,
  originalHeight: number,
  preset: ResponsiveImagePreset,
): ResponsiveAttributes;
```

The returned value is an object with the `src`, `width`, `height`, `srcset`, and optional
`sizes` properties. The `ResponsiveImagePreset` type conforms to what is described in the
Configuration section, but it should have its `urlFormat` already resolved to a `string`.
