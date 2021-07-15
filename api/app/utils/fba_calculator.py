""" Fire Behaviour Analysis Calculator Tool
"""
import math
from datetime import date
import logging
from typing import Tuple
from app.utils.hfi_calculator import FUEL_TYPE_LOOKUP
from app.utils import cffdrs
from app.utils.time import get_hour_20_from_date, get_julian_date

logger = logging.getLogger(__name__)


class CannotCalculateFireTypeError(Exception):
    """ Exception thrown when fire type cannot be established """


class FBACalculatorWeatherStation():  # pylint: disable=too-many-instance-attributes
    """ Inputs for Fire Behaviour Advisory Calculator """

    def __init__(self,  # pylint: disable=too-many-arguments
                 elevation: int, fuel_type: str,
                 time_of_interest: date, percentage_conifer: float,
                 percentage_dead_balsam_fir: float, grass_cure: float,
                 crown_base_height: int, lat: float, long: float, bui: float, ffmc: float, isi: float,
                 wind_speed: float, temperature: float, relative_humidity: float, precipitation: float,
                 status: str):
        self.elevation = elevation
        self.fuel_type = fuel_type
        self.time_of_interest = time_of_interest
        self.percentage_conifer = percentage_conifer
        self.percentage_dead_balsam_fir = percentage_dead_balsam_fir
        self.grass_cure = grass_cure
        self.crown_base_height = crown_base_height
        self.lat = lat
        self.long = long
        self.bui = bui
        self.ffmc = ffmc
        self.isi = isi
        self.wind_speed = wind_speed
        self.temperature = temperature
        self.relative_humidity = relative_humidity
        self.precipitation = precipitation
        self.status = status

    def __str__(self) -> str:
        return 'lat {}, long {}, elevation {}, fuel_type {}, time_of_interest {}, percentage_conifer {},\
            percentage_dead_balsam_fir {}, grass_cure {}, crown_base_height {}, bui {}, ffmc {}, isi {},\
            wind_speed {}, temperature {}, relative_humidity {}, precipitation {}, status {}'\
                .format(self.lat, self.long,
                        self.elevation, self.fuel_type, self.time_of_interest, self.percentage_conifer,
                        self.percentage_dead_balsam_fir, self.grass_cure, self.crown_base_height,
                        self.bui, self.ffmc, self.isi, self.wind_speed,
                        self.temperature, self.relative_humidity, self.precipitation, self.status)


class FireBehaviourAdvisory():  # pylint: disable=too-many-instance-attributes
    """ Class containing the results of the fire behaviour advisory calculation. """

    def __init__(self,  # pylint: disable=too-many-arguments
                 hfi: float, ros: float, fire_type: str, cfb: float, flame_length: float,
                 sixty_minute_fire_size: float, thirty_minute_fire_size: float,
                 critical_hours_hfi_4000: Tuple[float, float],
                 critical_hours_hfi_10000: Tuple[float, float]):
        self.hfi = hfi
        self.ros = ros
        self.fire_type = fire_type  # TODO: make this an enum
        self.cfb = cfb
        self.flame_length = flame_length
        self.sixty_minute_fire_size = sixty_minute_fire_size
        self.thirty_minute_fire_size = thirty_minute_fire_size
        self.critical_hours_hfi_4000 = critical_hours_hfi_4000
        self.critical_hours_hfi_10000 = critical_hours_hfi_10000


def calculate_fire_behavour_advisory(station: FBACalculatorWeatherStation) -> FireBehaviourAdvisory:
    """ Transform from the raw daily json object returned by wf1, to our fba_calc.StationResponse object.
    """
    # time of interest will be the same for all stations
    time_of_interest = get_hour_20_from_date(station.time_of_interest)

    fmc = cffdrs.foliar_moisture_content(station.lat, station.long, station.elevation,
                                         get_julian_date(time_of_interest))
    sfc = cffdrs.surface_fuel_consumption(station.fuel_type, station.bui,
                                          station.ffmc, station.percentage_conifer)
    lb_ratio = cffdrs.length_to_breadth_ratio(station.fuel_type, station.wind_speed)
    ros = cffdrs.rate_of_spread(station.fuel_type, isi=station.isi, bui=station.bui, fmc=fmc, sfc=sfc,
                                pc=station.percentage_conifer,
                                cc=station.grass_cure,
                                pdf=station.percentage_dead_balsam_fir,
                                cbh=station.crown_base_height
                                )
    if station.fuel_type in ('D1', 'O1A', 'O1B', 'S1', 'S2', 'S3'):
        # These fuel types don't have a crown fraction burnt. But CFB is needed for other calculations,
        # so we go with 0.
        cfb = 0
    elif station.crown_base_height is None:
        # We can't calculate cfb without a crown base height!
        cfb = None
    else:
        cfb = cffdrs.crown_fraction_burned(station.fuel_type, fmc=fmc, sfc=sfc,
                                           ros=ros, cbh=station.crown_base_height)

    cfl = FUEL_TYPE_LOOKUP[station.fuel_type].get('CFL', None)

    hfi = cffdrs.head_fire_intensity(fuel_type=station.fuel_type,
                                     percentage_conifer=station.percentage_conifer,
                                     percentage_dead_balsam_fir=station.percentage_dead_balsam_fir,
                                     bui=station.bui, ffmc=station.ffmc, ros=ros, cfb=cfb, cfl=cfl, sfc=sfc)
    # COMMENTED OUT FOR NOW BECAUSE IT'S NOT FULLY IMPLEMENTED
    # critical_hours_4000 = cffdrs.get_critical_hours(4000, station.fuel_type, station.percentage_conifer,
    #                                                 station.percentage_dead_balsam_fir, station.bui,
    #                                                 station.grass_cure,
    #                                                 station.crown_base_height, station.ffmc, fmc, cfb, cfl,
    #                                                 station.temperature, station.relative_humidity,
    #                                                 station.wind_speed,
    #                                                 station.precipitation)
    # critical_hours_10000 = cffdrs.get_critical_hours(10000, station.fuel_type, station.percentage_conifer,
    #                                                  station.percentage_dead_balsam_fir, station.bui,
    #                                                  station.grass_cure,
    #                                                  station.crown_base_height, station.ffmc, fmc, cfb, cfl,
    #                                                  station.temperature, station.relative_humidity,
    #                                                  station.wind_speed,
    #                                                  station.precipitation)

    fire_type = get_fire_type(fuel_type=station.fuel_type, crown_fraction_burned=cfb)
    flame_length = get_approx_flame_length(hfi)
    sixty_minute_fire_size = get_60_minutes_fire_size(lb_ratio, ros)
    thirty_minute_fire_size = get_30_minutes_fire_size(lb_ratio, ros)

    return FireBehaviourAdvisory(
        hfi=hfi, ros=ros, fire_type=fire_type, cfb=cfb, flame_length=flame_length,
        sixty_minute_fire_size=sixty_minute_fire_size,
        thirty_minute_fire_size=thirty_minute_fire_size,
        # setting critical hours to None for now because it's not being calculated yet
        critical_hours_hfi_4000=None,
        critical_hours_hfi_10000=None)


def get_30_minutes_fire_size(length_breadth_ratio: float, rate_of_spread: float):
    """ Returns estimated fire size in hectares after 30 minutes, based on LB ratio and ROS.
    Formula derived from sample HFI workbook (see HFI_spreadsheet.md).

    30 min fire size = (pi * spread^2) / (40,000 * LB ratio)
    where spread = 30 * ROS
    """
    return (math.pi * math.pow(30 * rate_of_spread, 2)) / (40000 * length_breadth_ratio)


def get_60_minutes_fire_size(length_breadth_ratio: float, rate_of_spread: float):
    """ Returns estimated fire size in hectares after 60 minutes, based on LB ratio and ROS.
    Formula derived from sample HFI workbook (see HFI_spreadsheet.md)

    60 min fire size = (pi * spread^2) / (40,000 * LB ratio)
    where spread = 60 * ROS
    """
    return (math.pi * math.pow(60 * rate_of_spread, 2)) / (40000 * length_breadth_ratio)


def get_fire_type(fuel_type: str, crown_fraction_burned: float):
    """ Returns Fire Type (as str) based on percentage Crown Fraction Burned (CFB).
    These definitions come from the Red Book (p.69).
    Abbreviations for fire types have been taken from the red book (p.9).

    CROWN FRACTION BURNED           TYPE OF FIRE                ABBREV.
    < 10%                           Surface fire                S
    10-89%                          Intermittent crown fire     IC
    > 90%                           Continuous crown fire       CC

    # TODO: make this return an enum
    """
    if fuel_type == 'D1':
        # From red book "crown fires are not expected in deciduous fuel types but high intensity surface fires
        # can occur."
        return 'S'
    # crown fraction burnt is a floating point number from 0 to 1 inclusive.
    if crown_fraction_burned < 0.1:
        return 'S'
    if crown_fraction_burned < 0.9:
        return 'IC'
    if crown_fraction_burned >= 0.9:
        return 'CC'
    logger.error('Cannot calculate fire type. Invalid Crown Fraction Burned percentage received.')
    raise CannotCalculateFireTypeError


def get_approx_flame_length(head_fire_intensity: float):
    """ Returns an approximation of flame length (in meters).
    Formula used is a field-use approximation of
    L = (I / 300)^(1/2), where L is flame length in m and I is Fire Intensity in kW/m
    """
    return math.sqrt(head_fire_intensity / 300)

# def get_critical_hours_start(critical_ffmc: float, solar_noon_ffmc: float, temperature: float,
#                              relative_humidity: float, wind_speed: float, precip: float):
#     """ Returns the hour of day (on 24H clock) at which the hourly FFMC crosses the
#     threshold of critical_ffmc.
#     Returns None if the hourly FFMC never reaches critical_ffmc.
#     """
#     if solar_noon_ffmc >= critical_ffmc:
#         logger.info('Solar noon FFMC >= critical FFMC')
#         # go back in time in increments of 0.5 hours
#         clock_time = 13-0.5  # start from solar noon - 0.5 hours
#         while get_hourly_ffmc_on_diurnal_curve(solar_noon_ffmc, clock_time, temperature,
#                                                relative_humidity, wind_speed, precip) >= critical_ffmc:
#             clock_time -= 0.5
#             if clock_time == -0.5:
#                 break
#         # add back the half hour that caused FFMC to drop below critical_ffmc (or that
#           pushed time below 0.0)
#         clock_time += 0.5
#         logger.info('%s', clock_time)
#         return clock_time

#     logger.info('Solar noon FFMC %s < critical FFMC %s', solar_noon_ffmc, critical_ffmc)
#     # go forward in time in increments of 0.5 hours
#     clock_time = 13 + 0.5  # start from solar noon + 0.5 hours
#     while get_hourly_ffmc_on_diurnal_curve(solar_noon_ffmc, clock_time, temperature,
#                                            relative_humidity, wind_speed, precip) < critical_ffmc:
#         logger.info('Clock time %s has HFFMC %s', clock_time, get_hourly_ffmc_on_diurnal_curve(
#             solar_noon_ffmc, clock_time, temperature, relative_humidity, wind_speed, precip))
#         clock_time += 0.5
#         if clock_time == 24.0:
#             return None
#     return clock_time


# def get_critical_hours_end(critical_ffmc: float, solar_noon_ffmc: float, critical_hour_start: float,
#                            temperature: float, relative_humidity: float, wind_speed: float, precip: float):
#     """ Returns the hour of day (on 24H clock) at which the hourly FFMC drops below
#     the threshold of critical_ffmc.
#     Should only be called if critical_hour_start is not None.
#     If diurnally-adjusted FFMC never drops below critical_ffmc in the day, will return 23.5 (11:30 pm).
#     """
#     assert critical_hour_start is not None
#     clock_time = critical_hour_start + 0.5    # increase time in increments of 0.5 hours
#     max_hourly_ffmc = 0.0
#     while get_hourly_ffmc_on_diurnal_curve(solar_noon_ffmc, clock_time, temperature,
#                                            relative_humidity, wind_speed, precip) >= critical_ffmc:
#         if get_hourly_ffmc_on_diurnal_curve(solar_noon_ffmc, clock_time, temperature,
#                                             relative_humidity, wind_speed, precip) > max_hourly_ffmc:
#             max_hourly_ffmc = get_hourly_ffmc_on_diurnal_curve(
#                 solar_noon_ffmc, clock_time, temperature, relative_humidity, wind_speed, precip)
#         clock_time += 0.5
#         if clock_time == 24.0:
#             break
#     # subtract the half hour that caused FFMC to drop below critical_ffmc (or that
#       pushed time to 24.0, which
#     # corresponds to 12 am of the next day)
#     clock_time -= 0.5
#     logger.info('max hourly FFMC %s', max_hourly_ffmc)
#     return clock_time


# def get_critical_hours(  # pylint: disable=too-many-arguments
    #     target_hfi: int, fuel_type: str, percentage_conifer: float,
    #     percentage_dead_balsam_fir: float, bui: float,
    #     grass_cure: float, crown_base_height: float,
    #     solar_noon_ffmc: float, fmc: float, cfb: float, cfl: float,
    #     temperature: float, relative_humidity: float, wind_speed: float,
    #     precipitation: float):
    # """ Determines the range of critical hours on a 24H clock.
    # Critical Hours describes the time range for the given day during which HFI will meet or exceed
    # hfi_target value. Critical hours are calculated by determining diurnally-adjusted FFMC values
    # that cause HFI >= target_hfi.
    # """
    # critical_ffmc, resulting_hfi=get_ffmc_for_target_hfi(
    #     fuel_type, percentage_conifer, percentage_dead_balsam_fir, bui, wind_speed,
    #     grass_cure, crown_base_height, solar_noon_ffmc, fmc, cfb, cfl, target_hfi)
    # logger.info('Critical FFMC %s, resulting HFI %s; target HFI %s', critical_ffmc,
    #   resulting_hfi, target_hfi)
    # # Scenario 1: it's not possible for the HFI to reach target_hfi, in which case there will
    # # be no critical hours.
    # if critical_ffmc >= 100.9 and resulting_hfi < target_hfi:
    #     logger.info('No critical hours for HFI %s. Critical FFMC %s has HFI %s',
    #                 target_hfi, critical_ffmc, resulting_hfi)
    #     return None
    # # Scenario 2: the HFI is always >= target_hfi, even when FFMC = 0. In this case, all hours
    # # of the day will be critical hours.
    # if critical_ffmc == 0.0 and resulting_hfi >= target_hfi:
    #     logger.info('All hours critical for HFI %s. FFMC %s has HFI %s',
    #                 target_hfi, critical_ffmc, resulting_hfi)
    #     return (0.0, 23.5)
    # # Scenario 3: there is a critical_ffmc between (0, 101) that corresponds to
    # # resulting_hfi >= target_hfi. Now have to determine what hours of the day (if any)
    # # will see hourly FFMC (adjusted according to diurnal curve) >= critical_ffmc.
    # critical_hour_start=get_critical_hours_start(
    #     critical_ffmc, solar_noon_ffmc, temperature, relative_humidity, wind_speed, precipitation)
    # logger.info('Got critical_hour_start %s', critical_hour_start)
    # if critical_hour_start is None:
    #     return None
    # critical_hour_end=get_critical_hours_end(
    #     critical_ffmc, solar_noon_ffmc, critical_hour_start, temperature,
    #     relative_humidity, wind_speed, precipitation)

    # logger.info('Critical hours for target HFI %s are (%s, %s)',
    #             target_hfi, critical_hour_start, critical_hour_end)
    # return (critical_hour_start, critical_hour_end)
