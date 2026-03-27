"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Activity,
  Database,
  Users,
  FolderOpen,
  MapPin,
  Cloud,
  Shield,
  Trash2,
  UserCog,
  Ban,
  Send,
  RefreshCw,
  ExternalLink,
  Loader2,
  DollarSign,
  TrendingUp,
  CreditCard,
  UserMinus,
  UserCircle,
  Copy,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerBody } from "@/components/ui/drawer";
import {
  checkDatabaseHealth,
  getUsageAnalytics,
  getRevenueAnalytics,
  setUserRole,
  forceDeleteGroup,
  setBroadcastMessage as saveBroadcastMessage,
  resetAllCache,
  deleteUserProfile,
  getGroupsCountByUserId,
  banUserClerk,
  unbanUserClerk,
  type OwnerGroup,
  type OwnerUser,
  type RevenueAnalytics,
} from "@/app/actions/owner";
import { UpgradeUserButton } from "@/app/owner/upgrade-user-button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const cardBorder = "border border-cyan-500/20 border-indigo-500/10 shadow-lg shadow-cyan-500/5";
const cardBg = "bg-slate-900/80 backdrop-blur-sm";
const pageBg = "#020617";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

/** User row from /api/admin/users (Clerk + Supabase subscription status) */
type ApiAdminUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  emailAddresses: { emailAddress: string }[];
  imageUrl: string;
  createdAt: number;
  lastSignInAt: number | null;
  banned: boolean;
  role: string | null;
  subscription_tier: string | null;
  subscriptionStatus: string | null;
};

export type DisplayUser = OwnerUser & {
  subscriptionStatus: string | null;
  lastSignInAt: number | null;
  banned: boolean;
};

function mapApiUserToOwnerUser(u: ApiAdminUser): DisplayUser {
  const full_name = [u.firstName, u.lastName].filter(Boolean).join(" ").trim() || null;
  const email = u.emailAddresses?.[0]?.emailAddress ?? null;
  const ts = typeof u.createdAt === "number" ? u.createdAt : Date.now();
  const created_at = ts < 1e12 ? new Date(ts * 1000).toISOString() : new Date(ts).toISOString();
  return {
    id: u.id,
    full_name,
    email,
    avatar_url: u.imageUrl ?? null,
    role: u.role ?? null,
    subscription_tier: u.subscription_tier ?? null,
    created_at,
    subscriptionStatus: u.subscriptionStatus ?? null,
    lastSignInAt: u.lastSignInAt ?? null,
    banned: u.banned ?? false,
  };
}

const ACTIVE_DAYS_THRESHOLD = 30;
function getStatusFromUser(u: DisplayUser): "active" | "inactive" | "banned" {
  if (u.banned) return "banned";
  if (u.lastSignInAt == null) return "inactive";
  const ms = typeof u.lastSignInAt === "number" ? u.lastSignInAt : 0;
  const when = ms < 1e12 ? ms * 1000 : ms;
  const daysAgo = (Date.now() - when) / (24 * 60 * 60 * 1000);
  return daysAgo <= ACTIVE_DAYS_THRESHOLD ? "active" : "inactive";
}

function formatLastSignIn(lastSignInAt: number | null): string {
  if (lastSignInAt == null) return "Never";
  const ms = lastSignInAt < 1e12 ? lastSignInAt * 1000 : lastSignInAt;
  return new Date(ms).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Props = {
  groups: OwnerGroup[];
  users: OwnerUser[];
};

export function OwnerDashboard({ groups: initialGroups, users: initialUsers }: Props) {
  const router = useRouter();
  const [groups, setGroups] = useState(initialGroups);
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [profileSheetOpen, setProfileSheetOpen] = useState(false);
  const [profileUser, setProfileUser] = useState<DisplayUser | null>(null);
  const [profileGroupsCount, setProfileGroupsCount] = useState<number | null>(null);
  const [banLoading, setBanLoading] = useState<string | null>(null);
  const [dbHealthy, setDbHealthy] = useState<boolean | null>(null);
  const [apiUptime, setApiUptime] = useState<boolean | null>(null);
  const [analytics, setAnalytics] = useState<{
    totalGroups: number;
    activeUsers: number;
    mapApiHits: string;
    weatherApiHits: string;
  } | null>(null);
  const [revenueData, setRevenueData] = useState<RevenueAnalytics | null>(null);
  const [revenueLoading, setRevenueLoading] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState("");
  const [broadcastSending, setBroadcastSending] = useState(false);
  const [roleLoading, setRoleLoading] = useState<string | null>(null);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [cacheRefreshing, setCacheRefreshing] = useState(false);

  useEffect(() => {
    checkDatabaseHealth().then((r) => setDbHealthy(r.ok));
    getUsageAnalytics().then(setAnalytics);
    setApiUptime(true);
  }, []);

  const fetchUsersFromApi = useCallback(() => {
    setUsersLoading(true);
    fetch("/api/admin/users")
      .then((res) => {
        if (!res.ok)
          throw new Error(
            res.status === 403 ? "Forbidden" : res.status === 401 ? "Unauthorized" : "Failed to fetch users"
          );
        return res.json();
      })
      .then((data: ApiAdminUser[]) => {
        setUsers(data.map(mapApiUserToOwnerUser));
      })
      .catch((err) => {
        console.error("[OwnerDashboard] Failed to fetch admin users:", err);
        toast.error("Failed to load users from API.");
        setUsers(
          initialUsers.map((u) => ({
            ...u,
            subscriptionStatus: null,
            lastSignInAt: null,
            banned: false,
          }))
        );
      })
      .finally(() => {
        setUsersLoading(false);
      });
  }, [initialUsers]);

  useEffect(() => {
    fetchUsersFromApi();
  }, [fetchUsersFromApi]);

  const loadRevenueAnalytics = useCallback(() => {
    setRevenueLoading(true);
    getRevenueAnalytics().then((data) => {
      setRevenueData(data);
      setRevenueLoading(false);
    });
  }, []);

  useEffect(() => {
    loadRevenueAnalytics();
  }, [loadRevenueAnalytics]);

  const handleSetRole = async (userId: string, role: string) => {
    setRoleLoading(userId);
    const result = await setUserRole(userId, role);
    setRoleLoading(null);
    if (result.success) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role } : u)));
      toast.success("Role updated.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to set role.");
    }
  };

  const handleBan = async (userId: string) => {
    setRoleLoading(userId);
    const result = await setUserRole(userId, "banned");
    setRoleLoading(null);
    if (result.success) {
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, role: "banned" } : u)));
      toast.success("User banned.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to ban user.");
    }
  };

  const openProfileSheet = useCallback((u: DisplayUser) => {
    setProfileUser(u);
    setProfileSheetOpen(true);
    setProfileGroupsCount(null);
    getGroupsCountByUserId(u.id).then(setProfileGroupsCount);
  }, []);

  const handleBanUnbanClerk = async (userId: string, currentlyBanned: boolean) => {
    setBanLoading(userId);
    const result = currentlyBanned
      ? await unbanUserClerk(userId)
      : await banUserClerk(userId);
    setBanLoading(null);
    if (result.success) {
      toast.success(currentlyBanned ? "User unbanned." : "User banned.");
      fetchUsersFromApi();
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to update ban status.");
    }
  };

  const handleCopyUserId = (userId: string) => {
    navigator.clipboard.writeText(userId).then(
      () => toast.success("User ID copied to clipboard."),
      () => toast.error("Failed to copy.")
    );
  };

  const handleForceDeleteGroup = async (groupId: string) => {
    const result = await forceDeleteGroup(groupId);
    setDeleteGroupId(null);
    if (result.success) {
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      toast.success("Group deleted.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete group.");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const result = await deleteUserProfile(userId);
    setDeleteUserId(null);
    if (result.success) {
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      toast.success("User profile removed.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to delete user.");
    }
  };

  const handleBroadcast = async () => {
    setBroadcastSending(true);
    const result = await saveBroadcastMessage(broadcastMessage);
    setBroadcastSending(false);
    if (result.success) {
      toast.success("Broadcast message saved. (Add persistence for production.)");
    } else {
      toast.error(result.error ?? "Failed to save broadcast.");
    }
  };

  const handleRefreshCache = async () => {
    setCacheRefreshing(true);
    const result = await resetAllCache();
    setCacheRefreshing(false);
    if (result.success) {
      toast.success("Cache refreshed.");
      router.refresh();
    } else {
      toast.error(result.error ?? "Failed to refresh cache.");
    }
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "—";
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: pageBg }}>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex flex-wrap items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Owner Panel
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              System administration and platform oversight
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className={cn("border-cyan-500/30 text-cyan-400", cardBorder, cardBg)}
            onClick={handleRefreshCache}
            disabled={cacheRefreshing}
          >
            {cacheRefreshing ? (
              <Loader2 className="size-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="size-4" aria-hidden />
            )}
            <span className="ml-2">Refresh cache</span>
          </Button>
        </motion.div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList
            className={cn(
              "sticky top-0 z-10 mb-6 w-full justify-start rounded-none border-b border-slate-700/50 bg-slate-900/95 backdrop-blur-sm",
              "h-11 gap-0 p-0"
            )}
          >
            <TabsTrigger
              value="overview"
              className={cn(
                "rounded-none border-b-2 border-transparent px-5 py-3 text-slate-400 data-[active]:border-cyan-400 data-[active]:bg-transparent data-[active]:text-white",
                "hover:text-slate-200"
              )}
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="management"
              className={cn(
                "rounded-none border-b-2 border-transparent px-5 py-3 text-slate-400 data-[active]:border-cyan-400 data-[active]:bg-transparent data-[active]:text-white",
                "hover:text-slate-200"
              )}
            >
              Management
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className={cn(
                "rounded-none border-b-2 border-transparent px-5 py-3 text-slate-400 data-[active]:border-cyan-400 data-[active]:bg-transparent data-[active]:text-white",
                "hover:text-slate-200"
              )}
            >
              Analytics & Tools
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: Overview (The Command Center) */}
          <TabsContent value="overview" className="mt-0 space-y-8 border-0 outline-none">
            {/* Section A: System Administration & Health */}
            <section className="rounded-lg border border-slate-700/30 bg-slate-900/50 p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                System Administration & Health
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <Card className={cn(cardBorder, cardBg)}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                      <Database className="size-4 text-cyan-400" aria-hidden />
                      Database
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dbHealthy === null ? (
                      <Loader2 className="size-5 animate-spin text-slate-500" aria-hidden />
                    ) : dbHealthy ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                        <span className="size-2 rounded-full bg-emerald-400" aria-hidden />
                        Connected
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-red-400">Disconnected</span>
                    )}
                  </CardContent>
                </Card>
                <Card className={cn(cardBorder, cardBg)}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                      <Activity className="size-4 text-indigo-400" aria-hidden />
                      API Uptime
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {apiUptime === null ? (
                      <Loader2 className="size-5 animate-spin text-slate-500" aria-hidden />
                    ) : apiUptime ? (
                      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                        <span className="size-2 rounded-full bg-emerald-400" aria-hidden />
                        Operational
                      </span>
                    ) : (
                      <span className="text-sm font-medium text-red-400">Down</span>
                    )}
                  </CardContent>
                </Card>
                <Card className={cn(cardBorder, cardBg)}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                      <FolderOpen className="size-4 text-cyan-400" aria-hidden />
                      Total groups
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-white">
                      {analytics?.totalGroups ?? groups.length}
                    </p>
                  </CardContent>
                </Card>
                <Card className={cn(cardBorder, cardBg)}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                      <Users className="size-4 text-indigo-400" aria-hidden />
                      Active users
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-semibold text-white">
                      {usersLoading ? (
                        <Loader2 className="size-6 animate-spin text-slate-400" aria-hidden />
                      ) : (
                        users.length
                      )}
                    </p>
                  </CardContent>
                </Card>
              </div>
            </section>

            {/* Section B: Revenue Analytics */}
            <section className="rounded-lg border border-slate-700/30 bg-slate-900/50 p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Revenue Analytics
              </h2>
              <Card className={cn(cardBorder, cardBg)}>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-slate-100">
                    <DollarSign className="size-5 text-cyan-400" aria-hidden />
                    Revenue analytics
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Subscriptions and revenue metrics
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("border-cyan-500/30 text-cyan-400", cardBorder)}
                  onClick={loadRevenueAnalytics}
                  disabled={revenueLoading}
                >
                  {revenueLoading ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <RefreshCw className="size-4" aria-hidden />
                  )}
                  <span className="ml-2">Refresh</span>
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Metric cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <DollarSign className="size-4 text-cyan-400" aria-hidden />
                      <span className="text-xs font-medium uppercase tracking-wide">Total revenue</span>
                    </div>
                    <p className="mt-1 text-2xl font-semibold text-white">
                      {revenueData ? `$${revenueData.totalRevenue.toFixed(2)}` : "—"}
                    </p>
                  </div>
                  <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <TrendingUp className="size-4 text-indigo-400" aria-hidden />
                      <span className="text-xs font-medium uppercase tracking-wide">MRR</span>
                    </div>
                    <p className="mt-1 text-2xl font-semibold text-white">
                      {revenueData ? `$${revenueData.mrr.toFixed(2)}` : "—"}
                    </p>
                    <p className="text-xs text-slate-500">Monthly recurring revenue</p>
                  </div>
                  <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <CreditCard className="size-4 text-emerald-400" aria-hidden />
                      <span className="text-xs font-medium uppercase tracking-wide">Active subscriptions</span>
                    </div>
                    <p className="mt-1 text-2xl font-semibold text-white">
                      {revenueData?.activeSubscriptions ?? "—"}
                    </p>
                    <p className="text-xs text-slate-500">Pro / Enterprise</p>
                  </div>
                  <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
                    <div className="flex items-center gap-2 text-slate-400">
                      <UserMinus className="size-4 text-amber-400" aria-hidden />
                      <span className="text-xs font-medium uppercase tracking-wide">Churn rate</span>
                    </div>
                    <p className="mt-1 text-2xl font-semibold text-white">
                      {revenueData ? `${revenueData.churnRate}%` : "—"}
                    </p>
                    <p className="text-xs text-slate-500">Cancellations</p>
                  </div>
                </div>

                {/* Charts */}
                {revenueData && (
                  <>
                    <div>
                      <h4 className="mb-3 text-sm font-medium text-slate-300">Revenue growth (last 6 months)</h4>
                      <div className="h-[220px] w-full">
                        {revenueData.revenueGrowthLast6Months.length === 0 ||
                        revenueData.revenueGrowthLast6Months.every((d) => d.revenue === 0) ? (
                          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-600 bg-slate-800/30 text-sm text-slate-500">
                            No data recorded yet
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData.revenueGrowthLast6Months} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                              <defs>
                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.4} />
                                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.05} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                              <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} tickFormatter={(v) => `$${v}`} />
                              <Tooltip
                                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }}
                                labelStyle={{ color: "#e2e8f0" }}
                                formatter={(value) =>
                                  typeof value === "number"
                                    ? [`$${value.toFixed(2)}`, "Revenue"]
                                    : ["", "Revenue"]
                                }
                                labelFormatter={(label) => label}
                              />
                              <Area type="monotone" dataKey="revenue" stroke="#22d3ee" strokeWidth={2} fill="url(#revenueGradient)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-3 text-sm font-medium text-slate-300">New signups vs new subscriptions (per week)</h4>
                      <div className="h-[220px] w-full">
                        {revenueData.signupsVsSubscriptionsPerWeek.length === 0 ||
                        (revenueData.signupsVsSubscriptionsPerWeek.every((d) => d.signups === 0 && d.subscriptions === 0)) ? (
                          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-600 bg-slate-800/30 text-sm text-slate-500">
                            No data recorded yet
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={revenueData.signupsVsSubscriptionsPerWeek} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                              <XAxis dataKey="week" stroke="#94a3b8" fontSize={11} tickLine={false} />
                              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                              <Tooltip
                                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }}
                                labelStyle={{ color: "#e2e8f0" }}
                              />
                              <Legend />
                              <Bar dataKey="signups" name="Signups" fill="#22d3ee" radius={[4, 4, 0, 0]} />
                              <Bar dataKey="subscriptions" name="Subscriptions" fill="#6366f1" radius={[4, 4, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-3 text-sm font-medium text-slate-300">Plan distribution</h4>
                      <div className="h-[240px] w-full">
                        {revenueData.planDistribution.length === 0 ? (
                          <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-600 bg-slate-800/30 text-sm text-slate-500">
                            No data recorded yet
                          </div>
                        ) : (
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={revenueData.planDistribution}
                                dataKey="value"
                                nameKey="name"
                                cx="50%"
                                cy="50%"
                                outerRadius={80}
                                label={({ name, value }) => `${name}: ${value}`}
                              >
                                {revenueData.planDistribution.map((_, index) => (
                                  <Cell
                                    key={index}
                                    fill={["#94a3b8", "#22d3ee", "#6366f1", "#10b981"][index % 4]}
                                    stroke="#0f172a"
                                    strokeWidth={2}
                                  />
                                ))}
                              </Pie>
                              <Tooltip
                                contentStyle={{ backgroundColor: "#0f172a", border: "1px solid #334155", borderRadius: "8px" }}
                                formatter={(value, name) => [value ?? 0, name]}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        )}
                      </div>
                    </div>
                  </>
                )}
                {!revenueData && !revenueLoading && (
                  <p className="py-6 text-center text-sm text-slate-500">No revenue data. Click Refresh to load.</p>
                )}
              </CardContent>
            </Card>
            </section>
          </TabsContent>

          {/* Tab 2: Management (Operation Oversight) */}
          <TabsContent value="management" className="mt-0 space-y-8 border-0 outline-none">
            {/* Section A: Users Management */}
            <section className="rounded-lg border border-slate-700/30 bg-slate-900/50 p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Users Management
              </h2>
            <Card className={cn(cardBorder, cardBg)}>
              <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2 text-slate-100">
                    <Users className="size-5 text-cyan-400" aria-hidden />
                    Users management
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    User details from Clerk API; subscription status from Supabase (by clerk_id)
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className={cn("border-cyan-500/30 text-cyan-400", cardBorder)}
                  onClick={() => fetchUsersFromApi()}
                  disabled={usersLoading}
                >
                  {usersLoading ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <RefreshCw className="size-4" aria-hidden />
                  )}
                  <span className="ml-2">Refresh users</span>
                </Button>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="size-8 animate-spin text-slate-500" aria-hidden />
                  </div>
                ) : users.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">No users yet.</p>
                ) : (
                  <div className="overflow-x-auto rounded-lg border border-slate-700/50">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-slate-700/70 hover:bg-transparent">
                          <TableHead className="text-slate-400">User</TableHead>
                          <TableHead className="text-slate-400">Status</TableHead>
                          <TableHead className="text-slate-400">Email</TableHead>
                          <TableHead className="text-slate-400">Join date</TableHead>
                          <TableHead className="text-slate-400">Role</TableHead>
                          <TableHead className="text-slate-400">Subscription</TableHead>
                          <TableHead className="text-slate-400">Tier</TableHead>
                          <TableHead className="text-right text-slate-400">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((u) => {
                          const status = getStatusFromUser(u);
                          return (
                          <TableRow
                            key={u.id}
                            className="border-slate-700/70 hover:bg-slate-800/30"
                          >
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <Avatar className="size-9 border border-slate-600">
                                  <AvatarImage src={u.avatar_url ?? undefined} alt="" />
                                  <AvatarFallback className="bg-slate-700 text-xs text-slate-200">
                                    {(u.full_name ?? u.id).slice(0, 2).toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="font-medium text-slate-200">
                                  {u.full_name?.trim() || "—"}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs font-medium",
                                  status === "active" &&
                                    "border-emerald-500/50 bg-emerald-500/10 text-emerald-400",
                                  status === "inactive" &&
                                    "border-slate-500/50 bg-slate-500/10 text-slate-400",
                                  status === "banned" &&
                                    "border-red-500/50 bg-red-500/10 text-red-400"
                                )}
                              >
                                {status === "active" ? "Active" : status === "banned" ? "Banned" : "Inactive"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-slate-400">{u.email?.trim() || "—"}</TableCell>
                            <TableCell className="text-slate-400">
                              {formatDate(u.created_at)}
                            </TableCell>
                            <TableCell>
                              <Select
                                value={u.role ?? "user"}
                                onValueChange={(value) => handleSetRole(u.id, value ?? "user")}
                                disabled={roleLoading === u.id}
                              >
                                <SelectTrigger
                                  className={cn(
                                    "w-[120px] border-slate-600 bg-slate-800/50 text-slate-200",
                                    cardBorder
                                  )}
                                >
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">user</SelectItem>
                                  <SelectItem value="admin">admin</SelectItem>
                                  <SelectItem value="owner">owner</SelectItem>
                                  <SelectItem value="banned">banned</SelectItem>
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell className="text-slate-400">
                              {u.subscriptionStatus != null ? (
                                <span
                                  className={cn(
                                    "text-xs font-medium",
                                    u.subscriptionStatus === "active" && "text-emerald-400",
                                    u.subscriptionStatus === "cancelled" && "text-slate-500",
                                    u.subscriptionStatus === "past_due" && "text-amber-400"
                                  )}
                                >
                                  {u.subscriptionStatus}
                                </span>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap items-center gap-2">
                                {(u.subscription_tier?.toLowerCase() === "ultimate" ||
                                  u.subscription_tier?.toLowerCase() === "pro") && (
                                  <Badge
                                    className="border-amber-500/40 bg-amber-500/15 text-amber-300 font-medium"
                                    variant="outline"
                                  >
                                    {u.subscription_tier?.toLowerCase() === "ultimate" ? "Ultimate" : "Pro"}
                                  </Badge>
                                )}
                                <UpgradeUserButton
                                  userId={u.id}
                                  currentTier={u.subscription_tier}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-cyan-400 hover:bg-cyan-500/10"
                                  onClick={() => openProfileSheet(u)}
                                  title="View profile"
                                >
                                  <UserCircle className="size-4" aria-hidden />
                                  <span className="ml-1">View</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className={u.banned ? "text-emerald-400 hover:bg-emerald-500/10" : "text-amber-400 hover:bg-amber-500/10"}
                                  onClick={() => handleBanUnbanClerk(u.id, u.banned)}
                                  disabled={banLoading === u.id}
                                  title={u.banned ? "Unban user (Clerk)" : "Ban user (Clerk)"}
                                >
                                  {banLoading === u.id ? (
                                    <Loader2 className="size-4 animate-spin" aria-hidden />
                                  ) : (
                                    <Ban className="size-4" aria-hidden />
                                  )}
                                  <span className="ml-1">{u.banned ? "Unban" : "Ban"}</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-slate-400 hover:bg-slate-500/10"
                                  onClick={() => handleCopyUserId(u.id)}
                                  title="Copy user ID"
                                >
                                  <Copy className="size-4" aria-hidden />
                                  <span className="ml-1">Copy ID</span>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-400 hover:bg-red-500/10"
                                  onClick={() => setDeleteUserId(u.id)}
                                >
                                  <Trash2 className="size-4" aria-hidden />
                                  <span className="ml-1">Delete</span>
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
            </section>

            {/* Section B: Platform Oversight */}
            <section className="rounded-lg border border-slate-700/30 bg-slate-900/50 p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Platform Oversight
              </h2>
              <Card className={cn(cardBorder, cardBg)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-100">
                    <Shield className="size-5 text-indigo-400" aria-hidden />
                    All groups
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    All groups on the platform — force delete for moderation
                  </CardDescription>
                </CardHeader>
              <CardContent>
                {groups.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-500">No groups yet.</p>
                ) : (
                  <div className="space-y-2">
                    {groups.map((g) => (
                      <div
                        key={g.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-700/50 bg-slate-800/30 px-4 py-3"
                      >
                        <div>
                          <p className="font-medium text-slate-200">{g.name}</p>
                          <p className="text-xs text-slate-500">
                            Created {formatDate(g.created_at)} · ID: {g.id.slice(0, 8)}…
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-500/40 text-red-400 hover:bg-red-500/10"
                          onClick={() => setDeleteGroupId(g.id)}
                        >
                          <Trash2 className="size-4" aria-hidden />
                          Force delete
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
            </section>
          </TabsContent>

          {/* Tab 3: Analytics & Tools (System Monitoring) */}
          <TabsContent value="analytics" className="mt-0 space-y-8 border-0 outline-none">
            {/* Section A: Usage Analytics */}
            <section className="rounded-lg border border-slate-700/30 bg-slate-900/50 p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Usage Analytics
              </h2>
              <Card className={cn(cardBorder, cardBg)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-100">
                    <Activity className="size-5 text-cyan-400" aria-hidden />
                    Map and weather API usage
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Deep metrics on how tools are being used — monitor costs in provider dashboards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <MapPin className="size-4 text-slate-400" aria-hidden />
                        <span className="text-sm text-slate-300">Mapbox</span>
                      </div>
                      <span className="text-sm text-slate-500">
                        {analytics?.mapApiHits ?? "—"}
                      </span>
                      <a
                        href="https://account.mapbox.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyan-400 hover:underline"
                      >
                        <ExternalLink className="size-3.5" aria-hidden />
                      </a>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-slate-700/50 bg-slate-800/50 px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Cloud className="size-4 text-slate-400" aria-hidden />
                        <span className="text-sm text-slate-300">OpenWeather</span>
                      </div>
                      <span className="text-sm text-slate-500">
                        {analytics?.weatherApiHits ?? "—"}
                      </span>
                      <a
                        href="https://home.openweathermap.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-cyan-400 hover:underline"
                      >
                        <ExternalLink className="size-3.5" aria-hidden />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            {/* Section B: Global Broadcast */}
            <section className="rounded-lg border border-slate-700/30 bg-slate-900/50 p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                Global Broadcast
              </h2>
              <Card className={cn(cardBorder, cardBg)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-100">
                    <Send className="size-5 text-cyan-400" aria-hidden />
                    Send announcement
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Send a platform-wide notification or banner message to all users
                  </CardDescription>
                </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="broadcast" className="text-slate-300">
                    Message
                  </Label>
                  <Input
                    id="broadcast"
                    value={broadcastMessage}
                    onChange={(e) => setBroadcastMessage(e.target.value)}
                    placeholder="Enter broadcast message..."
                    className={cn("border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500", cardBorder)}
                  />
                </div>
                <Button
                  className="bg-cyan-600 hover:bg-cyan-500"
                  onClick={handleBroadcast}
                  disabled={broadcastSending}
                >
                  {broadcastSending ? (
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                  ) : (
                    <Send className="size-4" aria-hidden />
                  )}
                  <span className="ml-2">Send broadcast</span>
                </Button>
              </CardContent>
            </Card>
            </section>

            {/* Section C: API Key Monitor */}
            <section className="rounded-lg border border-slate-700/30 bg-slate-900/50 p-6">
              <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
                API Key Monitor
              </h2>
              <Card className={cn(cardBorder, cardBg)}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-slate-100">
                    <Activity className="size-5 text-indigo-400" aria-hidden />
                    External API usage
                  </CardTitle>
                  <CardDescription className="text-slate-400">
                    Monitoring logic for external API usage and quotas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
                      <p className="text-sm font-medium text-slate-300">Mapbox</p>
                      <p className="mt-1 text-xs text-slate-500">
                        View usage and billing in your Mapbox account dashboard.
                      </p>
                      <a
                        href="https://account.mapbox.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline"
                      >
                        Open dashboard <ExternalLink className="size-3" aria-hidden />
                      </a>
                    </div>
                    <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
                      <p className="text-sm font-medium text-slate-300">OpenWeather</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Check API calls and limits in your OpenWeather account.
                      </p>
                      <a
                        href="https://home.openweathermap.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-2 inline-flex items-center gap-1 text-xs text-cyan-400 hover:underline"
                      >
                        Open dashboard <ExternalLink className="size-3" aria-hidden />
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          </TabsContent>
        </Tabs>
      </main>

      {/* Force delete group confirmation */}
      <AlertDialog open={!!deleteGroupId} onOpenChange={() => setDeleteGroupId(null)}>
        <AlertDialogContent className="border-slate-700 bg-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Force delete group</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will permanently delete the group and its members. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteGroupId && handleForceDeleteGroup(deleteGroupId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete user confirmation */}
      <AlertDialog open={!!deleteUserId} onOpenChange={() => setDeleteUserId(null)}>
        <AlertDialogContent className="border-slate-700 bg-slate-900">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete user profile</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This will remove the user&apos;s profile from the database. It does not remove them from Clerk. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600">Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={() => deleteUserId && handleDeleteUser(deleteUserId)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* View Profile sheet (slide-over) */}
      <Drawer open={profileSheetOpen} onOpenChange={setProfileSheetOpen}>
        <DrawerContent className={cn("border-slate-700 bg-slate-900 text-white", cardBorder)}>
          {profileUser && (
            <>
              <DrawerHeader>
                <DrawerTitle className="text-slate-100">User profile</DrawerTitle>
                <div className="mt-4 flex items-center gap-4">
                  <Avatar className="size-16 border-2 border-slate-600">
                    <AvatarImage src={profileUser.avatar_url ?? undefined} alt="" />
                    <AvatarFallback className="bg-slate-700 text-lg text-slate-200">
                      {(profileUser.full_name ?? profileUser.id).slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-lg font-semibold text-slate-100">
                      {profileUser.full_name?.trim() || "—"}
                    </p>
                    <p className="text-sm text-slate-400">{profileUser.email?.trim() || "—"}</p>
                  </div>
                </div>
              </DrawerHeader>
              <DrawerBody className="space-y-6">
                <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
                  <h4 className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Statistics
                  </h4>
                  <p className="mt-2 text-2xl font-semibold text-white">
                    {profileGroupsCount !== null ? (
                      profileGroupsCount
                    ) : (
                      <Loader2 className="inline-block size-6 animate-spin text-slate-400" aria-hidden />
                    )}
                  </p>
                  <p className="text-sm text-slate-500">Groups created</p>
                </div>
                <div className="rounded-lg border border-slate-700/50 bg-slate-800/50 p-4">
                  <h4 className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Metadata
                  </h4>
                  <dl className="mt-2 space-y-1 text-sm">
                    <div>
                      <dt className="text-slate-500">Last sign-in</dt>
                      <dd className="font-medium text-slate-200">
                        {formatLastSignIn(profileUser.lastSignInAt ?? null)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-slate-500">User ID (Clerk)</dt>
                      <dd className="font-mono text-xs text-slate-300 break-all">{profileUser.id}</dd>
                    </div>
                  </dl>
                </div>
              </DrawerBody>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
