export function PublicShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col bg-[#EDEDED] text-neutral-900">
      <header className="sticky top-0 z-10 border-b border-[#e6e8e3] bg-white/95 px-4 py-3 backdrop-blur">
        <p className="text-xs font-medium text-[#1B6B32]">AIキッチン秘書</p>
        <h1 className="text-xl font-bold text-neutral-900">{title}</h1>
      </header>
      <main className="flex flex-1 flex-col gap-4 px-4 py-4">{children}</main>
    </div>
  );
}
