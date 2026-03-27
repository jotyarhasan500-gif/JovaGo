"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LayoutDashboard, Brain, Users, MessageCircle } from "lucide-react";
import { GroupChat } from "@/components/groups/group-chat";

type MemberRow = {
  user_id: string;
  role: string;
  full_name: string | null;
  avatar_url: string | null;
};

type Props = {
  groupId: string;
  groupName: string;
  isOwner: boolean;
  members: MemberRow[];
};

export function GroupDetailTabs({ groupId, groupName, isOwner, members }: Props) {
  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList className="w-full justify-start border-b border-slate-800 bg-transparent">
        <TabsTrigger value="overview" className="gap-2 data-[active]:border-[#0066FF]">
          <LayoutDashboard className="size-4" aria-hidden />
          Overview
        </TabsTrigger>
        <TabsTrigger value="intelligence" className="gap-2 data-[active]:border-[#0066FF]">
          <Brain className="size-4" aria-hidden />
          Intelligence
        </TabsTrigger>
        <TabsTrigger value="members" className="gap-2 data-[active]:border-[#0066FF]">
          <Users className="size-4" aria-hidden />
          Members
        </TabsTrigger>
        <TabsTrigger value="chat" className="gap-2 data-[active]:border-[#0066FF]">
          <MessageCircle className="size-4" aria-hidden />
          Chat
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <Card className="border-slate-800 bg-slate-900/80">
          <CardHeader>
            <CardTitle className="text-slate-100">Overview</CardTitle>
            <CardDescription className="text-slate-400">
              General information about this group.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <dl className="grid gap-2 text-sm">
              <div>
                <dt className="text-slate-500">Group name</dt>
                <dd className="text-slate-200">{groupName}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Member count</dt>
                <dd className="text-slate-200">{members.length}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Your role</dt>
                <dd className="text-slate-200">{isOwner ? "Owner" : "Member"}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="intelligence">
        <Card className="border-slate-800 bg-slate-900/80">
          <CardHeader>
            <CardTitle className="text-slate-100">Intelligence</CardTitle>
            <CardDescription className="text-slate-400">
              AI tools for this group will appear here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">Coming soon.</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="chat">
        <GroupChat groupId={groupId} />
      </TabsContent>

      <TabsContent value="members">
        <Card className="border-slate-800 bg-slate-900/80">
          <CardHeader>
            <CardTitle className="text-slate-100">Members</CardTitle>
            <CardDescription className="text-slate-400">
              People in this group.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {members.length === 0 ? (
              <p className="text-sm text-slate-500">No members yet.</p>
            ) : (
              <ul className="space-y-3">
                {members.map((m) => (
                  <li
                    key={m.user_id}
                    className="flex items-center gap-3 rounded-lg border border-slate-800 p-3"
                  >
                    <Avatar className="size-10 border border-slate-700">
                      <AvatarImage src={m.avatar_url ?? undefined} alt="" />
                      <AvatarFallback className="bg-slate-700 text-slate-200">
                        {(m.full_name?.trim() || m.user_id).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-200">
                        {m.full_name?.trim() || m.user_id}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">{m.role}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
