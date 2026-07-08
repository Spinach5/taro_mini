import { useState } from "react";
import { WebView } from "@tarojs/components";
import Taro, { useLoad } from "@tarojs/taro";

export default function WebviewPage() {
  const [url, setUrl] = useState("");

  useLoad((options) => {
    if (options.url) {
      setUrl(decodeURIComponent(options.url));
    }
  });

  if (!url) {
    return null;
  }

  return <WebView src={url} />;
}
