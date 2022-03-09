"""String representations of templates for in memory loading"""
import os

CSS_PATH = os.path.join(os.path.dirname(__file__), "style.css")

DAILY_TEMPLATE_HTML = """
<!DOCTYPE html>
<html lang="en">
<head>
    <title>HFI Daily</title>
</head>
<body>
            {% for date, planning_areas in daily_pdf_data_by_date.items() %}
            <h1>BC Wildfire Services - HFI Calculator</h1>
            <h2>Fire Centre ID: {{fire_centre_name}} - Date: {{date}}</h2>
            <table>
                <tr>
                    <th colspan="24">{{date}}</th>
                </tr>
                <tr>
                    <th>Planning Area/Station</th>
                    <th>Elev</th>
                    <th>Fuel Type</th>
                    <th>Grass Cure</th>
                    <th>Status</th>
                    <th>Temp</th>
                    <th>RH</th>
                    <th>Wind Dir</th>
                    <th>Wind Spd</th>
                    <th>Precip</th>
                    <th>FFMC</th>
                    <th>DMC</th>
                    <th>DC</th>
                    <th>ISI</th>
                    <th>BUI</th>
                    <th>FWI</th>
                    <th>DGR CL</th>
                    <th>ROS</th>
                    <th>HFI</th>
                    <th>60 min Fire Size</th>
                    <th>Fire Type</th>
                    <th>M/FIG</th>
                    <th>Fire Starts</th>
                    <th>Prep Level</th>
                </tr>
                <tr colspan="21">
                    {% for planning_area_data in planning_areas %}
                        <td colspan="21">{{planning_area_data['planning_area_name']}}</td>
                        <td>{{planning_area_data['highest_daily_intensity_group'] if planning_area_data['highest_daily_intensity_group'] is not none}}</td>
                        <td rowspan="{{planning_area_data['dailies']|length + 1}}">{{planning_area_data['fire_starts'] if planning_area_data['fire_starts'] is not none}}</td>
                        <td rowspan="{{planning_area_data['dailies']|length + 1}}">{{planning_area_data['mean_prep_level'] if planning_area_data['mean_prep_level'] is not none}}</td>
                            {% if planning_area_data['dailies']|length < 1 %}
                                <tr />
                            {% endif %}
                            {% for d in planning_area_data['dailies']  %}
                                <tr>
                                    <td>{{d['station_props']['name'] if d['station_props']['name'] is not none}}</td>
                                    <td>{{d['station_props']['elevation'] if d['station_props']['elevation'] is not none}}</td>
                                    <td>{{d['station_props']['fuel_type']['abbrev'] if d['station_props']['fuel_type']['abbrev'] is not none}}</td>  
                                    <td>{{d['grass_cure_percentage'] if d['grass_cure_percentage'] is not none}}</td>
                                    <td>{{d['status'] if d['status'] is not none}}</td>
                                    <td>{{d['temperature'] if d['temperature'] is not none}}</td>   
                                    <td>{{d['relative_humidity']| round(1) if d['relative_humidity'] is not none}}</td>
                                    <td>{{d['wind_direction'] if d['wind_direction'] is not none}}</td> 
                                    <td>{{d['wind_speed']| round(1) if d['wind_speed'] is not none}}</td>   
                                    <td>{{d['precipitation']| round(1) if d['precipitation'] is not none}}</td> 
                                    <td>{{d['ffmc']| round(1) if d['ffmc'] is not none}}</td> 
                                    <td>{{d['dmc']| round(1) if d['dmc'] is not none}}</td> 
                                    <td>{{d['dc']| round(1) if d['dc'] is not none}}</td> 
                                    <td>{{d['isi']| round(1) if d['isi'] is not none}}</td> 
                                    <td>{{d['bui']| round(1) if d['bui'] is not none}}</td> 
                                    <td>{{d['fwi']| round(1) if d['fwi'] is not none}}</td> 
                                    <td>{{d['danger_class'] if d['danger_class'] is not none}}</td> 
                                    <td>{{d['rate_of_spread'] | round(1) if d['rate_of_spread'] is not none}}</td> 
                                    <td>{{d['hfi']| round(1) if d['hfi'] is not none}}</td> 
                                    <td>{{d['sixty_minute_fire_size']| round(1) if d['sixty_minute_fire_size'] is not none}}</td> 
                                    <td>{{d['fire_type'] if d['fire_type'] is not none}}</td> 
                                    <td>{{d['intensity_group'] if d['intensity_group'] is not none}}</td>
                                </tr>
                            {% endfor %}
                    {% endfor %}
                </tr>
            </table>
        <p></p>
        {% endfor %}
    </body>
</html>
"""


def str_daily_template(template_name: str):    # pylint: disable=unused-argument
    """ Returns the only (currently) template, arg above will be used for switching """
    return DAILY_TEMPLATE_HTML
