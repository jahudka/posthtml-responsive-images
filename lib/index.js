function normalizeAspectRatio(ratio) {
  if (typeof ratio === 'number') {
    return ratio;
  } else if (typeof ratio === 'string' && ratio !== '') {
    const m = ratio.match(/^(\d+(?:\.\d+)?)[:x\/](\d+(?:\.\d+)?)$/);

    if (m) {
      return parseFloat(m[1]) / parseFloat(m[2]);
    }
  } else if (ratio === undefined || ratio === null || ratio === '') {
    return null;
  }

  throw new Error(`Invalid aspect ratio: '${ratio}'`);
}

function formatUrl(src, fmt, width, aspectRatio) {
  const m = src.match(/^(.*\/)?([^\/]+)\.([^\/.]+)$/);

  if (!m) {
    throw new Error(`Unable to parse url '${src}'`);
  }

  const params = {
    baseurl: m[1] === undefined ? '' : m[1],
    filename: m[2] + '.' + m[3],
    basename: m[2],
    ext: m[3],
    width,
    height: Math.round(width / aspectRatio),
  };

  return fmt.replace(/\{([a-z]+)}/gi, (_, k) => {
    const param = k.toLowerCase();
    return param in params ? params[param] : '';
  });
}

function formatSize(v) {
  return typeof v === 'number' ? `${v}px` : /^(?!calc|clamp|max|min).*[-+*\/()]/.test(v) ? `calc(${v})` : v;
}

function generateResponsiveAttributes(originalSrc, originalWidth, originalHeight, preset) {
  const originalAspectRatio = originalWidth / originalHeight;
  const desiredAspectRatio = normalizeAspectRatio(preset.aspectRatio);
  const aspectRatio = desiredAspectRatio !== null && Math.abs(originalAspectRatio - desiredAspectRatio) > 0.000000001
    ? desiredAspectRatio
    : originalAspectRatio;
  const maxWidth = Math.min(Math.max(...preset.sources), originalWidth);
  const attrs = {
    src: formatUrl(originalSrc, preset.srcUrlFormat || preset.urlFormat, maxWidth, aspectRatio),
    width: String(maxWidth),
    height: String(Math.round(maxWidth / aspectRatio)),
  };

  attrs.srcset = preset.sources
    .filter(w => w <= originalWidth)
    .map((w) => `${formatUrl(originalSrc, preset.urlFormat, w, aspectRatio)} ${w}w`)
    .join(', ');

  if (preset.sizes && preset.sizes.length) {
    attrs.sizes = preset.sizes
      .map((s) => Array.isArray(s) ? `(min-width: ${s[0]}px) ${formatSize(s[1])}` : formatSize(s))
      .join(', ');
  }

  return attrs;
}


function posthtmlResponsiveImages(options) {
  return async (tree) => {
    tree.match({ attrs: { responsive: true } }, (node) => {
      if (node.tag.toLowerCase() !== 'img' && node.tag.toLowerCase() !== 'source') {
        return node;
      }

      const preset = options.presets[node.attrs.responsive];

      if (!preset) {
        throw new Error(`Unknown responsive preset: '${node.attrs.responsive}'`);
      }

      preset.urlFormat || (preset.urlFormat = options.urlFormat);
      preset.srcUrlFormat || (preset.srcUrlFormat = options.srcUrlFormat);

      if (!preset.urlFormat) {
        throw new Error(`Unable to resolve the 'urlFormat' option for preset '${node.attrs.responsive}'`);
      }

      delete node.attrs.responsive;
      delete node.attrs.srcset;
      delete node.attrs.sizes;

      Object.assign(node.attrs, generateResponsiveAttributes(
        node.attrs.src,
        parseFloat(node.attrs.width),
        parseFloat(node.attrs.height),
        preset,
      ));

      return node;
    });

    return tree;
  };
}

module.exports = posthtmlResponsiveImages;
module.exports.generateResponsiveAttributes = generateResponsiveAttributes;
