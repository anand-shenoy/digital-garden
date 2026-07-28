// @ts-ignore
import darkmodeScript from "./scripts/darkmode.inline"
import styles from "./styles/darkmode.scss"
import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import { i18n } from "../i18n"
import { classNames } from "../util/lang"

const Darkmode: QuartzComponent = ({ displayClass, cfg }: QuartzComponentProps) => {
  return (
    <button class={classNames(displayClass, "darkmode")}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        class="dayIcon"
        viewBox="0 0 24 24"
        aria-label={i18n(cfg.locale).components.themeToggle.darkMode}
      >
        <title>{i18n(cfg.locale).components.themeToggle.darkMode}</title>
        <path
          d="M16 10V9h-1V8h-1V7h-4v1H9v1H8v1H7v4h1v1h1v1h1v1h4v-1h1v-1h1v-1h1v-4zm-1 4h-1v1h-4v-1H9v-4h1V9h4v1h1z"
        />
        <path
          d="M21 11v-1h1V9h1V7h-3V6h-2V4h-1V1h-2v1h-1v1h-1v1h-2V3h-1V2H9V1H7v3H6v2H4v1H1v2h1v1h1v1h1v2H3v1H2v1H1v2h3v1h2v2h1v3h2v-1h1v-1h1v-1h2v1h1v1h1v1h2v-3h1v-2h2v-1h3v-2h-1v-1h-1v-1h-1v-2zm-2 2v1h1v1h1v1h-3v1h-1v1h-1v3h-1v-1h-1v-1h-1v-1h-2v1h-1v1H9v1H8v-3H7v-1H6v-1H3v-1h1v-1h1v-1h1v-2H5v-1H4V9H3V8h3V7h1V6h1V3h1v1h1v1h1v1h2V5h1V4h1V3h1v2h1v2h1v1h3v1h-1v1h-1v1h-1v2z"
        />
      </svg>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        version="1.1"
        class="nightIcon"
        viewBox="0 0 24 24"
        aria-label={i18n(cfg.locale).components.themeToggle.lightMode}
      >
        <title>{i18n(cfg.locale).components.themeToggle.lightMode}</title>
        <path
          d="M21 17v1h-2v1h-4v-1h-2v-1h-2v-1h-1v-2H9v-2H8V8h1V6h1V4h1V3h2V2h2V1h-5v1H8v1H6v1H5v1H4v2H3v2H2v6h1v2h1v2h1v1h1v1h2v1h2v1h6v-1h2v-1h2v-1h1v-1h1v-2zM8 20v-1H6v-2H5v-2H4V9h1V7h1V5h2v1H7v2H6v4h1v2h1v2h1v1h1v1h1v1h2v1h2v1h-5v-1z"
        />
      </svg>
    </button>
  )
}

Darkmode.beforeDOMLoaded = darkmodeScript
Darkmode.css = styles

export default (() => Darkmode) satisfies QuartzComponentConstructor
