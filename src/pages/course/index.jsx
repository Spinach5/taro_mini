// pages/course/index.jsx
import { Button } from '@tarojs/components'
import { useEffect } from 'react'
import { login } from '../../utils/student'
import cacheManager from '../../utils/cache'
import SafeAreaView from "../../components/safeView"

export default function Schedule() {
  useEffect(() => {
    const loadData = async () => {
      try {
        if(true){
          console.log("666")
        }
      } catch (error) {
        console.error('获取失败:', error)
      }
    }
    loadData()
  }, [])
  return(
    <SafeAreaView>
      <Button onClick={cacheManager.clear}>清除缓存</Button>
    </SafeAreaView>
    
  )
}