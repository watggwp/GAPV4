import Background from "./assets/img/ดอย.jpg"
import pumpIcon from './assets/icon/sensors/ControlPump.svg';
import SensorStationIcon from './assets/icon/sensors/weather_station.svg';
import SensorGreenhouse from "./assets/icon/sensors/sensorGH.svg"
import SensorGreenhouseBg from "./assets/icon/sensors/sensor_greenhouse_bg.svg"
import Pump from "./assets/icon/pump/pump_icon.svg"

import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ControlPointRoundedIcon from '@mui/icons-material/ControlPointRounded';
import ReplyAllRoundedIcon from '@mui/icons-material/ReplyAllRounded';

const env = {
    Background,
    path_icon : {
        sensor_station : SensorStationIcon,
        sensor_greenhouse : SensorGreenhouse,
        sensor_pump : pumpIcon,
        sensor_greenhouse_bg : SensorGreenhouseBg,
        pump : Pump,
    },
    icon : {
        history : HistoryRoundedIcon,
        close : CloseRoundedIcon,
        plus : ControlPointRoundedIcon,
        replyAll : ReplyAllRoundedIcon
    }
}

export default env