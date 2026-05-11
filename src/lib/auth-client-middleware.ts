import { createMiddleware } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";

// Client middleware: attach the Supabase access token on every server fn call
// so the server-side requireSupabaseAuth middleware can authenticate the user.
export const attachSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    return next({
      headers: token ? { authorization: `Bearer ${token}` } : {},
    });
  },
);
