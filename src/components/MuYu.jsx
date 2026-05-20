import { Image, View } from "@tarojs/components";
import muyu from "../assets/muyu.svg";
import stick from "../assets/muyu-stick.svg";
import "./MuYu.css";

export default function MuYu({ onClick }) {
  return (
    <View className="muyu-container" onClick={onClick}>
      <Image src={stick} className="muyu-stick" />
      <Image src={muyu} className="muyu-img" />
    </View>
  );
}
