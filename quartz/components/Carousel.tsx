import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/carousel.scss"
// @ts-ignore
import script from "./scripts/carousel.inline"
import { classNames } from "../util/lang"

const PLACEHOLDER_COUNT = 6

const Carousel: QuartzComponent = ({ displayClass }: QuartzComponentProps) => {
  return (
    <div class={classNames(displayClass, "carousel")}>
      <button class="carousel-arrow carousel-arrow-left" aria-label="Scroll images left">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M15 4h-2v2h-2v2h-2v2H9v4h2v2h2v2h2v2h2v-2h-2v-2h-2v-2H9v-4h2V8h2V6h2z" />
        </svg>
      </button>
      <div class="carousel-viewport">
        <div class="carousel-track">
          {Array.from({ length: PLACEHOLDER_COUNT }).map((_, i) => (
            <div class="carousel-slide" key={i}>
              <span>Image {i + 1}</span>
            </div>
          ))}
        </div>
      </div>
      <button class="carousel-arrow carousel-arrow-right" aria-label="Scroll images right">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M9 4h2v2h2v2h2v2h2v4h-2v2h-2v2h-2v2H9v-2h2v-2h2v-2h2V8h-2V6H9z" />
        </svg>
      </button>
    </div>
  )
}

Carousel.afterDOMLoaded = script
Carousel.css = style

export default (() => Carousel) satisfies QuartzComponentConstructor
