import { ReactNode } from "react";
import AdminIndex from "./AdminIndex";

/**
 * PROTOTYPE MODE — no sign-in gate.
 *
 * The clickable prototype has no accounts and no backend, so the Site Manager
 * opens straight into the tool as a demo admin.
 */
export default function AdminGate({ children }: { children?: ReactNode }) {
  return <>{children ?? <AdminIndex />}</>;
}
