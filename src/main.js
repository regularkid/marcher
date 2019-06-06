let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d", { alpha: false });
let input = new Input(canvas);
let lastTime = 0;
let marcher = new Marcher(canvas, ctx);

function GameLoop(curTime)
{
    let dt = Math.min((curTime - lastTime) / 1000.0, 0.2);	
    lastTime = curTime;

    marcher.Render();

    // TEMP!
    ctx.font = `Bold 16px Arial`;	
    ctx.fillStyle = "#FFF";	
    let fps = 1.0 / dt;
    ctx.fillText(`${Math.floor(fps)}`, 10, 20);

    input.PostUpdate();
    window.requestAnimationFrame(GameLoop);
}

window.requestAnimationFrame(GameLoop);