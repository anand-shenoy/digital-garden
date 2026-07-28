import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Anand's Digital Garden",
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
          light: "#E6E6ED",
          lightgray: "#D6D6E0",
          gray: "#A9ACC4",
          darkgray: "#5C6690",
          dark: "#3351A6",
          secondary: "#24397A",
          tertiary: "#8890B8",
          highlight: "rgba(51, 81, 166, 0.15)",
          textHighlight: "rgba(51, 81, 166, 0.35)",
        },
        darkMode: {
          light: "#3351A6",
          lightgray: "#4A63B8",
          gray: "#7C93D0",
          darkgray: "#C3CEEB",
          dark: "#FFFFFF",
          secondary: "#E6E6ED",
          tertiary: "#A9ACC4",
          highlight: "rgba(255, 255, 255, 0.15)",
          textHighlight: "rgba(255, 255, 255, 0.35)",
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
