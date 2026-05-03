import axios from "axios";
import env from "../../env"

const { domain , subpath_server } = env

const HOST_API = `${domain}${subpath_server}`

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
    async put (url , data , options = {}) {
        return await axios.put(`${HOST_API}${url}` , data , {
            headers: {
                "Content-Type" : "application/json",
            },
            ...this.options,
            ...options,
        })
    }
    async get(url , query , options = {}) {
        return await axios.get(`${HOST_API}${url}` , {
            params : query,
            ...this.options,
            ...options
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