import Taro from '@tarojs/taro'

export const request = async (options) => {
  return await Taro.request(options)
}