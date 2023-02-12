export declare type ResponsiveImageSize = [number, string | number] | string | number;

export declare type ResponsiveImagePreset = {
  sources: number[];
  sizes?: ResponsiveImageSize[];
  aspectRatio?: number | string;
  urlFormat?: string;
};

export declare type ResponsiveImagesOptions = {
  urlFormat?: string;
  presets: Record<string, ResponsiveImagePreset>;
};

export declare type PostHTMLASTNode = {
  tag?: string;
  attrs?: Record<string, string>;
  content?: (PostHTMLASTNode | string)[];
};

export declare type PostHTMLPlugin = (tree: PostHTMLASTNode) => void | PostHTMLASTNode;

export declare function processImage(image: PostHTMLASTNode, options: ResponsiveImagePreset): PostHTMLASTNode;

declare type posthtmlResponsiveImages = {
  (options: ResponsiveImagesOptions): PostHTMLPlugin;
  processImage: typeof processImage;
};

export default posthtmlResponsiveImages;
