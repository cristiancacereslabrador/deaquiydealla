import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

/**
 * Helpers de navegación tipados (`Link`, `useRouter`, etc.) alineados con {@link routing}.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
