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
        this.aspectRatio = this.screenWidth / this.screenHeight;

        this.framebuffer = ctx.getImageData(0, 0, this.screenWidth, this.screenHeight);
        this.framebuffer32Bit = new Uint32Array(this.framebuffer.data.buffer);

        this.cameraPos = new Vec3(0, 0, 0);
        this.cameraFwd = new Vec3(0, 0, -1);
        this.cameraRight = new Vec3(1, 0, 0);
        this.cameraUp = new Vec3(0, 1, 0);
    }

    Render()
    {
        // Cast a ray for each screen pixel
        for (let y = 0; y < this.screenHeight; y++)
        {
            for (let x = 0; x < this.screenWidth; x++)
            {
                // TEMP: Sphere hit = red, no sphere hit = black
                this.framebuffer32Bit[(y * this.screenWidth) + x] = this.SphereCast(x, y) ? 0xFF0000FF : 0xFF000000;
            }
        }

        this.ctx.putImageData(this.framebuffer, 0, 0);
    }

    SphereCast(x, y)
    {
        let rayDir = this.CalculateScreenPointRay(x, y);
        let rayPos = new Vec3(this.cameraPos.x, this.cameraPos.y, this.cameraPos.z);
        let distance = 0.0;
        let maxDistance = 30.0;
        let maxSurfaceDistance = 0.001;

        // Step ray until we hit sphere (distance to surface is tiny) or exceed max raycast distance
        while (distance < maxDistance)
        {
            let sceneSDF = this.SceneSDF(rayPos);
            if (sceneSDF <= maxSurfaceDistance)
            {
                return true;
            }

            distance += sceneSDF;
            rayPos.AddToSelf(rayDir.Scale(sceneSDF));
        }

        return false;
    }

    CalculateScreenPointRay(x, y)
    {
        // View plane is 1 unit in front of camera, bottom -> top = -1 -> +1, left -> right = -aspectRatio > +aspectRatio
        let fwd = this.cameraFwd;
        let right = this.cameraRight.Scale(((x - this.screenHalfWidth) / this.screenHalfWidth) * this.aspectRatio);
        let up = this.cameraUp.Scale((y - this.screenHalfHeight) / this.screenHalfHeight);

        return fwd.Add(right.Add(up)).Normalize();
    }

    SceneSDF(p)
    {
        // TEMP: Just position a sphere in front of the camera for now.
        // TODO: Iterate all scene objects and combine SDF values (min, max, blend, cutout)
        let sphereCenter = new Vec3(0, 0, -10);
        let sphereRadius = 3.0;

        let toSphere = sphereCenter.Sub(p);
        return toSphere.Length() - sphereRadius;
    }
}