"use client";

import ForceGraph3D from "react-force-graph-3d";

const ForceGraph3DInner = ({ graphRef, ...props }: any) => {
    return <ForceGraph3D {...props} ref={graphRef} />;
};

ForceGraph3DInner.displayName = "ForceGraph3DInner";

export default ForceGraph3DInner;
