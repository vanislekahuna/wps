import pytest
from app.weather_models.rdps_filename_marshaller import parse_rdps_filename


def test_parse_rdps_filename_ok():
    (start_date, run_hour, forecast_hour) = parse_rdps_filename("CMC_reg_APCP_SFC_0_ps10km_2024062412_P001.grib2")
    assert start_date == "20240624"
    assert run_hour == "12"
    assert forecast_hour == "001"


@pytest.mark.parametrize(
    "filename",
    [
        # missing CMC
        ("reg_APCP_SFC_0_ps10km_2024062412_P001.grib2"),
        # missing reg
        ("CMC_APCP_SFC_0_ps10km_2024062412_P001.grib2"),
        # missing accumulated precip
        ("CMC_reg_SFC_0_ps10km_2024062412_P001.grib2"),
        # missing level type
        ("CMC_reg_APCP_0_ps10km_2024062412_P001.grib2"),
        # missing level
        ("CMC_reg_APCP_SFC_ps10km_2024062412_P001.grib2"),
        # missing ps10km
        ("CMC_reg_APCP_SFC_0_2024062412_P001.grib2"),
        # missing grib2 extension
        ("CMC_reg_APCP_SFC_0_ps10km_2024062412_P001"),
    ],
)
def test_parse_rdps_filename_failure(filename):
    with pytest.raises(Exception) as _:
        parse_rdps_filename(filename)
