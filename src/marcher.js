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

        this.cameraPos = new Vec3(0, 5, 0);
        this.cameraFwd = new Vec3(0, -0.5, -1);
        this.cameraRight = new Vec3(1, 0, 0);
        this.cameraUp = this.cameraRight.Cross(this.cameraFwd);

        this.objects = [];
        this.objects.push(new Box(new Vec3(0, 0, -10), new Vec3(3, .5, 3)));
        this.objects.push(new Sphere(new Vec3(-7.0, 0, -10), 3.0));
        this.objects.push(new Sphere(new Vec3(0, 1, -10), 3.0));

        this.csgModes =
        {
            Union: 0,
            Intersect: 1,
            Difference: 2,
            Taffy: 3,
        },

        this.csgMode = this.csgModes.Taffy;
    }

    Render()
    {
        if (input.isTouchActive)
        {
            this.objects[0].center.x += input.dx * 0.05
        }

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
                    let lightFactor = 0.2 + Math.max(Math.min(lightDot, 1.0), 0.0)*0.8;
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
        let distance = this.objects[0].SDF(p);

        for (let i = 1; i < this.objects.length; i++)
        {
            distance = this.CSG(distance, this.objects[i].SDF(p));
        }
        
        return distance;
    }

    CSG(distance1, distance2)
    {
        if (this.csgMode === this.csgModes.Union)
        {
            return Math.min(distance1, distance2);
        }
        else if (this.csgMode === this.csgModes.Intersect)
        {
            return Math.max(distance1, distance2);
        }
        else if (this.csgMode === this.csgModes.Difference)
        {
            return Math.max(distance1, -distance2);
        }
        else if (this.csgMode === this.csgModes.Taffy)
        {
            let k = 5.0;
            let h = Math.max(k - Math.abs(distance1 - distance2), 0.0) / k;
            return Math.min(distance1, distance2) - h*h*h*k*(1.0/6.0);
        }

        console.log(`Unsupported CSG mode: ${this.csgMode}`);
    }
}