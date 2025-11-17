import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useTranslation } from "@/contexts/LanguageContext";
import { LanguageSelector } from "@/components/LanguageSelector";
import {
  Upload,
  Sparkles,
  Download,
  ImageIcon,
  Loader2,
  X,
} from "lucide-react";
import {
  THEMES,
  STYLES,
  COLOR_PALETTES,
  MATERIALS,
  NATIONALITIES,
  FAMILY_COMBINATIONS,
  SCENARIOS,
  LOCATIONS,
  PRESENTATION_STYLES,
  PRODUCT_TYPES,
  type GeneratedImage,
  slipperDesignRequestBaseSchema,
  modelWearingRequestSchema,
} from "@shared/schema";
import { getProductConfig, type ProductType } from "@shared/productConfig";
import { z } from "zod";

const createDesignFormSchema = (t: (key: any) => string) => 
  slipperDesignRequestBaseSchema.omit({ templateImage: true, angles: true }).extend({
    customColor: z.string().optional(),
    customMaterial: z.string().optional(),
    designDescription: z.string().optional(),
  }).refine(
    (data) => {
      if (data.color === "Custom") {
        return data.customColor && data.customColor.trim().length > 0;
      }
      return true;
    },
    {
      message: t('errorCustomColorRequired'),
      path: ["customColor"],
    }
  ).refine(
    (data) => {
      if (data.material === "Custom") {
        return data.customMaterial && data.customMaterial.trim().length > 0;
      }
      return true;
    },
    {
      message: t('errorCustomMaterialRequired'),
      path: ["customMaterial"],
    }
  );

const createModelFormSchema = (t: (key: any) => string) =>
  z.object({
    nationality: z.string().min(1, "Nationality is required"),
    familyCombination: z.string().min(1, "Family combination is required"),
    scenario: z.string().min(1, "Scenario is required"),
    location: z.string().min(1, "Location is required"),
    presentationStyle: z.string().min(1, "Presentation style is required"),
    customStyleText: z.string().optional(),
  }).refine(
    (data) => {
      if (data.presentationStyle === "Custom") {
        return data.customStyleText && data.customStyleText.trim().length > 0;
      }
      return true;
    },
    {
      message: t('errorCustomStyleRequired'),
      path: ["customStyleText"],
    }
  );

type DesignFormValues = z.infer<ReturnType<typeof createDesignFormSchema>>;
type ModelFormValues = z.infer<ReturnType<typeof createModelFormSchema>>;

// Type for per-angle template uploads
type AngleUpload = {
  file: File | null;
  previewUrl: string | null;
  fileName: string | null;
};

type AngleUploads = Record<string, AngleUpload>;

// Helper to initialize angle uploads based on product config
const initializeAngleUploads = (productType: ProductType): AngleUploads => {
  const config = getProductConfig(productType);
  const uploads: AngleUploads = {};
  config.angles.forEach((angle) => {
    uploads[angle] = {
      file: null,
      previewUrl: null,
      fileName: null,
    };
  });
  return uploads;
};

export default function Home() {
  const { toast } = useToast();
  const { t, language } = useTranslation();
  
  // Product Type Selection
  const [selectedProductType, setSelectedProductType] = useState<ProductType>("slippers");
  const [customProductType, setCustomProductType] = useState<string>("");
  
  // Multi-angle template uploads (one per angle, all optional)
  const [angleUploads, setAngleUploads] = useState<AngleUploads>(() => 
    initializeAngleUploads("slippers")
  );
  
  // New design enhancement files
  const [referenceImageFile, setReferenceImageFile] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const [brandLogoFile, setBrandLogoFile] = useState<File | null>(null);
  const [brandLogoPreview, setBrandLogoPreview] = useState<string | null>(null);

  // Dynamic product images storage - keyed by angle name
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [generatedModelImage, setGeneratedModelImage] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<string>("");
  
  // Image zoom modal state
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [zoomedImageAlt, setZoomedImageAlt] = useState<string>("");

  const designFormSchema = useMemo(() => createDesignFormSchema(t), [t]);
  const modelFormSchema = useMemo(() => createModelFormSchema(t), [t]);

  // Clear generated images and reset angle uploads when product type changes
  useEffect(() => {
    setGeneratedImages({});
    setActiveView("");
    setAngleUploads(initializeAngleUploads(selectedProductType));
  }, [selectedProductType]);

  const designForm = useForm<DesignFormValues>({
    resolver: zodResolver(designFormSchema),
    defaultValues: {
      productType: "slippers",
      customProductType: "",
      theme: "",
      style: "",
      color: "",
      material: "",
      customColor: "",
      customMaterial: "",
      designDescription: "",
    },
  });

  const modelForm = useForm<ModelFormValues>({
    resolver: zodResolver(modelFormSchema),
    defaultValues: {
      nationality: "",
      familyCombination: "",
      scenario: "",
      location: "",
      presentationStyle: "",
      customStyleText: "",
    },
  });

  const { data: savedImages } = useQuery<GeneratedImage[]>({
    queryKey: ["/api/generated-images"],
  });

  // Validate image file size and dimensions
  const validateImageFile = async (file: File): Promise<{ valid: boolean; error?: string }> => {
    // Check file size (minimum 10KB)
    if (file.size < 10 * 1024) {
      return { 
        valid: false, 
        error: t('errorImageTooSmall') || 'Image file is too small. Please upload an image larger than 10KB.' 
      };
    }

    // Check file size (maximum 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { 
        valid: false, 
        error: t('errorImageTooLarge') || 'Image file is too large. Maximum size is 10MB.' 
      };
    }

    // Check image dimensions
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        // Require minimum 100x100 dimensions
        if (img.width < 100 || img.height < 100) {
          resolve({ 
            valid: false, 
            error: t('errorImageDimensionsTooSmall') || 'Image dimensions are too small. Minimum size is 100x100 pixels.' 
          });
        } else {
          resolve({ valid: true });
        }
      };
      img.onerror = () => {
        resolve({ 
          valid: false, 
          error: t('errorImageInvalid') || 'Invalid image file. Please upload a valid PNG or JPG image.' 
        });
      };
      img.src = URL.createObjectURL(file);
    });
  };

  // Handle angle-specific template upload
  const handleAngleFileUpload = (angle: string) => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/image\/(png|jpeg|jpg)/)) {
      toast({
        title: t('errorInvalidFileType'),
        description: t('errorFileTypeMessage'),
        variant: "destructive",
      });
      return;
    }

    // Validate file size and dimensions
    const validation = await validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: t('errorInvalidImage') || 'Invalid Image',
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAngleUploads(prev => ({
        ...prev,
        [angle]: {
          file,
          fileName: file.name,
          previewUrl: event.target?.result as string,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  // Handle angle-specific drag & drop
  const handleAngleDrop = (angle: string) => async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.match(/image\/(png|jpeg|jpg)/)) {
      toast({
        title: t('errorInvalidFileType'),
        description: t('errorFileTypeMessage'),
        variant: "destructive",
      });
      return;
    }

    // Validate file size and dimensions
    const validation = await validateImageFile(file);
    if (!validation.valid) {
      toast({
        title: t('errorInvalidImage') || 'Invalid Image',
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setAngleUploads(prev => ({
        ...prev,
        [angle]: {
          file,
          fileName: file.name,
          previewUrl: event.target?.result as string,
        },
      }));
    };
    reader.readAsDataURL(file);
  };

  // Remove angle-specific template
  const handleRemoveAngleUpload = (angle: string) => () => {
    setAngleUploads(prev => ({
      ...prev,
      [angle]: {
        file: null,
        fileName: null,
        previewUrl: null,
      },
    }));
  };

  const generateDesignMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await fetch("/api/generate-design", {
        method: "POST",
        body: formData,
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || data.message || 'Failed to generate design');
      }
      
      return data;
    },
    onSuccess: (data: any) => {
      // Convert response to dynamic angle mapping using modern keys
      const newImages: Record<string, string> = {};
      const productConfig = getProductConfig(selectedProductType);
      const angles = Array.from(productConfig.angles);
      
      // Map backend response using actual angle keys
      angles.forEach(angle => {
        if (data[angle]) {
          newImages[angle] = data[angle];
        }
      });
      
      // Set active view to first angle that has an image
      // Prioritize angles that actually have images, then fall back to any available image
      const firstAvailableAngle = 
        angles.find(angle => newImages[angle]) || 
        Object.keys(newImages)[0] || 
        angles[0] || 
        "";
      setGeneratedImages(newImages);
      setActiveView(firstAvailableAngle);
      queryClient.invalidateQueries({ queryKey: ["/api/generated-images"] });
      toast({
        description: t('toastDesignSuccess'),
      });
    },
    onError: (error: any) => {
      const errorMessage = error.message || t('toastError');
      toast({
        title: t('toastErrorTitle'),
        description: errorMessage,
        variant: "destructive",
      });
    },
  });

  const generateModelMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await fetch("/api/generate-model", {
        method: "POST",
        body: formData,
      }).then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      });
    },
    onSuccess: (data: any) => {
      setGeneratedModelImage(data.modelImage || null);
      queryClient.invalidateQueries({ queryKey: ["/api/generated-images"] });
      toast({
        description: t('toastModelSuccess'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('toastErrorTitle'),
        description: t('toastError'),
        variant: "destructive",
      });
    },
  });

  const onDesignSubmit = (data: DesignFormValues) => {
    // Check if at least one template is uploaded
    const hasAnyTemplate = Object.values(angleUploads).some(upload => upload.file !== null);
    if (!hasAnyTemplate) {
      toast({
        description: t('errorMissingTemplate'),
        variant: "destructive",
      });
      return;
    }
    
    if (selectedProductType === "custom" && !customProductType.trim()) {
      toast({
        description: t('errorMissingCustomProductType'),
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    
    // Add all angle-specific templates with angle-specific keys
    const productConfig = getProductConfig(selectedProductType);
    const angles = Array.from(productConfig.angles);
    
    angles.forEach(angle => {
      const upload = angleUploads[angle];
      if (upload && upload.file) {
        // Use angle-specific key like "template_top", "template_45degree", etc.
        formData.append(`template_${angle}`, upload.file);
      }
    });
    
    formData.append("productType", selectedProductType);
    if (selectedProductType === "custom" && customProductType.trim()) {
      formData.append("customProductType", customProductType);
    }
    formData.append("theme", data.theme);
    formData.append("style", data.style);
    formData.append("color", data.color === "Custom" ? data.customColor! : data.color);
    formData.append("material", data.material === "Custom" ? data.customMaterial! : data.material);
    
    // Send angles array
    formData.append("angles", JSON.stringify(angles));
    
    // Add new optional fields
    if (referenceImageFile) {
      formData.append("referenceImage", referenceImageFile);
    }
    if (data.designDescription && data.designDescription.trim()) {
      formData.append("designDescription", data.designDescription);
    }
    if (brandLogoFile) {
      formData.append("brandLogo", brandLogoFile);
    }

    generateDesignMutation.mutate(formData);
  };

  const onModelSubmit = async (data: ModelFormValues) => {
    // Get first available generated image
    const productImage = Object.values(generatedImages)[0];
    if (!productImage) {
      toast({
        description: t('errorMissingDesign'),
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch(productImage);
      const blob = await res.blob();
      
      const formData = new FormData();
      formData.append("slipperImage", blob, "product-design.png");
      formData.append("productType", selectedProductType);
      if (selectedProductType === "custom" && customProductType.trim()) {
        formData.append("customProductType", customProductType);
      }
      formData.append("nationality", data.nationality);
      formData.append("familyCombination", data.familyCombination);
      formData.append("scenario", data.scenario);
      formData.append("location", data.location);
      formData.append("presentationStyle", data.presentationStyle === "Custom" ? data.customStyleText || "" : data.presentationStyle);
      formData.append("customStyleText", data.customStyleText || "");

      generateModelMutation.mutate(formData);
    } catch (error) {
      toast({
        title: t('toastErrorTitle'),
        description: t('errorPreparationFailed'),
        variant: "destructive",
      });
    }
  };

  const downloadImage = (imageUrl: string, filename: string) => {
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper function to translate dropdown options
  const getThemeLabel = (value: string) => {
    const key = `theme${value}` as any;
    return t(key) || value;
  };

  const getStyleLabel = (value: string) => {
    const key = `style${value}` as any;
    return t(key) || value;
  };

  const getColorLabel = (value: string) => {
    const key = `color${value.replace(/\s/g, '')}` as any;
    return t(key) || value;
  };

  const getMaterialLabel = (value: string) => {
    const key = `material${value.replace(/\s/g, '')}` as any;
    return t(key) || value;
  };

  const getNationalityLabel = (value: string) => {
    const key = `nationality${value.replace(/\s/g, '')}` as any;
    return t(key) || value;
  };

  const getFamilyLabel = (value: string) => {
    const key = `family${value.replace(/\s/g, '').replace(/[()]/g, '')}` as any;
    return t(key) || value;
  };

  const getScenarioLabel = (value: string) => {
    const key = `scenario${value.replace(/\s/g, '').replace(/-/g, '')}` as any;
    return t(key) || value;
  };

  const getLocationLabel = (value: string) => {
    const key = `location${value.replace(/\s/g, '')}` as any;
    return t(key) || value;
  };

  const getPresentationLabel = (value: string) => {
    const key = `presentation${value.replace(/\s/g, '')}` as any;
    return t(key) || value;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary" data-testid="logo-icon">
              <Sparkles className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-light tracking-wide" data-testid="text-app-title">{t('appTitle')}</h1>
          </div>
          <div className="flex items-center gap-2">
            <LanguageSelector />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-16">
        <div className="mb-16 text-center space-y-4">
          <h2 className="text-4xl font-light tracking-wide text-foreground" data-testid="text-hero-title">
            {t('heroTitle')}
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed" data-testid="text-hero-subtitle">
            {t('heroSubtitle')}
          </p>
        </div>

        <div className="grid gap-12 lg:grid-cols-[2fr,3fr]">
          <div className="space-y-10">
            {/* Product Type Selection */}
            <Card className="p-8 rounded-2xl shadow-sm border-border/50">
              <h3 className="mb-6 text-xl font-light tracking-wide" data-testid="text-section-product-type">{t('sectionProductType')}</h3>
              <Tabs value={selectedProductType} onValueChange={(value) => setSelectedProductType(value as ProductType)} className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-6">
                  <TabsTrigger value="shoes" data-testid="tab-product-shoes">{t('productTypeShoes')}</TabsTrigger>
                  <TabsTrigger value="slippers" data-testid="tab-product-slippers">{t('productTypeSlippers')}</TabsTrigger>
                  <TabsTrigger value="clothes" data-testid="tab-product-clothes">{t('productTypeClothes')}</TabsTrigger>
                  <TabsTrigger value="bags" data-testid="tab-product-bags">{t('productTypeBags')}</TabsTrigger>
                  <TabsTrigger value="custom" data-testid="tab-product-custom">{t('productTypeCustom')}</TabsTrigger>
                </TabsList>
                {selectedProductType === "custom" && (
                  <div className="mt-4">
                    <Label htmlFor="custom-product-type" className="text-sm font-normal">
                      {t('customProductTypeLabel')}
                    </Label>
                    <Input
                      id="custom-product-type"
                      placeholder={t('customProductTypePlaceholder')}
                      value={customProductType}
                      onChange={(e) => setCustomProductType(e.target.value)}
                      disabled={selectedProductType !== "custom"}
                      className="mt-2"
                      data-testid="input-custom-product-type"
                    />
                  </div>
                )}
              </Tabs>
            </Card>

            <Card className="p-8 rounded-2xl shadow-sm border-border/50">
              <h3 className="mb-6 text-xl font-light tracking-wide" data-testid="text-section-upload">{t('sectionUpload')}</h3>
              <p className="mb-6 text-sm text-muted-foreground">{t('uploadHintMultiAngle')}</p>
              
              {/* 2x2 Grid of angle-specific upload cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {getProductConfig(selectedProductType).angles.map((angle) => {
                  const upload = angleUploads[angle];
                  const localeKey = language === 'zh-TW' ? 'zhTW' : language === 'vi' ? 'vi' : 'en';
                  const angleLabel = getProductConfig(selectedProductType).angleLabels[angle]?.[localeKey] || angle;
                  
                  return (
                    <div key={angle} className="space-y-2">
                      <Label className="text-sm font-normal">{angleLabel}</Label>
                      <div
                        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-dashed border-border/60 bg-muted/20 transition-colors hover-elevate"
                        onDrop={handleAngleDrop(angle)}
                        onDragOver={(e) => e.preventDefault()}
                        onClick={() => document.getElementById(`file-upload-${angle}`)?.click()}
                        data-testid={`dropzone-${angle}`}
                      >
                        <input
                          id={`file-upload-${angle}`}
                          type="file"
                          className="hidden"
                          accept="image/png,image/jpeg,image/jpg"
                          onChange={handleAngleFileUpload(angle)}
                          data-testid={`input-file-${angle}`}
                        />
                        {upload?.previewUrl ? (
                          <div className="relative aspect-video">
                            <img
                              src={upload.previewUrl}
                              alt={angleLabel}
                              className="h-full w-full object-contain"
                              data-testid={`img-preview-${angle}`}
                            />
                            <Button
                              size="icon"
                              variant="destructive"
                              className="absolute right-2 top-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveAngleUpload(angle)();
                              }}
                              data-testid={`button-remove-${angle}`}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center py-8">
                            <Upload className="mb-2 h-8 w-8 text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">{t('uploadOptional')}</p>
                          </div>
                        )}
                      </div>
                      {upload?.fileName && (
                        <p className="text-xs text-muted-foreground truncate" data-testid={`text-filename-${angle}`}>
                          {upload.fileName}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-8 rounded-2xl shadow-sm border-border/50">
              <h3 className="mb-6 text-xl font-light tracking-wide" data-testid="text-section-theme">{t('sectionDesignConfig')}</h3>
              <Form {...designForm}>
                <form onSubmit={designForm.handleSubmit(onDesignSubmit)} className="space-y-6">
                  <FormField
                    control={designForm.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-theme">{t('theme')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-theme">
                              <SelectValue placeholder={t('themePlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {THEMES.map((theme) => (
                              <SelectItem key={theme} value={theme} data-testid={`option-theme-${theme.toLowerCase().replace(/\s+/g, '-')}`}>
                                {getThemeLabel(theme)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={designForm.control}
                    name="style"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-style">{t('style')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-style">
                              <SelectValue placeholder={t('stylePlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STYLES.map((style) => (
                              <SelectItem key={style} value={style} data-testid={`option-style-${style.toLowerCase()}`}>
                                {getStyleLabel(style)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={designForm.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-color">{t('colorPalette')}</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            if (value !== "Custom") {
                              designForm.setValue("customColor", "");
                            }
                            field.onChange(value);
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-color">
                              <SelectValue placeholder={t('colorPlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COLOR_PALETTES.map((color) => (
                              <SelectItem key={color} value={color} data-testid={`option-color-${color.toLowerCase().replace(/\s+/g, '-')}`}>
                                {getColorLabel(color)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {designForm.watch("color") === "Custom" && (
                    <FormField
                      control={designForm.control}
                      name="customColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-custom-color">{t('customColor')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('customColorPlaceholder')}
                              {...field}
                              data-testid="input-custom-color"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={designForm.control}
                    name="material"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-material">{t('material')}</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            if (value !== "Custom") {
                              designForm.setValue("customMaterial", "");
                            }
                            field.onChange(value);
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-material">
                              <SelectValue placeholder={t('materialPlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MATERIALS.map((material) => (
                              <SelectItem key={material} value={material} data-testid={`option-material-${material.toLowerCase().replace(/\s+/g, '-')}`}>
                                {getMaterialLabel(material)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {designForm.watch("material") === "Custom" && (
                    <FormField
                      control={designForm.control}
                      name="customMaterial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-custom-material">{t('customMaterial')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('customMaterialPlaceholder')}
                              {...field}
                              data-testid="input-custom-material"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Reference Image Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium" data-testid="label-reference-image">
                      {t('referenceImageLabel')}
                    </label>
                    <div
                      className="group relative cursor-pointer overflow-hidden rounded-xl border border-dashed border-border/60 bg-muted/20 transition-colors hover-elevate"
                      onClick={() => document.getElementById("reference-image-upload")?.click()}
                      data-testid="dropzone-reference"
                    >
                      <input
                        id="reference-image-upload"
                        type="file"
                        className="hidden"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setReferenceImageFile(file);
                            const reader = new FileReader();
                            reader.onloadend = () => setReferenceImagePreview(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        data-testid="input-reference-image"
                      />
                      {referenceImagePreview ? (
                        <div className="relative aspect-video">
                          <img
                            src={referenceImagePreview}
                            alt={t('referenceImage')}
                            className="h-full w-full object-contain"
                            data-testid="img-reference-preview"
                          />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute right-2 top-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReferenceImageFile(null);
                              setReferenceImagePreview(null);
                            }}
                            data-testid="button-remove-reference"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8">
                          <Upload className="mb-2 h-8 w-8 text-muted-foreground" data-testid="icon-upload-reference" />
                          <p className="text-sm font-medium" data-testid="text-upload-reference">{t('uploadReferenceArea')}</p>
                          <p className="text-xs text-muted-foreground mt-1">{t('referenceImageHint')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Design Description */}
                  <FormField
                    control={designForm.control}
                    name="designDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-design-description">{t('designDescriptionLabel')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('designDescriptionPlaceholder')}
                            rows={4}
                            {...field}
                            data-testid="textarea-design-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Brand Logo Upload */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium" data-testid="label-brand-logo">
                      {t('brandLogoLabel')}
                    </label>
                    <div
                      className="group relative cursor-pointer overflow-hidden rounded-xl border border-dashed border-border/60 bg-muted/20 transition-colors hover-elevate"
                      onClick={() => document.getElementById("brand-logo-upload")?.click()}
                      data-testid="dropzone-logo"
                    >
                      <input
                        id="brand-logo-upload"
                        type="file"
                        className="hidden"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setBrandLogoFile(file);
                            const reader = new FileReader();
                            reader.onloadend = () => setBrandLogoPreview(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                        data-testid="input-brand-logo"
                      />
                      {brandLogoPreview ? (
                        <div className="relative aspect-video">
                          <img
                            src={brandLogoPreview}
                            alt={t('brandLogo')}
                            className="h-full w-full object-contain"
                            data-testid="img-logo-preview"
                          />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute right-2 top-2"
                            onClick={(e) => {
                              e.stopPropagation();
                              setBrandLogoFile(null);
                              setBrandLogoPreview(null);
                            }}
                            data-testid="button-remove-logo"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center py-8">
                          <Upload className="mb-2 h-8 w-8 text-muted-foreground" data-testid="icon-upload-logo" />
                          <p className="text-sm font-medium" data-testid="text-upload-logo">{t('uploadLogoArea')}</p>
                          <p className="text-xs text-muted-foreground mt-1">{t('brandLogoHint')}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full rounded-xl mt-6"
                    disabled={generateDesignMutation.isPending}
                    data-testid="button-generate-design"
                  >
                    {generateDesignMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t('generating')}
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        {t('generateDesign')}
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </Card>

            <Card className="p-8 rounded-2xl shadow-sm border-border/50">
              <h3 className="mb-6 text-xl font-light tracking-wide" data-testid="text-section-model">{t('sectionModelConfig')}</h3>
              <Form {...modelForm}>
                <form onSubmit={modelForm.handleSubmit(onModelSubmit)} className="space-y-6">
                  <FormField
                    control={modelForm.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-nationality">{t('nationality')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-nationality">
                              <SelectValue placeholder={t('nationalityPlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {NATIONALITIES.map((nationality) => (
                              <SelectItem key={nationality} value={nationality} data-testid={`option-nationality-${nationality.toLowerCase().replace(/\s+/g, '-')}`}>
                                {getNationalityLabel(nationality)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={modelForm.control}
                    name="familyCombination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-family">{t('familyCombination')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-family">
                              <SelectValue placeholder={t('familyCombinationPlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {FAMILY_COMBINATIONS.map((family) => (
                              <SelectItem key={family} value={family} data-testid={`option-family-${family.toLowerCase().replace(/\s+/g, '-')}`}>
                                {getFamilyLabel(family)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={modelForm.control}
                    name="scenario"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-scenario">{t('scenario')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-scenario">
                              <SelectValue placeholder={t('scenarioPlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SCENARIOS.map((scenario) => (
                              <SelectItem key={scenario} value={scenario} data-testid={`option-scenario-${scenario.toLowerCase().replace(/\s+/g, '-')}`}>
                                {getScenarioLabel(scenario)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={modelForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-location">{t('location')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-location">
                              <SelectValue placeholder={t('locationPlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LOCATIONS.map((location) => (
                              <SelectItem key={location} value={location} data-testid={`option-location-${location.toLowerCase().replace(/\s+/g, '-')}`}>
                                {getLocationLabel(location)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={modelForm.control}
                    name="presentationStyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-presentation">{t('presentationStyle')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-presentation">
                              <SelectValue placeholder={t('presentationStylePlaceholder')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRESENTATION_STYLES.map((presentation) => (
                              <SelectItem key={presentation} value={presentation} data-testid={`option-presentation-${presentation.toLowerCase().replace(/\s+/g, '-')}`}>
                                {getPresentationLabel(presentation)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {modelForm.watch("presentationStyle") === "Custom" && (
                    <FormField
                      control={modelForm.control}
                      name="customStyleText"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-custom-style">{t('customStyleText')}</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder={t('customStyleTextPlaceholder')}
                              rows={3}
                              {...field}
                              data-testid="textarea-custom-style"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full rounded-xl mt-6"
                    disabled={generateModelMutation.isPending}
                    data-testid="button-generate-model"
                  >
                    {generateModelMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        {t('generating')}
                      </>
                    ) : (
                      <>
                        <ImageIcon className="mr-2 h-5 w-5" />
                        {t('generateModelScene')}
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="p-8 rounded-2xl shadow-sm border-border/50">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-semibold" data-testid="text-section-results">{t('sectionGallery')}</h3>
                {Object.keys(generatedImages).length > 0 && (
                  <Tabs value={activeView} onValueChange={(v) => setActiveView(v)}>
                    <TabsList>
                      {(() => {
                        const productConfig = getProductConfig(selectedProductType);
                        const angles = Array.from(productConfig.angles);
                        const localeKey = language === 'zh-TW' ? 'zhTW' : language === 'vi' ? 'vi' : 'en';
                        
                        return angles.map((angle) => (
                          <TabsTrigger 
                            key={angle} 
                            value={angle}
                            data-testid={`tab-${angle}-view`}
                          >
                            {productConfig.angleLabels[angle]?.[localeKey] || angle}
                          </TabsTrigger>
                        ));
                      })()}
                    </TabsList>
                  </Tabs>
                )}
              </div>

              {Object.keys(generatedImages).length === 0 && !generatedModelImage ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/50 py-32" data-testid="empty-state">
                  <ImageIcon className="mb-4 h-20 w-20 text-primary/20" data-testid="icon-empty-state" />
                  <p className="text-xl font-light text-muted-foreground" data-testid="text-empty-title">
                    {t('emptyStateTitle')}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground/70" data-testid="text-empty-subtitle">
                    {t('emptyStateSubtitle')}
                  </p>
                </div>
              ) : (
                <div className="space-y-8">
                  {(() => {
                    const currentImage = generatedImages[activeView];
                    if (!currentImage) return null;
                    
                    const productTypeName = selectedProductType === "custom" && customProductType 
                      ? customProductType 
                      : selectedProductType;
                    
                    const labelMap: Record<string, string> = {
                      'top': t('altTopViewDesign'),
                      '45degree': t('alt45ViewDesign'),
                      'front': 'Front View Design',
                      'back': 'Back View Design',
                      'side': 'Side View Design',
                      'view1': 'View 1 Design',
                      'view2': 'View 2 Design',
                    };
                    const altText = labelMap[activeView] || `${activeView} Design`;
                    
                    return (
                      <div className="group relative overflow-hidden rounded-2xl" data-testid={`card-design-${activeView}`}>
                        <img
                          src={currentImage}
                          alt={altText}
                          className="w-full rounded-2xl shadow-sm cursor-pointer hover-elevate transition-all"
                          onClick={() => {
                            setZoomedImage(currentImage);
                            setZoomedImageAlt(altText);
                          }}
                          data-testid={`img-design-${activeView}`}
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute bottom-4 right-4 rounded-xl opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-sm"
                          onClick={() => downloadImage(currentImage, `${productTypeName}-design-${activeView}.png`)}
                          data-testid={`button-download-${activeView}`}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {t('downloadPNG')}
                        </Button>
                      </div>
                    );
                  })()}

                  {generatedModelImage && (
                    <div className="pt-6 border-t border-border/50">
                      <h4 className="mb-6 text-lg font-light tracking-wide" data-testid="text-model-title">{t('modelWearingSceneTitle')}</h4>
                      <div className="group relative overflow-hidden rounded-2xl" data-testid="card-model-scene">
                        <img
                          src={generatedModelImage}
                          alt={t('altModelWearing')}
                          className="w-full rounded-2xl shadow-sm cursor-pointer hover-elevate transition-all"
                          onClick={() => {
                            setZoomedImage(generatedModelImage);
                            setZoomedImageAlt(t('altModelWearing'));
                          }}
                          data-testid="img-model-scene"
                        />
                        <Button
                          size="sm"
                          variant="secondary"
                          className="absolute bottom-4 right-4 rounded-xl opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-sm"
                          onClick={() => downloadImage(generatedModelImage, "model-wearing-scene.png")}
                          data-testid="button-download-model"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          {t('downloadPNG')}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      <Dialog open={!!zoomedImage} onOpenChange={() => setZoomedImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden rounded-2xl" data-testid="dialog-image-zoom">
          <DialogHeader className="sr-only">
            <DialogTitle>{t('imageZoomTitle')}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-full flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
            {zoomedImage && (
              <img
                src={zoomedImage}
                alt={zoomedImageAlt}
                className="max-w-full max-h-[90vh] object-contain rounded-xl shadow-2xl"
                data-testid="img-zoomed"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
