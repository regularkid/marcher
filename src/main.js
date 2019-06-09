let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d", { alpha: false });
let input = new Input(canvas);
let lastTime = 0;
let marcher = new Marcher(canvas, ctx);

function ToggleMovementMode()
{
    marcher.ToggleMovementMode();
    if (marcher.movementMode === marcher.movementModes.Manual)
    {
        document.getElementById("MoveButton").innerHTML = "Movement: Manual";
    }
    else if (marcher.movementMode === marcher.movementModes.Automatic)
    {
        document.getElementById("MoveButton").innerHTML = "Movement: Automatic";
    }
}

function ToggleShadingMode()
{
    marcher.ToggleShadingMode();
    if (marcher.shadingMode === marcher.shadingModes.Colors)
    {
        document.getElementById("ShadingButton").innerHTML = "Movement: Colors";
    }
    else if (marcher.shadingMode === marcher.shadingModes.NumSteps)
    {
        document.getElementById("ShadingButton").innerHTML = "Movement: X-Ray";
    }
}

function ToggleCSGMode()
{
    marcher.ToggleCSGMode();
    if (marcher.csgMode === marcher.csgModes.Union)
    {
        document.getElementById("CSGButton").innerHTML = "CSG: Union";
    }
    else if (marcher.csgMode === marcher.csgModes.Intersect)
    {
        document.getElementById("CSGButton").innerHTML = "CSG: Intersect";
    }
    else if (marcher.csgMode === marcher.csgModes.Difference)
    {
        document.getElementById("CSGButton").innerHTML = "CSG: Difference";
    }
    else if (marcher.csgMode === marcher.csgModes.Taffy)
    {
        document.getElementById("CSGButton").innerHTML = "CSG: Taffy";
    }
}

function GameLoop(curTime)
{
    let dt = Math.min((curTime - lastTime) / 1000.0, 0.2);	
    lastTime = curTime;

    marcher.Update(dt);
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