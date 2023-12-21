import react from "@vitejs/plugin-react"
import { defineConfig, splitVendorChunkPlugin } from "vite"
import vitePluginImp from "vite-plugin-imp"
import tsconfigPaths from "vite-tsconfig-paths"

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tsconfigPaths(),
    vitePluginImp({
      libList: [
        {
          libName: "antd",
          style: (name) => `antd/es/${name}/style`,
        },
      ],
    }),
    splitVendorChunkPlugin(),
  ],
  server: {
    port: 3000,
    host: "127.0.0.1",
  },
  preview: {
    port: 4000,
  },
  build: {
    outDir: "build",
    assetsDir: "static",
    rollupOptions: {
      input: {
        app: "./index.html",
      },
      output: {
        manualChunks: (module: string) => {
          if (module.includes("node_modules")) {
            return "npm-packages"
          }
          return null
        },
      },
    },
  },
  resolve: {
    alias: [{ find: /^~/, replacement: "" }],
  },
  css: {
    preprocessorOptions: {
      less: {
        math: "always",
        relativeUrls: true,
        javascriptEnabled: true,
        modifyVars: {
          "@accent-color": "#425CD7",
          "@primary-color": "@accent-color",
          "@primary-color-hover": "red",
          "@primary-color-yi": "#555555",
          "@primary-color-hover-yi": "#4E6BF3",
          "@link-color": "@accent-color",
          "@black": "#2C2C2C",
          "@border-radius-base": "4px",
          "@border-color-base": "#CBD0E2",
          "@success-color": "#4DAF7C",
          "@warning-color": "#EFB622",
          "@error-color": "#C44D56",
          "@layout-sider-background": "#2C2C2C",
          "@layout-trigger-background": "@layout-sider-background",
          "@layout-header-background": "@layout-sider-background",
          "@menu-dark-inline-submenu-bg": "@layout-sider-background",
          "@menu-item-active-bg": "@layout-sider-background",
          "@menu-dark-bg": "@layout-sider-background",
          "@menu-dark-item-active-bg": "@primary-color-yi",
          "@switch-color": "@accent-color",
          "@switch-bg": "#fff",
          "@heading-color": "@primary-color-yi",
          "@checkbox-color": "@accent-color",
          "@btn-primary-bg": "@accent-color",
          "@input-hover-border-color": "#A8B1CE",
          "@input-addon-bg": "@accent-color",
          "@input-icon-hover-color": "@accent-color",
          "@item-active-bg": "@accent-color",
          "@select-item-selected-bg": "#F6F6F6",
          "@dropdown-selected-color": "@accent-color",
          "@dropdown-selected-bg": "#f5f5f5",
          "@radio-dot-color": "@accent-color",
          "@picker-basic-cell-hover-with-range-color": "lighten(@accent-color, 35%)",
          "@picker-date-hover-range-border-color": "lighten(@accent-color, 35%)",
          "@picker-basic-cell-active-with-range-color": "lighten(@accent-color, 35%)",
          "@picker-date-hover-range-color": "@picker-basic-cell-hover-with-range-color",
          "@tabs-card-active-color": "@accent-color",
          "@tabs-ink-bar-color": "@accent-color",
          "@tabs-highlight-color": "@accent-color",
          "@tree-directory-selected-bg": "@accent-color",
          "@tree-node-selected-bg": "#F6F6F6",
          "@timeline-dot-color": "@accent-color",
          "@primary-color-active": "@accent-color",
          "@info-color": "@accent-color",
          "@select-selection-item-bg": "#f5f5f5",
          "@select-selection-item-border-color": "#f0f0f0",
        },
      },
    },
  },
})
