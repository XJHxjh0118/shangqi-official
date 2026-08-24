import { http } from "@/utils/http";

export type SiteSettings = {
  id: number;
  siteNameZh: string;
  siteNameEn: string;
  logoUrl?: string | null;
  faviconUrl?: string | null;
  heroImageUrl?: string | null;
  seoKeywordsZh?: string | null;
  seoKeywordsEn?: string | null;
  seoDescriptionZh?: string | null;
  seoDescriptionEn?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  footerTextZh?: string | null;
  footerTextEn?: string | null;
  aboutTitleZh?: string | null;
  aboutTitleEn?: string | null;
  aboutBodyZh?: string | null;
  aboutBodyEn?: string | null;
  updatedAt?: string;
};

export const getSiteSettings = () =>
  http.request<{ code: number; data: SiteSettings; msg: string }>(
    "get",
    "/cms/site-settings/detail"
  );

export const updateSiteSettings = (data: Partial<SiteSettings>) =>
  http.request<{ code: number; data: SiteSettings; msg: string }>(
    "put",
    "/cms/site-settings/update",
    {
      data
    }
  );
