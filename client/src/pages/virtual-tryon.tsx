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
import { Download, Upload, Loader2, X, Image as ImageIcon } from "lucide-react";
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

  const formSchema = z.object({
    tryonMode: z.enum(['single', 'multi']),
    tryonType: z.string().optional(),
    preservePose: z.string(),
    style: z.string(),
    aspectRatio: z.string().min(1, "Aspect ratio is required"),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tryonMode: 'single',
      tryonType: '',
      preservePose: 'yes',
      style: 'natural',
      aspectRatio: '9:16',
    },
  });

  const tryonMode = form.watch('tryonMode');

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
      formData.append('preservePose', data.preservePose);
      formData.append('style', data.style);
      formData.append('aspectRatio', data.aspectRatio);
      formData.append('productTypes', JSON.stringify(productImages.map(img => img.type)));
      formData.append('productNames', JSON.stringify(productImages.map(img => img.name || '')));

      const response = await fetch('/api/generate-virtual-tryon', {
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
        description: "Virtual try-on generated successfully",
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

  const handleProductImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const maxProducts = tryonMode === 'single' ? 1 : 5;
    const currentCount = productImages.length;
    const availableSlots = maxProducts - currentCount;

    if (availableSlots <= 0) {
      toast({
        variant: "destructive",
        title: "Maximum limit reached",
        description: `Maximum ${maxProducts} product(s) allowed in ${tryonMode} mode`,
      });
      return;
    }

    const filesToAdd = Array.from(files).slice(0, availableSlots);
    const newImages = filesToAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      type: "clothing",
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
        title: "No model image",
        description: "Please upload a model image",
      });
      return;
    }

    if (productImages.length === 0) {
      toast({
        variant: "destructive",
        title: "No products",
        description: "Please upload at least one product image",
      });
      return;
    }

    if (data.tryonMode === 'single' && !data.tryonType) {
      toast({
        variant: "destructive",
        title: "Missing try-on type",
        description: "Please select a try-on type for single mode",
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
              <h2 className="text-2xl font-light tracking-wide mb-6">Virtual Try-On Setup</h2>
              
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

              {/* Product Images Upload */}
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Product Images (Max: {tryonMode === 'single' ? '1' : '5'})
                  </label>
                  <div 
                    className="border-2 border-dashed rounded-xl p-6 text-center hover-elevate active-elevate-2 cursor-pointer"
                    onClick={() => document.getElementById('product-upload')?.click()}
                    data-testid="button-upload-products"
                  >
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Upload product images ({productImages.length}/{tryonMode === 'single' ? '1' : '5'})
                    </p>
                  </div>
                  <input
                    id="product-upload"
                    type="file"
                    accept="image/png,image/jpeg,image/jpg"
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
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="accessory">Accessory</SelectItem>
                            <SelectItem value="top">Top</SelectItem>
                            <SelectItem value="bottom">Bottom</SelectItem>
                            <SelectItem value="dress">Dress</SelectItem>
                            <SelectItem value="outerwear">Outerwear</SelectItem>
                            <SelectItem value="shoes">Shoes</SelectItem>
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Product name (optional)"
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
              <h2 className="text-2xl font-light tracking-wide mb-6">Try-On Configuration</h2>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Try-On Mode */}
                  <FormField
                    control={form.control}
                    name="tryonMode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Try-On Mode</FormLabel>
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
                              <Label htmlFor="single">Single Product (Precise)</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="multi" id="multi" data-testid="radio-mode-multi" />
                              <Label htmlFor="multi">Multi-Product (Flexible)</Label>
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
                          <FormLabel>Try-On Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value} data-testid="select-tryon-type">
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="accessory">Accessory Only</SelectItem>
                              <SelectItem value="top">Top Only</SelectItem>
                              <SelectItem value="bottom">Bottom Only</SelectItem>
                              <SelectItem value="full">Full Outfit</SelectItem>
                            </SelectContent>
                          </Select>
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
                        <FormLabel>Preserve Pose</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} data-testid="select-preserve-pose">
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="yes">Yes - Keep exact pose</SelectItem>
                            <SelectItem value="no">No - Allow adjustment</SelectItem>
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
                        <FormLabel>Photography Style</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value} data-testid="select-style">
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="natural">Natural & Realistic</SelectItem>
                            <SelectItem value="fashion">Fashion Editorial</SelectItem>
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
                        Generating...
                      </>
                    ) : (
                      'Generate Virtual Try-On'
                    )}
                  </Button>
                </form>
              </Form>
            </Card>
          </div>

          {/* Results Panel */}
          <div className="lg:col-span-3">
            <Card className="p-8">
              <h2 className="text-2xl font-light tracking-wide mb-6">Generated Result</h2>
              
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
                    Download Image
                  </Button>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-20">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p>Upload images and configure settings to generate your virtual try-on</p>
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
