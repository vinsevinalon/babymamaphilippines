if (!window.Eurus.loadedScript.includes('highlight-text-with-image.js')) {
    window.Eurus.loadedScript.push('highlight-text-with-image.js');
    
    requestAnimationFrame(() => {
      document.addEventListener('alpine:init', () => {
        Alpine.data('xHighlightAnimation', () => ({
          initElements: null,
          animationFrameId: null,
          window_height: window.innerHeight,

          load(el, rtl_check, equalLines, fullScreen = false, range) {
            this.initElements = this.separateWords(el);
            this.partitionIntoLines(el, rtl_check, equalLines, fullScreen, range);

            let lastWidth = window.innerWidth;
            window.addEventListener("resize", this.debounce(() => {
              if (window.innerWidth !== lastWidth) {
                lastWidth = window.innerWidth;
                this.partitionIntoLines(el, rtl_check, equalLines, fullScreen, range);
              }
            }));
          },

          debounce(func, timeout = 300){
            let timer;
            return (...args) => {
              clearTimeout(timer);
              timer = setTimeout(() => { func.apply(this, args); }, timeout);
            };
          },

          separateWords(container) {
            let elements = [];
          
            container.childNodes.forEach(node => {
              if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') {
                let words = node.textContent.match(/(\s+|[^\s-]+|[-])/g);
                words.forEach(word => {
                  if (word) {
                    let span = document.createElement("span");
                    span.textContent = word;
                    elements.push(span);  
                  }
                });
              } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName === "SPAN") {
                  elements.push(...extractWordsAndImages(node));
                } else {
                  elements.push(node);
                }
              }
            });

            return elements;
          },          

          partitionIntoLines(container, rtl_check, equalLines, fullScreen = false, range) {
            container.innerHTML = "";
            this.initElements.forEach(el => container.appendChild(el));
            let maxHeight = 0;
          
            requestAnimationFrame(() => {
              let lines = [];
              let currentLine = [];
              let prevMid = null;
          
              this.initElements.forEach((el) => {
                let rect = el.getBoundingClientRect();
                if (rect.width === 0) return;

                if (maxHeight < rect.height) {
                  maxHeight = rect.height;
                }
                let midpoint = rect.bottom + (rect.top - rect.bottom) / 2;
    
                if (prevMid !== null && Math.abs(midpoint - prevMid) > 10) {
                  lines.push(currentLine);
                  currentLine = [];
                } 
                currentLine.push(el);
                prevMid = midpoint;
              });
  
              if (currentLine.length) {
                lines.push(currentLine);
              }

              let newInnerHTML = lines.map((lineElements) => {
                let div = document.createElement("div");
                if (equalLines) {
                  div.className = "text-highlight relative inline-block text-transparent";
                  div.style.height = `${maxHeight + 8}px`;
                  div.style.lineHeight = `${maxHeight}px`;  
                } else {
                  div.className = "text-highlight relative inline-block text-transparent mb-0.5";
                }
                lineElements.forEach(el => div.appendChild(el.cloneNode(true)));
                return div.outerHTML;
              }).join("");
            
              container.innerHTML = newInnerHTML;  
              container.setAttribute("x-intersect.once.margin.300px", "startAnim($el, " + rtl_check + ", " + fullScreen + ", " + range + ")");
            });
          },

          startAnim(el, rtl_check, fullScreen, range) {
            if (fullScreen) {
              let offsetStart = el.offsetParent.parentElement.getBoundingClientRect().top + window.scrollY;

              let starts = [];
              let ends = [];
              const offsets = { 3000: -200, 2000: 200 };
              let offset = offsets[range] ?? 600;
              
              el.childNodes.forEach((element, index) => {
                if (index != 0) {
                  starts.push(ends[index - 1]);
                  ends.push(starts[index] + range);
                } else {
                  starts.push(offsetStart);
                  ends.push(offsetStart + range)
                }
              });
              el.offsetParent.parentElement.style.height = `calc(${ends[ends.length - 1] - starts[0] + range / 2 + offset}px)`

              this.updateHighlightFullscreen(el, rtl_check, starts, ends);
            } else {
              let starts = [0.7];
              let ends = [0.5];
              
              el.childNodes.forEach((element, index) => {
                if (index != el.childNodes.length - 1) {
                  const element_rect = element.getBoundingClientRect();
                  const element_height = Math.abs(element_rect.bottom - element_rect.top) / this.window_height;
                  let start = ends[index] + element_height;
                  starts.push(start);
                  ends.push(Math.max(start - 0.2, 0.2));
                }
              });
  
              this.updateHighlight(el, rtl_check, starts, ends);  
            }
          },
          
          updateHighlight(el, rtl_check = false, starts, ends) {
            el.childNodes.forEach((element, index) => {
              const element_rect = element.getBoundingClientRect();
              const ratio = Math.max(Math.min((element_rect.top / this.window_height), 1), 0);
              
              let value;
                
              if (ratio > starts[index]) {
                value = 0;
              } else if (ratio < ends[index]) {
                value = 100;
              } else {
                value = ((ratio - starts[index]) / (ends[index] - starts[index])) * 100;
              }
  
              if (rtl_check) {
                element.style.backgroundPositionX = `${value}%`;
              } else {
                element.style.backgroundPositionX = `-${value}%`;
              }
            });
            
            this.animationFrameId = window.requestAnimationFrame(() => this.updateHighlight(el, rtl_check, starts, ends));
          },

          updateHighlightFullscreen(el, rtl_check = false, starts, ends) {
            el.childNodes.forEach((element, index) => {
              let value;

              if (window.scrollY < starts[index]) {
                value = 0;
              } else if (window.scrollY > ends[index]) {
                value = 100;
              } else {
                value = 100 * (window.scrollY - starts[index]) / (ends[index] - starts[index]);
              }

              if (rtl_check) {
                element.style.backgroundPositionX = `${value}%`;
              } else {
                element.style.backgroundPositionX = `-${value}%`;
              }
            });

            this.animationFrameId = window.requestAnimationFrame(() => this.updateHighlightFullscreen(el, rtl_check, starts, ends));
          }
        }));
      })
    });
  }