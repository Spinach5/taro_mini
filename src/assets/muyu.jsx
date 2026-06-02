import { Image } from "@tarojs/components";
import muyuImg from "./muyu.svg"
import muyuStickImg from "./muyu-stick.svg"


const Muyu = ({ className = "" }) => (
  <Image src={muyuImg} className={className} />
);

const MuyuStick = ({ className = "" }) => (
  <Image src={muyuStickImg} className={className} />
);

export { Muyu, MuyuStick };
