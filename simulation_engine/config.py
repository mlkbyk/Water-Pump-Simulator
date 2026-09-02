"""
Katman 1: Simülasyon Motoru Yapılandırması (Seçenek B: Sıralı & Ölçekli Tekil Holding Registers)
Tüm ayarlar ve sensör telemetrisi 0..43 arası Holding Register'larda (40001..40044) toplanmıştır.
Standart Modbus Decimal modunda doğal sayılar (x100 / x10) olarak net görünür.
"""

# Modbus TCP Ağ Ayarları
MODBUS_HOST = "0.0.0.0"
MODBUS_PORT = 5020
SLAVE_ID = 1

# Simülasyon Döngü Zamanlaması
SIMULATION_DT = 0.1       # 100ms fiziksel döngü
LOG_INTERVAL_SEC = 2.0    # 2 saniyede bir konsol çıktısı

# Tekil Holding Register Boyutu
HOLDING_REGISTER_COUNT = 64

# --------------------------------------------------------------------------
# SIRALI HOLDING REGISTER HARİTASI (Adres Tabanı: 0 | Modbus: 40001..)
# --------------------------------------------------------------------------
HOLDING_REGISTERS = {
    # --- 1. KONTROLLER VE SETPOINTLER (R/W) ---
    0: {"name": "Kuyu_Basinc_Set", "unit": "Bar", "scale": 100, "default": 366, "desc": "Kuyu Hedef Basınç (Örn: 3.66 Bar -> 366)"},
    1: {"name": "Kuyu_Debi_Set", "unit": "m3/h", "scale": 100, "default": 2483, "desc": "Kuyu Hedef Debi (Örn: 24.83 m3/h -> 2483)"},
    2: {"name": "Pompa_Komut", "unit": "Enum", "scale": 1, "default": 1, "desc": "1: Başlat (ON), 0: Durdur (OFF)"},
    3: {"name": "Calisma_Modu", "unit": "Enum", "scale": 1, "default": 1, "desc": "1: Otomatik (Depo Kontrollü), 0: Manuel"},
    4: {"name": "Hedef_Verim_Set", "unit": "%", "scale": 100, "default": 7543, "desc": "Hedef Sistem Verimi (Örn: %75.43 -> 7543)"},
    5: {"name": "Depo_Baslatma_Alt_Seviye", "unit": "mss", "scale": 100, "default": 60, "desc": "Depo Başlatma Min Seviye (Örn: 0.60 mss -> 60)"},
    6: {"name": "Depo_Durdurma_Ust_Seviye", "unit": "mss", "scale": 100, "default": 310, "desc": "Depo Durdurma Max Seviye (Örn: 3.10 mss -> 310)"},
    7: {"name": "Simulasyon_Hiz_Carpani", "unit": "x", "scale": 1, "default": 60, "desc": "24h Hız Çarpanı (Varsayılan 60x: 24dk = 24h)"},
    8: {"name": "Simulasyon_Saati", "unit": "Saat", "scale": 1, "default": 14, "desc": "Simüle Gün Saati (0 - 23)"},
    9: {"name": "Simulasyon_Dakikasi", "unit": "Dk", "scale": 1, "default": 30, "desc": "Simüle Gün Dakikası (0 - 59)"},

    # --- 2. CANLI KUYU & ELEKTRİK & TERMAL TELEMETRİ (RO) ---
    10: {"name": "Kuyu_Anlik_Basinc", "unit": "Bar", "scale": 100, "default": 366, "desc": "Çıkış Basıncı (3.66 Bar -> 366)"},
    11: {"name": "Kuyu_Anlik_Debi", "unit": "m3/h", "scale": 100, "default": 2483, "desc": "Anlık Debi (24.83 m3/h -> 2483)"},
    12: {"name": "Kuyu_Dinamik_Su_Seviyesi", "unit": "m", "scale": 100, "default": 9200, "desc": "Kuyu Su Seviyesi (92.00 m -> 9200)"},
    13: {"name": "Pompa_Montaj_Derinligi", "unit": "m", "scale": 100, "default": 11230, "desc": "Pompa Kotu (112.30 m -> 11230)"},
    14: {"name": "L1_Voltaj", "unit": "Volt", "scale": 10, "default": 4113, "desc": "L1-L2 Gerilimi (411.3 V -> 4113)"},
    15: {"name": "L2_Voltaj", "unit": "Volt", "scale": 10, "default": 4101, "desc": "L1-L3 Gerilimi (410.1 V -> 4101)"},
    16: {"name": "L3_Voltaj", "unit": "Volt", "scale": 10, "default": 4083, "desc": "L2-L3 Gerilimi (408.3 V -> 4083)"},
    17: {"name": "L1_Akim", "unit": "Amper", "scale": 100, "default": 2536, "desc": "L1 Akımı (25.36 A -> 2536)"},
    18: {"name": "L2_Akim", "unit": "Amper", "scale": 100, "default": 2312, "desc": "L2 Akımı (23.12 A -> 2312)"},
    19: {"name": "L3_Akim", "unit": "Amper", "scale": 100, "default": 2200, "desc": "L3 Akımı (22.00 A -> 2200)"},
    20: {"name": "Sebeke_Frekansi", "unit": "Hz", "scale": 100, "default": 4999, "desc": "Frekans (49.99 Hz -> 4999)"},
    21: {"name": "Toplam_Aktif_Guc", "unit": "kW", "scale": 100, "default": 1511, "desc": "Aktif Güç (15.11 kW -> 1511)"},
    22: {"name": "Motor_Sicakligi", "unit": "°C", "scale": 100, "default": 2300, "desc": "Motor Sıcaklığı (23.00 °C -> 2300)"},
    23: {"name": "Pano_Sicakligi", "unit": "°C", "scale": 100, "default": 5300, "desc": "Pano Sıcaklığı (53.00 °C -> 5300)"},
    24: {"name": "Dis_Ortam_Sicakligi", "unit": "°C", "scale": 100, "default": 2560, "desc": "Dış Ortam (25.60 °C -> 2560)"},
    25: {"name": "Basilan_Su_Sicakligi", "unit": "°C", "scale": 100, "default": 1670, "desc": "Su Sıcaklığı (16.70 °C -> 1670)"},
    26: {"name": "Pompa_Durumu", "unit": "Enum", "scale": 1, "default": 1, "desc": "1: Çalışıyor, 0: Kapalı"},

    # --- 3. CANLI TERFİ, DEPO & SAYAÇLAR (RO) ---
    30: {"name": "Depo_Su_Seviyesi", "unit": "mss", "scale": 100, "default": 95, "desc": "Depo Seviyesi (0.95 mss -> 95)"},
    31: {"name": "Sehir_Tuketim_Debisi", "unit": "m3/h", "scale": 100, "default": 2250, "desc": "Şehir Çıkış Debisi (22.50 m3/h -> 2250)"},
    32: {"name": "Basma_Yuksekligi_H", "unit": "m", "scale": 100, "default": 16185, "desc": "Toplam Basma H (161.85 m -> 16185)"},
    33: {"name": "Hidrolik_Verim", "unit": "%", "scale": 100, "default": 8381, "desc": "Hidrolik Verim (%83.81 -> 8381)"},
    34: {"name": "Sistem_Verimi", "unit": "%", "scale": 100, "default": 7543, "desc": "Sistem Verimi (%75.43 -> 7543)"},
    35: {"name": "Ozgul_Enerji", "unit": "kWh/m3", "scale": 1000, "default": 609, "desc": "Özgül Enerji (0.609 kWh/m3 -> 609)"},
    36: {"name": "Toplam_Su_Sayaci_High", "unit": "Word", "scale": 1, "default": 16, "desc": "Toplam Su m3 (32-bit High Word)"},
    37: {"name": "Toplam_Su_Sayaci_Low", "unit": "Word", "scale": 1, "default": 42021, "desc": "Toplam Su m3 (32-bit Low Word: 1090501 m3)"},
    38: {"name": "Toplam_Enerji_Sayaci_High", "unit": "Word", "scale": 1, "default": 11, "desc": "Toplam Enerji kWh (32-bit High Word)"},
    39: {"name": "Toplam_Enerji_Sayaci_Low", "unit": "Word", "scale": 1, "default": 40872, "desc": "Toplam Enerji kWh (32-bit Low Word: 761876 kWh)"},
    40: {"name": "Calisma_Saati", "unit": "Saat", "scale": 1, "default": 1180, "desc": "Toplam Çalışma Saati"},
    41: {"name": "Salt_Sayisi", "unit": "Adet", "scale": 1, "default": 142, "desc": "Pompa Start Sayısı"},
    42: {"name": "Gun_Fazi_Kodu", "unit": "Enum", "scale": 1, "default": 2, "desc": "0: Gece, 1: Sabah Pik, 2: Gündüz, 3: Akşam Pik"},
    43: {"name": "Depo_Giris_Kotu", "unit": "mss", "scale": 100, "default": 310, "desc": "Depo Giriş Boru Kotu (3.10 mss -> 310)"},
}
