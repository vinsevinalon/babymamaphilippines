if (!window.Eurus.loadedScript.has('variant-select-combine.js')) {
  window.Eurus.loadedScript.add('variant-select-combine.js');

  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.data('xVariantSelect', (
        element,
        sectionId,
        isProductPage,
        unavailableText,
        productUrl,
        productId,
        showFirstImageAvaiable,
        chooseOption,
        productBundle,
        handleSectionId,
        firstAvailableVariantId,
        pageParam,
        productFeaturedImage,
        quickAddPageParam,
        updateImage
      ) => ({
        variants: null,
        currentVariant: {},
        options: [],
        currentAvailableOptions: [],
        cachedResults: [],
        quickViewSectionId: 'quick-view',
        handleSectionId: sectionId,
        paramVariant: false,
        mediaGallerySource: [],
        isChange: false,
        optionConnects: [],
        mediaOption: "",
        handleSticky: '',
        initfirstMedia: false,
        initialized: false,
        initVariant(el) {
          this.variants = JSON.parse(this.$el.querySelector('[type="application/json"]').textContent);

          document.addEventListener(`eurus:product-variant-get:${sectionId}`, (e) => {
            e.detail.callback(this.variants);
          });  
          
          if (chooseOption) {
            this.handleSectionId = 'choose-option';
          }
          if (productBundle) {
            this.handleSectionId = handleSectionId;
          }
          
          if (!productBundle) {
            document.addEventListener('eurus:cart:items-changed', () => {
              this.cachedResults = [];
              Alpine.store('xUpdateVariantQuanity').updateQuantity(sectionId, productUrl, this.currentVariant?.id);
            });
          }

          this.$watch('options', () => {
            setTimeout(() => { 
              this._updateVariantSelector(productFeaturedImage, el);
            }, 0) // INP
          });
        },
        initMedia(init) {
          if (init) {
            this.initfirstMedia = true;
          }
          this._updateMasterId();
          this._updateMedia();
          this.initfirstMedia = false;
        },
        _updateVariantSelector(productFeaturedImage = "", el) {
          this._updateMasterId();
          this._updateVariantStatuses();
          this._updateOptionImage();
          
          if (!this.currentVariant) {
            this._dispatchUpdateVariant();
            this._setUnavailable();
            return;
          }
          if (firstAvailableVariantId != this.currentVariant.id) {
            this.paramVariant = true;
          }
          if (isProductPage && this.paramVariant) {
            window.history.replaceState({}, '', `?variant=${this.currentVariant.id}`);
          }
          if (chooseOption == '' && !isProductPage) {
            this._updateImageVariant(productFeaturedImage);
          }
          if(quickAddPageParam || updateImage){
            this._updateImageVariant(productFeaturedImage);
          }
          this._updateVariantInput();
          this._updateProductForms();
          this._setAvailable();
          Alpine.store('xPickupAvailable').updatePickUp(sectionId, this.currentVariant.id);

          const cacheKey = sectionId + '-' + this.currentVariant.id;
          if (this.cachedResults[cacheKey]) {
            const html = this.cachedResults[cacheKey];
            this._updateQuickAdd(html, el);
            this._renderPriceProduct(html);

            const selectors = ['block-inventory-', 'block-available-quantity-', 'quantity-selector-', 'volume-', 'x-availability-notice-', 'sku-', 'x-badges-', 'preorder-', 'cart-edt-'];
            for (let selector of selectors) {
              this._renderDestination(html, selector);
            }
            this._updateMedia(html);
            this._renderBuyButtons(html);
            this._setMessagePreOrder(html)
            this._setEstimateDelivery(html);

            const mtfSelectors = ['.properties_re_render', '.table_info_details', '.block-text', '.text-icon', '.collapsible-content', '.nutrition-bar-content', '.horizontab', '.featured-icon'];
            for (let selector of mtfSelectors) {
              this._setMetafieldInfo(html, selector);
            }
            this._setBackInStockAlert(html);
            this._setPickupPreOrder(html);
            this._dispatchUpdateVariant();
            this._dispatchVariantSelected(html);
            if (!productBundle) {
              Alpine.store('xUpdateVariantQuanity').render(html, sectionId);
            }
          } else {
            const variantId = this.currentVariant.id;
            let url = chooseOption?`${productUrl}?variant=${variantId}&section_id=${this.handleSectionId}&page=${pageParam ? pageParam : quickAddPageParam}`:`${productUrl}?variant=${variantId}&section_id=${this.handleSectionId}`
            fetch(url)
              .then((response) => response.text())
              .then((responseText) => {
                const html = new DOMParser().parseFromString(responseText, 'text/html');
                this._updateQuickAdd(html, el);
                if (this.currentVariant && variantId == this.currentVariant.id
                  && html.getElementById(`x-product-template-${productId}-${sectionId}`)) {                  
                  this._renderPriceProduct(html);
                  const selectors = ['block-inventory-', 'block-available-quantity-', 'quantity-selector-', 'volume-', 'x-availability-notice-', 'sku-', 'x-badges-', 'preorder-', 'cart-edt-'];
                  for (let selector of selectors) {
                    this._renderDestination(html, selector);
                  }
                  
                  if (showFirstImageAvaiable) {
                    this._updateMedia(html);
                  } else if (this.isChange) {
                    this._updateMedia(html);
                  }
                  this._renderBuyButtons(html);
                  this._setMessagePreOrder(html);
                  this._setEstimateDelivery(html);
                  const mtfSelectors = ['.properties_re_render', '.table_info_details', '.block-text', '.text-icon', '.collapsible-content', '.nutrition-bar-content', '.horizontab', '.featured-icon'];
                  for (let selector of mtfSelectors) {
                    this._setMetafieldInfo(html, selector);
                  }
                  this._setPickupPreOrder(html);
                  this._setBackInStockAlert(html);
                  
                  if (!productBundle) {
                    Alpine.store('xUpdateVariantQuanity').render(html, sectionId);
                  }
                  this.cachedResults[cacheKey] = html;
                  
                  this._dispatchUpdateVariant(html);
                  this._dispatchVariantSelected(html);
                } else if (this.currentVariant && variantId == this.currentVariant.id) {
                  this._renderPriceProduct(html);
                  this._dispatchUpdateVariant(html);
                }
              });
          }
        },
        _dispatchVariantSelected(html) {
          document.dispatchEvent(new CustomEvent(`eurus:product-page-variant-select:updated:${sectionId}`, {
            detail: {
              currentVariantStatus: this.currentVariant?.available,
              currentAvailableOptions: this.currentAvailableOptions,
              options: this.options,
              html: html
            }
          }));
        },
        _updateVariantStatuses() {
          const selectedOptionOneVariants = this.variants.filter(variant => this.options[0] === this._decodeOptionValue(variant.option1));
          this.options.forEach((option, index) => {
            this.currentAvailableOptions[index] = [];
            if (index === 0) return;

            const previousOptionSelected = this.options[index - 1];
            selectedOptionOneVariants.forEach((variant) => {
              if (variant.available && this._decodeOptionValue(variant[`option${ index }`]) === previousOptionSelected) {
                this.currentAvailableOptions[index].push(this._decodeOptionValue(variant[`option${ index + 1 }`]));
              }
            });
          });
        },
        _decodeOptionValue(option) {
          if (option) {
            return option
                    .replaceAll('\\/', '/');
          }
        },
        _renderDestination(html, selector) {
          const destination = document.getElementById(selector + sectionId);
          const source = html.getElementById(selector + sectionId);
          if (source && destination) destination.innerHTML = source.innerHTML;
        },
        _updateQuickAdd(html, el){
          const listCurrent = document.querySelectorAll(`#product-form-choose-option${productId}${quickAddPageParam ?? ''}`);
          const destination = html.querySelector(`#product-form-choose-option${productId}${quickAddPageParam ?? ''}`);
          if (listCurrent.length > 0 && destination){
            listCurrent.forEach((item) => {
              item.innerHTML = destination.innerHTML;
              const currentPrice = item.closest('.card-product').querySelector(".main-product-price");
              const updatePrice = html.querySelector(".main-product-price");
              if(currentPrice && updatePrice){
                currentPrice.innerHTML = updatePrice.innerHTML
              }
            })
          } else {
            if (listCurrent.length > 0) {
              listCurrent.forEach((item) => {
                item.innerHTML = html.querySelector('.form').innerHTML;
              })
            }
            const currentPrice = el?.closest('.card-product')?.querySelector(".main-product-price");
            const updatePrice = html.querySelector(".main-product-price");
            if(currentPrice && updatePrice){
              currentPrice.innerHTML = updatePrice.innerHTML
            }
          }
        },
        _updateMedia(html) {
          let mediaWithVariantSelected = document.getElementById("product-media-" + sectionId) && document.getElementById("product-media-" + sectionId).dataset.mediaWithVariantSelected;
          
          if (!chooseOption && !productBundle && !mediaWithVariantSelected) {
            let splideEl = document.getElementById("x-product-" + sectionId);
            let slideVariant = ""
            let index = ""
            let activeEL = ""
            if (this.currentVariant && this.currentVariant.featured_media != null) {
              slideVariant = document.getElementsByClassName(this.currentVariant.featured_media.id + '-' + sectionId);
              index = parseInt(slideVariant[0]?.getAttribute('index'));
              activeEL = document.getElementById('postion-image-' + sectionId + '-' + this.currentVariant.featured_media.id);
            } else {
              slideVariant = splideEl.querySelector(".featured-image");
              index = parseInt(slideVariant?.getAttribute('index'));
              activeEL = document.querySelector(`#stacked-${sectionId} .featured-image`);
            }
            
            if (splideEl) {
              if (splideEl.splide && slideVariant) {
                splideEl.splide.go(index)
              } else {
                document.addEventListener(`eurus:media-gallery-ready:${sectionId}`, () => {
                  if (splideEl.splide)
                    splideEl.splide.go(index);
                });
              }
            }
            if (!activeEL) return;
            

            if (html && !mediaWithVariantSelected) {
              let mediaGalleryDestination = html.getElementById(`stacked-${ sectionId }`);
              let mediaGallerySource = document.getElementById(`stacked-${ sectionId }`);

              if (mediaGallerySource && mediaGalleryDestination) {
                let firstChildSource = mediaGallerySource.querySelectorAll('div[data-media-id]')[0];
                let firstChildDestination = mediaGalleryDestination.querySelectorAll('div[data-media-id]')[0];
                if (firstChildDestination.dataset.mediaId != firstChildSource.dataset.mediaId && firstChildSource.dataset.index != 1) {
                  let sourceIndex = parseInt(firstChildSource.dataset.index);  
                  let positionOld = mediaGallerySource.querySelector(`div[data-media-id]:nth-of-type(${sourceIndex + 1})`);
                  mediaGallerySource.insertBefore(firstChildSource, positionOld);
                }

                mediaGallerySource.prepend(activeEL);
              }
            }
          }
          if (mediaWithVariantSelected) {
            this.updateMultiMediaWithVariant();
          }
        },
        _updateColorSwatch(html) {
          const showSwatchWithVariantImage = document.querySelector(`#variant-update-${ sectionId }`).dataset.showSwatchWithVariantImage;
          const destination = document.querySelector(`#variant-update-${ sectionId } [data-swatch="true"]`);
          if(destination && showSwatchWithVariantImage) {
            const source = html.querySelector(`#variant-update-${ sectionId } [data-swatch="true"]`);
            if (source) destination.innerHTML = source.innerHTML;
          }
        },
        _validateOption() {
          const mediaWithOption = document.querySelector(`#shopify-section-${sectionId} [data-media-option]`);
          if (mediaWithOption)
            this.mediaOption = mediaWithOption.dataset.mediaOption.split('_');
        },
        updateMultiMediaWithVariant() {
          this._validateOption();
          if (!this.currentVariant) {
            if (this.initfirstMedia) {
              let productMedia = document.querySelectorAll( `#ProductModal-${ sectionId } [data-media-option], #shopify-section-${ sectionId } [data-media-option]`);
              Array.from(productMedia).reverse().forEach(function(newMedia, position) {
                newMedia.classList.add('media_active');
                if (newMedia.classList.contains('media-slide')) {
                  newMedia.classList.add('splide__slide');
                }
              });
            }
            return;
          }
          const variantInputs = this.mediaOption.map(option =>
            document.querySelector(`#shopify-section-${sectionId} [data-option-name="${option}"]`)
          ).filter(el => el !== null);
          if (variantInputs.length === 0) {
            let variantMedias = ""
            if (!this.currentVariant.featured_media?.id) {
              variantMedias = document.querySelectorAll(`#ProductModal-${ sectionId } [data-media-option].featured-image, #shopify-section-${ sectionId } [data-media-option].featured-image`); 
            } else {
              variantMedias = document.querySelectorAll(`#ProductModal-${ sectionId } [data-media-option="${sectionId}-${this.currentVariant.featured_media.id}"], #shopify-section-${ sectionId } [data-media-option="${sectionId}-${this.currentVariant.featured_media.id}"]`);
            }
            let mediaActive = document.querySelectorAll(`#ProductModal-${ sectionId } [data-media-option=""], #shopify-section-${ sectionId } [data-media-option=""]`);
            let productMedias = document.querySelectorAll( `#ProductModal-${ sectionId } [data-media-option], #shopify-section-${ sectionId } [data-media-option]`);
            const newMedias = Array.prototype.concat.call( ...mediaActive, ...variantMedias)
            this._setActiveMedia(productMedias, newMedias, variantMedias);

            let splideEl = document.getElementById(`x-product-${ sectionId }`);
            if (splideEl && splideEl.splide) {
              splideEl.splide.refresh();
              splideEl.splide.go(0);
            }
            let splideZoomEl = document.getElementById(`media-gallery-${ sectionId }`);
            if (splideZoomEl && splideZoomEl.splide) {
              splideZoomEl.splide.refresh();
            }
          } else {
            let optionConnects = [];
            variantInputs.forEach((variantInput) => {
              const variantOptionIndex = variantInput && variantInput.dataset.optionIndex;
              const optionValue = this._handleText(this.currentVariant.options[variantOptionIndex]);
              if (this.mediaOption.includes(variantInput.dataset.optionName)) {
                optionConnects.push(variantInput.dataset.optionName + '-' + optionValue);
              }
              this.optionIndex = variantOptionIndex;
            });
            const mediaActive = document.querySelectorAll(`#ProductModal-${ sectionId } [data-media-type=""], #shopify-section-${ sectionId } [data-media-type=""]`);
            
            let variantMedias = [];
            let allVariantMedias = document.querySelectorAll(`#ProductModal-${ sectionId } [data-media-type]:not([data-media-type=""]), #shopify-section-${ sectionId } [data-media-type]:not([data-media-type=""])`);
            allVariantMedias.forEach((variantMedia) => {
              let data = variantMedia.getAttribute('data-media-type');
              let dataSet = new Set(data.split('_'));
              if (optionConnects.filter(option => dataSet.has(option)).length === dataSet.size) variantMedias.push(variantMedia);
            });

            let showFeatured = false;
            if (!variantMedias.length) {
              if (!this.currentVariant.featured_media?.id) {
                variantMedias = document.querySelectorAll(`#ProductModal-${ sectionId } [data-media-option].featured-image, #shopify-section-${ sectionId } [data-media-option].featured-image`); 
                showFeatured = true;
              } else {
                variantMedias = document.querySelectorAll(`#ProductModal-${ sectionId } [data-media-id="${sectionId}-${this.currentVariant.featured_media.id}"], #shopify-section-${ sectionId } [data-media-id="${sectionId}-${this.currentVariant.featured_media.id}"]`);
              }
            }
            if (!variantMedias.length) {
              document.querySelectorAll( `#ProductModal-${ sectionId } [data-media-type], #shopify-section-${ sectionId } [data-media-type]`).forEach(function(media){
                media.classList.add('media_active');
                media.classList.add('splide__slide');
              });
              let splideEl = document.getElementById(`x-product-${ sectionId }`);
              if (splideEl.splide) {
                splideEl.splide.refresh();
                splideEl.splide.go(0);
              }
              let splideZoomEl = document.getElementById(`media-gallery-${ sectionId }`);
              if (splideZoomEl.splide) {
                splideZoomEl.splide.refresh();
              }
              return;
            }
            
            const newMedias = Array.prototype.concat.call(...variantMedias , ...mediaActive);
            let productMedias = document.querySelectorAll( `#shopify-section-${ sectionId } [data-media-type], #ProductModal-${ sectionId } [data-media-type]`);
            
            this._setActiveMedia(productMedias, newMedias);
            
            if (this.optionConnect != optionConnects) {
              this.optionConnect = optionConnects;
            }
            
            let splideEl = document.getElementById(`x-product-${ sectionId }`);
            if (splideEl.splide) {
              splideEl.splide.refresh();
              splideEl.splide.go(0);
            }
            let splideZoomEl = document.getElementById(`media-gallery-${ sectionId }`);
            if(splideZoomEl && splideZoomEl.splide){
              splideZoomEl.splide.refresh();
            }
            
            if (showFeatured) {
              this._goToFirstSlide();
            }  
          }
        },
        _setActiveMedia(productMedias, newMedias, activeMedia) {
          productMedias.forEach(function(media){
            media.classList.remove('media_active');
            media.classList.remove('splide__slide');
            media.classList.remove('x-thumbnail');
          });
          Array.from(newMedias).reverse().forEach(function(newMedia, position) {
            newMedia.classList.add('media_active');
            if (newMedia.classList.contains('media-thumbnail')) {
              newMedia.classList.add('x-thumbnail');
            }
            if (newMedia.classList.contains('media-slide')) {
              newMedia.classList.add('splide__slide');
            }
            let parent = newMedia.parentElement;
            if (activeMedia) {
              if (parent.firstChild != newMedia && Array.from(activeMedia).includes(newMedia)) {
                parent.prepend(newMedia);
              }
            } else {
              if (parent.firstChild != newMedia) {
                parent.prepend(newMedia);
              }
            }
          });

          if (activeMedia) {
            let parent = activeMedia.parentElement;
            parent && parent.prepend(activeMedia);
          }
        },
        _handleText(someString) {
          if (someString) {
            return someString.toString().replace('ı', 'i').replace('ß', 'ss').normalize('NFC').replace('-', ' ').toLowerCase().trim().replace(/[^\p{L}\p{N}\s-]/gu, '').replace(/\s+/g, "-");
          }
        },
        _goToFirstSlide() {
          if (this.currentVariant && !this.currentVariant.featured_image) {
            let splideEl = document.getElementById("x-product-" + sectionId);
            if (splideEl) {
              if (splideEl.splide && this.currentVariant && this.currentVariant.featured_image != null) {
                splideEl.splide.go(0);
              }
            }

            let activeEL = document.querySelector(`#stacked-${sectionId} .featured-image`);
            let stackedEL = document.getElementById('stacked-' + sectionId);
            if(stackedEL && activeEL) stackedEL.prepend(activeEL);
          }
        },
        onChange(el, src, isColor = false) {
          if (!this.isChange) {
            this.isChange = this.$el.parentNode.dataset.optionName;
          }

          let variantSrc = this.variants.reduce((acc, variant) => {
            if (variant.featured_image) {
              acc[variant.id] = variant.featured_image.src;
            }
            return acc;
          }, {});

          if (!isColor) {    
            const swatchesContainer = el.closest('.options-container');
            const swatches = swatchesContainer.querySelectorAll('label.color-watches');
            const inputs = swatchesContainer.querySelectorAll('input:checked');

            let selectedOption = [];

            inputs.forEach(input => { 
              if (![...swatches].some(swatch => swatch.dataset.optionvalue === input.value)) {
                selectedOption.push(input.value);
              }
            });

            let imageSrc = this.variants
              .filter(variant => selectedOption.every(option => variant.options.includes(option)))
              .map(variant => `url(${variantSrc[variant.id] ? variantSrc[variant.id] : src})`);
            
            swatches.forEach((swatch, index) => {
              swatch.style.setProperty('--bg-image',  imageSrc[index]);
            });
          }
        },
        _updateMasterId() {
          this.currentVariant = this.variants.find((variant) => {
            return !variant.options.map((option, index) => {
              return this.options[index] === option.replaceAll('\\/', '/');
            }).includes(false);
          });
        },
        _updateVariantInput() {
          const productForms = document.querySelectorAll(`#product-form-${sectionId}, #product-form-installment-${sectionId}, #product-form-sticky-${sectionId}`);
          productForms.forEach((productForm) => {
            const input = productForm.querySelector('input[name="id"]');
            if (!input) return;
            input.value = this.currentVariant.id;
            input.dispatchEvent(new Event('change', { bubbles: true }));
          })
        },
        _updateProductForms() {
          const productForms = document.querySelectorAll(`#product-form-${sectionId}, #product-form-installment-${sectionId}, #product-form-sticky-${sectionId}`);
          productForms.forEach((productForm) => {
            const input = productForm.querySelector('input[name="id"]');
            if (input) {
              input.value = this.currentVariant.id;
              input.dispatchEvent(new Event('change', { bubbles: true }));
            }
          });
        },
        _renderPriceProduct(html) {
          const destination = document.getElementById('price-' + sectionId);
          let source = html.getElementById('price-' + sectionId);
          if(!source) {
            source = html.querySelector('.price');
            if (source && destination) destination.innerHTML = source.outerHTML;
          } else {
            if (source && destination) destination.innerHTML = source.innerHTML;
          }
        },
        _renderBuyButtons(html) {
          const productForms = document.querySelectorAll(`#product-form-${sectionId}, #product-form-installment-${sectionId}, #product-form-sticky-${sectionId}`);
          
          productForms.forEach((productForm) => {
            const atcSource = html.querySelector(`#${productForm.getAttribute("id")} .add_to_cart_button`);
            const atcDestination = productForm.querySelector('.add_to_cart_button');
            if (!atcDestination) return;

            if (atcSource && atcDestination) atcDestination.innerHTML = atcSource.innerHTML;
    
            if (this.currentVariant?.available) {
              /// Enable add to cart button
              atcDestination.dataset.available = "true";
              if (html.getElementById('form-gift-card-' + sectionId)) {
                if (document.getElementById('Recipient-checkbox-' + sectionId).checked && document.getElementById('recipient-form-' + sectionId).dataset.disabled == "true") {
                  atcDestination.setAttribute('disabled', 'disabled') 
                } else {
                  atcDestination.removeAttribute('disabled');
                }
              } else {
                atcDestination.removeAttribute('disabled');
              }
            } else {
              atcDestination.dataset.available = "false";
              atcDestination.setAttribute('disabled', 'disabled');
            }
          });
          const paymentButtonDestination = document.getElementById('x-payment-button-' + sectionId);
          const paymentButtonSource = html.getElementById('x-payment-button-' + sectionId);
          if (paymentButtonSource && paymentButtonDestination) {
            if (paymentButtonSource.classList.contains('hidden')) {
              paymentButtonDestination.classList.add('hidden');
            } else {
              paymentButtonDestination.classList.remove('hidden');
            }
          }
        },
        _setMessagePreOrder(html) {
          const msg = document.querySelector(`.pre-order-${sectionId}`);
          if (!msg) return;
          msg.classList.add('hidden');
          const msg_pre = html.getElementById(`pre-order-${sectionId}`);
          if (msg_pre) {
            msg.classList.remove('hidden');
            msg.innerHTML = msg_pre.innerHTML;
          }
        },
        _setEstimateDelivery(html) {
          const est = document.getElementById(`x-estimate-delivery-${sectionId}`);
          if (!est) return;
          const est_res = html.getElementById(`x-estimate-delivery-${sectionId}`);
          if (est_res.classList.contains('disable-estimate')) {
            est.classList.add('hidden');
          } else {
            est.classList.remove('hidden');
            est.innerHTML = est_res.innerHTML;
          }

          const estimateDeliveryCart = document.querySelectorAll(`.cart-edt-${sectionId}`);
          const estimateDeliveryCartUpdate = html.querySelectorAll(`.cart-edt-${sectionId}`);
          if (estimateDeliveryCart.length > 0 && estimateDeliveryCartUpdate.length > 0) {
            estimateDeliveryCart.forEach((item, index) => {
              if(estimateDeliveryCartUpdate[index] != undefined && estimateDeliveryCartUpdate[index].innerHTML != undefined ){
                item.innerHTML = estimateDeliveryCartUpdate[index].innerHTML;
              }
            })
          }
        },
        _setMetafieldInfo(html, query) {
          const content_arr = document.querySelectorAll(`${query}-${sectionId}`);
          const content_res_arr = html.querySelectorAll(`${query}-${sectionId}`);       
          if (content_arr.length > 0 && content_res_arr.length > 0) {
            content_arr.forEach((toc, index) => {
              toc.innerHTML = content_res_arr[index].innerHTML;
            })
          }
        },
        _setBackInStockAlert(html) {
          if (!this.initialized) {
            this.initialized = true;
            return;
          }
          const destination = document.getElementById(`back_in_stock_alert-${sectionId}`);
          const source = html.getElementById(`back_in_stock_alert-${sectionId}`);
          if (source && destination) destination.innerHTML = source.innerHTML;
        },
        _setPickupPreOrder(html) {
          const pickup = document.getElementById(`pickup-pre-order-${sectionId}`);
          if (!pickup) return;
          const pickup_res = html.getElementById(`pickup-pre-order-${sectionId}`);
          if (pickup_res.classList.contains('disable-pickup')) {
            pickup.classList.add('hidden');
          } else {
            pickup.classList.remove('hidden');
          }
        },
        _setUnavailable() {
          const selectors = ['price-', 'price-sticky-', 'block-inventory-', 'x-badges-', 'pickup-', 'sku-', 'back_in_stock_alert-'];
          for (let selector of selectors) {
            const element = document.getElementById(selector + sectionId);
            if (element) element.classList.add('hidden');
          }
          
          const msg_pre = document.querySelector(`.pre-order-${sectionId}`);
          if (msg_pre) msg_pre.classList.add('hidden');
          const quantity = document.getElementById('x-quantity-' + sectionId);
          if (quantity) quantity.classList.add('unavailable');

          this._setBuyButtonUnavailable();
        },
        _setAvailable() {
          const selectors = ['price-', 'block-inventory-', 'x-badges-', 'pickup-', 'sku-', 'back_in_stock_alert-'];
          for (let selector of selectors) {
            const element = document.getElementById(selector + sectionId);
            if (element) element.classList.remove('hidden');
          }
          const quantity = document.getElementById('x-quantity-' + sectionId);
          if (quantity) quantity.classList.remove('unavailable');
        },
        _setBuyButtonUnavailable() {
          const productForms = document.querySelectorAll(`#product-form-${sectionId},  #product-form-sticky-${sectionId}`);
          productForms.forEach((productForm) => {
            const addButton = productForm.querySelector('.add_to_cart_button');
            if (!addButton) return;
            addButton.setAttribute('disabled', 'disabled');
            const addButtonText = addButton.querySelector('.x-atc-text');
            if (addButtonText) addButtonText.textContent = unavailableText;
          });
        },
        _dispatchUpdateVariant(html="") {
          document.dispatchEvent(new CustomEvent(`eurus:product-card-variant-select:updated:${sectionId}`, {
            detail: {
              currentVariant: this.currentVariant,
              currentAvailableOptions: this.currentAvailableOptions,
              options: this.options,
              html: html
            }
          }));
        },
        _updateImageVariant(productFeaturedImage = "") {
          if (this.currentVariant != null) {
            let featured_image = productFeaturedImage;
            if (this.currentVariant.featured_image != null) {
              featured_image = this.currentVariant.featured_image.src;
            }
            Alpine.store('xPreviewColorSwatch').updateImage(this.$el, productUrl, featured_image, this.currentVariant.id, sectionId);
          }
        },
        _updateOptionImage() {
          if (element.closest('.card-product') && this.currentVariant && this.currentVariant.featured_image) {
            const option_image = this.currentVariant.featured_image.src;
            const card_label = this.options
              .map(option => element.querySelector(`label.color-watches[data-name*="${option.replace(/["\\]/g, '\\$&')}"]`))
              .find(label => label !== null);
            if (card_label) card_label.style.setProperty('--bg-image', `url(${option_image})`)
          }
        },
        initEventSticky() {
          document.addEventListener(`eurus:product-page-variant-select-sticky:updated:${sectionId}`, (e) => {
            this.handleSticky = e.detail.variantElSticky;
            this.updateVariantSelector(e.detail.inputId, e.detail.targetUrl);
          });
        },
        changeSelectOption(event) {
          Array.from(event.target.options)
            .find((option) => option.getAttribute('selected'))
            .removeAttribute('selected');
            event.target.selectedOptions[0].setAttribute('selected', 'selected');
          const input = event.target.selectedOptions[0];
          const inputId = input.id;
          const targetUrl = input.dataset.productUrl;
          this.updateVariantSelector(inputId, targetUrl);
        },
        updateVariantSelector(inputId, target) {
          if (chooseOption) {
            this.handleSectionId = 'choose-option';
          }
          if (productBundle) {
            this.handleSectionId = handleSectionId;
          }
          this.currentVariant = this._getVariantData(inputId);
          let updateFullpage = false;
          let callback = () => {};
          
          const targetUrl = target || element.dataset.url;
          if (element.dataset.url !== targetUrl) {
            this._updateURL(targetUrl);
            this._setAvailable();
            if (isProductPage) {
              updateFullpage = true;
            }
            callback = (html) => {
              this._handleSwapProduct(sectionId, html, updateFullpage);
              this._handleSwapQuickAdd(html);
              this._renderCardBundle(html);
              this._renderCardFBT(html);
              this._dispatchUpdateVariant(html);
            };
          } else if (!this.currentVariant) {
            this._setUnavailable();
            callback = (html) => {
              this._updateOptionValues(html);
              this._dispatchVariantSelected(html);
              this._dispatchUpdateVariant(html);
            };
          } else {
            this._updateURL(targetUrl);
            this._updateVariantInput();
            this._setAvailable();
            callback = (html) => {
              this._handleUpdateProductInfo(html);
              this._updateOptionValues(html);
              this._updateMedia(html);
              this._handleAvailable(html);
            }
          }
          this._renderProductInfo(targetUrl, callback, updateFullpage);
        },
        _renderProductInfo(url, callback, updateFullpage) {
          let link = "";
          let params = `option_values=${this._getSelectedOptionValues().join(',')}`;
          if (chooseOption || productBundle) {
            params = `option_values=${this._getSelectedOptionValues().join(',')}&page=${pageParam}`;
          }
          link = updateFullpage?`${url}?${params}`:`${url}?section_id=${this.handleSectionId}&${params}`;
      
          if (this.cachedResults[link]) {
            const html = this.cachedResults[link];
            callback(html);
          } else {
            fetch(link)
              .then((response) => response.text())
              .then((responseText) => {
                const html = new DOMParser().parseFromString(responseText, 'text/html');
                callback(html);
                this.cachedResults[link] = html;
              })
          }
          this.handleSticky = '';
        },
        _handleUpdateProductInfo(html) {
            this._renderCardBundle(html);
            this._renderCardFBT(html);
            this._renderPriceProduct(html);
            const selectors = ['block-inventory-', 'block-available-quantity-', 'quantity-selector-', 'volume-', 'sku-', 'x-badges-', 'preorder-', 'cart-edt-'];
            for (let selector of selectors) {
              this._renderDestination(html, selector);
            }
            this._renderBuyButtons(html);
            this._setMessagePreOrder(html);
            this._setEstimateDelivery(html);
            
            const mtfSelectors = ['.properties_re_render', '.table_info_details', '.block-text', '.text-icon', '.collapsible-content', '.nutrition-bar-content', '.horizontab', '.featured-icon'];
            for (let selector of mtfSelectors) {
              this._setMetafieldInfo(html, selector);
            }
            this._setPickupPreOrder(html);
            this._setBackInStockAlert(html);
            if (!productBundle) {
              Alpine.store('xUpdateVariantQuanity').render(html, this.handleSectionId);
            }
            this._dispatchUpdateVariant(html);
            this._dispatchVariantSelected(html);
            this._updateOptionValues(html);
            Alpine.store('xPickupAvailable').updatePickUp(sectionId, this.currentVariant.id);
            
        },
        initFirstAvailableVariant(el) {
          this.currentVariant = JSON.parse(el.querySelector(`script[type="application/json"][data-selected-variant]`).textContent);
          if (!productBundle) {
            document.addEventListener('eurus:cart:items-changed', () => {
              this.cachedResults = [];
              Alpine.store('xUpdateVariantQuanity').updateQuantity(sectionId, productUrl, this.currentVariant?.id);
            });
          }
        },
        _handleAvailable(html) {
          const selectedVariant = html.querySelector('.variant-selects [data-selected-variant]')?.innerHTML;
          if (selectedVariant == 'null') {
            this._setUnavailable();
          }
        },
        _updateOptionValues(html) {
          if (!productBundle) {
            const variantSelects = html.querySelector('.variant-selects');
            if (variantSelects) element.innerHTML = variantSelects.innerHTML;
          }
        },
        _getVariantData(inputId) {
          return JSON.parse(this._getVariantDataElement(inputId).textContent);
        },
        _getVariantDataElement(inputId) {
          return element.querySelector(`script[type="application/json"][data-resource="${inputId}"]`);
        },
        _updateURL(url) {
          if (!isProductPage) return;
          window.history.replaceState({}, '', `${url}${this.currentVariant?.id ? `?variant=${this.currentVariant.id}` : ''}`);
        },
        _getSelectedOptionValues() {
          if (this.handleSticky == '') {
            return Array.from(element.querySelectorAll('select option[selected], fieldset input:checked')).map(
              (e) => e.dataset.optionValueId
            );
          } else {
            return Array.from(this.handleSticky.querySelectorAll('select option[selected]')).map(
              (e) => e.dataset.optionValueId
            );
          }
        },
        _renderCardBundle(html) {
          const destination = element.closest(".x-product-bundle-data");
          const card = html.getElementById('card-product-bundle-'+ this.handleSectionId);
          if (card) {
            const source = card.querySelector(".x-product-bundle-data");
            if (source && destination) destination.innerHTML = source.innerHTML;
          }
        },
        _renderCardFBT(html) {
          const destination = element.closest(".card-product-fbt");
          const source = html.querySelector('.card-product-fbt-clone .card-product-fbt');
          
          if (source && destination) destination.innerHTML = source.innerHTML;
        },
        _handleSwapProduct(sectionId, html, updateFullpage) {
          if (updateFullpage) {
            document.querySelector('head title').innerHTML = html.querySelector('head title').innerHTML;
            const destination = document.querySelector('main');
            const source = html.querySelector('main');
            if (source && destination) destination.innerHTML = source.innerHTML;
          } else {
            const destination = document.querySelector('.x-product-' + sectionId);
            const source = html.querySelector('.x-product-' + sectionId);
            if (source && destination) destination.innerHTML = source.innerHTML;
          }
        },
        _handleSwapQuickAdd(html) {
          const destination = element.closest(".choose-options-content");
          const source = html.querySelector('.choose-options-content');
          if (source && destination) destination.innerHTML = source.innerHTML;
        }
      }))
    });
  });

  
  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.store('xPickupAvailable', {
        updatePickUp(id, variantId) {
          const container = document.getElementsByClassName('pick-up-'+ id)[0];
          if (!container) return;
  
          fetch(window.Shopify.routes.root + `variants/${variantId}/?section_id=pickup-availability`)
            .then(response => response.text())
            .then(text => {
              const pickupAvailabilityHTML = new DOMParser()
                .parseFromString(text, 'text/html')
                .querySelector('.shopify-section');  
              container.innerHTML = pickupAvailabilityHTML.innerHTML;
            })
            .catch(e => {
              console.error(e);
            }); 
        }
      });
    });
  });
  
  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.store('xUpdateVariantQuanity', {
        updateQuantity(sectionId, productUrl, currentVariant) {
          const quantity = document.getElementById('x-quantity-' + sectionId);
          if (!quantity) return;
          const url = currentVariant ? `${productUrl}?variant=${currentVariant}&section_id=${sectionId}` :
                        `${productUrl}?section_id=${sectionId}`;
          fetch(url)
            .then((response) => response.text())
            .then((responseText) => {
              let html = new DOMParser().parseFromString(responseText, 'text/html');
              this.render(html, sectionId);
            });
        },
        render(html, sectionId) {
          const destination = document.getElementById('x-quantity-' + sectionId);
          const source = html.getElementById('x-quantity-'+ sectionId);
          if (source && destination) destination.innerHTML = source.innerHTML;
        }
      });
    });
  });
}