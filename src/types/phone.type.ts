export interface CountryPhoneOption {
  // Seçilmiş dəyər kimi göstərilən qısa mətn: "🇦🇿 +994".
  label: string;
  // Zəng kodu: "+994". Eyni kodu paylaşan ölkələr (məs. +1, +7) bir variantda birləşir.
  value: string;
  // Variantda göstərilən əsas ölkənin ISO kodu.
  country: string;
  // Əsas ölkənin adı (açılan siyahıda göstərilir).
  name: string;
  // Axtarış üçün: bu kodu paylaşan bütün ölkələrin adları (az/en), ISO kodları və kod, hərf fərqləri atılmış.
  searchText: string;
}

export interface PhoneCountryInputProps {
  id?: string;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}
