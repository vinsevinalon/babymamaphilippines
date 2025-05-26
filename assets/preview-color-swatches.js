if (!window.Eurus.loadedScript.includes('preview-color-swatches.js')) {
  window.Eurus.loadedScript.push('preview-color-swatches.js');

  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.data('xProductCard', (
        sectionId,
        productUrl,
        productId,
      ) => ({
        currentVariantCard: '',
        options: [],
        isSelect: false,
        productId: productId,
        showOptions: false,
        init() {          
          document.addEventListener(`eurus:product-card-variant-select:updated:${sectionId}`, (e) => {
            this.checkVariantSelected();
            this.currentVariantCard = e.detail.currentVariant;
            this.options = e.detail.options;
          });
        },
        checkVariantSelected() {
          const fieldset = [...document.querySelectorAll(`#variant-update-${sectionId} fieldset`)];
          if(fieldset.findIndex(item => !item.querySelector("input:checked")) == "-1") {
            this.isSelect = true;
          }
        }
      }))

      Alpine.data('xDoubleTouch', (productUrl) => ({
        lastTapTime: 0,
        DOUBLE_TAP_DELAY: 300,
        singleTapTimeout: null,
        touchStartX: 0,
        touchStartY: 0,
        touchMoved: false,
        MAX_MOVE_THRESHOLD: 10,
        showSecond: false,

        onTouchStart(event) {
          const touch = event.touches[0];
          this.touchStartX = touch.clientX;
          this.touchStartY = touch.clientY;
          this.touchMoved = false;
        },
  
        onTouchMove(event) {
          const touch = event.touches[0];
          const deltaX = Math.abs(touch.clientX - this.touchStartX);
          const deltaY = Math.abs(touch.clientY - this.touchStartY);
          if (deltaX > this.MAX_MOVE_THRESHOLD || deltaY > this.MAX_MOVE_THRESHOLD) {
            this.touchMoved = true;
          }
        },
  
        onTouchEnd(splide, carousel) {
          if (this.touchMoved) {
            return;
          }
  
          const currentTime = new Date().getTime();
          const tapLength = currentTime - this.lastTapTime;
  
          if (tapLength < this.DOUBLE_TAP_DELAY && tapLength > 0) {
            clearTimeout(this.singleTapTimeout);
            this.lastTapTime = 0;
            this.onDoubleTap(splide, carousel);
          } else {
            this.lastTapTime = currentTime;
            this.singleTapTimeout = setTimeout(() => {
              this.onSingleTap();
            }, this.DOUBLE_TAP_DELAY);
          }
        },
  
        onSingleTap() {
          window.location.href= productUrl
        },
  
        onDoubleTap(splide, carousel) {
          if (carousel) {
            Alpine.store('xSplide').togglePlayPause(splide)
          } else {
            if (this.showSecond == true) {
              this.showSecond = false;
            } else {
              this.showSecond = true;
            }
          }        
        }
      }));

      Alpine.store('xPreviewColorSwatch', {
        onChangeVariant(el, productUrl, src, variantId, sectionId, isColor = false) {
          setTimeout(() => {
            document.addEventListener(`eurus:product-card-variant-select:updated:${sectionId}`, (e) => {
              if (e.detail.currentVariant == null) {
                this.updateImage(el, productUrl, src, variantId, sectionId);
              }
            });

            if (!isColor) {
              let productVariants = ''

              document.dispatchEvent(new CustomEvent(`eurus:product-variant-get:${sectionId}`, {
                detail: {
                  callback: (variants) => {
                    productVariants = variants;
                  }
                }
              }));

              if (productVariants) {
                let variantSrc = productVariants.reduce((acc, variant) => {
                  if (variant.featured_image) {
                    acc[variant.id] = variant.featured_image.src;
                  }
                  return acc;
                }, {});
        
                const swatchesContainer = el.closest('.options-container');
                if (swatchesContainer) {
                  const swatches = swatchesContainer.querySelectorAll('label.color-watches');
                  const inputs = swatchesContainer.querySelectorAll('input:checked');
      
                  let selectedOption = [];
      
                  inputs.forEach(input => { 
                    if (![...swatches].some(swatch => swatch.dataset.optionvalue === input.value)) {
                      selectedOption.push(input.value);
                    }
                  });
      
                  let imageSrc = productVariants
                    .filter(variant => selectedOption.every(option => variant.options.includes(option)))
                    .map(variant => `url(${variantSrc[variant.id] ? variantSrc[variant.id] : src})`);
                  
                  swatches.forEach((swatch, index) => {
                    swatch.style.setProperty('--bg-image',  imageSrc[index]);
                  });
                }
              }
            } 
          }, 0) // INP
        },

        updateImage(el, productUrl, src, variantId, sectionId, hasVariant) {
          const cardProduct = el.closest('.card-product');
          let getLink =  productUrl + `?variant=${variantId}`;
          if (!cardProduct) return;
          const linkVariant = cardProduct.getElementsByClassName("link-product-variant");
          for (var i = 0; i < linkVariant.length; i ++) {
            linkVariant[i].setAttribute("href", getLink);
          }
          const currentVariant = cardProduct.querySelector(".current-variant");
          if (currentVariant && !hasVariant) {
            currentVariant.innerText = variantId;
          }

          if (src != '') {
            let media = cardProduct.querySelector(`[media="${src}"]`);
            if (media) {
              let index = media.getAttribute('index');
              let slide = cardProduct.querySelector('.x-splide');
              if (slide) {
                if (slide.splide) {
                  slide.splide.go(Number(index));
                } else {
                  document.addEventListener(`eurus:${sectionId}:splide-ready`, () => {
                    slide.splide.go(Number(index));
                  });
                }
                return;
              } 
            }
            const previewImg = cardProduct.getElementsByClassName("preview-img")[0];
            if (!previewImg) return;
            previewImg.removeAttribute("srcset");
            previewImg.setAttribute("src", src);
            let slide = cardProduct.querySelector('.x-splide');
            if (slide && slide.splide) {
              slide.splide.go(0);
            }
          } else {
            let slide = cardProduct.querySelector('.x-splide');
            if (slide && slide.splide) {
              slide.splide.go(0);
            }
          }
        },

        updateQuickAdd(productUrl, variantId, quickAddPageParam, productId){
          let url = `${productUrl}?variant=${variantId}&section_id=choose-option&page=${quickAddPageParam}`
          fetch(url)
          .then((response) => response.text())
          .then((responseText) => {
            const html = new DOMParser().parseFromString(responseText, 'text/html');
            const listCurrent = document.querySelectorAll(`#product-form-choose-option${productId}${quickAddPageParam}`);
            const destination = html.querySelector(`#product-form-choose-option${productId}${quickAddPageParam}`);
            if(listCurrent.length>0 && destination){
              listCurrent.forEach((item)=>{
                item.innerHTML = destination.innerHTML;
                const currentPrice = item.closest('.card-product').querySelector(".main-product-price");
                const updatePrice = html.querySelector(".main-product-price");
                if(currentPrice && updatePrice){
                  currentPrice.innerHTML = updatePrice.innerHTML
                }
              })
            }
          })
        }
      });
    })
  });
}    