/**
 * React Native 端加密函数
 * 使用 jsencrypt（与 H5 端相同）
 */
import { JSEncrypt } from 'jsencrypt'

function encryptPassword(password) {
  const publicKey = 'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDcwU0RBrR31L3eHKVGogsJKdr36D3rrjUNaZ77yxxO9HSIojA4jyJylCVALkcu4cK+bbGLpedilJSlcyohso+IBI+A/eAfjS/GhIT/OWEsg8/+YLt+asM8+pdISE/T14tTqg/WDe8nqX48dazB0Izu1ytaPPFRWuYqtUTRpZ7IsQIDAQAB'
  const encrypt = new JSEncrypt()
  encrypt.setPublicKey(publicKey)
  const result = encrypt.encrypt(password)
  if (result === false) {
    throw new Error('加密失败，请检查公钥或输入内容')
  }
  return result
}

export default encryptPassword
