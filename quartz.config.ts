import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Anand Shenoy, Digital Garden",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: null,
    locale: "en-US",
    baseUrl: "anand-shenoy.github.io/digital-garden",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "local",
      cdnCaching: false,
      typography: {
        header: "Geist Mono",
        body: "Geist Mono",
        code: "Geist Mono",
      },
      colors: {
        lightMode: {
          light: "#DEDEDE",
          lightgray: "#D0D0D0",
          gray: "#A8A6AD",
          darkgray: "#605E68",
          dark: "#3351A6",
          secondary: "#F0112B",
          tertiary: "#2F2D38",
          highlight: "rgba(51, 81, 166, 0.15)",
          textHighlight: "rgba(240, 17, 43, 0.3)",
        },
        darkMode: {
          light: "#2F2D38",
          lightgray: "#3D3B47",
          gray: "#5C5A68",
          darkgray: "#9997A3",
          dark: "#5C7CD6",
          secondary: "#F0112B",
          tertiary: "#DEDEDE",
          highlight: "rgba(92, 124, 214, 0.15)",
          textHighlight: "rgba(240, 17, 43, 0.3)",
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
