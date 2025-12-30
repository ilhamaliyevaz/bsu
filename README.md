# BSU Chat - Bakı Dövlət Universiteti Tələbə Chat Platforması

## 📋 Layihə haqqında
BSU Chat - Bakı Dövlət Universitetinin tələbələri üçün xüsusi olaraq hazırlanmış real-vaxt chat platformasıdır. Tələbələr öz fakültələrinin chat otaqlarında ünsiyyət qura, şəxsi mesajlaşma apara və universitet həyatı ilə bağlı məlumat mübadiləsi edə bilərlər.

## 🌐 URL-lər
- **GitHub Repository**: https://github.com/azerbaijandelight-sketch/bsu
- **Sandbox Development**: https://3000-icbmfvaldk2q9fsmap8tz-cbeee0f9.sandbox.novita.ai
- **Cloudflare Pages Project**: https://bsu-chat.pages.dev (deployment üçün aşağıdakı addımları tamamlayın)

## ✨ Əsas Funksiyalar

### 👨‍🎓 Tələbə Funksiyaları
- ✅ **BSU Email ilə qeydiyyat** - Yalnız @bsu.edu.az domenli emaillər qəbul edilir
- ✅ **Yoxlama sistemı** - Qeydiyyat zamanı 3 sualdan minimum 2-ni doğru cavablandırma tələbi
- ✅ **16 Fakültə Chat Otağı** - Hər fakültə üçün ayrıca söhbət otağı
- ✅ **Şəxsi mesajlaşma** - İstifadəçilər arasında birbaşa söhbət
- ✅ **Profil şəkli yükləmə** - Birbaşa şəkil faylı yükləmə (base64 format, max 2MB)
- ✅ **Bloklama sistemi** - Arzuolunmaz istifadəçiləri bloklama
- ✅ **Şikayət sistemi** - Qaydaları pozanlara qarşı şikayət
- ✅ **Real-vaxt yeniləmə** - Mesajlar avtomatik yenilənir (mesaj yazarkən input field toxunulmur)
- ✅ **72 saatlıq avtomatik silinmə** - Mesajlar 72 saat sonra avtomatik silinir

### 🛡️ Admin Paneli
- ✅ **Təhlükəli hesablar** - 16+ şikayət alan istifadəçilərin email, telefon və şikayət səbəbləri ilə birlikdə görünməsi
- ✅ **Ban sistemi** - İstifadəçiləri ban etmə/ban-ı götürmə
- ✅ **Filtr sözləri** - Qadağan edilmiş sözlərin idarə edilməsi və avtomatik filtrləmə
- ✅ **Qaydalar** - Sayt qaydalarının redaktə edilməsi
- ✅ **Günün mövzusu** - Gündəlik mövzunun təyin edilməsi (bütün chat otaqlarında göstərilir)
- ✅ **İstifadəçi siyahısı** - Bütün qeydiyyatlı istifadəçilərin email və telefon nömrələri ilə birlikdə görünməsi

## 🗄️ Məlumat Arxitekturası

### Database Strukturu (Cloudflare D1 - SQLite)

**İstifadəçilər (users)**
- id, email, phone, password, full_name, faculty, course, profile_image
- is_banned, is_admin, created_at

**Mesajlar (messages)**
- id, sender_id, receiver_id, faculty_id, message
- created_at, expires_at (72 saat sonra silinir)

**Fakültələr (faculties)**
- 16 fakültə: Mexanika-riyaziyyat, Tətbiqi riyaziyyat və kibernetika, Fizika, Kimya, Biologiya, Ekologiya və torpaqşünaslıq, Coğrafiya, Geologiya, Filologiya, Tarix, Beynəlxalq münasibətlər və iqtisadiyyat, Hüquq, Jurnalistika, İnformasiya və sənəd menecmenti, Şərqşünaslıq, Sosial elmlər və psixologiya

**Bloklama (blocks)**
- blocker_id, blocked_id, created_at

**Şikayətlər (reports)**
- reporter_id, reported_id, reason, created_at

**Filtr sözləri (filter_words)**
- word, created_at

**Qaydalar (rules)**
- content, updated_at

**Günün mövzusu (daily_topics)**
- content, created_at

**Yoxlama sualları (verification_questions)**
- 16 sual korpuslar haqqında

## 👥 İstifadəçi Bələdçisi

### Qeydiyyat
1. "Qeydiyyatdan keç" düyməsinə basın
2. Ad, Soyad, Email (@bsu.edu.az), Telefon (+994XXXXXXXXX), Şifrə, Fakültə və Kurs məlumatlarını daxil edin
3. 3 yoxlama sualından minimum 2-ni doğru cavablandırın
4. Qeydiyyat tamamlanır

### Giriş
1. Email və şifrənizi daxil edin
2. "Daxil ol" düyməsinə basın

### Fakültə Chat
1. Öz fakültənizin otağını seçin
2. Mesaj yazın və göndərin
3. Digər istifadəçilərin mesajlarını görün
4. İstifadəçi adının yanındakı 3 nöqtəyə basaraq:
   - Şəxsi mesaj göndərin
   - İstifadəçini bloklayın
   - Şikayət edin

### Şəxsi Chat
1. Zərf ikonuna basın
2. Əvvəlki söhbətlərinizi görün
3. Söhbətə basaraq davam edin

### Profil
1. Profil ikonuna basın
2. "Choose File" düyməsi ilə şəkil seçin (max 2MB)
3. "Şəkli yenilə" düyməsinə basın
4. Şəkil base64 formatında verilənlər bazasında saxlanılır

## 🔧 Admin Paneli

### Giriş məlumatları
- **İstifadəçi adı**: ursamajor
- **Şifrə**: ursa618

⚠️ **QEYD**: Bu məlumatlar yalnız sizə məlumdur və saytın heç bir yerində göstərilmir.

### Admin funksiyaları
1. **Təhlükəli hesablar** - 16+ şikayət alan istifadəçiləri incələyin və ban edin
2. **Filtr sözləri** - Qadağan edilmiş sözlər əlavə edin/silin
3. **Qaydalar** - Sayt qaydalarını redaktə edin
4. **Günün mövzusu** - Gündəlik mövzu təyin edin
5. **İstifadəçi siyahısı** - Bütün istifadəçiləri görün

## 🚀 Deployment

### Yerli İnkişaf
```bash
# Dependencies yükləmə
npm install

# D1 miqrasiyaları tətbiq et
npm run db:migrate:local

# Build
npm run build

# İnkişaf serveri başlat
npm run dev:sandbox
# və ya
pm2 start ecosystem.config.cjs

# Port təmizləmə
npm run clean-port
```

### Cloudflare Pages Deployment

⚠️ **QEYD**: API token icazələri məhdud olduğu üçün aşağıdakı addımları manual tamamlayın:

#### Addım 1: D1 Database Yaradın
1. [Cloudflare Dashboard](https://dash.cloudflare.com) > Workers & Pages > D1 bölməsinə keçin
2. "Create" düyməsinə basın
3. Database adı: `bsu-chat-production`
4. Yaradılan database-in ID-sini kopyalayın

#### Addım 2: wrangler.jsonc-ni Yeniləyin
Database ID-ni wrangler.jsonc faylında `local-only` əvəzinə əlavə edin:
```jsonc
"d1_databases": [
  {
    "binding": "DB",
    "database_name": "bsu-chat-production",
    "database_id": "BURAYA-ACTUAL-DATABASE-ID-YAZIN"
  }
]
```

#### Addım 3: Miqrasiyaları Tətbiq Edin
```bash
npm run db:migrate:prod
```

#### Addım 4: Deploy Edin
```bash
npm run deploy
```

#### Alternative: Dashboard-dan Deployment
Əgər CLI ilə problem olarsa:
1. Cloudflare Dashboard > Workers & Pages > bsu-chat
2. "Create deployment" düyməsinə basın
3. `dist` qovluğundakı faylları yükləyin
4. Deploy edin


## 🛠️ Texnologiyalar
- **Backend**: Hono.js (Cloudflare Workers)
- **Database**: Cloudflare D1 (SQLite)
- **Frontend**: Vanilla JavaScript + TailwindCSS
- **Icons**: Font Awesome
- **Deployment**: Cloudflare Pages
- **Development**: PM2, Wrangler

## 📊 Cari Status
- ✅ Qeydiyyat və giriş sistemi
- ✅ 16 fakültə chat otaqları
- ✅ Şəxsi mesajlaşma
- ✅ Bloklama və şikayət sistemi
- ✅ Admin paneli
- ✅ Profil şəkli yükləmə
- ✅ Real-vaxt mesaj yeniləmə (polling)
- ✅ 72 saatlıq avtomatik mesaj silinməsi
- ✅ Filtr sistemi
- ✅ Yerli development serveri işləyir
- ✅ Cloudflare Pages project yaradılıb
- ⏳ Production D1 database yaradılmalıdır (manual)

## 📝 Növbəti Addımlar
1. Cloudflare Pages-ə production deployment
2. Custom domain əlavə etmə (istəyə bağlı)
3. Email bildirişləri (istəyə bağlı)
4. Push notification sistemi (istəyə bağlı)

## 👨‍💻 İnkişaf
Layihə Hono framework və Cloudflare Workers texnologiyası ilə hazırlanıb. Bütün məlumatlar Cloudflare D1 SQLite verilənlər bazasında saxlanılır.

**Son yeniləmə**: 2025-12-30
