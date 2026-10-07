import { getCompanyInitials, getCompanyLogo, getCompanyName } from '../../../features/super/super-admin';
import type { CompanyLogoProps } from '../../../types/super.type';

export function CompanyLogo({ company, size = 46 }: CompanyLogoProps) {
  const displayName = getCompanyName(company);
  const logo = getCompanyLogo(company);

  return (
    <div style={{ position: 'relative', width: size, height: size, flex: `0 0 ${size}px` }}>
      {logo && (
        <img
          src={logo}
          alt={displayName}
          onError={(event) => {
            event.currentTarget.style.display = 'none';
            const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
            if (fallback) fallback.style.display = 'flex';
          }}
          style={{
            width: size,
            height: size,
            borderRadius: Math.round(size * 0.32),
            objectFit: 'cover',
            border: '1px solid var(--bd-e2e8f0)',
          }}
        />
      )}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: Math.round(size * 0.32),
          background: 'var(--bg-e7f0f8)',
          color: 'var(--fg-185582)',
          display: logo ? 'none' : 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 900,
          fontSize: Math.max(13, Math.round(size * 0.31)),
          border: '1px solid var(--bd-e2e8f0)',
        }}
      >
        {getCompanyInitials(displayName)}
      </div>
    </div>
  );
}
