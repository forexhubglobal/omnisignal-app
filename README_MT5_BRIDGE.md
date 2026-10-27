# 🚀 AMATERASU X · PANDUAN PANTAS MT5 AUTO-EXECUTION BRIDGE (PYTHON)

Sistem **Amaterasu X MT5 Bridge** membolehkan terminal MetaTrader 5 anda menerima dan melaksanakan (*auto-execute*) order secara automatik sepantas milisaat sebaik sahaja signal dikeluarkan oleh AI Amaterasu.

---

## 📋 Ciri-Ciri Utama Sistem Bridge:
1. **Zero-Lag Real-Time Stream (SSE)**: Menerima data secara 'push' tanpa kelewatan masa.
2. **Multi-Layer Split TP Execution**:
   - Membuka 2 layer serentak mengikut SOP institusi:
     - **Layer 1**: Sasaran **TP1** (ambil keuntungan separa).
     - **Layer 2**: Sasaran **TP2** (Runner untuk memaksimumkan keuntungan).
3. **Auto Break-Even (BE) Protection**:
   - Sebaik sahaja TP1 dicapai, Stop Loss bagi Layer 2 secara automatik dialihkan ke harga Entry (`price_open`) untuk menghapuskan 100% risiko modal.
4. **Smart Broker Symbol Mapping**:
   - Automatik menyesuaikan nama simbol broker anda (contoh: `XAUUSD` -> `GOLD` / `XAUUSD.m`, `WTI` -> `USOIL` / `USOUSD`).
5. **Auto Fill Type Detection**:
   - Automatik memilih mod isian order yang disokong broker (`IOC`, `FOK`, atau `RETURN`).

---

## 🛠️ Langkah-Langkah Penggunaan (Sangat Mudah):

### Langkah 1: Pastikan MT5 Anda Dibuka
1. Buka terminal MetaTrader 5 anda di komputer (contoh: Pepperstone MT5 atau Exness MT5).
2. Login ke akaun trading anda (Demo atau Real).
3. **PENTING**: Pada bar alat bahagian atas MT5, pastikan butang **"Algo Trading"** ditekan sehingga bertukar hijau (*bermaksud EA/Python dibenarkan execute order*).

### Langkah 2: Buka & Selaraskan Saiz Lot (Jika Perlu)
Buka fail `bridge_config.json`:
```json
{
  "server_url": "https://amaterasux.onrender.com",
  "lot_size": 0.01,
  "execution_mode": "SPLIT_TP",
  "auto_breakeven": true,
  "max_slippage_pips": 5,
  "magic_number": 888999
}
```
- Ubah `"lot_size": 0.01` kepada nilai lot yang anda mahu (contoh: `0.02`, `0.05`, `0.10`).
- Simpan fail.

### Langkah 3: Klik Dua Kali Fail `run_bridge.bat`
1. Double-click fail `run_bridge.bat`.
2. Tetingkap hitam Amaterasu MT5 Bridge akan muncul:
   - Ia akan automatik mengesan akaun MT5 anda (Login ID, Nama Broker, Balance, Equity).
   - Ia akan menyambung ke server `https://amaterasux.onrender.com`.
3. Sebaik sahaja signal keluar, terminal akan memaparkan order berjaya dihantar bersama nombor Ticket MT5!

---

## ⚙️ Soalan Lazim (FAQ):

#### 1. Boleh ke saya guna di Windows VPS?
**Boleh, sangat digalakkan!** Anda hanya perlu letakkan folder ini di Windows VPS anda, buka MT5 dan jalankan `run_bridge.bat` supaya ia boleh berjalan 24 jam sehari 5 hari seminggu tanpa henti.

#### 2. Bagaimana kalau broker saya guna nama simbol lain (contohnya `USOIL` untuk WTI)?
Sistem kami telah dilengkapi ciri **Auto-Detection**. Tetapi jika anda mahu tetapkan secara manual, anda boleh tambah di `bridge_config.json`:
```json
"custom_symbol_map": {
  "WTI": "USOIL",
  "BTCUSD": "BTCUSDm"
}
```

#### 3. Boleh ke saya ubah supaya masuk 1 order sahaja (bukan 2 layer)?
Boleh! Di `bridge_config.json`, tukar `"execution_mode": "SPLIT_TP"` kepada:
- `"SINGLE_TP1"` (hanya buka 1 order untuk TP1); ATAU
- `"SINGLE_TP2"` (hanya buka 1 order untuk TP2).
