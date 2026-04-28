import { enc, mode as _mode, pad, AES } from "crypto-js";

function encryptByAES(message, key){
    let CBCOptions = {
        iv: enc.Utf8.parse(key),
        mode:_mode.CBC,
        padding: pad.Pkcs7
    };
    let aeskey = enc.Utf8.parse(key);
    let secretData = enc.Utf8.parse(message);
    let encrypted = AES.encrypt(
        secretData,
        aeskey,
        CBCOptions
    );
    return enc.Base64.stringify(encrypted.ciphertext);
}

export default { encryptByAES };