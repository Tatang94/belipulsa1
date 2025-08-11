import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import CategoryGrid from "@/components/category-grid";
import ProductGrid from "@/components/product-grid";
import TransactionModal from "@/components/transaction-modal";
import PaymentModal from "@/components/payment-modal";
import { Link } from "wouter";

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

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [productType, setProductType] = useState("PRABAYAR");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [transactionData, setTransactionData] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/transactions", data);
      return response.json();
    },
    onSuccess: (transaction) => {
      setTransactionData(transaction);
      setShowPaymentModal(true);
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
    onError: () => {
      toast({
        title: "Gagal membuat transaksi",
        description: "Terjadi kesalahan saat membuat transaksi.",
        variant: "destructive",
      });
    },
  });

  const handleCategorySelect = (categoryCode: string) => {
    setSelectedCategory(categoryCode);
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setShowTransactionModal(true);
  };

  const handleInquiry = (customerNumber: string, additionalData?: any) => {
    // TODO: Implement inquiry logic with Indotel API
    toast({
      title: "Inquiry Berhasil",
      description: "Tagihan ditemukan. Silakan lanjutkan pembayaran.",
    });
  };

  const handleDirectPayment = (customerNumber: string, additionalData?: any) => {
    if (!selectedProduct) return;

    const transactionData = {
      productCode: selectedProduct.code,
      productName: selectedProduct.name,
      customerId: customerNumber,
      customerNumber: customerNumber,
      price: selectedProduct.price,
      totalPrice: selectedProduct.price,
      ...additionalData,
    };

    createTransactionMutation.mutate(transactionData);
    setShowTransactionModal(false);
  };

  return (
    <div className="min-h-screen bg-bg-light">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-white text-xl">⚡</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-neutral">PPOB Indonesia</h1>
                <p className="text-xs text-neutral-light">Bayar Mudah, Cepat & Terpercaya</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/admin">
                <Button 
                  variant="outline" 
                  className="hidden md:flex items-center space-x-2"
                  data-testid="button-admin"
                >
                  🛡️ Admin
                </Button>
              </Link>
              <div className="flex items-center space-x-2 bg-secondary text-white px-3 py-2 rounded-lg">
                <span>💰</span>
                <span className="text-sm font-medium">Rp 0</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-r from-primary to-blue-600 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Bayar Semua Tagihan dalam Satu Tempat
          </h2>
          <p className="text-lg md:text-xl opacity-90 mb-6">
            Pulsa, Data, PLN, PDAM, dan masih banyak lagi. Tanpa ribet, tanpa daftar!
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <span>✅</span>
              <span>Tanpa Registrasi</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>✅</span>
              <span>Pembayaran QRIS</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>✅</span>
              <span>Proses Otomatis</span>
            </div>
          </div>
        </div>
      </section>

      {/* Product Categories */}
      <section className="py-8">
        <div className="container mx-auto px-4">
          <h3 className="text-2xl font-bold text-neutral mb-6">Pilih Kategori Produk</h3>
          <CategoryGrid
            selectedCategory={selectedCategory}
            onCategorySelect={handleCategorySelect}
          />
        </div>
      </section>

      {/* Product List */}
      {selectedCategory && (
        <ProductGrid
          selectedCategory={selectedCategory}
          productType={productType}
          onProductTypeChange={setProductType}
          onProductSelect={handleProductSelect}
        />
      )}

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        product={selectedProduct}
        onInquiry={handleInquiry}
        onDirectPayment={handleDirectPayment}
      />

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        product={selectedProduct}
        customerNumber={transactionData?.customerNumber || ""}
        transactionId={transactionData?.transactionId || ""}
        additionalData={transactionData}
      />

      {/* Footer */}
      <footer className="bg-neutral text-white py-12 mt-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-white text-xl">⚡</span>
                </div>
                <div>
                  <h4 className="text-lg font-bold">PPOB Indonesia</h4>
                </div>
              </div>
              <p className="text-gray-300 text-sm">
                Platform pembayaran online terpercaya untuk semua kebutuhan PPOB Anda. 
                Bayar mudah, cepat, dan aman.
              </p>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Layanan</h5>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>📱 Pulsa & Paket Data</li>
                <li>⚡ Token PLN</li>
                <li>💧 Tagihan PDAM</li>
                <li>❤️ BPJS Kesehatan</li>
                <li>🎮 Voucher Game</li>
              </ul>
            </div>
            
            <div>
              <h5 className="font-semibold mb-4">Keunggulan</h5>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>✅ Tanpa Registrasi</li>
                <li>✅ Pembayaran QRIS</li>
                <li>✅ Proses Otomatis</li>
                <li>✅ Support 24/7</li>
                <li>✅ Harga Kompetitif</li>
              </ul>
            </div>
          </div>
          
          <hr className="my-8 border-gray-600" />
          
          <div className="text-center text-sm text-gray-300">
            <p>&copy; 2024 PPOB Indonesia. Semua hak dilindungi. Powered by Indotel API.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
