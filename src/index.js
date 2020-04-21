/**
 * Build styles
 */
require('./index.css').toString();

const GIF = require("gif.js");

// require("gif.js/dist/gif.worker");


/**
 * Imgs2Gif Tool for the Editor.js 2.0
 */
class Imgs2gif {

    static get toolbox() {
        return {
            title: '创建GIF图',
            icon: require('./../assets/icon.svg').default,
        };
    }

    constructor({ data, api, config }) {

        this.data = data;
        this.api = api;

        this.config = config || {};
        this.config.workerURL = this.config.workerURL || 'gif.worker.js';
        this.config.output = this.config.output || null;

        this.index = this.api.blocks.getCurrentBlockIndex() + 1;

        this.wrapper = {
            block: document.createElement('div'),
            renderSettings: document.createElement('div')
        };
        this.settings = [{
            name: '生成GIF',
            icon: require('./../assets/create.svg').default
        }];

        /**
         * Styles
         */
        this.CSS = {
            baseClass: this.api.styles.block,
            loading: this.api.styles.loader,
            input: this.api.styles.input,
            button: this.api.styles.button,
            settingsButton: this.api.styles.settingsButton,
            settingsButtonActive: this.api.styles.settingsButtonActive,

            /**
             * Tool's classes
             */
            wrapperBlock: 'imgs-to-gif',
            blockTag: 'tag',
            imagesContainer: "images",
            gifResult: "gif-result",
            caption: "imgs-to-gif-caption",
            disabledBtn: "imgs-to-gif-disabled-btn"
        };

    }



    render() {
        // console.log(this.data)
        this.wrapper.block = document.createElement('div');
        this.wrapper.block.setAttribute("data-title", "合成GIF");
        this.wrapper.block.classList.add(this.CSS.wrapperBlock);
        this.wrapper.block.classList.add(this.CSS.blockTag);

        const input = this._createInput();
        const createBtn = this._createBtn();

        const addBtn = document.createElement("button");

        const imgsDiv = document.createElement("div");
        imgsDiv.classList.add(this.CSS.imagesContainer);

        this.wrapper.block.appendChild(addBtn);
        this.wrapper.block.appendChild(createBtn);
        this.wrapper.block.appendChild(input);
        this.wrapper.block.appendChild(imgsDiv);

        addBtn.classList.add(this.CSS.button);
        addBtn.innerText = `从本地添加`;
        addBtn.addEventListener("click", (e) => {
            e.preventDefault();
            input.click();
        });


        if (this.data && this.data.images && this.data.images.length > 0) {
            Array.from(this.data.images, img => this._createImage(img));
            return this.wrapper.block;
        } else {
            addBtn.click();
        }

        return this.wrapper.block;
    }

    _createInput() {
        let input = document.createElement('input');

        input.setAttribute("type", "file");
        input.setAttribute("accept", 'image/*');
        input.setAttribute("multiple", true);

        input.addEventListener("change", (e) => {
            e.preventDefault();
            if (e.target.files.length > 0) {
                // console.log(e.target.files)
                for (let index = 0; index < e.target.files.length; index++) {
                    const file = e.target.files[index];
                    if (file.type.match(/image\//) && !file.type.match(/\/gif/)) {
                        let url = URL.createObjectURL(file);
                        this._createImage(url);
                    };
                };
            }
        });
        return input;
    }

    _createBtn() {
        let button = document.createElement('button');
        button.classList.add(this.CSS.button);
        button.innerText = "合成";
        if (this.data.images.length > 1) {
            this.api.listeners.on(button, 'click', (e) => {
                e.preventDefault();
                this.wrapper.block.classList.remove(this.CSS.blockTag);
                let imgs = this.wrapper.block.querySelectorAll("img");
                this._createGifFromImages(imgs);
            });
        };
        return button
    }

    renderSettings() {
        // console.log(this.renderSettings)
        this.wrapper.renderSettings = document.createElement('div');

        // let imgs = this.wrapper.block.querySelectorAll("img");
        // // console.log(imgs)
        // if (imgs.length > 1) {
        //     this.settings.forEach(tune => {
        //         let button = document.createElement('div');
        //         button.classList.add(this.api.styles.settingsButton);
        //         // button.classList.add(this.api.styles.disabledBtn);

        //         button.innerHTML = tune.icon;
        //         this.wrapper.renderSettings.appendChild(button);

        //         this.api.listeners.on(button, 'click', (e) => {
        //             // this._toggleTune(tune.name);
        //             e.preventDefault();
        //             this.wrapper.block.classList.remove(this.CSS.blockTag);
        //             let imgs = this.wrapper.block.querySelectorAll("img");
        //             this._createGifFromImages(imgs);
        //             button.classList.toggle(this.api.styles.settingsButtonActive);

        //         });

        //     });
        // };

        return this.wrapper.renderSettings;
    }

    /**
     * Automatic sanitize config
     */
    // static get sanitize(){
    //   return {
    //     url: false, // disallow HTML
    //     caption: {} // only tags from Inline Toolbar 
    //   }
    // }

    save(blockContent) {

        let data = {};
        // console.log(this.data)
        if (!this.data.base64) {
            let imgs = blockContent.querySelectorAll("." + this.CSS.imagesContainer + " img");
            let images = Array.from(imgs, img => {
                return img.getAttribute("data-base64");
            });
            data = {
                images: images,
            }
        } else {
            data = {
                url: this.data.base64,
            }
        }

        return data
    }

    validate(savedData) {
        if (!(savedData.images || savedData.url)) {
            return false;
        }

        return true;
    }



    _createCaption(captionText) {
        const caption = document.createElement('div');
        caption.classList.add(this.CSS.input);
        caption.classList.add(this.CSS.caption);
        caption.contentEditable = true;
        caption.setAttribute("data-placeholder", "文字说明");
        caption.innerHTML = captionText || '';
        // caption.addEventListener("input", (e) => {
        //   e.preventDefault();
        //   if (e.target.innerText.trim() == "") {
        //     e.target.innerHTML = '<span style="opacity:0.5">文字说明</span>';
        //   };
        //   // console.log(e.target.innerText, e.target.innerText.trim() == "");
        // });
        this.wrapper.block.querySelector("." + this.CSS.gifResult).appendChild(caption);
    }

    _createImage(url) {
        let img = new Image();
        img.onload = () => {
            let base64 = url;
            let width = img.naturalWidth,
                height = img.naturalHeight;

            if (!url.match(/data\:image\/.*\;base64\,/ig)) {
                let canvas = document.createElement("canvas");
                canvas.width = width;
                canvas.height = height;
                let ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, width, height);
                img.remove();
                base64 = canvas.toDataURL();
            } else {
                url = URL.createObjectURL(this._dataURLtoBlob(url));
            };

            let div = document.createElement("div");
            div.innerHTML = `<img data-base64="${base64}" src="${url}" width="${width}" height="${height}" alt="gif">`;
            this.wrapper.block.querySelector("." + this.CSS.imagesContainer).appendChild(div);
            div.addEventListener("click", (e) => {
                e.preventDefault();
                div.remove();
            });

        };
        img.src = url;

    }

    _blobToDataURL(blob, callback) {
        let a = new FileReader();
        a.onload = (e) => {
            callback(e.target.result);
        };
        a.readAsDataURL(blob);
    }

    _dataURLtoBlob(dataurl) {
        var arr = dataurl.split(','),
            mime = arr[0].match(/:(.*?);/)[1],
            bstr = atob(arr[1]),
            n = bstr.length,
            u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }

    /**
     * @todo 优化宽度、高度的计算方式
     */
    _createGifFromImages(imgs) {

        // console.log(imgs)
        let width = imgs[0].naturalWidth,
            height = imgs[0].naturalHeight;

        let gif = new GIF({
            workers: 2,
            quality: 10,
            width: width,
            height: height,
            workerScript: this.config.workerURL
        });

        for (let index = 0; index < imgs.length; index++) {
            const img = imgs[index];
            gif.addFrame(img);
            width = img.naturalWidth;
            height = img.naturalHeight;
        };

        gif.on('finished', (blob) => {
            // let url = URL.createObjectURL(blob);
            // window.open(URL.createObjectURL(blob));
            //console.log(this.wrapper,url)

            this._blobToDataURL(blob, (base64) => {
                this.data = Object.assign(this.data, {
                    url: URL.createObjectURL(blob),
                    base64: base64,
                    caption: "",
                    width: width,
                    height: height
                });

                this._createGif(base64);
            });

        });

        this.wrapper.block.innerHTML = `<div style="height:200px"></div>`;
        this.wrapper.block.classList.toggle(this.api.styles.loader);

        gif.render();
    }

    _createGif(base64) {
        // this.wrapper.renderSettings.innerHTML = "";
        // this.renderSettings=()=>{
        //   return this.wrapper.renderSettings;
        // };
        // this.wrapper.block.innerHTML ="";
        // this.wrapper.block.insertAdjacentHTML("beforeend", `<div class="${this.CSS.gifResult}"><img  data-src="${base64}" data-width="${width}" data-height="${height}" alt="gif" uk-img></div>`);
        // this._createCaption(caption);
        // this.wrapper.block.classList.toggle(this.api.styles.loader);

        if (this.config.output != null) {
            this.api.blocks.delete(this.index);

            this.api.blocks.insert(this.config.output, {
                url: base64
            });

        } else {
            this.renderSettings = () => {
                return this.wrapper.renderSettings;
            };
            this.wrapper.block.innerHTML = "";
            this.wrapper.block.insertAdjacentHTML("beforeend", `<div class="${this.CSS.gifResult}"><img  data-src="${this.data.url}" data-width="${this.data.width}" data-height="${this.data.height}" alt="gif" uk-img></div>`);
            this.wrapper.block.classList.toggle(this.CSS.loading);
        };




    }

}

module.exports = Imgs2gif;