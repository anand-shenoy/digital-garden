import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Digital Garden",
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
      // Only two colours in the whole palette: #005CFF blue and #E6E6ED grey.
      // Alpha variants of those same two hues are used for subtle borders/
      // muted text, dark mode is a full reversal of light mode.
      colors: {
        lightMode: {
          light: "#E6E6ED",
          lightgray: "rgba(0, 92, 255, 0.25)",
          gray: "rgba(0, 92, 255, 0.55)",
          darkgray: "#005CFF",
          dark: "#005CFF",
          secondary: "#005CFF",
          tertiary: "rgba(0, 92, 255, 0.7)",
          highlight: "rgba(0, 92, 255, 0.15)",
          textHighlight: "rgba(0, 92, 255, 0.35)",
        },
        darkMode: {
          light: "#005CFF",
          lightgray: "rgba(230, 230, 237, 0.25)",
          gray: "rgba(230, 230, 237, 0.55)",
          darkgray: "#E6E6ED",
          dark: "#E6E6ED",
          secondary: "#E6E6ED",
          tertiary: "rgba(230, 230, 237, 0.7)",
          highlight: "rgba(230, 230, 237, 0.15)",
          textHighlight: "rgba(230, 230, 237, 0.35)",
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
