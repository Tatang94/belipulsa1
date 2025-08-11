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
  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!categories?.length) {
    return (
      <div className="text-center py-8">
        <p className="text-neutral-light">Tidak ada kategori tersedia</p>
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
