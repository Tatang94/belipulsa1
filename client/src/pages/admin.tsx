import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, RefreshCw } from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Transaction {
  id: string;
  transactionId: string;
  productCode: string;
  productName: string;
  customerId: string;
  customerNumber: string;
  price: number;
  totalPrice: number;
  status: string;
  paymentProofUrl?: string;
  indotelRefId?: string;
  createdAt: string;
  updatedAt: string;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(price);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <Badge variant="outline" className="bg-yellow-100 text-yellow-800">Menunggu</Badge>;
    case 'processing':
      return <Badge variant="outline" className="bg-blue-100 text-blue-800">Diproses</Badge>;
    case 'success':
      return <Badge variant="outline" className="bg-green-100 text-green-800">Berhasil</Badge>;
    case 'rejected':
      return <Badge variant="outline" className="bg-red-100 text-red-800">Ditolak</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function AdminPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allTransactions, isLoading } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });

  const { data: pendingTransactions } = useQuery<Transaction[]>({
    queryKey: ["/api/transactions/pending"],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ transactionId, status }: { transactionId: string; status: string }) => {
      const response = await apiRequest("PATCH", `/api/transactions/${transactionId}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions/pending"] });
      toast({
        title: "Status Updated",
        description: "Status transaksi berhasil diupdate.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Gagal mengupdate status transaksi.",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (transactionId: string) => {
    updateStatusMutation.mutate({ transactionId, status: 'processing' });
  };

  const handleReject = (transactionId: string) => {
    updateStatusMutation.mutate({ transactionId, status: 'rejected' });
  };

  const pendingCount = pendingTransactions?.length || 0;
  const approvedToday = allTransactions?.filter(t => 
    t.status === 'success' && 
    new Date(t.updatedAt).toDateString() === new Date().toDateString()
  ).length || 0;
  const rejectedToday = allTransactions?.filter(t => 
    t.status === 'rejected' && 
    new Date(t.updatedAt).toDateString() === new Date().toDateString()
  ).length || 0;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-light">
      {/* Header */}
      <header className="bg-white shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Link href="/">
                <Button variant="outline" size="sm" data-testid="button-back-home">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Kembali
                </Button>
              </Link>
              <h1 className="text-xl font-bold text-neutral">Panel Admin - Verifikasi Transaksi</h1>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
                queryClient.invalidateQueries({ queryKey: ["/api/transactions/pending"] });
              }}
              data-testid="button-refresh"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* API Status Alert */}
        <div className="mb-6">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-amber-600">⚠️</span>
              <h4 className="font-semibold text-amber-800">Status API Indotel</h4>
            </div>
            <p className="text-sm text-amber-700 mb-3">
              API sudah terkonfigurasi tapi IP server perlu didaftarkan. IP saat ini: <strong>34.74.146.71</strong>
            </p>
            <div className="text-xs text-amber-600 space-y-1">
              <p>• Hubungi provider Indotel untuk mendaftarkan IP tersebut</p>
              <p>• Sementara transaksi akan diproses manual melalui panel admin ini</p>
              <p>• Setelah IP terdaftar, transaksi akan otomatis terproses</p>
            </div>
          </div>
        </div>

        {/* Admin Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 bg-yellow-100">
              <div className="flex items-center space-x-3">
                <div className="text-yellow-600 text-2xl">🕐</div>
                <div>
                  <p className="text-sm text-yellow-700">Menunggu Verifikasi</p>
                  <p className="text-2xl font-bold text-yellow-800" data-testid="text-pending-count">
                    {pendingCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 bg-green-100">
              <div className="flex items-center space-x-3">
                <div className="text-green-600 text-2xl">✅</div>
                <div>
                  <p className="text-sm text-green-700">Disetujui Hari Ini</p>
                  <p className="text-2xl font-bold text-green-800" data-testid="text-approved-count">
                    {approvedToday}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 bg-red-100">
              <div className="flex items-center space-x-3">
                <div className="text-red-600 text-2xl">❌</div>
                <div>
                  <p className="text-sm text-red-700">Ditolak Hari Ini</p>
                  <p className="text-2xl font-bold text-red-800" data-testid="text-rejected-count">
                    {rejectedToday}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transaction List */}
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-neutral">Transaksi Menunggu Verifikasi</h4>

          {!pendingTransactions?.length ? (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-neutral-light">Tidak ada transaksi yang menunggu verifikasi</p>
              </CardContent>
            </Card>
          ) : (
            pendingTransactions.map((transaction) => (
              <Card key={transaction.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Transaction Info */}
                    <div className="lg:col-span-2 space-y-3">
                      <div className="flex items-center justify-between">
                        <h5 className="font-semibold text-neutral">{transaction.transactionId}</h5>
                        {getStatusBadge(transaction.status)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-neutral-light">Produk</p>
                          <p className="text-sm text-neutral">{transaction.productName}</p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-light">Nomor Pelanggan</p>
                          <p className="text-sm text-neutral">{transaction.customerNumber}</p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-light">Total Bayar</p>
                          <p className="text-sm font-bold text-primary">
                            {formatPrice(transaction.totalPrice)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-neutral-light">Waktu</p>
                          <p className="text-sm text-neutral">
                            {formatDate(transaction.createdAt)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Payment Proof & Actions */}
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-neutral-light mb-2">Bukti Pembayaran</p>
                        {transaction.paymentProofUrl ? (
                          <img
                            src={transaction.paymentProofUrl}
                            alt="Bukti pembayaran"
                            className="w-full h-32 object-cover rounded-lg cursor-pointer hover:opacity-90"
                            data-testid={`image-payment-proof-${transaction.transactionId}`}
                          />
                        ) : (
                          <div className="w-full h-32 bg-gray-100 rounded-lg flex items-center justify-center">
                            <p className="text-sm text-gray-500">Belum ada bukti</p>
                          </div>
                        )}
                      </div>
                      
                      {transaction.paymentProofUrl && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            className="flex-1 bg-secondary text-white hover:bg-secondary/90"
                            onClick={() => handleApprove(transaction.transactionId)}
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-approve-${transaction.transactionId}`}
                          >
                            ✅ Setujui
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="flex-1"
                            onClick={() => handleReject(transaction.transactionId)}
                            disabled={updateStatusMutation.isPending}
                            data-testid={`button-reject-${transaction.transactionId}`}
                          >
                            ❌ Tolak
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
