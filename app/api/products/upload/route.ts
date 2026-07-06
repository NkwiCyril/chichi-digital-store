import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { fetchOwnerStore } from "@/lib/db/courses";

export const runtime = "nodejs";

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Authentication required." }, { status: 401 });
  }

  const store = await fetchOwnerStore(supabase, user.id);
  if (!store) {
    return Response.json({ error: "Store not found. Complete creator onboarding first." }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) {
    return Response.json({ error: "Expected multipart/form-data." }, { status: 400 });
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return Response.json({ error: "No file provided." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE) {
    return Response.json({ error: "File exceeds 500 MB limit." }, { status: 413 });
  }

  const title = (formData.get("title") as string | null)?.trim() || file.name;
  const description = (formData.get("description") as string | null)?.trim() || "";
  const priceXaf = Number(formData.get("price_xaf") ?? 0);

  // Path: {userId}/{productId}/{filename}
  const productId = crypto.randomUUID();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${user.id}/${productId}/${safeName}`;

  const admin = createSupabaseAdmin();

  const { error: uploadError } = await admin.storage
    .from("products")
    .upload(filePath, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return Response.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 });
  }

  const { data: product, error: insertError } = await supabase
    .from("digital_products")
    .insert({
      id: productId,
      store_id: store.id,
      title,
      description,
      price_xaf: priceXaf,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      file_type: file.type,
      status: "draft",
    })
    .select("id, title, status")
    .single();

  if (insertError) {
    await admin.storage.from("products").remove([filePath]);
    return Response.json({ error: `Failed to save product: ${insertError.message}` }, { status: 500 });
  }

  return Response.json({ product }, { status: 201 });
}
