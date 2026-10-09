import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { CompareProvider } from "@/context/compare-context";
import { CompareDrawer } from "@/components/catalog/compare-drawer";

export function PublicShell({ children }: { children: React.ReactNode }) {
  return (
    <CompareProvider>
      <div className="flex min-h-screen flex-col bg-surface-alt">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-100 focus:bg-primary-600 focus:text-white focus:px-4 focus:py-2 focus:text-sm focus:rounded-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
        >
          Langsung ke konten
        </a>
        <Navbar />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
        <CompareDrawer />
      </div>
    </CompareProvider>
  );
}
