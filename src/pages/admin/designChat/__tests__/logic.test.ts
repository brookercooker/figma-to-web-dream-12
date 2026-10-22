import { describe, it, expect } from "vitest";
import { fileProblem, fmtDur, fmtSize, isWorking, problemsModel, visibleText, withPath, workHint, workLabel } from "../logic";
import type { Finding, RelayState } from "../helper";

const base: RelayState = { busy: false, job: null, previewVersion: 0, history: [] };
const finding = (over: Partial<Finding> = {}): Finding => ({ id: "f1", issue: "It sends data to an outside service.", severity: "high", area: "security", request: "Add a sign-up form", file: "src/routes/index.tsx", ...over });
const blocked = (findings: Finding[], locked = false): RelayState => ({
  ...base,
  publish: { ok: false, open: 2, status: "blocked" },
  draft: { review: { state: "failure", locked, findings } },
});

describe("visibleText", () => {
  it("shows what was said and hides internal notes", () => {
    expect(visibleText({ role: "user", text: "make it blue" })).toBe("make it blue");
    expect(visibleText({ role: "assistant", text: "Done." })).toBe("Done.");
    expect(visibleText({ role: "note", text: "A developer edited the page: x" })).toBeNull();
  });
  it("rewrites the few notes a person should see", () => {
    expect(visibleText({ role: "note", text: "The draft is published." })).toBe("Your changes are live.");
    expect(visibleText({ role: "note", text: "This change is taking longer than 15 minutes." })).toMatch(/taking longer than usual/);
  });
  it("tells the person what to do after an error", () => {
    expect(visibleText({ role: "error", text: "The change didn't finish." })).toBe("The change didn't finish.\nTry sending it again in a moment.");
  });
});

describe("the working line", () => {
  const job = (over = {}) => ({ kind: "change", status: "working", startedAt: 1000, ...over });
  it("says what is happening", () => {
    expect(workLabel(job({ status: "sending" }), 1000)).toBe("Sending your request…");
    expect(workLabel(job(), 1000)).toBe("Making your change…");
    expect(workLabel({ kind: "publish", status: "reviewing", startedAt: 0 }, 0)).toBe("Reviewing your changes…");
    expect(workLabel({ kind: "publish", status: "publishing", startedAt: 0 }, 0)).toBe("Going live…");
  });
  it("adds a hint only when it helps", () => {
    expect(workHint(job(), base, 1000 + 10_000)).toBe("");
    expect(workHint(job(), base, 1000 + 60_000)).toMatch(/Bigger changes take longer/);
    expect(workHint({ kind: "publish", status: "reviewing", startedAt: 0 }, { ...base, review: { mode: "github" } }, 5)).toMatch(/minute or two/);
  });
  const cases = [
    ["change", "working", "Making your change…", 5],
    ["change", "sending", "Sending your request…", 4],
    ["change", "queued", "Sending your request…", 4],
    ["dev", "working", "Updating the page…", 4],
    ["publish", "reviewing", "Reviewing your changes…", 4],
    ["publish", "publishing", "Going live…", 4],
    ["publish", "updating", "Waiting for the live site to update…", 4],
    ["publish", "content", "Adding your edits to the draft…", 4],
  ] as const;
  for (const [kind, status, first, count] of cases) {
    it(`rotates ${kind}/${status} every 7 seconds and wraps`, () => {
      const j = { kind, status, startedAt: 1000, stepStartedAt: 2000 };
      expect(workLabel(j, 2000)).toBe(first);
      expect(workLabel(j, 8999)).toBe(first);
      const second = workLabel(j, 9000);
      expect(second).not.toBe(first);
      expect(workLabel(j, 15999)).toBe(second);
      expect(workLabel(j, 2000 + count * 7000)).toBe(first);
      expect(workLabel({ ...j, stepStartedAt: 0 }, 1000)).toBe(first);
    });
  }
  it("never presents hand edits as a review, for any kind or variant", () => {
    for (const kind of ["change", "dev", "publish", undefined]) {
      for (let i = 0; i < 8; i++) expect(workLabel({ kind, status: "content", startedAt: 1000 }, 1000 + i * 7000)).not.toMatch(/review/i);
    }
  });
  it("keeps approval wording fixed regardless of elapsed time or job kind", () => {
    for (const kind of ["change", "dev", "publish", undefined]) {
      for (const now of [1000, 8000, 60000]) expect(workLabel({ kind, status: "approval", startedAt: 1000 }, now)).toBe("Waiting for an approval…");
    }
  });
  it("is showing while a job is busy or queued", () => {
    expect(isWorking(null)).toBe(false);
    expect(isWorking({ ...base, busy: true, job: job() })).toBe(true);
    expect(isWorking({ ...base, busy: false, job: job({ status: "queued" }) })).toBe(true);
    expect(isWorking({ ...base, busy: false, job: job({ status: "done" }) })).toBe(false);
  });
});

describe("problemsModel", () => {
  it("shows nothing when nothing is wrong or a job is running", () => {
    expect(problemsModel(null)).toBeNull();
    expect(problemsModel(base)).toBeNull();
    expect(problemsModel({ ...blocked([finding()]), busy: true })).toBeNull();
  });
  it("lists problems the person can fix", () => {
    const m = problemsModel(blocked([finding()]));
    expect(m?.title).toBe("These changes can't go live yet.");
    expect(m?.items.map((f) => f.id)).toEqual(["f1"]);
    expect(m?.devNote).toBeUndefined();
  });
  it("leaves out low problems and accepted ones", () => {
    const m = problemsModel(blocked([finding({ id: "a", severity: "low" }), finding({ id: "b", accepted: true }), finding({ id: "c", severity: "medium", area: "efficiency" }), finding({ id: "d" })]));
    expect(m?.items.map((f) => f.id)).toEqual(["d"]);
  });
  it("sends developer-only problems to one line", () => {
    const m = problemsModel(blocked([finding({ id: "a" }), finding({ id: "b", fix: "A developer should move this to a server function." }), finding({ id: "c", file: ".github/workflows/x.yml" })]));
    expect(m?.items.map((f) => f.id)).toEqual(["a"]);
    expect(m?.devNote).toBe("2 more items need a developer's review before this can go live.");
  });
  it("says a developer is needed when nothing can be fixed by the person, or when the draft is locked", () => {
    expect(problemsModel(blocked([finding({ file: ".github/x" })]))?.title).toMatch(/developer needs to review/);
    const locked = problemsModel(blocked([finding()], true));
    expect(locked?.title).toMatch(/developer needs to review/);
    expect(locked?.items).toEqual([]);
  });
  it("explains a review that couldn't finish", () => {
    const m = problemsModel({ ...base, publish: { ok: false, open: 1, status: "error" } });
    expect(m?.title).toBe("The review couldn't finish.");
  });
  it.each([undefined, "Wait a moment and submit again.", "Nothing was changed on the live site. Wait a moment."])("shows a retryable reason with the live-site assurance once (%s)", (summary) => {
    const m = problemsModel({ ...base, publish: { open: 1, status: "error" }, draft: { review: { state: "error", retry: true, headline: "The review service is temporarily busy.", summary } } });
    expect(m?.title).toBe("The review service is temporarily busy.");
    expect(m?.sub.split("Nothing was changed on the live site.")).toHaveLength(2);
    expect(m?.sub).toBe(summary ? summary.includes("Nothing was changed on the live site.") ? summary : `Nothing was changed on the live site. ${summary}` : "Nothing was changed on the live site. Press Submit for review to try again.");
    expect(m?.devNote).toBeUndefined();
  });
  it.each([false, undefined])("keeps non-retry errors generic and excludes raw details (%s)", (retry) => {
    const m = problemsModel({ ...base, publish: { open: 1, status: "error" }, draft: { review: { state: "error", retry, headline: "GitHub refused commit abc123.", summary: "Missing actions:write on review.yml" } } });
    expect(m).toEqual({ title: "The review couldn't finish.", sub: "Nothing was changed on the live site. Press Submit for review to try again.", items: [], devNote: "If it keeps happening, a developer can see the details on the Developer review page." });
    expect(JSON.stringify(m)).not.toMatch(/GitHub|abc123|actions:write|review\.yml/);
  });
  it.each([undefined, { state: "error" }, { state: "error", retry: true }])("supports missing review fields (%s)", (review) => {
    expect(problemsModel({ ...base, publish: { open: 1, status: "error" }, draft: { review } })).toEqual({ title: "The review couldn't finish.", sub: "Nothing was changed on the live site. Press Submit for review to try again.", items: [], devNote: "If it keeps happening, a developer can see the details on the Developer review page." });
  });
});

describe("fileProblem", () => {
  const rules = { maxFiles: 5, maxBytes: 10 * 1024 * 1024, accept: ".png,.jpg,.pdf,.txt" };
  it("accepts a normal file", () => expect(fileProblem({ name: "logo.PNG", size: 1000 }, rules, 0)).toBeNull());
  it("refuses other kinds, big, empty and too many", () => {
    expect(fileProblem({ name: "x.svg", size: 10 }, rules, 0)).toMatch(/can't be attached/);
    expect(fileProblem({ name: "x.png", size: 11 * 1024 * 1024 }, rules, 0)).toBe("x.png is larger than 10 MB.");
    expect(fileProblem({ name: "x.png", size: 0 }, rules, 0)).toBe("x.png is empty.");
    expect(fileProblem({ name: "x.png", size: 5 }, rules, 5)).toBe("You can attach up to 5 files at a time.");
  });
});

describe("formatting", () => {
  it("formats durations and sizes", () => {
    expect(fmtDur(65_000)).toBe("1:05");
    expect(fmtDur(-5)).toBe("0:00");
    expect(fmtSize(500)).toBe("1 KB");
    expect(fmtSize(2048)).toBe("2 KB");
    expect(fmtSize(3 * 1024 * 1024)).toBe("3.0 MB");
  });
});

describe("withPath", () => {
  const url = "https://id-preview--abc.lovable.app/?__lovable_token=tok";
  it("puts the page in front of the access token", () => {
    expect(withPath(url, "/about")).toBe("https://id-preview--abc.lovable.app/about?__lovable_token=tok");
    expect(withPath(url, "about")).toBe("https://id-preview--abc.lovable.app/about?__lovable_token=tok");
    expect(withPath(url, "/lighting-tips/summer")).toBe("https://id-preview--abc.lovable.app/lighting-tips/summer?__lovable_token=tok");
  });
  it("leaves the address alone for the home page, no page, or an address it can't read", () => {
    expect(withPath(url, "/")).toBe(url);
    expect(withPath(url, null)).toBe(url);
    expect(withPath(url, undefined)).toBe(url);
    expect(withPath("not a url", "/about")).toBe("not a url");
  });
  it("drops anything after the page's own path and doesn't double up slashes", () => {
    expect(withPath("https://x.app/base/?t=1", "/a?b=c#d")).toBe("https://x.app/base/a?t=1");
    expect(withPath(url, "//about")).toBe("https://id-preview--abc.lovable.app/about?__lovable_token=tok");
  });
});
