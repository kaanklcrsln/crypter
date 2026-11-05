# crypter

Tek sayfalık, statik bcrypt hash üretici ve doğrulayıcı. Tüm işlemler tarayıcıda yapılır, hiçbir veri ağa gönderilmez.

- Backend yok, build adımı yok, framework yok.
- Dosyalar: `index.html`, `style.css`, `app.js`, `i18n.js`, `vendor/bcrypt.min.js`, `_headers`.
- Arayüz varsayılan olarak İngilizce; sağ üstteki `TR`/`EN` butonu dili değiştirir (tercih saklanmaz, localStorage yok).

## Vendor

| Dosya | Kaynak | Sürüm | SHA-256 |
|---|---|---|---|
| `vendor/bcrypt.min.js` | npm `bcryptjs`, `umd/index.js` (değiştirilmemiş kopya) | 3.0.3 | `ed01b52b436504d8bb7086d93fee4bd8edbb22d8ed88e1b456e0c604f30e79c4` |

Dosya npm paketinden birebir kopyalandı, yeniden minify edilmedi. Bu yüzden hash yayınlanan paketle karşılaştırılabilir:

```sh
npm pack bcryptjs@3.0.3
tar xzf bcryptjs-3.0.3.tgz
shasum -a 256 package/umd/index.js vendor/bcrypt.min.js
```

Salt, `crypto.getRandomValues` (Web Crypto) ile üretilir.

## Yerelde çalıştırma

```sh
npx serve .
# http://localhost:3000 adresini aç
```

`navigator.clipboard` yalnızca güvenli bağlamda (`https://` veya `localhost`) çalışır.

### Ağa veri gitmediğini doğrulama

1. DevTools → **Network** sekmesini aç, **Preserve log** kutusunu işaretle, filtre **All** olsun.
2. Sayfayı yenile. Listede yalnızca `index.html`, `style.css`, `vendor/bcrypt.min.js`, `i18n.js` ve `app.js` görünmeli. `favicon.ico` 404'ü tarayıcının kendisinden gelir.
3. Listeyi temizle (🚫), metin gir, **Generate Hash** (TR: Hash Üret), ardından **Verify** (Doğrula) butonuna bas.
4. Liste boş kalmalı. CSP'de `connect-src 'none'` olduğu için herhangi bir `fetch`/XHR/WebSocket denemesi engellenir ve **Console** sekmesinde hata olarak görünür.

## Güvenlik

- `<meta>` içinde sıkı CSP: `default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'`.
- Inline script, inline style ve inline event handler yok. Yalnızca `textContent` kullanılır, `innerHTML` yok.
- Harici font yok (yerel monospace font yığını kullanılır), analitik yok, cookie yok, localStorage yok.
- `<form>` yok ve tüm butonlar `type="button"`. Hiçbir şey submit edilmez, URL'ye veri düşmez.
- Input'larda `autocomplete="off"`, `spellcheck="false"`, `autocapitalize="off"` var.
- bcrypt girdinin yalnızca ilk 72 byte'ını kullanır. Arayüz girdiyi `TextEncoder` ile ölçer ve sınır aşılınca uyarı gösterir.

### Önerilen hosting başlıkları

`frame-ancestors` `<meta>` etiketinde yok sayılır, bu yüzden CSP'yi HTTP başlığı olarak gönder:

```
Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'; form-action 'none'; base-uri 'none'; frame-ancestors 'none'
X-Content-Type-Options: nosniff
Referrer-Policy: no-referrer
Permissions-Policy: accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(), usb=()
Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

`_headers` dosyası **Cloudflare Pages** ve **Netlify** için olduğu gibi kullanılabilir. Eski tarayıcılar için `X-Frame-Options: DENY` ve ayrıca `Cross-Origin-Opener-Policy: same-origin` da ekler. HSTS'teki `preload`'u yalnızca alan adının tamamı kalıcı olarak HTTPS'teyse kullan.
