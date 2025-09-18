import { Capacitor } from "@capacitor/core";
import { Device } from "@capacitor/device";

export function isNativePlatform() {
  return Capacitor.isNativePlatform();
}

export async function getDeviceType(): Promise<
  "iphone" | "ipad" | "android" | "web"
> {
  const info = await Device.getInfo();

  if (info.platform === "ios") {
    if (info.model?.toLowerCase().includes("ipad")) {
      return "ipad";
    } else if (info.model?.toLowerCase().includes("iphone")) {
      return "iphone";
    }
  } else if (info.platform === "android") {
    return "android";
  }
  return "web";
}
