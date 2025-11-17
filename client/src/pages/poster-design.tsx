import { useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Upload, X, Download, Loader2 } from "lucide-react";

const formSchema = z.object({
  // Module A
  campaignType: z.string().min(1, "Campaign type is required"),
  customCampaign: z.string().optional(),
  referenceLevel: z.string().optional(),
  customReferenceLevel: z.string().optional(),
  // Module B
  visualStyle: z.string().min(1, "Visual style is required"),
  customVisualStyle: z.string().optional(),
  backgroundScene: z.string().min(1, "Background scene is required"),
  customBackgroundScene: z.string().optional(),
  layout: z.string().min(1, "Layout is required"),
  customLayout: z.string().optional(),
  aspectRatio: z.string().min(1, "Aspect ratio is required"),
  outputQuantity: z.string().min(1, "Output quantity is required"),
  // Module C
  headlineStyle: z.string().min(1, "Headline style is required"),
  customHeadline: z.string().optional(),
  autoGenerateHeadline: z.boolean().default(false),
  sellingPoint1: z.string().optional(),
  sellingPoint2: z.string().optional(),
  sellingPoint3: z.string().optional(),
  autoGenerateSellingPoints: z.boolean().default(false),
  priceStyle: z.string().optional(),
  originalPrice: z.string().optional(),
  currentPrice: z.string().optional(),
  discountText: z.string().optional(),
  customPriceStyle: z.string().optional(),
  logoPosition: z.string().optional(),
  brandTagline: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function PosterDesign() {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [productImages, setProductImages] = useState<File[]>([]);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [logoImage, setLogoImage] = useState<File | null>(null);
  const [generatedPoster, setGeneratedPoster] = useState<string | null>(null);
  const [activeModule, setActiveModule] = useState<string>("module-a");
  
  const productInputRef = useRef<HTMLInputElement>(null);
  const referenceInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      campaignType: "",
      visualStyle: "",
      backgroundScene: "",
      layout: "",
      aspectRatio: "1:1",
      outputQuantity: "1",
      headlineStyle: "",
      autoGenerateHeadline: false,
      autoGenerateSellingPoints: false,
      priceStyle: "",
      logoPosition: "top-left",
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const formData = new FormData();
      
      // Add form fields
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== "") {
          formData.append(key, String(value));
        }
      });
      
      // Add selling points as JSON array
      const sellingPoints = [
        data.sellingPoint1,
        data.sellingPoint2,
        data.sellingPoint3,
      ].filter(Boolean);
      formData.append("sellingPoints", JSON.stringify(sellingPoints));
      
      // Add product images
      productImages.forEach((file) => {
        formData.append("productImages", file);
      });
      
      // Add product names (extract from file names)
      const productNames = productImages.map(f => f.name.replace(/\.[^/.]+$/, ""));
      formData.append("productNames", JSON.stringify(productNames));
      
      // Add reference image if exists
      if (referenceImage) {
        formData.append("referenceImage", referenceImage);
      }
      
      // Add logo image if exists
      if (logoImage) {
        formData.append("logoImage", logoImage);
      }

      const response = await fetch("/api/generate-poster", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate poster");
      }

      return await response.json();
    },
    onSuccess: (data) => {
      setGeneratedPoster(data.imageUrl);
      toast({
        title: t("posterDesignSuccessTitle"),
        description: t("posterDesignSuccessMessage"),
      });
    },
    onError: (error: Error) => {
      toast({
        title: t("posterDesignErrorTitle"),
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: FormData) => {
    if (productImages.length === 0) {
      toast({
        title: t("posterDesignErrorTitle"),
        description: "Please upload at least one product image",
        variant: "destructive",
      });
      return;
    }
    generateMutation.mutate(data);
  };

  const handleProductImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (productImages.length + files.length > 6) {
      toast({
        title: t("posterDesignErrorTitle"),
        description: "Maximum 6 product images allowed",
        variant: "destructive",
      });
      return;
    }
    setProductImages([...productImages, ...files]);
    if (productInputRef.current) {
      productInputRef.current.value = "";
    }
  };

  const removeProductImage = (index: number) => {
    setProductImages(productImages.filter((_, i) => i !== index));
  };

  const downloadPoster = () => {
    if (!generatedPoster) return;
    const link = document.createElement("a");
    link.href = generatedPoster;
    link.download = `poster-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="container mx-auto p-4 lg:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Configuration */}
        <div className="space-y-4">
          <div className="mb-6">
            <h1 className="text-3xl font-bold mb-2">{t("tabs.posterDesign")}</h1>
            <p className="text-muted-foreground">{t("posterDesignSubtitle")}</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Product Images Upload */}
              <Card>
                <CardContent className="pt-6">
                  <Label>{t("posterDesignProductImages")} *</Label>
                  <div className="mt-2 space-y-2">
                    <Input
                      ref={productInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleProductImageUpload}
                      data-testid="input-product-images"
                      className="cursor-pointer"
                    />
                    <p className="text-xs text-muted-foreground">
                      {t("posterDesignProductImagesHint")}
                    </p>
                    {productImages.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {productImages.map((file, i) => (
                          <div key={i} className="relative group">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`Product ${i + 1}`}
                              className="w-full h-20 object-cover rounded"
                            />
                            <Button
                              type="button"
                              size="icon"
                              variant="destructive"
                              className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={() => removeProductImage(i)}
                              data-testid={`button-remove-product-${i}`}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Three Module Accordion */}
              <Accordion
                type="single"
                collapsible
                value={activeModule}
                onValueChange={setActiveModule}
                className="w-full"
              >
                {/* Module A: Campaign & Scene */}
                <AccordionItem value="module-a">
                  <AccordionTrigger className="text-lg font-semibold">
                    {t("posterDesignModuleA")}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="campaignType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("posterDesignCampaignType")} *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-campaign-type">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="discount">{t("campaignDiscount")}</SelectItem>
                              <SelectItem value="new-product">{t("campaignNewProduct")}</SelectItem>
                              <SelectItem value="bestseller">{t("campaignBestseller")}</SelectItem>
                              <SelectItem value="festival">{t("campaignFestival")}</SelectItem>
                              <SelectItem value="brand-story">{t("campaignBrandStory")}</SelectItem>
                              <SelectItem value="bundle">{t("campaignBundle")}</SelectItem>
                              <SelectItem value="custom">{t("campaignCustom")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("campaignType") === "custom" && (
                      <FormField
                        control={form.control}
                        name="customCampaign"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("posterDesignCustomCampaign")}</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-custom-campaign" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div>
                      <Label>{t("posterDesignReferenceImage")}</Label>
                      <Input
                        ref={referenceInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setReferenceImage(file);
                        }}
                        data-testid="input-reference-image"
                        className="mt-2"
                      />
                      {referenceImage && (
                        <div className="mt-2">
                          <img
                            src={URL.createObjectURL(referenceImage)}
                            alt="Reference"
                            className="w-32 h-32 object-cover rounded"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setReferenceImage(null);
                              if (referenceInputRef.current) {
                                referenceInputRef.current.value = "";
                              }
                            }}
                            data-testid="button-remove-reference"
                          >
                            Remove
                          </Button>
                        </div>
                      )}
                    </div>

                    {referenceImage && (
                      <FormField
                        control={form.control}
                        name="referenceLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("posterDesignReferenceLevel")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="layout-only">{t("refLevelLayoutOnly")}</SelectItem>
                                <SelectItem value="layout-color">{t("refLevelLayoutColor")}</SelectItem>
                                <SelectItem value="loose-inspiration">{t("refLevelLooseInspiration")}</SelectItem>
                                <SelectItem value="custom">{t("campaignCustom")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* Module B: Visual Style & Layout */}
                <AccordionItem value="module-b">
                  <AccordionTrigger className="text-lg font-semibold">
                    {t("posterDesignModuleB")}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="visualStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("posterDesignVisualStyle")} *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-visual-style">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="fresh-drink">{t("styleFreshDrink")}</SelectItem>
                              <SelectItem value="cute-3d">{t("styleCute3d")}</SelectItem>
                              <SelectItem value="premium-minimal">{t("stylePremiumMinimal")}</SelectItem>
                              <SelectItem value="taobao-promo">{t("styleTaobaoPromo")}</SelectItem>
                              <SelectItem value="natural-lifestyle">{t("styleNaturalLifestyle")}</SelectItem>
                              <SelectItem value="custom">{t("campaignCustom")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="backgroundScene"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("posterDesignBackgroundScene")} *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="gradient">{t("bgGradient")}</SelectItem>
                              <SelectItem value="studio-tabletop">{t("bgStudioTabletop")}</SelectItem>
                              <SelectItem value="outdoor-nature">{t("bgOutdoorNature")}</SelectItem>
                              <SelectItem value="urban">{t("bgUrban")}</SelectItem>
                              <SelectItem value="indoor-lifestyle">{t("bgIndoorLifestyle")}</SelectItem>
                              <SelectItem value="custom">{t("campaignCustom")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="layout"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("posterDesignLayout")} *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="single-centered">{t("layoutSingleCentered")}</SelectItem>
                              <SelectItem value="product-number">{t("layoutProductNumber")}</SelectItem>
                              <SelectItem value="left-right-split">{t("layoutLeftRightSplit")}</SelectItem>
                              <SelectItem value="top-bottom-split">{t("layoutTopBottomSplit")}</SelectItem>
                              <SelectItem value="grid-collage">{t("layoutGridCollage")}</SelectItem>
                              <SelectItem value="custom">{t("campaignCustom")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="aspectRatio"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("posterDesignAspectRatio")} *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1:1">{t("posterAspectRatioSquare")}</SelectItem>
                              <SelectItem value="9:16">{t("posterAspectRatioPortrait")}</SelectItem>
                              <SelectItem value="16:9">{t("posterAspectRatioLandscape")}</SelectItem>
                              <SelectItem value="4:3">{t("posterAspectRatio43")}</SelectItem>
                              <SelectItem value="3:4">{t("posterAspectRatio34")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="outputQuantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("posterDesignOutputQuantityLabel")} *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-output-quantity">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">1</SelectItem>
                              <SelectItem value="2">2</SelectItem>
                              <SelectItem value="4">4</SelectItem>
                              <SelectItem value="8">8</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* Module C: Copy & Elements */}
                <AccordionItem value="module-c">
                  <AccordionTrigger className="text-lg font-semibold">
                    {t("posterDesignModuleC")}
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="headlineStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("posterDesignHeadlineStyle")} *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="emotional">{t("headlineEmotional")}</SelectItem>
                              <SelectItem value="benefit-focused">{t("headlineBenefitFocused")}</SelectItem>
                              <SelectItem value="price-focused">{t("headlinePriceFocused")}</SelectItem>
                              <SelectItem value="brand-story">{t("campaignBrandStory")}</SelectItem>
                              <SelectItem value="custom">{t("campaignCustom")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="autoGenerateHeadline"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>{t("autoGenerateHeadline")}</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    {!form.watch("autoGenerateHeadline") && (
                      <FormField
                        control={form.control}
                        name="customHeadline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("posterDesignCustomHeadline")}</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder={t("placeholderEnterHeadline")} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <div className="space-y-2">
                      <Label>{t("posterDesignSellingPoints")}</Label>
                      <FormField
                        control={form.control}
                        name="autoGenerateSellingPoints"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                            <div className="space-y-1 leading-none">
                              <FormLabel>{t("autoGenerateSellingPoints")}</FormLabel>
                            </div>
                          </FormItem>
                        )}
                      />
                      
                      {!form.watch("autoGenerateSellingPoints") && (
                        <>
                          <FormField
                            control={form.control}
                            name="sellingPoint1"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} placeholder={t("placeholderSellingPoint1")} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="sellingPoint2"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} placeholder={t("placeholderSellingPoint2")} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="sellingPoint3"
                            render={({ field }) => (
                              <FormItem>
                                <FormControl>
                                  <Input {...field} placeholder={t("placeholderSellingPoint3")} />
                                </FormControl>
                              </FormItem>
                            )}
                          />
                        </>
                      )}
                    </div>

                    <FormField
                      control={form.control}
                      name="priceStyle"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("posterDesignPriceStyle")}</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="big-price">{t("priceBigPrice")}</SelectItem>
                              <SelectItem value="original-discounted">{t("priceOriginalDiscounted")}</SelectItem>
                              <SelectItem value="coupon">{t("priceCoupon")}</SelectItem>
                              <SelectItem value="no-price">{t("priceNoPrice")}</SelectItem>
                              <SelectItem value="custom">{t("campaignCustom")}</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch("priceStyle") && form.watch("priceStyle") !== "no-price" && (
                      <>
                        <FormField
                          control={form.control}
                          name="originalPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("posterDesignOriginalPrice")}</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="$99.99" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="currentPrice"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("posterDesignCurrentPrice")}</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="$49.99" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="discountText"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t("posterDesignDiscountText")}</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="50% OFF" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    <div>
                      <Label>{t("posterDesignLogoImage")}</Label>
                      <Input
                        ref={logoInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) setLogoImage(file);
                        }}
                        data-testid="input-logo-image"
                        className="mt-2"
                      />
                      {logoImage && (
                        <div className="mt-2">
                          <img
                            src={URL.createObjectURL(logoImage)}
                            alt="Logo"
                            className="w-24 h-24 object-contain rounded"
                          />
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setLogoImage(null);
                              if (logoInputRef.current) {
                                logoInputRef.current.value = "";
                              }
                            }}
                          >
                            {t("buttonRemove")}
                          </Button>
                        </div>
                      )}
                    </div>

                    {logoImage && (
                      <FormField
                        control={form.control}
                        name="logoPosition"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t("posterDesignLogoPosition")}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="top-left">{t("logoTopLeft")}</SelectItem>
                                <SelectItem value="top-right">{t("logoTopRight")}</SelectItem>
                                <SelectItem value="bottom-left">{t("logoBottomLeft")}</SelectItem>
                                <SelectItem value="bottom-right">{t("logoBottomRight")}</SelectItem>
                                <SelectItem value="center">{t("logoCenter")}</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="brandTagline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("posterDesignBrandTagline")}</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder={t("placeholderBrandTagline")} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <Button
                type="submit"
                className="w-full"
                disabled={generateMutation.isPending}
                data-testid="button-generate-poster"
              >
                {generateMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("posterDesignGenerating")}
                  </>
                ) : (
                  t("posterDesignGenerate")
                )}
              </Button>
            </form>
          </Form>
        </div>

        {/* Right Column: Generated Poster */}
        <div className="space-y-4">
          <Card className="min-h-[600px] flex items-center justify-center">
            <CardContent className="pt-6">
              {generatedPoster ? (
                <div className="space-y-4">
                  <img
                    src={generatedPoster}
                    alt="Generated Poster"
                    className="max-w-full rounded-lg shadow-lg cursor-pointer"
                    data-testid="img-generated-poster"
                  />
                  <Button
                    onClick={downloadPoster}
                    className="w-full"
                    data-testid="button-download-poster"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {t("posterDesignDownload")}
                  </Button>
                </div>
              ) : (
                <div className="text-center text-muted-foreground p-8">
                  <Upload className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>{t("posterDesignNoPreview")}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
