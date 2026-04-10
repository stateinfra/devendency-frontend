import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow w-full px-4 sm:px-6 md:px-12 lg:px-16 py-4 sm:py-6 md:py-8 relative">
        {children}
      </main>
      <Footer />
    </div>
  );
}
