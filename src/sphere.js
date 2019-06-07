class Sphere
{
    constructor(center, radius)
    {
        this.center = center;
        this.radius = radius;
    }

    SDF(p)
    {
        let toSphere = this.center.Sub(p);
        return toSphere.Length() - this.radius;
    }
}