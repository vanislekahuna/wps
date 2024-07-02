""" Utils to help with s3
"""
from typing import Generator, Tuple
from contextlib import asynccontextmanager
from aiobotocore.client import AioBaseClient
from aiobotocore.session import get_session
from osgeo import gdal
from app import config


@asynccontextmanager
async def get_client() -> Generator[Tuple[AioBaseClient, str], None, None]:
    """ Return AioBaseClient client and bucket
    """
    server = config.get('OBJECT_STORE_SERVER')
    user_id = config.get('OBJECT_STORE_USER_ID')
    secret_key = config.get('OBJECT_STORE_SECRET')
    bucket = config.get('OBJECT_STORE_BUCKET')

    session = get_session()
    async with session.create_client('s3',
                                     endpoint_url=f'https://{server}',
                                     aws_secret_access_key=secret_key,
                                     aws_access_key_id=user_id) as client:
        try:
            yield client, bucket
        finally:
            del client


async def object_exists(client: AioBaseClient, bucket: str, target_path: str):
    """ Check if and object exists in the object store
    """
    # using list_objects, but could be using stat as well? don't know what's best.
    result = await client.list_objects_v2(Bucket=bucket,
                                          Prefix=target_path)
    contents = result.get('Contents', None)
    if contents:
        for content in contents:
            key = content.get('Key')
            if key == target_path:
                return True
    return False


async def object_exists_v2(target_path: str):
    """ Check if and object exists in the object store
    """
    async with get_client() as (client, bucket):
        return await object_exists(client, bucket, target_path)

async def read_into_memory(key: str):
    async with get_client() as (client, bucket):
        s3_source = await client.get_object(Bucket=bucket, Key=key)
        mem_path = f'/vsimem/{key}'
        s3_data = await s3_source['Body'].read()
        gdal.FileFromMemBuffer(mem_path, s3_data)
        data_source = gdal.Open(mem_path, gdal.GA_ReadOnly)
        gdal.Unlink(mem_path)
        dem_band = data_source.GetRasterBand(1)
        dem_data = dem_band.ReadAsArray()
        return dem_data