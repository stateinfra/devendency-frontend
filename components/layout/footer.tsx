import Link from "next/link";

const NAV = [
  { label: "글 검색", href: "/search" },
  { label: "태그", href: "/tags" },
  { label: "Design System", href: "/design-system" },
  { label: "GitHub", href: "https://github.com/stateinfra", external: true },
  { label: "Discord", href: "https://discord.gg/8q2Qr434Bg", external: true },
];

export function Footer() {
  return (
    <footer className="mt-auto border-t border-black/[0.06] dark:border-white/[0.06]">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 lg:px-16 py-8 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        {/* Left — brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xs font-semibold tracking-tight text-gray-900 dark:text-[#dcddde] shrink-0">
            Devendency
          </Link>

          <span className="hidden sm:block text-[11px] text-gray-300 dark:text-[#dcddde]/20">
            &copy; {new Date().getFullYear()} Stateinfra
          </span>
        </div>

        {/* Right — nav links, single row */}
        <nav className="flex flex-wrap items-center gap-x-3 sm:gap-x-5 gap-y-2">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              className="text-[11px] text-gray-400 dark:text-[#dcddde]/35 hover:text-gray-900 dark:hover:text-[#dcddde] transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile copyright */}
        <span className="sm:hidden text-[11px] text-gray-300 dark:text-[#dcddde]/20">
          &copy; {new Date().getFullYear()} Stateinfra
        </span>
      </div>
    </footer>
  );
}
