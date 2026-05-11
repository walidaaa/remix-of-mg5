import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { attachSupabaseAuth } from "@/lib/auth-client-middleware";

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Username trop court (min 3)")
  .max(32, "Username trop long")
  .regex(/^[a-zA-Z0-9_.-]+$/, "Lettres, chiffres, . _ - uniquement");

const passwordSchema = z.string().min(6, "Mot de passe min 6 caractères").max(72);

const usernameToEmail = (u: string) => `${u.toLowerCase()}@mg5.local`;

async function ensureAdmin(userId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Accès refusé : admin requis");
}

// Public: check if any admin exists yet
export const checkAdminExists = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await supabaseAdmin
    .from("user_roles")
    .select("id", { count: "exact", head: true })
    .eq("role", "admin");
  if (error) throw new Error(error.message);
  return { exists: (data as any) !== null ? true : false } as { exists: boolean };
});

// Better: count
export const adminExists = createServerFn({ method: "GET" }).handler(async () => {
  const { count, error } = await supabaseAdmin
    .from("user_roles")
    .select("*", { count: "exact", head: true })
    .eq("role", "admin");
  if (error) throw new Error(error.message);
  return { exists: (count ?? 0) > 0 };
});

// Resolve username -> email (public, used by login form)
export const resolveUsername = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string }) => ({ username: usernameSchema.parse(d.username) }))
  .handler(async ({ data }) => {
    return { email: usernameToEmail(data.username) };
  });

// Public: bootstrap first admin (only works if no admin exists)
export const setupFirstAdmin = createServerFn({ method: "POST" })
  .inputValidator((d: { username: string; password: string }) => ({
    username: usernameSchema.parse(d.username),
    password: passwordSchema.parse(d.password),
  }))
  .handler(async ({ data }) => {
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("Un admin existe déjà");

    const email = usernameToEmail(data.username);
    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { username: data.username },
    });
    if (cErr || !created.user) throw new Error(cErr?.message || "Création impossible");

    await supabaseAdmin.from("profiles").upsert({
      id: created.user.id,
      username: data.username,
      display_name: data.username,
    });
    const { error: rErr } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: created.user.id, role: "admin" });
    if (rErr) throw new Error(rErr.message);

    return { ok: true, email };
  });

// Admin: create a regular user
export const adminCreateUser = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d: { username: string; password: string; brand?: string }) => ({
    username: usernameSchema.parse(d.username),
    password: passwordSchema.parse(d.password),
    brand: d.brand ? z.string().trim().max(50).parse(d.brand) : undefined,
  }))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);

    const email = usernameToEmail(data.username);
    const { data: created, error: cErr } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
      user_metadata: { username: data.username },
    });
    if (cErr || !created.user) throw new Error(cErr?.message || "Création impossible");

    await supabaseAdmin.from("profiles").upsert({
      id: created.user.id,
      username: data.username,
      display_name: data.username,
    });
    await supabaseAdmin.from("user_roles").insert({ user_id: created.user.id, role: "user" });

    if (data.brand) {
      await supabaseAdmin.from("vehicles").upsert({
        user_id: created.user.id,
        marque: data.brand,
        modele: "",
        couleur: "",
        matricule: "",
        transmission: "automatique",
        annee: new Date().getFullYear(),
        km_actuel: 0,
        intervalle_vidange: 10000,
      });
    }
    return { ok: true };
  });

// Admin: list all users (with role + username)
export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    await ensureAdmin(context.userId);

    const { data: profiles, error: pErr } = await supabaseAdmin
      .from("profiles")
      .select("id, username, display_name, created_at")
      .order("created_at", { ascending: false });
    if (pErr) throw new Error(pErr.message);

    const { data: roles, error: rErr } = await supabaseAdmin
      .from("user_roles")
      .select("user_id, role");
    if (rErr) throw new Error(rErr.message);

    const { data: vehicles } = await supabaseAdmin
      .from("vehicles")
      .select("user_id, marque, modele, matricule");

    const roleByUser = new Map((roles ?? []).map((r) => [r.user_id, r.role]));
    const vehByUser = new Map((vehicles ?? []).map((v) => [v.user_id, v]));

    return (profiles ?? []).map((p) => ({
      id: p.id,
      username: p.username,
      display_name: p.display_name,
      created_at: p.created_at,
      role: (roleByUser.get(p.id) ?? "user") as "admin" | "user",
      vehicle: vehByUser.get(p.id) ?? null,
    }));
  });

// Admin: delete a user
export const adminDeleteUser = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => ({ userId: z.string().uuid().parse(d.userId) }))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    if (data.userId === context.userId) throw new Error("Impossible de supprimer votre propre compte");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Admin: reset a user's password
export const adminResetPassword = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d: { userId: string; password: string }) => ({
    userId: z.string().uuid().parse(d.userId),
    password: passwordSchema.parse(d.password),
  }))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// Brands
export const listBrands = createServerFn({ method: "GET" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("car_brands")
      .select("id, name")
      .order("name");
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const adminAddBrand = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d: { name: string }) => ({
    name: z.string().trim().min(1).max(50).parse(d.name),
  }))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const { error } = await supabaseAdmin.from("car_brands").insert({ name: data.name });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminDeleteBrand = createServerFn({ method: "POST" })
  .middleware([attachSupabaseAuth, requireSupabaseAuth])
  .inputValidator((d: { id: string }) => ({ id: z.string().uuid().parse(d.id) }))
  .handler(async ({ data, context }) => {
    await ensureAdmin(context.userId);
    const { error } = await supabaseAdmin.from("car_brands").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
