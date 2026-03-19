import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * 修复缺少协议的 URL（如 OSS/CDN 地址）
 * 如果 URL 不以 http:// 或 https:// 开头且包含域名特征，自动补充 https://
 */
export function fixUrl(url: string | undefined | null): string | undefined {
    if (!url) return undefined;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:') || url.startsWith('/')) {
        return url;
    }
    // 包含域名特征（有 . 且不是纯路径）
    if (url.includes('.') && !url.startsWith('.')) {
        return `https://${url}`;
    }
    return url;
}
