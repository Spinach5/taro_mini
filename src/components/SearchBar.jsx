import { Input } from "@tarojs/components"
import './SearchBar.css'

export default function SearchBar({
  className = '',
  placeholder,
  onConfirm = ()=>{}
}) {
  return (
    <Input
      className={`SearchBar ${className}`}
      type='text' placeholder={placeholder} focus
      onConfirm={onConfirm}
    >
    </Input>
  )
}
