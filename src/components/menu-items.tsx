import {BankOutlined,BarChartOutlined,ClockCircleOutlined,DownloadOutlined,FileTextOutlined,IdcardOutlined,InfoCircleOutlined,SettingOutlined,TeamOutlined,} from "@ant-design/icons";
import { ROLES } from "../constants/roles";
import type { AppRole, RoleConfig } from "../types/layout.type";

export const ROLE_CONFIG: Record<AppRole, RoleConfig> = {
  [ROLES.SUPER_ADMIN]: {
    brand: "SuperAdmin",
    brandSub: "v2.0",
    logo: "S",
    userTitle: "Super Admin",
    userStatus: "● Tam Səlahiyyət",
    userTag: "Tam Səlahiyyət",
    tagColor: "orange",
    menu: [
      { key: "statistics", label: "Statistika", path: "/admin/statistics", icon: <BarChartOutlined /> },
      { key: "companies", label: "Şirkətlər", path: "/admin/companies", icon: <BankOutlined /> },
      { key: "audit-log", label: "Audit Log", path: "/admin/audit-log", icon: <FileTextOutlined /> },
      { key: "info", label: "Info", path: "/admin/info", icon: <InfoCircleOutlined /> },
    ],
  },
  [ROLES.COMPANY_ADMIN]: {
    brand: "CompanyAdmin",
    brandSub: "İdarəetmə",
    logo: "C",
    userTitle: "CompanyAdmin",
    userStatus: "● Aktiv",
    userTag: "CompanyAdmin",
    tagColor: "green",
    menu: [
      { key: "analytics", label: "Analitika", path: "/company-admin/analytics", icon: <BarChartOutlined /> },
      { key: "scan-logs", label: "Skan logları", path: "/company-admin/scan-logs", icon: <ClockCircleOutlined /> },
      { key: "employees", label: "Əməkdaşlar", path: "/company-admin/employees", icon: <TeamOutlined /> },
      { key: "export-import", label: "İxrac və idxal", path: "/company-admin/export-import", icon: <DownloadOutlined /> },
      { key: "settings", label: "Tənzimləmələr", path: "/company-admin/settings", icon: <SettingOutlined /> },
      { key: "my-card", label: "Mənim vizitkartım", path: "/company-admin/my-card", icon: <IdcardOutlined /> },
    ],
  },
  [ROLES.EMPLOYEE]: {
    brand: "Employee",
    brandSub: "Dashboard",
    logo: "E",
    userTitle: "Əməkdaş",
    userStatus: "● Employee",
    userTag: "Əməkdaş",
    tagColor: "processing",
    menu: [
      { key: "business-card", label: "Vizitkart", path: "/employee/business-card", icon: <IdcardOutlined /> },
    ],
  },
};
