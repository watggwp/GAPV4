import Background from "./assets/img/ดอย.jpg"
import pumpIcon from './assets/icon/sensors/ControlPump.svg';
import SensorStationIcon from './assets/icon/sensors/weather_station.svg';
import SensorGreenhouse from "./assets/icon/sensors/sensorGH.svg"
import SensorGreenhouseBg from "./assets/icon/sensors/sensor_greenhouse_bg.svg"
import Pump from "./assets/icon/pump/pump_icon.svg"
import SensorSmall from "./assets/icon/sensors/sensor-small.svg"

// /doctor-svgrepo-com.svg
import UserNotfound from "./assets/icon/doctor-svgrepo-com.svg"

import HistoryRoundedIcon from '@mui/icons-material/HistoryRounded';
import CloseRoundedIcon from '@mui/icons-material/CloseRounded';
import ControlPointRoundedIcon from '@mui/icons-material/ControlPointRounded';
import ReplyAllRoundedIcon from '@mui/icons-material/ReplyAllRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';

const env = {
    Background,
    path_icon : {
        sensor_small : SensorSmall,
        sensor_station : SensorStationIcon,
        sensor_greenhouse : SensorGreenhouse,
        sensor_pump : pumpIcon,
        sensor_greenhouse_bg : SensorGreenhouseBg,
        pump : Pump,
        user_not_found : UserNotfound
    },
    icon : {
        close : CloseRoundedIcon,
        delete : DeleteRoundedIcon,
        history : HistoryRoundedIcon,
        plus : ControlPointRoundedIcon,
        replyAll : ReplyAllRoundedIcon
    },
    mapping_user_type : {
        doctor : 1,
        farmer : 2
    }
}

export default env