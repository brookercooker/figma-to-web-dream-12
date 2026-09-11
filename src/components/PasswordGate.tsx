/**
 * PROTOTYPE MODE — the site password gate is disabled.
 *
 * Kept as a pass-through so existing pages can keep wrapping their content
 * without any change.
 */
const PasswordGate = ({ children }: { children: React.ReactNode }) => <>{children}</>;

export default PasswordGate;
