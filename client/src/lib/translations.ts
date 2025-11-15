export type Language = 'en' | 'zh-TW' | 'vi';

export const translations = {
  en: {
    // Header
    appTitle: 'Craft AI Studio',
    version: 'MVP v1.0',
    language: 'Language',
    
    // Hero
    heroTitle: 'Craft Design Ideas with AI',
    heroSubtitle: 'Generate stunning slipper concepts and model-wearing scenes in seconds',
    
    // Upload Section
    sectionUpload: '1. Upload Template',
    uploadAreaTitle: 'Drop slipper template or click to upload',
    uploadAreaSubtitle: 'PNG or JPG up to 10MB',
    uploading: 'Uploading...',
    uploadedTemplate: 'Uploaded Template',
    removeTemplate: 'Remove template',
    
    // Design Configuration
    sectionDesignConfig: '2. Configure Design Parameters',
    referenceImage: 'Reference Image',
    referenceImageLabel: 'Reference Image (Optional)',
    referenceImageHint: 'Upload a design style reference image',
    uploadReferenceArea: 'Drop reference image or click to upload',
    designDescription: 'Design Description',
    designDescriptionLabel: 'Design Description (Optional)',
    designDescriptionPlaceholder: 'Describe your design vision, preferred colors, patterns, or any specific requirements...',
    brandLogo: 'Brand Logo',
    brandLogoLabel: 'Brand Logo (Optional)',
    brandLogoHint: 'Upload your brand logo to incorporate into the design',
    uploadLogoArea: 'Drop logo or click to upload',
    theme: 'Theme',
    themePlaceholder: 'Select theme',
    style: 'Style',
    stylePlaceholder: 'Select style',
    colorPalette: 'Color Palette',
    colorPlaceholder: 'Select color palette',
    customColor: 'Custom Color',
    customColorPlaceholder: 'e.g., Sunset orange with gold accents',
    material: 'Material',
    materialPlaceholder: 'Select material',
    customMaterial: 'Custom Material',
    customMaterialPlaceholder: 'e.g., Recycled plastic with bamboo trim',
    generateDesign: 'Generate Design',
    generating: 'Generating...',
    
    // Model Configuration
    sectionModelConfig: '3. Configure Model Scene (Optional)',
    nationality: 'Nationality',
    nationalityPlaceholder: 'Select nationality',
    familyCombination: 'Family Combination',
    familyCombinationPlaceholder: 'Select family combination',
    scenario: 'Scenario',
    scenarioPlaceholder: 'Select scenario',
    location: 'Location',
    locationPlaceholder: 'Select location',
    presentationStyle: 'Presentation Style',
    presentationStylePlaceholder: 'Select presentation style',
    customStyleText: 'Custom Style Description',
    customStyleTextPlaceholder: 'Describe your custom presentation style',
    generateModelScene: 'Generate Model Scene',
    
    // Gallery
    sectionGallery: '4. Generated Designs',
    viewMode: 'View Mode',
    topView: 'Top View',
    view45: '45° View',
    both: 'Both',
    downloadTopView: 'Download Top View',
    download45View: 'Download 45° View',
    downloadModelScene: 'Download Model Scene',
    
    // Validation Errors
    errorCustomColorRequired: 'Custom color description is required when using custom color',
    errorCustomMaterialRequired: 'Custom material description is required when using custom material',
    errorCustomStyleRequired: 'Custom style description is required when using Custom presentation style',
    errorInvalidFileType: 'Invalid file type',
    errorFileTypeMessage: 'Please upload a PNG or JPG image',
    errorFileTooLarge: 'File too large',
    errorFileSizeMessage: 'File must be less than 10MB',
    errorMissingTemplate: 'Please upload a slipper template first',
    errorMissingDesign: 'Please generate a slipper design first',
    errorGenerationFailed: 'Failed to generate',
    errorPreparationFailed: 'Failed to prepare generation request',
    
    // Alt Text (Accessibility)
    altUploadedTemplate: 'Uploaded template',
    altTopViewDesign: 'Top view slipper design',
    alt45ViewDesign: '45° view slipper design',
    altModelWearing: 'Model wearing slipper',
    
    // Language Names
    languageEnglish: 'English',
    languageTraditionalChinese: '繁體中文',
    languageVietnamese: 'Tiếng Việt',
    
    // Empty States & Gallery
    emptyStateTitle: 'Upload template to begin',
    emptyStateSubtitle: 'Your AI-generated designs will appear here',
    downloadPNG: 'Download PNG',
    imageZoomTitle: 'View Image',
    modelWearingSceneTitle: 'Model Wearing Scene',
    
    // Themes
    themeSpringSummer: 'Spring/Summer',
    themeFallWinter: 'Fall/Winter',
    themeHolidaySeason: 'Holiday Season',
    themeBeachResort: 'Beach/Resort',
    themeUrbanContemporary: 'Urban Contemporary',
    themeMinimalist: 'Minimalist',
    themeBohemian: 'Bohemian',
    themeAthleticSporty: 'Athletic/Sporty',
    
    // Styles
    styleGraffiti: 'Graffiti',
    styleMinimal: 'Minimal',
    styleSporty: 'Sporty',
    styleElegant: 'Elegant',
    styleCasual: 'Casual',
    styleLuxury: 'Luxury',
    styleEcoFriendly: 'Eco-Friendly',
    styleFuturistic: 'Futuristic',
    
    // Colors
    colorPastel: 'Pastel',
    colorEarthTones: 'Earth Tones',
    colorNeon: 'Neon',
    colorMonochrome: 'Monochrome',
    colorVibrant: 'Vibrant',
    colorMuted: 'Muted',
    colorMetallic: 'Metallic',
    colorCustom: 'Custom',
    
    // Materials
    materialLeather: 'Leather',
    materialCanvas: 'Canvas',
    materialSynthetic: 'Synthetic',
    materialWool: 'Wool',
    materialRecycledMaterials: 'Recycled Materials',
    materialRubber: 'Rubber',
    materialCork: 'Cork',
    materialTextile: 'Textile',
    materialCustom: 'Custom',
    
    // Nationalities
    nationalityAmerican: 'American',
    nationalityEuropean: 'European',
    nationalityAsian: 'Asian',
    nationalityLatinAmerican: 'Latin American',
    nationalityAfrican: 'African',
    nationalityMiddleEastern: 'Middle Eastern',
    nationalityAustralian: 'Australian',
    nationalityNordic: 'Nordic',
    
    // Family Combinations
    familyMotherChild: 'Mother + Child',
    familyFatherChild: 'Father + Child',
    familyParentsChild: 'Parents + Child',
    familySingleAdult: 'Single Adult',
    familyCouple: 'Couple',
    familyMultiGenerational: 'Multi-Generational',
    familySiblings: 'Siblings',
    
    // Scenarios
    scenarioParentChildPlay: 'Parent-Child Play',
    scenarioSoloRelaxation: 'Solo Relaxation',
    scenarioTravelAdventure: 'Travel Adventure',
    scenarioHomeComfort: 'Home Comfort',
    scenarioBeachDay: 'Beach Day',
    scenarioGardenParty: 'Garden Party',
    scenarioMorningRoutine: 'Morning Routine',
    scenarioEveningWalk: 'Evening Walk',
    
    // Locations
    locationCityStreet: 'City Street',
    locationHomeInterior: 'Home Interior',
    locationOutdoorPark: 'Outdoor Park',
    locationBeach: 'Beach',
    locationGarden: 'Garden',
    locationModernApartment: 'Modern Apartment',
    locationCoffeeShop: 'Coffee Shop',
    locationVacationResort: 'Vacation Resort',
    
    // Presentation Styles
    presentationRealisticPhotography: 'Realistic Photography',
    presentationProductMockup: 'Product Mockup',
    presentationCustom: 'Custom',
    
    // Toasts
    toastMissingTemplate: 'Please upload a slipper template first',
    toastMissingDesign: 'Please generate a slipper design first',
    toastDesignSuccess: 'Slipper design generated successfully!',
    toastModelSuccess: 'Model wearing scene generated successfully!',
    toastErrorTitle: 'Error',
    toastError: 'An error occurred. Please try again.',
  },
  'zh-TW': {
    // Header
    appTitle: 'Craft AI Studio',
    version: 'MVP v1.0',
    language: '語言',
    
    // Hero
    heroTitle: '用AI創作設計靈感',
    heroSubtitle: '在幾秒鐘內生成令人驚艷的拖鞋概念和模特兒穿著場景',
    
    // Upload Section
    sectionUpload: '1. 上傳模板',
    uploadAreaTitle: '拖放拖鞋模板或點擊上傳',
    uploadAreaSubtitle: 'PNG 或 JPG，最大 10MB',
    uploading: '上傳中...',
    uploadedTemplate: '已上傳模板',
    removeTemplate: '移除模板',
    
    // Design Configuration
    sectionDesignConfig: '2. 配置設計參數',
    referenceImage: '參考圖片',
    referenceImageLabel: '參考圖片（選填）',
    referenceImageHint: '上傳設計風格參考圖片',
    uploadReferenceArea: '拖放參考圖片或點擊上傳',
    designDescription: '設計說明',
    designDescriptionLabel: '設計說明（選填）',
    designDescriptionPlaceholder: '描述您的設計願景、偏好的顏色、圖案或任何特定需求...',
    brandLogo: '品牌Logo',
    brandLogoLabel: '品牌Logo（選填）',
    brandLogoHint: '上傳您的品牌標誌以融入設計中',
    uploadLogoArea: '拖放Logo或點擊上傳',
    theme: '主題',
    themePlaceholder: '選擇主題',
    style: '風格',
    stylePlaceholder: '選擇風格',
    colorPalette: '色彩調色板',
    colorPlaceholder: '選擇色彩調色板',
    customColor: '自訂顏色',
    customColorPlaceholder: '例如：日落橙配金色點綴',
    material: '材質',
    materialPlaceholder: '選擇材質',
    customMaterial: '自訂材質',
    customMaterialPlaceholder: '例如：回收塑料配竹子裝飾',
    generateDesign: '生成設計',
    generating: '生成中...',
    
    // Model Configuration
    sectionModelConfig: '3. 配置模特兒場景（選填）',
    nationality: '國籍',
    nationalityPlaceholder: '選擇國籍',
    familyCombination: '家庭組合',
    familyCombinationPlaceholder: '選擇家庭組合',
    scenario: '場景',
    scenarioPlaceholder: '選擇場景',
    location: '地點',
    locationPlaceholder: '選擇地點',
    presentationStyle: '呈現風格',
    presentationStylePlaceholder: '選擇呈現風格',
    customStyleText: '自訂風格描述',
    customStyleTextPlaceholder: '描述您的自訂呈現風格',
    generateModelScene: '生成模特兒場景',
    
    // Gallery
    sectionGallery: '4. 生成的設計',
    viewMode: '檢視模式',
    topView: '俯視圖',
    view45: '45° 視圖',
    both: '兩者',
    downloadTopView: '下載俯視圖',
    download45View: '下載 45° 視圖',
    downloadModelScene: '下載模特兒場景',
    
    // Validation Errors
    errorCustomColorRequired: '使用自訂顏色時需要自訂顏色描述',
    errorCustomMaterialRequired: '使用自訂材質時需要自訂材質描述',
    errorCustomStyleRequired: '使用自訂呈現風格時需要自訂風格描述',
    errorInvalidFileType: '檔案類型無效',
    errorFileTypeMessage: '請上傳 PNG 或 JPG 圖片',
    errorFileTooLarge: '檔案太大',
    errorFileSizeMessage: '檔案必須小於 10MB',
    errorMissingTemplate: '請先上傳拖鞋模板',
    errorMissingDesign: '請先生成拖鞋設計',
    errorGenerationFailed: '生成失敗',
    errorPreparationFailed: '準備生成請求失敗',
    
    // Alt Text (Accessibility)
    altUploadedTemplate: '已上傳的模板',
    altTopViewDesign: '俯視圖拖鞋設計',
    alt45ViewDesign: '45° 視圖拖鞋設計',
    altModelWearing: '穿拖鞋的模特兒',
    
    // Language Names
    languageEnglish: 'English',
    languageTraditionalChinese: '繁體中文',
    languageVietnamese: 'Tiếng Việt',
    
    // Empty States & Gallery
    emptyStateTitle: '上傳模板開始',
    emptyStateSubtitle: '您的 AI 生成設計將在此處顯示',
    downloadPNG: '下載 PNG',
    imageZoomTitle: '檢視圖片',
    modelWearingSceneTitle: '模特兒穿著場景',
    
    // Themes
    themeSpringSummer: '春夏',
    themeFallWinter: '秋冬',
    themeHolidaySeason: '節慶季節',
    themeBeachResort: '海灘度假',
    themeUrbanContemporary: '都市現代',
    themeMinimalist: '極簡主義',
    themeBohemian: '波希米亞',
    themeAthleticSporty: '運動風',
    
    // Styles
    styleGraffiti: '塗鴉',
    styleMinimal: '極簡',
    styleSporty: '運動',
    styleElegant: '優雅',
    styleCasual: '休閒',
    styleLuxury: '奢華',
    styleEcoFriendly: '環保',
    styleFuturistic: '未來主義',
    
    // Colors
    colorPastel: '粉彩',
    colorEarthTones: '大地色',
    colorNeon: '螢光',
    colorMonochrome: '單色',
    colorVibrant: '鮮豔',
    colorMuted: '柔和',
    colorMetallic: '金屬',
    colorCustom: '自訂',
    
    // Materials
    materialLeather: '皮革',
    materialCanvas: '帆布',
    materialSynthetic: '合成材料',
    materialWool: '羊毛',
    materialRecycledMaterials: '回收材料',
    materialRubber: '橡膠',
    materialCork: '軟木',
    materialTextile: '紡織品',
    materialCustom: '自訂',
    
    // Nationalities
    nationalityAmerican: '美國',
    nationalityEuropean: '歐洲',
    nationalityAsian: '亞洲',
    nationalityLatinAmerican: '拉丁美洲',
    nationalityAfrican: '非洲',
    nationalityMiddleEastern: '中東',
    nationalityAustralian: '澳洲',
    nationalityNordic: '北歐',
    
    // Family Combinations
    familyMotherChild: '母親+孩子',
    familyFatherChild: '父親+孩子',
    familyParentsChild: '父母+孩子',
    familySingleAdult: '單身成人',
    familyCouple: '情侶',
    familyMultiGenerational: '多代同堂',
    familySiblings: '兄弟姐妹',
    
    // Scenarios
    scenarioParentChildPlay: '親子遊戲',
    scenarioSoloRelaxation: '獨自放鬆',
    scenarioTravelAdventure: '旅行冒險',
    scenarioHomeComfort: '居家舒適',
    scenarioBeachDay: '海灘日',
    scenarioGardenParty: '花園派對',
    scenarioMorningRoutine: '早晨例行',
    scenarioEveningWalk: '晚間散步',
    
    // Locations
    locationCityStreet: '城市街道',
    locationHomeInterior: '家居內部',
    locationOutdoorPark: '戶外公園',
    locationBeach: '海灘',
    locationGarden: '花園',
    locationModernApartment: '現代公寓',
    locationCoffeeShop: '咖啡廳',
    locationVacationResort: '度假村',
    
    // Presentation Styles
    presentationRealisticPhotography: '寫實攝影',
    presentationProductMockup: '產品模型',
    presentationCustom: '自訂',
    
    // Toasts
    toastMissingTemplate: '請先上傳拖鞋模板',
    toastMissingDesign: '請先生成拖鞋設計',
    toastDesignSuccess: '拖鞋設計生成成功！',
    toastModelSuccess: '模特兒穿著場景生成成功！',
    toastErrorTitle: '錯誤',
    toastError: '發生錯誤。請再試一次。',
  },
  vi: {
    // Header
    appTitle: 'Craft AI Studio',
    version: 'MVP v1.0',
    language: 'Ngôn ngữ',
    
    // Hero
    heroTitle: 'Sáng Tạo Ý Tưởng Thiết Kế Với AI',
    heroSubtitle: 'Tạo ra các khái niệm dép tuyệt đẹp và cảnh người mẫu đeo trong vài giây',
    
    // Upload Section
    sectionUpload: '1. Tải Lên Mẫu',
    uploadAreaTitle: 'Kéo thả mẫu dép hoặc nhấp để tải lên',
    uploadAreaSubtitle: 'PNG hoặc JPG tối đa 10MB',
    uploading: 'Đang tải lên...',
    uploadedTemplate: 'Mẫu Đã Tải Lên',
    removeTemplate: 'Xóa mẫu',
    
    // Design Configuration
    sectionDesignConfig: '2. Cấu Hình Tham Số Thiết Kế',
    referenceImage: 'Hình Ảnh Tham Khảo',
    referenceImageLabel: 'Hình Ảnh Tham Khảo (Tùy Chọn)',
    referenceImageHint: 'Tải lên hình ảnh tham khảo phong cách thiết kế',
    uploadReferenceArea: 'Kéo thả hình tham khảo hoặc nhấp để tải lên',
    designDescription: 'Mô Tả Thiết Kế',
    designDescriptionLabel: 'Mô Tả Thiết Kế (Tùy Chọn)',
    designDescriptionPlaceholder: 'Mô tả tầm nhìn thiết kế, màu sắc ưa thích, họa tiết hoặc bất kỳ yêu cầu cụ thể nào...',
    brandLogo: 'Logo Thương Hiệu',
    brandLogoLabel: 'Logo Thương Hiệu (Tùy Chọn)',
    brandLogoHint: 'Tải lên logo thương hiệu để kết hợp vào thiết kế',
    uploadLogoArea: 'Kéo thả logo hoặc nhấp để tải lên',
    theme: 'Chủ Đề',
    themePlaceholder: 'Chọn chủ đề',
    style: 'Phong Cách',
    stylePlaceholder: 'Chọn phong cách',
    colorPalette: 'Bảng Màu',
    colorPlaceholder: 'Chọn bảng màu',
    customColor: 'Màu Tùy Chỉnh',
    customColorPlaceholder: 'vd: Cam hoàng hôn với điểm nhấn vàng',
    material: 'Chất Liệu',
    materialPlaceholder: 'Chọn chất liệu',
    customMaterial: 'Chất Liệu Tùy Chỉnh',
    customMaterialPlaceholder: 'vd: Nhựa tái chế với viền tre',
    generateDesign: 'Tạo Thiết Kế',
    generating: 'Đang tạo...',
    
    // Model Configuration
    sectionModelConfig: '3. Cấu Hình Cảnh Người Mẫu (Tùy Chọn)',
    nationality: 'Quốc Tịch',
    nationalityPlaceholder: 'Chọn quốc tịch',
    familyCombination: 'Kết Hợp Gia Đình',
    familyCombinationPlaceholder: 'Chọn kết hợp gia đình',
    scenario: 'Kịch Bản',
    scenarioPlaceholder: 'Chọn kịch bản',
    location: 'Địa Điểm',
    locationPlaceholder: 'Chọn địa điểm',
    presentationStyle: 'Phong Cách Trình Bày',
    presentationStylePlaceholder: 'Chọn phong cách trình bày',
    customStyleText: 'Mô Tả Phong Cách Tùy Chỉnh',
    customStyleTextPlaceholder: 'Mô tả phong cách trình bày tùy chỉnh của bạn',
    generateModelScene: 'Tạo Cảnh Người Mẫu',
    
    // Gallery
    sectionGallery: '4. Thiết Kế Đã Tạo',
    viewMode: 'Chế Độ Xem',
    topView: 'Nhìn Từ Trên',
    view45: 'Nhìn 45°',
    both: 'Cả Hai',
    downloadTopView: 'Tải Xuống Nhìn Từ Trên',
    download45View: 'Tải Xuống Nhìn 45°',
    downloadModelScene: 'Tải Xuống Cảnh Người Mẫu',
    
    // Validation Errors
    errorCustomColorRequired: 'Cần mô tả màu tùy chỉnh khi sử dụng màu tùy chỉnh',
    errorCustomMaterialRequired: 'Cần mô tả chất liệu tùy chỉnh khi sử dụng chất liệu tùy chỉnh',
    errorCustomStyleRequired: 'Cần mô tả phong cách tùy chỉnh khi sử dụng phong cách trình bày tùy chỉnh',
    errorInvalidFileType: 'Loại tệp không hợp lệ',
    errorFileTypeMessage: 'Vui lòng tải lên ảnh PNG hoặc JPG',
    errorFileTooLarge: 'Tệp quá lớn',
    errorFileSizeMessage: 'Tệp phải nhỏ hơn 10MB',
    errorMissingTemplate: 'Vui lòng tải lên mẫu dép trước',
    errorMissingDesign: 'Vui lòng tạo thiết kế dép trước',
    errorGenerationFailed: 'Tạo thất bại',
    errorPreparationFailed: 'Không thể chuẩn bị yêu cầu tạo',
    
    // Alt Text (Accessibility)
    altUploadedTemplate: 'Mẫu đã tải lên',
    altTopViewDesign: 'Thiết kế dép nhìn từ trên',
    alt45ViewDesign: 'Thiết kế dép nhìn 45°',
    altModelWearing: 'Người mẫu đang đi dép',
    
    // Language Names
    languageEnglish: 'English',
    languageTraditionalChinese: '繁體中文',
    languageVietnamese: 'Tiếng Việt',
    
    // Empty States & Gallery
    emptyStateTitle: 'Tải lên mẫu để bắt đầu',
    emptyStateSubtitle: 'Các thiết kế AI của bạn sẽ xuất hiện ở đây',
    downloadPNG: 'Tải Xuống PNG',
    imageZoomTitle: 'Xem Hình Ảnh',
    modelWearingSceneTitle: 'Cảnh Người Mẫu Đang Đi Dép',
    
    // Themes
    themeSpringSummer: 'Xuân Hè',
    themeFallWinter: 'Thu Đông',
    themeHolidaySeason: 'Mùa Lễ Hội',
    themeBeachResort: 'Khu Nghỉ Dưỡng Bãi Biển',
    themeUrbanContemporary: 'Đô Thị Đương Đại',
    themeMinimalist: 'Tối Giản',
    themeBohemian: 'Bohemia',
    themeAthleticSporty: 'Thể Thao',
    
    // Styles
    styleGraffiti: 'Graffiti',
    styleMinimal: 'Tối Thiểu',
    styleSporty: 'Thể Thao',
    styleElegant: 'Thanh Lịch',
    styleCasual: 'Giản Dị',
    styleLuxury: 'Sang Trọng',
    styleEcoFriendly: 'Thân Thiện Môi Trường',
    styleFuturistic: 'Tương Lai',
    
    // Colors
    colorPastel: 'Pastel',
    colorEarthTones: 'Tông Màu Đất',
    colorNeon: 'Neon',
    colorMonochrome: 'Đơn Sắc',
    colorVibrant: 'Rực Rỡ',
    colorMuted: 'Nhạt Nhòa',
    colorMetallic: 'Kim Loại',
    colorCustom: 'Tùy Chỉnh',
    
    // Materials
    materialLeather: 'Da',
    materialCanvas: 'Vải Bạt',
    materialSynthetic: 'Tổng Hợp',
    materialWool: 'Len',
    materialRecycledMaterials: 'Vật Liệu Tái Chế',
    materialRubber: 'Cao Su',
    materialCork: 'Cork',
    materialTextile: 'Vải Dệt',
    materialCustom: 'Tùy Chỉnh',
    
    // Nationalities
    nationalityAmerican: 'Mỹ',
    nationalityEuropean: 'Châu Âu',
    nationalityAsian: 'Châu Á',
    nationalityLatinAmerican: 'Mỹ La Tinh',
    nationalityAfrican: 'Châu Phi',
    nationalityMiddleEastern: 'Trung Đông',
    nationalityAustralian: 'Úc',
    nationalityNordic: 'Bắc Âu',
    
    // Family Combinations
    familyMotherChild: 'Mẹ + Con',
    familyFatherChild: 'Bố + Con',
    familyParentsChild: 'Cha Mẹ + Con',
    familySingleAdult: 'Người Lớn Độc Thân',
    familyCouple: 'Cặp Đôi',
    familyMultiGenerational: 'Đa Thế Hệ',
    familySiblings: 'Anh Chị Em',
    
    // Scenarios
    scenarioParentChildPlay: 'Chơi Cha Mẹ Con',
    scenarioSoloRelaxation: 'Thư Giãn Một Mình',
    scenarioTravelAdventure: 'Phiêu Lưu Du Lịch',
    scenarioHomeComfort: 'Thoải Mái Tại Nhà',
    scenarioBeachDay: 'Ngày Ở Bãi Biển',
    scenarioGardenParty: 'Tiệc Vườn',
    scenarioMorningRoutine: 'Thói Quen Buổi Sáng',
    scenarioEveningWalk: 'Đi Bộ Buổi Tối',
    
    // Locations
    locationCityStreet: 'Đường Phố Thành Phố',
    locationHomeInterior: 'Nội Thất Nhà',
    locationOutdoorPark: 'Công Viên Ngoài Trời',
    locationBeach: 'Bãi Biển',
    locationGarden: 'Vườn',
    locationModernApartment: 'Căn Hộ Hiện Đại',
    locationCoffeeShop: 'Quán Cà Phê',
    locationVacationResort: 'Khu Nghỉ Dưỡng',
    
    // Presentation Styles
    presentationRealisticPhotography: 'Chụp Ảnh Chân Thực',
    presentationProductMockup: 'Mô Hình Sản Phẩm',
    presentationCustom: 'Tùy Chỉnh',
    
    // Toasts
    toastMissingTemplate: 'Vui lòng tải lên mẫu dép trước',
    toastMissingDesign: 'Vui lòng tạo thiết kế dép trước',
    toastDesignSuccess: 'Thiết kế dép đã được tạo thành công!',
    toastModelSuccess: 'Cảnh người mẫu đeo đã được tạo thành công!',
    toastErrorTitle: 'Lỗi',
    toastError: 'Đã xảy ra lỗi. Vui lòng thử lại.',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;
