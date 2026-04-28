// src/utils/request.js
import axios from 'axios';

// 创建一个 axios 实例，并开启 withCredentials 以携带 Cookie
const request = axios.create({
  enableCookie: true,
  // 可以在这里配置 baseURL
  baseURL: 'https://hbut.jw.chaoxing.com',
});

// 可选：添加请求/响应拦截器进行日志打印或错误处理
request.interceptors.response.use(
  response => response,
  error => {
    console.error('请求错误: ', error);
    return Promise.reject(error);
  }
);

export default request;