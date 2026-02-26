import { cookies } from "next/headers";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const customDomain = cookieStore.get("x-custom-domain")?.value ?? null;
  const customLogo = cookieStore.get("x-custom-logo")?.value || null;

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
