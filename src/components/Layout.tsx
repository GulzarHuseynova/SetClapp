import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Avatar, Divider, Form, Input, Modal, Popover, Space, Tag, Tooltip } from "antd";
import { message } from "../utils/antd-static";
import {ClockCircleOutlined,LockOutlined,LogoutOutlined,MenuFoldOutlined,MenuUnfoldOutlined,SafetyCertificateOutlined,SettingOutlined,UserOutlined,} from "@ant-design/icons";
import { useLocation, useNavigate } from "react-router";
import type { AppLayoutProps } from "../types/layout.type";
import type { ChangePasswordRequest } from "../types/auth.type";
import { authOperations } from "../helpers/auth.helper";
import { ROLE_CONFIG } from "./menu-items";
import CompanyAdminProfileView from "./company-admin-profile-view";
import { AppButton } from "./ui/app-button";
import { ROLES } from "../constants/roles";
import { cn } from "../utils/classnames";

export default function AppLayout({
  role,
  children,
  onLogout,
  titleSuffix,
  userName,
  avatarText,
  avatarSrc,
  profileDetails = [],
  profileInitialValues,
  onSaveProfile,
  onUploadProfilePhoto,
  onUploadCardBackground,
  companyLogo,
  companyInfoPath = "/company-admin/settings",
  companyUsage,
  menuBadges = {},
}: AppLayoutProps) {
  const getIsMobileLayout = () => typeof window !== "undefined" && window.innerWidth <= 768;

  const [isMobileLayout, setIsMobileLayout] = useState(getIsMobileLayout);
  const [collapsed, setCollapsed] = useState(getIsMobileLayout);
  const [compactMenuOpen, setCompactMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordForm] = Form.useForm<ChangePasswordRequest>();
  const menuTriggerRef = useRef<HTMLButtonElement>(null);
  const compactSidebarRef = useRef<HTMLElement>(null);
  const compactScreenRef = useRef<HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const config = ROLE_CONFIG[role];
  const showAdminProfile = role === ROLES.COMPANY_ADMIN && location.pathname === "/company-admin/my-card";

  useEffect(() => {
    let previousIsMobile = getIsMobileLayout();

    const handleResize = () => {
      const nextIsMobile = getIsMobileLayout();
      setIsMobileLayout(nextIsMobile);
      if (nextIsMobile && !previousIsMobile) {
        setCollapsed(true);
      }
      previousIsMobile = nextIsMobile;
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const activeItem = useMemo(() => {
    return (
      [...config.menu]
        .sort((a, b) => b.path.length - a.path.length)
        .find((item) => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`)) || config.menu[0]
    );
  }, [config.menu, location.pathname]);

  const displayName = userName || config.userTitle;
  const profileVoen = profileDetails.find((item) => /v[öo]en/i.test(item.label))?.value || "";
  const initials = avatarText || config.logo;
  const isLightTheme = role === ROLES.EMPLOYEE || role === ROLES.SUPER_ADMIN;

  const sidebarWidthClass = isMobileLayout
    ? collapsed
      ? 'w-[52px]'
      : 'w-[80vw]'
    : collapsed
      ? 'w-[72px]'
      : 'w-[240px]';

  const sidebarThemeClass = isLightTheme
    ? 'border-r border-[#c9deea] bg-gradient-to-b from-[#e7f4fc] to-[#f4f9fc] shadow-[18px_0_50px_rgba(35,78,104,0.10)]'
    : 'bg-gradient-to-b from-[#1e1b4b] via-[#312e81] to-[#4c1d95]';

  const sidebarHeaderPaddingClass = collapsed
    ? isMobileLayout
      ? 'px-2 py-5'
      : 'px-4 py-6'
    : isMobileLayout
      ? 'px-4 py-[22px]'
      : 'px-5 py-6';

  const sidebarDividerClass = isLightTheme
    ? 'border-[rgba(89,139,172,0.22)]'
    : 'border-[rgba(255,255,255,0.08)]';

  const sidebarLogoClass = isLightTheme
    ? 'bg-[#185582] text-white shadow-[0_8px_20px_rgba(24,85,130,0.22)]'
    : 'bg-gradient-to-br from-[#818cf8] to-[#a78bfa] text-white shadow-[0_2px_12px_rgba(99,102,241,0.4)]';

  const mainOffsetClass = isMobileLayout
    ? 'ml-[52px] w-[calc(100vw-52px)] max-w-[calc(100vw-52px)] overflow-x-hidden'
    : collapsed
      ? 'ml-[72px]'
      : 'ml-[240px]';

  const openPasswordModal = () => {
    setProfileOpen(false);
    setPasswordModalOpen(true);
  };

  const closeCompactMenu = () => {
    const activeElement = document.activeElement;

    if (
      activeElement instanceof HTMLElement &&
      compactSidebarRef.current?.contains(activeElement)
    ) {
      activeElement.blur();
    }

    setCompactMenuOpen(false);

    window.requestAnimationFrame(() => {
      menuTriggerRef.current?.focus();
    });
  };

  const openAdminCard = () => {
    setProfileOpen(false);
    if (location.pathname !== "/company-admin/my-card") {
      navigate("/company-admin/my-card");
    }
    closeCompactMenu();
  };

  const navigateCompanyAdminPage = (path: string) => {
    // Menyu keçidini UI animasiyasından ayırırıq: əvvəl route dəyişir, sonra drawer bağlanır.
    // Bu yanaşma mobil drawer-in inert/focus vəziyyətinin naviqasiyanı bloklamasının qarşısını alır.
    setProfileOpen(false);

    if (location.pathname !== path) {
      navigate(path);
    }

    setCompactMenuOpen(false);
    compactScreenRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    window.requestAnimationFrame(() => {
      menuTriggerRef.current?.focus();
    });
  };



  useLayoutEffect(() => {
    if (role !== ROLES.COMPANY_ADMIN) return;

    compactScreenRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname, role, showAdminProfile]);

  const handlePasswordChange = async (values: ChangePasswordRequest) => {
    setPasswordLoading(true);

    try {
      await authOperations.changePassword(values);
      message.success("Şifrə uğurla yeniləndi.");
      passwordForm.resetFields();
      setPasswordModalOpen(false);
    } catch (error) {
      const text = error instanceof Error ? error.message : "Şifrə dəyişdirilmədi.";
      message.error(text);
    } finally {
      setPasswordLoading(false);
    }
  };
  const profileContent = (
    <div className="w-72.5">
      <Space align="center" className="mb-3 w-full">
        <Avatar
          size={44}
          src={avatarSrc || undefined}
          className={cn(
            'shrink-0!',
            role === ROLES.COMPANY_ADMIN || isLightTheme
              ? 'bg-[#185582]!'
              : 'bg-[linear-gradient(135deg,#6366f1,#8b5cf6)]!',
          )}
        >
          {!avatarSrc && initials}
        </Avatar>
        <div>
          <div className="text-[15px] font-black text-slate-900">{displayName}</div>
          <Tag color={config.tagColor} className="mt-1.5! mb-0! rounded-full!">
            {config.userTag}
            {role === ROLES.COMPANY_ADMIN && profileVoen && profileVoen !== '-'
              ? ` · VÖEN: ${profileVoen}`
              : ''}
          </Tag>
        </div>
      </Space>

      <div className="rounded-[14px] border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 flex items-center gap-2.5 text-slate-600">
          <SafetyCertificateOutlined className="text-green-600!" />
          <span className="text-[13px]">Sessiya aktivdir və hesab qorunur</span>
        </div>
        <div className="flex items-center gap-2.5 text-slate-600">
          <ClockCircleOutlined
            className={role === ROLES.COMPANY_ADMIN || isLightTheme ? 'text-[#185582]!' : 'text-indigo-500!'}
          />
          <span className="text-[13px]">Profil ayarlarını buradan idarə edin</span>
        </div>
      </div>

      <Divider className="my-3!" />

      <AppButton
        appTone="secondary"
        icon={<LockOutlined />}
        block
        onClick={openPasswordModal}
        className="h-9.5!"
      >
        Şifrəni dəyiş
      </AppButton>

      <AppButton
        appTone="danger"
        icon={<LogoutOutlined />}
        block
        onClick={() => {
          setProfileOpen(false);
          onLogout();
        }}
        className="mt-2! h-9.5!"
      >
        Çıxış
      </AppButton>
    </div>
  );

  const passwordChangeModal = (
    <Modal
      title="Şifrəni dəyiş"
      open={passwordModalOpen}
      onCancel={() => setPasswordModalOpen(false)}
      footer={null}
      destroyOnHidden
    >
      <div className="mb-4 text-slate-500">
        Hesab təhlükəsizliyi üçün köhnə şifrəni və yeni şifrəni daxil edin.
      </div>
      <Form<ChangePasswordRequest>
        form={passwordForm}
        layout="vertical"
        onFinish={handlePasswordChange}
        autoComplete="off"
      >
        <Form.Item
          name="currentPassword"
          label="Köhnə şifrə / kod"
          rules={[{ required: true, message: 'Köhnə şifrə tələb olunur' }]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Köhnə şifrə / kod" />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="Yeni şifrə"
          rules={[
            { required: true, message: 'Yeni şifrə tələb olunur' },
            { min: 6, message: 'Şifrə ən azı 6 simvol olmalıdır' },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Yeni şifrə" />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="Yeni şifrə təkrar"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: 'Yeni şifrəni təkrar yazın' },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue('newPassword') === value) {
                  return Promise.resolve();
                }

                return Promise.reject(new Error('Şifrələr eyni deyil'));
              },
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Yeni şifrə təkrar" />
        </Form.Item>

        <AppButton
          htmlType="submit"
          loading={passwordLoading}
          icon={<UserOutlined />}
          block
          className="h-10!"
        >
          Şifrəni yenilə
        </AppButton>
      </Form>
    </Modal>
  );

  if (role === ROLES.COMPANY_ADMIN) {
    const usageCurrent = companyUsage?.current ?? 0;
    const usageLimit = companyUsage?.limit ?? 0;
    const usagePercent = usageLimit > 0 ? Math.min(100, Math.round((usageCurrent / usageLimit) * 100)) : 0;

    return (
      <div className={`ca-compact-root ${compactMenuOpen ? "ca-menu-open" : ""}`}>
        <div className="ca-compact-device">
          <button
            type="button"
            aria-label="Menyunu bağla"
            className="ca-menu-backdrop"
            onClick={closeCompactMenu}
          />

          <aside id="company-admin-sidebar" ref={compactSidebarRef} className="ca-compact-sidebar">
            <div className="ca-sidebar-account-card">
              <button
                type="button"
                className={`ca-sidebar-admin-button ${showAdminProfile ? "is-selected" : ""}`}
                onClick={openAdminCard}
              >
                <Avatar size={56} src={avatarSrc || undefined} className="ca-sidebar-avatar">
                  {!avatarSrc && initials}
                </Avatar>
                <span className="ca-sidebar-profile-text">
                  <strong className="block text-[16px] leading-5.5 font-semibold text-[#1a1a1a]">{displayName}</strong>
                  <small className="block text-[13px] leading-4.5 font-normal text-[#1b4a75]">Şirkət admini</small>
                </span>
                <span className="ca-sidebar-chevron" aria-hidden="true">›</span>
              </button>

              {titleSuffix && (
                <button
                  type="button"
                  className={`ca-sidebar-company-button ${!showAdminProfile && activeItem.key === "settings" ? "is-selected" : ""}`}
                  onClick={() => navigateCompanyAdminPage(companyInfoPath)}
                >
                  <span className="ca-sidebar-company-icon" aria-hidden="true">▦</span>
                  <span className="ca-sidebar-company-copy">
                    <strong className="block text-[14px] leading-5 font-medium text-[#1a1a1a]">{titleSuffix}</strong>
                    <span className="ca-sidebar-usage-row">
                      <span className="ca-sidebar-usage-track">
                        <span style={{ width: `${usagePercent}%` }} />
                      </span>
                      <small>{usageCurrent} / {usageLimit || "-"}</small>
                    </span>
                  </span>
                  <span className="ca-sidebar-chevron" aria-hidden="true">›</span>
                </button>
              )}
            </div>

            <div className="ca-sidebar-rule" />

            <nav className="ca-sidebar-nav">
              {config.menu.map((item) => {
                const isActive = (showAdminProfile && item.key === "my-card") || (!showAdminProfile && activeItem.key === item.key);
                const badge = menuBadges[item.key];

                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`ca-sidebar-link ${isActive ? "is-active" : ""} ${item.key === "my-card" ? "is-secondary-start" : ""}`}
                    onClick={() => navigateCompanyAdminPage(item.path)}
                  >
                    <span className="ca-sidebar-icon">{item.icon}</span>
                    <span className="ca-sidebar-link-label">{item.label}</span>
                    {badge !== undefined && badge !== "" && (
                      <span className="ca-sidebar-count">{badge}</span>
                    )}
                  </button>
                );
              })}
            </nav>

            <div className="ca-sidebar-footer">
              <a
                className="ca-sidebar-brand-link"
                href="https://www.setclapp.com/"
                target="_blank"
                rel="noreferrer"
                aria-label="SetClapp saytına keç"
              >
                <img src="/setclapp-logo-without-text.svg" alt="SetClapp" />
                <strong>SetClapp</strong>
              </a>
              <span>© 2019–2026</span>
            </div>
          </aside>

          <main ref={compactScreenRef} className="ca-compact-screen">
            <header className="ca-compact-topbar">
              <button
                ref={menuTriggerRef}
                type="button"
                className="ca-menu-trigger"
                aria-label="Menyunu aç"
                aria-expanded={compactMenuOpen}
                aria-controls="company-admin-sidebar"
                onClick={() => setCompactMenuOpen(true)}
              >
                <span />
                <span />
                <span />
              </button>

              <div className="ca-topbar-title">
                <strong className="block text-[15px] leading-5.5 font-semibold text-[#1a1a1a]">{showAdminProfile ? "Mənim vizitkartım" : activeItem.label}</strong>
                <span className="block text-[12px] leading-4 font-normal text-[#6e7671]">{titleSuffix}</span>
              </div>

              <div className="ca-topbar-actions">
                <Popover
                  content={profileContent}
                  trigger="click"
                  open={profileOpen}
                  onOpenChange={setProfileOpen}
                  placement="bottomRight"
                >
                  <button type="button" className="ca-profile-pill" aria-label="Profil menyusunu aç">
                    <Avatar size={30} src={avatarSrc || undefined} className="ca-profile-avatar">
                      {!avatarSrc && initials}
                    </Avatar>
                    <SettingOutlined />
                  </button>
                </Popover>
              </div>
            </header>

            <section className={`ca-compact-content ${showAdminProfile ? "ca-profile-content" : ""}`}>
              {showAdminProfile ? (
                <CompanyAdminProfileView
                  displayName={displayName}
                  companyName={titleSuffix}
                  avatarSrc={avatarSrc}
                  initials={initials}
                  profileDetails={profileDetails}
                  initialValues={profileInitialValues}
                  onSave={onSaveProfile}
                  onUploadPhoto={onUploadProfilePhoto}
                  onUploadCardBackground={onUploadCardBackground}
                  companyLogo={companyLogo}
                />
              ) : children}
            </section>
          </main>
        </div>

        {passwordChangeModal}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'app-layout-root flex min-h-screen font-sans',
        isLightTheme ? 'employee-layout-theme bg-[#eef7ff]' : 'bg-slate-100',
        role === ROLES.SUPER_ADMIN && 'super-admin-layout-theme',
      )}
    >
      <aside
        className={cn(
          'app-sidebar fixed inset-y-0 left-0 z-100 flex min-h-screen flex-col overflow-hidden transition-[width] duration-200 ease-in-out',
          sidebarWidthClass,
          sidebarThemeClass,
        )}
      >
        <div
          className={cn(
            'relative flex min-h-18 items-center gap-3 border-b',
            sidebarHeaderPaddingClass,
            sidebarDividerClass,
          )}
        >
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-base font-extrabold',
              sidebarLogoClass,
            )}
          >
            {config.logo}
          </div>

          {!collapsed && (
            <div>
              <div
                className={cn(
                  'text-[15px] font-bold leading-[1.2]',
                  isLightTheme ? 'text-[#263445]' : 'text-white',
                )}
              >
                {config.brand}
              </div>
              <div className={cn('text-[11px]', isLightTheme ? 'text-[#6d8191]' : 'text-[#a5b4fc]')}>
                {config.brandSub}
              </div>
            </div>
          )}

          {isMobileLayout && !collapsed && (
            <button
              type="button"
              aria-label="Menyunu bağla"
              onClick={() => setCollapsed(true)}
              className={cn(
                'absolute right-3 top-4.5 flex h-8.5 w-8.5 cursor-pointer items-center justify-center rounded-[10px] border',
                isLightTheme
                  ? 'border-[#c9deea] bg-white/80 text-[#45677d] hover:bg-white'
                  : 'border-white/15 bg-white/10 text-[#e0e7ff] hover:bg-white/15',
              )}
            >
              <MenuFoldOutlined />
            </button>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-0.5 px-2.5 py-3">
          {config.menu.map((item) => {
            const isActive = activeItem.key === item.key;

            return (
              <Tooltip key={item.key} title={collapsed ? item.label : ''} placement="right">
                <button
                  type="button"
                  onClick={() => {
                    navigate(item.path);
                    if (isMobileLayout) setCollapsed(true);
                  }}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-3 rounded-[10px] border-0 border-l-[3px] text-sm transition-colors duration-150',
                    collapsed ? 'justify-center px-0 py-2.75' : 'justify-start py-2.75 pl-3.5 pr-3',
                    isActive && isLightTheme &&
                      'border-l-[#185582] bg-white/90 font-semibold text-[#185582] shadow-[0_8px_22px_rgba(24,85,130,0.08)]',
                    isActive && !isLightTheme &&
                      'border-l-[#818cf8] bg-linear-to-r from-indigo-400/25 to-violet-400/10 font-semibold text-[#c7d2fe]',
                    !isActive && isLightTheme &&
                      'border-l-transparent font-normal text-[#527086] hover:bg-white/90 hover:text-[#234d68]',
                    !isActive && !isLightTheme &&
                      'border-l-transparent font-normal text-slate-400 hover:bg-white/5 hover:text-[#e0e7ff]',
                  )}
                >
                  <span className="shrink-0 text-[17px]">{item.icon}</span>
                  {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
                </button>
              </Tooltip>
            );
          })}
        </nav>

        <div
          className={cn(
            'border-t',
            sidebarDividerClass,
            collapsed ? 'px-2.5 py-4' : 'p-4',
          )}
        >
          <div className={cn('flex items-center gap-2.5', collapsed ? 'justify-center' : 'justify-start')}>
            <Avatar
              src={avatarSrc || undefined}
              className={cn(
                'shrink-0!',
                'bg-[#185582]!',
              )}
            >
              {!avatarSrc && initials}
            </Avatar>

            {!collapsed && (
              <div>
                <div
                  className={cn(
                    'text-[13px] font-semibold',
                    isLightTheme ? 'text-[#263445]' : 'text-[#e0e7ff]',
                  )}
                >
                  {displayName}
                </div>
                <div
                  className={cn(
                    'mt-0.5 inline-block rounded-full px-2 py-px text-[10px] font-bold uppercase tracking-[0.5px]',
                    isLightTheme
                      ? 'bg-[#e7f0f8] text-[#185582]'
                      : 'bg-[rgba(52,211,153,0.18)] text-[#34d399]',
                  )}
                >
                  {config.userStatus}
                </div>
              </div>
            )}
          </div>
        </div>
      </aside>

      <main
        className={cn(
          'app-main box-border min-h-screen flex-1 transition-[margin-left] duration-200 ease-in-out',
          mainOffsetClass,
        )}
      >
        <header
          className={cn(
            'app-header sticky top-0 z-90 flex h-16 items-center justify-between gap-2 border-b border-slate-200 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
            isMobileLayout ? 'px-2.5' : 'px-7',
          )}
        >
          <div className={cn('flex min-w-0 items-center', isMobileLayout ? 'gap-2.5' : 'gap-4')}>
            <button
              type="button"
              aria-label={collapsed ? 'Menyunu aç' : 'Menyunu bağla'}
              onClick={() => setCollapsed((value) => !value)}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border-0 bg-slate-50 text-base text-slate-500 transition-colors hover:bg-slate-200"
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </button>

            <div className="min-w-0 overflow-hidden">
              <span
                className={cn(
                  'whitespace-nowrap font-bold text-slate-800',
                  isMobileLayout ? 'text-[17px]' : 'text-lg',
                )}
              >
                {activeItem.label}
              </span>
              {titleSuffix && !isMobileLayout && (
                <span className="ml-2.5 text-[13px] text-slate-400">/ {titleSuffix}</span>
              )}
            </div>
          </div>

          <div className={cn('flex shrink-0 items-center', isMobileLayout ? 'gap-1.5' : 'gap-3')}>
            <Popover
              content={profileContent}
              trigger="click"
              open={profileOpen}
              onOpenChange={setProfileOpen}
              placement="bottomRight"
            >
              <button
                type="button"
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-slate-50',
                  isMobileLayout ? 'p-1.25' : 'py-1.5 pl-1.5 pr-3',
                )}
              >
                <Avatar
                  size={28}
                  src={avatarSrc || undefined}
                  className={cn(
                    'bg-[#185582]!',
                  )}
                >
                  {!avatarSrc && initials}
                </Avatar>
                {!isMobileLayout && (
                  <span className="text-[13px] font-semibold text-slate-800">{displayName}</span>
                )}
                {!isMobileLayout && (
                  <Tag color={config.tagColor} className="m-0! px-1.5! text-[10px]! leading-4.5!">
                    {config.userTag}
                  </Tag>
                )}
                {!isMobileLayout && <SettingOutlined className="text-slate-400!" />}
              </button>
            </Popover>
          </div>
        </header>

        <div className={cn('app-content', isMobileLayout ? 'p-3' : 'p-7')}>{children}</div>
      </main>

      {passwordChangeModal}
    </div>
  );
}
