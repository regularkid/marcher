class Sphere
{
    constructor(center, radius, color)
    {
        this.center = center;
        this.radius = radius;
        this.color = color;
    }

    SDF(p)
    {
        let toSphere = this.center.Sub(p);
        return toSphere.Length() - this.radius;
    }
}