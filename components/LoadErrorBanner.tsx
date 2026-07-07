'use client'

/**
 * Hiển thị khi load dữ liệu thất bại — thay cho việc nuốt lỗi im lặng
 * (trước đây lỗi chỉ console.error → user tưởng danh mục trống).
 */
export default function LoadErrorBanner({ message, onRetry }: { message?: string; onRetry: () => void }) {
    return (
        <div style={{
            margin: '48px auto', maxWidth: 460, padding: '22px 24px',
            borderRadius: 14, textAlign: 'center',
            background: 'var(--neg-12)', border: '1px solid rgba(255,90,110,0.25)',
        }}>
            <div style={{ color: 'var(--neg)', fontWeight: 700, fontSize: 14, marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                Không tải được dữ liệu
            </div>
            <div style={{ color: 'var(--t-2)', fontSize: 12.5, marginBottom: 14 }}>
                {message || 'Kiểm tra kết nối mạng rồi thử lại.'}
            </div>
            <button className="btn btn-ghost" onClick={onRetry}>
                Thử lại
            </button>
        </div>
    )
}
