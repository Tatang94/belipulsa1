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
  const { data: products, isLoading, error } = useQuery<Product[]>({
    queryKey: ["/api/products", selectedCategory, productType],
    queryFn: async () => {
      const response = await fetch(`/api/products?category=${selectedCategory}&type=${productType}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!selectedCategory,
    retry: 2,
    retryDelay: 1000,
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
      <div className="flex flex-col justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-neutral-light">Mengambil data produk dari API Indotel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Koneksi API Bermasalah</h3>
          <p className="text-red-600 mb-4">
            Tidak dapat mengambil produk {selectedCategory} dari server Indotel.
          </p>
          <p className="text-sm text-red-500">
            Silakan coba pilih kategori lain atau refresh halaman.
          </p>
        </div>
      </div>
    );
  }

  if (!products?.length) {
    return (
      <div className="text-center py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Produk Kosong</h3>
          <p className="text-yellow-600">
            Tidak ada produk {productType.toLowerCase()} tersedia untuk kategori {selectedCategory}.
          </p>
        </div>
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
                      <div className="flex items-center space-x-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono">
                          {product.code}
                        </span>
                        {product.operator && (
                          <p className="text-sm text-neutral-light">{product.operator}</p>
                        )}
                      </div>
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
