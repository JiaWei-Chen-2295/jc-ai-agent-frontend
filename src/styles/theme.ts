import type { ThemeConfig } from 'antd'

export const brand = {
  primary: '#2fbd6a',
  primaryStrong: '#259357',
  secondary: '#3f8cff',
  warning: '#f5a524',
  error: '#f44747',
  info: '#3f8cff',
  neutral: '#0f172a',
}

export const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: brand.primary,
    colorSuccess: brand.primary,
    colorInfo: brand.secondary,
    colorError: brand.error,
    colorWarning: brand.warning,
    borderRadius: 12, // Increased border radius for smoother look
    fontFamily: '"Sora", "Segoe UI", sans-serif',
    colorTextBase: '#0f172a',
    colorBgLayout: '#f4f5f7',
    colorBgContainer: '#ffffff',
    fontSize: 16, // Ensure base font size is 16px
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  },
  components: {
    Button: {
      controlHeight: 44,
      controlOutlineWidth: 0, // Remove default outline
      borderRadius: 12,
      defaultShadow: '0 2px 0 rgba(0, 0, 0, 0.02)',
      primaryShadow: '0 4px 10px rgba(47, 189, 106, 0.3)', // Enhanced primary shadow
      contentFontSize: 15,
      fontWeight: 600,
    },
    Input: {
      controlHeight: 46,
      borderRadius: 12,
      activeShadow: '0 0 0 2px rgba(47, 189, 106, 0.1)',
      hoverBorderColor: brand.primary,
    },
    Select: {
      controlHeight: 46,
      borderRadius: 12,
    },
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#ffffff',
    },
    Menu: {
      itemBorderRadius: 10,
      itemMarginInline: 8,
      itemHeight: 44,
      activeBarBorderWidth: 0, // Remove side bar
    },
    Card: {
      borderRadiusLG: 16,
      boxShadowTertiary: '0 12px 24px -6px rgba(15, 23, 42, 0.08)', // Soft shadow
    },
    Typography: {
      fontFamilyCode: '"JetBrains Mono", monospace',
    },
    Tag: {
      borderRadius: 6,
    }
  },
}
