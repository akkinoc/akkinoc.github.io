// Social share
document.querySelectorAll(".page__share a.btn").forEach(el => {
  el.addEventListener("click", event => {
    const url = el.href
    const name = el.target
    const width = 600
    const height = 480
    const left = window.screenX + window.innerWidth / 2 - width / 2
    const top = window.screenY + window.innerHeight / 2 - height / 2
    const features = `left=${left},top=${top},width=${width},height=${height}`
    window.open(url, name, features)
    event.preventDefault()
  })
})
