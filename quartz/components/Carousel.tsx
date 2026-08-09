import { QuartzComponent, QuartzComponentConstructor, QuartzComponentProps } from "./types"
import style from "./styles/carousel.scss"
// @ts-ignore
import script from "./scripts/carousel.inline"
import { classNames } from "../util/lang"

// Carousel only renders when the note's frontmatter lists real images:
//   ---
//   images: ["/path/to/image-1.jpg", "/path/to/image-2.jpg"]
//   ---
// Previously this always rendered 6 hardcoded "Image N" placeholders on
// every page regardless of content (fixed 2026-08-09).
const Carousel: QuartzComponent = ({ displayClass, fileData }: QuartzComponentProps) => {
  const images = (fileData.frontmatter?.images as string[] | undefined) ?? []
  if (images.length === 0) {
    return null
  }

  return (
    <div class={classNames(displayClass, "carousel")}>
      <button class="carousel-arrow carousel-arrow-left" aria-label="Scroll images left">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
          <path d="M15 4h-2v2h-2v2h-2v2H9v4h2v2h2v2h2v2h2v-2h-2v-2h-2v-2H9v-4h2V8h2V6h2z" />
        </svg>
      </button>
      <div class="carousel-viewport">
        <div class="carousel-track">
          {images.map((src, i) => (
            <div class="carousel-slide" key={i}>
              <img src={src} alt="" loading="lazy" />
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
