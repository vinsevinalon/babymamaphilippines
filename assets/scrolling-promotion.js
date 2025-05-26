if (!window.Eurus.loadedScript.includes('scrolling-promotion.js')) {
  window.Eurus.loadedScript.push('scrolling-promotion.js');
  
  requestAnimationFrame(() => {
    document.addEventListener('alpine:init', () => {
      Alpine.store('xScrollPromotion', {
        animationFrameId: null,
        window_height: window.innerHeight,

        load(el) {
          let scroll = el.getElementsByClassName('el_animate');
          for (let i = 0; i < scroll.length; i++) {
            scroll[i].classList.add('animate-scroll-banner');
          }
        },

        updateRotation(el, rtlCheck = false) {
          const element = el.firstElementChild;
          const element_rect = element.getBoundingClientRect();
          const element_height = element_rect.top + (element_rect.bottom - element_rect.top)/2;
          let value;
            
          if (element_height > -200 && element_height < this.window_height + 200) {
            if (rtlCheck) {
              value = Math.max(Math.min((((element_height / this.window_height) * 10) - 5), 5), -5) * -1;
            } else {
              value = Math.max(Math.min((((element_height / this.window_height) * 10) - 5), 5), -5);
            }          
            element.style.transform = `rotate(${value}deg) translateX(-20px)`;
          }

          this.animationFrameId = window.requestAnimationFrame(() => this.updateRotation(el, rtlCheck));
        },
      });
    })
  });
}    