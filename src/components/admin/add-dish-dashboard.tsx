"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { LoggerService } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  PlusCircle,
  ImagePlus,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  X,
  Info,
} from "lucide-react";
import Image from "next/image";

/* ─── Types ──────────────────────────────────────────────────────────────── */

type DishCategory = string;

type Allergen =
  | "gluten"
  | "crustaceos"
  | "huevos"
  | "pescado"
  | "cacahuetes"
  | "soja"
  | "lacteos"
  | "frutos_cascara"
  | "apio"
  | "mostaza"
  | "sesamo"
  | "sulfitos"
  | "altramuces"
  | "moluscos";

interface FormState {
  nameEs: string;
  nameEn: string;
  descriptionEs: string;
  descriptionEn: string;
  category: DishCategory;
  priceCents: string; /** Raw input like "10,50" */
  allergens: Allergen[];
}

// Dynamic categories will be fetched from the database
interface Category {
  id: string;
  name_es: string;
}

const ALLERGENS: { value: Allergen; label: string; emoji: string }[] = [
  { value: "gluten", label: "Gluten", emoji: "🌾" },
  { value: "crustaceos", label: "Crustáceos", emoji: "🦐" },
  { value: "huevos", label: "Huevos", emoji: "🥚" },
  { value: "pescado", label: "Pescado", emoji: "🐟" },
  { value: "cacahuetes", label: "Cacahuetes", emoji: "🥜" },
  { value: "soja", label: "Soja", emoji: "🫘" },
  { value: "lacteos", label: "Lácteos", emoji: "🥛" },
  { value: "frutos_cascara", label: "Frutos con cáscara", emoji: "🌰" },
  { value: "apio", label: "Apio", emoji: "🌿" },
  { value: "mostaza", label: "Mostaza", emoji: "🌭" },
  { value: "sesamo", label: "Sésamo", emoji: "🌻" },
  { value: "sulfitos", label: "Sulfitos", emoji: "🍷" },
  { value: "altramuces", label: "Altramuces", emoji: "🫛" },
  { value: "moluscos", label: "Moluscos", emoji: "🦑" },
];

const INITIAL_FORM: FormState = {
  nameEs: "",
  nameEn: "",
  descriptionEs: "",
  descriptionEn: "",
  category: "",
  priceCents: "",
  allergens: [],
};

/* ─── Helpers ────────────────────────────────────────────────────────────── */

/**
 * @description Converts a Euro string like "10,50" or "10.50" to cents.
 * @param {string} value - Raw input string.
 * @returns {number | null} Integer cents or null if invalid.
 */
function euroStringToCents(value: string): number | null {
  const normalized = value.replace(",", ".").trim();
  const parsed = parseFloat(normalized);
  if (isNaN(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

/**
 * @description Generates a URL-friendly slug from a Spanish dish name.
 * @param {string} name - Display name.
 * @returns {string} Slug e.g. "combo-personal-costillas".
 */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

/**
 * @description Formulario para añadir nuevos platos al catálogo desde el panel de administración.
 * La imagen se sube a Supabase Storage (bucket "dish-images") y el plato se inserta
 * en la tabla `custom_dishes`.
 */
export function AddDishDashboard() {
  const supabase = createBrowserSupabaseClient();

  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch categories on mount
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const { data, error } = await supabase.from("categories").select("id, name_es").order("sort_order");
        if (error) throw error;
        setCategories(data || []);
      } catch (err) {
        LoggerService.error("AddDishDashboard:loadCategories", err);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadCategories();

    // ── Realtime: Sync categories ──
    const channel = supabase
      .channel("categories-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "categories" },
        () => loadCategories() // Re-fetch on any change
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [supabase]);

  /* ── Image validation & preview ── */
  const handleImageChange = useCallback((file: File | null) => {
    setImageError(null);
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }

    // Validate type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setImageError("Solo se admiten imágenes JPG, PNG o WebP.");
      return;
    }

    // Validate size (max 3 MB)
    if (file.size > 3 * 1024 * 1024) {
      setImageError("La imagen no puede superar los 3 MB.");
      return;
    }

    // Check dimensions via a temporary Image element
    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width < 400 || img.height < 400) {
        setImageError(`Dimensiones mínimas: 400×400 px. Tu imagen es ${img.width}×${img.height} px.`);
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setImageError("No se pudo leer la imagen. Prueba con otro archivo.");
    };
    img.src = url;
  }, []);

  /* ── Toggle allergen ── */
  const toggleAllergen = (allergen: Allergen) => {
    setForm((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter((a) => a !== allergen)
        : [...prev.allergens, allergen],
    }));
  };

  /* ── Submit ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // ── Client-side validation ──
    if (!form.nameEs.trim()) { setFormError("El nombre en español es obligatorio."); return; }
    if (!form.category) { setFormError("Debes seleccionar una categoría."); return; }
    const cents = euroStringToCents(form.priceCents);
    if (cents === null) { setFormError("El precio no es válido. Usa el formato 10,50"); return; }
    if (!imageFile) { setFormError("Debes subir una imagen para el plato."); return; }

    setSubmitting(true);

    try {
      // ── 1. Upload image to Supabase Storage ──
      const ext = imageFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const slug = toSlug(form.nameEs);
      const filePath = `${slug}-${Date.now()}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("dish-images")
        .upload(filePath, imageFile, { upsert: false, contentType: imageFile.type });

      if (uploadError) throw new Error(`Error al subir imagen: ${uploadError.message}`);

      // ── 2. Get public URL ──
      const { data: urlData } = supabase.storage
        .from("dish-images")
        .getPublicUrl(filePath);

      const imageUrl = urlData?.publicUrl ?? "";

      // ── 3. Insert dish into custom_dishes ──
      const { error: insertError } = await supabase.from("custom_dishes").insert({
        slug,
        category: form.category,
        name_es: form.nameEs.trim(),
        name_en: form.nameEn.trim() || form.nameEs.trim(),
        description_es: form.descriptionEs.trim(),
        description_en: form.descriptionEn.trim(),
        price_cents: cents,
        image_path: imageUrl,
        allergens: form.allergens,
        is_active: true,
      });

      if (insertError) {
        // If duplicate slug, clean up the uploaded image
        await supabase.storage.from("dish-images").remove([filePath]);
        if (insertError.code === "23505" || insertError.message.includes("duplicate key")) {
          throw new Error("Ya existe un plato con ese nombre (quizás está oculto o borrado). Por favor, usa un nombre diferente o cámbiale alguna letra.");
        }
        throw new Error(`Error al guardar el plato: ${insertError.message}`);
      }

      // ── Success ──
      setSuccess(true);
      setForm(prev => ({ ...INITIAL_FORM, category: prev.category }));
      setImageFile(null);
      setImagePreview(null);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      LoggerService.error("AddDishDashboard:handleSubmit", err);
      setFormError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold flex items-center gap-2">
          <PlusCircle className="w-5 h-5 text-primary" />
          Añadir Nuevo Plato
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          El plato aparecerá inmediatamente en el catálogo público. La imagen recomendada es
          <strong> 600×600 px</strong>, formato <strong>JPG o PNG</strong>, máximo 3 MB.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Image upload ── */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">
            Imagen del plato <span className="text-destructive">*</span>
          </label>

          {/* Specs hint */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/40 rounded-lg px-3 py-2 border">
            <Info className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
            <span>
              Tamaño ideal: <strong>600 × 600 px</strong> — Formatos: <strong>JPG, PNG, WebP</strong> —
              Máximo: <strong>3 MB</strong> — Fondo liso o transparente recomendado.
            </span>
          </div>

          {/* Drop area */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "w-full rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden",
              imagePreview
                ? "border-primary/40 p-0"
                : "border-border hover:border-primary/60 bg-muted/20 hover:bg-muted/40 p-8"
            )}
          >
            {imagePreview ? (
              <div className="relative w-full aspect-square max-h-56 mx-auto">
                <Image
                  src={imagePreview}
                  alt="Vista previa"
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 400px"
                />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <span className="text-white text-sm font-bold">Cambiar imagen</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 text-muted-foreground">
                <ImagePlus className="w-10 h-10 opacity-50" />
                <div className="text-center">
                  <p className="font-semibold text-sm">Haz clic para subir una imagen</p>
                  <p className="text-xs">o arrastra y suelta aquí</p>
                </div>
              </div>
            )}
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
          />

          {imageError && (
            <p className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {imageError}
            </p>
          )}

          {imageFile && !imageError && (
            <div className="flex items-center justify-between text-xs text-muted-foreground bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 rounded-lg px-3 py-2">
              <span className="truncate font-mono">{imageFile.name}</span>
              <button
                type="button"
                onClick={() => { setImageFile(null); setImagePreview(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}
                className="shrink-0 ml-2 text-muted-foreground hover:text-destructive"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* ── Names ── */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="dish-name-es" className="text-sm font-semibold">
              Nombre (Español) <span className="text-destructive">*</span>
            </label>
            <input
              id="dish-name-es"
              type="text"
              value={form.nameEs}
              onChange={(e) => setForm((p) => ({ ...p, nameEs: e.target.value }))}
              placeholder="Ej. Rollitos de Primavera"
              maxLength={120}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="dish-name-en" className="text-sm font-semibold">
              Nombre (Inglés)
            </label>
            <input
              id="dish-name-en"
              type="text"
              value={form.nameEn}
              onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))}
              placeholder="Ej. Spring Rolls"
              maxLength={120}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* ── Descriptions ── */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="dish-desc-es" className="text-sm font-semibold">Descripción (ES)</label>
            <textarea
              id="dish-desc-es"
              value={form.descriptionEs}
              onChange={(e) => setForm((p) => ({ ...p, descriptionEs: e.target.value }))}
              rows={3}
              placeholder="Describe el plato en español..."
              maxLength={400}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
          <div className="space-y-1">
            <label htmlFor="dish-desc-en" className="text-sm font-semibold">Descripción (EN)</label>
            <textarea
              id="dish-desc-en"
              value={form.descriptionEn}
              onChange={(e) => setForm((p) => ({ ...p, descriptionEn: e.target.value }))}
              rows={3}
              placeholder="Describe the dish in English..."
              maxLength={400}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>
        </div>

        {/* ── Category & Price ── */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label htmlFor="dish-category" className="text-sm font-semibold">
              Categoría <span className="text-destructive">*</span>
            </label>
            <select
              id="dish-category"
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value as any }))}
              disabled={loadingCategories}
              className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
            >
              {loadingCategories ? (
                <option value="">Cargando categorías...</option>
              ) : (
                <>
                  <option value="" disabled>Seleccione una categoría...</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name_es}</option>
                  ))}
                </>
              )}
            </select>
          </div>
          <div className="space-y-1">
            <label htmlFor="dish-price" className="text-sm font-semibold">
              Precio (€) <span className="text-destructive">*</span>
            </label>
            <div className="relative">
              <input
                id="dish-price"
                type="text"
                inputMode="decimal"
                value={form.priceCents}
                onChange={(e) => setForm((p) => ({ ...p, priceCents: e.target.value }))}
                placeholder="10,50"
                className="w-full rounded-lg border bg-background px-3 py-2 pr-7 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm pointer-events-none">€</span>
            </div>
            <p className="text-[10px] text-muted-foreground">Usa coma o punto decimal. Ej: 10,50</p>
          </div>
        </div>

        {/* ── Allergens ── */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">Alérgenos</label>
          <div className="flex flex-wrap gap-2">
            {ALLERGENS.map((a) => {
              const selected = form.allergens.includes(a.value);
              return (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => toggleAllergen(a.value)}
                  className={cn(
                    "rounded-full px-3 py-1 text-xs font-medium border transition-all",
                    selected
                      ? "bg-amber-100 dark:bg-amber-900/40 border-amber-400 text-amber-800 dark:text-amber-300"
                      : "bg-muted/30 border-border text-muted-foreground hover:border-amber-400/60"
                  )}
                >
                  {a.emoji} {a.label}
                </button>
              );
            })}
          </div>
          {form.allergens.length > 0 && (
            <p className="text-[10px] text-muted-foreground">
              Seleccionados: {form.allergens.map((a) => ALLERGENS.find((x) => x.value === a)?.label).join(", ")}
            </p>
          )}
        </div>

        {/* ── Error / Success feedback ── */}
        {formError && (
          <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3 border border-destructive/20">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{formError}</span>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-950/30 rounded-lg px-4 py-3 border border-green-200 dark:border-green-800">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>¡Plato añadido correctamente! Ya es visible en el catálogo.</span>
          </div>
        )}

        {/* ── Submit ── */}
        <button
          type="submit"
          disabled={submitting}
          className={cn(
            buttonVariants({ size: "lg" }),
            "w-full gap-2 font-bold text-base"
          )}
        >
          {submitting ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Subiendo plato...</>
          ) : (
            <><PlusCircle className="w-5 h-5" /> Añadir plato al catálogo</>
          )}
        </button>
      </form>
    </div>
  );
}
