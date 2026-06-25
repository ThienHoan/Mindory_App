'use client';

import Script from 'next/script';

const GA_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

/**
 * Google Analytics — cách nó vận hành:
 *
 * 1. Script gtag.js được load từ Google servers.
 * 2. Khi user vào trang, script gửi 1 event "page_view" lên Google.
 * 3. Mỗi page_view chứa: URL, referrer, user-agent, screen size...
 * 4. Google dùng cookie _ga để nhận diện user quay lại (unique visitors).
 * 5. Tất cả request được gửi đến `https://www.google-analytics.com/g/collect`.
 *
 * Data flow:
 *   Browser → gtag.js → collect endpoint → Google Analytics Dashboard
 */
export default function GoogleAnalytics() {
  // Không có ID thì không render gì — tránh lỗi khi dev local
  if (!GA_ID) return null;

  return (
    <>
      {/* Strategy "afterInteractive": load sau khi page interactive,
          không block render, không ảnh hưởng Lighthouse score */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            // Khởi tạo dataLayer — nơi chứa tất cả event trước khi gtag sẵn sàng
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}

            // Cấu hình mặc định
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              page_path: window.location.pathname,
              // Gửi thêm page_location để Google biết chính xác URL
              page_location: window.location.href,
            });

            // Cách GA nhận diện user:
            // - _ga cookie: ID duy nhất, hết hạn sau 2 năm
            // - _ga_<ID> cookie: session info, hết hạn sau 30 phút
            // Mỗi request gửi lên đều kèm cookie này → Google đếm được unique users
          `,
        }}
      />
    </>
  );
}
