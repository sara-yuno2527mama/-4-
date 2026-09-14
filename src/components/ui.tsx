import {
  forwardRef,
  type ButtonHTMLAttributes,
  type ComponentType,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  const hasBg = /(^|\s)!?bg-/.test(className);
  return (
    <section
      className={`rounded-2xl border border-[#e6e8e3] p-4 ${hasBg ? "" : "bg-white"} ${className}`}
    >
      {children}
    </section>
  );
}

export function PrimaryButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`min-h-11 rounded-xl bg-[#1B6B32] px-3 py-2 text-base font-semibold text-white hover:bg-[#155828] disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

export function SecondaryButton({
  children,
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`min-h-11 rounded-xl border border-[#e6e8e3] bg-white px-3 py-2 text-base font-semibold text-neutral-800 disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  );
}

/** Disney寄せの下線タブ。選中は緑文字＋タブ幅の下線。四角塗りつぶしは使わない */
export function UnderlineTabs<T extends string>({
  items,
  value,
  onChange,
  className = "",
}: {
  items: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div className={`flex border-b border-[#e6e8e3] ${className}`}>
      {items.map((item) => {
        const selected = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            className={`relative min-h-11 flex-1 py-2.5 text-center text-base font-semibold ${
              selected ? "text-[#1B6B32]" : "text-[#525252]"
            }`}
            onClick={() => onChange(item.id)}
          >
            {item.label}
            {selected ? (
              <span className="absolute inset-x-0 bottom-0 h-[3px] bg-[#1B6B32]" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/** カードのセクション見出し。画面ごとに class を足し引きしない */
export function SectionTitle({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <h2 className="flex min-w-0 items-center gap-2 text-lg font-bold text-neutral-900">
        <span
          aria-hidden
          className="inline-block h-[1em] w-[3px] shrink-0 rounded-sm bg-[#1B6B32]"
        />
        {children}
      </h2>
      {action}
    </div>
  );
}

/** 脇役の操作。緑の塗り・枠は使わない */
export const actionLinkClass =
  "inline-flex min-h-11 items-center text-base font-semibold text-[#1B6B32]";

/** カード内の主アクション。白地＋緑枠＋緑文字。文字リンクと並べない */
export const outlineActionClass =
  "inline-flex min-h-11 w-full items-center justify-center rounded-lg border border-[#1B6B32] bg-white px-3 text-base font-semibold text-[#1B6B32]";

/** 「これにする」だけ少し濃く。塗りつぶしは使わない */
export const confirmLinkClass =
  "inline-flex min-h-11 items-center text-base font-bold text-[#1B6B32]";

/** 状態のバッジ（定番・提案）。本文と別要素にして truncate で切れないようにする */
export function StateBadge({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 rounded-md bg-[#EDEDED] px-2 py-0.5 text-xs font-semibold text-neutral-600">
      {children}
    </span>
  );
}

/** 白抜き選択の1つ分。リンクなど button 以外にも同じ見た目を当てられるように出す */
export function boxedChoiceClass(selected: boolean): string {
  return `min-h-11 flex-1 basis-24 rounded-lg border border-[#1B6B32] px-2 py-2 text-center text-base font-semibold leading-snug ${
    selected ? "bg-[#1B6B32] text-white" : "bg-white text-[#1B6B32]"
  }`;
}

/** 選択肢をまとめて囲む枠 */
export function BoxedChoiceFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border-2 border-[#1B6B32] p-2 ${className}`}>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

/** 白抜きの選択列。選中は濃い緑の塗り＋白文字、非選は白地＋緑の枠と文字 */
export function BoxedChoiceRow<T extends string>({
  items,
  value,
  onChange,
  framed = false,
  className = "",
}: {
  items: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  /** 3択を枠で囲むとき */
  framed?: boolean;
  className?: string;
}) {
  const buttons = items.map((item) => (
    <button
      key={item.id}
      type="button"
      className={boxedChoiceClass(item.id === value)}
      onClick={() => onChange(item.id)}
    >
      {item.label}
    </button>
  ));

  if (framed) {
    return <BoxedChoiceFrame className={className}>{buttons}</BoxedChoiceFrame>;
  }
  return (
    <div className={className}>
      <div className="flex flex-wrap gap-2">{buttons}</div>
    </div>
  );
}

/** 白いカード2枚。選中だけ濃い緑の枠。濃い緑の外枠は使わない */
export function SplitChoiceRow<T extends string>({
  items,
  value,
  onChange,
}: {
  items: {
    id: T;
    label: string;
    icon: ComponentType<{ className?: string; strokeWidth?: number }>;
  }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex gap-1.5">
      {items.map((item) => {
        const selected = item.id === value;
        const Icon = item.icon;
        return (
          <button
            key={item.id}
            type="button"
            className={`flex min-h-11 min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-xl border-2 bg-white px-1 py-3 ${
              selected ? "border-[#1B6B32]" : "border-[#e6e8e3]"
            }`}
            onClick={() => onChange(item.id)}
          >
            <span
              className={selected ? "text-[#1B6B32]" : "text-[#525252]"}
            >
              <Icon className="size-7" strokeWidth={1.6} />
            </span>
            <span
              className={`text-center text-base font-semibold leading-tight ${
                selected ? "text-[#1B6B32]" : "text-[#525252]"
              }`}
            >
              {item.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export const Field = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Field({ className = "", ...props }, ref) {
    return (
      <input
        ref={ref}
        {...props}
        className={`min-h-11 w-full rounded-lg border border-[#e6e8e3] bg-white px-3 py-2 text-base ${className}`}
      />
    );
  },
);
