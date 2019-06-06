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
                let color32Bit = 0xFF000000;

                let hitInfo = this.SphereCast(x, y);
                if (hitInfo !== undefined)
                {
                    // Assume light source is camera for now + square dot so falloff is more dramatic
                    let lightDot = -hitInfo.normal.Dot(this.cameraFwd);
                    let lightFactor = Math.max(Math.min(lightDot*lightDot, 1.0), 0.0);
                    color32Bit |= Math.floor(lightFactor * 255.0);
                }

                // TEMP: Sphere hit = red, no sphere hit = black
                this.framebuffer32Bit[(y * this.screenWidth) + x] = color32Bit;
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
                // Estimate hit normal by averaging SDF sample of nearby positions
                let normal = new Vec3(0, 0, 0);
                normal.x = this.SceneSDF(new Vec3(rayPos.x + maxSurfaceDistance, rayPos.y, rayPos.z)) - 
                           this.SceneSDF(new Vec3(rayPos.x - maxSurfaceDistance, rayPos.y, rayPos.z));
                normal.y = this.SceneSDF(new Vec3(rayPos.x, rayPos.y + maxSurfaceDistance, rayPos.z)) - 
                           this.SceneSDF(new Vec3(rayPos.x, rayPos.y - maxSurfaceDistance, rayPos.z));
                normal.z = this.SceneSDF(new Vec3(rayPos.x, rayPos.y, rayPos.z + maxSurfaceDistance)) - 
                           this.SceneSDF(new Vec3(rayPos.x, rayPos.y, rayPos.z - maxSurfaceDistance));
                normal.NormalizeSelf();

                let hitInfo =
                {
                    pos: rayPos,
                    normal: normal
                };

                return hitInfo;
            }

            distance += sceneSDF;
            rayPos.AddToSelf(rayDir.Scale(sceneSDF));
        }

        return undefined;
    }

    CalculateScreenPointRay(x, y)
    {
        // View plane is 1 unit in front of camera
        // bottom -> top = -1 -> +1
        // left -> right = -aspectRatio > +aspectRatio
        let fwd = this.cameraFwd;
        let right = this.cameraRight.Scale(((x - this.screenHalfWidth) / this.screenHalfWidth) * this.aspectRatio);
        let up = this.cameraUp.Scale((this.screenHalfHeight - y) / this.screenHalfHeight);

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