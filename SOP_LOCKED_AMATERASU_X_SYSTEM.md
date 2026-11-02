# 🔒 DOKUMEN SOP RASMI & TERKUNCI (LOCKED SOP)
# SISTEM AMATERASU X & MT5 AUTONOMOUS ECOSYSTEM

**Status Dokumen:** KEKAL & TERKUNCI (LOCKED)  
**Tarikh Penguatkuasaan:** 2 November 2026  
**Versi Sistem:** Amaterasu X v2.5 Enterprise  
**Ekosistem:** Amaterasu X Web App (`https://amaterasu-x.vercel.app`), MT5 Python Bridge, Multi-Layer Server Engine, & IB CRM Management.

---

## 📌 PENGENALAN
Dokumen ini menetapkan Prosedur Operasi Standard (SOP) yang tidak boleh diubah sewenang-wenangnya. Ia direka bagi memastikan **kepercayaan 100% daripada para pelabur dan pedagang (*traders*)**, menghapuskan kesilapan manusia (*human error*), serta menjamin keharmonian mutlak antara terminal broker MT5 dan paparan aplikasi mudah alih.

---

## 🏛️ 1. PROTOKOL KESELARASAN DUA HALA (SINGLE SOURCE OF TRUTH)

Terminal MT5 broker adalah **kebenaran mutlak fizikal pasaran**. Aplikasi web tidak boleh berdiri sendiri atau memaparkan data yang bertentangan dengan MT5.

1. **Denyutan Penyelarasan Setiap 2.5 Saat (*Sync Heartbeat*)**:
   - Bridge MT5 mengekstrak kedudukan posisi terbuka sebenar (`mt5.positions_get()`) setiap 2.5 saat.
   - Data dihantar terus ke pelayan web pengeluaran melalui endpoint `/api/market/sync-mt5`.
2. **Penyelarasan Automatik Mandatori (*Continuous Auto-Reconciliation Engine*)**:
   - Sekiranya pangkalan data web memegang isyarat yang berbeza arah dengan MT5 (contoh: MT5 sedang memegang SELL tetapi web ada BUY), pelayan web **WAJIB membetulkan kad isyarat kepada SELL dalam tempoh < 2 saat**.
   - Perubahan ini disiarkan secara automatik melalui *Server-Sent Events (SSE)* kepada semua peranti trader secara langsung tanpa perlu mereka muat semula (*refresh*) halaman.
3. **Lencana Sahih Langsung MT5 (*MT5 Live Verified Badge*)**:
   - Setiap isyarat yang aktif disahkan dengan nombor tiket broker yang sah:
     `🟢 MT5 LIVE VERIFIED #[TICKET_NO]`
   - Memberi ketelusan 100% bahawa isyarat di telefon trader adalah apa yang sedang berjalan di akaun sebenar.

---

## 🛡️ 2. SEKATAN KERAS ANTI-KONFLIK & ANTI-HEDGING (SAFETY GUARDS)

Bagi mengelakkan kekeliruan dan kerugian pedagang, sistem menguatkuasakan sekatan berbilang lapis:

1. **Sekatan Server-Side Anti-Conflict (`server.js`)**:
   - Jika MT5 sedang memegang posisi **SELL** bagi sesuatu instrumen (contoh: XAUUSD), sebarang isyarat **BUY** sama ada dari imbasan AI automatik mahupun manual admin CRM **DITOLAK SERTA-MERTA (HTTP 400)**.
2. **Sekatan Terminal Anti-Hedging (`amaterasu_mt5_bridge.py`)**:
   - Bridge MT5 memeriksa setiap posisi sedia ada sebelum membuka order baharu.
   - Dilarang sama sekali membuka order bertentangan (hedging) yang boleh mengelirukan pengurusan risiko.
3. **Zon Sekatan London (*London Trap Zone 14:00 - 16:00 MYT*)**:
   - Mengelakkan perangkap *Judas Swing* pada pembukaan pasaran London.
   - Isyarat XAUUSD disekat secara automatik pada waktu ini.

---

## 🎯 3. DASAR SENARAI PUTIH TOP 3 PAIR SAHAJA (WHITELIST LOCK)

Portfolio dagangan dikunci ketat kepada **3 Instrumen Berprestasi Tertinggi** sahaja:

| Bil | Instrumen | Strategi Utama | Rasional Pemilihan |
| :---: | :---: | :---: | :---: |
| 1 | **XAUUSD (Emas)** | SMC Order Block + Asian Session Sweep | Volatiliti tinggi, pulangan pips maksimum. |
| 2 | **USDCHF** | Malaysian SnR + Rejection Wick Reversal | Pergerakan bersih, kadar kemenangan (*win-rate*) konsisten > 90%. |
| 3 | **EURUSD** | Institutional Liquidity Hunt + Trend Pullback | Pair major dengan spread terendah di pasaran. |

*Aset bertoksik tinggi seperti Perak (XAGUSD), pair JPY liar, dan USDCAD yang mudah terperangkap telah dipadamkan sepenuhnya daripada senarai pemancaran isyarat.*

---

## ⚡ 4. SOP PELAKSANAAN INSTITUSI 3 LAYER & PENGURUSAN RISIKO

Setiap kemasukan isyarat MT5 dilaksanakan melalui kaedah **Split 3 Layer**:

```
[ENTRY ORDER BERJAYA]
  ├── Layer 1 (50% Volume)  ──> Sasaran TP1 (Keuntungan Pantas)
  ├── Layer 2 (30% Volume)  ──> Sasaran TP2 (Mid Swing)
  └── Layer 3 (20% Volume)  ──> Sasaran TP3 (Runner Arah Trend Besar)
```

1. **Auto Break-Even (BE) Guardian**:
   - Sebaik sahaja harga mencecah sasaran **TP1**, Stop Loss (SL) bagi Layer 2 dan Layer 3 dialihkan serta-merta ke harga Entry (`price_open + spread buffer`).
   - Dagangan bertukar menjadi **100% SIFAR RISIKO (*Risk-Free Trade*)**.
2. **Strict Pullback Guard**:
   - Dilarang membuat order SELL di lantai dasar (*floor*) atau order BUY di siling tertinggi (*roof*).
   - Sistem wajib menunggu lantunan *Pullback* yang selamat sebelum menembak order.
3. **Dynamic Floating ATR**:
   - Jarak Stop Loss dan Take Profit dikira secara dinamik berasaskan volatiliti sebenar lilin (M15 ATR), bukan nilai statik rawak.

---

## 👥 5. SOP ONBOARDING TRADER & PENGURUSAN RAKAN NIAGA (IB CRM)

Ekosistem pengurusan klien bagi memastikan komisyen IB berterusan dan akaun trader sentiasa aktif berdagang:

### A. Aliran Kemasukan Klien Baharu (Trader Onboarding)
1. **Pendaftaran Akaun Broker Melalui Pautan IB**:
   - Klien wajib mendaftar akaun MT5 broker di bawah pautan *referral* IB rasmi.
   - Klien membuat deposit modal dagangan minimum yang ditetapkan (cth: \$50 / \$100).
2. **Penjanaan Kod Akses Khusus**:
   - IB atau Admin menjana kod unik berformat: `AMAT-XXXX-YYYY` dengan tempoh percubaan **14 Hari (2 Minggu)**.
3. **Penguncian 1 Peranti (*1-Device Hardware Lock*)**:
   - Pada kali pertama klien log masuk di Web App, cap jari peranti (*Device Fingerprint*) klien akan didaftarkan dan diikat (*bound*) ke pelayan.
   - **Klien tidak boleh berkongsi kod kepada orang lain.** Percubaan membuka di telefon atau pelayar lain akan disekat serta-merta dengan amaran:
     `[AKSES DISEKAT: Kod ini telah diikat pada peranti berdaftar lain]`.
   - Hanya IB/Admin yang mempunyai butang `[📱 Reset Device]` di portal CRM sekiranya klien menukar telefon.

### B. Portal Khas Rakan Niaga (IB Partner Portal)
1. **Akses Terasing**:
   - Rakan niaga mengakses CRM menggunakan parameter khas: `https://amaterasu-x.vercel.app/crm.html?ib=KOD_IB`.
   - IB hanya dapat melihat senarai klien di bawah kumpulan mereka sendiri tanpa melihat data klien pihak lain.
2. **Pusingan Pengesahan 2 Minggu (*2-Week Re-validation Loop*)**:
   - Selepas 14 hari, akses klien akan tamat tempoh secara automatik.
   - Klien perlu menghubungi IB mereka untuk menyambung akses.
   - **Tujuan:** IB menyemak sama ada klien masih mempunyai baki modal dan masih aktif berdagang (menjana lot & komisyen IB). Sekiranya akaun aktif, IB meluluskan sambungan akses untuk 14 hari berikutnya.

---

## 🔒 IKRAR KESTABILAN SISTEM
Semua peraturan di atas kini telah diprogramkan ke dalam kod sumber, diuji pada pelayan pengeluaran, dan diaktifkan di Bridge MT5. Tiada perbezaan isyarat dibenarkan berlaku lagi di antara terminal broker dan aplikasi pengguna.
