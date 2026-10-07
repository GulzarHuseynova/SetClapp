import type { CountryPhoneOption } from '../types/phone.type';

// ISO 3166-1 ölkə kodu | beynəlxalq zəng kodu (ITU E.164) | Azərbaycanca ad. Bir neçə ölkə eyni kodu paylaşa bilər:
// +1 (ABŞ, Kanada və Şimali Amerika Nömrələmə Planının digər üzvləri), +7 (Rusiya, Qazaxıstan) və s.
// Adlar brauzerin Intl məlumatından yox, statik yazılıb: bəzi brauzerlər Azərbaycan dilini "dəstəkləyir", amma
// ingilis adları qaytarır, bu isə axtarışı pozur.
const COUNTRY_CALLING_CODES = `
AF|93|Əfqanıstan
AX|358|Aland adaları
AL|355|Albaniya
DZ|213|Əlcəzair
AS|1|Amerika Samoası
AD|376|Andorra
AO|244|Anqola
AI|1|Angilya
AG|1|Antiqua və Barbuda
AR|54|Argentina
AM|374|Ermənistan
AW|297|Aruba
AU|61|Avstraliya
AT|43|Avstriya
AZ|994|Azərbaycan
BS|1|Baham adaları
BH|973|Bəhreyn
BD|880|Banqladeş
BB|1|Barbados
BY|375|Belarus
BE|32|Belçika
BZ|501|Beliz
BJ|229|Benin
BM|1|Bermud adaları
BT|975|Butan
BO|591|Boliviya
BQ|599|Karib Niderlandı
BA|387|Bosniya və Herseqovina
BW|267|Botsvana
BR|55|Braziliya
IO|246|Britaniyanın Hind Okeanı Ərazisi
VG|1|Britaniyanın Virgin adaları
BN|673|Bruney
BG|359|Bolqarıstan
BF|226|Burkina Faso
BI|257|Burundi
CV|238|Kabo-Verde
KH|855|Kamboca
CM|237|Kamerun
CA|1|Kanada
KY|1|Kayman adaları
CF|236|Mərkəzi Afrika Respublikası
TD|235|Çad
CL|56|Çili
CN|86|Çin
CX|61|Milad adası
CC|61|Kokos (Kilinq) adaları
CO|57|Kolumbiya
KM|269|Komor adaları
CG|242|Konqo - Brazzavil
CD|243|Konqo - Kinşasa
CK|682|Kuk adaları
CR|506|Kosta Rika
CI|225|Kotd’ivuar
HR|385|Xorvatiya
CU|53|Kuba
CW|599|Kurasao
CY|357|Kipr
CZ|420|Çexiya
DK|45|Danimarka
DJ|253|Cibuti
DM|1|Dominika
DO|1|Dominikan Respublikası
EC|593|Ekvador
EG|20|Misir
SV|503|Salvador
GQ|240|Ekvatorial Qvineya
ER|291|Eritreya
EE|372|Estoniya
SZ|268|Esvatini
ET|251|Efiopiya
FK|500|Folklend adaları
FO|298|Farer adaları
FJ|679|Fici
FI|358|Finlandiya
FR|33|Fransa
GF|594|Fransa Qvianası
PF|689|Fransa Polineziyası
GA|241|Qabon
GM|220|Qambiya
GE|995|Gürcüstan
DE|49|Almaniya
GH|233|Qana
GI|350|Cəbəllütariq
GR|30|Yunanıstan
GL|299|Qrenlandiya
GD|1|Qrenada
GP|590|Qvadelupa
GU|1|Quam
GT|502|Qvatemala
GG|44|Gernsi
GN|224|Qvineya
GW|245|Qvineya-Bisau
GY|592|Qayana
HT|509|Haiti
HN|504|Honduras
HK|852|Honq Konq Xüsusi İnzibati Rayonu Çin
HU|36|Macarıstan
IS|354|İslandiya
IN|91|Hindistan
ID|62|İndoneziya
IR|98|İran
IQ|964|İraq
IE|353|İrlandiya
IM|44|Men adası
IL|972|İsrail
IT|39|İtaliya
JM|1|Yamayka
JP|81|Yaponiya
JE|44|Cersi
JO|962|İordaniya
KZ|7|Qazaxıstan
KE|254|Keniya
KI|686|Kiribati
XK|383|Kosovo
KW|965|Küveyt
KG|996|Qırğızıstan
LA|856|Laos
LV|371|Latviya
LB|961|Livan
LS|266|Lesoto
LR|231|Liberiya
LY|218|Liviya
LI|423|Lixtenşteyn
LT|370|Litva
LU|352|Lüksemburq
MO|853|Makao XİR Çin
MG|261|Madaqaskar
MW|265|Malavi
MY|60|Malayziya
MV|960|Maldiv adaları
ML|223|Mali
MT|356|Malta
MH|692|Marşal adaları
MQ|596|Martinik
MR|222|Mavritaniya
MU|230|Mavriki
YT|262|Mayot
MX|52|Meksika
FM|691|Mikroneziya
MD|373|Moldova
MC|377|Monako
MN|976|Monqolustan
ME|382|Monteneqro
MS|1|Monserat
MA|212|Mərakeş
MZ|258|Mozambik
MM|95|Myanma
NA|264|Namibiya
NR|674|Nauru
NP|977|Nepal
NL|31|Niderland
NC|687|Yeni Kaledoniya
NZ|64|Yeni Zelandiya
NI|505|Nikaraqua
NE|227|Niger
NG|234|Nigeriya
NU|683|Niue
NF|672|Norfolk adası
KP|850|Şimali Koreya
MK|389|Şimali Makedoniya
MP|1|Şimali Marian adaları
NO|47|Norveç
OM|968|Oman
PK|92|Pakistan
PW|680|Palau
PS|970|Fələstin Əraziləri
PA|507|Panama
PG|675|Papua-Yeni Qvineya
PY|595|Paraqvay
PE|51|Peru
PH|63|Filippin
PL|48|Polşa
PT|351|Portuqaliya
PR|1|Puerto Riko
QA|974|Qətər
RE|262|Reyunyon
RO|40|Rumıniya
RU|7|Rusiya
RW|250|Ruanda
BL|590|Sent-Bartelemi
SH|290|Müqəddəs Yelena
KN|1|Sent-Kits və Nevis
LC|1|Sent-Lusiya
MF|590|Sent Martin
PM|508|Müqəddəs Pyer və Mikelon
VC|1|Sent-Vinsent və Qrenadinlər
WS|685|Samoa
SM|378|San-Marino
ST|239|San-Tome və Prinsipi
SA|966|Səudiyyə Ərəbistanı
SN|221|Seneqal
RS|381|Serbiya
SC|248|Seyşel adaları
SL|232|Syerra-Leone
SG|65|Sinqapur
SX|1|Sint-Marten
SK|421|Slovakiya
SI|386|Sloveniya
SB|677|Solomon adaları
SO|252|Somali
ZA|27|Cənub Afrika
KR|82|Cənubi Koreya
SS|211|Cənubi Sudan
ES|34|İspaniya
LK|94|Şri-Lanka
SD|249|Sudan
SR|597|Surinam
SJ|47|Svalbard və Yan-Mayen
SE|46|İsveç
CH|41|İsveçrə
SY|963|Suriya
TW|886|Tayvan
TJ|992|Tacikistan
TZ|255|Tanzaniya
TH|66|Tailand
TL|670|Şərqi Timor
TG|228|Toqo
TK|690|Tokelau
TO|676|Tonqa
TT|1|Trinidad və Tobaqo
TN|216|Tunis
TR|90|Türkiyə
TM|993|Türkmənistan
TC|1|Törks və Kaykos adaları
TV|688|Tuvalu
UG|256|Uqanda
UA|380|Ukrayna
AE|971|Birləşmiş Ərəb Əmirlikləri
GB|44|Birləşmiş Krallıq
US|1|Amerika Birləşmiş Ştatları
VI|1|ABŞ Virgin adaları
UY|598|Uruqvay
UZ|998|Özbəkistan
VU|678|Vanuatu
VA|39|Vatikan
VE|58|Venesuela
VN|84|Vyetnam
WF|681|Uollis və Futuna
EH|212|Qərbi Saxara
YE|967|Yəmən
ZM|260|Zambiya
ZW|263|Zimbabve
`;

// Siyahının əvvəlində görünən, ən çox istifadə olunan ölkələr (əvvəlki siyahının ardıcıllığı).
const PRIORITY_COUNTRIES = ['AZ', 'TR', 'GE', 'RU', 'US', 'GB', 'DE', 'FR', 'IT', 'ES', 'UA', 'KZ', 'AE', 'SA', 'CN', 'IN'];

// Axtarışda hərf fərqlərini (ə/e, ı/i, ş/s və s.) və böyük-kiçik hərfi nəzərə almır.
export const normalizeCountrySearch = (value: unknown) =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLocaleLowerCase('az')
    .replace(/ə/g, 'e')
    .replace(/ı/g, 'i')
    .replace(/ş/g, 's')
    .replace(/ç/g, 'c')
    .replace(/ö/g, 'o')
    .replace(/ü/g, 'u')
    .replace(/ğ/g, 'g')
    .trim();

// ISO kodundan bayraq emojisi (hər hərf müvafiq "regional indicator" simvoluna çevrilir).
const flagOf = (iso: string) => String.fromCodePoint(...[...iso].map((char) => 0x1f1e6 + char.charCodeAt(0) - 65));

// İngilis adları yalnız axtarış üçündür ("Germany" yazıb Almaniyanı tapmaq); brauzer vermirsə atılır.
const englishRegionNames = () => {
  try {
    return new Intl.DisplayNames(['en'], { type: 'region' });
  } catch {
    return null;
  }
};

export const buildCountryPhoneOptions = (): CountryPhoneOption[] => {
  const enNames = englishRegionNames();
  const entries = COUNTRY_CALLING_CODES.trim().split(/\r?\n/).map((line) => {
    const [country, code, name] = line.split('|');
    return { country, code: `+${code}`, name };
  });
  const azNames = new Map(entries.map(({ country, name }) => [country, name]));

  const byCode = new Map<string, { countries: string[] }>();
  entries.forEach(({ country, code }) => {
    const group = byCode.get(code) || { countries: [] };
    group.countries.push(country);
    byCode.set(code, group);
  });

  const options = [...byCode.entries()].map(([value, { countries }]) => {
    // Kodu paylaşan ölkələrdən əsas olanı (siyahıda əvvəlcə gələn prioritetli, yoxsa ilk) göstərilir.
    const main = PRIORITY_COUNTRIES.find((iso) => countries.includes(iso)) || countries[0];
    const nameOf = (iso: string) => azNames.get(iso) || enNames?.of(iso) || iso;
    const searchText = normalizeCountrySearch([
      ...countries.flatMap((iso) => [nameOf(iso), enNames?.of(iso) || '', iso]),
      value,
    ].join(' '));

    return {
      country: main,
      value,
      label: `${flagOf(main)} ${value}`,
      name: nameOf(main),
      searchText,
    };
  });

  const priorityRank = (option: CountryPhoneOption) => {
    const rank = PRIORITY_COUNTRIES.indexOf(option.country);
    return rank === -1 ? PRIORITY_COUNTRIES.length : rank;
  };

  return options.sort((left, right) => (
    priorityRank(left) - priorityRank(right) || left.name.localeCompare(right.name, 'az')
  ));
};
