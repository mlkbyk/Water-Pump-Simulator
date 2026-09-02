import numpy as np
import math

class MetiriusWellProSimulator:
    """
    Metirius Well Pro V2 - 24 Saatlik Gece/Gündüz & Depo Doldurma Simülatörü.
    
    Özellikler:
    - 24 Saat = 24 Dakika Hızlandırılmış Gerçekçi Gün Çevrimi (Ayarlanabilir Çarpan)
    - Şehir Su Tüketimi (Gece minimum, Sabah/Akşam pik saatler)
    - Ayarlanabilir Depo Otomatik Doldurma ve Kesme Seviyeleri (Min/Max mss)
    - 3-Faz Elektrik, Güç, Sıcaklık, Sayaç ve Verim Entegrasyonu
    """

    def __init__(
        self,
        dt: float = 0.1,
        pump_depth: float = 112.30,
        well_level: float = 92.00,
        default_pressure: float = 3.66,
        default_flow: float = 24.83,
        rated_power: float = 15.11
    ):
        self.dt = dt  # Gerçek saniye
        
        # 24 Saatlik Zaman Sayacı (Başlangıç: Öğlen 14:30)
        self.sim_time_sec = 14 * 3600 + 30 * 60
        self.speed_multiplier = 60.0  # 60x hız: 1 gerçek saniye = 60 simülasyon saniyesi (24 saat = 24 dk)
        
        # Kuyu Durumları
        self.actual_pressure = default_pressure  # Bar
        self.actual_flow = default_flow          # m3/h
        self.well_level = well_level             # m
        self.pump_depth = pump_depth             # m
        self.pump_running = True
        self.mode = 1                            # 1: Otomatik (Depo Seviyesine Göre), 0: Manuel
        
        # Terfi Depo Durumları
        self.tank_level = 0.95        # mss
        self.inflow_height = 3.10     # mss (Giriş boru kotu)
        self.tank_start_level = 0.60  # mss (Bu seviyenin altına inince pompa otomatik çalışır)
        self.tank_stop_level = 3.10   # mss (Bu seviyeye ulaşınca pompa otomatik durur)
        self.tank_area_m2 = 120.0     # Depo taban alanı (~120 m2)
        
        # Şehir Tüketimi
        self.city_demand_flow = 22.0  # m3/h
        
        # Enerji & Elektrik
        self.frequency = 49.99
        self.target_efficiency = 75.43
        self.actual_efficiency = 75.43
        self.rated_power = rated_power
        
        # Termal Değerler
        self.motor_temp = 23.00
        self.cabinet_temp = 53.00
        self.outdoor_temp = 25.60
        self.water_temp = 16.70
        
        # Sayaçlar
        self.total_flow_m3 = 1090501.00
        self.total_energy_kwh = 761876.88
        self.runtime_seconds = 42500
        self.run_count = 142
        self._prev_pump_state = True
        
        # Eylemsizlik
        self.inertia_tau = 3.5

    def step(
        self,
        set_pressure: float = 3.66,
        set_flow: float = 24.83,
        pump_cmd: int = 1,
        mode: int = 1,
        set_efficiency: float = 75.43,
        tank_start_level: float = 0.60,
        tank_stop_level: float = 3.10,
        speed_multiplier: float = 60.0
    ) -> dict:
        """Simülasyonu 1 adım ilerletir."""
        
        # 1. Hızlandırma ve 24 Saat Zamanı
        self.speed_multiplier = max(1.0, min(300.0, float(speed_multiplier)))
        dt_sim = self.dt * self.speed_multiplier  # Simüle edilen saniye
        self.sim_time_sec = (self.sim_time_sec + dt_sim) % (24 * 3600)
        
        sim_hour = int(self.sim_time_sec // 3600)
        sim_minute = int((self.sim_time_sec % 3600) // 60)
        time_of_day_hours = sim_hour + (sim_minute / 60.0)

        # 2. Gün Fazı ve Şehir Su Tüketim Eğrisi (Pik / Gece Modeli)
        if 0.0 <= time_of_day_hours < 6.0:
            # GECE (00:00 - 06:00): Tüketim çok düşük (~6 - 10 m3/h), Hava serin (~17°C)
            phase_code = 0
            base_demand = 8.0 + 2.0 * math.sin(time_of_day_hours)
            target_outdoor_temp = 17.5 + 1.5 * math.sin(time_of_day_hours)
        elif 6.0 <= time_of_day_hours < 9.5:
            # SABAH PİK (06:00 - 09:30): Aşırı tüketim (~36 - 45 m3/h)
            phase_code = 1
            progress = (time_of_day_hours - 6.0) / 3.5
            base_demand = 18.0 + 24.0 * math.sin(progress * math.pi)
            target_outdoor_temp = 20.0 + progress * 5.0
        elif 9.5 <= time_of_day_hours < 17.5:
            # GÜNDÜZ (09:30 - 17:30): Dengeli tüketim (~20 - 26 m3/h), Güneş sıcaklığı (~28-32°C)
            phase_code = 2
            base_demand = 22.0 + 3.0 * math.sin((time_of_day_hours - 9.5) * 0.5)
            target_outdoor_temp = 27.0 + 4.5 * math.sin(((time_of_day_hours - 9.5) / 8.0) * math.pi)
        elif 17.5 <= time_of_day_hours < 22.0:
            # AKŞAM PİK (17:30 - 22:00): Yüksek tüketim (~32 - 40 m3/h)
            phase_code = 3
            progress = (time_of_day_hours - 17.5) / 4.5
            base_demand = 22.0 + 17.0 * math.sin(progress * math.pi)
            target_outdoor_temp = 28.0 - progress * 7.0
        else:
            # GECEYE GEÇİŞ (22:00 - 24:00): Tüketim azalır
            phase_code = 0
            base_demand = 14.0 - 5.0 * ((time_of_day_hours - 22.0) / 2.0)
            target_outdoor_temp = 21.0 - (time_of_day_hours - 22.0) * 2.0

        self.city_demand_flow = max(4.0, base_demand + np.random.normal(0, 0.3))
        self.outdoor_temp += (target_outdoor_temp - self.outdoor_temp) * 0.05

        # 3. Otomatik Depo Seviyesi Kontrolü (Histerezis Mantığı)
        self.mode = mode
        self.tank_start_level = max(0.1, min(2.0, float(tank_start_level)))
        self.tank_stop_level = max(self.tank_start_level + 0.3, min(4.0, float(tank_stop_level)))

        if self.mode == 1:  # Otomatik Mod
            if self.tank_level <= self.tank_start_level:
                self.pump_running = True
            elif self.tank_level >= self.tank_stop_level:
                self.pump_running = False
        else:  # Manuel Mod
            self.pump_running = (pump_cmd == 1)

        # Şalt sayacı
        if self.pump_running and not self._prev_pump_state:
            self.run_count += 1
        self._prev_pump_state = self.pump_running

        # 4. Pompa Akış ve Basınç Eylemsizliği
        target_p = max(0.0, float(set_pressure)) if self.pump_running else 0.0
        target_q = max(0.0, float(set_flow)) if self.pump_running else 0.0
        target_eta = max(30.0, min(98.0, float(set_efficiency))) if self.pump_running else 0.0

        alpha = min(1.0, self.dt / self.inertia_tau)
        self.actual_pressure += alpha * (target_p - self.actual_pressure)
        self.actual_flow += alpha * (target_q - self.actual_flow)
        self.actual_efficiency += alpha * (target_eta - self.actual_efficiency)

        # %1 Sensör Gürültüsü
        noise_p = np.random.normal(0, max(0.005, 0.01 * self.actual_pressure)) if self.actual_pressure > 0.05 else 0.0
        noise_q = np.random.normal(0, max(0.01, 0.01 * self.actual_flow)) if self.actual_flow > 0.1 else 0.0
        
        sensor_p = max(0.0, self.actual_pressure + noise_p)
        sensor_q = max(0.0, self.actual_flow + noise_q)

        # 5. Terfi Depo Su Seviyesi Dinamik Entegrasyonu
        net_flow_m3_per_hour = (sensor_q if self.pump_running else 0.0) - self.city_demand_flow
        delta_level = (net_flow_m3_per_hour * (dt_sim / 3600.0)) / self.tank_area_m2
        self.tank_level = max(0.15, min(3.80, self.tank_level + delta_level))

        # 6. Kuyu Seviyesi Dinamiği
        if self.pump_running and sensor_q > 0.1:
            self.well_level = max(10.0, self.pump_depth - 20.0 + (sensor_q / max(1.0, float(set_flow))) * 1.1 + np.random.normal(0, 0.02))
        else:
            self.well_level = max(5.0, self.well_level - 0.04 * (dt_sim / 60.0))

        # 7. Basma Yüksekliği H (m)
        if self.pump_running and sensor_p > 0.1:
            head_m = self.well_level + self.inflow_height + (sensor_p * 10.197) + 29.5 + np.random.normal(0, 0.08)
        else:
            head_m = 0.0

        # 8. Hidrolik Güç ve Verimler
        if self.pump_running and sensor_q > 0.1 and head_m > 1.0:
            p_hyd = (sensor_q * head_m) / 367.0
            hydraulic_eff = 83.81 + np.random.normal(0, 0.1)
        else:
            p_hyd = 0.0
            hydraulic_eff = 0.0

        # 9. Elektriksel Güç (kW)
        if self.pump_running and p_hyd > 0.05 and self.actual_efficiency > 10.0:
            p_elec = p_hyd / (self.actual_efficiency / 100.0)
            p_elec = max(0.4, p_elec + np.random.normal(0, 0.04))
        else:
            p_elec = 0.0

        # 10. 3-Faz Voltaj ve Akımlar
        v_noise = np.random.normal(0, 0.3)
        v_l1 = 411.26 + v_noise
        v_l2 = 410.06 + v_noise
        v_l3 = 408.31 + v_noise
        v_avg = (v_l1 + v_l2 + v_l3) / 3.0
        freq = 49.99 + np.random.normal(0, 0.01)

        if self.pump_running and p_elec > 0.1:
            i_base = (p_elec * 1000.0) / (1.73205 * v_avg * 0.85)
            i_l1 = i_base * (25.36 / 23.49) + np.random.normal(0, 0.05)
            i_l2 = i_base * (23.12 / 23.49) + np.random.normal(0, 0.05)
            i_l3 = i_base * (22.00 / 23.49) + np.random.normal(0, 0.05)
        else:
            i_l1 = i_l2 = i_l3 = 0.0

        # 11. Özgül Enerji Tüketimi
        if self.pump_running and sensor_q > 0.5 and p_elec > 0.1:
            power_per_m3 = (p_elec / sensor_q) + np.random.normal(0, 0.002)
        else:
            power_per_m3 = 0.0

        # 12. Sıcaklıklar
        if self.pump_running:
            self.motor_temp = 23.00 + (i_l1 * 0.2) + np.random.normal(0, 0.02)
            self.cabinet_temp = 53.00 + (p_elec * 0.1) + np.random.normal(0, 0.02)
        else:
            self.motor_temp = max(20.0, self.motor_temp - 0.02 * (dt_sim / 60.0))
            self.cabinet_temp = max(30.0, self.cabinet_temp - 0.03 * (dt_sim / 60.0))
            
        self.water_temp = 16.70 + np.random.normal(0, 0.01)

        # 13. Kümülatif Sayaçlar
        if self.pump_running:
            self.total_flow_m3 += (sensor_q * (dt_sim / 3600.0))
            self.total_energy_kwh += (p_elec * (dt_sim / 3600.0))
            self.runtime_seconds += dt_sim

        # 14. Gerçek Sistem Verimi
        if self.pump_running and p_elec > 0.2 and p_hyd > 0.05:
            system_eff = (p_hyd / p_elec) * 100.0 + np.random.normal(0, 0.08)
        else:
            system_eff = 0.0

        return {
            "clock": {
                "hour": sim_hour,
                "minute": sim_minute,
                "time_str": f"{sim_hour:02d}:{sim_minute:02d}",
                "phase_code": phase_code,
                "phase_name": ["GECE MODU", "SABAH PİK", "GÜNDÜZ", "AKŞAM PİK"][phase_code],
                "speed_multiplier": int(self.speed_multiplier),
                "city_demand_flow": float(self.city_demand_flow),
            },
            "kuyu": {
                "pressure": float(sensor_p),
                "flow": float(sensor_q),
                "well_water_level": float(self.well_level),
                "pump_depth": float(self.pump_depth),
                "v_l1": float(v_l1),
                "v_l2": float(v_l2),
                "v_l3": float(v_l3),
                "i_l1": float(i_l1),
                "i_l2": float(i_l2),
                "i_l3": float(i_l3),
                "frequency": float(freq),
                "power": float(p_elec),
                "motor_temp": float(self.motor_temp),
                "cabinet_temp": float(self.cabinet_temp),
                "outdoor_temp": float(self.outdoor_temp),
                "water_temp": float(self.water_temp),
                "status": 1 if self.pump_running else 0,
                "mode": self.mode,
                "pump_running": self.pump_running,
            },
            "terfi": {
                "tank_level": float(self.tank_level),
                "inflow_height": float(self.inflow_height),
                "tank_start_level": float(self.tank_start_level),
                "tank_stop_level": float(self.tank_stop_level),
                "city_demand_flow": float(self.city_demand_flow),
                "pumping_head": float(head_m),
                "hydraulic_eff": float(hydraulic_eff),
                "system_eff": float(system_eff),
                "power_per_m3": float(power_per_m3),
                "total_flow_m3": float(self.total_flow_m3),
                "total_energy_kwh": float(self.total_energy_kwh),
                "runtime_hours": float(self.runtime_seconds / 3600.0),
                "run_count": int(self.run_count),
                "cost_eur": 0.0,
            }
        }
