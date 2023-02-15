""" Class models that reflect resources and map to database tables
"""
# Keep all the models in one place for alembic to discover:
from app.db.database import Base
from app.db.models.forecasts import NoonForecast
from app.db.models.observations import HourlyActual
from app.db.models.api_access_audits import APIAccessAudit
from app.db.models.weather_models import (ProcessedModelRunUrl, PredictionModel, PredictionModelRunTimestamp,
                                          PredictionModelGridSubset, ModelRunGridSubsetPrediction,
                                          WeatherStationModelPrediction)
from app.db.models.hfi_calc import (FireCentre, FuelType, PlanningArea, PlanningWeatherStation)
from app.db.models.auto_spatial_advisory import (Shape, ShapeType, HfiClassificationThreshold,
                                                 ClassifiedHfi, RunTypeEnum, ShapeTypeEnum, FuelType, HighHfiArea, RunParameters)
from app.db.models.morecast_v2 import MorecastForecast
