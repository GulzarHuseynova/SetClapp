export interface CountryPhoneOption {
  
  label: string;
  
  value: string;
  
  country: string;
  
  name: string;
  
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
