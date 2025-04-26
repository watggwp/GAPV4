import axios from "axios";

const HOST_API = process.env.NODE_ENV === "development" ? 
    "http://" + process.env.REACT_APP_API_LOCAL + ":" + process.env.REACT_APP_API_PORT :
    ""

class ClientRequestAPI {

    options = {
        validateStatus: () => {
            return true
        },
        withCredentials : true
    }

    async post (url , data , options = {}) {
        return await axios.post(`${HOST_API}${url}` , data , {
            headers: {
                "Content-Type" : "application/json",
            },
            ...this.options,
            ...options,
        })
    }
    async postForm(url , data) {
        const formData = new FormData();
        for(const key in data){
            formData.append(key , data[key])
        }

        return await axios.post(`${HOST_API}${url}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            ...this.options
        })
    }
    async put (url , data) {
        return await axios.put(`${HOST_API}${url}` , data , {
            headers: {
                "Content-Type" : "application/json",
            },
            ...this.options
        })
    }
    async get(url , query) {
        return await axios.get(`${HOST_API}${url}` , {
            params : query,
            ...this.options
        })
    }

    async delete(url , query) {
        return await axios.delete(`${HOST_API}${url}` , {
            params : query,
            ...this.options
        })
    }
}

const RequestAPI = new ClientRequestAPI()

export const responseStatus = {
    SUCCESS: 200
}

export default RequestAPI