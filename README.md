# 🌊 Endüstriyel Su Kuyusu ve Terfi İstasyonu SCADA Simülatörü
### Çok Katmanlı Hidro-Dinamik, Enerji ve Telemetri Simülasyon Platformu

![Python](https://img.shields.io/badge/Python-3.10%2B-blue?logo=python)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)
![React](https://img.shields.io/badge/React-18-cyan?logo=react)
![Protocol](https://img.shields.io/badge/Protocol-Modbus%20TCP-orange)
![Standard](https://img.shields.io/badge/SCADA-IoT%20Enabled-blueviolet)

---

## 📖 Proje Hakkında

Bu proje; su dağıtım şebekeleri, kentsel su idareleri ve endüstriyel otomasyon tesisleri için geliştirilmiş **gerçek zamanlı, çok katmanlı bir donanım/fizik simülatörüdür**.

Sahada fiziksel bir kuyu, PLC veya enerji analizörü bulunmasa dahi; yer altı su seviyesi dinamiklerini, 3-faz elektrik tüketimini, boru hidroliğini ve depo seviye otomasyonunu gerçek zamanlı olarak simüle eder ve endüstri standardı **Modbus TCP (Port 5020)** üzerinden yayınlar.

---

## 🚀 Öne Çıkan Özellikler

- 💧 **Dinamik Çoklu İstasyon (Multi-Slave):** Tek port üzerinden `Slave ID 1, 2, 3, 4..` ile bağımsız derinlik ve kotlara sahip sınırsız kuyu ve terfi istasyonunu eşzamanlı simüle etme.
- 📁 **Otomatik SCADA CSV Dışa Aktarımı:** Tanımlanan her istasyon için endüstriyel SCADA ve IoT platformlarına tek tıkla yüklenebilecek etiket/tag sözlüklerini otomatik üretir.
- ➕ **Web Arayüzünden Canlı Kuyu Ekleme:** Sunucuyu durdurmadan arayüz üzerinden anında yeni bir kuyu veya terfi istasyonu açma (Hot-Reload desteği).
- ⏱️ **24 Saatlik Hızlandırılmış Gün Çevrimi:** Gece minimum tüketim, sabah ve akşam pik saatler, hava ve su sıcaklığı dinamiği (60x hız: 24 dk = 24 saat).
- ⚡ **3-Faz Elektrik & Güç Analizörü:** Gerçekçi güç katsayısı, hat gerilimleri (L1, L2, L3), hat akımları, frekans ve kümülatif kWh enerji sayacı.
- 📊 **Özgül Enerji & Verim Hesabı:** $1\text{ m}^3$ suyu çıkarmak için tüketilen kilowatt-saat ($\text{kWh/m}^3$), hidrolik verim ve toplam sistem verimi analizi.
- 📈 **Canlı Süreç Eğrileri:** ECharts destekli, çok eksenli yüksek performanslı SCADA trend grafiği.

---

## 🏗️ Sistem Mimarisi

[ Katman 1: Fizik Motoru & Modbus TCP Sunucusu ] (Python: Port 5020) │ ▲ (Holding Registers 40001..40044 | Slave IDs 1..N) ▼ │ [ Katman 2: SCADA Middleware & Polling Servisi ] (Node.js / Express: Port 4000) │ ▲ (WebSocket / Socket.IO) ▼ │ [ Katman 3: Modern Web SCADA Arayüzü ] (React / Vite / Tailwind: Port 5173) ▲ │ [ Harici Entegrasyon ] ──> Endüstriyel SCADA / IoT Platformları / Modbus Poll


---

## ⚡ Hızlı Başlangıç

### Gereksinimler
- Python 3.10+
- Node.js 18+

### Tek Tıkla Başlatma (Windows)
Proje kök dizinindeki başlatıcı betiği çalıştırın:
```bash
start_all.bat
