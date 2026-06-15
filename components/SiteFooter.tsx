import Footer from "./Footer";
import { getContactInfo, getQRCodes, getSocialLinks } from "@/lib/fetchCMS";

export default async function SiteFooter() {
  const [qrItems, contact, socialLinks] = await Promise.all([
    getQRCodes(),
    getContactInfo(),
    getSocialLinks(),
  ]);
  return <Footer qrItems={qrItems} contact={contact} socialLinks={socialLinks} />;
}
