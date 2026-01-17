import type { ThemeConfig } from 'antd'
import { theme } from 'antd'

export const brand = {
  primary: '#44ed26',
  primaryStrong: '#2fd412',
  secondary: '#3f8cff',
  warning: '#f5a524',
  error: '#f44747',
  info: '#3f8cff',
  neutral: '#0f172a',
}

export const themeConfig: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    colorPrimary: brand.primary,
    colorSuccess: brand.primary,
    colorInfo: brand.secondary,
    colorError: brand.error,
    colorWarning: brand.warning,
    borderRadius: 12, // Increased border radius for smoother look
    fontFamily: '"Manrope", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
    colorTextBase: '#e2e8f0',
    colorBgLayout: '#020617',
    colorBgContainer: 'rgba(15, 23, 42, 0.65)',
    colorBgElevated: 'rgba(15, 23, 42, 0.75)',
    colorBorder: 'rgba(255, 255, 255, 0.12)',
    colorLink: brand.primary,
    colorLinkHover: brand.primaryStrong,
    colorLinkActive: brand.primaryStrong,
    fontSize: 16, // Ensure base font size is 16px
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.35)',
  },
  components: {
    Button: {
      controlHeight: 44,
      controlOutlineWidth: 0, // Remove default outline
      borderRadius: 12,
      defaultShadow: '0 2px 0 rgba(0, 0, 0, 0.02)',
      primaryShadow: '0 4px 20px rgba(68, 237, 38, 0.2)',
      contentFontSize: 15,
      fontWeight: 600,
    },
    Input: {
      controlHeight: 46,
      borderRadius: 12,
      activeShadow: '0 0 0 2px rgba(68, 237, 38, 0.12)',
      hoverBorderColor: brand.primary,
    },
    Select: {
      controlHeight: 46,
      borderRadius: 12,
    },
    Layout: {
      headerBg: 'transparent',
      siderBg: 'transparent',
    },
    Menu: {
      itemBorderRadius: 10,
      itemMarginInline: 8,
      itemHeight: 44,
      activeBarBorderWidth: 0, // Remove side bar
    },
    Card: {
      borderRadiusLG: 16,
      boxShadowTertiary: '0 20px 40px rgba(0, 0, 0, 0.35)',
    },
    Typography: {
      fontFamilyCode: '"JetBrains Mono", monospace',
    },
    Tag: {
      borderRadius: 6,
    }
  },
}
