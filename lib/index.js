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
  const m = src.match(/^(.*\/)([^\/]+)\.([^\/.]+)$/);

  if (!m) {
    throw new Error(`Unable to parse url '${src}'`);
  }

  const params = {
    baseurl: m[1],
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

function processImage(node, options) {
  const originalSrc = node.attrs.src;
  const originalWidth = parseFloat(String(node.attrs.width));
  const originalHeight = parseFloat(String(node.attrs.height));
  const originalAspectRatio = originalWidth / originalHeight;
  const desiredAspectRatio = normalizeAspectRatio(options.aspectRatio);
  const aspectRatio = desiredAspectRatio !== null && Math.abs(originalAspectRatio - desiredAspectRatio) > 0.000000001
    ? desiredAspectRatio
    : originalAspectRatio;
  const maxWidth = Math.min(Math.max(...options.sources), originalWidth);

  node.attrs.src = formatUrl(originalSrc, options.urlFormat, maxWidth, aspectRatio);
  node.attrs.width = String(maxWidth);
  node.attrs.height = String(Math.round(maxWidth / aspectRatio));

  delete node.attrs.srcset;
  delete node.attrs.sizes;

  node.attrs.srcset = options.sources
    .filter(w => w <= originalWidth)
    .map((w) => `${formatUrl(originalSrc, options.urlFormat, w, aspectRatio)} ${w}w`)
    .join(', ');

  if (options.sizes && options.sizes.length) {
    node.attrs.sizes = options.sizes
      .map((s) => Array.isArray(s) ? `(min-width: ${s[0]}px) ${formatSize(s[1])}` : formatSize(s))
      .join(', ');
  }

  return node;
}


function posthtmlResponsiveImages(options) {
  return async (tree) => {
    tree.match({ attrs: { responsive: true } }, (node) => {
      const o = node.attrs.responsive && options.presets[node.attrs.responsive];

      if (!o) {
        throw new Error(`Unknown responsive preset: '${node.attrs.responsive}'`);
      }

      o.urlFormat || (o.urlFormat = options.urlFormat);

      if (!o.urlFormat) {
        throw new Error(`Unable to resolve the 'urlFormat' option for preset '${node.attrs.responsive}'`);
      }

      delete node.attrs.responsive;
      return processImage(node, o);
    });

    return tree;
  };
}

posthtmlResponsiveImages.processImage = processImage;
module.exports = posthtmlResponsiveImages;
