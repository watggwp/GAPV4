import axios from "axios";

const HOST_API = process.env.NODE_ENV === "development" ? 
    "http://" + process.env.REACT_APP_API_LOCAL + ":" + process.env.REACT_APP_API_PORT :
    ""

class ClientRequestAPI {
    async post (url , {
        data = {}
    }) {
        return await axios.post(`${HOST_API}${url}` , data , {
            headers: {
                "Content-Type" : "application/json"
            },
            withCredentials : true
        })
    }
    async postForm(url , {
        data = {}
    }) {
        const formData = new FormData();
        for(const key in data){
            formData.append(key , data[key])
        }

        return await axios.post(`${HOST_API}${url}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            withCredentials: true
        })
    }
    async put (url , {
        data = {}
    }) {
        return await axios.put(`${HOST_API}${url}` , data , {
            headers: {
                "Content-Type" : "application/json"
            },
            withCredentials : true
        })
    }
    async get(url , {
        query = {}
    }) {
        return await axios.post(`${HOST_API}${url}` , query , {
            withCredentials : true
        })
    }
}

const RequestAPI = new ClientRequestAPI()

export default RequestAPI