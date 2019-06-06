class Input
{
    constructor(canvas)
    {
        this.canvas = canvas;
        this.x = 0;
        this.y = 0;
        this.dx = 0;
        this.dy = 0;
        this.isTouchActive = false;
        this.isNewTouch = false;
        this.wheel = 0.0;

        canvas.addEventListener("mousedown", e => { this.isTouchActive = true; this.isNewTouch = true; }, true);
        canvas.addEventListener("mouseup", e => { this.isTouchActive = false }, true);
        canvas.addEventListener("mousemove", e => { this.SetInputPos(e); e.preventDefault(); }, true );
        canvas.addEventListener("wheel", e => { this.wheel = e.deltaY; e.preventDefault(); }, true );
        canvas.addEventListener("touchstart", e => { this.SetInputPos(e.touches[0]); this.isTouchActive = true; this.isNewTouch = true; this.dx = 0; this.dy = 0; e.preventDefault(); }, true );
        canvas.addEventListener("touchend", e => { this.isTouchActive = false; e.preventDefault(); }, true );
        canvas.addEventListener("touchcancel", e => { this.isTouchActive = false; e.preventDefault(); }, true );
        canvas.addEventListener("touchmove", e => { this.SetInputPos(e.touches[0]); e.preventDefault(); }, true );
    }

    SetInputPos(event)
    {
        let xLast = this.x;
        let yLast = this.y;

        this.x = event.pageX - this.canvas.offsetLeft;
        this.y = event.pageY - this.canvas.offsetTop;
        this.dx = this.x - xLast;
        this.dy = this.y - yLast;
    }

    PostUpdate()
    {
        this.isNewTouch = false;
        this.dx = 0;
        this.dy = 0;
        this.wheel = 0.0;
    }
}