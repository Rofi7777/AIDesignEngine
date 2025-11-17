import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LanguageSelector } from "@/components/LanguageSelector";
import Home from "./home";
import ModelTryOn from "./model-tryon";
import VirtualTryOn from "./virtual-tryon";
import EcommerceScene from "./ecommerce-scene";
import { useTranslation } from "@/contexts/LanguageContext";

export default function MainLayout() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-light tracking-wide">Craft AI Studio</h1>
              <p className="text-sm text-muted-foreground mt-1">Craft Design Ideas with AI</p>
            </div>
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* Main Content with Tabs */}
      <div className="max-w-7xl mx-auto px-8 py-8">
        <Tabs defaultValue="product-design" className="w-full">
          <TabsList className="grid w-full max-w-4xl mx-auto grid-cols-4 mb-8" data-testid="tabs-main">
            <TabsTrigger value="product-design" data-testid="tab-product-design">
              Product Design
            </TabsTrigger>
            <TabsTrigger value="model-tryon" data-testid="tab-model-tryon">
              Model Try-on
            </TabsTrigger>
            <TabsTrigger value="virtual-tryon" data-testid="tab-virtual-tryon">
              Virtual Try-on
            </TabsTrigger>
            <TabsTrigger value="ecommerce-scene" data-testid="tab-ecommerce-scene">
              E-commerce Scene
            </TabsTrigger>
          </TabsList>

          <TabsContent value="product-design">
            <Home />
          </TabsContent>

          <TabsContent value="model-tryon">
            <ModelTryOn />
          </TabsContent>

          <TabsContent value="virtual-tryon">
            <VirtualTryOn />
          </TabsContent>

          <TabsContent value="ecommerce-scene">
            <EcommerceScene />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
