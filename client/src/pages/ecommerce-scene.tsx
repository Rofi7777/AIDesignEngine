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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, Upload, Loader2, X, Image as ImageIcon, Package, Boxes } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function EcommerceScene() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [modelImage, setModelImage] = useState<{ file: File; preview: string } | null>(null);
  const [assetImages, setAssetImages] = useState<Array<{ 
    file: File; 
    preview: string; 
    assetType: 'product' | 'prop';
    name?: string;
  }>>([]);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const formSchema = z.object({
    sceneType: z.string().min(1, "Scene type is required"),
    lighting: z.string().min(1, "Lighting is required"),
    composition: z.string().min(1, "Composition is required"),
    aspectRatio: z.string().min(1, "Aspect ratio is required"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sceneType: '',
      lighting: 'natural',
      composition: 'rule-of-thirds',
      aspectRatio: '16:9',
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof formSchema>) => {
      if (!modelImage) {
        throw new Error("Model image is required");
      }

      if (assetImages.length === 0) {
        throw new Error("At least one asset (product or prop) is required");
      }

      const formData = new FormData();
      formData.append('modelImage', modelImage.file);
      
      assetImages.forEach((img) => {
        formData.append('assetImages', img.file);
      });
      
      formData.append('sceneType', data.sceneType);
      formData.append('lighting', data.lighting);
      formData.append('composition', data.composition);
      formData.append('aspectRatio', data.aspectRatio);
      formData.append('assetTypes', JSON.stringify(assetImages.map(img => img.assetType)));
      formData.append('assetNames', JSON.stringify(assetImages.map(img => img.name || '')));

      const response = await fetch('/api/generate-ecommerce-scene', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Generation failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedImage(data.imageUrl);
      toast({
        title: "Success!",
        description: "E-commerce scene generated successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Generation failed",
        description: error.message,
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

  const handleAssetImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxAssets = 6;
    const currentCount = assetImages.length;
    const availableSlots = maxAssets - currentCount;

    if (availableSlots <= 0) {
      toast({
        variant: "destructive",
        title: "Maximum limit reached",
        description: `Maximum ${maxAssets} assets allowed (2-3 products + 1-2 props)`,
      });
      return;
    }

    const filesToAdd = Array.from(files).slice(0, availableSlots);
    const newImages = filesToAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      assetType: 'product' as const,
      name: undefined,
    }));

    setAssetImages((prev) => [...prev, ...newImages]);
  };

  const removeAssetImage = (index: number) => {
    setAssetImages((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAssetInfo = (index: number, assetType: 'product' | 'prop', name?: string) => {
    setAssetImages((prev) => 
      prev.map((img, i) => 
        i === index ? { ...img, assetType, name } : img
      )
    );
  };

  const onSubmit = (data: z.infer<typeof formSchema>) => {
    if (!modelImage) {
      toast({
        variant: "destructive",
        title: "No model image",
        description: "Please upload a model image",
      });
      return;
    }

    if (assetImages.length === 0) {
      toast({
        variant: "destructive",
        title: "No assets",
        description: "Please upload at least one asset (product or prop)",
      });
      return;
    }

    const productCount = assetImages.filter(a => a.assetType === 'product').length;
    if (productCount === 0) {
      toast({
        variant: "destructive",
        title: "No products",
        description: "At least one product is required",
      });
      return;
    }

    mutation.mutate(data);
  };

  const downloadImage = (imageUrl: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `ecommerce-scene-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const productCount = assetImages.filter(a => a.assetType === 'product').length;
  const propCount = assetImages.filter(a => a.assetType === 'prop').length;

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-8">
              <h2 className="text-2xl font-light tracking-wide mb-6">Scene Setup</h2>
              
              {/* Model Image Upload */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Model Image</label>
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
                        <p className="text-sm text-muted-foreground">Upload model image</p>
                      </>
                    )}
                  </div>
                  <input
                    id="model-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    onChange={handleModelImageChange}
                    className="hidden"
                    data-testid="input-model-image"
                  />
                </div>
              </div>

              {/* Asset Images Upload */}
              <div className="space-y-4 mb-6">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium">
                      Assets (Max: 6)
                    </label>
                    <div className="flex gap-2">
                      <Badge variant="secondary" className="text-xs">
                        <Package className="w-3 h-3 mr-1" />
                        {productCount} Products
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        <Boxes className="w-3 h-3 mr-1" />
                        {propCount} Props
                      </Badge>
                    </div>
                  </div>
                  <div 
                    className="border-2 border-dashed rounded-xl p-6 text-center hover-elevate active-elevate-2 cursor-pointer"
                    onClick={() => document.getElementById('asset-upload')?.click()}
                    data-testid="button-upload-assets"
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Upload products & props ({assetImages.length}/6)
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      2-3 products + 1-2 props recommended
                    </p>
                  </div>
                  <input
                    id="asset-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
                    multiple
                    onChange={handleAssetImageChange}
                    className="hidden"
                    data-testid="input-asset-images"
                  />
                </div>

                {/* Asset Previews */}
                {assetImages.length > 0 && (
                  <div className="grid grid-cols-2 gap-4">
                    {assetImages.map((img, index) => (
                      <Card key={index} className="p-4" data-testid={`card-asset-${index}`}>
                        <div className="relative mb-2">
                          <img 
                            src={img.preview} 
                            alt={`Asset ${index + 1}`} 
                            className="w-full h-24 object-cover rounded-lg"
                          />
                          <Button
                            size="icon"
                            variant="destructive"
                            className="absolute -top-2 -right-2 h-6 w-6"
                            onClick={() => removeAssetImage(index)}
                            data-testid={`button-remove-asset-${index}`}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                          <Badge 
                            className="absolute bottom-2 left-2"
                            variant={img.assetType === 'product' ? 'default' : 'secondary'}
                          >
                            {img.assetType === 'product' ? <Package className="w-3 h-3 mr-1" /> : <Boxes className="w-3 h-3 mr-1" />}
                            {img.assetType}
                          </Badge>
                        </div>
                        <RadioGroup
                          value={img.assetType}
                          onValueChange={(value) => updateAssetInfo(index, value as 'product' | 'prop', img.name)}
                          className="flex gap-4 mb-2"
                          data-testid={`radio-asset-type-${index}`}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="product" id={`product-${index}`} />
                            <Label htmlFor={`product-${index}`} className="text-xs">Product</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="prop" id={`prop-${index}`} />
                            <Label htmlFor={`prop-${index}`} className="text-xs">Prop</Label>
                          </div>
                        </RadioGroup>
                        <Input
                          placeholder="Name (optional)"
                          value={img.name || ''}
                          onChange={(e) => updateAssetInfo(index, img.assetType, e.target.value)}
                          className="text-sm"
                          data-testid={`input-asset-name-${index}`}
                        />
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </Card>

            {/* Configuration Form */}
            <Card className="p-8">
              <h2 className="text-2xl font-light tracking-wide mb-6">Scene Configuration</h2>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Scene Type */}
                  <FormField
                    control={form.control}
                    name="sceneType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scene Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} data-testid="select-scene-type">
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select scene type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="home">Home Interior</SelectItem>
                            <SelectItem value="office">Office/Workspace</SelectItem>
                            <SelectItem value="outdoor">Outdoor/Natural</SelectItem>
                            <SelectItem value="cafe">Cafe/Restaurant</SelectItem>
                            <SelectItem value="studio">Studio/Minimal</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Lighting */}
                  <FormField
                    control={form.control}
                    name="lighting"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lighting Style</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} data-testid="select-lighting">
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="natural">Natural Daylight</SelectItem>
                            <SelectItem value="warm">Warm & Cozy</SelectItem>
                            <SelectItem value="bright">Bright & Even</SelectItem>
                            <SelectItem value="soft">Soft & Diffused</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Composition */}
                  <FormField
                    control={form.control}
                    name="composition"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Composition Style</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} data-testid="select-composition">
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="center">Center Focused</SelectItem>
                            <SelectItem value="rule-of-thirds">Rule of Thirds</SelectItem>
                            <SelectItem value="diagonal">Diagonal Dynamic</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Aspect Ratio */}
                  <FormField
                    control={form.control}
                    name="aspectRatio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Aspect Ratio</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} data-testid="select-aspect-ratio">
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1:1">1:1 (Square)</SelectItem>
                            <SelectItem value="3:4">3:4 (Portrait)</SelectItem>
                            <SelectItem value="4:3">4:3 (Landscape)</SelectItem>
                            <SelectItem value="9:16">9:16 (Vertical)</SelectItem>
                            <SelectItem value="16:9">16:9 (Horizontal)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={mutation.isPending}
                    data-testid="button-generate"
                  >
                    {mutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Scene...
                      </>
                    ) : (
                      'Generate E-commerce Scene'
                    )}
                  </Button>
                </form>
              </Form>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-3">
            <Card className="p-8">
              <h2 className="text-2xl font-light tracking-wide mb-6">Generated Scene</h2>
              
              {generatedImage ? (
                <div className="space-y-4">
                  <div 
                    className="relative group cursor-pointer"
                    onClick={() => setSelectedImage(generatedImage)}
                    data-testid="image-generated-result"
                  >
                    <img 
                      src={generatedImage} 
                      alt="E-commerce Scene Result" 
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
                    Download Image
                  </Button>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-20">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Upload model, products & props, then configure the scene to generate</p>
                  <p className="text-sm mt-2">Recommended: 1 model + 2-3 products + 1-2 props</p>
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
