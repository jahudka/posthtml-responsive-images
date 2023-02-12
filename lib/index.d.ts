export declare type ResponsiveImageSize = [number, string | number] | string | number;

export declare type ResponsiveImagePreset = {
  sources: number[];
  sizes?: ResponsiveImageSize[];
  aspectRatio?: number | string;
  urlFormat?: string;
  srcUrlFormat?: string;
};

export declare type ResponsiveImagesOptions = {
  urlFormat?: string;
  srcUrlFormat?: string;
  presets: Record<string, ResponsiveImagePreset>;
};

export declare type ResponsiveAttributes = {
  src: string;
  width: string;
  height: string;
  srcset: string;
  sizes?: string;
};

export declare function generateResponsiveAttributes(
  originalSrc: string,
  originalWidth: number,
  originalHeight: number,
  preset: ResponsiveImagePreset,
): ResponsiveAttributes;
