class Marcher
{
    constructor(canvas, ctx)
    {
        this.canvas = canvas;
        this.ctx = ctx;
        this.screenWidth = this.canvas.width;
        this.screenHeight = this.canvas.height;
        this.screenHalfWidth = Math.floor(this.screenWidth * 0.5);
        this.screenHalfHeight = Math.floor(this.screenHeight * 0.5);

        this.framebuffer = ctx.getImageData(0, 0, this.screenWidth, this.screenHeight);
        this.framebuffer32Bit = new Uint32Array(this.framebuffer.data.buffer);
    }

    Render()
    {
        for (let y = 0; y < this.screenHeight; y++)
        {
            for (let x = 0; x < this.screenWidth; x++)
            {
                this.framebuffer32Bit[(y * this.screenWidth) + x] = 0xFF0000FF;
            }
        }

        this.ctx.putImageData(this.framebuffer, 0, 0);
    }
}