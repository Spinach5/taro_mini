// pages/course/index.jsx
import { View, Text } from '@tarojs/components'
import SafeAreaView  from "../../components/safeView"
import {getMitudzCookies, extractXhid} from '../../utils/student.js'

export default async function Course() {
  const cookies = await getMitudzCookies('13687106362','Spinach114514!')
  if (!cookies) {
    console.log('登录失败');
    return;
  }

  const xhid = await extractXhid();
  console.log('xhid:', xhid);
  return (
    <SafeAreaView>
      <Text>Hello world!</Text>
    </SafeAreaView>
  )
}
