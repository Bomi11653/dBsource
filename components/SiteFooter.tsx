import Footer from "./Footer";
import { getQRCodes } from "@/lib/fetchCMS";

export default async function SiteFooter() {
  const qrItems = await getQRCodes();
  return <Footer qrItems={qrItems} />;
}
