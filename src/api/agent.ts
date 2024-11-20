import axios, { AxiosResponse } from 'axios'
//import { request } from 'https';

axios.defaults.baseURL='https://localhost:7277/api'
const responseBody = (response: AxiosResponse) => response.data;

const requests = {
    
    get: (url: string) => axios.get(url).then(responseBody),
    post: (url:string,body:{}) => axios.post(url,body).then(responseBody),
    put: (url:string, body:{}) => axios.put(url,body).then(responseBody),
    del: (url: string) => axios.delete(url).then(responseBody),
    list: (url: string, pageNumber: number, pagesize: number) =>

        axios.get(url, {
            params: {
                page: pageNumber,
                pageSize: pagesize
            }
        })
        

    
}

const Entities = {

    listbyname: (tablename: string, name: string) => requests.get(`/Entity/${tablename}/${name}`),
    create: (tablename: string, data: {}) => requests.post(`/Entity/${tablename}`, data),
    update: (tablename: string, id: string, data: {}) => requests.put(`/Entity/${tablename}/${id}`, data),
    listAll: (tablename: string, pageNumber: number, pageSize: number) => requests.list(`/Entity/list/${tablename}`, pageNumber,pageSize),
    getById: (tablename: string, id: string) => requests.get(`/Entity/GetById/${tablename}/${id}`) // New getById method

}

const agent ={

     Entities 
 
}

export default agent;