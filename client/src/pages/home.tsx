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
    customTheme: z.string().optional(),
    customStyle: z.string().optional(),
    customColor: z.string().optional(),
    customMaterial: z.string().optional(),
    designDescription: z.string().optional(),
  }).refine(
    (data) => {
      if (data.theme === "Custom") {
        return data.customTheme && data.customTheme.trim().length > 0;
      }
      return true;
    },
    {
      message: t('errorCustomThemeRequired') || "Custom theme is required",
      path: ["customTheme"],
    }
  ).refine(
    (data) => {
      if (data.style === "Custom") {
        return data.customStyle && data.customStyle.trim().length > 0;
      }
      return true;
    },
    {
      message: t('errorCustomStyleRequired') || "Custom style is required",
      path: ["customStyle"],
    }
  ).refine(
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
    modelCombination: z.string().min(1, "Model combination is required"),
    scenario: z.string().min(1, "Scenario is required"),
    location: z.string().min(1, "Location is required"),
    presentationStyle: z.string().min(1, "Presentation style is required"),
    customStyleText: z.string().optional(),
    customCombination: z.string().optional(),
    customNationality: z.string().optional(),
    customScenario: z.string().optional(),
    customLocation: z.string().optional(),
    description: z.string().optional(),
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
  ).refine(
    (data) => {
      if (data.modelCombination === "Custom") {
        return data.customCombination && data.customCombination.trim().length > 0;
      }
      return true;
    },
    {
      message: t('errorCustomCombinationRequired'),
      path: ["customCombination"],
    }
  ).refine(
    (data) => {
      if (data.nationality === "Custom") {
        return data.customNationality && data.customNationality.trim().length > 0;
      }
      return true;
    },
    {
      message: t('errorCustomNationalityRequired'),
      path: ["customNationality"],
    }
  ).refine(
    (data) => {
      if (data.scenario === "Custom") {
        return data.customScenario && data.customScenario.trim().length > 0;
      }
      return true;
    },
    {
      message: t('errorCustomScenarioRequired'),
      path: ["customScenario"],
    }
  ).refine(
    (data) => {
      if (data.location === "Custom") {
        return data.customLocation && data.customLocation.trim().length > 0;
      }
      return true;
    },
    {
      message: t('errorCustomLocationRequired'),
      path: ["customLocation"],
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
  
  // Prompt optimization state for Product Design
  const [optimizedPrompt, setOptimizedPrompt] = useState<string>("");
  const [showOptimizedPrompt, setShowOptimizedPrompt] = useState<boolean>(false);
  
  // Prompt optimization state for Model Try-on
  const [modelOptimizedPrompt, setModelOptimizedPrompt] = useState<string>("");
  const [showModelOptimizedPrompt, setShowModelOptimizedPrompt] = useState<boolean>(false);
  
  // Prompt optimization state for Virtual Try-on
  const [virtualTryonOptimizedPrompt, setVirtualTryonOptimizedPrompt] = useState<string>("");
  const [showVirtualTryonOptimizedPrompt, setShowVirtualTryonOptimizedPrompt] = useState<boolean>(false);
  
  // Prompt optimization state for E-commerce Scene
  const [sceneOptimizedPrompt, setSceneOptimizedPrompt] = useState<string>("");
  const [showSceneOptimizedPrompt, setShowSceneOptimizedPrompt] = useState<boolean>(false);
  
  // Prompt optimization state for E-commerce Poster
  const [posterOptimizedPrompt, setPosterOptimizedPrompt] = useState<string>("");
  const [showPosterOptimizedPrompt, setShowPosterOptimizedPrompt] = useState<boolean>(false);

  const designFormSchema = useMemo(() => createDesignFormSchema(t), [t]);
  const modelFormSchema = useMemo(() => createModelFormSchema(t), [t]);

  const designForm = useForm<DesignFormValues>({
    resolver: zodResolver(designFormSchema),
    defaultValues: {
      productType: "slippers",
      customProductType: "",
      theme: "",
      style: "",
      color: "",
      material: "",
      customTheme: "",
      customStyle: "",
      customColor: "",
      customMaterial: "",
      designDescription: "",
    },
  });

  const modelForm = useForm<ModelFormValues>({
    resolver: zodResolver(modelFormSchema),
    defaultValues: {
      nationality: "",
      modelCombination: "",
      scenario: "",
      location: "",
      presentationStyle: "",
      customStyleText: "",
      customCombination: "",
      customNationality: "",
      customScenario: "",
      customLocation: "",
      description: "",
    },
  });

  // Clear generated images, angle uploads, and optimized prompt when product type changes
  useEffect(() => {
    setGeneratedImages({});
    setActiveView("");
    setAngleUploads(initializeAngleUploads(selectedProductType));
    setOptimizedPrompt("");
    setShowOptimizedPrompt(false);
  }, [selectedProductType]);

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

  const optimizePromptMutation = useMutation({
    mutationFn: async (formData: DesignFormValues) => {
      const res = await apiRequest("POST", "/api/optimize-design-prompt", {
        productType: selectedProductType,
        customProductType: selectedProductType === 'custom' ? customProductType : undefined,
        theme: formData.theme,
        style: formData.style,
        color: formData.color,
        material: formData.material,
        customTheme: formData.customTheme || "",
        customStyle: formData.customStyle || "",
        customColor: formData.customColor || "",
        customMaterial: formData.customMaterial || "",
        designDescription: formData.designDescription,
      });
      
      return res.json();
    },
    onSuccess: (data: any) => {
      setOptimizedPrompt(data.optimizedPrompt);
      setShowOptimizedPrompt(true);
      toast({
        title: t('promptOptimizedTitle') || "Prompt Optimized",
        description: t('promptOptimizedDesc') || "Review and confirm the optimized prompt below",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t('errorTitle') || "Error",
        description: error.message || t('errorOptimizePrompt') || "Failed to optimize prompt",
      });
    },
  });

  const modelOptimizePromptMutation = useMutation({
    mutationFn: async (formData: ModelFormValues) => {
      const res = await apiRequest("POST", "/api/optimize-model-prompt", {
        productType: selectedProductType,
        customProductType: selectedProductType === 'custom' ? customProductType : undefined,
        nationality: formData.nationality === "Custom" ? formData.customNationality : formData.nationality,
        modelCombination: formData.modelCombination === "Custom" ? formData.customCombination : formData.modelCombination,
        scenario: formData.scenario === "Custom" ? formData.customScenario : formData.scenario,
        location: formData.location === "Custom" ? formData.customLocation : formData.location,
        presentationStyle: formData.presentationStyle === "Custom" ? formData.customStyleText : formData.presentationStyle,
        description: formData.description,
      });
      
      return res.json();
    },
    onSuccess: (data: any) => {
      setModelOptimizedPrompt(data.optimizedPrompt);
      setShowModelOptimizedPrompt(true);
      toast({
        title: t('promptOptimizedTitle') || "Prompt Optimized",
        description: t('promptOptimizedDesc') || "Review and confirm the optimized prompt below",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: t('errorTitle') || "Error",
        description: error.message || t('errorOptimizePrompt') || "Failed to optimize prompt",
      });
    },
  });

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
      // Clear optimized prompt after successful generation
      setOptimizedPrompt("");
      setShowOptimizedPrompt(false);
      
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
      // Clear optimized prompt on generation error to avoid stale prompts
      setOptimizedPrompt("");
      setShowOptimizedPrompt(false);
      
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
      // Clear model optimized prompt after successful generation
      setModelOptimizedPrompt("");
      setShowModelOptimizedPrompt(false);
      
      setGeneratedModelImage(data.modelImage || null);
      queryClient.invalidateQueries({ queryKey: ["/api/generated-images"] });
      toast({
        description: t('toastModelSuccess'),
      });
    },
    onError: (error: any) => {
      // Clear model optimized prompt on generation error to avoid stale prompts
      setModelOptimizedPrompt("");
      setShowModelOptimizedPrompt(false);
      
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
    formData.append("customTheme", data.customTheme || "");
    formData.append("customStyle", data.customStyle || "");
    formData.append("color", data.color === "Custom" ? data.customColor! : data.color);
    formData.append("material", data.material === "Custom" ? data.customMaterial! : data.material);
    formData.append("customColor", data.customColor || "");
    formData.append("customMaterial", data.customMaterial || "");
    
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
    // Add custom optimized prompt if user has optimized and edited it
    if (optimizedPrompt && optimizedPrompt.trim() && showOptimizedPrompt) {
      formData.append("customOptimizedPrompt", optimizedPrompt);
      console.log('[Frontend] Using user-edited optimized prompt for generation');
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
      formData.append("nationality", data.nationality === "Custom" ? data.customNationality || "" : data.nationality);
      formData.append("modelCombination", data.modelCombination === "Custom" ? data.customCombination || "" : data.modelCombination);
      formData.append("scenario", data.scenario === "Custom" ? data.customScenario || "" : data.scenario);
      formData.append("location", data.location === "Custom" ? data.customLocation || "" : data.location);
      formData.append("presentationStyle", data.presentationStyle === "Custom" ? data.customStyleText || "" : data.presentationStyle);
      formData.append("customStyleText", data.customStyleText || "");
      
      // Add description if provided
      if (data.description && data.description.trim()) {
        formData.append("description", data.description);
      }
      
      // Add custom optimized prompt if user has optimized and edited it
      if (modelOptimizedPrompt && modelOptimizedPrompt.trim() && showModelOptimizedPrompt) {
        formData.append("customOptimizedPrompt", modelOptimizedPrompt);
        console.log('[Frontend] Using user-edited optimized prompt for model generation');
      }

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

  const getModelCombinationLabel = (value: string): string => {
    const combinationMap: Record<string, string> = {
      "Single Male Model": t('modelTryonCombinationSingleMale'),
      "Single Female Model": t('modelTryonCombinationSingleFemale'),
      "Male & Female Duo": t('modelTryonCombinationMaleFemale'),
      "Three Models": t('modelTryonCombinationThree'),
      "Model Group": t('modelTryonCombinationGroup'),
      "Child Model": t('modelTryonCombinationChild'),
      "Custom": t('modelTryonCombinationCustom'),
    };
    return combinationMap[value] || value;
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
                        <Select 
                          onValueChange={(value) => {
                            if (value !== "Custom") {
                              designForm.setValue("customTheme", "");
                            }
                            field.onChange(value);
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-theme">
                              {field.value ? getThemeLabel(field.value) : t('themePlaceholder')}
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

                  {designForm.watch("theme") === "Custom" && (
                    <FormField
                      control={designForm.control}
                      name="customTheme"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-custom-theme">{t('customTheme')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('customThemePlaceholder')}
                              {...field}
                              data-testid="input-custom-theme"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={designForm.control}
                    name="style"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-style">{t('style')}</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            if (value !== "Custom") {
                              designForm.setValue("customStyle", "");
                            }
                            field.onChange(value);
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-style">
                              {field.value ? getStyleLabel(field.value) : t('stylePlaceholder')}
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

                  {designForm.watch("style") === "Custom" && (
                    <FormField
                      control={designForm.control}
                      name="customStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-custom-style">{t('customStyle')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('customStylePlaceholder')}
                              {...field}
                              data-testid="input-custom-style"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

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
                              {field.value ? getColorLabel(field.value) : t('colorPlaceholder')}
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
                              {field.value ? getMaterialLabel(field.value) : t('materialPlaceholder')}
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

                  {/* Optimize Prompt Feature */}
                  <div className="space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        // Trigger validation on all fields
                        const isValid = await designForm.trigger(['theme', 'style', 'color', 'material']);
                        if (!isValid) {
                          toast({
                            variant: "destructive",
                            title: t('errorTitle') || "Error",
                            description: t('errorFillRequiredFields') || "Please fill in all required fields first",
                          });
                          return;
                        }
                        const formValues = designForm.getValues();
                        optimizePromptMutation.mutate(formValues);
                      }}
                      disabled={optimizePromptMutation.isPending}
                      className="w-full"
                      data-testid="button-optimize-prompt"
                    >
                      {optimizePromptMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('optimizingPrompt') || "Optimizing..."}
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          {t('optimizePromptButton') || "Optimize Design Prompt with AI"}
                        </>
                      )}
                    </Button>

                    {showOptimizedPrompt && optimizedPrompt && (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-primary">
                              {t('optimizedPromptTitle') || "AI-Optimized Prompt"}
                            </span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowOptimizedPrompt(false)}
                            data-testid="button-close-optimized"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          value={optimizedPrompt}
                          onChange={(e) => setOptimizedPrompt(e.target.value)}
                          rows={6}
                          className="text-sm"
                          data-testid="textarea-optimized-prompt"
                        />
                        <p className="text-xs text-muted-foreground">
                          {t('optimizedPromptHint') || "Review and edit the optimized prompt above. This will be used for AI generation."}
                        </p>
                      </div>
                    )}
                  </div>

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
                              {field.value ? getNationalityLabel(field.value) : t('nationalityPlaceholder')}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {NATIONALITIES.map((nationality) => (
                              <SelectItem key={nationality} value={nationality} data-testid={`option-nationality-${nationality.toLowerCase().replace(/\s+/g, '-')}`}>
                                {getNationalityLabel(nationality)}
                              </SelectItem>
                            ))}
                            <SelectItem value="Custom">{t('nationalityCustom')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {modelForm.watch("nationality") === "Custom" && (
                    <FormField
                      control={modelForm.control}
                      name="customNationality"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder={t('enterCustomNationality')} {...field} data-testid="input-custom-nationality" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={modelForm.control}
                    name="modelCombination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-model-combination">{t('modelTryonCombination')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-model-combination">
                              {field.value ? getModelCombinationLabel(field.value) : t('modelTryonSelectCombination')}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Single Male Model">{t('modelTryonCombinationSingleMale')}</SelectItem>
                            <SelectItem value="Single Female Model">{t('modelTryonCombinationSingleFemale')}</SelectItem>
                            <SelectItem value="Male & Female Duo">{t('modelTryonCombinationMaleFemale')}</SelectItem>
                            <SelectItem value="Three Models">{t('modelTryonCombinationThree')}</SelectItem>
                            <SelectItem value="Model Group">{t('modelTryonCombinationGroup')}</SelectItem>
                            <SelectItem value="Child Model">{t('modelTryonCombinationChild')}</SelectItem>
                            <SelectItem value="Custom">{t('modelTryonCombinationCustom')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {modelForm.watch("modelCombination") === "Custom" && (
                    <FormField
                      control={modelForm.control}
                      name="customCombination"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder={t('modelTryonEnterCustomCombination')} {...field} data-testid="input-custom-combination" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={modelForm.control}
                    name="scenario"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-scenario">{t('scenario')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-scenario">
                              {field.value ? getScenarioLabel(field.value) : t('scenarioPlaceholder')}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SCENARIOS.map((scenario) => (
                              <SelectItem key={scenario} value={scenario} data-testid={`option-scenario-${scenario.toLowerCase().replace(/\s+/g, '-')}`}>
                                {getScenarioLabel(scenario)}
                              </SelectItem>
                            ))}
                            <SelectItem value="Custom">{t('scenarioCustom')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {modelForm.watch("scenario") === "Custom" && (
                    <FormField
                      control={modelForm.control}
                      name="customScenario"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder={t('enterCustomScenario')} {...field} data-testid="input-custom-scenario" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={modelForm.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-location">{t('location')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-location">
                              {field.value ? getLocationLabel(field.value) : t('locationPlaceholder')}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LOCATIONS.map((location) => (
                              <SelectItem key={location} value={location} data-testid={`option-location-${location.toLowerCase().replace(/\s+/g, '-')}`}>
                                {getLocationLabel(location)}
                              </SelectItem>
                            ))}
                            <SelectItem value="Custom">{t('locationCustom')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {modelForm.watch("location") === "Custom" && (
                    <FormField
                      control={modelForm.control}
                      name="customLocation"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder={t('enterCustomLocation')} {...field} data-testid="input-custom-location" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <FormField
                    control={modelForm.control}
                    name="presentationStyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-presentation">{t('presentationStyle')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-presentation">
                              {field.value ? getPresentationLabel(field.value) : t('presentationStylePlaceholder')}
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

                  {/* Model Try-on Description */}
                  <FormField
                    control={modelForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-model-description">{t('designDescriptionLabel')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('designDescriptionPlaceholder')}
                            rows={4}
                            {...field}
                            data-testid="textarea-model-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Model Try-on Optimize Prompt Feature */}
                  <div className="space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        const isValid = await modelForm.trigger(['nationality', 'modelCombination', 'scenario', 'location', 'presentationStyle']);
                        if (!isValid) {
                          toast({
                            variant: "destructive",
                            title: t('errorTitle') || "Error",
                            description: t('errorFillRequiredFields') || "Please fill in all required fields first",
                          });
                          return;
                        }
                        const formValues = modelForm.getValues();
                        modelOptimizePromptMutation.mutate(formValues);
                      }}
                      disabled={modelOptimizePromptMutation.isPending}
                      className="w-full"
                      data-testid="button-optimize-model-prompt"
                    >
                      {modelOptimizePromptMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t('optimizingPrompt') || "Optimizing..."}
                        </>
                      ) : (
                        <>
                          <Sparkles className="mr-2 h-4 w-4" />
                          {t('optimizePromptButton') || "Optimize Design Prompt with AI"}
                        </>
                      )}
                    </Button>

                    {showModelOptimizedPrompt && modelOptimizedPrompt && (
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium text-primary">
                              {t('optimizedPromptTitle') || "AI-Optimized Prompt"}
                            </span>
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowModelOptimizedPrompt(false)}
                            data-testid="button-close-model-optimized"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          value={modelOptimizedPrompt}
                          onChange={(e) => setModelOptimizedPrompt(e.target.value)}
                          rows={6}
                          className="text-sm"
                          data-testid="textarea-model-optimized-prompt"
                        />
                        <p className="text-xs text-muted-foreground">
                          {t('optimizedPromptHint') || "You can edit this prompt before generating"}
                        </p>
                      </div>
                    )}
                  </div>

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
