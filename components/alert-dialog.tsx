"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createAlert, updateAlert } from "@/lib/actions/alert.actions";

type AddAlertDialogProps = {
  renderAs?: "button" | "icon" | "none";
  price?: number | null;
  availableStocks?: { symbol: string; name: string; price: number }[];
} & Partial<AlertModalProps>;

const AlertDialog = ({
  renderAs = "button",
  price,
  open,
  setOpen,
  alertData,
  availableStocks = [],
  action,
  alertId,
}: AddAlertDialogProps) => {
  const router = useRouter();

  const isControlled =
    typeof open === "boolean" && typeof setOpen === "function";

  const noSymbolSelected = !alertData?.symbol;

  // Selected stock (only used in sidebar flow)
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(
    alertData?.symbol ?? null
  );
  const [selectedCompany, setSelectedCompany] = useState<string | null>(
    alertData?.company ?? null
  );

  const [condition, setCondition] = useState<string>(() => {
    if (alertData) {
      return alertData.alertType === "upper"
        ? "gte"
        : alertData.alertType === "lower"
        ? "lte"
        : "cross";
    }
    return "gte";
  });

  const [target, setTarget] = useState<string>(() => {
    if (alertData?.threshold) return String(alertData.threshold);
    return price != null && !Number.isNaN(price) ? String(price) : "";
  });

  const [frequency, setFrequency] = useState(alertData?.frequency || "1m");

  const conditionLabel = useMemo(() => {
    switch (condition) {
      case "gte":
        return "Price above";
      case "lte":
        return "Price below";
      case "cross":
        return "Price equal";
      default:
        return "Condition";
    }
  }, [condition]);

  const handleSubmit = async () => {
    try {
      const symbol = alertData?.symbol ?? selectedSymbol;
      const company = alertData?.company ?? selectedCompany;

      const alertName = alertData?.alertName?.trim() || "Price Alert";
      const alertType: "upper" | "lower" | "cross" =
        condition === "lte" ? "lower" : condition === "gte" ? "upper" : "cross";

      const threshold = Number(target);

      if (!symbol || !company || !Number.isFinite(threshold)) return;

      const isEdit = action === "edit" && alertId;

      const data = {
        symbol,
        company,
        alertName,
        alertType,
        threshold,
        frequency,
        lastTriggered: null,
      };

      isEdit ? await updateAlert(alertId!, data) : await createAlert(data);
      if (isControlled) setOpen(false);
      router.refresh();
    } catch (e) {
      console.error("Submit alert failed", e);
    }
  };

  return (
    <Dialog {...(isControlled ? { open, onOpenChange: setOpen } : {})}>
      {!isControlled && renderAs !== "none" && (
        <DialogTrigger asChild>
          <Button
            className={renderAs === "button" ? "search-btn" : "add-alert"}
          >
            {renderAs === "button" ? "Create Alert" : "Add Alert"}
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="alert-dialog">
        <DialogHeader>
          <DialogTitle className="alert-title">
            {action === "edit" ? "Edit Price Alert" : "Create Price Alert"}
          </DialogTitle>
          <DialogDescription>
            {noSymbolSelected
              ? "Select a stock and set your alert conditions."
              : `Set a price alert for ${alertData?.company} (${alertData?.symbol}).`}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          {/* ---------------- STOCK SELECTOR (only in sidebar flow) ---------------- */}
          {noSymbolSelected && (
            <div className="grid grid-cols-3 items-center gap-3">
              <Label className="text-right">Stock</Label>
              <div className="col-span-2">
                <Select
                  value={selectedSymbol || ""}
                  onValueChange={(val) => {
                    const stock = availableStocks.find((s) => s.symbol === val);
                    setSelectedSymbol(val);
                    setSelectedCompany(stock?.name || null);
                    if (stock?.price) {
                      setTarget(String(stock.price));
                    }
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select stock" />
                  </SelectTrigger>
                  <SelectContent align="start">
                    {availableStocks.map((s) => (
                      <SelectItem key={s.symbol} value={s.symbol}>
                        {s.name} ({s.symbol})
                        <span className="text-gray-400">
                          {s.price != null ? `$${s.price.toFixed(2)}` : "--"}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* ---------------- CONDITION ---------------- */}
          <div className="grid grid-cols-3 items-center gap-3">
            <Label className="text-right">Condition</Label>
            <div className="col-span-2">
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="gte">Price &gt; target</SelectItem>
                  <SelectItem value="lte">Price &lt; target</SelectItem>
                  <SelectItem value="cross">Price = target</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* ---------------- TARGET PRICE ---------------- */}
          <div className="grid grid-cols-3 items-center gap-3">
            <Label className="text-right">{conditionLabel}</Label>
            <div className="col-span-2">
              <Input
                type="number"
                inputMode="decimal"
                placeholder={price ? String(price) : "Enter target price"}
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              />
            </div>
          </div>

          {/* ---------------- CURRENT PRICE (hidden when no stock selected) ---------------- */}
          {!noSymbolSelected && (
            <div className="grid grid-cols-3 items-center gap-3">
              <Label className="text-right">Current</Label>
              <div className="col-span-2 text-gray-300 font-medium">
                {price != null && !Number.isNaN(price) ? `$${price}` : "—"}
              </div>
            </div>
          )}

          {/* ---------------- FREQUENCY ---------------- */}
          <div className="grid grid-cols-3 items-center gap-3">
            <Label className="text-right">Check Frequency</Label>
            <div className="col-span-2">
              <Select
                value={frequency}
                onValueChange={(v) => setFrequency(v as "1m" | "1h" | "1d")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="How often?" />
                </SelectTrigger>
                <SelectContent align="start">
                  <SelectItem value="1m">Once per minute</SelectItem>
                  <SelectItem value="1h">Once per hour</SelectItem>
                  <SelectItem value="1d">Once per day</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="ghost">Cancel</Button>
          </DialogClose>
          <Button className="search-btn" onClick={handleSubmit}>
            {action === "edit" ? "Save Changes" : "Create Alert"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AlertDialog;
