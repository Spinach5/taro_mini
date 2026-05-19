import { Input } from "@tarojs/components"
import './InputBar.css'

export default function InputBar({
  className = '',
  placeholder,
  onConfirm = ()=>{}
}) {
  return (
    <Input
      className={`input-field ${className}`}
      type='text' placeholder={placeholder} focus
      onConfirm={onConfirm}
    >
    </Input>
  )
}
