import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ChangeMyPasswordDialog({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (pw.length < 8) { toast.error("Password must be at least 8 characters."); return; }
    if (pw !== pw2) { toast.error("Passwords do not match."); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    setPw(""); setPw2("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { setPw(""); setPw2(""); } onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change your password</DialogTitle>
          <DialogDescription>Update the password for your own account.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="my-pw">New password</Label>
            <Input id="my-pw" type="password" autoComplete="new-password"
              placeholder="At least 8 characters"
              value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
          </div>
          <div className="space-y-2">
            <Label htmlFor="my-pw2">Confirm password</Label>
            <Input id="my-pw2" type="password" autoComplete="new-password"
              value={pw2} onChange={(e) => setPw2(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button onClick={save} disabled={saving || pw.length < 8 || pw !== pw2}>
            {saving ? "Saving…" : "Update password"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
