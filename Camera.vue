<template>
  <div class="cam">
        <span v-for="preset in presets" :key="preset.preset" class="button" @click="loadPreset(preset)">{{preset.name}}</span>
        <div class="image">
            <canvas ref="canvas" width="400" height="225">
                Image not supported
            </canvas>
        </div>
  </div>
</template>

<script>

import io from 'socket.io-client';

export default {
    data() {
        return {
            presets: [],
            isLoading: true,
            isError: false,
            connection: null,
            cam: null
        };
    },
    mounted() {
        this.cam = this.$route.params.cam;
        this.connect();
    },
    destroyed() {
        this.disconnect();
    },
    beforeRouteUpdate (to, from, next) {
        this.cam = to.params.cam;
        this.load();
        this.watch();
        next();
    },
    methods: {
        loadPreset: async function(preset) {
            // let res = await fetch(`/api/${this.$route.params.cam}/preset/${preset.preset}`);
            this.connection.emit(this.cam, {cmd:'preset', preset: preset.preset});
        },
        load : async function() {
            try {
                this.isError = false;
                this.isLoading = true;
                // let res = await fetch(`/api/${this.cam}/presets`)
                // this.presets = await res.json();
                this.connection.emit(this.cam, {cmd:'presets'}, presets => {
                    console.log('Presets', presets);
                    this.presets = presets;
                });
            } catch (e) {
                console.log(e);
                this.isError = true;
            } finally {
                this.isLoading = false;
            }
        },
        disconnect: function() {
            if (this.connection) {
                this.connection.emit(this.cam, {cmd:'disconnect'});
                this.connection.close();
            }
        },
        connect: function() {
            this.connection = io();
            this.connection.on('connect', () => {
                this.load();
                this.watch();
            })
            this.connection.on('frame', image => {
                // console.log(msg);
                let ctx = this.$refs.canvas.getContext('2d');
                var img = new Image();
                img.onload = () => {
                    // img.width = 220;
                    // img.height = 200;
                    console.log(img.width, img.height);
                    let aspect = img.width / img.height;
                    let tWidth = this.$refs.canvas.width;
                    let tHeight = this.$refs.canvas.height;
                    let tx = 0;
                    let ty = 0;
                    if (aspect > 1) {
                        tHeight = tWidth / aspect;
                    } else {
                        tWidth = tHeight * aspect;
                    }
                    tx = (this.$refs.canvas.width - tWidth) / 2;
                    ty = (this.$refs.canvas.height - tHeight) / 2;
                    console.log(aspect, tx, ty, tWidth, tHeight);
                    ctx.drawImage(img, 0, 0, img.width, img.height, tx, ty, tWidth, tHeight);
                };
                img.src = 'data:image/jpg;base64,' + image;
                console.log("Image received");
            })
        },
        watch: function() {
            this.connection.emit(this.cam, {cmd:'connect'});
        }
    },

}
</script>

<style lang="scss" scoped>
    .cam {
        padding: 20px;
        background: #223;
    }
    .button {
        margin-right: 5px;
        padding: 10px;
        border-radius: 5px;
        background: #445;
        user-select: none;
        cursor: pointer;
        color: #bbb;
        display: inline-block;
    }
    .image {
        padding: 20px;
    }
</style>