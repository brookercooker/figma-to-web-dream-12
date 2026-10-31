import { supabase } from "@/prototype/client";

/** Listing is GET; actions use POST. Read the response behind FunctionsHttpError. */
export async function callAdminUsers(body?: unknown) {
  const { data, error } = await supabase.functions.invoke("admin-users", {
    method: body === undefined ? "GET" : "POST",
    ...(body === undefined ? {} : { body }),
  });
  if (error) {
    let message = error.message || "Unable to manage users. Please try again.";
    const response = error.context;
    if (response instanceof Response) {
      const text = await response.clone().text();
      try {
        const result = JSON.parse(text);
        if (typeof result.error === "string") message = result.error;
        else if (typeof result.message === "string") message = result.message;
      } catch { if (text && !text.trim().startsWith("<")) message = text; }
    }
    const plain: Record<string, string> = {
      "bad request": "The user request wasn't understood. Please try again.",
      "missing token": "Please sign in again to manage users.",
      "invalid user": "Your sign-in has expired. Please sign in again.",
      forbidden: "You need an admin account to manage users.",
      "Server configuration error": "User Management isn't configured correctly. Please contact your site administrator.",
    };
    throw new Error(plain[message] ?? message);
  }
  if (data?.error) throw new Error(data.error);
  return data;
}