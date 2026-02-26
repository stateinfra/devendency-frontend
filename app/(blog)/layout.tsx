import { headers } from "next/headers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h = await headers();
  const customDomain = h.get("x-custom-domain") ?? null;
  const customLogo = h.get("x-custom-logo") ?? null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header customDomain={customDomain} customLogo={customLogo} />
      <main className="flex-grow w-full max-w-[1200px] mx-auto px-4 md:px-6 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
}
