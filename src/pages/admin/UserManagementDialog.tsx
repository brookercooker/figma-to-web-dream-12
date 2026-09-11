import { useEffect, useState } from "react";
import { supabase } from "@/prototype/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Shield, User as UserIcon } from "lucide-react";

interface AdminUser {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  is_admin: boolean;
}

export default function UserManagementDialog({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-users");
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    if ((data as any)?.error) { toast.error((data as any).error); return; }
    setUsers((data as any).users ?? []);
  };

  useEffect(() => { if (open) load(); }, [open]);

  const setAdmin = async (u: AdminUser, next: boolean) => {
    setBusyId(u.id);
    const { data, error } = await supabase.functions.invoke("admin-users", {
      body: { action: "set_admin", user_id: u.id, is_admin: next },
    });
    setBusyId(null);
    if (error || (data as any)?.error) {
      toast.error(error?.message || (data as any)?.error || "Update failed");
      return;
    }
    toast.success(next ? `${u.email} is now an Admin` : `${u.email} is now a User`);
    setUsers((cur) => cur.map((x) => (x.id === u.id ? { ...x, is_admin: next } : x)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>User management</DialogTitle>
          <DialogDescription>
            Grant or revoke Admin access. Admins can manage all site content and other users.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">Loading users…</div>
        ) : (
          <div className="max-h-[60vh] overflow-y-auto -mx-6 px-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-muted-foreground">
                  <th className="py-3 pr-4 text-left">Email</th>
                  <th className="py-3 pr-4 text-left min-w-[140px]">Role</th>
                  <th className="py-3 pr-4 text-left">Last sign-in</th>
                  <th className="py-3 pr-4 text-left">Action</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b align-middle">
                    <td className="py-3 pr-4">
                      <div className="font-medium truncate">{u.email || <span className="text-muted-foreground italic">no email</span>}</div>
                      <div className="text-[10px] text-muted-foreground font-mono truncate">{u.id}</div>
                    </td>
                    <td className="py-3 pr-4">
                      {u.is_admin ? (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-primary/10 text-primary">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground">
                          <UserIcon className="w-3 h-3" /> User
                        </span>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-xs text-muted-foreground whitespace-nowrap">
                      {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : "—"}
                    </td>
                    <td className="py-3 pr-4 text-left">
                      <Button
                        size="sm"
                        variant={u.is_admin ? "outline" : "default"}
                        disabled={busyId === u.id}
                        onClick={() => setAdmin(u, !u.is_admin)}
                      >
                        {busyId === u.id ? "…" : u.is_admin ? "Make User" : "Make Admin"}
                      </Button>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-muted-foreground">No users found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
