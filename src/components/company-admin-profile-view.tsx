import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { Avatar, Form, Input, message, Modal, QRCode } from "antd";
import {CalendarOutlined,CameraOutlined,ContactsOutlined,CreditCardOutlined,DeleteOutlined,EnvironmentOutlined,FacebookOutlined,GlobalOutlined,InstagramOutlined,LinkOutlined,LinkedinOutlined,MailOutlined,MessageOutlined,PhoneOutlined,PlusOutlined,SendOutlined,TikTokOutlined,UploadOutlined,WhatsAppOutlined,XOutlined,YoutubeOutlined,} from "@ant-design/icons";
import type { EditableProfileValues, ProfileSocialAccount } from "../types/layout.type";
import { AppButton } from './ui/app-button';
import { CommonBusinessCardView, type BusinessCardViewModel } from './common-business-card-view';

interface CompanyAdminProfileViewProps {
  displayName: string;
  companyName?: string;
  companyLogo?: string;
  avatarSrc?: string;
  initials: string;
  profileDetails?: { label: string; value?: string }[];
  initialValues?: EditableProfileValues;
  onSave?: (values: EditableProfileValues) => Promise<void>;
  onUploadPhoto?: (file: File) => Promise<void>;
  onUploadCardBackground?: (file: File) => Promise<string>;
  onUploadSocialIcon?: (file: File) => Promise<string>;
  initialEditing?: boolean;
  onCancelEdit?: () => void;
  successMessage?: string;
}

const clean = (value?: string) => String(value || "").trim();

const escapeVCardValue = (value?: string) =>
  clean(value)
    .replace(/\\/g, "\\\\")
    .replace(/\r?\n/g, "\\n")
    .replace(/,/g, "\\,")
    .replace(/;/g, "\\;");

const platformMarker = (platform?: string, profileUrl?: string) => `${clean(platform)} ${clean(profileUrl)}`.toLowerCase();

const socialIcon = (platform?: string, profileUrl?: string) => {
  const value = platformMarker(platform, profileUrl);
  if (value.includes("linkedin")) return <LinkedinOutlined />;
  if (value.includes("facebook")) return <FacebookOutlined />;
  if (value.includes("instagram")) return <InstagramOutlined />;
  if (value.includes("tiktok")) return <TikTokOutlined />;
  if (value.includes("twitter") || value.includes("x.com") || clean(platform).toLowerCase() === "x") return <XOutlined />;
  if (value.includes("phone") || value.includes("telefon") || value.includes("tel:")) return <PhoneOutlined />;
  if (value.includes("email") || value.includes("mail") || value.includes("e-poçt")) return <MailOutlined />;
  if (value.includes("whatsapp") || value.includes("wa.me")) return <WhatsAppOutlined />;
  if (value.includes("telegram") || value.includes("t.me")) return <SendOutlined />;
  if (value.includes("message") || value.includes("sms") || value.includes("mesaj")) return <MessageOutlined />;
  if (value.includes("youtube")) return <YoutubeOutlined />;
  if (value.includes("contact") || value.includes("kontakt")) return <ContactsOutlined />;
  if (value.includes("kart hesab") || value.includes("iban")) return <CreditCardOutlined />;
  if (value.includes("görüş") || value.includes("meeting") || value.includes("calend")) return <CalendarOutlined />;
  if (value.includes("map") || value.includes("ünvan") || value.includes("address")) return <EnvironmentOutlined />;
  if (value.includes("site") || value.includes("web") || value.includes("http")) return <GlobalOutlined />;
  return <LinkOutlined />;
};

const normalizePlatformKey = (platform?: string, profileUrl?: string) => {
  const value = platformMarker(platform, profileUrl).replace(/[\s._-]+/g, "");
  if (value.includes("linkedin")) return "linkedin";
  if (value.includes("facebook") || value === "fb") return "facebook";
  if (value.includes("instagram") || value === "insta") return "instagram";
  if (value.includes("whatsapp") || value.includes("wa.me")) return "whatsapp";
  if (value.includes("youtube")) return "youtube";
  if (value.includes("tiktok")) return "tiktok";
  if (value.includes("telegram") || value.includes("t.me")) return "telegram";
  if (value.includes("twitter") || value.includes("x.com") || clean(platform).toLowerCase() === "x") return "x";
  if (value.includes("telefon") || value.includes("phone") || value.includes("tel:")) return "telefon";
  if (value.includes("email") || value.includes("mail") || value.includes("epoçt")) return "e-poçt";
  if (value.includes("ünvan") || value.includes("address") || value.includes("maps")) return "ünvan";
  if (value.includes("görüş") || value.includes("meeting") || value.includes("calend")) return "görüş";
  if (value.includes("karthesabı") || value.includes("iban")) return "kart hesabı";
  if (value.includes("sayt") || value.includes("website") || value.includes("web")) return "sayt";
  if (value.includes("özəllink") || value.includes("custom")) return "özəl link";
  return clean(platform).toLowerCase();
};

const normalizeUrlKey = (url?: string) =>
  clean(url)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");

const STANDARD_SOCIAL_KEYS = new Set(["linkedin", "facebook", "instagram"]);

type LinkPreset = {
  name: string;
  label: string;
  category: "contact" | "social" | "business";
  icon: ReactNode;
  placeholder: string;
  helper: string;
};

const LINK_ICON_PRESETS: LinkPreset[] = [
  { name: "Telefon", label: "Telefon", category: "contact", icon: <PhoneOutlined />, placeholder: "+994 50 000 00 00", helper: "Telefon nömrəsini daxil edin." },
  { name: "E-poçt", label: "E-poçt", category: "contact", icon: <MailOutlined />, placeholder: "example@mail.com", helper: "E-poçt ünvanını daxil edin." },
  { name: "Ünvan", label: "Ünvan", category: "contact", icon: <EnvironmentOutlined />, placeholder: "Google Maps linki və ya ünvan", helper: "Ünvan və ya xəritə linkini daxil edin." },
  { name: "Görüş", label: "Görüş", category: "contact", icon: <CalendarOutlined />, placeholder: "https://calendly.com/...", helper: "Görüş və ya rezervasiya linkini daxil edin." },
  { name: "Instagram", label: "Instagram", category: "social", icon: <InstagramOutlined />, placeholder: "@istifadəçi_adı və ya link", helper: "Instagram istifadəçi adını və ya profil linkini daxil edin." },
  { name: "LinkedIn", label: "LinkedIn", category: "social", icon: <LinkedinOutlined />, placeholder: "linkedin.com/in/...", helper: "LinkedIn profil linkini daxil edin." },
  { name: "Facebook", label: "Facebook", category: "social", icon: <FacebookOutlined />, placeholder: "facebook.com/...", helper: "Facebook profil linkini daxil edin." },
  { name: "X", label: "X", category: "social", icon: <XOutlined />, placeholder: "@istifadəçi_adı və ya x.com/...", helper: "X profilini daxil edin." },
  { name: "YouTube", label: "YouTube", category: "social", icon: <YoutubeOutlined />, placeholder: "youtube.com/@...", helper: "YouTube kanal linkini daxil edin." },
  { name: "Telegram", label: "Telegram", category: "social", icon: <SendOutlined />, placeholder: "@istifadəçi_adı və ya t.me/...", helper: "Telegram istifadəçi adını və ya linkini daxil edin." },
  { name: "TikTok", label: "TikTok", category: "social", icon: <TikTokOutlined />, placeholder: "@istifadəçi_adı və ya tiktok.com/@...", helper: "TikTok profilini daxil edin." },
  { name: "WhatsApp", label: "WhatsApp", category: "social", icon: <WhatsAppOutlined />, placeholder: "+994 50 000 00 00", helper: "WhatsApp nömrəsini daxil edin." },
  { name: "Sayt", label: "Sayt", category: "business", icon: <GlobalOutlined />, placeholder: "https://example.com", helper: "Şirkət və ya şəxsi sayt linkini daxil edin." },
  { name: "Kart hesabı", label: "Kart hesabı", category: "business", icon: <CreditCardOutlined />, placeholder: "AZ00 XXXX 0000 0000 0000 0000 0000", helper: "IBAN yazın; kartda toxunanda kopyalansın." },
  { name: "Özəl link", label: "Özəl link", category: "business", icon: <LinkOutlined />, placeholder: "https://...", helper: "İstənilən əlavə linki daxil edin." },
];

const presetForAccount = (item?: ProfileSocialAccount) => {
  const key = normalizePlatformKey(item?.platformName, item?.profileUrl);
  return LINK_ICON_PRESETS.find((preset) => normalizePlatformKey(preset.name) === key) ||
    LINK_ICON_PRESETS.find((preset) => preset.name === "Özəl link")!;
};

const canonicalizeAccount = (item: ProfileSocialAccount): ProfileSocialAccount => {
  const preset = presetForAccount(item);
  const currentName = clean(item.platformName);
  const currentKey = normalizePlatformKey(currentName, item.profileUrl);
  const presetKey = normalizePlatformKey(preset.name);
  const isGenericName = !currentName || currentKey === "özəl link";

  return {
    ...item,
    platformName: isGenericName && presetKey !== "özəl link" ? preset.name : (currentName || preset.name),
    profileUrl: clean(item.profileUrl),
    iconUrl: clean(item.iconUrl),
  };
};

const displayPlatformName = (item: ProfileSocialAccount) => {
  const preset = presetForAccount(item);
  const currentName = clean(item.platformName);
  const currentKey = normalizePlatformKey(currentName, item.profileUrl);
  return (!currentName || currentKey === "özəl link") && normalizePlatformKey(preset.name) !== "özəl link"
    ? preset.label
    : (currentName || preset.label);
};

const normalizePresetValue = (presetName: string, rawValue: string) => {
  const text = clean(rawValue);
  if (!text) return "";
  const key = normalizePlatformKey(presetName);
  if (key === "telefon") return /^tel:/i.test(text) ? text : `tel:${text}`;
  if (key === "e-poçt") return /^mailto:/i.test(text) ? text : `mailto:${text}`;
  if (key === "whatsapp") {
    if (/^https?:\/\//i.test(text)) return text;
    return `https://wa.me/${text.replace(/\D/g, "")}`;
  }
  if (key === "telegram" && text.startsWith("@")) return `https://t.me/${text.slice(1)}`;
  if (key === "instagram" && !/^https?:\/\//i.test(text)) return `https://instagram.com/${text.replace(/^@/, "")}`;
  if (key === "facebook" && !/^https?:\/\//i.test(text)) return `https://facebook.com/${text.replace(/^@/, "")}`;
  if (key === "x" && !/^https?:\/\//i.test(text)) return `https://x.com/${text.replace(/^@/, "")}`;
  if (key === "tiktok" && !/^https?:\/\//i.test(text)) return `https://tiktok.com/@${text.replace(/^@/, "")}`;
  if (key === "youtube" && text.startsWith("@")) return `https://youtube.com/${text}`;
  return text;
};

const editorAccountsFromValues = (values?: EditableProfileValues): ProfileSocialAccount[] =>
  dedupeSocialAccounts([
    { platformName: "LinkedIn", profileUrl: values?.linkedinUrl },
    { platformName: "Facebook", profileUrl: values?.facebookUrl },
    { platformName: "Instagram", profileUrl: values?.instagramUrl },
    { platformName: "WhatsApp", profileUrl: values?.whatsappPhone },
    { platformName: "Ünvan", profileUrl: values?.googleMapsUrl },
    ...(values?.socialAccounts || []).map((item) => ({ ...item })),
  ].filter((item) => clean(item.profileUrl)).map(canonicalizeAccount));

const dedupeSocialAccounts = (items: ProfileSocialAccount[]) => {
  const seenPlatforms = new Set<string>();
  const seenUrls = new Set<string>();

  return items.filter((item) => {
    const platformKey = normalizePlatformKey(item.platformName, item.profileUrl);
    const urlKey = normalizeUrlKey(item.profileUrl);
    if (!urlKey) return false;

    if (platformKey && seenPlatforms.has(platformKey)) return false;
    if (seenUrls.has(urlKey)) return false;

    if (platformKey) seenPlatforms.add(platformKey);
    seenUrls.add(urlKey);
    return true;
  });
};

const customOnlySocialAccounts = (items: ProfileSocialAccount[]) =>
  dedupeSocialAccounts(items).filter(
    (item) => !STANDARD_SOCIAL_KEYS.has(normalizePlatformKey(item.platformName, item.profileUrl)),
  );

export default function CompanyAdminProfileView({
  displayName,
  companyName,
  companyLogo,
  avatarSrc,
  initials,
  profileDetails = [],
  initialValues,
  onSave,
  onUploadPhoto,
  onUploadCardBackground,
  initialEditing = false,
  onCancelEdit,
  successMessage,
}: CompanyAdminProfileViewProps) {
  const [editing, setEditing] = useState(initialEditing);
  const [saving, setSaving] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [backgroundUploading, setBackgroundUploading] = useState(false);
  const [linkModalStep, setLinkModalStep] = useState<"picker" | "details" | null>(null);
  const [selectedPresetName, setSelectedPresetName] = useState("Özəl link");
  const [linkDraftValue, setLinkDraftValue] = useState("");
  const [linkDraftLabel, setLinkDraftLabel] = useState("");
  const [editingLinkIndex, setEditingLinkIndex] = useState<number | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [form] = Form.useForm<EditableProfileValues>();
  const editorAccounts = Form.useWatch("socialAccounts", { form, preserve: true }) || [];
  const photoInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const editSessionInitializedRef = useRef(false);

  useEffect(() => {
    if (!editing) {
      editSessionInitializedRef.current = false;
      return;
    }

    // Link yadda saxlananda parent initialValues yenilənir. Formu hər prop dəyişiklikdə
    // yenidən qurmaq yeni əlavə olunan linki sıfırlayırdı. Form yalnız redaktə sessiyası
    // açılan anda ilkin dəyərlərlə doldurulur.
    if (editSessionInitializedRef.current) return;
    editSessionInitializedRef.current = true;

    form.setFieldsValue({
      firstName: "",
      lastName: "",
      ...(initialValues || {}),
      socialAccounts: editorAccountsFromValues(initialValues),
    });
  }, [editing, form, initialValues]);

  const details = useMemo(() => {
    const map = new Map(profileDetails.map((item) => [item.label.toLowerCase(), clean(item.value)]));
    return {
      email: map.get("e-poçt") || map.get("email") || "",
      role: map.get("rol") || "CompanyAdmin",
      voen: map.get("vöen") || map.get("voen") || "",
    };
  }, [profileDetails]);

  const customLinks = useMemo(
    () => customOnlySocialAccounts(initialValues?.socialAccounts || []),
    [initialValues?.socialAccounts],
  );

  const fullName = [initialValues?.firstName, initialValues?.lastName].filter(Boolean).join(" ").trim() || displayName;
  const phone = clean(initialValues?.phone1);
  const whatsapp = clean(initialValues?.whatsappPhone);
  const info = clean(initialValues?.additionalInfo);
  const backgroundUrl = clean(initialValues?.cardBackgroundUrl);
  const shareQrPayload = [
    "BEGIN:VCARD",
    "VERSION:3.0",
    `N:${escapeVCardValue(initialValues?.lastName)};${escapeVCardValue(initialValues?.firstName)};;;`,
    `FN:${escapeVCardValue(fullName)}`,
    companyName ? `ORG:${escapeVCardValue(companyName)}` : "",
    initialValues?.jobTitle ? `TITLE:${escapeVCardValue(initialValues.jobTitle)}` : "",
    phone ? `TEL;TYPE=WORK:${phone}` : "",
    clean(initialValues?.phone2) ? `TEL;TYPE=CELL:${clean(initialValues?.phone2)}` : "",
    whatsapp ? `TEL;TYPE=CELL;TYPE=VOICE:${whatsapp}` : "",
    details.email ? `EMAIL;TYPE=WORK:${details.email}` : "",
    clean(initialValues?.googleMapsUrl) ? `URL:${escapeVCardValue(initialValues?.googleMapsUrl)}` : "",
    "END:VCARD",
  ].filter(Boolean).join("\r\n");

  const startEdit = () => setEditing(true);

  const prepareProfileValues = (
    values: EditableProfileValues,
    accountOverride?: ProfileSocialAccount[],
  ): EditableProfileValues => {
    const accounts = dedupeSocialAccounts(
      (accountOverride ?? values.socialAccounts ?? []).map(canonicalizeAccount),
    );
    const take = (key: string) => accounts.find(
      (item) => normalizePlatformKey(item.platformName, item.profileUrl) === key,
    );
    const linkedin = take("linkedin");
    const facebook = take("facebook");
    const instagram = take("instagram");
    const whatsappItem = take("whatsapp");
    const addressItem = take("ünvan");

    const whatsappValue = clean(whatsappItem?.profileUrl)
      .replace(/^https?:\/\/wa\.me\//i, "")
      .replace(/^tel:/i, "");

    const dedicatedKeys = new Set(["linkedin", "facebook", "instagram", "whatsapp", "ünvan"]);
    const customAccounts = accounts.filter(
      (item) => !dedicatedKeys.has(normalizePlatformKey(item.platformName, item.profileUrl)),
    );

    return {
      ...values,
      linkedinUrl: clean(linkedin?.profileUrl),
      facebookUrl: clean(facebook?.profileUrl),
      instagramUrl: clean(instagram?.profileUrl),
      whatsappPhone: whatsappValue || values.whatsappPhone,
      googleMapsUrl: clean(addressItem?.profileUrl) || values.googleMapsUrl,
      socialAccounts: customAccounts,
    };
  };

  const saveProfile = async (values: EditableProfileValues) => {
    if (!onSave) return;

    try {
      setSaving(true);
      // socialAccounts ayrıca Form.Item kimi render olunmur; buna görə Ant Design
      // onFinish values obyektinə onu həmişə daxil etmir. Cari form state-dən
      // oxumasaq, əsas “Yadda saxla” düyməsi yeni linkləri boş massivlə əvəz edir.
      const currentAccounts = (form.getFieldValue("socialAccounts") || editorAccounts || []) as ProfileSocialAccount[];
      await onSave(prepareProfileValues({ ...values, socialAccounts: currentAccounts }, currentAccounts));
      setEditing(false);
      setLinkModalStep(null);
      message.success(successMessage || "Məlumatlar yeniləndi.");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "";
      message.error(detail || "CompanyAdmin məlumatları yenilənmədi.");
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !onUploadPhoto) return;

    if (!file.type.startsWith("image/")) {
      message.error("Yalnız şəkil faylı seçin.");
      return;
    }

    try {
      setPhotoUploading(true);
      await onUploadPhoto(file);
      message.success("Profil şəkli yeniləndi.");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "";
      message.error(detail || "Profil şəkli yüklənmədi.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const uploadBackground = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !onUploadCardBackground) return;

    if (!file.type.startsWith("image/")) {
      message.error("Yalnız şəkil faylı seçin.");
      return;
    }

    try {
      setBackgroundUploading(true);
      const url = await onUploadCardBackground(file);
      if (editing) form.setFieldValue("cardBackgroundUrl", url);
      message.success("Kart fonu yeniləndi.");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "";
      message.error(detail || "Kart fonu yüklənmədi.");
    } finally {
      setBackgroundUploading(false);
    }
  };

  const openLinkPicker = () => {
    setEditingLinkIndex(null);
    setSelectedPresetName("Özəl link");
    setLinkDraftValue("");
    setLinkDraftLabel("");
    setLinkModalStep("picker");
  };

  const openLinkEditor = (index: number) => {
    const account = (form.getFieldValue("socialAccounts") || [])[index] || {};
    const preset = presetForAccount(account);
    setEditingLinkIndex(index);
    setSelectedPresetName(preset.name);
    setLinkDraftValue(clean(account.profileUrl));
    setLinkDraftLabel(clean(account.platformName) || preset.label);
    setLinkModalStep("details");
  };

  const choosePreset = (preset: LinkPreset) => {
    setSelectedPresetName(preset.name);
    setLinkDraftValue("");
    setLinkDraftLabel(preset.label);
    setLinkModalStep("details");
  };

  const saveLinkDraft = async () => {
    const preset = LINK_ICON_PRESETS.find((item) => item.name === selectedPresetName) || LINK_ICON_PRESETS[LINK_ICON_PRESETS.length - 1];
    const normalizedValue = normalizePresetValue(preset.name, linkDraftValue);
    if (!normalizedValue) {
      message.warning("Link və ya əlaqə məlumatını daxil edin.");
      return;
    }

    const next = [...(form.getFieldValue("socialAccounts") || [])];
    const nextItem: ProfileSocialAccount = {
      platformName: preset.name === "Özəl link" ? (clean(linkDraftLabel) || "Özəl link") : preset.name,
      profileUrl: normalizedValue,
      iconUrl: "",
    };

    if (editingLinkIndex === null) next.push(nextItem);
    else next[editingLinkIndex] = nextItem;

    form.setFieldValue("socialAccounts", next);

    if (onSave) {
      try {
        setSaving(true);
        const currentValues = form.getFieldsValue(true) as EditableProfileValues;
        await onSave(prepareProfileValues({ ...currentValues, socialAccounts: next }, next));
        message.success(editingLinkIndex === null ? "Link əlavə edildi." : "Link yeniləndi.");
      } catch (error) {
        const detail = error instanceof Error ? error.message : "";
        message.error(detail || "Link yadda saxlanılmadı.");
        return;
      } finally {
        setSaving(false);
      }
    }

    setLinkModalStep(null);
    setEditingLinkIndex(null);
    setLinkDraftValue("");
    setLinkDraftLabel("");
  };

  const removeEditorLink = (index: number) => {
    const next = [...(form.getFieldValue("socialAccounts") || [])];
    next.splice(index, 1);
    form.setFieldValue("socialAccounts", next);
  };

  const linkPresetGroups = [
    { key: "contact", label: "ƏLAQƏ" },
    { key: "social", label: "SOSİAL ŞƏBƏKƏ" },
    { key: "business", label: "İŞ VƏ ÖDƏNİŞ" },
  ] as const;

  const addedPlatformLabels = Array.from(new Set(
    editorAccounts.map((item) => presetForAccount(item).label).filter(Boolean),
  ));

  const downloadContact = () => {
    const rows = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `FN:${fullName}`,
      `N:${clean(initialValues?.lastName)};${clean(initialValues?.firstName)};;;`,
      companyName ? `ORG:${companyName}` : "",
      initialValues?.jobTitle ? `TITLE:${initialValues.jobTitle}` : "",
      phone ? `TEL;TYPE=CELL:${phone}` : "",
      details.email ? `EMAIL:${details.email}` : "",
      "END:VCARD",
    ].filter(Boolean);

    const blob = new Blob([rows.join("\r\n")], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${fullName || "company-admin"}.vcf`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  if (editing) {
    const selectedPreset = LINK_ICON_PRESETS.find((item) => item.name === selectedPresetName) || LINK_ICON_PRESETS[LINK_ICON_PRESETS.length - 1];

    if (linkModalStep !== null) {
      return (
        <div className="min-h-full bg-[#f3f5f3]">
          <div className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-[#e5e7eb] bg-white px-5">
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f6f6] text-xl text-[#1a1a1a]" onClick={() => setLinkModalStep(null)} aria-label="Redaktəyə qayıt">‹</button>
            <strong className="text-[16px] font-semibold text-[#1a1a1a]">{linkModalStep === "picker" ? "Platforma əlavə et" : selectedPreset.label}</strong>
          </div>

          {linkModalStep === "picker" ? (
            <div className="space-y-5 p-5">
              {addedPlatformLabels.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[.08em] text-[#6e7671]">ARTIQ ƏLAVƏ EDİLİB</span>
                  <div className="flex flex-wrap gap-2">{addedPlatformLabels.map((label) => <b className="rounded-full bg-[#e7f0f8] px-3 py-1 text-[12px] font-medium text-[#185582]" key={label}>{label}</b>)}</div>
                </div>
              )}
              {linkPresetGroups.map((group) => {
                const rows = LINK_ICON_PRESETS.filter((preset) => preset.category === group.key);
                if (rows.length === 0) return null;
                return (
                  <section className="space-y-3" key={group.key}>
                    <h4 className="m-0 text-[11px] font-semibold uppercase tracking-[.08em] text-[#6e7671]">{group.label}</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {rows.map((preset) => (
                        <button type="button" key={preset.name} onClick={() => choosePreset(preset)} className="flex min-h-20.5 flex-col items-center justify-center gap-2 rounded-2xl border border-[#dfe5e3] bg-white px-2 py-3 text-[#185582] hover:border-[#185582]">
                          <span className="text-[22px]">{preset.icon}</span><strong className="text-[11px] font-medium text-[#1a1a1a]">{preset.label}</strong>
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3 rounded-2xl bg-[#e7f0f8] p-4 text-[#185582]"><span className="text-xl">{selectedPreset.icon}</span><p className="m-0 text-[13px]">{selectedPreset.helper}</p></div>
              <div className="rounded-[22px] bg-white p-4 shadow-sm">
                <label className="mb-2 block text-[13px] font-semibold text-[#1a1a1a]">Link / məlumat</label>
                <Input value={linkDraftValue} placeholder={selectedPreset.placeholder} onChange={(event) => setLinkDraftValue(event.target.value)} className="h-12 rounded-xl" />
                <label className="mb-2 mt-4 block text-[13px] font-semibold text-[#1a1a1a]">Kartda görünən ad</label>
                <Input value={linkDraftLabel || selectedPreset.label} disabled={selectedPreset.name !== "Özəl link"} onChange={(event) => setLinkDraftLabel(event.target.value)} className="h-12 rounded-xl" />
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[.08em] text-[#6e7671]">KARTDA BELƏ GÖRÜNƏCƏK</div>
              <div className="flex items-center gap-3 rounded-[22px] bg-white p-4 shadow-sm"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#e7f0f8] text-xl text-[#185582]">{selectedPreset.icon}</span><div className="min-w-0 flex-1"><small className="block text-[10px] uppercase text-[#6e7671]">{linkDraftLabel || selectedPreset.label}</small><strong className="block truncate text-[13px] text-[#1a1a1a]">{linkDraftValue || selectedPreset.placeholder}</strong></div><b>›</b></div>
              <div className="grid grid-cols-[1fr_2fr] gap-3 pt-1">
                <AppButton className="force-navy-action h-12" type="primary" onClick={() => setLinkModalStep("picker")}>Geri</AppButton>
                <AppButton className="force-navy-action h-12" type="primary" loading={saving} onClick={saveLinkDraft}>{editingLinkIndex === null ? "Əlavə et" : "Yadda saxla"}</AppButton>
              </div>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="ca-admin-profile-page ca-admin-profile-edit-page ca-vcard-editor">
        <Form<EditableProfileValues>
          form={form}
          layout="vertical"
          onFinish={saveProfile}
          className="ca-vcard-editor-form"
        >
          <Form.Item name="cardBackgroundUrl" hidden><Input /></Form.Item>

          <section className="ca-vcard-editor-card ca-vcard-identity-card">
            <div className="ca-vcard-photo-row">
              <div className="ca-vcard-photo-wrap">
                <Avatar size={78} src={avatarSrc || undefined} className="ca-vcard-editor-avatar">
                  {!avatarSrc && initials}
                </Avatar>
                {onUploadPhoto && (
                  <>
                    <input ref={photoInputRef} type="file" accept="image/*" hidden onChange={uploadPhoto} />
                    <button type="button" className="ca-vcard-camera" onClick={() => photoInputRef.current?.click()} disabled={photoUploading} aria-label="Profil şəklini dəyiş">
                      <CameraOutlined />
                    </button>
                  </>
                )}
              </div>
              <div className="ca-vcard-photo-actions">
                <AppButton className="force-navy-action" type="primary" onClick={() => photoInputRef.current?.click()} disabled={!onUploadPhoto || photoUploading}>Şəkil</AppButton>
                {onUploadCardBackground && (
                  <>
                    <input ref={backgroundInputRef} type="file" accept="image/*" hidden onChange={uploadBackground} />
                    <AppButton className="force-navy-action" type="primary" icon={<UploadOutlined />} loading={backgroundUploading} onClick={() => backgroundInputRef.current?.click()}>Kart fonu</AppButton>
                  </>
                )}
              </div>
            </div>

            <div className="ca-vcard-fields">
              <Form.Item name="firstName" label="Ad" rules={[{ required: true, message: "Adı daxil edin" }]}>
                <Input />
              </Form.Item>
              <Form.Item name="lastName" label="Soyad" rules={[{ required: true, message: "Soyadı daxil edin" }]}>
                <Input />
              </Form.Item>
              <Form.Item name="middleName" label="Ata adı"><Input /></Form.Item>
              <Form.Item name="jobTitle" label="Vəzifə"><Input /></Form.Item>
              <Form.Item name="phone1" label="Telefon 1" className="ca-vcard-phone-field" rules={[{ required: true, whitespace: true, message: "Telefon 1 mütləqdir" }]}>
                <Input prefix={<PhoneOutlined />} placeholder="+994 50 000 00 00" />
              </Form.Item>
              <Form.Item name="phone2" label="Telefon 2" className="ca-vcard-phone-field"><Input prefix={<PhoneOutlined />} placeholder="+994 50 000 00 00" /></Form.Item>
              <Form.Item name="extensionNumber" label="Daxili nömrə"><Input /></Form.Item>
              <Form.Item name="dateOfBirth" label="Doğum tarixi"><Input type="date" /></Form.Item>
              <Form.Item name="additionalInfo" label="Haqqımda">
                <Input.TextArea rows={4} placeholder="Qısa məlumat yazın" />
              </Form.Item>
            </div>
          </section>

          <section className="ca-vcard-editor-card ca-vcard-links-card">
            <div className="ca-vcard-card-heading">
              <div>
                <strong>Sosial hesablar və linklər</strong>
                <span>Platformanı seçib məlumatını əlavə edin</span>
              </div>
              <b>{editorAccounts.length}</b>
            </div>

            <div className="ca-vcard-link-list">
              {editorAccounts.map((rawItem, index) => {
                const item = canonicalizeAccount(rawItem);
                return (
                  <div key={`${item.platformName || "link"}-${item.profileUrl || index}-${index}`} className="ca-vcard-link-row">
                    <button type="button" className="ca-vcard-link-main" onClick={() => openLinkEditor(index)}>
                      <span className="ca-vcard-link-icon">{socialIcon(item.platformName, item.profileUrl)}</span>
                      <span className="ca-vcard-link-copy">
                        <strong>{displayPlatformName(item)}</strong>
                        <small>{clean(item.profileUrl) || "Məlumat əlavə edin"}</small>
                      </span>
                    </button>
                    <button type="button" className="ca-vcard-link-delete" onClick={() => removeEditorLink(index)} aria-label="Linki sil"><DeleteOutlined /></button>
                  </div>
                );
              })}
              <button type="button" className="ca-vcard-add-platform bg-[#185582]! text-white! border-[#185582]!" onClick={openLinkPicker}><PlusOutlined /> Yeni link əlavə et</button>
            </div>
          </section>

          <button type="button" className="ca-vcard-qr-share" onClick={() => setShareOpen(true)}>
            <span className="ca-vcard-qr-icon"><QRCode value={shareQrPayload} size={42} bordered={false} errorLevel="M" /></span>
            <span><strong>QR kod və paylaşma</strong><small>Kodu göstər və vizitkartı paylaş</small></span>
            <b>›</b>
          </button>

          <div className="ca-vcard-editor-savebar">
            <AppButton className="force-navy-action" type="primary" onClick={() => onCancelEdit ? onCancelEdit() : setEditing(false)}>Ləğv et</AppButton>
            <AppButton className="force-navy-action" type="primary" htmlType="submit" loading={saving}>Yadda saxla</AppButton>
          </div>
        </Form>

        <Modal
          title="CompanyAdmin QR kodu"
          open={shareOpen}
          onCancel={() => setShareOpen(false)}
          footer={null}
          centered
          width={360}
          className="ca-admin-share-modal"
        >
          <div className="ca-admin-share-qr">
            <QRCode value={shareQrPayload} size={230} bordered={false} errorLevel="M" />
            <strong>{fullName}</strong>
            <span>QR kodu skan etdikdə kontakt məlumatları açılacaq.</span>
          </div>
        </Modal>


      </div>
    );
  }

  const primaryContactHref = phone
    ? `tel:${phone}`
    : details.email
      ? `mailto:${details.email}`
      : undefined;

  const businessCard: BusinessCardViewModel = {
    profile: {
      id: 'company-admin',
      employeeId: '',
      companyId: '',
      companyVoen: details.voen,
      companyName: clean(companyName),
      companyLogo: clean(companyLogo),
      firstName: clean(initialValues?.firstName),
      lastName: clean(initialValues?.lastName),
      middleName: clean(initialValues?.middleName),
      jobTitle: clean(initialValues?.jobTitle) || 'Şirkət admini',
      email: details.email,
      photo: clean(avatarSrc),
      cardBackground: backgroundUrl,
      dateOfBirth: clean(initialValues?.dateOfBirth),
      address: clean(companyName),
      googleMapsUrl: clean(initialValues?.googleMapsUrl),
      phones: [
        ...(phone ? [{ type: 'İş', number: phone }] : []),
        ...(clean(initialValues?.phone2) ? [{ type: 'Şəxsi', number: clean(initialValues?.phone2) }] : []),
        ...(whatsapp ? [{ type: 'WhatsApp', number: whatsapp }] : []),
      ],
      socials: [
        ...(clean(initialValues?.linkedinUrl)
          ? [{ platform: 'LinkedIn', url: clean(initialValues?.linkedinUrl) }]
          : []),
        ...(clean(initialValues?.facebookUrl)
          ? [{ platform: 'Facebook', url: clean(initialValues?.facebookUrl) }]
          : []),
        ...(clean(initialValues?.instagramUrl)
          ? [{ platform: 'Instagram', url: clean(initialValues?.instagramUrl) }]
          : []),
        ...customLinks.map((item) => ({
          platform: clean(item.platformName) || 'Link',
          url: clean(item.profileUrl),
          iconUrl: clean(item.iconUrl) || undefined,
        })),
      ].filter((item) => Boolean(item.url)),
      extras: info ? [{ label: 'Haqqında', value: info }] : [],
      nfcUrl: '',
      qrUid: '',
      cardUrl: '',
      isActive: true,
      status: 'active',
      scans: 0,
      updatedAt: '',
    },
    actions: {
      onEdit: onSave ? startEdit : undefined,
      onAddContact: downloadContact,
      contactHref: primaryContactHref,
      onQrCode: () => setShareOpen(true),
    },
  };

  return (
    <div className="ca-admin-profile-page ca-admin-profile-card-page">
      <CommonBusinessCardView card={businessCard} />

      <Modal
        title="CompanyAdmin QR kodu"
        open={shareOpen}
        onCancel={() => setShareOpen(false)}
        footer={null}
        centered
        width={360}
        className="ca-admin-share-modal"
      >
        <div className="ca-admin-share-qr">
          <QRCode value={shareQrPayload} size={230} bordered={false} errorLevel="M" />
          <strong>{fullName}</strong>
          <span>QR kodu skan etdikdə kontakt məlumatları açılacaq.</span>
        </div>
      </Modal>
    </div>
  );

}
