import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
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
  type GeneratedImage,
  slipperDesignRequestSchema,
  modelWearingRequestSchema,
} from "@shared/schema";
import { z } from "zod";

const designFormSchema = slipperDesignRequestSchema.omit({ templateImage: true, angles: true }).extend({
  customColor: z.string().optional(),
  customMaterial: z.string().optional(),
}).refine(
  (data) => {
    if (data.color === "custom") {
      return data.customColor && data.customColor.trim().length > 0;
    }
    return true;
  },
  {
    message: "Custom color description is required when using Custom color",
    path: ["customColor"],
  }
).refine(
  (data) => {
    if (data.material === "custom") {
      return data.customMaterial && data.customMaterial.trim().length > 0;
    }
    return true;
  },
  {
    message: "Custom material description is required when using Custom material",
    path: ["customMaterial"],
  }
);

const modelFormSchema = modelWearingRequestSchema.omit({ slipperDesignImage: true }).refine(
  (data) => {
    if (data.presentationStyle === "Custom") {
      return data.customStyleText && data.customStyleText.trim().length > 0;
    }
    return true;
  },
  {
    message: "Custom style description is required when using Custom presentation style",
    path: ["customStyleText"],
  }
);

type DesignFormValues = z.infer<typeof designFormSchema>;
type ModelFormValues = z.infer<typeof modelFormSchema>;

export default function Home() {
  const { toast } = useToast();
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [generatedSlipperTop, setGeneratedSlipperTop] = useState<string | null>(null);
  const [generatedSlipper45, setGeneratedSlipper45] = useState<string | null>(null);
  const [generatedModelImage, setGeneratedModelImage] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<"top" | "45degree">("top");

  const designForm = useForm<DesignFormValues>({
    resolver: zodResolver(designFormSchema),
    defaultValues: {
      theme: "",
      style: "",
      color: "",
      material: "",
      customColor: "",
      customMaterial: "",
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

  const { data: generatedImages } = useQuery<GeneratedImage[]>({
    queryKey: ["/api/generated-images"],
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/image\/(png|jpeg|jpg)/)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PNG or JPG image",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setUploadedFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    if (!file.type.match(/image\/(png|jpeg|jpg)/)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PNG or JPG image",
        variant: "destructive",
      });
      return;
    }

    setUploadedFile(file);
    setUploadedFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const generateDesignMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      return await fetch("/api/generate-design", {
        method: "POST",
        body: formData,
      }).then(res => {
        if (!res.ok) throw new Error("Failed to generate design");
        return res.json();
      });
    },
    onSuccess: (data: any) => {
      setGeneratedSlipperTop(data.topView || null);
      setGeneratedSlipper45(data.view45 || null);
      queryClient.invalidateQueries({ queryKey: ["/api/generated-images"] });
      toast({
        title: "Design Generated!",
        description: "Your slipper design is ready",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate design",
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
        if (!res.ok) throw new Error("Failed to generate model scene");
        return res.json();
      });
    },
    onSuccess: (data: any) => {
      setGeneratedModelImage(data.modelImage || null);
      queryClient.invalidateQueries({ queryKey: ["/api/generated-images"] });
      toast({
        title: "Model Scene Generated!",
        description: "Your model wearing scene is ready",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Generation Failed",
        description: error.message || "Failed to generate model scene",
        variant: "destructive",
      });
    },
  });

  const onDesignSubmit = (data: DesignFormValues) => {
    if (!uploadedFile) {
      toast({
        title: "Missing Template",
        description: "Please upload a slipper template first",
        variant: "destructive",
      });
      return;
    }

    const formData = new FormData();
    formData.append("template", uploadedFile);
    formData.append("theme", data.theme);
    formData.append("style", data.style);
    formData.append("color", data.color === "custom" ? data.customColor! : data.color);
    formData.append("material", data.material === "custom" ? data.customMaterial! : data.material);
    formData.append("angles", JSON.stringify(["top", "45degree"]));

    generateDesignMutation.mutate(formData);
  };

  const onModelSubmit = async (data: ModelFormValues) => {
    const slipperImage = generatedSlipperTop || generatedSlipper45;
    if (!slipperImage) {
      toast({
        title: "Missing Design",
        description: "Please generate a slipper design first",
        variant: "destructive",
      });
      return;
    }

    try {
      const res = await fetch(slipperImage);
      const blob = await res.blob();
      
      const formData = new FormData();
      formData.append("slipperImage", blob, "slipper-design.png");
      formData.append("nationality", data.nationality);
      formData.append("familyCombination", data.familyCombination);
      formData.append("scenario", data.scenario);
      formData.append("location", data.location);
      formData.append("presentationStyle", data.presentationStyle === "Custom" ? data.customStyleText || "" : data.presentationStyle);
      formData.append("customStyleText", data.customStyleText || "");

      generateModelMutation.mutate(formData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to prepare model generation request",
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

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary text-primary-foreground" data-testid="logo-icon">
              <Sparkles className="h-5 w-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight" data-testid="text-app-title">AI Slipper Design Studio</h1>
          </div>
          <Badge variant="secondary" className="text-xs" data-testid="badge-version">MVP v1.0</Badge>
        </div>
      </header>

      <div className="container mx-auto px-6 py-12">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-semibold tracking-tight" data-testid="text-hero-title">
            Accelerate Seasonal Slipper Design with AI
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground" data-testid="text-hero-subtitle">
            Generate stunning slipper concepts and model-wearing scenes in seconds
          </p>
          <div className="mt-6 flex items-center justify-center gap-8 text-sm">
            <div className="flex flex-col items-center gap-1">
              <div className="text-2xl font-bold text-primary" data-testid="text-stat-faster">70%</div>
              <div className="text-muted-foreground">Faster</div>
            </div>
            <Separator orientation="vertical" className="h-12" />
            <div className="flex flex-col items-center gap-1">
              <div className="text-2xl font-bold text-primary" data-testid="text-stat-concepts">3×</div>
              <div className="text-muted-foreground">More Concepts</div>
            </div>
            <Separator orientation="vertical" className="h-12" />
            <div className="flex flex-col items-center gap-1">
              <div className="text-2xl font-bold text-primary" data-testid="text-stat-approval">80%</div>
              <div className="text-muted-foreground">Approval Rate</div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[2fr,3fr]">
          <div className="space-y-8">
            <Card className="p-6">
              <h3 className="mb-4 text-xl font-semibold" data-testid="text-section-upload">1. Upload Template</h3>
              <div
                className="group relative cursor-pointer overflow-hidden rounded-lg border-2 border-dashed border-border bg-muted/30 transition-colors hover-elevate"
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => document.getElementById("file-upload")?.click()}
                data-testid="dropzone-upload"
              >
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleFileUpload}
                  data-testid="input-file"
                />
                {previewUrl ? (
                  <div className="relative aspect-video">
                    <img
                      src={previewUrl}
                      alt="Uploaded template"
                      className="h-full w-full object-contain"
                      data-testid="img-template-preview"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute right-2 top-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedFile(null);
                        setUploadedFileName("");
                        setPreviewUrl(null);
                      }}
                      data-testid="button-remove-template"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Upload className="mb-3 h-12 w-12 text-muted-foreground" data-testid="icon-upload" />
                    <p className="mb-1 font-medium" data-testid="text-upload-title">Upload Slipper Template</p>
                    <p className="text-sm text-muted-foreground" data-testid="text-upload-hint">
                      PNG, JPG up to 10MB
                    </p>
                  </div>
                )}
              </div>
              {uploadedFileName && (
                <p className="mt-2 text-sm text-muted-foreground" data-testid="text-filename">
                  {uploadedFileName}
                </p>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="mb-4 text-xl font-semibold" data-testid="text-section-theme">2. Theme & Style</h3>
              <Form {...designForm}>
                <form onSubmit={designForm.handleSubmit(onDesignSubmit)} className="space-y-4">
                  <FormField
                    control={designForm.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-theme">Theme</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-theme">
                              <SelectValue placeholder="Select seasonal theme" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {THEMES.map((t) => (
                              <SelectItem key={t} value={t} data-testid={`option-theme-${t.toLowerCase().replace(/\s+/g, '-')}`}>
                                {t}
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
                        <FormLabel data-testid="label-style">Style</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-style">
                              <SelectValue placeholder="Select design style" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {STYLES.map((s) => (
                              <SelectItem key={s} value={s} data-testid={`option-style-${s.toLowerCase()}`}>
                                {s}
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
                        <FormLabel data-testid="label-color">Color Palette</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            if (value !== "custom") {
                              designForm.setValue("customColor", "");
                            }
                            field.onChange(value);
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-color">
                              <SelectValue placeholder="Select color palette" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {COLOR_PALETTES.map((c) => (
                              <SelectItem key={c} value={c} data-testid={`option-color-${c.toLowerCase().replace(/\s+/g, '-')}`}>
                                {c}
                              </SelectItem>
                            ))}
                            <SelectItem value="custom" data-testid="option-color-custom">Custom Color</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {designForm.watch("color") === "custom" && (
                    <FormField
                      control={designForm.control}
                      name="customColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-custom-color">Custom Colors</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., pastel green, soft pink"
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
                        <FormLabel data-testid="label-material">Material</FormLabel>
                        <Select 
                          onValueChange={(value) => {
                            if (value !== "custom") {
                              designForm.setValue("customMaterial", "");
                            }
                            field.onChange(value);
                          }} 
                          value={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-material">
                              <SelectValue placeholder="Select material" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {MATERIALS.map((m) => (
                              <SelectItem key={m} value={m} data-testid={`option-material-${m.toLowerCase().replace(/\s+/g, '-')}`}>
                                {m}
                              </SelectItem>
                            ))}
                            <SelectItem value="custom" data-testid="option-material-custom">Custom Material</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {designForm.watch("material") === "custom" && (
                    <FormField
                      control={designForm.control}
                      name="customMaterial"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel data-testid="label-custom-material">Custom Material</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="e.g., bamboo fiber, organic cotton"
                              {...field}
                              data-testid="input-custom-material"
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
                    className="w-full"
                    disabled={generateDesignMutation.isPending}
                    data-testid="button-generate-design"
                  >
                    {generateDesignMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating Design...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Generate Slipper Design
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </Card>

            <Separator className="my-8" />

            <Card className="p-6">
              <h3 className="mb-4 text-xl font-semibold" data-testid="text-section-model">4. Model Wearing Scene</h3>
              <Form {...modelForm}>
                <form onSubmit={modelForm.handleSubmit(onModelSubmit)} className="space-y-4">
                  <FormField
                    control={modelForm.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel data-testid="label-nationality">Nationality</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-nationality">
                              <SelectValue placeholder="Select nationality" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {NATIONALITIES.map((n) => (
                              <SelectItem key={n} value={n} data-testid={`option-nationality-${n.toLowerCase().replace(/\s+/g, '-')}`}>
                                {n}
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
                        <FormLabel data-testid="label-family">Family Combination</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-family">
                              <SelectValue placeholder="Select family group" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {FAMILY_COMBINATIONS.map((f) => (
                              <SelectItem key={f} value={f} data-testid={`option-family-${f.toLowerCase().replace(/\s+/g, '-')}`}>
                                {f}
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
                        <FormLabel data-testid="label-scenario">Scenario</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-scenario">
                              <SelectValue placeholder="Select usage scenario" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {SCENARIOS.map((s) => (
                              <SelectItem key={s} value={s} data-testid={`option-scenario-${s.toLowerCase().replace(/\s+/g, '-')}`}>
                                {s}
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
                        <FormLabel data-testid="label-location">Location</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-location">
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {LOCATIONS.map((l) => (
                              <SelectItem key={l} value={l} data-testid={`option-location-${l.toLowerCase().replace(/\s+/g, '-')}`}>
                                {l}
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
                        <FormLabel data-testid="label-presentation">Presentation Style</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-presentation">
                              <SelectValue placeholder="Select presentation style" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {PRESENTATION_STYLES.map((p) => (
                              <SelectItem key={p} value={p} data-testid={`option-presentation-${p.toLowerCase().replace(/\s+/g, '-')}`}>
                                {p}
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
                          <FormLabel data-testid="label-custom-style">Custom Style Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe your desired presentation style..."
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
                    className="w-full"
                    disabled={generateModelMutation.isPending}
                    data-testid="button-generate-model"
                  >
                    {generateModelMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Generating Model Scene...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="mr-2 h-5 w-5" />
                        Generate Model Wearing
                      </>
                    )}
                  </Button>
                </form>
              </Form>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h3 className="text-xl font-semibold" data-testid="text-section-results">Generated Designs</h3>
                {(generatedSlipperTop || generatedSlipper45) && (
                  <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
                    <TabsList>
                      <TabsTrigger value="top" data-testid="tab-top-view">Top View</TabsTrigger>
                      <TabsTrigger value="45degree" data-testid="tab-45-view">45° View</TabsTrigger>
                    </TabsList>
                  </Tabs>
                )}
              </div>

              {!generatedSlipperTop && !generatedSlipper45 && !generatedModelImage ? (
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-border py-24" data-testid="empty-state">
                  <ImageIcon className="mb-3 h-16 w-16 text-muted-foreground/50" data-testid="icon-empty-state" />
                  <p className="text-lg font-medium text-muted-foreground" data-testid="text-empty-title">
                    Upload template to begin
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground" data-testid="text-empty-subtitle">
                    Your AI-generated designs will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeView === "top" && generatedSlipperTop && (
                    <div className="group relative overflow-hidden rounded-lg" data-testid="card-design-top">
                      <img
                        src={generatedSlipperTop}
                        alt="Top view slipper design"
                        className="w-full rounded-lg shadow-lg"
                        data-testid="img-design-top"
                      />
                      <Button
                        size="sm"
                        className="absolute bottom-4 right-4 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => downloadImage(generatedSlipperTop, "slipper-design-top-view.png")}
                        data-testid="button-download-top"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download PNG
                      </Button>
                    </div>
                  )}

                  {activeView === "45degree" && generatedSlipper45 && (
                    <div className="group relative overflow-hidden rounded-lg" data-testid="card-design-45">
                      <img
                        src={generatedSlipper45}
                        alt="45° view slipper design"
                        className="w-full rounded-lg shadow-lg"
                        data-testid="img-design-45"
                      />
                      <Button
                        size="sm"
                        className="absolute bottom-4 right-4 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={() => downloadImage(generatedSlipper45, "slipper-design-45-view.png")}
                        data-testid="button-download-45"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download PNG
                      </Button>
                    </div>
                  )}

                  {generatedModelImage && (
                    <>
                      <Separator />
                      <div>
                        <h4 className="mb-4 text-lg font-semibold" data-testid="text-model-title">Model Wearing Scene</h4>
                        <div className="group relative overflow-hidden rounded-lg" data-testid="card-model-scene">
                          <img
                            src={generatedModelImage}
                            alt="Model wearing slipper"
                            className="w-full rounded-lg shadow-lg"
                            data-testid="img-model-scene"
                          />
                          <Button
                            size="sm"
                            className="absolute bottom-4 right-4 opacity-0 transition-opacity group-hover:opacity-100"
                            onClick={() => downloadImage(generatedModelImage, "model-wearing-scene.png")}
                            data-testid="button-download-model"
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Download PNG
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
