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

        this.maxCastDistance = 50.0;
        this.maxSurfaceDistance = 0.01;
        this.maxTouchDistance = 2.0;

        this.cameraPos = new Vec3(0, 20, 30);
        this.cameraFwd = new Vec3(0, -0.55, -1);
        this.cameraRight = new Vec3(1, 0, 0);
        this.cameraUp = this.cameraRight.Cross(this.cameraFwd);
        this.cameraFocalDist = 3.0;

        this.objects = [];
        this.objects.push(new Box(new Vec3(0, 11, 0), new Vec3(3, 1.5, 3), new Vec3(1, 0, 0)));
        this.objects.push(new Sphere(new Vec3(-7, 0, 0), 3.0, new Vec3(0, 1, 0)));
        this.objects.push(new Sphere(new Vec3(6, 0, 1), 3.0, new Vec3(0, 0, 1)));

        this.touchObject = undefined;

        this.csgModes = {Union: 0, Intersect: 1, Difference: 2, Taffy: 3, NumModes: 4};
        this.csgModeNames = ["Union", "Intersect", "Difference", "Taffy"];
        this.csgMode = this.csgModes.Union;

        this.shadingModes = {Colors: 0, NumSteps: 1, NumModes: 2};
        this.shadingModeNames = ["Colors", "X-Ray"];
        this.shadingMode = this.shadingModes.Colors;

        this.movementModes = {Manual: 0, Automatic: 1, NumModes: 2};
        this.movementModeNames = ["Manual", "Automatic"];
        this.movementMode = this.movementModes.Automatic;
    }

    Update(dt)
    {
        if (this.movementMode === this.movementModes.Manual)
        {
            if (input.isTouchActive)
            {
                if (input.isNewTouch)
                {
                    this.touchObject = this.GetObjectAtTouchPos();
                }

                if (this.touchObject !== undefined)
                {
                    this.touchObject.center.x += input.dx * 0.05;
                    this.touchObject.center.y -= input.dy * 0.05;
                }
            }
        }
        else if (this.movementMode === this.movementModes.Automatic)
        {
            // Intersect/Difference work better when objects are all close together
            if (this.csgMode === this.csgModes.Intersect ||
                this.csgMode === this.csgModes.Difference)
            {
                this.objects[0].center.y = Math.sin(Date.now() * 0.005);
                this.objects[1].center.x = Math.sin(Date.now() * 0.002);                
                this.objects[2].center.x = Math.cos(Date.now() * 0.001);
                this.objects[2].center.y = Math.sin(Date.now() * 0.001);
            }
            // Union/Taffy work better when objects move far apart from each other
            else
            {
                this.objects[0].center.y = 3.0 + Math.sin(Date.now() * 0.005)*5.0;
                this.objects[1].center.x = 0.0 + Math.sin(Date.now() * 0.002)*6.0;                
                this.objects[2].center.x = 0.0 + Math.cos(Date.now() * 0.001)*8.0;
                this.objects[2].center.y = 3.0 + Math.sin(Date.now() * 0.001)*6.0;
            }
        }
    }

    GetObjectAtTouchPos()
    {
        let x = (input.x / 800.0) * this.screenWidth;
        let y = (input.y / 600.0) * this.screenHeight;
        let rayDir = this.CalculateScreenPointRay(x, y);
        let rayPos = new Vec3(this.cameraPos.x, this.cameraPos.y, this.cameraPos.z);
        let distance = 0.0;

        // Walk ray until we are within 'maxTouchDistance' of an object's surface
        while (distance < this.maxCastDistance)
        {
            let sceneSDF = Number.MAX_VALUE;
            for (let i = 0; i < this.objects.length; i++)
            {
                let objectDistance = this.objects[i].SDF(rayPos);
                if (objectDistance <= this.maxTouchDistance)
                {
                    return this.objects[i];
                }
                sceneSDF = Math.min(sceneSDF, objectDistance);
            }

            distance += sceneSDF;
            rayPos.AddToSelf(rayDir.Scale(sceneSDF));
        }

        return undefined;
    }

    Render()
    {
        // Cast a ray for each screen pixel
        for (let y = 0; y < this.screenHeight; y++)
        {
            for (let x = 0; x < this.screenWidth; x++)
            {
                let color32Bit = 0xFF000000;
                let r, g, b = 1.0;

                let hitInfo = this.SphereCast(x, y);
                if (hitInfo !== undefined)
                {
                    if (this.shadingMode === this.shadingModes.Colors)
                    {
                        // Assume light source is camera for now + square dot so falloff is more dramatic
                        let lightDot = -hitInfo.normal.Dot(this.cameraFwd);
                        let lightFactor = 0.2 + Math.max(Math.min(lightDot, 1.0), 0.0)*0.8;
                        r = Math.floor(lightFactor * 255.0 * hitInfo.color.x);
                        g = Math.floor(lightFactor * 255.0 * hitInfo.color.y);
                        b = Math.floor(lightFactor * 255.0 * hitInfo.color.z);
                    }
                    else if (this.shadingMode === this.shadingModes.NumSteps)
                    {
                        let numStepsFactor = Math.min(hitInfo.numSteps / 20.0, 1.0);
                        r = Math.floor(numStepsFactor * 0.0);
                        g = Math.floor(numStepsFactor * 255.0);
                        b = Math.floor(numStepsFactor * 96.0);
                    }

                    color32Bit |= r | (g << 8) | (b << 16);
                }

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
        let numSteps = 0;

        // Step ray until we hit something (distance to surface is tiny) or exceed max raycast distance
        while (distance < this.maxCastDistance)
        {
            let sceneInfo = this.SceneInfo(rayPos);
            if (sceneInfo.distance <= this.maxSurfaceDistance)
            {
                let hitInfo =
                {
                    pos: rayPos,
                    normal: this.GetEstimatedNormalAtPoint(rayPos),
                    color: sceneInfo.color,
                    numSteps: numSteps + 1
                };

                return hitInfo;
            }

            rayPos.AddToSelf(rayDir.Scale(sceneInfo.distance));
            distance += sceneInfo.distance;
            numSteps++;
        }

        return undefined;
    }

    CalculateScreenPointRay(x, y)
    {
        // View plane is 'focalDistance' units in front of camera
        // bottom -> top = -1 -> +1
        // left -> right = -aspectRatio > +aspectRatio
        let fwd = this.cameraFwd.Scale(this.cameraFocalDist);
        let right = this.cameraRight.Scale(((x - this.screenHalfWidth) / this.screenHalfWidth) * this.aspectRatio);
        let up = this.cameraUp.Scale((this.screenHalfHeight - y) / this.screenHalfHeight);

        return fwd.Add(right.Add(up)).Normalize();
    }

    SceneInfo(p)
    {
        let distance = this.objects[0].SDF(p);
        let color = this.objects[0].color;

        for (let i = 1; i < this.objects.length; i++)
        {
            let objectDistance = this.objects[i].SDF(p);
            let objectColor = this.objects[i].color;

            // CSG Modes:
            if (this.csgMode === this.csgModes.Union)
            {
                if (objectDistance < distance)
                {
                    distance = objectDistance;
                    color = objectColor;
                }
            }
            else if (this.csgMode === this.csgModes.Intersect)
            {
                if (objectDistance > distance)
                {
                    distance = objectDistance;
                    color = objectColor;
                }
            }
            else if (this.csgMode === this.csgModes.Difference)
            {
                if (-objectDistance > distance)
                {
                    distance = -objectDistance;
                    color = objectColor;
                }
            }
            else if (this.csgMode === this.csgModes.Taffy)
            {
                // From: https://www.iquilezles.org/www/articles/smin/smin.htm
                let absDistance = Math.abs(distance - objectDistance);
                let k = 10.0;
                let h = Math.max(k - absDistance, 0.0) / k;

                if (objectDistance < distance)
                {
                    color = objectColor;
                }
                else
                {
                    color = color.Lerp(objectColor, h);
                }

                distance = Math.min(distance, objectDistance) - h*h*h*k*(1.0/6.0);
            }
        }
        
        return { distance: distance, color: color };
    }

    GetEstimatedNormalAtPoint(p)
    {
        // Estimate hit normal by averaging SDF sample of nearby positions
        let normal = new Vec3(0, 0, 0);
        normal.x = this.SceneInfo(new Vec3(p.x + this.maxSurfaceDistance, p.y, p.z)).distance - 
                   this.SceneInfo(new Vec3(p.x - this.maxSurfaceDistance, p.y, p.z)).distance;
        normal.y = this.SceneInfo(new Vec3(p.x, p.y + this.maxSurfaceDistance, p.z)).distance - 
                   this.SceneInfo(new Vec3(p.x, p.y - this.maxSurfaceDistance, p.z)).distance;
        normal.z = this.SceneInfo(new Vec3(p.x, p.y, p.z + this.maxSurfaceDistance)).distance - 
                   this.SceneInfo(new Vec3(p.x, p.y, p.z - this.maxSurfaceDistance)).distance;
        normal.NormalizeSelf();

        return normal;
    }

    ToggleMovementMode()
    {
        this.movementMode = (this.movementMode + 1) % this.movementModes.NumModes;

        // Reset object positions whenever we set movement mode
        this.objects[0].center = new Vec3(0, 11, 0);
        this.objects[1].center = new Vec3(-7, 0, 0);
        this.objects[2].center = new Vec3(6, 0, 1);
    }

    ToggleShadingMode() { this.shadingMode = (this.shadingMode + 1) % this.shadingModes.NumModes; }
    ToggleCSGMode() { this.csgMode = (this.csgMode + 1) % this.csgModes.NumModes; }

    GetMovementModeName() { return this.movementModeNames[this.movementMode]; }
    GetShadingModeName() { return this.shadingModeNames[this.shadingMode]; }
    GetCSGModeName() { return this.csgModeNames[this.csgMode]; }
}