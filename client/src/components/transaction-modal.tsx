import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

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

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onInquiry: (customerNumber: string, additionalData?: any) => void;
  onDirectPayment: (customerNumber: string, additionalData?: any) => void;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

export default function TransactionModal({
  isOpen,
  onClose,
  product,
  onInquiry,
  onDirectPayment,
}: TransactionModalProps) {
  const [customerNumber, setCustomerNumber] = useState("");
  const [periode, setPeriode] = useState("1");
  const [tahun, setTahun] = useState("");
  const [nominal, setNominal] = useState("");

  const handleInquiry = () => {
    if (!customerNumber) {
      alert("Mohon masukkan nomor pelanggan");
      return;
    }

    const additionalData: any = {};
    if (product?.categoryCode === "BPJS") {
      additionalData.periode = periode;
    }
    if (product?.categoryCode === "PBB") {
      additionalData.tahun = tahun;
    }
    if (product?.categoryCode === "KREDIT") {
      additionalData.nominal = nominal;
    }

    onInquiry(customerNumber, additionalData);
  };

  const handleDirectPayment = () => {
    if (!customerNumber) {
      alert("Mohon masukkan nomor pelanggan");
      return;
    }

    const additionalData: any = {};
    if (product?.categoryCode === "BPJS") {
      additionalData.periode = periode;
    }
    if (product?.categoryCode === "PBB") {
      additionalData.tahun = tahun;
    }
    if (product?.categoryCode === "KREDIT") {
      additionalData.nominal = nominal;
    }

    onDirectPayment(customerNumber, additionalData);
  };

  const showPeriode = product?.categoryCode === "BPJS";
  const showTahun = product?.categoryCode === "PBB";
  const showNominal = product?.categoryCode === "KREDIT";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Transaksi Baru</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product Info */}
          {product && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600">📱</span>
                  </div>
                  <div>
                    <h4 className="font-semibold text-neutral">{product.name}</h4>
                    {product.operator && (
                      <p className="text-sm text-neutral-light">{product.operator}</p>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-neutral-light">Harga:</span>
                  <span className="text-lg font-bold text-primary">
                    {formatPrice(product.price)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Customer Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="customerNumber">Nomor Pelanggan/HP</Label>
              <Input
                id="customerNumber"
                placeholder="Contoh: 08123456789"
                value={customerNumber}
                onChange={(e) => setCustomerNumber(e.target.value)}
                data-testid="input-customer-number"
              />
            </div>

            {/* Additional fields for specific products */}
            {showPeriode && (
              <div>
                <Label htmlFor="periode">Periode (untuk BPJS)</Label>
                <Select value={periode} onValueChange={setPeriode}>
                  <SelectTrigger data-testid="select-periode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Bulan</SelectItem>
                    <SelectItem value="2">2 Bulan</SelectItem>
                    <SelectItem value="3">3 Bulan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {showTahun && (
              <div>
                <Label htmlFor="tahun">Tahun (untuk PBB)</Label>
                <Input
                  id="tahun"
                  type="number"
                  placeholder="2024"
                  min="2020"
                  max="2030"
                  value={tahun}
                  onChange={(e) => setTahun(e.target.value)}
                  data-testid="input-tahun"
                />
              </div>
            )}

            {showNominal && (
              <div>
                <Label htmlFor="nominal">Nominal (minimal Rp 10.000)</Label>
                <Input
                  id="nominal"
                  type="number"
                  placeholder="10000"
                  min="10000"
                  value={nominal}
                  onChange={(e) => setNominal(e.target.value)}
                  data-testid="input-nominal"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleInquiry}
              data-testid="button-inquiry"
            >
              🔍 Cek Tagihan
            </Button>
            <Button
              className="w-full bg-primary text-white hover:bg-primary/90"
              onClick={handleDirectPayment}
              data-testid="button-direct-payment"
            >
              💳 Bayar Langsung
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
