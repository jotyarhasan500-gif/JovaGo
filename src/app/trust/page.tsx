"use client";

import { useState } from "react";
import { Shield, Check, Circle, Mail, Phone, UserPlus } from "lucide-react";

const TRUST_TASKS = [
  { id: "verify-id", label: "Verify ID", points: 40 },
  { id: "link-linkedin", label: "Link LinkedIn", points: 20 },
  { id: "five-star-review", label: "Get 5-star review from buddy", points: 10 },
] as const;

const MAX_TRUST_SCORE = 100;

export interface EmergencyContact {
  id: string;
  type: "email" | "phone";
  value: string;
}

export default function TrustDashboardPage() {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [emergencyContacts, setEmergencyContacts] = useState<EmergencyContact[]>([]);
  const [newContactValue, setNewContactValue] = useState("");
  const [newContactType, setNewContactType] = useState<"email" | "phone">("email");

  const trustScore = TRUST_TASKS.reduce(
    (sum, t) => sum + (completedTasks.has(t.id) ? t.points : 0),
    0
  );
  const percentage = Math.min(100, (trustScore / MAX_TRUST_SCORE) * 100);

  const toggleTask = (id: string) => {
    setCompletedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addEmergencyContact = (e: React.FormEvent) => {
    e.preventDefault();
    const value = newContactValue.trim();
    if (!value) return;
    const type = newContactType;
    if (type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return;
    if (type === "phone" && value.length < 8) return;
    setEmergencyContacts((prev) => [
      ...prev,
      { id: `ec-${Date.now()}`, type, value },
    ]);
    setNewContactValue("");
  };

  const removeEmergencyContact = (id: string) => {
    setEmergencyContacts((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <div className="min-h-screen">
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-2 text-2xl font-semibold text-[#0a0a0a]">
          Trust Dashboard
        </h1>
        <p className="mb-8 text-sm text-[#737373]">
          Build your trust score so buddies feel safe traveling with you.
        </p>

        {/* Trust Meter */}
        <section className="mb-10 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Shield className="size-5 text-[#0066FF]" aria-hidden />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#737373]">
              Trust Meter
            </h2>
          </div>
          <div className="flex items-end gap-4">
            <div className="flex flex-col items-center">
              <span
                className="text-4xl font-bold tabular-nums text-[#0a0a0a]"
                aria-label={`Trust score ${trustScore} out of ${MAX_TRUST_SCORE}`}
              >
                {trustScore}
              </span>
              <span className="text-sm text-[#737373]">/ {MAX_TRUST_SCORE}</span>
            </div>
            <div className="flex-1">
              <div className="h-4 w-full overflow-hidden rounded-full bg-[#e5e7eb]">
                <div
                  className="h-full rounded-full bg-[#0066FF] transition-all duration-500 ease-out"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-[#737373]">
                Complete the tasks below to increase your score.
              </p>
            </div>
          </div>
        </section>

        {/* Tasks to increase score */}
        <section className="mb-10 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#737373]">
            Increase your score
          </h2>
          <ul className="space-y-3">
            {TRUST_TASKS.map((task) => {
              const done = completedTasks.has(task.id);
              return (
                <li key={task.id}>
                  <button
                    type="button"
                    onClick={() => toggleTask(task.id)}
                    className="flex w-full items-center gap-3 rounded-xl border border-[#0066FF]/10 bg-[#fafafa] px-4 py-3 text-left transition-colors hover:bg-[#0066FF]/5"
                  >
                    <span
                      className="flex shrink-0 items-center justify-center"
                      aria-hidden
                    >
                      {done ? (
                        <span className="flex size-6 items-center justify-center rounded-full bg-[#0066FF] text-white">
                          <Check className="size-3.5" />
                        </span>
                      ) : (
                        <Circle className="size-6 rounded-full border-2 border-[#a3a3a3] text-[#a3a3a3]" />
                      )}
                    </span>
                    <span
                      className={
                        done ? "text-[#737373] line-through" : "text-[#0a0a0a]"
                      }
                    >
                      {task.label}
                    </span>
                    <span className="ml-auto shrink-0 text-sm font-medium text-[#0066FF]">
                      +{task.points}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Emergency Contacts */}
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="mb-2 flex items-center gap-2">
            <UserPlus className="size-5 text-[#0066FF]" aria-hidden />
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#737373]">
              Emergency Contacts
            </h2>
          </div>
          <p className="mb-4 text-sm text-[#525252]">
            Add people to be notified automatically when you start a new trip
            with a buddy.
          </p>

          <form onSubmit={addEmergencyContact} className="mb-4 flex gap-2">
            <select
              value={newContactType}
              onChange={(e) =>
                setNewContactType(e.target.value as "email" | "phone")
              }
              className="rounded-lg border border-[#0066FF]/20 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#0066FF]/30"
              aria-label="Contact type"
            >
              <option value="email">Email</option>
              <option value="phone">Phone</option>
            </select>
            <input
              type={newContactType === "email" ? "email" : "tel"}
              value={newContactValue}
              onChange={(e) => setNewContactValue(e.target.value)}
              placeholder={
                newContactType === "email"
                  ? "friend@example.com"
                  : "+1 234 567 8900"
              }
              className="min-w-0 flex-1 rounded-lg border border-[#0066FF]/20 px-3 py-2 text-sm outline-none placeholder:text-[#737373] focus:ring-2 focus:ring-[#0066FF]/30"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-[#0066FF] px-4 py-2 text-sm font-medium text-white hover:bg-[#0052CC]"
            >
              Add
            </button>
          </form>

          {emergencyContacts.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[#0066FF]/20 bg-[#fafafa] py-6 text-center text-sm text-[#737373]">
              No emergency contacts yet. Add an email or phone number above.
            </p>
          ) : (
            <ul className="space-y-2">
              {emergencyContacts.map((contact) => (
                <li
                  key={contact.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[#0066FF]/10 bg-[#fafafa] px-4 py-3"
                >
                  <span className="flex items-center gap-2 text-sm text-[#525252]">
                    {contact.type === "email" ? (
                      <Mail className="size-4 text-[#737373]" />
                    ) : (
                      <Phone className="size-4 text-[#737373]" />
                    )}
                    {contact.value}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeEmergencyContact(contact.id)}
                    className="text-sm font-medium text-[#ef4444] hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
