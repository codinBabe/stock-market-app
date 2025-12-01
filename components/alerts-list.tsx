"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pen, Trash } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import AlertDialog from "./alert-dialog";
import { deleteAlert, updateAlert } from "@/lib/actions/alert.actions";
import ConfirmDelete from "./confirm-delete";

const AlertsList = ({
  id,
  symbol,
  company,
  logo,
  alertName,
  currentPrice,
  alertType,
  frequency,
  threshold,
  changePercent,
}: Alert) => {
  const router = useRouter();
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [targetDeleteId, setTargetDeleteId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const onEdit = async (a: Alert) => {
    setEditingAlert(a);
    setIsDialogOpen(true);
  };

  const onCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingAlert(null);
  };

  const startDelete = (id?: string) => {
    if (!id) return;
    setTargetDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (!targetDeleteId) return;
    try {
      setDeletingId(targetDeleteId);
      await deleteAlert(targetDeleteId);
      router.refresh();
    } catch (e) {
      console.error("Failed to delete alert", e);
    } finally {
      setDeletingId(null);
      setTargetDeleteId(null);
    }
  };

  return (
    <div className="alert-list">
      <div className="alert-item">
        {/* Left side */}
        <div className="alert-details">
          <div className="flex items-center gap-4">
            {/* Company Logo */}
            <Avatar className="h-9 w-9 rounded">
              <AvatarImage src={logo || ""} alt={company} />
              <AvatarFallback>
                <span className="text-xs text-gray-300 font-semibold">
                  {symbol?.slice(0, 2) || "??"}
                </span>
              </AvatarFallback>
            </Avatar>
            {/* Company Info */}
            <div>
              <p className="alert-name">{company}</p>
              <p className="alert-price">
                {Number.isFinite(currentPrice) ? `$${currentPrice}` : "--"}
              </p>
            </div>
          </div>

          {/* Alert details */}
          <div>
            <p className="alert-company">{symbol}</p>
            <p
              className={`text-sm font-medium ${
                (changePercent ?? 0) >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {(changePercent ?? 0) >= 0 ? "+" : ""}
              {changePercent !== null && changePercent !== undefined
                ? changePercent.toFixed(2)
                : "--"}
              %
            </p>
          </div>
        </div>

        {/* Right side */}
        <div>
          <div className="flex items-center justify-between">
            <p>Alert: </p>
            <div className="flex items-center">
              <Button
                className="alert-update-btn"
                onClick={() =>
                  onEdit({
                    id,
                    symbol,
                    company,
                    logo,
                    alertName,
                    currentPrice,
                    alertType,
                    frequency,
                    threshold,
                    changePercent,
                  })
                }
                title="Edit alert"
              >
                <Pen className="size-4" />
              </Button>
              <Button
                className="alert-delete-btn"
                onClick={() => startDelete(id)}
                disabled={deletingId === id}
                title="Delete alert"
              >
                <Trash className="size-4" />
              </Button>
            </div>
          </div>

          <div className="alert-actions">
            <p className="font-medium">
              {alertType === "upper" && "Price > "}
              {alertType === "lower" && "Price < "}
              {alertType === "cross" && "Price = "}${threshold}
            </p>

            <Button className="add-alert" size={"sm"}>
              {frequency === "1m" && "Once per minute"}
              {frequency === "1h" && "Once per hour"}
              {frequency === "1d" && "Once per day"}
            </Button>
          </div>
        </div>
      </div>

      {/* edit dialog (controlled) */}
      {editingAlert && (
        <AlertDialog
          open={isDialogOpen}
          setOpen={(v: boolean) => {
            if (!v) onCloseDialog();
            else setIsDialogOpen(true);
          }}
          action="edit"
          alertId={editingAlert.id}
          alertData={{
            symbol: editingAlert.symbol,
            company: editingAlert.company,
            alertName: editingAlert.alertName ?? "",
            alertType: editingAlert.alertType,
            frequency: editingAlert.frequency,
            threshold: String(editingAlert.threshold),
          }}
          price={
            Number.isFinite(editingAlert.currentPrice)
              ? editingAlert.currentPrice
              : undefined
          }
        />
      )}

      {/* delete confirmation dialog */}
      <ConfirmDelete
        open={deleteConfirmOpen}
        setOpen={(v: boolean) => {
          if (!v) setTargetDeleteId(null);
          setDeleteConfirmOpen(v);
        }}
        title="Delete Alert"
        description={`Are you sure you want to delete ${
          company ? `${company} (${symbol})` : "this"
        } alert? This cannot be undone.`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        onConfirm={confirmDelete}
      />
    </div>
  );
};

export default AlertsList;
