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
    borderRadius: 10,
    fontFamily: '"Sora", "Segoe UI", sans-serif',
    colorTextBase: '#0f172a',
    colorBgLayout: '#f4f5f7',
    colorBgContainer: '#ffffff',
  },
  components: {
    Button: {
      controlHeight: 44,
      controlOutlineWidth: 2,
      controlOutline: `rgba(47, 189, 106, 0.35)`,
    },
    Input: {
      controlHeight: 44,
    },
    Layout: {
      headerBg: '#ffffff',
      siderBg: '#ffffff',
    },
    Menu: {
      itemBorderRadius: 10,
      itemMarginInline: 8,
    },
    Card: {
      borderRadiusLG: 12,
    },
  },
}
