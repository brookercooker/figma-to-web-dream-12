// Prompt + reference builders for Landing Pages.
// Kept in a small helper so the CreateDialog, the row action, and any future
// surface all produce identical text.

export function buildLandingBuildPrompt(name: string, slug: string): string {
  const route = `/landing/${slug}`;
  return `Build a new landing page in this project.

- Name: ${name}
- Route: ${route}
- Create the page component and register the route ${route}.
- Design it as a marketing landing page using our existing theme, design system, and reusable section components ("Objects") — for example a hero, featured products or collections, social proof, and a clear call-to-action. Match the storefront's look and feel.
- Do NOT hard-code visibility. Read this page's status and start/end dates from Site Manager and: show the page normally when it is live; before the start date show a centered message "Coming on <start date>"; after the end date show a centered message "This page has expired" with a link back to the home page.
- Start with the hero section and leave clearly labeled placeholders for the other sections so they're easy to fill in.
- When you're finished, open the ${route} route so it's the page currently shown in the preview and I can start editing it right away.

Reference: landing/${slug}`;

}

export function buildLandingReference(name: string, slug: string): string {
  return `Page "${name}" (id: ${slug}, route: /landing/${slug})`;
}
