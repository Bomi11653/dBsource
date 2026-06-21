"use client";

import MaintenanceScreen from "@/components/MaintenanceScreen";
import type { ContactInfo } from "@/data/mock";
import {
  getMaintenanceContacts,
  shouldBypassMaintenance,
} from "@/lib/maintenance";
import { usePathname } from "next/navigation";

type Props = {
  enabled: boolean;
  message: string;
  contact: ContactInfo;
  children: React.ReactNode;
};

export default function MaintenanceGate({
  enabled,
  message,
  contact,
  children,
}: Props) {
  const pathname = usePathname() ?? "/";
  const bypass = shouldBypassMaintenance(pathname);

  if (enabled && !bypass) {
    return (
      <MaintenanceScreen
        message={message}
        contacts={getMaintenanceContacts(contact)}
      />
    );
  }

  return <>{children}</>;
}
