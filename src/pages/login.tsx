import { useState } from "react";
import { useNavigate } from "react-router";
import { AutoComplete, Form, Input } from "antd";
import { message } from "../utils/antd-static";
import { BankOutlined, LockOutlined, MailOutlined } from "@ant-design/icons";
import { authOperations } from "../helpers/auth.helper";
import { readLocalCompanyAdminAccounts } from "../storage/local-auth/company-admin-local-auth";
import { readLocalEmployeeAccounts } from "../storage/local-auth/employee-local-auth";
import { authSessionStorage } from "../storage/auth-session.storage";
import { authActions, normalizeRole } from "../store/authStore";
import type { LoginFormValues, LoginProps, LoginResponse } from "../types/auth.type";
import { PASSWORD_CHANGE_ROLES } from "../constants/roles";
import { roleHome } from "../route/PrivateRoute/PrivateRoutes";
import { AppButton } from "../components/ui/app-button";
import "./login.css";

const normalizeVoenOption = (value?: unknown) => String(value || "").trim();

const getLoginVoenOptions = () => {
  const options = new Map<string, string>();

  readLocalCompanyAdminAccounts().forEach((account) => {
    const voen = normalizeVoenOption(account.voen);
    if (!voen) return;
    options.set(voen, `${voen} — ${account.companyName || "Şirkət"}`);
  });

  readLocalEmployeeAccounts().forEach((employee) => {
    const voen = normalizeVoenOption(employee.voen);
    if (!voen) return;
    options.set(voen, `${voen} — ${employee.companyName || "Şirkət"}`);
  });

  return Array.from(options.entries()).map(([value, label]) => ({ value, label }));
};

function Login({ onLoginSuccess }: LoginProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [voenOptions, setVoenOptions] = useState(() => getLoginVoenOptions());

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);

    try {
      const companyVoen = values.companyVoen?.trim() || "";
      const response: LoginResponse = await authOperations.login({
        email: values.email,
        password: values.password,
        companyVoen,
      });

      const role = normalizeRole(response.role);
      if (!role) throw new Error("Hesab rolu müəyyən edilmədi.");

      const rawAccountInfo = response.accountInfo && typeof response.accountInfo === "object"
        ? response.accountInfo
        : null;

      const effectiveCompanyVoen = normalizeVoenOption(
        response.companyVoen || companyVoen || rawAccountInfo?.companyVoen || rawAccountInfo?.voen,
      );

      if (PASSWORD_CHANGE_ROLES.includes(role) && !effectiveCompanyVoen) {
        throw new Error("Şirkət hesabı üçün VÖEN daxil edilməlidir.");
      }

      const canRequirePasswordChange = PASSWORD_CHANGE_ROLES.includes(role);
      const firstLogin = canRequirePasswordChange
        ? Boolean(
            response.isFirstLogin ||
            response.firstLogin ||
            response.mustChangePassword ||
            rawAccountInfo?.isFirstLogin === true ||
            rawAccountInfo?.firstLogin === true ||
            rawAccountInfo?.mustChangePassword === true ||
            rawAccountInfo?.forcePasswordChange === true
          )
        : false;

      const accountInfo = canRequirePasswordChange
        ? {
            ...(rawAccountInfo || {}),
            email: rawAccountInfo?.email || rawAccountInfo?.gmail || values.email.trim().toLowerCase(),
            gmail: rawAccountInfo?.gmail || rawAccountInfo?.email || values.email.trim().toLowerCase(),
            companyVoen: effectiveCompanyVoen,
            voen: effectiveCompanyVoen,
            mustChangePassword: firstLogin,
            firstLogin,
            isFirstLogin: firstLogin,
            forcePasswordChange: firstLogin,
          }
        : rawAccountInfo;

      authActions.setSession({
        accessToken: response.accessToken,
        refreshToken: response.refreshToken || "",
        role,
        companyId: response.companyId || "",
        userId: response.userId || "",
        companyVoen: effectiveCompanyVoen,
        accountInfo,
      });

      const homePath = roleHome[role];

      message.success("Sistemə uğurla giriş etdiniz!");
      onLoginSuccess();
      navigate(homePath, { replace: true });
    } catch (error) {
      authSessionStorage.clear();
      const detail = error instanceof Error ? error.message : "";
      message.error(detail || "E-poçt, şifrə və ya VÖEN yanlışdır!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="login-page">
      <div className="login-mobile-shell">
        <div className="login-brand-card">
          <div className="login-brand-mark">
            <img src="/setclapp-icon.png" alt="SetClapp" />
          </div>
          <div>
            <strong>SetClapp</strong>
            <span>Rəqəmsal vizitkart platforması</span>
          </div>
        </div>

        <main className="login-card">
          <header className="login-card-head">
            <h1>Sistemə giriş</h1>
            <p>Şirkət hesabınıza daxil olun</p>
          </header>

          <Form<LoginFormValues>
            layout="vertical"
            className="login-form"
            onFinish={onFinish}
            onFocus={() => setVoenOptions(getLoginVoenOptions())}
          >
            <Form.Item
              label="Şirkət VÖEN"
              name="companyVoen"
              rules={[{
                pattern: /^\d{5,20}$/,
                message: "VÖEN 5-20 rəqəmdən ibarət olmalıdır!",
              }]}
            >
              <AutoComplete
                className="login-autocomplete"
                options={voenOptions}
                placeholder="1234567890"
                maxLength={20}
                filterOption={(inputValue, option) =>
                  String(option?.value || "").includes(inputValue) ||
                  String(option?.label || "").toLowerCase().includes(inputValue.toLowerCase())
                }
                onOpenChange={(open) => {
                  if (open) setVoenOptions(getLoginVoenOptions());
                }}
              >
                <Input className="login-input" prefix={<BankOutlined />} inputMode="numeric" />
              </AutoComplete>
            </Form.Item>

            <Form.Item
              label="E-poçt"
              name="email"
              rules={[
                { required: true, message: "E-poçt daxil edin" },
                { type: "email", message: "Yanlış e-poçt formatı" },
              ]}
            >
              <Input
                className="login-input"
                prefix={<MailOutlined />}
                placeholder="info@sirket.az"
                autoComplete="username"
              />
            </Form.Item>

            <Form.Item
              label="Şifrə"
              name="password"
              rules={[{ required: true, message: "Şifrə daxil edin" }]}
            >
              <Input.Password
                className="login-input"
                prefix={<LockOutlined />}
                placeholder="••••••••"
                autoComplete="current-password"
                visibilityToggle={{
                  visible: showPassword,
                  onVisibleChange: setShowPassword,
                }}
              />
            </Form.Item>

            <AppButton className="login-button" type="primary" htmlType="submit" loading={loading} block>
              Daxil ol
            </AppButton>
          </Form>
        </main>
      </div>
    </section>
  );
}

export default Login;
