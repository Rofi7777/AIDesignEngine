import { PRODUCT_TYPES, PRODUCT_ANGLES } from "./schema";

export type ProductType = typeof PRODUCT_TYPES[number];

// Product-specific terminology and design guidelines
export interface ProductConfig {
  // Display names for UI
  displayName: {
    en: string;
    zhTW: string;
    vi: string;
  };
  
  // Angles/views for this product type
  angles: readonly string[];
  angleLabels: {
    [key: string]: {
      en: string;
      zhTW: string;
      vi: string;
    };
  };
  
  // Designer expertise area
  designerExpertise: string;
  
  // Product-specific design guidelines
  shapePreservationRules: string;
  designFocusAreas: string[];
  
  // Template upload hints
  templateHint: {
    en: string;
    zhTW: string;
    vi: string;
  };
  
  // Model scene context (how product is worn/used)
  modelSceneContext: string;
}

export const PRODUCT_CONFIGS: Record<ProductType, ProductConfig> = {
  shoes: {
    displayName: {
      en: "Shoes",
      zhTW: "鞋子",
      vi: "Giày",
    },
    angles: PRODUCT_ANGLES.shoes,
    angleLabels: {
      top: {
        en: "Top View",
        zhTW: "俯視圖",
        vi: "Góc nhìn trên",
      },
      "45degree": {
        en: "45° View",
        zhTW: "45°視角",
        vi: "Góc 45°",
      },
      side: {
        en: "Side View",
        zhTW: "側視圖",
        vi: "Góc nhìn bên",
      },
      bottom: {
        en: "Bottom View",
        zhTW: "底部圖",
        vi: "Góc nhìn đáy",
      },
    },
    designerExpertise: "footwear & athletic shoe design",
    shapePreservationRules: "Keep the exact shoe last, sole thickness, upper construction, heel height, and toe box shape from the template. Only modify surface colors, patterns, materials, textures, and branding.",
    designFocusAreas: [
      "Upper material and texture",
      "Midsole and outsole design",
      "Lacing system styling",
      "Brand logos and badges",
      "Color blocking and patterns",
      "Performance or lifestyle positioning",
    ],
    templateHint: {
      en: "Upload shoe template (side or top view)",
      zhTW: "上傳鞋子模板（側視圖或俯視圖）",
      vi: "Tải lên mẫu giày (góc nhìn bên hoặc trên)",
    },
    modelSceneContext: "Model wearing the shoes on their feet, standing or in action",
  },
  
  slippers: {
    displayName: {
      en: "Slippers",
      zhTW: "拖鞋",
      vi: "Dép",
    },
    angles: PRODUCT_ANGLES.slippers,
    angleLabels: {
      top: {
        en: "Top View",
        zhTW: "俯視圖",
        vi: "Góc nhìn trên",
      },
      "45degree": {
        en: "45° View",
        zhTW: "45°視角",
        vi: "Góc 45°",
      },
      side: {
        en: "Side View",
        zhTW: "側視圖",
        vi: "Góc nhìn bên",
      },
      bottom: {
        en: "Bottom View",
        zhTW: "底部圖",
        vi: "Góc nhìn đáy",
      },
    },
    designerExpertise: "casual footwear & slipper design",
    shapePreservationRules: "Keep the exact slipper silhouette, sole thickness, strap position, and overall construction from the template. Only modify surface graphics, colors, materials, patterns, and decorative details.",
    designFocusAreas: [
      "Upper material and comfort feel",
      "Strap or slide design",
      "Footbed texture and support",
      "Outsole pattern and grip",
      "Decorative elements and branding",
      "Seasonal and lifestyle themes",
    ],
    templateHint: {
      en: "Upload slipper template (top or angled view)",
      zhTW: "上傳拖鞋模板（俯視圖或斜視圖）",
      vi: "Tải lên mẫu dép (góc nhìn trên hoặc nghiêng)",
    },
    modelSceneContext: "Model wearing the slippers casually, at home or resort setting",
  },
  
  clothes: {
    displayName: {
      en: "Clothes",
      zhTW: "衣服",
      vi: "Quần áo",
    },
    angles: PRODUCT_ANGLES.clothes,
    angleLabels: {
      front: {
        en: "Front View",
        zhTW: "正面視圖",
        vi: "Góc nhìn phía trước",
      },
      back: {
        en: "Back View",
        zhTW: "背面視圖",
        vi: "Góc nhìn phía sau",
      },
      side: {
        en: "Side View",
        zhTW: "側面視圖",
        vi: "Góc nhìn bên",
      },
      detail: {
        en: "Detail View",
        zhTW: "細節視圖",
        vi: "Góc nhìn chi tiết",
      },
    },
    designerExpertise: "fashion apparel & garment design",
    shapePreservationRules: "Maintain the exact garment silhouette, cut, seam lines, collar/neckline shape, sleeve length, and overall fit from the template. Only modify fabric patterns, colors, textures, prints, embellishments, and branding details.",
    designFocusAreas: [
      "Fabric selection and texture",
      "Print and pattern design",
      "Color palette and blocking",
      "Trim and embellishment details",
      "Brand logos and labels",
      "Seasonal collection themes",
    ],
    templateHint: {
      en: "Upload clothing template (front flat lay or model photo)",
      zhTW: "上傳衣服模板（正面平鋪或模特照片）",
      vi: "Tải lên mẫu quần áo (góc phẳng phía trước hoặc ảnh người mẫu)",
    },
    modelSceneContext: "Model wearing the garment naturally in appropriate setting",
  },
  
  bags: {
    displayName: {
      en: "Bags",
      zhTW: "包包",
      vi: "Túi xách",
    },
    angles: PRODUCT_ANGLES.bags,
    angleLabels: {
      front: {
        en: "Front View",
        zhTW: "正面視圖",
        vi: "Góc nhìn phía trước",
      },
      side: {
        en: "Side View",
        zhTW: "側面視圖",
        vi: "Góc nhìn bên",
      },
      top: {
        en: "Top View",
        zhTW: "俯視圖",
        vi: "Góc nhìn trên",
      },
      detail: {
        en: "Detail View",
        zhTW: "細節視圖",
        vi: "Góc nhìn chi tiết",
      },
    },
    designerExpertise: "leather goods & accessory design",
    shapePreservationRules: "Preserve the exact bag structure, dimensions, proportions, handle/strap placement, closure system, and 3D form from the template. Only modify surface materials, colors, textures, hardware finishes, logos, and decorative accents.",
    designFocusAreas: [
      "Material selection (leather, canvas, synthetic)",
      "Hardware and metal finishes",
      "Color and texture combinations",
      "Logo placement and branding",
      "Stitching and edge details",
      "Functional design elements",
    ],
    templateHint: {
      en: "Upload bag template (front or side product shot)",
      zhTW: "上傳包包模板（正面或側面產品照）",
      vi: "Tải lên mẫu túi (ảnh sản phẩm phía trước hoặc bên)",
    },
    modelSceneContext: "Model holding or carrying the bag in a lifestyle setting",
  },
  
  custom: {
    displayName: {
      en: "Custom Product",
      zhTW: "自定義產品",
      vi: "Sản phẩm tùy chỉnh",
    },
    angles: PRODUCT_ANGLES.custom,
    angleLabels: {
      view1: {
        en: "View 1",
        zhTW: "視角 1",
        vi: "Góc nhìn 1",
      },
      view2: {
        en: "View 2",
        zhTW: "視角 2",
        vi: "Góc nhìn 2",
      },
      view3: {
        en: "View 3",
        zhTW: "視角 3",
        vi: "Góc nhìn 3",
      },
      view4: {
        en: "View 4",
        zhTW: "視角 4",
        vi: "Góc nhìn 4",
      },
    },
    designerExpertise: "product & industrial design",
    shapePreservationRules: "Maintain the exact product shape, structure, proportions, and fundamental form from the template. Only modify surface colors, patterns, materials, textures, logos, and decorative elements.",
    designFocusAreas: [
      "Material and finish selection",
      "Color palette and combinations",
      "Pattern and graphic design",
      "Brand identity integration",
      "Texture and tactile qualities",
      "User-specified design requirements",
    ],
    templateHint: {
      en: "Upload your product template (clear, well-lit photo)",
      zhTW: "上傳您的產品模板（清晰、光線良好的照片）",
      vi: "Tải lên mẫu sản phẩm của bạn (ảnh rõ ràng, đủ sáng)",
    },
    modelSceneContext: "Model or user interacting with the product in relevant context",
  },
};

// Helper function to get product config
export function getProductConfig(productType: ProductType): ProductConfig {
  return PRODUCT_CONFIGS[productType];
}

// Helper function to get angle labels for a product type
export function getAngleLabels(productType: ProductType, locale: 'en' | 'zhTW' | 'vi' = 'en'): Record<string, string> {
  const config = getProductConfig(productType);
  const labels: Record<string, string> = {};
  
  for (const angle of config.angles) {
    labels[angle] = config.angleLabels[angle]?.[locale] || angle;
  }
  
  return labels;
}

// Helper function to get display name
export function getProductDisplayName(productType: ProductType, locale: 'en' | 'zhTW' | 'vi' = 'en'): string {
  return getProductConfig(productType).displayName[locale];
}
