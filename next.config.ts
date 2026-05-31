import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // 같은 LAN 의 모바일/타 기기에서 dev 서버 접속 허용
  allowedDevOrigins: ['192.168.68.53'],
};

export default nextConfig;
