import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, Upload, Loader2, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ModelTryOn() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [productImages, setProductImages] = useState<Array<{ file: File; preview: string; type: string; typeCustom?: string }>>([]);
  const [generatedResults, setGeneratedResults] = useState<Array<{ cameraAngle: string; imageUrl: string }>>([]);
  const [selectedImage, setSelectedImage] = useState<{ url: string; angle: string } | null>(null);

  const getCameraAngleLabel = (angle: string): string => {
    const angleMap: Record<string, string> = {
      "Front view": t('modelTryonCameraAngleFront'),
      "Side view": t('modelTryonCameraAngleSide'),
      "Back view": t('modelTryonCameraAngleBack'),
    };
    
    // Return mapped translation if it exists, otherwise return the original value
    // (which would be a custom angle description provided by the user)
    return angleMap[angle] || angle;
  };

  // Label functions for dropdown values
  const getProductTypeLabel = (value: string): string => {
    const typeMap: Record<string, string> = {
      "Hat": t('modelTryonProductTypeHat'),
      "Top / Shirt / Jacket": t('modelTryonProductTypeTop'),
      "Bottom / Pants / Skirt": t('modelTryonProductTypeBottom'),
      "Shoes / Slippers": t('modelTryonProductTypeShoes'),
      "Accessories": t('modelTryonProductTypeAccessories'),
      "Custom": t('modelTryonProductTypeCustom'),
    };
    return typeMap[value] || value;
  };

  const getNationalityLabel = (value: string): string => {
    const nationalityMap: Record<string, string> = {
      "East Asian": t('modelTryonNationalityEastAsian'),
      "Southeast Asian": t('modelTryonNationalitySoutheastAsian'),
      "Western / European": t('modelTryonNationalityWestern'),
      "Middle Eastern / Latin": t('modelTryonNationalityMiddleEastern'),
      "Custom": t('modelTryonNationalityCustom'),
    };
    return nationalityMap[value] || value;
  };

  const getHairstyleLabel = (value: string): string => {
    const hairstyleMap: Record<string, string> = {
      "Short straight hair": t('modelTryonHairstyleShortStraight'),
      "Medium wavy hair": t('modelTryonHairstyleMediumWavy'),
      "Long straight hair": t('modelTryonHairstyleLongStraight'),
      "Curly / Afro-textured hair": t('modelTryonHairstyleCurly'),
      "Custom": t('modelTryonHairstyleCustom'),
    };
    return hairstyleMap[value] || value;
  };

  const getCombinationLabel = (value: string): string => {
    const combinationMap: Record<string, string> = {
      "Single male model": t('modelTryonCombinationSingleMale'),
      "Single female model": t('modelTryonCombinationSingleFemale'),
      "One male + one female": t('modelTryonCombinationMaleFemale'),
      "Two male models": t('modelTryonCombinationTwoMale'),
      "Two female models": t('modelTryonCombinationTwoFemale'),
      "Custom": t('modelTryonCombinationCustom'),
    };
    return combinationMap[value] || value;
  };

  const getSceneLabel = (value: string): string => {
    const sceneMap: Record<string, string> = {
      "Studio background (clean, plain)": t('modelTryonSceneStudio'),
      "City street / urban environment": t('modelTryonSceneCityStreet'),
      "Home interior (living room / bedroom)": t('modelTryonSceneHomeInterior'),
      "Park / nature / outdoor": t('modelTryonSceneParkNature'),
      "Retail store / shopping mall": t('modelTryonSceneRetail'),
      "Custom": t('modelTryonSceneCustom'),
    };
    return sceneMap[value] || value;
  };

  const getPoseLabel = (value: string): string => {
    const poseMap: Record<string, string> = {
      "Standing front-facing, relaxed": t('modelTryonPoseStanding'),
      "Walking mid-step (dynamic pose)": t('modelTryonPoseWalking'),
      "Sitting, relaxed pose": t('modelTryonPoseSitting'),
      "Close-up pose focusing on product": t('modelTryonPoseCloseup'),
      "Fashion pose (editorial style)": t('modelTryonPoseFashion'),
      "Custom": t('modelTryonPoseCustom'),
    };
    return poseMap[value] || value;
  };

  const getAspectRatioLabel = (value: string): string => {
    const aspectRatioMap: Record<string, string> = {
      "1:1": t('aspectRatio11'),
      "9:16": t('aspectRatio916'),
      "16:9": t('aspectRatio169'),
      "4:3": t('aspectRatio43'),
      "3:4": t('aspectRatio34'),
      "1080x1080": t('posterDesignPixelSize1080x1080'),
      "1080x1920": t('posterDesignPixelSize1080x1920'),
      "1920x1080": t('posterDesignPixelSize1920x1080'),
      "800x600": t('posterDesignPixelSize800x600'),
      "1200x1600": t('posterDesignPixelSize1200x1600'),
      "custom": t('posterDesignPixelSizeCustom'),
    };
    return aspectRatioMap[value] || value;
  };

  const formSchema = z.object({
    nationality: z.string().min(1, t('modelTryonValidationNationality')),
    nationalityCustom: z.string().optional(),
    hairstyle: z.string().min(1, t('modelTryonValidationHairstyle')),
    hairstyleCustom: z.string().optional(),
    combination: z.string().min(1, t('modelTryonValidationCombination')),
    combinationCustom: z.string().optional(),
    scene: z.string().min(1, t('modelTryonValidationScene')),
    sceneCustom: z.string().optional(),
    pose: z.string().min(1, t('modelTryonValidationPose')),
    poseCustom: z.string().optional(),
    aspectRatio: z.string().min(1, t('modelTryonValidationAspectRatio')),
    customWidth: z.string().optional(),
    customHeight: z.string().optional(),
    cameraAngles: z.array(z.string()).min(1, t('modelTryonValidationCameraAngles')),
    cameraAngleCustom: z.string().optional(),
  }).refine(
    (data) => {
      if (data.aspectRatio === 'custom') {
        const width = parseInt(data.customWidth || '');
        const height = parseInt(data.customHeight || '');
        return !isNaN(width) && !isNaN(height) && width >= 100 && width <= 4096 && height >= 100 && height <= 4096;
      }
      return true;
    },
    {
      message: t('posterDesignCustomDimensionsError') || "Custom dimensions must be between 100 and 4096 pixels",
      path: ['customWidth'],
    }
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nationality: "",
      nationalityCustom: "",
      hairstyle: "",
      hairstyleCustom: "",
      combination: "",
      combinationCustom: "",
      scene: "",
      sceneCustom: "",
      pose: "",
      poseCustom: "",
      aspectRatio: "9:16",
      customWidth: "",
      customHeight: "",
      cameraAngles: [],
      cameraAngleCustom: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      const formData = new FormData();
      
      productImages.forEach((img) => {
        formData.append('productImages', img.file);
      });
      
      formData.append('modelOptions', JSON.stringify(data));
      formData.append('productTypes', JSON.stringify(productImages.map(img => img.type)));
      formData.append('productTypesCustom', JSON.stringify(productImages.map(img => img.typeCustom || '')));

      const response = await fetch('/api/generate-model-tryon', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.message || "Failed to generate model try-on";
        const error: any = new Error(errorMessage);
        error.error = errorData.error;
        error.message = errorMessage;
        throw error;
      }

      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedResults(data.results);
      toast({
        title: t('modelTryonSuccessTitle'),
        description: data.message || t('modelTryonSuccessMessage'),
      });
    },
    onError: (error: any) => {
      const errorMessage = error?.message || error?.error || t('modelTryonErrorGeneration');
      toast({
        variant: "destructive",
        title: t('toastErrorTitle'),
        description: errorMessage,
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      type: "Accessories",
      typeCustom: undefined,
    }));

    setProductImages((prev) => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
  };

  const updateProductType = (index: number, type: string, typeCustom?: string) => {
    setProductImages((prev) => 
      prev.map((img, i) => 
        i === index ? { ...img, type, typeCustom } : img
      )
    );
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (productImages.length === 0) {
      toast({
        variant: "destructive",
        title: t('modelTryonNoProducts'),
        description: t('modelTryonNoProductsDesc'),
      });
      return;
    }

    mutation.mutate(data);
  };

  const downloadImage = (imageUrl: string, angle: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    const localizedAngle = getCameraAngleLabel(angle)
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff\s-]/g, '') // Remove special characters but keep letters/numbers/Chinese
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-+|-+$/g, ''); // Trim hyphens from start/end
    link.download = `model-tryon-${localizedAngle || 'image'}-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8">
              <h2 className="text-2xl font-light tracking-wide mb-6">{t('modelTryonProductUpload')}</h2>
              
              {/* Product Images Upload */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('modelTryonProductImages')}</label>
                  <div className="border-2 border-dashed rounded-xl p-6 text-center hover-elevate active-elevate-2 cursor-pointer"
                    onClick={() => document.getElementById('product-upload')?.click()}>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">{t('modelTryonClickToUpload')}</p>
                    <input
                      id="product-upload"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                      data-testid="input-product-images"
                    />
                  </div>
                </div>

                {/* Uploaded Images */}
                {productImages.length > 0 && (
                  <div className="space-y-4">
                    {productImages.map((img, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex gap-4">
                          <img
                            src={img.preview}
                            alt={`${t('modelTryonProductAlt')} ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="flex-1 space-y-2">
                            <Select
                              value={img.type}
                              onValueChange={(value) => updateProductType(index, value)}
                            >
                              <SelectTrigger data-testid={`select-product-type-${index}`}>
                                {img.type ? getProductTypeLabel(img.type) : t('modelTryonSelectProductType')}
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Hat">{t('modelTryonProductTypeHat')}</SelectItem>
                                <SelectItem value="Top / Shirt / Jacket">{t('modelTryonProductTypeTop')}</SelectItem>
                                <SelectItem value="Bottom / Pants / Skirt">{t('modelTryonProductTypeBottom')}</SelectItem>
                                <SelectItem value="Shoes / Slippers">{t('modelTryonProductTypeShoes')}</SelectItem>
                                <SelectItem value="Accessories">{t('modelTryonProductTypeAccessories')}</SelectItem>
                                <SelectItem value="Custom">{t('modelTryonProductTypeCustom')}</SelectItem>
                              </SelectContent>
                            </Select>
                            {img.type === "Custom" && (
                              <Input
                                placeholder={t('modelTryonEnterCustomType')}
                                value={img.typeCustom || ""}
                                onChange={(e) => updateProductType(index, "Custom", e.target.value)}
                                data-testid={`input-custom-type-${index}`}
                              />
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeImage(index)}
                            data-testid={`button-remove-product-${index}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-8">
              <h2 className="text-2xl font-light tracking-wide mb-6">{t('modelTryonModelSceneOptions')}</h2>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Nationality */}
                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('modelTryonNationality')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-nationality">
                              {field.value ? getNationalityLabel(field.value) : t('modelTryonSelectNationality')}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="East Asian">{t('modelTryonNationalityEastAsian')}</SelectItem>
                            <SelectItem value="Southeast Asian">{t('modelTryonNationalitySoutheastAsian')}</SelectItem>
                            <SelectItem value="Western / European">{t('modelTryonNationalityWestern')}</SelectItem>
                            <SelectItem value="Middle Eastern / Latin">{t('modelTryonNationalityMiddleEastern')}</SelectItem>
                            <SelectItem value="Custom">{t('modelTryonNationalityCustom')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("nationality") === "Custom" && (
                    <FormField
                      control={form.control}
                      name="nationalityCustom"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder={t('modelTryonEnterCustomNationality')} {...field} data-testid="input-nationality-custom" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Hairstyle */}
                  <FormField
                    control={form.control}
                    name="hairstyle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('modelTryonHairstyle')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-hairstyle">
                              {field.value ? getHairstyleLabel(field.value) : t('modelTryonSelectHairstyle')}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Short straight hair">{t('modelTryonHairstyleShortStraight')}</SelectItem>
                            <SelectItem value="Medium wavy hair">{t('modelTryonHairstyleMediumWavy')}</SelectItem>
                            <SelectItem value="Long straight hair">{t('modelTryonHairstyleLongStraight')}</SelectItem>
                            <SelectItem value="Curly / Afro-textured hair">{t('modelTryonHairstyleCurly')}</SelectItem>
                            <SelectItem value="Custom">{t('modelTryonHairstyleCustom')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("hairstyle") === "Custom" && (
                    <FormField
                      control={form.control}
                      name="hairstyleCustom"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder={t('modelTryonEnterCustomHairstyle')} {...field} data-testid="input-hairstyle-custom" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Model Combination */}
                  <FormField
                    control={form.control}
                    name="combination"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('modelTryonCombination')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-combination">
                              {field.value ? getCombinationLabel(field.value) : t('modelTryonSelectCombination')}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Single male model">{t('modelTryonCombinationSingleMale')}</SelectItem>
                            <SelectItem value="Single female model">{t('modelTryonCombinationSingleFemale')}</SelectItem>
                            <SelectItem value="One male + one female">{t('modelTryonCombinationMaleFemale')}</SelectItem>
                            <SelectItem value="Two male models">{t('modelTryonCombinationTwoMale')}</SelectItem>
                            <SelectItem value="Two female models">{t('modelTryonCombinationTwoFemale')}</SelectItem>
                            <SelectItem value="Custom">{t('modelTryonCombinationCustom')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("combination") === "Custom" && (
                    <FormField
                      control={form.control}
                      name="combinationCustom"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder={t('modelTryonEnterCustomCombination')} {...field} data-testid="input-combination-custom" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Scene */}
                  <FormField
                    control={form.control}
                    name="scene"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('modelTryonScene')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-scene">
                              {field.value ? getSceneLabel(field.value) : t('modelTryonSelectScene')}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Studio background (clean, plain)">{t('modelTryonSceneStudio')}</SelectItem>
                            <SelectItem value="City street / urban environment">{t('modelTryonSceneCityStreet')}</SelectItem>
                            <SelectItem value="Home interior (living room / bedroom)">{t('modelTryonSceneHomeInterior')}</SelectItem>
                            <SelectItem value="Park / nature / outdoor">{t('modelTryonSceneParkNature')}</SelectItem>
                            <SelectItem value="Retail store / shopping mall">{t('modelTryonSceneRetail')}</SelectItem>
                            <SelectItem value="Custom">{t('modelTryonSceneCustom')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("scene") === "Custom" && (
                    <FormField
                      control={form.control}
                      name="sceneCustom"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder={t('modelTryonEnterCustomScene')} {...field} data-testid="input-scene-custom" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Pose */}
                  <FormField
                    control={form.control}
                    name="pose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('modelTryonPose')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-pose">
                              {field.value ? getPoseLabel(field.value) : t('modelTryonSelectPose')}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Standing front-facing, relaxed">{t('modelTryonPoseStanding')}</SelectItem>
                            <SelectItem value="Walking mid-step (dynamic pose)">{t('modelTryonPoseWalking')}</SelectItem>
                            <SelectItem value="Sitting, relaxed pose">{t('modelTryonPoseSitting')}</SelectItem>
                            <SelectItem value="Close-up pose focusing on product">{t('modelTryonPoseCloseup')}</SelectItem>
                            <SelectItem value="Fashion pose (editorial style)">{t('modelTryonPoseFashion')}</SelectItem>
                            <SelectItem value="Custom">{t('modelTryonPoseCustom')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("pose") === "Custom" && (
                    <FormField
                      control={form.control}
                      name="poseCustom"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder={t('modelTryonEnterCustomPose')} {...field} data-testid="input-pose-custom" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Aspect Ratio */}
                  <FormField
                    control={form.control}
                    name="aspectRatio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('modelTryonAspectRatio')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-aspect-ratio">
                              {field.value ? getAspectRatioLabel(field.value) : t('aspectRatioLabel')}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1:1">{t('aspectRatio11')}</SelectItem>
                            <SelectItem value="9:16">{t('aspectRatio916')}</SelectItem>
                            <SelectItem value="16:9">{t('aspectRatio169')}</SelectItem>
                            <SelectItem value="4:3">{t('aspectRatio43')}</SelectItem>
                            <SelectItem value="3:4">{t('aspectRatio34')}</SelectItem>
                            <SelectItem value="1080x1080">{t('posterDesignPixelSize1080x1080')}</SelectItem>
                            <SelectItem value="1080x1920">{t('posterDesignPixelSize1080x1920')}</SelectItem>
                            <SelectItem value="1920x1080">{t('posterDesignPixelSize1920x1080')}</SelectItem>
                            <SelectItem value="800x600">{t('posterDesignPixelSize800x600')}</SelectItem>
                            <SelectItem value="1200x1600">{t('posterDesignPixelSize1200x1600')}</SelectItem>
                            <SelectItem value="custom">{t('posterDesignPixelSizeCustom')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Custom Dimensions - Show only when custom aspect ratio is selected */}
                  {form.watch('aspectRatio') === 'custom' && (
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="customWidth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('posterDesignCustomWidth')}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder={t('posterDesignCustomWidthPlaceholder')}
                                {...field}
                                data-testid="input-custom-width"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="customHeight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('posterDesignCustomHeight')}</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder={t('posterDesignCustomHeightPlaceholder')}
                                {...field}
                                data-testid="input-custom-height"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {/* Camera Angles */}
                  <FormField
                    control={form.control}
                    name="cameraAngles"
                    render={() => (
                      <FormItem>
                        <FormLabel>{t('modelTryonCameraAngles')}</FormLabel>
                        <div className="space-y-2">
                          {[
                            { value: "Front view", label: t('modelTryonCameraAngleFront') },
                            { value: "Side view", label: t('modelTryonCameraAngleSide') },
                            { value: "Back view", label: t('modelTryonCameraAngleBack') },
                            { value: "Custom", label: t('modelTryonCameraAngleCustom') }
                          ].map(({ value, label }) => (
                            <FormField
                              key={value}
                              control={form.control}
                              name="cameraAngles"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(value)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, value])
                                          : field.onChange(field.value?.filter((val) => val !== value));
                                      }}
                                      data-testid={`checkbox-angle-${value.toLowerCase().replace(/ /g, '-')}`}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">{label}</FormLabel>
                                </FormItem>
                              )}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch("cameraAngles")?.includes("Custom") && (
                    <FormField
                      control={form.control}
                      name="cameraAngleCustom"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input placeholder={t('modelTryonEnterCustomAngle')} {...field} data-testid="input-angle-custom" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={mutation.isPending || productImages.length === 0}
                    data-testid="button-generate"
                  >
                    {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {mutation.isPending ? t('modelTryonGenerating') : t('modelTryonGenerate')}
                  </Button>
                </form>
              </Form>
            </Card>
          </div>

          {/* Results Gallery */}
          <div className="lg:col-span-3">
            <Card className="p-8">
              <h2 className="text-2xl font-light tracking-wide mb-6">{t('modelTryonResult')}</h2>
              
              {generatedResults.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <p>{t('modelTryonEmptyState')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {generatedResults.map((result, index) => (
                    <Card key={index} className="p-4">
                      <img
                        src={result.imageUrl}
                        alt={`${t('modelTryonResultAlt')} - ${result.cameraAngle}`}
                        className="w-full h-auto rounded-lg mb-4 cursor-pointer hover-elevate"
                        onClick={() => setSelectedImage({ url: result.imageUrl, angle: result.cameraAngle })}
                        data-testid={`img-result-${index}`}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{getCameraAngleLabel(result.cameraAngle)}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadImage(result.imageUrl, result.cameraAngle)}
                          data-testid={`button-download-${index}`}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          {t('downloadPNG')}
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Image Zoom Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
        <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 overflow-hidden rounded-2xl" data-testid="dialog-image-zoom">
          <DialogHeader className="sr-only">
            <DialogTitle>{selectedImage ? getCameraAngleLabel(selectedImage.angle) : t('modelTryonResult')}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full h-full flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
            {selectedImage && (
              <img
                src={selectedImage.url}
                alt={`${t('modelTryonResultAlt')} - ${selectedImage.angle}`}
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
