class Box
{
    constructor(center, size, color)
    {
        this.center = center;
        this.size = size;
        this.color = color;
    }

    SDF(p)
    {
        let toPointABS = new Vec3((Math.abs(p.x - this.center.x)) - this.size.x,
                                  (Math.abs(p.y - this.center.y)) - this.size.y,
                                  (Math.abs(p.z - this.center.z)) - this.size.z);

        let distance = Math.min(Math.max(Math.max(toPointABS.x, toPointABS.y), toPointABS.z), 0.0);

        toPointABS.x = Math.max(toPointABS.x, 0.0);
        toPointABS.y = Math.max(toPointABS.y, 0.0);
        toPointABS.z = Math.max(toPointABS.z, 0.0);
        distance += toPointABS.Length();
        
        return distance;

        // vec3 d = abs(p) - b;
        // return length(max(d,0.0))
        // + min(max(d.x,max(d.y,d.z)),0.0); // remove this line for an only partially signed sdf
    }
}