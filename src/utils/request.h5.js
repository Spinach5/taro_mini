import axios from 'axios'

export const request = async (options) => {
  try {
    const response = await axios({
      url: options.url,
      method: options.method || 'GET',
      data: options.data,
      headers: options.header,
      withCredentials: true,
    })
    return {
      data: response.data,
      statusCode: response.status,
      header: response.headers,
    }
  } catch (error) {
    if (error.response) {
      return {
        data: error.response.data,
        statusCode: error.response.status,
        header: error.response.headers,
      }
    }
    throw error
  }
}