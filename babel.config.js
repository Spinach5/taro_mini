export const presets = [
  [
    "taro",
    {
      framework: "react",
      ts: false,
      compiler: "vite",
      // 关键修改：关闭 usage 自动注入，改为 false 或 entry
      useBuiltIns: false,
      // 如果需要 polyfill，改用 transform-runtime 并设置 corejs: false
    },
  ],
];
