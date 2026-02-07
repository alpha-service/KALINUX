import { useState, useEffect } from "react";
import { CreditCard, Banknote, Building2, Check, Calculator } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/hooks/useLanguage";

const PAYMENT_METHODS = [
  { id: "cash", key: "payment_cash", icon: Banknote },
  { id: "card", key: "payment_card", icon: CreditCard },
  { id: "bank_transfer", key: "payment_bank_transfer", icon: Building2 },
];

export default function PaymentModal({ open, onClose, total, onPaymentComplete }) {
  const { t } = useLanguage();
  const [selectedMethod, setSelectedMethod] = useState("cash");
  const [amountTendered, setAmountTendered] = useState("");
  const [payments, setPayments] = useState([]);

  // Pre-fill amount when modal opens
  useEffect(() => {
    if (open && total > 0) {
      setAmountTendered(total.toFixed(2));
    }
  }, [open, total]);

  const paidSoFar = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.max(0, total - paidSoFar);
  const change = selectedMethod === "cash" && parseFloat(amountTendered) > remaining 
    ? parseFloat(amountTendered) - remaining 
    : 0;

  const handleAddPayment = () => {
    const amount = parseFloat(amountTendered) || remaining;
    if (amount <= 0) return;

    const paymentAmount = Math.min(amount, remaining);
    setPayments(prev => [...prev, {
      method: selectedMethod,
      amount: paymentAmount,
      reference: null
    }]);
    setAmountTendered("");
  };

  const handleQuickCash = (value) => {
    setAmountTendered(value.toString());
  };

  const handleComplete = () => {
    // If no payments added yet, add the full amount (or tendered amount for cash)
    let finalPayments = [...payments];
    const amountToAdd = selectedMethod === "cash" && parseFloat(amountTendered) > 0 
      ? Math.min(parseFloat(amountTendered), remaining) 
      : remaining;
    
    if (finalPayments.length === 0 || (remaining > 0 && amountToAdd > 0)) {
      const paymentAmount = remaining > 0 ? amountToAdd : total;
      if (paymentAmount > 0) {
        finalPayments.push({
          method: selectedMethod,
          amount: paymentAmount,
          reference: null
        });
      }
    }
    
    // Ensure we always have at least one payment
    if (finalPayments.length === 0) {
      finalPayments = [{
        method: selectedMethod,
        amount: total,
        reference: null
      }];
    }
    
    onPaymentComplete(finalPayments);
    resetState();
  };

  const resetState = () => {
    setSelectedMethod("cash");
    setAmountTendered("");
    setPayments([]);
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const quickCashAmounts = [10, 20, 50, 100, 200];

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg" data-testid="payment-modal">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            {t('payment')}
          </DialogTitle>
          <DialogDescription>
            {t('amount')} {t('pay').toLowerCase()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Total Display */}
          <div className="bg-brand-navy text-white rounded-xl p-6 text-center">
            <p className="text-sm opacity-80 mb-1">TOTAL</p>
            <p className="text-4xl font-heading font-bold">€{total.toFixed(2)}</p>
            {paidSoFar > 0 && (
              <div className="mt-3 pt-3 border-t border-white/20 flex justify-between text-sm">
                <span>{t('status_paid')}: €{paidSoFar.toFixed(2)}</span>
                <span>{t('amount')} {t('remaining')?.toLowerCase() || 'reste'}: €{remaining.toFixed(2)}</span>
              </div>
            )}
          </div>

          {/* Payment Methods */}
          <div>
            <p className="text-sm font-medium mb-3">{t('actions')}</p>
            <div className="grid grid-cols-3 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.id}
                  className={`flex flex-col items-center justify-center p-4 rounded-lg border-2 transition-colors ${
                    selectedMethod === method.id
                      ? "border-brand-navy bg-brand-navy/5"
                      : "border-slate-200 hover:border-slate-300"
                  }`}
                  onClick={() => setSelectedMethod(method.id)}
                  data-testid={`payment-method-${method.id}`}
                >
                  <method.icon className={`w-6 h-6 mb-2 ${
                    selectedMethod === method.id ? "text-brand-navy" : "text-muted-foreground"
                  }`} />
                  <span className="text-xs font-medium text-center">{t(method.key)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Amount Input */}
          {selectedMethod === "cash" && (
            <div>
              <p className="text-sm font-medium mb-3">{t('amount')} {t('status_accepted').toLowerCase()}</p>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-muted-foreground">€</span>
                <Input
                  type="number"
                  placeholder={remaining.toFixed(2)}
                  value={amountTendered}
                  onChange={(e) => setAmountTendered(e.target.value)}
                  className="pl-8 h-14 text-2xl font-bold text-right"
                  data-testid="amount-tendered"
                />
              </div>

              {/* Quick Cash Buttons */}
              <div className="flex gap-2 mt-3 flex-wrap">
                {quickCashAmounts.map((amount) => (
                  <Button
                    key={amount}
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickCash(amount)}
                    className="flex-1"
                  >
                    €{amount}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickCash(remaining)}
                  className="flex-1 bg-slate-100"
                >
                  {t('confirm')}
                </Button>
              </div>

              {/* Change Display */}
              {change > 0 && (
                <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
                  <span className="text-green-800 font-medium">
                    {t('return')}
                  </span>
                  <span className="text-2xl font-bold text-green-600">
                    €{change.toFixed(2)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Partial Payments List */}
          {payments.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">{t('payment')}</p>
              <div className="space-y-2">
                {payments.map((p, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-50 rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {t(PAYMENT_METHODS.find(m => m.id === p.method)?.key)}
                      </Badge>
                    </div>
                    <span className="font-bold">€{p.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              {remaining > 0 && (
                <Button
                  variant="outline"
                  className="w-full mt-3"
                  onClick={handleAddPayment}
                >
                  <Calculator className="w-4 h-4 mr-2" />
                  {t('add')} {t('payment').toLowerCase()}
                </Button>
              )}
            </div>
          )}
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={handleClose}>
            {t('cancel')}
          </Button>
          <Button
            className="flex-1 bg-brand-orange hover:bg-brand-orange/90"
            onClick={handleComplete}
            disabled={remaining > 0 && payments.length === 0 && !amountTendered}
            data-testid="confirm-payment-btn"
          >
            <Check className="w-4 h-4 mr-2" />
            {t('confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
