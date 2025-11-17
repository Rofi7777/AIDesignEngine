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

export default function ModelTryOn() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [productImages, setProductImages] = useState<Array<{ file: File; preview: string; type: string; typeCustom?: string }>>([]);
  const [generatedResults, setGeneratedResults] = useState<Array<{ cameraAngle: string; imageUrl: string }>>([]);

  const formSchema = z.object({
    nationality: z.string().min(1, "Nationality is required"),
    nationalityCustom: z.string().optional(),
    hairstyle: z.string().min(1, "Hairstyle is required"),
    hairstyleCustom: z.string().optional(),
    combination: z.string().min(1, "Model combination is required"),
    combinationCustom: z.string().optional(),
    scene: z.string().min(1, "Scene is required"),
    sceneCustom: z.string().optional(),
    pose: z.string().min(1, "Pose is required"),
    poseCustom: z.string().optional(),
    aspectRatio: z.string().min(1, "Aspect ratio is required"),
    cameraAngles: z.array(z.string()).min(1, "At least one camera angle is required"),
    cameraAngleCustom: z.string().optional(),
  });

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
        const error = await response.json();
        throw new Error(error.error || 'Generation failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      setGeneratedResults(data.results);
      toast({
        title: "Success!",
        description: data.message || "Model try-on images generated successfully",
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
        title: "No products",
        description: "Please upload at least one product image",
      });
      return;
    }

    mutation.mutate(data);
  };

  const downloadImage = (imageUrl: string, angle: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `model-tryon-${angle}-${Date.now()}.png`;
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
              <h2 className="text-2xl font-light tracking-wide mb-6">Product Upload</h2>
              
              {/* Product Images Upload */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Product Images</label>
                  <div className="border-2 border-dashed rounded-xl p-6 text-center hover-elevate active-elevate-2 cursor-pointer"
                    onClick={() => document.getElementById('product-upload')?.click()}>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload product images</p>
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
                            alt={`Product ${index + 1}`}
                            className="w-20 h-20 object-cover rounded-lg"
                          />
                          <div className="flex-1 space-y-2">
                            <Select
                              value={img.type}
                              onValueChange={(value) => updateProductType(index, value)}
                            >
                              <SelectTrigger data-testid={`select-product-type-${index}`}>
                                <SelectValue placeholder="Select product type" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="Hat">Hat</SelectItem>
                                <SelectItem value="Top / Shirt / Jacket">Top / Shirt / Jacket</SelectItem>
                                <SelectItem value="Bottom / Pants / Skirt">Bottom / Pants / Skirt</SelectItem>
                                <SelectItem value="Shoes / Slippers">Shoes / Slippers</SelectItem>
                                <SelectItem value="Accessories">Accessories</SelectItem>
                                <SelectItem value="Custom">Custom</SelectItem>
                              </SelectContent>
                            </Select>
                            {img.type === "Custom" && (
                              <Input
                                placeholder="Enter custom product type"
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
              <h2 className="text-2xl font-light tracking-wide mb-6">Model & Scene Options</h2>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Nationality */}
                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model Nationality</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-nationality">
                              <SelectValue placeholder="Select nationality" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="East Asian">East Asian</SelectItem>
                            <SelectItem value="Southeast Asian">Southeast Asian</SelectItem>
                            <SelectItem value="Western / European">Western / European</SelectItem>
                            <SelectItem value="Middle Eastern / Latin">Middle Eastern / Latin</SelectItem>
                            <SelectItem value="Custom">Custom</SelectItem>
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
                            <Input placeholder="Enter custom nationality" {...field} data-testid="input-nationality-custom" />
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
                        <FormLabel>Hairstyle</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-hairstyle">
                              <SelectValue placeholder="Select hairstyle" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Short straight hair">Short straight hair</SelectItem>
                            <SelectItem value="Medium wavy hair">Medium wavy hair</SelectItem>
                            <SelectItem value="Long straight hair">Long straight hair</SelectItem>
                            <SelectItem value="Curly / Afro-textured hair">Curly / Afro-textured hair</SelectItem>
                            <SelectItem value="Custom">Custom</SelectItem>
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
                            <Input placeholder="Enter custom hairstyle" {...field} data-testid="input-hairstyle-custom" />
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
                        <FormLabel>Model Combination</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-combination">
                              <SelectValue placeholder="Select combination" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Single male model">Single male model</SelectItem>
                            <SelectItem value="Single female model">Single female model</SelectItem>
                            <SelectItem value="One male + one female">One male + one female</SelectItem>
                            <SelectItem value="Two male models">Two male models</SelectItem>
                            <SelectItem value="Two female models">Two female models</SelectItem>
                            <SelectItem value="Custom">Custom</SelectItem>
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
                            <Input placeholder="Enter custom combination" {...field} data-testid="input-combination-custom" />
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
                        <FormLabel>Scene / Location</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-scene">
                              <SelectValue placeholder="Select scene" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Studio background (clean, plain)">Studio background</SelectItem>
                            <SelectItem value="City street / urban environment">City street / urban</SelectItem>
                            <SelectItem value="Home interior (living room / bedroom)">Home interior</SelectItem>
                            <SelectItem value="Park / nature / outdoor">Park / nature / outdoor</SelectItem>
                            <SelectItem value="Retail store / shopping mall">Retail store / mall</SelectItem>
                            <SelectItem value="Custom">Custom</SelectItem>
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
                            <Input placeholder="Enter custom scene" {...field} data-testid="input-scene-custom" />
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
                        <FormLabel>Pose</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-pose">
                              <SelectValue placeholder="Select pose" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="Standing front-facing, relaxed">Standing relaxed</SelectItem>
                            <SelectItem value="Walking mid-step (dynamic pose)">Walking mid-step</SelectItem>
                            <SelectItem value="Sitting, relaxed pose">Sitting relaxed</SelectItem>
                            <SelectItem value="Close-up pose focusing on product">Close-up on product</SelectItem>
                            <SelectItem value="Fashion pose (editorial style)">Fashion editorial</SelectItem>
                            <SelectItem value="Custom">Custom</SelectItem>
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
                            <Input placeholder="Enter custom pose" {...field} data-testid="input-pose-custom" />
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
                        <FormLabel>Aspect Ratio</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-aspect-ratio">
                              <SelectValue placeholder="Select aspect ratio" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1:1">1:1 (Square)</SelectItem>
                            <SelectItem value="9:16">9:16 (Vertical / Story)</SelectItem>
                            <SelectItem value="16:9">16:9 (Horizontal / Wide)</SelectItem>
                            <SelectItem value="4:3">4:3</SelectItem>
                            <SelectItem value="3:4">3:4</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Camera Angles */}
                  <FormField
                    control={form.control}
                    name="cameraAngles"
                    render={() => (
                      <FormItem>
                        <FormLabel>Camera Angles (multi-select)</FormLabel>
                        <div className="space-y-2">
                          {["Front view", "Side view", "Back view", "Custom"].map((angle) => (
                            <FormField
                              key={angle}
                              control={form.control}
                              name="cameraAngles"
                              render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(angle)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...field.value, angle])
                                          : field.onChange(field.value?.filter((val) => val !== angle));
                                      }}
                                      data-testid={`checkbox-angle-${angle.toLowerCase().replace(/ /g, '-')}`}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">{angle}</FormLabel>
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
                            <Input placeholder="Enter custom camera angle" {...field} data-testid="input-angle-custom" />
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
                    {mutation.isPending ? "Generating..." : "Generate Model Try-on"}
                  </Button>
                </form>
              </Form>
            </Card>
          </div>

          {/* Results Gallery */}
          <div className="lg:col-span-3">
            <Card className="p-8">
              <h2 className="text-2xl font-light tracking-wide mb-6">Generated Results</h2>
              
              {generatedResults.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <p>No results yet. Configure and generate your model try-on images.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {generatedResults.map((result, index) => (
                    <Card key={index} className="p-4">
                      <img
                        src={result.imageUrl}
                        alt={result.cameraAngle}
                        className="w-full h-auto rounded-lg mb-4 cursor-pointer hover-elevate"
                        data-testid={`img-result-${index}`}
                      />
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{result.cameraAngle}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadImage(result.imageUrl, result.cameraAngle)}
                          data-testid={`button-download-${index}`}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download PNG
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
    </div>
  );
}
