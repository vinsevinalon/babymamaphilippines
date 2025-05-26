if (!window.Eurus.loadedScript.includes('video-shopping.js')) {
  window.Eurus.loadedScript.push('video-shopping.js');
  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.data('xVideoShopping', () => ({
        showSlideListItemInVideoCard: false,
        showSlideProductInPopup: false,
        showSlideProductInVideoCard: false,
        showPopup: false,
        productSelectedId: '',
        positionBottomGroupAnnouncementAndHeader: 0,
        isMobile: false,
        openProductInPopup(productId) {
          this.showSlideProductInPopup = true
          this.productSelectedId = productId
        },
        openProductInSlide(productId) {
          this.showSlideProductInVideoCard = true
          this.productSelectedId = productId
        },
        closeProductInSlide() {
          this.isOpenProductInPopupMobile = false
          this.showSlideProductInVideoCard = false
          setTimeout(() => {
            this.productSelectedId = ''
          }, 500)
        },
        closeProductInPopup() {
          this.showSlideProductInPopup = false
          setTimeout(() => {
            this.productSelectedId = ''
          }, 500)
        },
        openPopup() {
          this.showPopup = true
          Alpine.store('xPopup').openVideoShopping = true
          const announcement = document.getElementById("x-announcement")
          const header = document.getElementById("sticky-header")
          if (announcement) {
            if (announcement.dataset.isSticky == 'true') {
              if (header && header.offsetHeight + header.getBoundingClientRect().top > announcement.offsetHeight) {
                this.positionBottomGroupAnnouncementAndHeader = header ? header.offsetHeight + header.getBoundingClientRect().top : 0;
              }
              else {
                this.positionBottomGroupAnnouncementAndHeader = announcement.offsetHeight;
              }
            }
            else {
              this.positionBottomGroupAnnouncementAndHeader = header ? header.offsetHeight + header.getBoundingClientRect().top : announcement.offsetHeight + announcement.getBoundingClientRect().top
            }
          }
          else {
            this.positionBottomGroupAnnouncementAndHeader = header ? header.offsetHeight + header.getBoundingClientRect().top : 0
          }
        },
        closePopup() {
          this.showPopup = false
          setTimeout(() => {
            Alpine.store('xPopup').openVideoShopping = false
          }, 500)
          this.closeProductInPopup()
        }
      }))
    })
  })
}