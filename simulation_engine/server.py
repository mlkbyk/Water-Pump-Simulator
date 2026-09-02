"""
Katman 1: Modbus TCP Server (Dinamik Canlı İstasyon Ekleme & Predixi Desteği)
Slave ID 1..N: Dinamik İstasyonlar
"""

import asyncio
import sys
import time

# Windows konsolunda UTF-8 desteğini etkinleştir
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    except Exception:
        pass

from pymodbus.server import ModbusTcpServer
from pymodbus.simulator import SimDevice, SimData, DataType

from config import (
    MODBUS_HOST,
    MODBUS_PORT,
    SIMULATION_DT,
    LOG_INTERVAL_SEC,
    HOLDING_REGISTERS,
    HOLDING_REGISTER_COUNT,
)
from stations_config import load_stations
from physics import MetiriusWellProSimulator

# ANSI Renk Kodları
RESET = "\033[0m"
BOLD = "\033[1m"
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
RED = "\033[91m"
BLUE = "\033[94m"
MAGENTA = "\033[95m"


def build_single_sim_device(st: dict) -> SimDevice:
    """Tek bir istasyon için SimDevice nesnesi üretir."""
    slave_id = st["slave_id"]
    params = st.get("params", {})
    
    initial_hr = [0] * HOLDING_REGISTER_COUNT
    for addr, item in HOLDING_REGISTERS.items():
        if addr < HOLDING_REGISTER_COUNT:
            initial_hr[addr] = item.get("default", 0)

    # İstasyona özel başlangıç setleri
    initial_hr[0] = int(params.get("default_pressure", 3.66) * 100)
    initial_hr[1] = int(params.get("default_flow", 24.83) * 100)
    initial_hr[2] = 1  # Pompa Açık
    initial_hr[3] = 1  # Otomatik Mod
    initial_hr[4] = int(params.get("target_efficiency", 75.43) * 100)
    initial_hr[5] = int(params.get("tank_start_level", 0.60) * 100)
    initial_hr[6] = int(params.get("tank_stop_level", 3.10) * 100)
    initial_hr[7] = 60 # 60x Hız
    initial_hr[13] = int(params.get("pump_depth", 112.30) * 100)

    return SimDevice(
        slave_id,
        simdata=(
            [SimData(0, values=[False] * 16, datatype=DataType.BITS)],
            [SimData(0, values=[False] * 16, datatype=DataType.BITS)],
            [SimData(0, values=initial_hr, datatype=DataType.REGISTERS)],
            [SimData(0, values=initial_hr, datatype=DataType.REGISTERS)]
        )
    )


def build_sim_devices(stations_list: list) -> list[SimDevice]:
    """Tüm istasyonlar için SimDevice listesi döner."""
    return [build_single_sim_device(st) for st in stations_list]


async def run_multi_station_loop(server: ModbusTcpServer, simulators: dict):
    """Tüm kuyu ve terfi istasyonlarını eşzamanlı simüle eden döngü (Dinamik İstasyon Algılamalı)."""
    last_log_time = 0.0
    last_check_stations_time = 0.0

    print(f"\n{BOLD}{GREEN}========================================================================{RESET}")
    print(f"{BOLD}{GREEN}   🌊 PREDIXI & METIRIUS DİNAMİK İSTASYON MODBUS TCP SUNUCUSU          {RESET}")
    print(f"{BOLD}{GREEN}========================================================================{RESET}")
    print(f"{CYAN}Modbus Adresi  : {MODBUS_HOST}:{MODBUS_PORT}{RESET}")
    print(f"{CYAN}Holding Regs   : 40001..40044 (Sıralı x100 / x10 Ölçekli Tamsayılar){RESET}")
    print(f"{CYAN}Predixi Export : predixi_exports/ klasöründen CSV yükleyebilirsiniz{RESET}")
    print(f"{BOLD}{GREEN}------------------------------------------------------------------------{RESET}\n")

    current_stations = load_stations()

    while True:
        try:
            current_time = time.time()
            log_now = (current_time - last_log_time >= LOG_INTERVAL_SEC)
            if log_now:
                last_log_time = current_time

            # Her 2 saniyede bir yeni istasyon eklenip eklenmediğini kontrol et
            if current_time - last_check_stations_time >= 2.0:
                last_check_stations_time = current_time
                new_list = load_stations()
                for st in new_list:
                    sid = st["slave_id"]
                    if sid not in simulators:
                        # Yeni istasyon dinamik olarak sisteme ekleniyor!
                        new_dev = build_single_sim_device(st)
                        try:
                            if hasattr(server.context, "devices") and isinstance(server.context.devices, dict):
                                server.context.devices[sid] = new_dev
                            elif hasattr(server.context, "devices") and isinstance(server.context.devices, list):
                                server.context.devices.append(new_dev)
                        except Exception as e:
                            print(f"{YELLOW}[Uyarı] Yeni slave context'e eklenirken: {e}{RESET}")

                        sim = MetiriusWellProSimulator(
                            dt=SIMULATION_DT,
                            pump_depth=st.get("params", {}).get("pump_depth", 80.0),
                            well_level=st.get("params", {}).get("static_level", 60.0),
                            default_pressure=st.get("params", {}).get("default_pressure", 3.80),
                            default_flow=st.get("params", {}).get("default_flow", 25.0),
                            rated_power=st.get("params", {}).get("rated_power", 15.0)
                        )
                        simulators[sid] = sim
                        print(f"{BOLD}{GREEN}✨ [YENİ İSTASYON EKLENDİ] Slave ID: {sid} - {st['name']} (DID: {st['did']}){RESET}")
                current_stations = new_list

            for st in current_stations:
                slave_id = st["slave_id"]
                if slave_id not in simulators:
                    continue

                sim = simulators[slave_id]
                params = st.get("params", {})

                # 1. Kontrol ve Ayar Register'larını Oku (Adres: 0..7)
                try:
                    hr_ctrl = await server.context.async_getValues(slave_id, 3, 0, 8)
                except Exception:
                    continue
                
                if isinstance(hr_ctrl, list) and len(hr_ctrl) >= 8:
                    set_pressure = hr_ctrl[0] / 100.0 if hr_ctrl[0] > 0 else params.get("default_pressure", 3.66)
                    set_flow = hr_ctrl[1] / 100.0 if hr_ctrl[1] > 0 else params.get("default_flow", 24.83)
                    pump_cmd = hr_ctrl[2]
                    mode_cmd = hr_ctrl[3]
                    set_efficiency = hr_ctrl[4] / 100.0 if hr_ctrl[4] > 0 else 75.43
                    tank_start_lvl = hr_ctrl[5] / 100.0 if hr_ctrl[5] > 0 else params.get("tank_start_level", 0.60)
                    tank_stop_lvl = hr_ctrl[6] / 100.0 if hr_ctrl[6] > 0 else params.get("tank_stop_level", 3.10)
                    speed_mult = float(hr_ctrl[7]) if hr_ctrl[7] > 0 else 60.0
                else:
                    set_pressure = params.get("default_pressure", 3.66)
                    set_flow = params.get("default_flow", 24.83)
                    pump_cmd, mode_cmd = 1, 1
                    set_efficiency, tank_start_lvl, tank_stop_lvl, speed_mult = 75.43, 0.60, 3.10, 60.0

                # 2. Fiziksel Simülasyonu Yürüt
                state = sim.step(
                    set_pressure=set_pressure,
                    set_flow=set_flow,
                    pump_cmd=pump_cmd,
                    mode=mode_cmd,
                    set_efficiency=set_efficiency,
                    tank_start_level=tank_start_lvl,
                    tank_stop_level=tank_stop_lvl,
                    speed_multiplier=speed_mult
                )

                clock = state["clock"]
                k = state["kuyu"]
                t = state["terfi"]

                # 3. Holding Registers Tablosunu Güncelle (Adres 8..43)
                total_flow_int = int(t["total_flow_m3"])
                total_energy_int = int(t["total_energy_kwh"])

                # Saat güncelleme (Adres 8..9)
                await server.context.async_setValues(slave_id, 3, 8, [clock["hour"], clock["minute"]])

                # Kuyu telemetri (Adres 10..26)
                kuyu_regs = [
                    max(0, min(65535, int(round(k["pressure"] * 100)))),
                    max(0, min(65535, int(round(k["flow"] * 100)))),
                    max(0, min(65535, int(round(k["well_water_level"] * 100)))),
                    max(0, min(65535, int(round(k["pump_depth"] * 100)))),
                    max(0, min(65535, int(round(k["v_l1"] * 10)))),
                    max(0, min(65535, int(round(k["v_l2"] * 10)))),
                    max(0, min(65535, int(round(k["v_l3"] * 10)))),
                    max(0, min(65535, int(round(k["i_l1"] * 100)))),
                    max(0, min(65535, int(round(k["i_l2"] * 100)))),
                    max(0, min(65535, int(round(k["i_l3"] * 100)))),
                    max(0, min(65535, int(round(k["frequency"] * 100)))),
                    max(0, min(65535, int(round(k["power"] * 100)))),
                    max(0, min(65535, int(round(k["motor_temp"] * 100)))),
                    max(0, min(65535, int(round(k["cabinet_temp"] * 100)))),
                    max(0, min(65535, int(round(k["outdoor_temp"] * 100)))),
                    max(0, min(65535, int(round(k["water_temp"] * 100)))),
                    int(k["status"]),
                ]
                await server.context.async_setValues(slave_id, 3, 10, kuyu_regs)

                # Terfi telemetri (Adres 30..43)
                terfi_regs = [
                    max(0, min(65535, int(round(t["tank_level"] * 100)))),
                    max(0, min(65535, int(round(t["city_demand_flow"] * 100)))),
                    max(0, min(65535, int(round(t["pumping_head"] * 100)))),
                    max(0, min(65535, int(round(t["hydraulic_eff"] * 100)))),
                    max(0, min(65535, int(round(t["system_eff"] * 100)))),
                    max(0, min(65535, int(round(t["power_per_m3"] * 1000)))),
                    (total_flow_int >> 16) & 0xFFFF,
                    total_flow_int & 0xFFFF,
                    (total_energy_int >> 16) & 0xFFFF,
                    total_energy_int & 0xFFFF,
                    max(0, min(65535, int(t["runtime_hours"]))),
                    max(0, min(65535, int(t["run_count"]))),
                    int(clock["phase_code"]),
                    max(0, min(65535, int(round(t["inflow_height"] * 100)))),
                ]
                await server.context.async_setValues(slave_id, 3, 30, terfi_regs)

                if log_now and slave_id == 1:
                    pump_badge = f"{GREEN}ON{RESET}" if k["pump_running"] else f"{RED}OFF{RESET}"
                    print(
                        f"[{clock['time_str']} | {clock['phase_name']:^9}] "
                        f"[K16-ID:1] P:{k['pressure']:.2f}B Q:{k['flow']:.1f}m³ Depo:{t['tank_level']:.2f}mss ({pump_badge}) | "
                        f"Toplam İstasyon: {len(current_stations)}"
                    )

        except asyncio.CancelledError:
            break
        except Exception as err:
            print(f"{RED}[Simülasyon Hatası] {err}{RESET}")

        await asyncio.sleep(SIMULATION_DT)


async def main():
    """Çoklu İstasyon Modbus TCP Server'ı başlatır."""
    stations_list = load_stations()
    devices = build_sim_devices(stations_list)
    server = ModbusTcpServer(context=devices, address=(MODBUS_HOST, MODBUS_PORT))

    simulators = {}
    for st in stations_list:
        sim = MetiriusWellProSimulator(
            dt=SIMULATION_DT,
            pump_depth=st.get("params", {}).get("pump_depth", 112.3),
            well_level=st.get("params", {}).get("static_level", 88.5),
            default_pressure=st.get("params", {}).get("default_pressure", 3.66),
            default_flow=st.get("params", {}).get("default_flow", 24.83),
            rated_power=st.get("params", {}).get("rated_power", 15.11)
        )
        simulators[st["slave_id"]] = sim

    server_task = asyncio.create_task(server.serve_forever())
    sim_task = asyncio.create_task(run_multi_station_loop(server, simulators))

    try:
        await asyncio.gather(server_task, sim_task)
    except asyncio.CancelledError:
        pass
    finally:
        print(f"\n{YELLOW}Modbus TCP Sunucusu kapatılıyor...{RESET}")
        sim_task.cancel()
        server_task.cancel()
        await asyncio.gather(sim_task, server_task, return_exceptions=True)
        print(f"{GREEN}Sunucu güvenli bir şekilde durduruldu.{RESET}")


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print(f"\n{YELLOW}Kullanıcı tarafından durduruldu (Ctrl+C).{RESET}")
