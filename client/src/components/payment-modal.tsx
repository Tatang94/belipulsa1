import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  customerNumber: string;
  transactionId: string;
  additionalData?: any;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

export default function PaymentModal({
  isOpen,
  onClose,
  product,
  customerNumber,
  transactionId,
  additionalData,
}: PaymentModalProps) {
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('paymentProof', file);
      
      const response = await fetch(`/api/transactions/${transactionId}/payment-proof`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Pembayaran Berhasil!",
        description: "Bukti pembayaran Anda telah diterima. Admin akan memverifikasi dalam 1-5 menit.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      onClose();
    },
    onError: () => {
      toast({
        title: "Gagal Upload",
        description: "Terjadi kesalahan saat mengupload bukti pembayaran.",
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB');
        return;
      }

      setPaymentProof(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const removeImage = () => {
    setPaymentProof(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  const handleSubmit = () => {
    if (!paymentProof) {
      alert('Mohon upload bukti pembayaran');
      return;
    }

    uploadMutation.mutate(paymentProof);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Pembayaran QRIS</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Summary */}
          <Card>
            <CardContent className="p-4">
              <h4 className="font-semibold text-neutral mb-3">Ringkasan Transaksi</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-neutral-light">Produk:</span>
                  <div className="text-right">
                    <div className="text-neutral">{product?.name}</div>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded font-mono">
                      {product?.code}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-light">Nomor:</span>
                  <span className="text-neutral">{customerNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-light">ID Transaksi:</span>
                  <span className="text-neutral font-mono">{transactionId}</span>
                </div>
                <hr className="my-3" />
                <div className="flex justify-between font-bold">
                  <span className="text-neutral">Total Bayar:</span>
                  <span className="text-primary text-lg">
                    {product ? formatPrice(product.price) : 'Rp 0'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* QRIS Code Placeholder */}
          <div className="text-center">
            <div className="bg-gray-100 w-48 h-48 mx-auto rounded-xl flex items-center justify-center mb-4">
              <div className="text-center">
                <div className="text-6xl mb-2">⬚</div>
                <p className="text-sm text-neutral-light">QR Code QRIS</p>
              </div>
            </div>
            <p className="text-sm text-neutral-light">Scan QR Code dengan aplikasi pembayaran favorit Anda</p>
          </div>

          {/* Upload Payment Proof */}
          <div className="space-y-4">
            <h4 className="font-semibold text-neutral">Upload Bukti Pembayaran</h4>
            
            {!previewUrl ? (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  id="paymentProof"
                  data-testid="input-payment-proof"
                />
                <Label htmlFor="paymentProof" className="cursor-pointer">
                  <div className="text-4xl mb-3">📷</div>
                  <p className="text-neutral-light">Klik untuk upload foto bukti pembayaran</p>
                  <p className="text-xs text-neutral-light mt-1">Format: JPG, PNG (Max: 5MB)</p>
                </Label>
              </div>
            ) : (
              <div>
                <img 
                  src={previewUrl} 
                  alt="Preview" 
                  className="w-full rounded-xl"
                  data-testid="image-preview"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={removeImage}
                  className="mt-2 text-accent hover:text-accent"
                  data-testid="button-remove-image"
                >
                  🗑️ Hapus gambar
                </Button>
              </div>
            )}

            <Button
              className="w-full bg-secondary text-white hover:bg-secondary/90"
              onClick={handleSubmit}
              disabled={!paymentProof || uploadMutation.isPending}
              data-testid="button-submit-payment"
            >
              {uploadMutation.isPending ? "Mengupload..." : "✅ Konfirmasi Pembayaran"}
            </Button>

            <div className="text-center">
              <p className="text-xs text-neutral-light">
                Transaksi akan diproses setelah bukti pembayaran diverifikasi admin
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
