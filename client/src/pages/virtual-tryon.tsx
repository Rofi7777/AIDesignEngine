import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
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
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Download, Upload, Loader2, X, Image as ImageIcon, Sparkles } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function VirtualTryOn() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [modelImage, setModelImage] = useState<{ file: File; preview: string } | null>(null);
  const [productImages, setProductImages] = useState<Array<{ 
    file: File; 
    preview: string; 
    type: string;
    name?: string;
  }>>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  // Optimize prompt state
  const [optimizedPrompt, setOptimizedPrompt] = useState<string>("");
  const [showOptimizedPrompt, setShowOptimizedPrompt] = useState<boolean>(false);

  // Label functions for dropdown values
  const getProductTypeLabel = (value: string): string => {
    const typeMap: Record<string, string> = {
      "accessory": t('virtualTryonProductTypeAccessory'),
      "top": t('virtualTryonProductTypeTop'),
      "bottom": t('virtualTryonProductTypeBottom'),
      "dress": t('virtualTryonProductTypeDress'),
      "outerwear": t('virtualTryonProductTypeOuterwear'),
      "shoes": t('virtualTryonProductTypeShoes'),
      "clothing": t('virtualTryonProductTypeAccessory'), // default value
    };
    return typeMap[value] || value;
  };

  const getTryonTypeLabel = (value: string): string => {
    const typeMap: Record<string, string> = {
      "accessory": t('virtualTryonTypeAccessory'),
      "top": t('virtualTryonTypeTop'),
      "bottom": t('virtualTryonTypeBottom'),
      "full": t('virtualTryonTypeFull'),
      "custom": t('virtualTryonTypeCustom'),
    };
    return typeMap[value] || value;
  };

  const getPreservePoseLabel = (value: string): string => {
    const poseMap: Record<string, string> = {
      "yes": t('virtualTryonPreservePoseYes'),
      "no": t('virtualTryonPreservePoseNo'),
    };
    return poseMap[value] || value;
  };

  const getStyleLabel = (value: string): string => {
    const styleMap: Record<string, string> = {
      "natural": t('virtualTryonStyleNatural'),
      "fashion": t('virtualTryonStyleFashion'),
      "custom": t('virtualTryonStyleCustom'),
    };
    return styleMap[value] || value;
  };

  const getAspectRatioLabel = (value: string): string => {
    const aspectRatioMap: Record<string, string> = {
      "1:1": t('aspectRatio11'),
      "3:4": t('aspectRatio34'),
      "4:3": t('aspectRatio43'),
      "9:16": t('aspectRatio916'),
      "16:9": t('aspectRatio169'),
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
    tryonMode: z.enum(['single', 'multi']),
    tryonType: z.string().optional(),
    customTryonType: z.string().optional(),
    preservePose: z.string(),
    style: z.string(),
    customStyle: z.string().optional(),
    aspectRatio: z.string().min(1, "Aspect ratio is required"),
    customWidth: z.string().optional(),
    customHeight: z.string().optional(),
    description: z.string().optional(),
  }).refine(
    (data) => {
      if (data.style === 'custom' && !data.customStyle?.trim()) {
        return false;
      }
      return true;
    },
    {
      message: t('errorCustomStyleRequired') || "Custom style description is required",
      path: ['customStyle'],
    }
  ).refine(
    (data) => {
      if (data.aspectRatio === 'custom') {
        const width = parseInt(data.customWidth || '');
        const height = parseInt(data.customHeight || '');
        return !isNaN(width) && !isNaN(height) && width >= 100 && width <= 4096 && height >= 100 && height <= 4096;
      }
      return true;
    },
    {
      message: "Custom dimensions must be between 100 and 4096 pixels",
      path: ['customWidth'],
    }
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tryonMode: 'single',
      tryonType: '',
      customTryonType: '',
      preservePose: 'yes',
      style: 'natural',
      customStyle: '',
      aspectRatio: '9:16',
      customWidth: '',
      customHeight: '',
      description: '',
    },
  });

  const tryonMode = form.watch('tryonMode');

  // Optimize prompt mutation
  const optimizePromptMutation = useMutation({
    mutationFn: async (formValues: z.infer<typeof formSchema>) => {
      const response = await fetch('/api/optimize-virtual-tryon-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tryonType: formValues.tryonType || 'top',
          customTryonType: formValues.customTryonType,
          tryonMode: formValues.tryonMode,
          description: formValues.description,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to optimize prompt');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setOptimizedPrompt(data.optimizedPrompt);
      setShowOptimizedPrompt(true);
      toast({
        description: t('optimizedPromptSuccess') || "Prompt optimized successfully! You can review and edit it below.",
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: t('errorTitle') || "Error",
        description: t('optimizedPromptError') || "Failed to optimize prompt. Please try again.",
      });
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (!modelImage) {
        throw new Error("Model image is required");
      }

      const formData = new FormData();
      formData.append('modelImage', modelImage.file);
      
      productImages.forEach((img) => {
        formData.append('productImages', img.file);
      });
      
      formData.append('tryonMode', data.tryonMode);
      if (data.tryonType) {
        formData.append('tryonType', data.tryonType);
      }
      if (data.customTryonType) {
        formData.append('customTryonType', data.customTryonType);
      }
      formData.append('preservePose', data.preservePose);
      formData.append('style', data.style);
      formData.append('customStyle', data.customStyle || '');
      formData.append('aspectRatio', data.aspectRatio);
      formData.append('productTypes', JSON.stringify(productImages.map(img => img.type)));
      formData.append('productNames', JSON.stringify(productImages.map(img => img.name || '')));
      
      // Add description if provided
      if (data.description && data.description.trim()) {
        formData.append('description', data.description);
      }
      
      // Add custom optimized prompt if user has optimized and edited it
      if (optimizedPrompt && optimizedPrompt.trim() && showOptimizedPrompt) {
        formData.append('customOptimizedPrompt', optimizedPrompt);
        console.log('[Frontend] Using user-edited optimized prompt for virtual try-on generation');
      }

      const response = await fetch('/api/generate-virtual-tryon', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.message || "Failed to generate virtual try-on";
        const error: any = new Error(errorMessage);
        error.error = errorData.error;
        error.message = errorMessage;
        throw error;
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Clear optimized prompt after successful generation
      setOptimizedPrompt("");
      setShowOptimizedPrompt(false);
      
      setGeneratedImage(data.imageUrl);
      toast({
        title: t('toastSuccessTitle'),
        description: t('toastModelSuccess'),
      });
    },
    onError: (error: any) => {
      // Clear optimized prompt on generation error to avoid stale prompts
      setOptimizedPrompt("");
      setShowOptimizedPrompt(false);
      
      const errorMessage = error?.message || error?.error || 'Generation failed';
      toast({
        variant: "destructive",
        title: t('toastErrorTitle'),
        description: errorMessage,
      });
    },
  });

  const handleModelImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setModelImage({
      file,
      preview: URL.createObjectURL(file),
    });
  };

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxProducts = tryonMode === 'single' ? 1 : 5;
    const currentCount = productImages.length;
    const availableSlots = maxProducts - currentCount;

    if (availableSlots <= 0) {
      toast({
        variant: "destructive",
        title: t('toastErrorTitle'),
        description: t('toastError'),
      });
      return;
    }

    const filesToAdd = Array.from(files).slice(0, availableSlots);
    const newImages = filesToAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      type: "top",
      name: undefined,
    }));

    setProductImages((prev) => [...prev, ...newImages]);
  };

  const removeProductImage = (index: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
  };

  const updateProductInfo = (index: number, type: string, name?: string) => {
    setProductImages((prev) => 
      prev.map((img, i) => 
        i === index ? { ...img, type, name } : img
      )
    );
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (!modelImage) {
      toast({
        variant: "destructive",
        title: t('toastErrorTitle'),
        description: t('toastError'),
      });
      return;
    }

    if (productImages.length === 0) {
      toast({
        variant: "destructive",
        title: t('toastErrorTitle'),
        description: t('toastError'),
      });
      return;
    }

    if (data.tryonMode === 'single' && !data.tryonType) {
      toast({
        variant: "destructive",
        title: t('toastErrorTitle'),
        description: t('toastError'),
      });
      return;
    }

    mutation.mutate(data);
  };

  const downloadImage = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `virtual-tryon-${Date.now()}.png`;
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
              <h2 className="text-2xl font-light tracking-wide mb-6">{t('virtualTryonTitle')}</h2>
              
              {/* Model Image Upload */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">{t('virtualTryonModelImage')}</label>
                  <div 
                    className="border-2 border-dashed rounded-xl p-6 text-center hover-elevate active-elevate-2 cursor-pointer"
                    onClick={() => document.getElementById('model-upload')?.click()}
                    data-testid="button-upload-model"
                  >
                    {modelImage ? (
                      <div className="relative">
                        <img 
                          src={modelImage.preview} 
                          alt="Model" 
                          className="max-h-40 mx-auto rounded-lg"
                        />
                        <Button
                          size="icon"
                          variant="destructive"
                          className="absolute top-2 right-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModelImage(null);
                          }}
                          data-testid="button-remove-model"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">{t('uploadAreaTitle')}</p>
                      </>
                    )}
                  </div>
                  <input
                    id="model-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleModelImageChange}
                    className="hidden"
                    data-testid="input-model-image"
                  />
                </div>
              </div>

              {/* Product Images Upload */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {t('virtualTryonProducts')} ({t('virtualTryonMaxProducts')}: {tryonMode === 'single' ? '1' : '5'})
                  </label>
                  <div 
                    className="border-2 border-dashed rounded-xl p-6 text-center hover-elevate active-elevate-2 cursor-pointer"
                    onClick={() => document.getElementById('product-upload')?.click()}
                    data-testid="button-upload-products"
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      {t('uploadAreaTitle')} ({productImages.length}/{tryonMode === 'single' ? '1' : '5'})
                    </p>
                  </div>
                  <input
                    id="product-upload"
                    type="file"
                    accept="image/*"
                    multiple={tryonMode === 'multi'}
                    onChange={handleProductImageChange}
                    className="hidden"
                    data-testid="input-product-images"
                  />
                </div>

                {/* Product Previews */}
                {productImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {productImages.map((img, index) => (
                      <Card key={index} className="p-4" data-testid={`card-product-${index}`}>
                        <div className="relative mb-2">
                          <img 
                            src={img.preview} 
                            alt={`Product ${index + 1}`} 
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={() => removeProductImage(index)}
                            data-testid={`button-remove-product-${index}`}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        <Select
                          value={img.type}
                          onValueChange={(value) => updateProductInfo(index, value, img.name)}
                          data-testid={`select-product-type-${index}`}
                        >
                          <SelectTrigger>
                            {img.type ? getProductTypeLabel(img.type) : t('virtualTryonProductTypeAccessory')}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="accessory">{t('virtualTryonProductTypeAccessory')}</SelectItem>
                            <SelectItem value="top">{t('virtualTryonProductTypeTop')}</SelectItem>
                            <SelectItem value="bottom">{t('virtualTryonProductTypeBottom')}</SelectItem>
                            <SelectItem value="dress">{t('virtualTryonProductTypeDress')}</SelectItem>
                            <SelectItem value="outerwear">{t('virtualTryonProductTypeOuterwear')}</SelectItem>
                            <SelectItem value="shoes">{t('virtualTryonProductTypeShoes')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder={t('virtualTryonProductNamePlaceholder')}
                          value={img.name || ''}
                          onChange={(e) => updateProductInfo(index, img.type, e.target.value)}
                          className="mt-2"
                          data-testid={`input-product-name-${index}`}
                        />
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Configuration Form */}
            <Card className="p-8">
              <h2 className="text-2xl font-light tracking-wide mb-6">{t('virtualTryonConfiguration')}</h2>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Try-On Mode */}
                  <FormField
                    control={form.control}
                    name="tryonMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('virtualTryonMode')}</FormLabel>
                        <FormControl>
                          <RadioGroup
                            onValueChange={(value) => {
                              field.onChange(value);
                              if (value === 'single' && productImages.length > 1) {
                                setProductImages([productImages[0]]);
                              }
                            }}
                            value={field.value}
                            className="space-y-2"
                            data-testid="radio-tryon-mode"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="single" id="single" data-testid="radio-mode-single" />
                              <Label htmlFor="single">{t('virtualTryonModeSingle')}</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="multi" id="multi" data-testid="radio-mode-multi" />
                              <Label htmlFor="multi">{t('virtualTryonModeMulti')}</Label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Try-On Type (only for single mode) */}
                  {tryonMode === 'single' && (
                    <FormField
                      control={form.control}
                      name="tryonType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('virtualTryonType')}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} data-testid="select-tryon-type">
                            <FormControl>
                              <SelectTrigger>
                                {field.value ? getTryonTypeLabel(field.value) : t('virtualTryonSelectTypePlaceholder')}
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="accessory">{t('virtualTryonTypeAccessory')}</SelectItem>
                              <SelectItem value="top">{t('virtualTryonTypeTop')}</SelectItem>
                              <SelectItem value="bottom">{t('virtualTryonTypeBottom')}</SelectItem>
                              <SelectItem value="full">{t('virtualTryonTypeFull')}</SelectItem>
                              <SelectItem value="custom">{t('virtualTryonTypeCustom')}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Custom Try-On Type */}
                  {tryonMode === 'single' && form.watch('tryonType') === 'custom' && (
                    <FormField
                      control={form.control}
                      name="customTryonType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('virtualTryonCustomTypePlaceholder')}</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder={t('virtualTryonCustomTypePlaceholder')} 
                              {...field} 
                              data-testid="input-custom-tryon-type" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {/* Preserve Pose */}
                  <FormField
                    control={form.control}
                    name="preservePose"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('virtualTryonPreservePose')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} data-testid="select-preserve-pose">
                          <FormControl>
                            <SelectTrigger>
                              {field.value ? getPreservePoseLabel(field.value) : t('virtualTryonPreservePose')}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="yes">{t('virtualTryonPreservePoseYes')}</SelectItem>
                            <SelectItem value="no">{t('virtualTryonPreservePoseNo')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Style */}
                  <FormField
                    control={form.control}
                    name="style"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('virtualTryonStyleLabel')}</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            if (value !== 'custom') {
                              form.setValue('customStyle', '');
                            }
                            field.onChange(value);
                          }} 
                          value={field.value} 
                          data-testid="select-style"
                        >
                          <FormControl>
                            <SelectTrigger>
                              {field.value ? getStyleLabel(field.value) : t('virtualTryonStyleLabel')}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="natural">{t('virtualTryonStyleNatural')}</SelectItem>
                            <SelectItem value="fashion">{t('virtualTryonStyleFashion')}</SelectItem>
                            <SelectItem value="custom">{t('virtualTryonStyleCustom')}</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Custom Style - Show only when custom style is selected */}
                  {form.watch('style') === 'custom' && (
                    <FormField
                      control={form.control}
                      name="customStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('virtualTryonCustomStyleLabel')}</FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t('virtualTryonCustomStylePlaceholder')}
                              {...field}
                              data-testid="input-custom-style"
                            />
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
                        <FormLabel>{t('aspectRatioLabel')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} data-testid="select-aspect-ratio">
                          <FormControl>
                            <SelectTrigger>
                              {field.value ? getAspectRatioLabel(field.value) : t('aspectRatioLabel')}
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1:1">{t('aspectRatio11')}</SelectItem>
                            <SelectItem value="3:4">{t('aspectRatio34')}</SelectItem>
                            <SelectItem value="4:3">{t('aspectRatio43')}</SelectItem>
                            <SelectItem value="9:16">{t('aspectRatio916')}</SelectItem>
                            <SelectItem value="16:9">{t('aspectRatio169')}</SelectItem>
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

                  {/* Virtual Try-on Description */}
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-virtual-tryon-description">{t('designDescriptionLabel')}</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t('designDescriptionPlaceholder')}
                            rows={4}
                            {...field}
                            data-testid="textarea-virtual-tryon-description"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Virtual Try-on Optimize Prompt Feature */}
                  <div className="space-y-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={async () => {
                        const isValid = await form.trigger(['tryonMode']);
                        if (!isValid) {
                          toast({
                            variant: "destructive",
                            title: t('errorTitle') || "Error",
                            description: t('errorFillRequiredFields') || "Please fill in all required fields first",
                          });
                          return;
                        }
                        const formValues = form.getValues();
                        optimizePromptMutation.mutate(formValues);
                      }}
                      disabled={optimizePromptMutation.isPending}
                      className="w-full"
                      data-testid="button-optimize-virtual-tryon-prompt"
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
                            data-testid="button-close-virtual-tryon-optimized"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Textarea
                          value={optimizedPrompt}
                          onChange={(e) => setOptimizedPrompt(e.target.value)}
                          rows={6}
                          className="text-sm"
                          data-testid="textarea-virtual-tryon-optimized-prompt"
                        />
                        <p className="text-xs text-muted-foreground">
                          {t('optimizedPromptHint') || "You can edit this prompt before generating"}
                        </p>
                      </div>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={mutation.isPending}
                    data-testid="button-generate"
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('virtualTryonGenerating')}
                      </>
                    ) : (
                      t('virtualTryonGenerate')
                    )}
                  </Button>
                </form>
              </Form>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-3">
            <Card className="p-8">
              <h2 className="text-2xl font-light tracking-wide mb-6">{t('virtualTryonResult')}</h2>
              
              {generatedImage ? (
                <div className="space-y-4">
                  <div 
                    className="relative group cursor-pointer"
                    onClick={() => setSelectedImage(generatedImage)}
                    data-testid="image-generated-result"
                  >
                    <img 
                      src={generatedImage} 
                      alt="Virtual Try-On Result" 
                      className="w-full rounded-xl"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded-xl flex items-center justify-center">
                      <ImageIcon className="w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => downloadImage(generatedImage)}
                    className="w-full"
                    data-testid="button-download"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('downloadPNG')}
                  </Button>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-20">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>{t('virtualTryonEmptyState')}</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* Image Preview Dialog */}
      <Dialog open={!!selectedImage} onOpenChange={(open) => !open && setSelectedImage(null)}>
        <DialogContent className="max-w-4xl">
          {selectedImage && (
            <img src={selectedImage} alt="Preview" className="w-full rounded-lg" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
