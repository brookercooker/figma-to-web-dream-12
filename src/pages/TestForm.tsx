import { useState, FormEvent } from "react";
import { supabase } from "@/prototype/client";
import { toast } from "@/hooks/use-toast";

const TestForm = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("mailchimp-subscribe", {
        body: {
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
          address: address.trim(),
          tags: ["Test 1", "Test 2"],
        },
      });

      if (error || (data && (data as { error?: string }).error)) {
        const msg = (data as { error?: string })?.error || error?.message || "Something went wrong.";
        toast({ title: "Submission failed", description: msg, variant: "destructive" });
        return;
      }

      toast({
        title: "Success",
        description: "Your info was sent to Mailchimp with the Test 1 and Test 2 tags.",
      });
      setFirstName("");
      setLastName("");
      setPhone("");
      setAddress("");
      setEmail("");
    } catch (err) {
      toast({
        title: "Submission failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full bg-transparent border border-ink/20 px-4 py-3 text-sm font-sans text-ink placeholder:text-stone focus:outline-none focus:border-ink transition-colors";
  const labelCls = "block text-[11px] font-sans tracking-[0.22em] uppercase text-ink mb-2";

  return (
    <div className="min-h-screen bg-cream">
      <main className="mx-auto max-w-2xl px-6 sm:px-10 py-20 sm:py-28">
        <p className="text-[10px] font-sans tracking-[0.35em] uppercase text-garnet font-semibold mb-4">
          Mailchimp Test
        </p>
        <h1 className="font-serif text-4xl sm:text-5xl text-ink font-light leading-tight mb-4">
          Test Form
        </h1>
        <p className="text-stone text-sm leading-relaxed mb-10">
          Submissions are pushed into Mailchimp and tagged <em>Test 1</em> and <em>Test 2</em>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className={labelCls} htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                required
                maxLength={100}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls} htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                required
                maxLength={100}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls} htmlFor="phone">Cell Phone Number</label>
            <input
              id="phone"
              type="tel"
              required
              maxLength={40}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 555-5555"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="address">Address</label>
            <input
              id="address"
              type="text"
              required
              maxLength={200}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, City, State, Zip"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls} htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              required
              maxLength={254}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className={inputCls}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="bg-ink text-cream px-10 py-3.5 text-[11px] font-sans font-medium tracking-[0.22em] uppercase hover:bg-ink/90 transition-colors disabled:opacity-50"
          >
            {loading ? "Submitting…" : "Submit"}
          </button>
        </form>
      </main>
    </div>
  );
};

export default TestForm;
