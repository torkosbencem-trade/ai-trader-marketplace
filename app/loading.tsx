export default function LoadingPage() {
  return (
    <main className="min-h-screen bg-[#05070D] text-white">
      <section className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="h-9 w-40 animate-pulse rounded-full bg-white/10" />
        <div className="mt-6 h-12 max-w-3xl animate-pulse rounded-2xl bg-white/10" />
        <div className="mt-4 h-5 max-w-2xl animate-pulse rounded-full bg-white/10" />
        <div className="mt-3 h-5 max-w-xl animate-pulse rounded-full bg-white/10" />

        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="h-40 animate-pulse rounded-3xl bg-white/[0.05]" />
          <div className="h-40 animate-pulse rounded-3xl bg-white/[0.05]" />
        </div>
      </section>
    </main>
  );
}
