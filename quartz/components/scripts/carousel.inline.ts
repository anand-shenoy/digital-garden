document.addEventListener("nav", () => {
  for (const carousel of document.getElementsByClassName("carousel")) {
    const viewport = carousel.querySelector(".carousel-viewport") as HTMLElement | null
    const track = carousel.querySelector(".carousel-track") as HTMLElement | null
    const leftArrow = carousel.querySelector(".carousel-arrow-left") as HTMLElement | null
    const rightArrow = carousel.querySelector(".carousel-arrow-right") as HTMLElement | null
    if (!viewport || !track || !leftArrow || !rightArrow) continue

    const scrollByAmount = () => {
      const slide = track.querySelector(".carousel-slide") as HTMLElement | null
      return slide ? slide.getBoundingClientRect().width + 16 : viewport.clientWidth
    }

    const onLeft = () => viewport.scrollBy({ left: -scrollByAmount(), behavior: "smooth" })
    const onRight = () => viewport.scrollBy({ left: scrollByAmount(), behavior: "smooth" })

    leftArrow.addEventListener("click", onLeft)
    rightArrow.addEventListener("click", onRight)
    window.addCleanup(() => leftArrow.removeEventListener("click", onLeft))
    window.addCleanup(() => rightArrow.removeEventListener("click", onRight))
  }
})
