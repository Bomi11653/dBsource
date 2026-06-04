"use client";

import LanguageSwitch from "./LanguageSwitch";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useI18n } from "./I18nProvider";

const links = [
  { href: "/", key: "home" as const },
  { href: "/about", key: "about" as const },
  { href: "/products", key: "products" as const },
  { href: "/downloads", key: "downloads" as const },
  { href: "/cases", key: "cases" as const },
  { href: "/contact", key: "contact" as const },
];

export default function Navbar() {
  const { t } = useI18n();
  const pathname = usePathname();

  return (
    <header className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto flex justify-between items-center px-6 md:px-10 py-4 md:py-5">
        <Link
          href="/"
          className="font-light tracking-[0.25em] text-lg text-white hover:opacity-90 transition-opacity"
        >
          dB<span className="text-brand-gold">source</span>
        </Link>

        <nav className="hidden lg:flex gap-8 text-sm text-gray-300">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`hover:text-white transition-colors ${
                pathname === link.href ? "text-white" : ""
              }`}
            >
              {t.nav[link.key]}
            </Link>
          ))}
        </nav>

        <LanguageSwitch />
      </div>

      <nav className="lg:hidden flex overflow-x-auto gap-4 px-6 pb-3 text-xs">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`whitespace-nowrap ${
              pathname === link.href ? "text-white" : "text-gray-400"
            }`}
          >
            {t.nav[link.key]}
          </Link>
        ))}
      </nav>
    </header>
  );
}
