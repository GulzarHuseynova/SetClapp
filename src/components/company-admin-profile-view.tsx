import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Avatar, Form, Input, Modal, QRCode } from "antd";
import { message } from "../utils/antd-static";
import {CalendarOutlined,CameraOutlined,CreditCardOutlined,DeleteOutlined,EnvironmentOutlined,FacebookOutlined,GlobalOutlined,InstagramOutlined,LinkOutlined,LinkedinOutlined,MailOutlined,PhoneOutlined,PlusOutlined,SendOutlined,TikTokOutlined,UploadOutlined,WhatsAppOutlined,XOutlined,YoutubeOutlined,} from "@ant-design/icons";
import type { EditableProfileValues, ProfileSocialAccount } from "../types/layout.type";
import type { PublicCardProfile } from "../types/public-card.type";
import { downloadVCard, getQrPayload } from "../features/public-card/public-card";
import { AppButton } from './ui/app-button';
import { PhoneCountryInput } from './phone-country-input';
import { phoneFromContactLink } from '../utils/phone.utils';
import { CommonBusinessCardView } from './common-business-card-view';
import { cleanText, platformIcon, platformMarker } from './business-card-links';
import type { AdminCardProfileInput, BusinessCardViewModel, CompanyAdminProfileViewProps, LinkPreset } from '../types/business-card-view.type';

const errorText = (error: unknown, fallback: string) =>
  (error instanceof Error && error.message) || fallback;

const normalizePlatformKey = (platform?: string, profileUrl?: string) => {
  const value = platformMarker(platform, profileUrl).replace(/[\s._-]+/g, "");
  if (value.includes("linkedin")) return "linkedin";
  if (value.includes("facebook") || value === "fb") return "facebook";
  if (value.includes("instagram") || value === "insta") return "instagram";
  if (value.includes("whatsapp") || value.includes("wa.me")) return "whatsapp";
  if (value.includes("youtube")) return "youtube";
  if (value.includes("tiktok")) return "tiktok";
  if (value.includes("telegram") || value.includes("t.me")) return "telegram";
  if (value.includes("twitter") || value.includes("x.com") || cleanText(platform).toLowerCase() === "x") return "x";
  if (value.includes("telefon") || value.includes("phone") || value.includes("tel:")) return "telefon";
  if (value.includes("email") || value.includes("mail") || value.includes("epoçt")) return "e-poçt";
  if (value.includes("ünvan") || value.includes("address") || value.includes("maps")) return "ünvan";
  if (value.includes("görüş") || value.includes("meeting") || value.includes("calend")) return "görüş";
  if (value.includes("karthesabı") || value.includes("iban")) return "kart hesabı";
  if (value.includes("sayt") || value.includes("website") || value.includes("web")) return "sayt";
  if (value.includes("özəllink") || value.includes("custom")) return "özəl link";
  return cleanText(platform).toLowerCase();
};

const normalizeUrlKey = (url?: string) =>
  cleanText(url)
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/+$/, "");

const STANDARD_SOCIAL_KEYS = new Set(["linkedin", "facebook", "instagram"]);

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

const CUSTOM_LINK_PRESET = LINK_ICON_PRESETS[LINK_ICON_PRESETS.length - 1];

const LINK_PRESET_GROUPS = [
  { key: "contact", label: "ƏLAQƏ" },
  { key: "social", label: "SOSİAL ŞƏBƏKƏ" },
  { key: "business", label: "İŞ VƏ ÖDƏNİŞ" },
] as const;

// Telefon və WhatsApp üçün adi mətn əvəzinə ölkə kodu seçilən nömrə sahəsi göstərilir.
const isPhonePreset = (name: string) => ["telefon", "whatsapp"].includes(normalizePlatformKey(name));

const findPreset = (name: string) => LINK_ICON_PRESETS.find((item) => item.name === name) || CUSTOM_LINK_PRESET;

const presetForAccount = (item?: ProfileSocialAccount) => {
  const key = normalizePlatformKey(item?.platformName, item?.profileUrl);
  return LINK_ICON_PRESETS.find((preset) => normalizePlatformKey(preset.name) === key) || CUSTOM_LINK_PRESET;
};

const canonicalizeAccount = (item: ProfileSocialAccount): ProfileSocialAccount => {
  const preset = presetForAccount(item);
  const currentName = cleanText(item.platformName);
  const currentKey = normalizePlatformKey(currentName, item.profileUrl);
  const presetKey = normalizePlatformKey(preset.name);
  const isGenericName = !currentName || currentKey === "özəl link";

  return {
    ...item,
    platformName: isGenericName && presetKey !== "özəl link" ? preset.name : (currentName || preset.name),
    profileUrl: cleanText(item.profileUrl),
    iconUrl: cleanText(item.iconUrl),
  };
};

const displayPlatformName = (item: ProfileSocialAccount) => {
  const preset = presetForAccount(item);
  const currentName = cleanText(item.platformName);
  const currentKey = normalizePlatformKey(currentName, item.profileUrl);
  return (!currentName || currentKey === "özəl link") && normalizePlatformKey(preset.name) !== "özəl link"
    ? preset.label
    : (currentName || preset.label);
};

const normalizePresetValue = (presetName: string, rawValue: string) => {
  const text = cleanText(rawValue);
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
  ].filter((item) => cleanText(item.profileUrl)).map(canonicalizeAccount));

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

const handleImageInput = async (
  event: ChangeEvent<HTMLInputElement>,
  setBusy: (busy: boolean) => void,
  upload: (file: File) => Promise<unknown>,
  texts: { success: string; error: string },
) => {
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    message.error("Yalnız şəkil faylı seçin.");
    return;
  }

  try {
    setBusy(true);
    await upload(file);
    message.success(texts.success);
  } catch (error) {
    message.error(errorText(error, texts.error));
  } finally {
    setBusy(false);
  }
};

const buildAdminCardProfile = ({ values, companyName, companyLogo, avatarSrc, email, voen }: AdminCardProfileInput): PublicCardProfile => {
  const additionalInfo = cleanText(values?.additionalInfo);

  return {
    id: 'company-admin',
    employeeId: '',
    companyId: '',
    companyVoen: voen,
    companyName: cleanText(companyName),
    companyLogo: cleanText(companyLogo),
    firstName: cleanText(values?.firstName),
    lastName: cleanText(values?.lastName),
    middleName: cleanText(values?.middleName),
    jobTitle: cleanText(values?.jobTitle) || 'Şirkət admini',
    email,
    photo: cleanText(avatarSrc),
    cardBackground: cleanText(values?.cardBackgroundUrl),
    dateOfBirth: cleanText(values?.dateOfBirth),
    address: cleanText(companyName),
    googleMapsUrl: cleanText(values?.googleMapsUrl),
    phones: [
      { type: 'İş', number: cleanText(values?.phone1) },
      { type: 'Şəxsi', number: cleanText(values?.phone2) },
      { type: 'WhatsApp', number: cleanText(values?.whatsappPhone) },
    ].filter((item) => item.number),
    socials: [
      { platform: 'LinkedIn', url: cleanText(values?.linkedinUrl) },
      { platform: 'Facebook', url: cleanText(values?.facebookUrl) },
      { platform: 'Instagram', url: cleanText(values?.instagramUrl) },
      ...customOnlySocialAccounts(values?.socialAccounts || []).map((item) => ({
        platform: cleanText(item.platformName) || 'Link',
        url: cleanText(item.profileUrl),
        iconUrl: cleanText(item.iconUrl) || undefined,
      })),
    ].filter((item) => item.url),
    extras: additionalInfo ? [{ label: 'Haqqında', value: additionalInfo }] : [],
    nfcUrl: '',
    qrUid: '',
    cardUrl: '',
    isActive: true,
    status: 'active',
    scans: 0,
    updatedAt: '',
  };
};

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
    const map = new Map(profileDetails.map((item) => [item.label.toLowerCase(), cleanText(item.value)]));
    return {
      email: map.get("e-poçt") || map.get("email") || "",
      voen: map.get("vöen") || map.get("voen") || "",
    };
  }, [profileDetails]);

  const fullName = [initialValues?.firstName, initialValues?.lastName].filter(Boolean).join(" ").trim() || displayName;
  const cardProfile = buildAdminCardProfile({
    values: initialValues,
    companyName,
    companyLogo,
    avatarSrc,
    email: details.email,
    voen: details.voen,
  });
  const contactProfile: PublicCardProfile = { ...cardProfile, address: "" };
  const shareQrPayload = getQrPayload(contactProfile);

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

    // wa.me linkindəki rəqəmlər artıq ölkə kodunu ehtiva edir; "+" olmadan saxlansa, backend onu Azərbaycan
    // nömrəsi sayıb əvvəlinə +994 əlavə edir.
    const whatsappLink = cleanText(whatsappItem?.profileUrl);
    const whatsappDigits = /wa\.me\/\+?(\d+)/i.exec(whatsappLink)?.[1];
    const whatsappValue = whatsappDigits ? `+${whatsappDigits}` : whatsappLink.replace(/^tel:/i, "");

    const dedicatedKeys = new Set(["linkedin", "facebook", "instagram", "whatsapp", "ünvan"]);
    const customAccounts = accounts.filter(
      (item) => !dedicatedKeys.has(normalizePlatformKey(item.platformName, item.profileUrl)),
    );

    return {
      ...values,
      linkedinUrl: cleanText(linkedin?.profileUrl),
      facebookUrl: cleanText(facebook?.profileUrl),
      instagramUrl: cleanText(instagram?.profileUrl),
      whatsappPhone: whatsappValue || values.whatsappPhone,
      googleMapsUrl: cleanText(addressItem?.profileUrl) || values.googleMapsUrl,
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
      message.error(errorText(error, "CompanyAdmin məlumatları yenilənmədi."));
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = (event: ChangeEvent<HTMLInputElement>) => {
    if (!onUploadPhoto) return;
    void handleImageInput(event, setPhotoUploading, onUploadPhoto, {
      success: "Profil şəkli yeniləndi.",
      error: "Profil şəkli yüklənmədi.",
    });
  };

  const uploadBackground = (event: ChangeEvent<HTMLInputElement>) => {
    if (!onUploadCardBackground) return;
    void handleImageInput(event, setBackgroundUploading, async (file) => {
      const url = await onUploadCardBackground(file);
      if (editing) form.setFieldValue("cardBackgroundUrl", url);
    }, {
      success: "Kart fonu yeniləndi.",
      error: "Kart fonu yüklənmədi.",
    });
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
    setLinkDraftValue(isPhonePreset(preset.name) ? phoneFromContactLink(account.profileUrl) : cleanText(account.profileUrl));
    setLinkDraftLabel(cleanText(account.platformName) || preset.label);
    setLinkModalStep("details");
  };

  const choosePreset = (preset: LinkPreset) => {
    setSelectedPresetName(preset.name);
    setLinkDraftValue("");
    setLinkDraftLabel(preset.label);
    setLinkModalStep("details");
  };

  const saveLinkDraft = async () => {
    const preset = findPreset(selectedPresetName);
    const normalizedValue = normalizePresetValue(preset.name, linkDraftValue);
    if (!normalizedValue) {
      message.warning("Link və ya əlaqə məlumatını daxil edin.");
      return;
    }

    const next = [...(form.getFieldValue("socialAccounts") || [])];
    const nextItem: ProfileSocialAccount = {
      platformName: preset.name === "Özəl link" ? (cleanText(linkDraftLabel) || "Özəl link") : preset.name,
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
        message.error(errorText(error, "Link yadda saxlanılmadı."));
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

  const addedPlatformLabels = Array.from(new Set(
    editorAccounts.map((item) => presetForAccount(item).label).filter(Boolean),
  ));

  const shareModal = (
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
        <QRCode type="svg" color="#000000e0" bgColor="#ffffff" value={shareQrPayload} size={230} bordered={false} errorLevel="M" />
        <strong>{fullName}</strong>
        <span>QR kodu skan etdikdə kontakt məlumatları açılacaq.</span>
      </div>
    </Modal>
  );

  if (editing) {
    const selectedPreset = findPreset(selectedPresetName);

    if (linkModalStep !== null) {
      return (
        <div className="min-h-full bg-(--bg-f3f5f3)">
          <div className="sticky top-0 z-10 flex h-16 items-center gap-3 border-b border-(--bd-e4e9ec) bg-white px-5">
            <button type="button" className="flex h-10 w-10 items-center justify-center rounded-full bg-(--bg-f3f5f3) text-xl text-(--fg-1a1a1a)" onClick={() => setLinkModalStep(null)} aria-label="Redaktəyə qayıt">‹</button>
            <strong className="text-[16px] font-semibold text-(--fg-1a1a1a)">{linkModalStep === "picker" ? "Platforma əlavə et" : selectedPreset.label}</strong>
          </div>

          {linkModalStep === "picker" ? (
            <div className="space-y-5 p-5">
              {addedPlatformLabels.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[.08em] text-(--fg-6e7671)">ARTIQ ƏLAVƏ EDİLİB</span>
                  <div className="flex flex-wrap gap-2">{addedPlatformLabels.map((label) => <b className="rounded-full bg-(--bg-e7f0f8) px-3 py-1 text-[12px] font-medium text-(--fg-185582)" key={label}>{label}</b>)}</div>
                </div>
              )}
              {LINK_PRESET_GROUPS.map((group) => {
                const rows = LINK_ICON_PRESETS.filter((preset) => preset.category === group.key);
                if (rows.length === 0) return null;
                return (
                  <section className="space-y-3" key={group.key}>
                    <h4 className="m-0 text-[11px] font-semibold uppercase tracking-[.08em] text-(--fg-6e7671)">{group.label}</h4>
                    <div className="grid grid-cols-4 gap-2">
                      {rows.map((preset) => (
                        <button type="button" key={preset.name} onClick={() => choosePreset(preset)} className="flex min-h-20.5 flex-col items-center justify-center gap-2 rounded-2xl border border-(--bd-dfe5e3) bg-white px-2 py-3 text-(--fg-185582) hover:border-(--bd-185582)">
                          <span className="text-[22px]">{preset.icon}</span><strong className="text-[11px] font-medium text-(--fg-1a1a1a)">{preset.label}</strong>
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })}
            </div>
          ) : (
            <div className="space-y-4 p-5">
              <div className="flex items-center gap-3 rounded-2xl bg-(--bg-e7f0f8) p-4 text-(--fg-185582)"><span className="text-xl">{selectedPreset.icon}</span><p className="m-0 text-[13px]">{selectedPreset.helper}</p></div>
              <div className="rounded-[22px] bg-white p-4 shadow-sm">
                <label className="mb-2 block text-[13px] font-semibold text-(--fg-1a1a1a)">Link / məlumat</label>
                {isPhonePreset(selectedPreset.name) ? (
                  <PhoneCountryInput value={linkDraftValue} placeholder="50 000 00 00" maxLength={20} onChange={setLinkDraftValue} />
                ) : (
                  <Input value={linkDraftValue} placeholder={selectedPreset.placeholder} onChange={(event) => setLinkDraftValue(event.target.value)} className="h-12 rounded-xl" />
                )}
                <label className="mb-2 mt-4 block text-[13px] font-semibold text-(--fg-1a1a1a)">Kartda görünən ad</label>
                <Input value={linkDraftLabel || selectedPreset.label} disabled={selectedPreset.name !== "Özəl link"} onChange={(event) => setLinkDraftLabel(event.target.value)} className="h-12 rounded-xl" />
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-[.08em] text-(--fg-6e7671)">KARTDA BELƏ GÖRÜNƏCƏK</div>
              <div className="flex items-center gap-3 rounded-[22px] bg-white p-4 shadow-sm"><span className="flex h-11 w-11 items-center justify-center rounded-full bg-(--bg-e7f0f8) text-xl text-(--fg-185582)">{selectedPreset.icon}</span><div className="min-w-0 flex-1"><small className="block text-[10px] uppercase text-(--fg-6e7671)">{linkDraftLabel || selectedPreset.label}</small><strong className="block truncate text-[13px] text-(--fg-1a1a1a)">{linkDraftValue || selectedPreset.placeholder}</strong></div><b>›</b></div>
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
                      <span className="ca-vcard-link-icon">{platformIcon(item.platformName, item.profileUrl)}</span>
                      <span className="ca-vcard-link-copy">
                        <strong>{displayPlatformName(item)}</strong>
                        <small>{cleanText(item.profileUrl) || "Məlumat əlavə edin"}</small>
                      </span>
                    </button>
                    <button type="button" className="ca-vcard-link-delete" onClick={() => removeEditorLink(index)} aria-label="Linki sil"><DeleteOutlined /></button>
                  </div>
                );
              })}
              <button type="button" className="ca-vcard-add-platform bg-(--bg-185582)! text-white! border-(--bd-185582)!" onClick={openLinkPicker}><PlusOutlined /> Yeni link əlavə et</button>
            </div>
          </section>

          <button type="button" className="ca-vcard-qr-share" onClick={() => setShareOpen(true)}>
            <span className="ca-vcard-qr-icon"><QRCode type="svg" color="#000000e0" bgColor="transparent" value={shareQrPayload} size={42} bordered={false} errorLevel="M" /></span>
            <span><strong>QR kod və paylaşma</strong><small>Kodu göstər və vizitkartı paylaş</small></span>
            <b>›</b>
          </button>

          <div className="ca-vcard-editor-savebar">
            <AppButton className="force-navy-action ca-vcard-cancel" type="primary" onClick={() => onCancelEdit ? onCancelEdit() : setEditing(false)}>Ləğv et</AppButton>
            <AppButton className="force-navy-action ca-vcard-save" type="primary" htmlType="submit" loading={saving}>Yadda saxla</AppButton>
          </div>
        </Form>

        {shareModal}
      </div>
    );
  }

  const businessCard: BusinessCardViewModel = {
    profile: cardProfile,
    actions: {
      onEdit: onSave ? () => setEditing(true) : undefined,
      onAddContact: () => downloadVCard(contactProfile),
      onQrCode: () => setShareOpen(true),
    },
  };

  return (
    <div className="ca-admin-profile-page ca-admin-profile-card-page">
      <CommonBusinessCardView card={businessCard} />
      {shareModal}
    </div>
  );

}
