"use client";

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerBody } from "@/components/ui/drawer";
import { GroupChatSidebar } from "./group-chat-sidebar";

type GroupInfoDrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string | null;
  currentUserId: string | null;
};

/**
 * Sliding panel (drawer) that contains the group members list, settings, and Leave button.
 * Opens from the right on desktop and from the bottom on mobile.
 */
export function GroupInfoDrawer({
  open,
  onOpenChange,
  groupId,
  currentUserId,
}: GroupInfoDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh] md:max-h-none md:w-[320px]">
        <DrawerHeader>
          <DrawerTitle>Group info</DrawerTitle>
        </DrawerHeader>
        <DrawerBody>
          {groupId && (
            <GroupChatSidebar
              groupId={groupId}
              currentUserId={currentUserId}
              onClose={() => onOpenChange(false)}
            />
          )}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
