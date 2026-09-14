import {
  DEFAULT_OISIX,
  DEFAULT_OISIX_DELIVERY,
  type DeliveryKind,
  type DeliveryService,
  type KitchenState,
  type OisixCycle,
} from "./types";
import { sanitizeMarkImageDataUrl } from "./delivery-mark";
import { mergeOisixDraft } from "./oisix-extract";

export const DELIVERY_KIND_LABELS: Record<Exclude<DeliveryKind, "other">, string> =
  {
    oisix: "オイシックス",
    fcoop: "エフコープ",
  };

export function cycleOf(service: DeliveryService): OisixCycle {
  return {
    deliveryDate: service.deliveryDate,
    changeDeadlineAt: service.changeDeadlineAt,
    amount: service.amount,
    menuItems: service.menuItems,
    ingredients: service.ingredients,
    pendingPlus14: service.pendingPlus14,
  };
}

export function applyCycle(
  service: DeliveryService,
  cycle: OisixCycle,
): DeliveryService {
  return { ...service, ...cycle };
}

function kindOf(value: unknown): DeliveryKind | null {
  if (value === "oisix" || value === "fcoop" || value === "other") return value;
  return null;
}

export function normalizeDeliveryService(
  raw: Partial<DeliveryService> & { id?: string },
): DeliveryService | null {
  const kind = kindOf(raw.kind) ?? (raw.name === "オイシックス" ? "oisix" : null);
  if (!kind) return null;
  const name =
    kind === "oisix"
      ? "オイシックス"
      : kind === "fcoop"
        ? "エフコープ"
        : String(raw.name ?? "").trim();
  if (kind === "other" && !name) return null;
  const markImageDataUrl = sanitizeMarkImageDataUrl(kind, raw.markImageDataUrl);
  return {
    id: raw.id || crypto.randomUUID(),
    kind,
    name,
    showOnHome: raw.showOnHome !== false,
    markImageDataUrl,
    deliveryDate: raw.deliveryDate || null,
    changeDeadlineAt: raw.changeDeadlineAt || null,
    amount: String(raw.amount ?? ""),
    menuItems: Array.isArray(raw.menuItems)
      ? raw.menuItems.map((item) => String(item).trim()).filter(Boolean)
      : [],
    ingredients: Array.isArray(raw.ingredients)
      ? raw.ingredients.map((item) => String(item).trim()).filter(Boolean)
      : [],
    pendingPlus14: Boolean(raw.pendingPlus14),
  };
}

function oisixFromCycle(cycle: OisixCycle, showOnHome: boolean): DeliveryService {
  return {
    ...DEFAULT_OISIX_DELIVERY,
    showOnHome,
    deliveryDate: cycle.deliveryDate,
    changeDeadlineAt: cycle.changeDeadlineAt,
    amount: cycle.amount ?? "",
    menuItems: cycle.menuItems ?? [],
    ingredients: cycle.ingredients ?? [],
    pendingPlus14: Boolean(cycle.pendingPlus14),
  };
}

/** deliveries が無い旧データはオイシックス・ホームに出すへ移す */
export function migrateDeliveries(
  deliveries: unknown,
  oisix: Partial<OisixCycle> | null | undefined,
): DeliveryService[] {
  if (Array.isArray(deliveries)) {
    return deliveries
      .map((item) =>
        normalizeDeliveryService(
          (item ?? {}) as Partial<DeliveryService> & { id?: string },
        ),
      )
      .filter((item): item is DeliveryService => Boolean(item));
  }
  const cycle: OisixCycle = {
    ...DEFAULT_OISIX,
    ...oisix,
  };
  return [oisixFromCycle(cycle, true)];
}

export function oisixMirror(deliveries: DeliveryService[]): OisixCycle {
  const found = deliveries.find((item) => item.kind === "oisix");
  return found ? cycleOf(found) : DEFAULT_OISIX;
}

export function withDeliveries(
  state: KitchenState,
  deliveries: DeliveryService[],
): KitchenState {
  return {
    ...state,
    deliveries,
    oisix: oisixMirror(deliveries),
  };
}

export function patchDelivery(
  state: KitchenState,
  id: string,
  patch: Partial<DeliveryService>,
): KitchenState {
  return withDeliveries(
    state,
    (state.deliveries ?? []).map((item) => {
      if (item.id !== id) return item;
      const next = { ...item, ...patch };
      return {
        ...next,
        markImageDataUrl: sanitizeMarkImageDataUrl(
          next.kind,
          next.markImageDataUrl,
        ),
      };
    }),
  );
}

export function removeDelivery(state: KitchenState, id: string): KitchenState {
  return withDeliveries(
    state,
    (state.deliveries ?? []).filter((item) => item.id !== id),
  );
}

export function homeDeliveries(state: KitchenState): DeliveryService[] {
  return (state.deliveries ?? []).filter((item) => item.showOnHome);
}

export function mergeDeliveryDraft(
  base: DeliveryService,
  next: Partial<OisixCycle>,
): DeliveryService {
  return applyCycle(base, mergeOisixDraft(cycleOf(base), next));
}

export function createDelivery(
  kind: DeliveryKind,
  customName?: string,
): DeliveryService | null {
  if (kind === "oisix") {
    return { ...DEFAULT_OISIX_DELIVERY, id: crypto.randomUUID() };
  }
  if (kind === "fcoop") {
    return {
      id: crypto.randomUUID(),
      kind: "fcoop",
      name: "エフコープ",
      showOnHome: true,
      markImageDataUrl: null,
      ...DEFAULT_OISIX,
    };
  }
  const name = customName?.trim();
  if (!name) return null;
  return {
    id: crypto.randomUUID(),
    kind: "other",
    name,
    showOnHome: true,
    markImageDataUrl: null,
    ...DEFAULT_OISIX,
  };
}

export function canAddKind(
  deliveries: DeliveryService[],
  kind: Exclude<DeliveryKind, "other">,
): boolean {
  return !deliveries.some((item) => item.kind === kind);
}
