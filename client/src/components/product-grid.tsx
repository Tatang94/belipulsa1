import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Product {
  id: string;
  code: string;
  name: string;
  categoryCode: string;
  operator?: string;
  price: number;
  description?: string;
  type: string;
  isActive: boolean;
}

interface ProductGridProps {
  selectedCategory: string | null;
  productType: string;
  onProductTypeChange: (type: string) => void;
  onProductSelect: (product: Product) => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

export default function ProductGrid({ 
  selectedCategory, 
  productType, 
  onProductTypeChange, 
  onProductSelect 
}: ProductGridProps) {
  const { data: products, isLoading } = useQuery<Product[]>({
    queryKey: ["/api/products", { category: selectedCategory, type: productType }],
    enabled: !!selectedCategory,
  });

  if (!selectedCategory) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-light">Pilih kategori untuk melihat produk</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-light">Tidak ada produk tersedia untuk kategori ini</p>
      </div>
    );
  }

  return (
    <section className="py-8 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-neutral">
            Produk {selectedCategory}
          </h3>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-neutral-light">Tipe:</label>
            <Select value={productType} onValueChange={onProductTypeChange}>
              <SelectTrigger className="w-32" data-testid="select-product-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="PRABAYAR">Prabayar</SelectItem>
                <SelectItem value="PASCABAYAR">Pascabayar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card
              key={product.id}
              className="cursor-pointer border border-gray-200 hover:border-primary transition-colors"
              onClick={() => onProductSelect(product)}
              data-testid={`product-card-${product.code}`}
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <span className="text-green-600">📱</span>
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral">{product.name}</h4>
                      {product.operator && (
                        <p className="text-sm text-neutral-light">{product.operator}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-primary">
                      {formatPrice(product.price)}
                    </p>
                    <p className="text-xs text-neutral-light">Harga jual</p>
                  </div>
                </div>
                {product.description && (
                  <div className="bg-bg-light rounded-lg p-3">
                    <p className="text-sm text-neutral-light mb-2">Detail Produk:</p>
                    <p className="text-sm text-neutral">{product.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
