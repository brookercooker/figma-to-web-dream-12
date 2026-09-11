import { useEffect, useState, FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const PASSWORD = "NovaFutureSite";
const STORAGE_KEY = "nova-site-unlocked";

const PasswordGate = ({ children }: { children: React.ReactNode }) => {
  const [unlocked, setUnlocked] = useState(false);
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem(STORAGE_KEY) === "1") {
      setUnlocked(true);
    }
    setReady(true);
  }, []);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (value === PASSWORD) {
      sessionStorage.setItem(STORAGE_KEY, "1");
      setUnlocked(true);
      setError(false);
    } else {
      setError(true);
    }
  };

  if (!ready) return null;
  if (unlocked) return <>{children}</>;

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6 text-center">
        <h1 className="font-serif text-3xl">Private Preview</h1>
        <p className="text-sm text-muted-foreground">
          Enter the password to access this site.
        </p>
        <Input
          type="password"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(false);
          }}
          placeholder="Password"
          autoFocus
          aria-label="Password"
        />
        {error && (
          <p className="text-sm text-destructive">Incorrect password.</p>
        )}
        <Button type="submit" className="w-full">Enter</Button>
        <p className="text-sm text-muted-foreground">Hi Cody... nice haircut</p>
      </form>
    </main>
  );
};

export default PasswordGate;
