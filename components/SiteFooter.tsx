import Footer from "./Footer";
import { getContactInfo, getQRCodes } from "@/lib/fetchCMS";

export default async function SiteFooter() {
  const [qrItems, contact] = await Promise.all([getQRCodes(), getContactInfo()]);
  return <Footer qrItems={qrItems} contact={contact} />;
}
