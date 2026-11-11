import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const STATUS_STYLES = {
  success: "bg-green-500/15 text-green-500",
  partial: "bg-yellow-500/15 text-yellow-500",
  failed: "bg-red-500/15 text-red-500",
};

export function HistorySheet() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function loadHistory() {
    setLoading(true);
    setError("");

    axios
      .get(import.meta.env.VITE_API_URL + "/history")
      .then(function (res) {
        if (res.data.success) {
          setRecords(res.data.records);
        } else {
          setError("Could not load history.");
        }
      })
      .catch(function () {
        setError("Could not load history. Is the server running?");
      })
      .finally(function () {
        setLoading(false);
      });
  }

  function handleOpenChange(isOpen) {
    if (isOpen) {
      loadHistory();
    }
  }

  return (
    <Sheet onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={
          <Button variant="outline" className="w-full hover:cursor-pointer" />
        }
      >
        View history
      </SheetTrigger>

      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Sent mail history</SheetTitle>
          <SheetDescription>
            Your latest sends. Recipient addresses are never shown here.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4 pb-4">
          {loading && <p className="text-sm">Loading...</p>}
          {error && <p className="text-sm text-red-500">{error}</p>}
          {!loading && !error && records.length === 0 && (
            <p className="text-sm text-muted-foreground">No mails sent yet.</p>
          )}

          {records.map(function (record) {
            return (
              <div key={record._id} className="rounded-lg border p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium break-words">{record.subject}</p>
                  <span
                    className={
                      "shrink-0 rounded px-2 py-0.5 text-xs " +
                      STATUS_STYLES[record.status]
                    }
                  >
                    {record.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {record.sentCount} sent, {record.failedCount} failed (
                  {record.totalCount} total)
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(record.createdAt).toLocaleString()}
                </p>
              </div>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}