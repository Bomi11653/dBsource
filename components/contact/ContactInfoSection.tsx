"use client";

import type { ContactInfo } from "@/data/mock";
import { useI18n } from "@/components/I18nProvider";
import { resolveMapEmbedSrc, resolveMapNavUrl, resolveMapPreviewCoords, resolveMapPreviewImageUrl } from "@/lib/amap-map";
import { buildOsmEmbedUrl } from "@/lib/map-preview";
import { useMemo, useState, type ReactNode } from "react";
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

const MAP_PREVIEW_SHELL_CLASS =
  "contact-map-preview relative aspect-[2/1] max-h-[220px] sm:max-h-[240px] w-full overflow-hidden rounded-xl border border-white/10 bg-zinc-900";

const MAP_PREVIEW_FILL_CLASS =
  "contact-map-preview relative h-full min-h-[160px] w-full overflow-hidden bg-zinc-900";

function MapThumbnailPreview({
  previewUrl,
  mapNavUrl,
  mapDisplayAddress,
  openMapNavLabel,
  previewCoords = null,
  fill = false,
}: {
  previewUrl: string;
  mapNavUrl: string;
  mapDisplayAddress: string;
  openMapNavLabel: string;
  previewCoords?: { lng: number; lat: number } | null;
  fill?: boolean;
}) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(previewUrl) && !imageFailed;
  const showEmbed = !showImage && previewCoords;

  const frame = (
    <div className={fill ? MAP_PREVIEW_FILL_CLASS : MAP_PREVIEW_SHELL_CLASS}>
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewUrl}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
        />
      ) : showEmbed ? (
        <iframe
          title=""
          src={buildOsmEmbedUrl(previewCoords)}
          className="absolute inset-0 h-full w-full border-0 pointer-events-none scale-[1.02]"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div
          className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:24px_24px] bg-zinc-900"
          aria-hidden
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
      <div className="absolute bottom-3 left-3 right-3 flex items-end gap-2 pointer-events-none">
        <MapPin size={18} className="text-brand-gold shrink-0 mb-0.5" aria-hidden />
        {mapDisplayAddress ? (
          <p className="text-xs sm:text-sm text-white/90 leading-snug line-clamp-2 break-words">
            {mapDisplayAddress}
          </p>
        ) : null}
      </div>
    </div>
  );

  if (mapNavUrl) {
    return (
      <a
        href={mapNavUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block group touch-active"
        aria-label={openMapNavLabel}
      >
        {frame}
        <span className="sr-only">{openMapNavLabel}</span>
      </a>
    );
  }

  return frame;
}

function MapCard({
  showMapEmbed,
  mapEmbedSrc,
  companyName,
  mapDisplayAddress,
  showMapNavButton,
  mapNavUrl,
  mapPreviewUrl,
  mapPreviewCoords,
  isMapVisible,
  onShowMap,
  onHideMap,
  openMapNavLabel,
  unifiedCard = false,
}: {
  showMapEmbed: boolean;
  mapEmbedSrc: string;
  companyName: string;
  mapDisplayAddress: string;
  showMapNavButton: boolean;
  mapNavUrl: string;
  mapPreviewUrl: string;
  mapPreviewCoords: { lng: number; lat: number } | null;
  isMapVisible: boolean;
  onShowMap: () => void;
  onHideMap: () => void;
  openMapNavLabel: string;
  unifiedCard?: boolean;
}) {
  const { t } = useI18n();
  const showIframe = isMapVisible && showMapEmbed;

  const actionRow = (
    <div className={`flex flex-col sm:flex-row flex-wrap gap-3 w-full ${unifiedCard ? "" : "sm:w-auto"}`}>
      {showMapNavButton ? (
        <MapNavButton href={mapNavUrl} className={unifiedCard ? "w-full sm:w-auto" : ""} />
      ) : null}
      {showMapEmbed ? (
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

  const unifiedShell = (body: ReactNode) =>
    unifiedCard ? (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] flex flex-col lg:flex-1 lg:min-h-0 overflow-hidden">
        {body}
      </div>
    ) : (
      body
    );

  if (!showMapEmbed) {
    if (unifiedCard) {
      return unifiedShell(
        <>
          {mapPreviewUrl || mapDisplayAddress ? (
            <div className="lg:flex-1 lg:min-h-[160px] flex flex-col">
              <MapThumbnailPreview
                previewUrl={mapPreviewUrl}
                mapNavUrl={showMapNavButton ? mapNavUrl : ""}
                mapDisplayAddress={mapDisplayAddress}
                openMapNavLabel={openMapNavLabel}
                previewCoords={mapPreviewCoords}
                fill
              />
            </div>
          ) : (
            <div className="lg:flex-1 lg:min-h-[160px] flex items-center justify-center p-5 text-center">
              <p className="text-xs text-gray-500 leading-relaxed max-w-sm">{t.contact.mapNotConfigured}</p>
            </div>
          )}
          {showMapNavButton ? (
            <div className="p-4 sm:p-5 border-t border-white/10 shrink-0">{actionRow}</div>
          ) : null}
        </>
      );
    }

    return (
      <div className="space-y-3 min-w-0">
        {mapPreviewUrl || mapDisplayAddress ? (
          <MapThumbnailPreview
            previewUrl={mapPreviewUrl}
            mapNavUrl={showMapNavButton ? mapNavUrl : ""}
            mapDisplayAddress={mapDisplayAddress}
            openMapNavLabel={openMapNavLabel}
            previewCoords={mapPreviewCoords}
          />
        ) : null}
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 flex flex-col items-center justify-center gap-3 text-center min-w-0">
          {!mapPreviewUrl ? (
            <p className="text-xs text-gray-500 leading-relaxed max-w-sm">{t.contact.mapNotConfigured}</p>
          ) : null}
          {showMapNavButton ? actionRow : null}
        </div>
      </div>
    );
  }

  if (showIframe) {
    if (unifiedCard) {
      return unifiedShell(
        <>
          <div className={`${MAP_SHELL_CLASS} lg:flex-1 lg:min-h-[160px] rounded-none border-0`}>
            <iframe
              title={companyName}
              src={mapEmbedSrc}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
          <div className="p-4 sm:p-5 border-t border-white/10 shrink-0">{actionRow}</div>
        </>
      );
    }

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

  if (unifiedCard) {
    return unifiedShell(
      <>
        <div className="lg:flex-1 lg:min-h-[160px] flex flex-col">
          <MapThumbnailPreview
            previewUrl={mapPreviewUrl}
            mapNavUrl={showMapNavButton ? mapNavUrl : ""}
            mapDisplayAddress={mapDisplayAddress}
            openMapNavLabel={openMapNavLabel}
            fill
          />
        </div>
        <div className="p-4 sm:p-5 border-t border-white/10 shrink-0">{actionRow}</div>
      </>
    );
  }

  return (
    <div className="space-y-3 min-w-0">
      <MapThumbnailPreview
        previewUrl={mapPreviewUrl}
        mapNavUrl={showMapNavButton ? mapNavUrl : ""}
        mapDisplayAddress={mapDisplayAddress}
        openMapNavLabel={openMapNavLabel}
        previewCoords={mapPreviewCoords}
      />
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full sm:w-auto">{actionRow}</div>
    </div>
  );
}

function useContactMapFields(contact: ContactInfo) {
  const { locale } = useI18n();

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
  const mapPreviewCoords = useMemo(
    () =>
      resolveMapPreviewCoords(
        contact.mapNavUrl,
        contact.mapQuery,
        mapDisplayAddress
      ),
    [contact.mapNavUrl, contact.mapQuery, mapDisplayAddress]
  );
  const mapPreviewUrl = useMemo(
    () =>
      resolveMapPreviewImageUrl(
        contact.mapNavUrl,
        contact.mapQuery,
        mapDisplayAddress
      ),
    [contact.mapNavUrl, contact.mapQuery, mapDisplayAddress]
  );

  return {
    locale,
    mapDisplayAddress,
    mapEmbedSrc,
    showMapEmbed,
    mapNavUrl,
    showMapNavButton,
    companyName,
    mapPreviewUrl,
    mapPreviewCoords,
  };
}

export function ContactCompanySection({
  contact,
  infoId = "contact-info",
  className = "",
  balanced = false,
}: {
  contact: ContactInfo;
  infoId?: string;
  className?: string;
  balanced?: boolean;
}) {
  const { locale, t } = useI18n();

  return (
    <section
      id={infoId}
      className={`${className}${balanced ? " lg:flex lg:flex-col lg:h-full lg:min-h-0" : ""}`}
    >
      <SectionHeading title={t.contact.companySectionTitle} compact />
      <div
        className={`rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5 space-y-4 overflow-hidden min-w-0${
          balanced ? " lg:flex-1 lg:flex lg:flex-col" : ""
        }`}
      >
        <h3 className="text-base sm:text-lg font-medium break-words">{contact.company[locale]}</h3>

        <div className="flex gap-3 min-w-0">
          <MapPin size={18} className="text-brand-gold/80 shrink-0 mt-0.5" aria-hidden />
          <div className="min-w-0 flex-1 space-y-3">
            <p className="text-sm text-gray-400 leading-relaxed break-words">
              {contact.address[locale]}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-white/10">
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
    </section>
  );
}

export function ContactMapSection({
  contact,
  mapId = "contact-map",
  className = "",
  balanced = false,
}: {
  contact: ContactInfo;
  mapId?: string;
  className?: string;
  balanced?: boolean;
}) {
  const { t } = useI18n();
  const [isMapVisible, setIsMapVisible] = useState(false);
  const {
    mapDisplayAddress,
    mapEmbedSrc,
    showMapEmbed,
    mapNavUrl,
    showMapNavButton,
    companyName,
    mapPreviewUrl,
    mapPreviewCoords,
  } = useContactMapFields(contact);

  return (
    <section
      id={mapId}
      className={`${className}${balanced ? " lg:flex lg:flex-col lg:h-full lg:min-h-0" : ""}`}
    >
      <SectionHeading
        title={t.contact.mapSectionTitle}
        description={balanced ? undefined : mapDisplayAddress}
        compact
      />
      <div className={balanced ? "flex flex-col lg:flex-1 lg:min-h-0" : undefined}>
        <MapCard
          showMapEmbed={showMapEmbed}
          mapEmbedSrc={mapEmbedSrc}
          companyName={companyName}
          mapDisplayAddress={mapDisplayAddress}
          showMapNavButton={showMapNavButton}
          mapNavUrl={mapNavUrl}
          mapPreviewUrl={mapPreviewUrl}
          mapPreviewCoords={mapPreviewCoords}
          isMapVisible={isMapVisible}
          onShowMap={() => setIsMapVisible(true)}
          onHideMap={() => setIsMapVisible(false)}
          openMapNavLabel={t.contact.openMapNav}
          unifiedCard={balanced}
        />
      </div>
    </section>
  );
}

/** @deprecated 请改用 ContactDetailsLayout */
export default function ContactInfoSection({
  contact,
  layout = "stack",
  showCompany = true,
  showMap = true,
  infoId = "contact-info",
  mapId = "contact-map",
}: {
  contact: ContactInfo;
  layout?: "stack" | "split";
  showCompany?: boolean;
  showMap?: boolean;
  infoId?: string;
  mapId?: string;
}) {
  const containerClass =
    layout === "split" ? "grid gap-6 lg:grid-cols-2 lg:gap-8 min-w-0" : "space-y-6 min-w-0";

  return (
    <div className={containerClass}>
      {showCompany ? (
        <ContactCompanySection contact={contact} infoId={infoId} />
      ) : null}
      {showMap ? <ContactMapSection contact={contact} mapId={mapId} /> : null}
    </div>
  );
}
