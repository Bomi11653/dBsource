"use client";

import type { ContactInfo } from "@/data/mock";
import { useI18n } from "@/components/I18nProvider";
import { resolveMapEmbedSrc, resolveMapNavUrl } from "@/lib/amap-map";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Mail, MapPin, Navigation, Phone } from "lucide-react";

function SectionHeading({
  eyebrow,
  title,
  description,
  compact,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "mb-3 sm:mb-4" : "mb-5 sm:mb-6"}>
      {eyebrow ? (
        <p className="text-[11px] uppercase tracking-[0.28em] text-gray-500 mb-2">{eyebrow}</p>
      ) : null}
      <h2 className="text-lg sm:text-xl font-medium text-white">{title}</h2>
      {description ? (
        <p className="text-sm text-gray-500 mt-1.5 max-w-2xl leading-relaxed">{description}</p>
      ) : null}
    </div>
  );
}

function MapNavButton({ href, className = "" }: { href: string; className?: string }) {
  const { t } = useI18n();

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex w-full sm:w-auto min-h-[44px] items-center justify-center gap-2 px-6 rounded-xl border border-brand-gold/40 bg-brand-gold/10 text-brand-gold text-sm font-medium hover:bg-brand-gold/20 transition-colors touch-active ${className}`}
    >
      <Navigation size={16} aria-hidden />
      {t.contact.openMapNav}
    </a>
  );
}

const MAP_HEIGHT_CLASS = "h-[260px] lg:h-[280px]";
const MAP_SHELL_CLASS = `contact-map-shell rounded-2xl overflow-hidden border border-white/10 bg-zinc-950 [contain:layout_paint] ${MAP_HEIGHT_CLASS} w-full`;

function MapActionButton({
  onClick,
  children,
  variant = "secondary",
}: {
  onClick: () => void;
  children: ReactNode;
  variant?: "primary" | "secondary";
}) {
  const base =
    "inline-flex w-full sm:w-auto min-h-[44px] items-center justify-center gap-2 px-6 rounded-xl text-sm font-medium transition-colors touch-active";
  const styles =
    variant === "primary"
      ? "border border-brand-gold/40 bg-brand-gold/10 text-brand-gold hover:bg-brand-gold/20"
      : "border border-white/20 bg-white/5 text-white hover:bg-white/10";

  return (
    <button type="button" onClick={onClick} className={`${base} ${styles}`}>
      {children}
    </button>
  );
}

function MapCard({
  allowEmbed,
  showMapEmbed,
  mapEmbedSrc,
  companyName,
  mapDisplayAddress,
  showMapNavButton,
  mapNavUrl,
  isMapVisible,
  onShowMap,
  onHideMap,
}: {
  allowEmbed: boolean;
  showMapEmbed: boolean;
  mapEmbedSrc: string;
  companyName: string;
  mapDisplayAddress: string;
  showMapNavButton: boolean;
  mapNavUrl: string;
  isMapVisible: boolean;
  onShowMap: () => void;
  onHideMap: () => void;
}) {
  const { t } = useI18n();
  const showIframe = isMapVisible && showMapEmbed && allowEmbed;

  const actionRow = (
    <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full sm:w-auto">
      {showMapNavButton ? <MapNavButton href={mapNavUrl} /> : null}
      {showMapEmbed && allowEmbed ? (
        showIframe ? (
          <MapActionButton onClick={onHideMap}>{t.contact.hideMap}</MapActionButton>
        ) : (
          <MapActionButton onClick={onShowMap} variant="primary">
            {t.contact.viewMap}
          </MapActionButton>
        )
      ) : null}
    </div>
  );

  if (!showMapEmbed) {
    return (
      <div className="space-y-3 min-w-0">
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 flex flex-col items-center justify-center gap-3 text-center min-w-0">
          {mapDisplayAddress ? (
            <p className="text-sm text-gray-400 leading-relaxed max-w-md break-words">
              {mapDisplayAddress}
            </p>
          ) : null}
          <p className="text-xs text-gray-500 leading-relaxed max-w-sm">{t.contact.mapNotConfigured}</p>
          {showMapNavButton ? actionRow : null}
        </div>
      </div>
    );
  }

  if (showIframe) {
    return (
      <div className="space-y-3 min-w-0">
        <div className={MAP_SHELL_CLASS}>
          <iframe
            title={companyName}
            src={mapEmbedSrc}
            className="h-full w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
        {actionRow}
      </div>
    );
  }

  return (
    <div className="space-y-3 min-w-0">
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 flex flex-col items-center justify-center gap-3 text-center min-w-0">
        {mapDisplayAddress ? (
          <p className="text-sm text-gray-400 leading-relaxed max-w-md break-words">
            {mapDisplayAddress}
          </p>
        ) : null}
        <p className="text-xs text-gray-500 leading-relaxed max-w-sm">{t.contact.mapLoadHint}</p>
        {actionRow}
      </div>
    </div>
  );
}

function useIsLgViewport(): boolean | null {
  const [isLg, setIsLg] = useState<boolean | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsLg(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return isLg;
}

type MapEmbedWhen = "lg" | "below-lg";

type ContactInfoSectionProps = {
  contact: ContactInfo;
  layout?: "stack" | "split";
  mapEmbedWhen?: MapEmbedWhen;
  showCompany?: boolean;
  showMap?: boolean;
  infoId?: string;
  mapId?: string;
};

export default function ContactInfoSection({
  contact,
  layout = "stack",
  mapEmbedWhen = "below-lg",
  showCompany = true,
  showMap = true,
  infoId = "contact-info",
  mapId = "contact-map",
}: ContactInfoSectionProps) {
  const { locale, t } = useI18n();
  const [isMapVisible, setIsMapVisible] = useState(false);
  const isLg = useIsLgViewport();

  const mapDisplayAddress =
    contact.mapDisplayAddress[locale] || contact.address[locale];
  const mapEmbedSrc = useMemo(
    () => resolveMapEmbedSrc(contact.mapEmbedUrl),
    [contact.mapEmbedUrl]
  );
  const showMapEmbed = Boolean(mapEmbedSrc);
  const mapNavUrl = useMemo(
    () => resolveMapNavUrl(contact.mapNavUrl, contact.mapQuery, mapDisplayAddress),
    [contact.mapNavUrl, contact.mapQuery, mapDisplayAddress]
  );
  const showMapNavButton = Boolean(mapNavUrl);
  const companyName = contact.company[locale];
  const allowEmbed = mapEmbedWhen === "lg" ? isLg === true : isLg === false;

  const mapCardProps = {
    showMapEmbed,
    mapEmbedSrc,
    companyName,
    mapDisplayAddress,
    showMapNavButton,
    mapNavUrl,
    isMapVisible,
    onShowMap: () => setIsMapVisible(true),
    onHideMap: () => setIsMapVisible(false),
    allowEmbed,
  };

  const companyCard = (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 space-y-4 overflow-hidden min-w-0">
      <h3 className="text-base sm:text-lg font-medium break-words">{contact.company[locale]}</h3>

      <div className="flex gap-3 min-w-0">
        <MapPin size={18} className="text-brand-gold/80 shrink-0 mt-0.5" aria-hidden />
        <div className="min-w-0 flex-1 space-y-3">
          <p className="text-sm text-gray-400 leading-relaxed break-words">
            {contact.address[locale]}
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-white/10">
        <div className="space-y-2 min-w-0">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">{t.contact.tel}</p>
          {contact.phones.map((phone) => (
            <a
              key={phone}
              href={`tel:${phone.replace(/\s/g, "")}`}
              className="flex items-center gap-2 text-sm text-brand-gold hover:underline break-all touch-active"
            >
              <Phone size={15} className="shrink-0" aria-hidden />
              <span className="tabular-nums tracking-wide">{phone}</span>
            </a>
          ))}
        </div>
        <div className="space-y-2 min-w-0">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">{t.contact.email}</p>
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-2 text-sm text-gray-300 hover:text-white break-all touch-active"
          >
            <Mail size={15} className="shrink-0" aria-hidden />
            {contact.email}
          </a>
        </div>
      </div>
    </div>
  );

  const infoSection = (
    <section id={infoId} className="scroll-mt-nav min-w-0">
      <SectionHeading title={t.contact.companySectionTitle} compact />
      {companyCard}
    </section>
  );

  const mapSection = (
    <section id={mapId} className="scroll-mt-nav min-w-0">
      <SectionHeading
        title={t.contact.mapSectionTitle}
        description={mapDisplayAddress}
        compact
      />
      <MapCard {...mapCardProps} />
    </section>
  );

  if (layout === "split") {
    return (
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-8 min-w-0">
        {showCompany ? infoSection : null}
        {showMap ? mapSection : null}
      </div>
    );
  }

  return (
    <div className="space-y-6 min-w-0">
      {showCompany ? infoSection : null}
      {showMap ? mapSection : null}
    </div>
  );
}
