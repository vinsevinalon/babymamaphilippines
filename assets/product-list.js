if (!window.Eurus.loadedScript.includes('product-list.js')) {
  window.Eurus.loadedScript.push('product-list.js');

  requestAnimationFrame(() => {
    document.addEventListener("alpine:init", () => {
      Alpine.data('xVideoProductList', () => ({
        errorMessage: false,
        loading: false,
        handleAddToCart(el, sectionId, name_edt) {
          let items = [];
          el.closest(`.add-all-container-${sectionId}`).querySelectorAll(".splide__slide:not(.splide__slide--clone) .product-form").forEach((element) => {
            let edtElement = element.querySelector('.hidden.cart-edt-properties');
            let shippingMessage = '';
            if(edtElement){
              shippingMessage = edtElement.value.replace("time_to_cut_off", Alpine.store('xEstimateDelivery').noti);
            }

            let preorderMessage = '';
            let preorderElement = element.querySelector('.hidden.preorder-edt-properties');
            if(preorderElement){
              preorderMessage = preorderElement.value;
            }

            let properties = {
              ...(name_edt && shippingMessage && { [name_edt]: shippingMessage }),
              ...(preorderMessage && { Preorder: preorderMessage }),
            };

            let productId = element.querySelector('.product-id').value;
            items.push(
              {
                'id': productId,
                'quantity': 1,
                "properties": properties
              }
            );
          })
          
          this.loading = true;
          fetch(window.Shopify.routes.root + 'cart/add.js', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body:  JSON.stringify({ "items": items, "sections":  Alpine.store('xCartHelper').getSectionsToRender().map((section) => section.id) })
          }).then((response) => {
            return response.json();
          }).then((response) => {
            if (response.status == '422') {
              const error_message = el.closest(`.add-all-container-${sectionId}`).querySelector('.cart-warning');

              this.errorMessage = true;
              if (error_message) {
                error_message.textContent = response.description;
              }
              this.loading = false;
              return;
            } else {
              this.errorMessage = false;
              this.loading = false;
              Alpine.store('xCartHelper').getSectionsToRender().forEach((section => {
                const sectionElement = document.querySelector(section.selector);
  
                if (sectionElement) {
                  if (response.sections[section.id])
                    sectionElement.innerHTML = getSectionInnerHTML(response.sections[section.id], section.selector);
                }
              }));
              if (Alpine.store('xQuickView') && Alpine.store('xQuickView').show) {
                Alpine.store('xQuickView').show = false;
              }
              Alpine.store('xPopup').close();
              if (Alpine.store('xCartNoti') && Alpine.store('xCartNoti').enable) {
                Alpine.store('xCartNoti').setItem(response); 
              } else {
                Alpine.store('xMiniCart').openCart();
                document.dispatchEvent(new CustomEvent("eurus:cart:redirect"));
              }
              Alpine.store('xCartHelper').currentItemCount = parseInt(document.querySelector('#cart-icon-bubble span').innerHTML);
              document.dispatchEvent(new CustomEvent("eurus:cart:items-changed"));
            }
          })
        }
      }));
    });
  });
}