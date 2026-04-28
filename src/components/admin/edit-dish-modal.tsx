"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { LoggerService } from "@/lib/logger";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import {
  ImagePlus,
  AlertTriangle,
  Loader2,
  X,
  Info,
  Save,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { Allergen } from "@/data/dishes";

/* ─── Types ──────────────────────────────────────────────────────────────── */

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

function euroStringToCents(value: string): number | null {
  const normalized = value.replace(",", ".").trim();
  const parsed = parseFloat(normalized);
  if (isNaN(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100);
}

function centsToEuroString(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

interface EditDishModalProps {
  dish: any;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

export function EditDishModal({ dish, categories, onClose, onSaved }: EditDishModalProps) {
  const supabase = createBrowserSupabaseClient();

  const [form, setForm] = useState({
    nameEs: dish.nameEs || "",
    nameEn: dish.nameEn || "",
    descriptionEs: dish.descriptionEs || "",
    descriptionEn: dish.descriptionEn || "",
    category: dish.category || "entrantes",
    priceCents: centsToEuroString(dish.priceCents || 0),
    allergens: dish.allergens || [],
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(dish.imageUrl || null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = useCallback((file: File | null) => {
    setImageError(null);
    if (!file) {
      setImageFile(null);
      setImagePreview(dish.imageUrl || null);
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setImageError("Solo se admiten imágenes JPG, PNG o WebP.");
      return;
    }

    if (file.size > 3 * 1024 * 1024) {
      setImageError("La imagen no puede superar los 3 MB.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, [dish.imageUrl]);

  const toggleAllergen = (allergen: Allergen) => {
    setForm((prev) => ({
      ...prev,
      allergens: prev.allergens.includes(allergen)
        ? prev.allergens.filter((a: Allergen) => a !== allergen)
        : [...prev.allergens, allergen],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.nameEs.trim()) { setFormError("El nombre en español es obligatorio."); return; }
    const cents = euroStringToCents(form.priceCents);
    if (cents === null) { setFormError("El precio no es válido. Usa el formato 10,50"); return; }
    
    setSubmitting(true);

    try {
      let finalImageUrl = dish.imageUrl;

      if (imageFile) {
        const ext = imageFile.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const slug = toSlug(form.nameEs);
        const filePath = `${slug}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("dish-images")
          .upload(filePath, imageFile, { upsert: false, contentType: imageFile.type });

        if (uploadError) throw new Error(`Error al subir imagen: ${uploadError.message}`);

        const { data: urlData } = supabase.storage
          .from("dish-images")
          .getPublicUrl(filePath);

        finalImageUrl = urlData?.publicUrl ?? "";
      }

      const isCustom = dish.isCustom;

      if (isCustom) {
        const { error: updateError } = await supabase.from("custom_dishes").update({
          category: form.category,
          name_es: form.nameEs.trim(),
          name_en: form.nameEn.trim(),
          description_es: form.descriptionEs.trim(),
          description_en: form.descriptionEn.trim(),
          price_cents: cents,
          image_path: finalImageUrl || "",
          allergens: form.allergens,
          updated_at: new Date().toISOString()
        }).eq("id", dish.id);

        if (updateError) throw new Error(`Error al guardar el plato: ${updateError.message}`);
      } else {
        // Edit static dish via override
        const { error: upsertError } = await supabase.from("dish_price_overrides").upsert({
          dish_id: dish.id,
          price_cents: cents,
          name_es: form.nameEs.trim(),
          name_en: form.nameEn.trim(),
          description_es: form.descriptionEs.trim(),
          description_en: form.descriptionEn.trim(),
          category: form.category,
          image_path: finalImageUrl || "",
          allergens: form.allergens,
          updated_at: new Date().toISOString()
        });
        if (upsertError) throw new Error(`Error al guardar el plato estático: ${upsertError.message}`);
      }

      onSaved();
    } catch (err) {
      LoggerService.error("EditDishModal:handleSubmit", err);
      setFormError(err instanceof Error ? err.message : "Error desconocido.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    setFormError(null);
    try {
      if (dish.isCustom) {
        const { error } = await supabase.from("custom_dishes").update({
          deleted_at: new Date().toISOString()
        }).eq("id", dish.id);
        if (error) throw new Error(`Error al eliminar: ${error.message}`);
      } else {
        const { error } = await supabase.from("dish_price_overrides").upsert({
          dish_id: dish.id,
          price_cents: dish.priceCents || 0,
          is_deleted: true,
          updated_at: new Date().toISOString()
        });
        if (error) throw new Error(`Error al eliminar: ${error.message}`);
      }
      onSaved();
    } catch (err) {
      LoggerService.error("EditDishModal:handleDelete", err);
      setFormError(err instanceof Error ? err.message : "Error desconocido.");
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in">
      <div className="bg-card w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-xl border">
        <div className="sticky top-0 bg-card/95 backdrop-blur z-10 border-b flex items-center justify-between px-6 py-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            Editar Plato: {dish.nameEs}
          </h2>
          <button onClick={onClose} className="p-2 -mr-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Image */}
          <div className="space-y-2">
            <label className="text-sm font-semibold">Imagen del plato</label>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "w-full rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden",
                imagePreview ? "border-primary/40 p-0" : "border-border hover:border-primary/60 bg-muted/20 hover:bg-muted/40 p-8"
              )}
            >
              {imagePreview ? (
                <div className="relative w-full aspect-square max-h-48 mx-auto">
                  <Image src={imagePreview} alt="Preview" fill className="object-cover" sizes="400px" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <span className="text-white text-sm font-bold">Cambiar imagen</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImagePlus className="w-8 h-8 opacity-50" />
                  <p className="font-semibold text-sm">Cambiar imagen</p>
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
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold">Nombre (Español)</label>
              <input
                type="text"
                value={form.nameEs}
                onChange={(e) => setForm((p) => ({ ...p, nameEs: e.target.value }))}
                maxLength={120}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold">Nombre (Inglés)</label>
              <input
                type="text"
                value={form.nameEn}
                onChange={(e) => setForm((p) => ({ ...p, nameEn: e.target.value }))}
                maxLength={120}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold">Descripción (ES)</label>
              <textarea
                value={form.descriptionEs}
                onChange={(e) => setForm((p) => ({ ...p, descriptionEs: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold">Descripción (EN)</label>
              <textarea
                value={form.descriptionEn}
                onChange={(e) => setForm((p) => ({ ...p, descriptionEn: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold">Categoría</label>
              <select
                value={form.category}
                onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                className="w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name_es}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-semibold">Precio (€)</label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="decimal"
                  value={form.priceCents}
                  onChange={(e) => setForm((p) => ({ ...p, priceCents: e.target.value }))}
                  className="w-full rounded-lg border bg-background px-3 py-2 pr-7 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">€</span>
              </div>
            </div>
          </div>

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
          </div>

          {formError && (
            <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 rounded-lg px-4 py-3 border border-destructive/20">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-3 pt-5 border-t mt-6">
            {!showDeleteConfirm ? (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className={cn(
                  buttonVariants({ variant: "destructive", size: "lg" }),
                  "w-full sm:w-auto gap-2 font-bold shadow-sm"
                )}
              >
                <Trash2 className="w-5 h-5" />
                Eliminar plato
              </button>
            ) : (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-destructive/10 p-2 rounded-xl border border-destructive/20 w-full sm:w-auto animate-in fade-in">
                <span className="text-sm font-bold text-destructive text-center sm:text-left px-2">¿Seguro?</span>
                <button
                  type="button"
                  disabled={deleting}
                  onClick={handleDelete}
                  className={cn(buttonVariants({ variant: "destructive", size: "default" }), "flex-1 font-bold")}
                >
                  {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Sí, eliminar"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className={cn(buttonVariants({ variant: "outline", size: "default" }), "flex-1 font-bold bg-background")}
                >
                  Cancelar
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || deleting}
              className={cn(
                buttonVariants({ size: "lg" }),
                "w-full sm:w-auto gap-2 font-bold px-8 shadow-sm"
              )}
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Guardar Cambios
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
