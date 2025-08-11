import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

interface Category {
  id: string;
  code: string;
  name: string;
  icon: string;
  description?: string;
}

interface CategoryGridProps {
  selectedCategory: string | null;
  onCategorySelect: (category: string) => void;
}

const iconMap: Record<string, string> = {
  "mobile-alt": "📱",
  "wifi": "📶",
  "bolt": "⚡",
  "tint": "💧",
  "heart": "❤️",
  "gamepad": "🎮",
};

export default function CategoryGrid({ selectedCategory, onCategorySelect }: CategoryGridProps) {
  const { data: categories, isLoading, error } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    retry: 2,
    retryDelay: 1000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
        <p className="text-neutral-light">Mengambil data kategori dari API Indotel...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-red-800 mb-2">Koneksi API Bermasalah</h3>
          <p className="text-red-600 mb-4">
            Tidak dapat terhubung ke server Indotel untuk mengambil data kategori produk.
          </p>
          <p className="text-sm text-red-500">
            Silakan coba refresh halaman atau hubungi administrator jika masalah berlanjut.
          </p>
        </div>
      </div>
    );
  }

  if (!categories?.length) {
    return (
      <div className="text-center py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Kategori Kosong</h3>
          <p className="text-yellow-600">Tidak ada kategori produk yang tersedia saat ini.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
      {categories.map((category) => (
        <Card
          key={category.id}
          className={`cursor-pointer transition-all hover:shadow-lg ${
            selectedCategory === category.code 
              ? "ring-2 ring-primary border-primary" 
              : "border-gray-200"
          }`}
          onClick={() => onCategorySelect(category.code)}
          data-testid={`category-card-${category.code}`}
        >
          <CardContent className="p-4 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <span className="text-xl">
                {iconMap[category.icon] || "📋"}
              </span>
            </div>
            <h4 className="text-sm font-semibold text-neutral">{category.name}</h4>
            {category.description && (
              <p className="text-xs text-neutral-light mt-1">{category.description}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
