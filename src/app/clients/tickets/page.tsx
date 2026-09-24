"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  LifeBuoy,
  Search,
  MessageSquare,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
} from "lucide-react";

interface TicketVM {
  id: string;
  ticketNumber: string;
  client: string;
  pet: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  time: string;
}

export default function ClientTicketsPage() {
  const [tickets, setTickets] = useState<TicketVM[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const [selectedTicket, setSelectedTicket] = useState<TicketVM | null>(null);
  const [replyText, setReplyText] = useState("");

  const loadTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/clients/tickets");
      const data = await res.json();
      setTickets(data.tickets || []);
    } catch (err) {
      console.error("Failed to load client tickets:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket || isSending) return;

    setIsSending(true);
    try {
      const res = await fetch(`/api/clients/tickets/${selectedTicket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "RESOLVED" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send reply");

      setTickets((prev) =>
        prev.map((t) =>
          t.id === selectedTicket.id ? { ...t, status: data.ticket.status } : t
        )
      );
      setSelectedTicket(null);
      setReplyText("");
    } catch (err) {
      console.error(err);
      alert("تعذر إرسال الرد، حاول مرة أخرى.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Client Portal Support Tickets (تذاكر دعم واستفسارات العملاء)
            </h1>
            <Badge variant="brand" dot>Direct Client Chat</Badge>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Questions, post-op inquiries, and appointment requests submitted by pet owners via the client portal.
          </p>
        </div>
      </div>

      {/* Tickets Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : tickets.length === 0 ? (
        <Card className="p-8 text-center text-xs text-slate-400">
          No client tickets yet.
        </Card>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {tickets.map((tkt) => (
          <Card key={tkt.id} hoverEffect className="flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
                <span className="font-mono text-xs font-bold text-brand-700 dark:text-brand-400">
                  {tkt.ticketNumber}
                </span>
                <div className="flex items-center gap-1.5">
                  <Badge
                    variant={
                      tkt.priority === "HIGH" || tkt.priority === "URGENT"
                        ? "danger"
                        : tkt.priority === "MEDIUM"
                        ? "warning"
                        : "neutral"
                    }
                    className="text-[10px]"
                  >
                    {tkt.priority}
                  </Badge>
                  <Badge
                    variant={tkt.status === "RESOLVED" || tkt.status === "CLOSED" ? "success" : "brand"}
                    dot
                    className="text-[10px]"
                  >
                    {tkt.status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 mt-3 text-xs">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  {tkt.subject}
                </h4>
                <div className="text-slate-400">
                  Client: <span className="font-semibold text-slate-700 dark:text-slate-200">{tkt.client}</span> ({tkt.pet})
                </div>
                <p className="text-slate-600 dark:text-slate-300 line-clamp-3 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl border border-slate-100 dark:border-dark-border">
                  &ldquo;{tkt.message}&rdquo;
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-dark-border flex items-center justify-between text-xs">
              <span className="text-slate-400 text-[11px]">{tkt.time}</span>
              <Button
                size="sm"
                variant={tkt.status === "RESOLVED" ? "outline" : "primary"}
                onClick={() => setSelectedTicket(tkt)}
                className="h-7 text-xs px-3"
                leftIcon={<MessageSquare className="w-3.5 h-3.5" />}
              >
                {tkt.status === "RESOLVED" ? "View Reply" : "Reply to Client"}
              </Button>
            </div>
          </Card>
        ))}
      </div>
      )}

      {/* REPLY MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-dark-card rounded-3xl border border-slate-200 dark:border-dark-border p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-dark-border">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Reply to {selectedTicket.client} ({selectedTicket.ticketNumber})
                </h3>
                <p className="text-xs text-slate-400">{selectedTicket.subject}</p>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-slate-400 block mb-1">Client Message:</span>
              &ldquo;{selectedTicket.message}&rdquo;
            </div>

            <form onSubmit={handleReply} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Doctor / Clinic Reply (الرد الطبي على العميل) *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type your clinical guidance or confirmation here..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-dark-border text-xs text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  size="md"
                  variant="primary"
                  className="w-full font-bold shadow-md shadow-brand-700/20"
                  leftIcon={<Send className="w-4 h-4" />}
                  disabled={isSending}
                >
                  {isSending ? "Sending..." : "Send Reply via Portal & WhatsApp"}
                </Button>
                <Button
                  type="button"
                  size="md"
                  variant="outline"
                  onClick={() => setSelectedTicket(null)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
