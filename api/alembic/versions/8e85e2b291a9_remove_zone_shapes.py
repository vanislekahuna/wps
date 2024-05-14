"""remove zone shapes

Revision ID: 8e85e2b291a9
Revises: f2e027a47a3f
Create Date: 2023-11-03 14:10:44.782737

"""
from alembic import op
import sqlalchemy as sa
import geoalchemy2
from sqlalchemy.orm.session import Session

# revision identifiers, used by Alembic.
revision = '8e85e2b291a9'
down_revision = 'd5115b761e39'
branch_labels = None
depends_on = None

shape_type_table = sa.Table('advisory_shape_types', sa.MetaData(),
                            sa.Column('id', sa.Integer),
                            sa.Column('name', sa.String))

shape_table = sa.Table('advisory_shapes', sa.MetaData(),
                       sa.Column('id', sa.Integer),
                       sa.Column('source_identifier', sa.String),
                       sa.Column('shape_type', sa.Integer),
                       sa.Column('geom', geoalchemy2.Geometry))

high_hfi_table = sa.Table('high_hfi_area', sa.MetaData(),
                       sa.Column('id', sa.Integer),
                       sa.Column('advisory_shape_id', sa.Integer),
                       sa.Column('threshold', sa.Integer),
                       sa.Column('run_parameters', sa.Integer),
                       sa.Column('area', sa.Float))

advisory_elevation_stats = sa.Table('advisory_elevation_stats', sa.MetaData(),
                            sa.Column('id', sa.Integer),
                            sa.Column('advisory_shape_id', sa.Integer),
                            sa.Column('threshold', sa.Integer),
                            sa.Column('run_parameters', sa.Integer),
                            sa.Column('minimum', sa.Float),
                            sa.Column('quartile_25', sa.Float),
                            sa.Column('median', sa.Float),
                            sa.Column('quartile_75', sa.Float),
                            sa.Column('maximum', sa.Float))

def upgrade():
    # ### commands auto generated by Alembic ###
    session = Session(bind=op.get_bind())

    statement = shape_type_table.select().where(shape_type_table.c.name == 'fire_zone')
    result = session.execute(statement).fetchone()
    fire_zone_id = result.id

    zone_id_statement = shape_table.select().where(shape_table.c.shape_type == fire_zone_id)
    zone_shape_result = session.execute(zone_id_statement).all()
    zone_shape_ids = [row.id for row in zone_shape_result]

    session.execute(high_hfi_table.delete().where(high_hfi_table.c.advisory_shape_id.in_(zone_shape_ids)))
    session.execute(advisory_elevation_stats.delete().where(advisory_elevation_stats.c.advisory_shape_id.in_(zone_shape_ids)))
    session.execute(shape_table.delete().where(shape_table.c.shape_type == fire_zone_id))
    # ### end Alembic commands ###


def downgrade():
    # ### commands auto generated by Alembic ###
    pass # reimport fire zones in seperate migration if needed
    # ### end Alembic commands ###
