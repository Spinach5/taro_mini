// pages/course/index.jsx
import { useEffect } from 'react'
import { login } from '../../utils/student'

export default function Schedule() {
  useEffect(() => {
    const loadData = async () => {
      try {
        if(login()){
          console.log("666")
        }
      } catch (error) {
        console.error('获取失败:', error)
      }
    }
    loadData()
  }, [])
}